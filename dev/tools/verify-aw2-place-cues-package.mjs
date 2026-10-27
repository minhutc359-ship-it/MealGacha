import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  mkdirSync,
} from "node:fs"
import { join } from "node:path"

const base = "6250c8d0d1703c6ef8bf66344e23b04d8c0246d6"
const output = ".asset-work/aw2-016i/review-build.json"
function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name)
    return entry.isDirectory() ? filesIn(file) : [file]
  })
}
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim()
const unchanged = [
  "src/aw2/save",
  "src/aw2/combat",
  "src/aw2/economy",
  "src/aw2/collection",
  "src/aw2/modes",
  "src/aw2/world/model.ts",
  "src/aw2/world/maps.ts",
  "src/aw2/world/rules.ts",
  "src/aw2/world/navigation.ts",
  "src/aw2/world/controls.ts",
  "src/aw2/world/placeGuidance.ts",
  "src/aw2/world/scene.ts",
  "src/aw2/world/journey.ts",
  "src/aw2/assets/settlement.ts",
  "src/aw2/world/registry.ts",
  "src/aw2/world/encounter.ts",
  "src/aw2/world/npcPatrol.ts",
  "src/aw2/world/walkingIntent.ts",
  "src/aw2/world/interiorLayout.ts",
  "src/aw2/world/pantryLayout.ts",
  "dev/aw2/assets",
  "package.json",
  "pnpm-lock.yaml",
  "vite.config.ts",
  "dev/vite.aw2.config.ts",
]
assert.equal(
  git("diff", "--name-only", base, "--", ...unchanged),
  "",
  "unchanged engine/art boundaries",
)
assert.equal(
  git("hash-object", "dev/aw2/assets/lam/base-v1/motion-prompts.json"),
  "9ee35efb55fda47082646b2bcfb59196b05f1cf8",
)
const inputs = [...filesIn("src/aw2"), ...filesIn("dev/aw2")].filter((file) =>
  /\.(ts|tsx|css|html|json|webp|wav)$/.test(file),
)
inputs.push(
  "dev/vite.aw2.config.ts",
  "dev/vite.dev.config.ts",
  "dev/tools/aw2-review-build.ts",
  "package.json",
  "pnpm-lock.yaml",
)
const hash = createHash("sha256")
for (const input of inputs.sort())
  hash.update(input).update("\0").update(readFileSync(input)).update("\0")
const fingerprint = hash.digest("hex")
const aw2 = filesIn("dist-aw2")
assert.ok(
  aw2
    .filter((file) => file.endsWith(".js"))
    .some((file) => readFileSync(file, "utf8").includes(fingerprint)),
  "compiled input fingerprint",
)
assert.ok(
  aw2.every(
    (file) =>
      !/\.(png|ts|tsx|zip|map)$/.test(file) &&
      !file.split("/").at(-1).startsWith("."),
  ),
  "no authored source/archive/temp in review package",
)
const assets = filesIn("dev/aw2/assets").filter(
  (file) => !file.split("/").at(-1).startsWith(".") && !file.endsWith(".png"),
)
for (const asset of assets)
  assert.deepEqual(
    readFileSync(asset),
    readFileSync(join("dist-aw2", asset)),
    `packaged asset: ${asset}`,
  )
assert.equal(assets.length, 262)
const stable = filesIn("dist"),
  texts = stable.filter((file) => /\.(html|js|css)$/.test(file))
for (const file of texts)
  assert.ok(
    !/aw2\.development\.save|adventure-world-2|aw2-room-village-tea/.test(
      readFileSync(file, "utf8"),
    ),
    `stable isolation ${file}`,
  )
assert.ok(
  stable.every((file) => !file.split("/").at(-1).startsWith(".")),
  "no temporary files in stable package",
)
const summary = {
  task: "AW2-016I",
  status: "PASS",
  base,
  codeFingerprint: fingerprint,
  inputFiles: inputs.length,
  compiledFingerprintMatch: true,
  aw2Files: aw2.length,
  aw2Bytes: aw2.reduce((sum, file) => sum + statSync(file).size, 0),
  runtimeParity: assets.length,
  newRasterAudioBytes: 0,
  originalLamMetadataPreserved: true,
  unchangedAuthorities: unchanged,
  stableFiles: stable.length,
  stableBytes: stable.reduce((sum, file) => sum + statSync(file).size, 0),
  stableTextIsolation: texts.length,
}
mkdirSync(".asset-work/aw2-016i", { recursive: true })
writeFileSync(output, JSON.stringify(summary, null, 2) + "\n")
console.log(JSON.stringify(summary))
