import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  ),
  dist = path.join(root, process.argv[2] || "dist")
assert.ok(existsSync(dist), "dist is missing")
const files = []
const walk = (directory) => {
  for (const name of readdirSync(directory).sort()) {
    const full = path.join(directory, name)
    if (name.startsWith(".")) throw Error(`hidden output: ${name}`)
    statSync(full).isDirectory()
      ? walk(full)
      : files.push(path.relative(dist, full).split(path.sep).join("/"))
  }
}
walk(dist)
const size = (file) => statSync(path.join(dist, file)).size,
  digest = (file) =>
    createHash("sha256")
      .update(readFileSync(path.join(dist, file)))
      .digest("hex")
assert.ok(
  files.reduce((sum, file) => sum + size(file), 0) < 180_000_000,
  "artifact exceeds 180 MB",
)
const manifest = JSON.parse(
  readFileSync(
    path.join(dist, "assets/production-public-manifest.json"),
    "utf8",
  ),
)
assert.equal(manifest.surface, "tactical-tcg-plus-manga-chest")
assert.equal(
  manifest.bytes,
  manifest.files.reduce((sum, file) => sum + file.bytes, 0),
)
for (const file of manifest.files) {
  assert.ok(files.includes(file.path), `missing ${file.path}`)
  assert.equal(size(file.path), file.bytes)
  assert.equal(digest(file.path), file.sha256)
}
for (const required of [
  "index.html",
  "manifest.webmanifest",
  "favicon.ico",
  "assets/production-contract.json",
  "assets/release-identity.json",
  "legal/privacy.html",
  "legal/terms.html",
  "legal/rights.html",
  "assets/music580/mode-chest.mp3",
  // Soundtrack-room selections; these are score files, not retired gameplay.
  "assets/music580/mode-adventure.mp3",
  "assets/music580/mode-autochess.mp3",
  "assets/music580/boss.mp3",
])
  assert.ok(files.includes(required), `missing ${required}`)
for (const forbidden of [
  /^assets\/autochess\//,
  /^assets\/manga591[56]\/adventure\//,
])
  assert.deepEqual(
    files.filter((file) => forbidden.test(file)),
    [],
    `retired assets matched ${forbidden}`,
  )
const identity = JSON.parse(
  readFileSync(path.join(dist, "assets/release-identity.json"), "utf8"),
)
assert.deepEqual(
  {
    product: identity.product,
    candidate: identity.candidate,
    surface: identity.surface?.defaultSurface,
  },
  {
    product: "soul-of-meal-tactical-tcg",
    candidate: "tactical-tcg-web-v1",
    surface: "soul-of-meal-tactical-tcg",
  },
)
assert.ok(
  identity.source.revision === null ||
    /^[0-9a-f]{40}$/.test(identity.source.revision),
)
const contract = JSON.parse(
  readFileSync(path.join(dist, "assets/production-contract.json"), "utf8"),
)
assert.deepEqual(contract.retainedSurfaces, ["manga", "chest", "legal"])
const bundled = files
  .filter((file) => file.endsWith(".js"))
  .map((file) => readFileSync(path.join(dist, file), "utf8"))
  .join("\n")
assert.ok(!bundled.includes("soul-of-meal-aw2"))
assert.ok(!bundled.includes("WorldGame.tsx"))
console.log(`Verified Tactical TCG production package (${files.length} files).`)
