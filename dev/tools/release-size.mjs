import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs"
import { gzipSync } from "node:zlib"
import { fileURLToPath } from "node:url"
import path from "node:path"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."), dist = path.join(root, "dist")
const files = []
function walk(dir) { for (const name of readdirSync(dir)) { const file = path.join(dir, name); if (statSync(file).isDirectory()) walk(file); else files.push({ path: path.relative(dist, file).split(path.sep).join("/"), bytes: statSync(file).size }) } }
walk(dist)
const byType = {}, groups = {}
for (const file of files) {
  const type = path.extname(file.path).slice(1) || "other"
  byType[type] ??= { files: 0, bytes: 0 }; byType[type].files++; byType[type].bytes += file.bytes
  const group = file.path.startsWith("assets/food/") ? "Food art" : file.path.startsWith("assets/characters/") ? "Shared character atlases" : file.path.startsWith("assets/autochess/") ? "Auto chess art/audio" : file.path.startsWith("assets/tcg/") ? "TCG art/audio" : file.path.startsWith("assets/events/") ? "Event art" : file.path.startsWith("assets/brand/") ? "Brand" : /\.(js|css)$/.test(file.path) ? "Application JS/CSS" : "Other and legal"
  groups[group] = (groups[group] ?? 0) + file.bytes
}
const compressed = type => files.filter(f => f.path.endsWith(`.${type}`)).reduce((total, f) => total + gzipSync(readFileSync(path.join(dist, f.path)), { level: 9 }).length, 0)
const leaks = files.filter(f => /(^dev\/|\/archive\/|__qa__|\.map$|(?:^|\/)result_spin\.mp3|assets\/audio\/|assets\/banners\/)/.test(f.path))
if (leaks.length) throw Error(`Non-product files in dist: ${JSON.stringify(leaks)}`)
const result = { version: JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version, bytes: files.reduce((n, f) => n + f.bytes, 0), files: files.length, byType, groups, js_gzip: compressed("js"), css_gzip: compressed("css"), largest: [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 12), leaks }
if (result.bytes > 45_000_000) throw Error("Static build exceeds the project's initial 45 MB review budget; inspect assets before raising the budget.")
if (result.js_gzip > 650_000) throw Error("Sum of JS gzip exceeds the project's 650 KB review budget; inspect code splitting.")
const out = path.join(root, "dev/docs/release/build-size.json"); mkdirSync(path.dirname(out), { recursive: true }); writeFileSync(out, JSON.stringify(result, null, 2) + "\n")
console.log(JSON.stringify({ bytes: result.bytes, files: result.files, js_gzip: result.js_gzip, css_gzip: result.css_gzip, leaks: result.leaks.length }))
