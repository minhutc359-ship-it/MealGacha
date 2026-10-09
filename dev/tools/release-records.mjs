import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, realpathSync } from "node:fs"
import { createRequire } from "node:module"
import { createHash } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { transpileModule, ModuleKind } from "typescript"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const json = file => JSON.parse(readFileSync(file, "utf8"))
const checking = process.argv.includes("--check")
const write = (file, text) => {
  if (checking) {
    if (!existsSync(file) || readFileSync(file, "utf8") !== text) throw Error(`Stale release record: ${path.relative(root, file)}. Run pnpm release:records.`)
  } else { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, text) }
}
const pkg = json(path.join(root, "package.json"))
write(path.join(root, "public/legal/APP_LICENSE.txt"), readFileSync(path.join(root, "LICENSE"), "utf8"))
const seen = new Map()
function packageRoot(name, parent) {
  const require = createRequire(path.join(parent, "package.json"))
  try { return path.dirname(require.resolve(`${name}/package.json`)) } catch {
    let dir = path.dirname(require.resolve(name))
    while (dir !== path.dirname(dir)) {
      const file = path.join(dir, "package.json")
      if (existsSync(file) && json(file).name === name) return dir
      dir = path.dirname(dir)
    }
    throw Error(`Cannot locate package ${name}`)
  }
}
function visit(name, parent) {
  const dir = realpathSync(packageRoot(name, parent)), meta = json(path.join(dir, "package.json")), key = `${meta.name}@${meta.version}`
  if (seen.has(key)) return
  const files = readdirSync(dir).filter(f => /^(licen[cs]e|copying|notice)([.-]|$)/i.test(f) && statSync(path.join(dir, f)).isFile())
  let notice = files.map(f => `${f}\n${readFileSync(path.join(dir, f), "utf8")}`).join("\n\n")
  if (name === "@pixi/colord" && !notice) {
    notice = "Upstream MIT notice, recorded from omgovich/colord LICENSE.md (blob e437003733acd123c76c2a9df0c13a6f3b02b51e):\n" + readFileSync(path.join(root, "rights/vendor/colord-LICENSE.md"), "utf8")
    files.push("rights/vendor/colord-LICENSE.md")
  }
  if (name === "gsap") {
    const code = readFileSync(path.join(dir, "dist/gsap.js"), "utf8")
    notice = code.match(/\/\*!\s*\* GSAP[\s\S]*?\*\//)?.[0] ?? ""
    notice += "\nStandard License: https://gsap.com/standard-license/\nCurrent terms: https://webflow.com/legal/product-terms\nNot MIT. Preserve proprietary notices. Ordinary game/app use is permitted; competing visual no-code animation builders are restricted. Consult the actual license before modifying or redistributing the library.\n"
  }
  if (!notice.trim()) throw Error(`License text missing for ${key}; review before release.`)
  seen.set(key, { name: meta.name, version: meta.version, license: meta.license ?? "SEE LICENSE", repository: meta.repository, files, notice })
  for (const dependency of Object.keys(meta.dependencies ?? {})) visit(dependency, dir)
}
for (const name of Object.keys(pkg.dependencies).filter(n => !n.startsWith("@types/"))) visit(name, root)
const packages = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
const header = `Soul of Meal ${pkg.version} · third-party notices\nGenerated from installed lockfile dependencies. Includes the declared runtime dependency graph; some packages can be tree-shaken from a particular build. Development tooling is not shipped. App-owned content is governed by the root LICENSE, not by these library licenses.\n\n`
const fontTexts = ["BeVietnamPro-OFL.txt", "Exo2-OFL.txt"].map(file => `=== Font: ${file} ===\n${readFileSync(path.join(root, "rights/fonts", file), "utf8")}`)
write(path.join(root, "public/legal/THIRD_PARTY_LICENSES.txt"), header + packages.map(p => `=== ${p.name}@${p.version} · ${typeof p.license === "string" ? p.license : JSON.stringify(p.license)} ===\n${p.notice}`).join("\n\n") + "\n\n" + fontTexts.join("\n\n") + "\n\nPlace data © OpenStreetMap contributors. ODbL 1.0: https://www.openstreetmap.org/copyright · https://opendatacommons.org/licenses/odbl/1-0/\nExternal map data is fetched when requested; it is not bundled in this app.\n")
write(path.join(root, "rights/DEPENDENCIES.json"), JSON.stringify({ version: pkg.version, generatedOn: "2026-10-09", packages: packages.map(({ notice, ...p }) => p), fonts: [{ name: "Be Vietnam Pro", license: "OFL-1.1", source: "https://github.com/google/fonts/blob/main/ofl/bevietnampro/OFL.txt", licenseBlob: "9e2c1177b1e7b9b2f63e122d37f8c21bc5dddc65" }, { name: "Exo 2", license: "OFL-1.1", source: "https://github.com/google/fonts/blob/main/ofl/exo2/OFL.txt", licenseBlob: "5bec9840d2e0df42d80d6fac55279d1d5e5b9199" }] }, null, 2) + "\n")

// One policy source drives in-app and standalone, JavaScript-free store URLs.
const source = readFileSync(path.join(root, "src/legal/policies.ts"), "utf8")
const code = transpileModule(source, { compilerOptions: { module: ModuleKind.ESNext } }).outputText
const { POLICIES, POLICY_DATE, SUPPORT_URL } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`)
const esc = text => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;")
for (const [id, policy] of Object.entries(POLICIES)) {
  const nav = Object.entries(POLICIES).map(([name, p]) => `<a href="${name}.html">${esc(p.title)}</a>`).join(" · ")
  const sections = policy.sections.map(s => `<section><h2>${esc(s.title)}</h2>${s.paragraphs.map(p => `<p>${esc(p)}</p>`).join("")}</section>`).join("")
  write(path.join(root, `public/legal/${id}.html`), `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(policy.title)} · Soul of Meal</title><style>body{max-width:760px;margin:24px auto;padding:0 20px 40px;background:#0b2028;color:#e4eadf;font:16px/1.8 system-ui}a{color:#ffdfa0}nav{font-size:13px}h1{font-size:30px;line-height:1.3;color:#ffe1a8}h2{font-size:20px;margin-top:30px}p{overflow-wrap:anywhere}footer{border-top:1px solid #45616a;margin-top:32px;padding-top:20px;font-size:13px}</style><main><a href="/">← Soul of Meal</a><nav aria-label="Chính sách">${nav}</nav><p>Phiên bản 3.3 · Hiệu lực ${POLICY_DATE}</p><h1>${esc(policy.title)}</h1><p>${esc(policy.intro)}</p>${sections}<footer><a href="${SUPPORT_URL}" rel="noopener noreferrer">Liên hệ / báo cáo nội dung</a><br><a href="THIRD_PARTY_LICENSES.txt">Giấy phép thư viện</a><br><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors · ODbL</a></footer></main></html>\n`)
}

