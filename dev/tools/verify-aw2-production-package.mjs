import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const dist = path.join(root, process.argv[2] || "dist")
const files = []
const atomicWait = new Int32Array(new SharedArrayBuffer(4))
const waitForAtomicStaging = (full, name) => {
  if (name !== ".rsync-tmp" && !/^\..+\.[A-Za-z0-9]{6}$/.test(name))
    return false
  for (let attempt = 0; attempt < 20 && existsSync(full); attempt += 1)
    Atomics.wait(atomicWait, 0, 0, 25)
  return !existsSync(full)
}
const walk = (directory) => {
  for (const name of readdirSync(directory).sort()) {
    // The workspace synchronizer can expose its atomic rename staging for a
    // few milliseconds. Ignore it only after proving it disappeared.
    const full = path.join(directory, name)
    if (waitForAtomicStaging(full, name)) continue
    if (statSync(full).isDirectory()) walk(full)
    else files.push(path.relative(dist, full).split(path.sep).join("/"))
  }
}
walk(dist)
assert.deepEqual(
  files.filter((file) => file.split("/").some((part) => part.startsWith("."))),
  [],
  "hidden or temporary output survived the build",
)
const size = (file) => statSync(path.join(dist, file)).size
const digest = (file) =>
  createHash("sha256")
    .update(readFileSync(path.join(dist, file)))
    .digest("hex")
const totalBytes = files.reduce((sum, file) => sum + size(file), 0)
assert.ok(
  totalBytes < 180_000_000,
  `production artifact is ${totalBytes} bytes`,
)

const concreteCssAssetUrls = new Set()
for (const file of files.filter((name) => name.endsWith(".css"))) {
  const source = readFileSync(path.join(dist, file), "utf8")
  for (const match of source.matchAll(
    /\/assets\/[A-Za-z0-9_./-]+\.(?:jpe?g|json|mp3|png|wav|webp|woff2)/g,
  ))
    concreteCssAssetUrls.add(match[0].slice(1))
}
for (const asset of concreteCssAssetUrls)
  assert.ok(files.includes(asset), `static CSS asset URL is missing: ${asset}`)

const publicManifest = JSON.parse(
  readFileSync(
    path.join(dist, "assets/production-public-manifest.json"),
    "utf8",
  ),
)
assert.equal(publicManifest.surface, "aw2-plus-original-chest")
assert.equal(
  publicManifest.bytes,
  publicManifest.files.reduce((sum, file) => sum + file.bytes, 0),
)
for (const file of publicManifest.files) {
  assert.ok(
    files.includes(file.path),
    `missing selected public asset ${file.path}`,
  )
  assert.equal(size(file.path), file.bytes, `size changed for ${file.path}`)
  assert.equal(digest(file.path), file.sha256, `hash changed for ${file.path}`)
}

const aw2Manifest = JSON.parse(
  readFileSync(path.join(dist, "assets/aw2/inventory.json"), "utf8"),
)
assert.equal(aw2Manifest.schema, 2)
assert.equal(aw2Manifest.productionPrefix, "/assets/aw2/")
assert.equal(
  aw2Manifest.bytes,
  aw2Manifest.assets.reduce((sum, file) => sum + file.bytes, 0),
)
for (const file of aw2Manifest.assets) {
  const output = `assets/aw2/${file.path}`
  assert.ok(files.includes(output), `missing AW2 runtime asset ${output}`)
  assert.equal(size(output), file.bytes, `size changed for ${output}`)
  assert.equal(digest(output), file.sha256, `hash changed for ${output}`)
}
const aw2ByUrl = new Map(
  aw2Manifest.assets.map((file) => [
    `${aw2Manifest.productionPrefix}${file.path}`,
    file,
  ]),
)
const catalogBytes = (urls) =>
  urls.reduce((sum, url) => sum + (aw2ByUrl.get(url)?.bytes ?? 0), 0)
assert.equal(aw2Manifest.sceneGroups.length, 12)
assert.equal(
  new Set(aw2Manifest.sceneGroups.map((group) => group.sceneId)).size,
  12,
)
for (const group of aw2Manifest.sceneGroups) {
  assert.ok(group.urls.length > 0, `empty scene asset group: ${group.sceneId}`)
  assert.deepEqual(group.urls, [...new Set(group.urls)].sort())
  for (const url of group.urls) {
    assert.ok(
      url.startsWith(aw2Manifest.productionPrefix),
      `non-production scene URL: ${url}`,
    )
    assert.ok(aw2ByUrl.has(url), `scene asset is absent from inventory: ${url}`)
  }
  assert.equal(group.bytes, catalogBytes(group.urls))
}
assert.equal(aw2Manifest.worldLeaders.urls.length, 12)
assert.deepEqual(
  aw2Manifest.worldLeaders.urls,
  [...new Set(aw2Manifest.worldLeaders.urls)].sort(),
)
for (const url of aw2Manifest.worldLeaders.urls)
  assert.ok(aw2ByUrl.has(url), `leader asset is absent from inventory: ${url}`)
