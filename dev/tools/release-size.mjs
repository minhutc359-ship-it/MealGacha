import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs"
import { gzipSync } from "node:zlib"
import { fileURLToPath } from "node:url"
import path from "node:path"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."), dist = path.resolve(root, process.argv[2] || "dist")
const files = []
function walk(dir) { for (const name of readdirSync(dir)) { const file = path.join(dir, name); if (statSync(file).isDirectory()) walk(file); else files.push({ path: path.relative(dist, file).split(path.sep).join("/"), bytes: statSync(file).size }) } }
walk(dist)
const byType = {}, groups = {}
for (const file of files) {
  const type = path.extname(file.path).slice(1) || "other"
  byType[type] ??= { files: 0, bytes: 0 }; byType[type].files++; byType[type].bytes += file.bytes
  const group = file.path.startsWith("assets/rpg/") ? "Spirit RPG art/audio/video" : file.path.startsWith("assets/loading/v560/") ? "Adventure presentation art" : file.path.startsWith("assets/food/") ? "Food art" : file.path.startsWith("assets/characters/") ? "Shared character atlases" : file.path.startsWith("assets/autochess/") ? "Auto chess art/audio" : file.path.startsWith("assets/tcg/") ? "TCG art/audio" : file.path.startsWith("assets/events/") ? "Event art" : file.path.startsWith("assets/brand/") ? "Brand" : /\.(js|css)$/.test(file.path) ? "Application JS/CSS" : "Other and legal"
  groups[group] = (groups[group] ?? 0) + file.bytes
}
const compressed = type => files.filter(f => f.path.endsWith(`.${type}`)).reduce((total, f) => total + gzipSync(readFileSync(path.join(dist, f.path)), { level: 9 }).length, 0)
const leaks = files.filter(f => /(^dev\/|\/archive\/|__qa__|\.map$|(?:^|\/)result_spin\.mp3|assets\/audio\/|assets\/banners\/)/.test(f.path))
if (leaks.length) throw Error(`Non-product files in dist: ${JSON.stringify(leaks)}`)
const result = { staticBudgetBytes: 260_000_000, jsGzipBudgetBytes: 675_000, version: JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version, bytes: files.reduce((n, f) => n + f.bytes, 0), files: files.length, byType, groups, js_gzip: compressed("js"), css_gzip: compressed("css"), largest: [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 12), leaks }
// Each update also keeps its explicitly approved total build delta.
if (["4.4.1","4.5.0","4.6.0","4.7.0","4.8.0","4.9.0","5.0.0","5.1.0","5.2.0","5.3.0","5.6.0","5.8.0"].includes(result.version)) {
  const visualBudget = JSON.parse(readFileSync(path.join(root, `dev/docs/${{"4.4.1":"web-v441","4.5.0":"web-v450","4.6.0":"web-v460","4.7.0":"web-v470","4.8.0":"web-v480","4.9.0":"web-v490","5.0.0":"web-v500","5.1.0":"web-v510","5.2.0":"web-v520","5.3.0":"web-v530","5.6.0":"web-v560","5.8.0":"web-v580"}[result.version]}/visual-budget.json`), "utf8"))
  result.visualUpdate = { ...visualBudget, addedBytes: result.bytes - visualBudget.baselineBytes, remainingBytes: visualBudget.baselineBytes + visualBudget.additionalBudgetBytes - result.bytes }
  if (result.visualUpdate.remainingBytes < 0) throw Error(`Web ${result.version} exceeds the approved additional ${visualBudget.additionalBudgetBytes / 1_000_000} MB budget.`)
}
if (result.bytes > 245_000_000) console.warn("Static assets exceed 245 MB: review loading, memory and media quality before release.")
if (result.bytes > result.staticBudgetBytes) throw Error(`Static build exceeds the project's approved ${result.staticBudgetBytes / 1_000_000} MB web budget; inspect assets before raising the budget.`)
// 2026-10-15 review: four new story regions and independent combat difficulties add ~21 KB gzip to the 650 KB baseline.
if (result.js_gzip > result.jsGzipBudgetBytes) throw Error(`Sum of JS gzip exceeds the approved ${result.jsGzipBudgetBytes} byte budget; inspect code splitting.`)
const out = path.join(root, "dev/docs/release/build-size.json"); mkdirSync(path.dirname(out), { recursive: true }); writeFileSync(out, JSON.stringify(result, null, 2) + "\n")
console.log(JSON.stringify({ bytes: result.bytes, files: result.files, js_gzip: result.js_gzip, css_gzip: result.css_gzip, leaks: result.leaks.length }))
