import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import {
  readFileSync,
  readdirSync,
  existsSync,
  statSync,
  mkdirSync,
  writeFileSync,
} from "node:fs"
import { join } from "node:path"
const base = "b8fc6e990a3398591e7b3a68840d114279e7728f",
  out = ".asset-work/aw2-017a"
const allowed = new Set([
  "dev/aw2/ModeLobby.tsx",
  "dev/aw2/RoomWaypoints.tsx",
  "dev/aw2/TeaRoomCanvas.tsx",
  "dev/aw2/VillageLandscape.tsx",
  "src/aw2/assets/settlement.ts",
  "src/aw2/assets/teaRoom.ts",
  "src/aw2/assets/village.ts",
  "src/aw2/assets/worldAssets.ts",
  "src/aw2/modes/catalog.ts",
  "src/aw2/modes/session.ts",
  "src/aw2/save/schema.ts",
  "src/aw2/save/store.ts",
  "src/aw2/world/interiorLayout.ts",
  "src/aw2/world/journey.ts",
  "src/aw2/world/maps.ts",
  "src/aw2/world/model.ts",
  "src/aw2/world/placeGuidance.ts",
  "src/aw2/world/registry.ts",
  "src/aw2/world/rules.ts",
  "src/aw2/world/scene.ts",
  "src/aw2/assets/villageDistrict.ts",
])
const filesIn = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.name.startsWith(".")
      ? []
      : e.isDirectory()
        ? filesIn(join(dir, e.name))
        : [join(dir, e.name)],
  )
const extra = [
  "dev/vite.aw2.config.ts",
  "dev/vite.dev.config.ts",
  "dev/tools/aw2-review-build.ts",
  "package.json",
  "pnpm-lock.yaml",
  "vite.config.ts",
]
const owned = (p) =>
  p.startsWith("src/aw2/") || p.startsWith("dev/aw2/") || extra.includes(p)
const blob = (p) => {
  const b = readFileSync(p)
  return createHash("sha1").update(`blob ${b.length}\0`).update(b).digest("hex")
}
const entries = execFileSync("git", ["ls-tree", "-r", base], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .map((s) => {
    const [meta, path] = s.split("\t")
    return { path, sha: meta.split(" ")[2] }
  })
  .filter((f) => owned(f.path))
const known = new Set(entries.map((f) => f.path)),
  changed = []
for (const f of entries) {
  assert.ok(existsSync(f.path), `missing original ${f.path}`)
  if (blob(f.path) !== f.sha) {
    assert.ok(allowed.has(f.path), `unapproved runtime change ${f.path}`)
    changed.push(f.path)
  }
}
for (const p of [...filesIn("src/aw2"), ...filesIn("dev/aw2")])
  if (!known.has(p)) {
    assert.ok(allowed.has(p), `unapproved new runtime file ${p}`)
    changed.push(p)
  }
assert.equal(changed.length, 21)
const inputs = [...filesIn("src/aw2"), ...filesIn("dev/aw2")].filter((p) =>
  /\.(ts|tsx|css|html|json|webp|wav)$/.test(p),
)
inputs.push(...extra.filter((p) => p !== "vite.config.ts"))
const hash = createHash("sha256")
for (const p of inputs.sort())
  hash.update(p).update("\0").update(readFileSync(p)).update("\0")
const fingerprint = hash.digest("hex"),
  aw2 = filesIn("dist-aw2"),
  stable = filesIn("dist")
assert.ok(
  aw2
    .filter((p) => p.endsWith(".js"))
    .some((p) => readFileSync(p, "utf8").includes(fingerprint)),
  "compiled fingerprint",
)
assert.ok(
  aw2.every((p) => !/\.(png|ts|tsx|zip|map)$/.test(p)),
  "source excluded",
)
const assets = filesIn("dev/aw2/assets").filter((p) => !p.endsWith(".png"))
for (const p of assets)
  assert.deepEqual(readFileSync(p), readFileSync(join("dist-aw2", p)), p)
assert.equal(assets.length, 262)
const texts = stable.filter((p) => /\.(html|js|css)$/.test(p))
for (const p of texts)
  assert.ok(
    !/aw2\.development\.save|aw2-room-village-(tea|home|guild)|adventure-world-2/.test(
      readFileSync(p, "utf8"),
    ),
    p,
  )
const bytes = (paths) => paths.reduce((n, p) => n + statSync(p).size, 0)
assert.equal(stable.length, 851)
assert.equal(bytes(stable), 177450422)
const result = {
  task: "AW2-017A",
  status: "PASS",
  base,
  codeFingerprint: fingerprint,
  inputFiles: inputs.length,
  compiledFingerprintMatch: true,
  approvedRuntimeChanges: changed,
  protectedOriginalFiles:
    entries.length - changed.filter((p) => known.has(p)).length,
  runtimeParity: assets.length,
  newRasterAudioBytes: 0,
  aw2Files: aw2.length,
  aw2Bytes: bytes(aw2),
  stableFiles: stable.length,
  stableBytes: bytes(stable),
  stableTextIsolation: texts.length,
}
mkdirSync(out, { recursive: true })
writeFileSync(
  `${out}/review-build.json`,
  JSON.stringify(result, null, 2) + "\n",
)
console.log(JSON.stringify(result))