const origins = [
  ["assets/characters/", "AI-assisted sprite art", ["dev/docs/challenge-v322/prompts.json", "dev/docs/market-v331/atlas-prompts.json", "dev/tools/register-market-atlases.py"]],
  ["assets/autochess/audio/", "Original procedural composition", ["dev/tools/compose-autochess-music.py", "dev/tools/compose-retro-music.py", "dev/docs/autochess/audio-manifest.json"]],
  ["assets/autochess/", "AI-assisted art and measured sprite atlas", ["dev/docs/autochess/image-prompts.json", "dev/tools/build-autochess-sprites.py"]],
  ["assets/tcg/audio/", "Original procedural composition", ["dev/tools/compose-game-music.py", "dev/tools/compose-retro-music.py", "dev/docs/AUDIO_ASSETS.md"]],
  ["assets/tcg/characters/anime/", "AI-assisted character art; style reference recorded", ["dev/docs/anime-asset-prompts.json", "dev/docs/ANIME_ASSETS.md"]],
  ["assets/tcg/fx/", "AI-assisted original combat textures", ["dev/docs/COMBAT_ASSETS.md", "dev/docs/living-table-asset-prompts.json"]],
  ["assets/tcg/cards/", "AI-assisted original card illustrations", ["dev/docs/spirit-arena-prompts.json", "dev/docs/SPIRIT_ARENA_V29.md"]],
  ["assets/tcg/spirits/", "AI-assisted original flavor spirits", ["dev/docs/spirit-arena-prompts.json"]],
  ["assets/tcg/boards/", "AI-assisted original battle backgrounds", ["dev/docs/living-table-asset-prompts.json"]],
  ["assets/tcg/story/", "AI-assisted original story illustration", ["dev/docs/STORY_ASSETS.md", "dev/docs/CULTURE_ASSETS.md", "dev/docs/living-table-asset-prompts.json"]],
  ["assets/food/full/", "AI-assisted dish art; initial 30 cropped from project atlases, later additions recorded by release", ["dev/docs/art-direction/README.md", "dev/docs/PROGRESSION_ECONOMY_V292.md", "dev/docs/autochess/image-prompts.json"]],
  ["assets/brand/", "AI-assisted original brand; derivatives resized from project artwork", ["dev/docs/branding/LOGO.md"]],
  ["favicon.ico", "Derivative of project brand", ["dev/docs/branding/LOGO.md"]],
  ["assets/events/", "Project event artwork; provenance declared in implementation, retain generation records before commercial transfer", ["dev/docs/VIETNAMESE_CULTURE.md", "dev/docs/PROGRESSION_ECONOMY_V292.md"]],
  ["assets/tcg/map/", "Project world map; generation session not fully archived", ["README.md"]],
]
const assets = []
function walk(dir) { for (const file of readdirSync(dir)) { const full = path.join(dir, file); if (statSync(full).isDirectory()) walk(full); else if (/\.(webp|png|jpg|jpeg|svg|mp3|ico)$/i.test(file)) {
  const relative = path.relative(path.join(root, "public"), full).split(path.sep).join("/")
  const origin = origins.find(([prefix]) => relative.startsWith(prefix))
  if (!origin) throw Error(`No provenance category: ${relative}`)
  for (const evidence of origin[2]) if (!existsSync(path.join(root, evidence))) throw Error(`Missing evidence ${evidence}`)
  const bytes = readFileSync(full)
  assets.push({ path: `public/${relative}`, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), origin: origin[1], evidence: origin[2], review: relative.startsWith("assets/events/") || relative.startsWith("assets/tcg/map/") ? "owner-verification-required" : "recorded-project-provenance; owner-verification-before-transfer" })
} } }
walk(path.join(root, "public"))
assets.sort((a, b) => a.path.localeCompare(b.path))
write(path.join(root, "rights/ASSET_REGISTER.json"), JSON.stringify({ version: pkg.version, generatedOn: "2026-10-09", disclaimer: "Provenance inventory, not a certificate of non-infringement. AI output can be non-unique; input/reference rights and actual ownership must be verified by the publisher. No asset is automatically CC0. Archives are excluded from distribution.", assets }, null, 2) + "\n")
console.log(JSON.stringify({ runtimeDependencies: packages.length, registeredAssets: assets.length, staticPolicies: 3 }))