assert.equal(
  aw2Manifest.worldLeaders.bytes,
  catalogBytes(aw2Manifest.worldLeaders.urls),
)
for (const group of aw2Manifest.sceneGroups)
  assert.deepEqual(
    group.urls.filter((url) => aw2Manifest.worldLeaders.urls.includes(url)),
    [],
    `leader duplicated into scene group: ${group.sceneId}`,
  )

const forbidden = files.filter((file) =>
  /^(?:assets\/(?:autochess|culture5920|events|intro-manga5918|loading|manga5915|manga5916|v4)\/|assets\/music580\/(?!mode-chest\.mp3$)|assets\/rpg\/(?!spirit510\/portraits-\d+\.webp$)|assets\/characters\/(?!(?:(?:familiar594|rare595|rare596|regional5910|spring5911|starters590)\/[^/]+-portrait|chefs593\/chef-[a-z0-9-]+-neutral)\.webp$)|assets\/tcg\/(?!characters\/anime\/bach\.webp$))/.test(
    file,
  ),
)
assert.deepEqual(
  forbidden,
  [],
  `legacy production assets returned: ${forbidden.slice(0, 8)}`,
)

for (const required of [
  "index.html",
  "manifest.webmanifest",
  "favicon.ico",
  "legal/privacy.html",
  "assets/brand/icon-192.png",
  "assets/brand/icon-512.png",
  "assets/brand/soul-of-meal.webp",
  "assets/music580/mode-chest.mp3",
  "assets/food/full/pho-bo.webp",
  "assets/rpg/spirit510/portraits-1.webp",
])
  assert.ok(
    files.includes(required),
    `missing production contract file ${required}`,
  )

const sw = readFileSync(path.join(dist, "sw.js"), "utf8")
const core = JSON.parse(
  sw.match(/^const CORE_URLS = (\[.*\]);$/m)?.[1] ?? "null",
)
assert.ok(Array.isArray(core), "service worker core manifest missing")
assert.ok(
  !core.some((url) =>
    /original-chest|OriginalChest|ChestSpirit|food\/|music580|rpg\/spirit/.test(
      url,
    ),
  ),
)
for (const url of core) {
  const file = url === "/" ? "index.html" : url.slice(1)
  assert.ok(
    files.includes(file),
    `service worker core URL does not exist: ${url}`,
  )
}
const coreBytes = core.reduce((sum, url) => {
  const file = url === "/" ? "index.html" : url.slice(1)
  return sum + size(file)
}, 0)
assert.ok(coreBytes < 2_000_000, `offline cold shell is ${coreBytes} bytes`)
const sceneChunks = files.filter((file) =>
  /assets\/(?:VillageLandscape|JourneyLandscape|TeaRoomCanvas)-[^/]+\.js$/.test(
    file,
  ),
)
assert.equal(sceneChunks.length, 3, `scene chunks: ${sceneChunks.join(", ")}`)
for (const chunk of sceneChunks)
  assert.ok(!core.includes(`/${chunk}`), `scene chunk was precached: ${chunk}`)
const chestPortraitChunks = files.filter((file) =>
  /assets\/spiritArt-[^/]+\.js$/.test(file),
)
assert.equal(
  chestPortraitChunks.length,
  1,
  `original chest portrait chunks: ${chestPortraitChunks.join(", ")}`,
)
assert.ok(
  !core.includes(`/${chestPortraitChunks[0]}`),
  "original chest portrait graph returned to the AW2 cold shell",
)
assert.ok(
  !core.some((url) => /pixi-renderer/.test(url)),
  "Pixi renderer returned to the cold shell",
)

console.log(
  JSON.stringify({
    status: "PASS",
    bytes: totalBytes,
    files: files.length,
    selectedPublicFiles: publicManifest.files.length,
    selectedPublicBytes: publicManifest.bytes,
    aw2RuntimeFiles: aw2Manifest.assets.length,
    aw2RuntimeBytes: aw2Manifest.bytes,
    offlineCoreUrls: core.length,
    offlineCoreBytes: coreBytes,
    sceneGroups: aw2Manifest.sceneGroups.length,
    sceneChunks: sceneChunks.length,
    lazyChestPortraitChunks: chestPortraitChunks.length,
  }),
)
