import { createHash } from "node:crypto"
import { readFile, readdir, lstat, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  auditCharacterSources,
  characterEvidenceFile,
} from "./aw2-character-rights.mjs"

const rootDirectory = fileURLToPath(new URL("../../", import.meta.url))
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex")
const mediaPattern = /\.(?:webp|wav)$/
function visit(value, callback) {
  if (!value || typeof value !== "object") return
  callback(value)
  for (const child of Object.values(value)) visit(child, callback)
}
/** All packaged AW2 media, including retained historical variants; no legal approval inferred. */
export async function auditAw2Media({ root = rootDirectory } = {}) {
  const file = (path) => characterEvidenceFile(root, path)
  const characters = await auditCharacterSources({ root })
  const declared = new Map(),
    manifests = new Map(),
    issues = [...characters.issues]
  for (const name of (await readdir(join(root, "src/aw2/assets")))
    .filter((n) => n.endsWith(".json"))
    .sort()) {
    const path = `src/aw2/assets/${name}`,
      bytes = await file(path)
    manifests.set(path, { path, sha256: digest(bytes) })
    visit(JSON.parse(bytes), (value) => {
      if (
        !value.url?.startsWith?.("/dev/aw2/assets/") ||
        !mediaPattern.test(value.url)
      )
        return
      const path = value.url.slice(1),
        previous = declared.get(path)
      if (
        previous &&
        (previous.asset.sha256 !== value.sha256 ||
          JSON.stringify(previous.asset.source) !==
            JSON.stringify(value.source))
      )
        issues.push({ path, message: "Conflicting media descriptors" })
      if (!previous) declared.set(path, { asset: value, manifests: [] })
      declared.get(path).manifests.push(manifests.get(`src/aw2/assets/${name}`))
    })
  }
  const actual = new Set()
  async function walk(relative) {
    for (const item of await readdir(join(root, relative), {
      withFileTypes: true,
    })) {
      if (item.name.startsWith(".")) continue
      const path = `${relative}/${item.name}`
      if ((await lstat(join(root, path))).isSymbolicLink())
        throw Error(`Symlink in AW2 media: ${path}`)
      if (item.isDirectory()) await walk(path)
      else if (mediaPattern.test(path)) actual.add(path)
    }
  }
  await walk("dev/aw2/assets")
  for (const path of actual)
    if (!declared.has(path))
      issues.push({ path, message: "Unregistered runtime media" })
  const records = [],
    lineageCache = new Map()
  async function lineage(folder) {
    if (!lineageCache.has(folder))
      lineageCache.set(
        folder,
        (async () => {
          const result = []
          for (const name of (await readdir(join(root, folder)))
            .filter((n) =>
              /(?:^|-)(?:prompts|provenance|selection)\.json$/.test(n),
            )
            .sort()) {
            const path = `${folder}/${name}`,
              bytes = await file(path)
            result.push({ path, sha256: digest(bytes) })
          }
          return result
        })(),
      )
    return lineageCache.get(folder)
  }
  for (const [path, { asset, manifests: sourceManifests }] of [
    ...declared,
  ].sort(([a], [b]) => a.localeCompare(b))) {
    try {
      const bytes = await file(path)
      if (
        digest(bytes) !== asset.sha256 ||
        (asset.bytes !== undefined && bytes.byteLength !== asset.bytes)
      )
        throw Error("Media hash/size mismatch")
      let source = null,
        audioSourceCode = []
      if (path.endsWith(".webp")) {
        if (
          !asset.source?.path ||
          !asset.source.path.startsWith("dev/aw2/assets/")
        )
          throw Error("Missing original artwork source")
        const original = await file(asset.source.path)
        if (digest(original) !== asset.source.sha256)
          throw Error("Original image hash mismatch")
        source = {
          path: asset.source.path,
          sha256: asset.source.sha256,
          bytes: original.byteLength,
        }
      } else {
        if (
          !/synthesi/i.test(asset.method ?? "") ||
          bytes.toString("ascii", 0, 4) !== "RIFF" ||
          bytes.toString("ascii", 8, 12) !== "WAVE"
        )
          throw Error("Unrecognized synthesized audio")
        audioSourceCode = path.includes("/forgotten-host/")
          ? await Promise.all(
              [
                "dev/tools/build-aw2-boss-motion.py",
                "dev/tools/build-aw2-than-assets.py",
              ].map(async (path) => ({
                path,
                sha256: digest(await file(path)),
              })),
            )
          : characters.audioSourceCode
      }
      const evidence = await lineage(dirname(source?.path ?? path))
      if (!evidence.some((p) => /prompts\.json$/.test(p.path)))
        throw Error("Missing preserved generation prompts")
      records.push({
        path,
        sha256: asset.sha256,
        bytes: bytes.byteLength,
        source,
        origin: source
          ? "PROJECT_RECORDED_IMAGE_OUTPUT"
          : "ORIGINAL_CODE_SYNTHESIS",
        evidence: [...sourceManifests, ...evidence],
        audioSourceCode,
        providerUseBasis: characters.providerUseBasis,
        copyrightExclusivity: "NOT_ASSERTED",
        humanLegalReview: "NOT_RUN",
        commercialRelease: "NOT_CLEARED",
      })
    } catch (error) {
      issues.push({ path, message: error.message })
    }
  }
  return {
    id: "aw2-all-media-source-audit-v1",
    summary: {
      runtimeFiles: actual.size,
      registered: records.length,
      imageFiles: records.filter((r) => r.source).length,
      synthesizedAudioFiles: records.filter((r) => !r.source).length,
      technicalStatus: issues.length ? "FAIL" : "PASS",
      humanCleared: 0,
    },
    releaseAuthorized: false,
    copyrightExclusivity: "NOT_ASSERTED",
    issues,
    records,
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const report = await auditAw2Media(),
    path = join(rootDirectory, "rights/aw2/all-media-sources.json"),
    content = JSON.stringify(report, null, 2) + "\n"
  if (process.argv.includes("--write")) await writeFile(path, content)
  if (
    process.argv.includes("--check") &&
    (await readFile(path, "utf8")) !== content
  )
    throw Error("All-media source register is stale; inspect and regenerate")
  console.log(
    JSON.stringify({
      ...report.summary,
      issues: report.issues,
      releaseAuthorized: false,
    }),
  )
  if (report.issues.length) process.exitCode = 1
}
