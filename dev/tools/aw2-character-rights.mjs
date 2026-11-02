import { createHash } from "node:crypto"
import { readFile, realpath, readdir, lstat, writeFile } from "node:fs/promises"
import { join, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

export const CHARACTER_ART_UNITS = [
  "than",
  "lua",
  "lam",
  "moc-non",
  "suong",
  "muoi",
  "nhien",
  "hai",
  "lien",
  "moc",
  "bach",
  "van",
]
const rootDirectory = fileURLToPath(new URL("../../", import.meta.url))
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex")
const hashPattern = /^[a-f0-9]{64}$/

/** Refuse traversal, absolute paths and symlinks before reading source evidence. */
export async function characterEvidenceFile(root, path) {
  if (
    typeof path !== "string" ||
    !path ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.split("/").some((part) => ["", ".", ".."].includes(part))
  )
    throw Error(`Unsafe evidence path: ${path}`)
  const base = await realpath(root)
  const full = resolve(base, path)
  const actual = await realpath(full)
  if (
    !actual.startsWith(base + sep) ||
    actual !== full ||
    !(await lstat(full)).isFile()
  )
    throw Error(`Evidence must be an in-repository regular file: ${path}`)
  return readFile(full)
}

function selectedGenerationHashes(value, result = new Set()) {
  if (!value || typeof value !== "object") return result
  if (value.selected === true) {
    const hash = value.sha256 ?? value.outputSha256 ?? value.source?.sha256
    const path =
      value.workspacePath ?? value.workspaceSource ?? value.source?.path
    if (path && hashPattern.test(hash ?? "")) result.add(hash)
  }
  for (const child of Object.values(value))
    selectedGenerationHashes(child, result)
  return result
}

function declaredExternalInputs(value, result = new Set()) {
  if (!value || typeof value !== "object") return result
  for (const key of ["externalReferences", "externalInputs"])
    for (const item of Array.isArray(value[key]) ? value[key] : [])
      result.add(JSON.stringify(item))
  for (const child of Object.values(value))
    declaredExternalInputs(child, result)
  return result
}

/** Hash/lineage audit is evidence of recorded sources, never legal clearance. */
export async function auditCharacterSources({
  root = rootDirectory,
  units = CHARACTER_ART_UNITS,
} = {}) {
  const cache = new Map()
  const file = async (path) => {
    if (!cache.has(path)) cache.set(path, characterEvidenceFile(root, path))
    return cache.get(path)
  }
  const json = async (path) => JSON.parse((await file(path)).toString("utf8"))
  const basis = await json("rights/aw2/provider-use.json")
  if (
    basis.id !== "aw2-openai-output-use-2026-11-02" ||
    basis.releaseAuthorized !== false ||
    basis.copyrightExclusivity !== "NOT_ASSERTED"
  )
    throw Error("Provider-use record cannot grant clearance or exclusivity")
  const registry = await json("src/aw2/assets/ultimate-art.v1.json")
  if (
    units === CHARACTER_ART_UNITS &&
    Object.keys(registry).sort().join(",") !==
      units
        .map((unit) => `aw2-${unit}`)
        .sort()
        .join(",")
  )
    throw Error(
      "Ultimate register must cover exactly the twelve canon characters",
    )
  const audioSourceCode = await Promise.all(
    [
      "dev/tools/build-aw2-than-assets.py",
      "dev/tools/build-aw2-starter-assets.py",
      "dev/tools/build-aw2-muoi-assets.py",
      "dev/tools/build-aw2-nhien-assets.py",
      "dev/tools/build-aw2-roster-assets.py",
    ].map(async (path) => ({ path, sha256: digest(await file(path)) })),
  )
  const records = [],
    issues = []
  for (const unit of units) {
    const spiritId = `aw2-${unit}`
    try {
      const folder = `dev/aw2/assets/${unit}/base-v1`
      const manifestPath = `src/aw2/assets/${unit}.base-v1.json`
      const manifest = await json(manifestPath)
      if (manifest.spiritId !== spiritId) throw Error("Canon identity mismatch")
      if (
        ["reference", "world", "battle", "portrait", "fx"].some(
          (key) => !manifest.assets?.[key],
        )
      )
        throw Error("Character is missing a required authored asset")
      const provenancePath = `${folder}/provenance.json`
      const provenance = await json(provenancePath)
      const ultimateProvenancePath = `dev/aw2/assets/${unit}/ultimate-v1/provenance.json`
      const ultimate = await json(ultimateProvenancePath)
      const evidenceHashes = selectedGenerationHashes(provenance)
      for (const hash of selectedGenerationHashes(ultimate))
        evidenceHashes.add(hash)
      const promptPaths = (await readdir(join(root, folder)))
        .filter((name) => /prompts\.json$/.test(name))
        .map((name) => `${folder}/${name}`)
      promptPaths.push(`dev/aw2/assets/${unit}/ultimate-v1/prompts.json`)
      if (promptPaths.length < 2) throw Error("Missing preserved prompts")
      const external = declaredExternalInputs(provenance)
      for (const path of promptPaths) {
        const prompt = await json(path)
        for (const input of declaredExternalInputs(prompt)) external.add(input)
      }
      const media = []
      const unique = new Set()
      for (const asset of [
        ...Object.values(manifest.assets),
        registry[spiritId],
      ]) {
        if (!asset || !asset.url?.startsWith(`/dev/aw2/assets/${unit}/`))
          throw Error("Missing or cross-character artwork")
        const runtimePath = asset.url.slice(1)
        if (unique.has(runtimePath)) continue
        unique.add(runtimePath)
        const runtime = await file(runtimePath)
        if (
          runtime.byteLength !== asset.bytes ||
          digest(runtime) !== asset.sha256
        )
          throw Error(`Runtime hash/size mismatch: ${runtimePath}`)
        if (!asset.source?.path?.startsWith(`dev/aw2/assets/${unit}/`))
          throw Error("Missing local source identity")
        const source = await file(asset.source.path)
        if (digest(source) !== asset.source.sha256)
          throw Error(`Source hash mismatch: ${asset.source.path}`)
        if (!evidenceHashes.has(asset.source.sha256))
          throw Error(
            `Source lacks selected-generation evidence: ${asset.source.path}`,
          )
        media.push({
          path: runtimePath,
          bytes: runtime.byteLength,
          sha256: asset.sha256,
          source: asset.source,
          origin: "RECORDED_OPENAI_IMAGE_OUTPUT",
        })
      }
      for (const [slot, skill] of Object.entries(manifest.skills)) {
        const path = skill.audio.url.slice(1)
        if (
          !path.startsWith(`${folder}/`) ||
          !/synthesi/i.test(skill.audio.method)
        )
          throw Error("Unrecognized audio source")
        const bytes = await file(path)
        if (
          digest(bytes) !== skill.audio.sha256 ||
          bytes.toString("ascii", 0, 4) !== "RIFF" ||
          bytes.toString("ascii", 8, 12) !== "WAVE"
        )
          throw Error(`Audio hash/format mismatch: ${path}`)
        media.push({
          path,
          bytes: bytes.byteLength,
          sha256: skill.audio.sha256,
          origin: "ORIGINAL_DETERMINISTIC_SYNTHESIS",
          slot,
        })
      }
      const registeredMedia = new Set(media.map((item) => item.path))
      const inspectDirectory = async (directory) => {
        for (const entry of await readdir(join(root, directory), {
          withFileTypes: true,
        })) {
          if (entry.name.startsWith(".")) continue
          const path = `${directory}/${entry.name}`
          if (entry.isSymbolicLink()) throw Error(`Unreviewed symlink: ${path}`)
          if (entry.isDirectory()) await inspectDirectory(path)
          else if (
            /\.(webp|wav)$/i.test(entry.name) &&
            !registeredMedia.has(path)
          )
            throw Error(`Unregistered character media: ${path}`)
        }
      }
      await inspectDirectory(`dev/aw2/assets/${unit}`)
      const art = registry[spiritId]
      const ultimatePrompt = await json(
        `dev/aw2/assets/${unit}/ultimate-v1/prompts.json`,
      )
      if (
        ultimate.providerUseBasis !== basis.id ||
        ultimate.runtime.sha256 !== art.sha256 ||
        digest(
          await file(`dev/aw2/assets/${unit}/ultimate-v1/prompts.json`),
        ) !== art.promptSha256
      )
        throw Error("Ultimate proof binding mismatch")
      for (const ref of ultimatePrompt.referenceInputs) {
        if (
          !ref.path.startsWith(`${folder}/`) ||
          digest(await file(ref.path)) !== ref.sha256
        )
          throw Error("Ultimate identity-input hash mismatch")
      }
      records.push({
        spiritId,
        displayName: manifest.displayName,
        sourceAudit: "VERIFIED",
        providerUse: "DOCUMENTED",
        providerUseBasis: basis.id,
        declaredExternalInputs: [...external],
        lineage: [provenancePath, ultimateProvenancePath, ...promptPaths].map(
          (path) => ({ path, sha256: "" }),
        ),
        media,
        copyrightExclusivity: "NOT_ASSERTED",
        humanLegalReview: "NOT_RUN",
        commercialRelease: "NOT_CLEARED",
      })
    } catch (error) {
      issues.push({ spiritId, message: error.message })
    }
  }
  // Resolve asynchronous file-cache entries without persisting any absolute paths.
  for (const record of records)
    for (const item of record.lineage)
      item.sha256 = digest(await file(item.path))
  return {
    id: "aw2-character-source-audit-v1",
    providerUseBasis: {
      path: "rights/aw2/provider-use.json",
      sha256: digest(await file("rights/aw2/provider-use.json")),
    },
    summary: {
      characters: records.length,
      sourceVerified: records.length,
      runtimeFiles: records.reduce((n, r) => n + r.media.length, 0),
      declaredExternalInputCount: records.reduce(
        (n, r) => n + r.declaredExternalInputs.length,
        0,
      ),
      technicalStatus: issues.length ? "FAIL" : "PASS",
      commercialCleared: 0,
    },
    copyrightExclusivity: "NOT_ASSERTED",
    humanLegalReview: "NOT_RUN",
    releaseAuthorized: false,
    audioSourceCode,
    records,
    issues,
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const report = await auditCharacterSources()
  const path = join(rootDirectory, "rights/aw2/character-sources.json")
  const content = JSON.stringify(report, null, 2) + "\n"
  if (process.argv.includes("--write")) await writeFile(path, content)
  if (
    process.argv.includes("--check") &&
    (await readFile(path, "utf8")) !== content
  )
    throw Error(
      "Character source register is stale; inspect changes and regenerate",
    )
  console.log(
    JSON.stringify({
      ...report.summary,
      issues: report.issues,
      releaseAuthorized: false,
    }),
  )
  if (report.issues.length) process.exitCode = 1
  else if (process.argv.includes("--require-cleared")) process.exitCode = 2
}
