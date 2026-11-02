import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs"
import { createHash } from "node:crypto"
import { gzipSync } from "node:zlib"
import { relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { inspectRelease } from "../../releaseGuard.mjs"
import {
  AW2_DELIVERY_SECURITY_PROFILE,
  validateAw2DeliveryConfig,
} from "./aw2-delivery-contract.mjs"

export const AW2_RELEASE_CANDIDATE_ID = "aw2-web1-rc-v1"
export const TECHNICAL_GATE_IDS = [
  "artifact-size",
  "offline-shell",
  "javascript-gzip",
  "leak-scan",
  "source-portability",
  "production-entry",
  "offline-worker",
  "web-manifest",
  "aw2-inventory",
  "public-inventory",
  "legal-artifacts",
  "release-identity",
  "rollback-runbook",
  "build-routing",
  "delivery-security",
]
export const EXTERNAL_GATE_IDS = [
  "character-full-dod",
  "character-rights",
  "independent-art-audio",
  "human-content-acceptance",
  "human-device-uat",
  "device-performance",
  "owner-release-approval",
]

export const REQUIRED_PATHS = {
  "production-entry": ["dist/index.html"],
  "offline-worker": ["dist/sw.js"],
  "web-manifest": ["dist/manifest.webmanifest"],
  "aw2-inventory": ["dist/assets/aw2/inventory.json"],
  "public-inventory": ["dist/assets/production-public-manifest.json"],
  "legal-artifacts": [
    "dist/legal/privacy.html",
    "dist/legal/terms.html",
    "dist/legal/rights.html",
    "dist/legal/APP_LICENSE.txt",
    "dist/legal/THIRD_PARTY_LICENSES.txt",
    "dist/legal/NATIVE_SDK_NOTICES.txt",
  ],
  "release-identity": ["dist/assets/release-identity.json"],
  "rollback-runbook": ["docs/aw2/ROLLBACK.md"],
  "build-routing": ["dist/assets/production-contract.json", "vercel.json"],
}

const gate = (id, pass, observed = null, limit = null) => ({
  id,
  status: pass ? "PASS" : "FAIL",
  observed,
  limit,
})

export function createReleaseCandidateReport({
  buildSize,
  presentPaths,
  failedChecks = [],
}) {
  const validCount = (value) => Number.isSafeInteger(value) && value > 0
  const leakCount = Array.isArray(buildSize.leaks)
    ? buildSize.leaks.length
    : buildSize.leaks
  const gates = [
    gate(
      "artifact-size",
      validCount(buildSize.bytes) && buildSize.bytes <= 320_000_000,
      buildSize.bytes,
      320_000_000,
    ),
    gate(
      "offline-shell",
      validCount(buildSize.offlineShell?.bytes) &&
        buildSize.offlineShell.bytes <= 12_000_000,
      buildSize.offlineShell?.bytes ?? null,
      12_000_000,
    ),
    gate(
      "javascript-gzip",
      validCount(buildSize.js_gzip) && buildSize.js_gzip <= 710_000,
      buildSize.js_gzip,
      710_000,
    ),
    gate("leak-scan", leakCount === 0, leakCount, 0),
    gate(
      "source-portability",
      buildSize.sourcePortable === true,
      buildSize.sourcePortable === true ? 1 : 0,
      1,
    ),
    ...Object.entries(REQUIRED_PATHS).map(([id, paths]) =>
      gate(
        id,
        paths.every((path) => presentPaths.has(path)),
      ),
    ),
    gate(
      "delivery-security",
      buildSize.deliverySecurity === true,
      buildSize.deliverySecurity === true ? 1 : 0,
      1,
    ),
  ]
  for (const item of gates)
    if (failedChecks.includes(item.id)) item.status = "FAIL"
  if (
    gates.length !== TECHNICAL_GATE_IDS.length ||
    gates.some((item, index) => item.id !== TECHNICAL_GATE_IDS[index])
  )
    throw Error("Release candidate technical gate order drift")
  const technicalPass = gates.filter((item) => item.status === "PASS").length
  const technicalStatus = technicalPass === gates.length ? "PASS" : "FAIL"
  return {
    id: AW2_RELEASE_CANDIDATE_ID,
    technicalStatus,
    overallStatus:
      technicalStatus === "PASS" ? "BLOCKED_EXTERNAL" : "TECHNICAL_FAIL",
    releaseAuthorized: false,
    deployAuthorized: false,
    gates,
    external: EXTERNAL_GATE_IDS.map((id) => ({ id, status: "OPEN" })),
    summary: {
      technicalPass,
      technicalTotal: gates.length,
      externalPass: 0,
      externalTotal: EXTERNAL_GATE_IDS.length,
    },
  }
}

export function readReleaseCandidateReport(root = process.cwd()) {
  // Measure the current output, never a previously generated build-size report.
  const dist = resolve(root, "dist")
  const files = []
  const failedChecks = []
  const walk = (directory) => {
    for (const name of readdirSync(directory).sort()) {
      const path = resolve(directory, name)
      const stat = lstatSync(path)
      if (stat.isSymbolicLink()) {
        failedChecks.push("leak-scan")
        continue
      }
      if (stat.isDirectory()) walk(path)
      else if (stat.isFile()) files.push(path)
    }
  }
  if (existsSync(dist)) walk(dist)
  const bytes = files.reduce((sum, path) => sum + lstatSync(path).size, 0)
  const js_gzip = files
    .filter((path) => path.endsWith(".js"))
    .reduce(
      (sum, path) => sum + gzipSync(readFileSync(path), { level: 9 }).length,
      0,
    )
  let shellBytes = 0
  let sourcePortable = false
  let deliverySecurity = false
  const safeArtifactPath = (name) => {
    if (
      typeof name !== "string" ||
      !name ||
      name.includes("\\") ||
      name.includes("?")
    )
      throw Error("Invalid artifact path")
    const path = resolve(dist, name)
    if (!path.startsWith(`${dist}${sep}`) || !files.includes(path))
      throw Error("Missing artifact path")
    return path
  }
  const parseJson = (name) =>
    JSON.parse(readFileSync(safeArtifactPath(name), "utf8"))
  try {
    const worker = readFileSync(safeArtifactPath("sw.js"), "utf8")
    const urls = JSON.parse(
      worker.match(/^const CORE_URLS = (\[.*\]);$/m)?.[1] ?? "null",
    )
    if (
      !Array.isArray(urls) ||
      urls.length < 2 ||
      urls.some(
        (url) =>
          typeof url !== "string" ||
          !url.startsWith("/") ||
          url.startsWith("//"),
      )
    )
      throw Error("Invalid offline manifest")
    shellBytes = [...new Set(urls)].reduce(
      (sum, url) =>
        sum +
        lstatSync(safeArtifactPath(url === "/" ? "index.html" : url.slice(1)))
          .size,
      0,
    )
  } catch {
    failedChecks.push("offline-worker", "offline-shell")
  }
  const verifyInventory = (name, key, prefix, gateId) => {
    try {
      const manifest = parseJson(name)
      const entries = manifest[key]
      if (!Array.isArray(entries) || !entries.length)
        throw Error("Empty inventory")
      const seen = new Set()
      let total = 0
      for (const entry of entries) {
        if (seen.has(entry.path)) throw Error("Duplicate inventory path")
        seen.add(entry.path)
        const data = readFileSync(safeArtifactPath(`${prefix}${entry.path}`))
        if (
          data.length !== entry.bytes ||
          createHash("sha256").update(data).digest("hex") !== entry.sha256
        )
          throw Error("Inventory mismatch")
        total += data.length
      }
      if (manifest.bytes !== total) throw Error("Inventory byte mismatch")
    } catch {
      failedChecks.push(gateId)
    }
  }
  verifyInventory(
    "assets/aw2/inventory.json",
    "assets",
    "assets/aw2/",
    "aw2-inventory",
  )
  verifyInventory(
    "assets/production-public-manifest.json",
    "files",
    "",
    "public-inventory",
  )
  try {
    const identity = parseJson("assets/release-identity.json")
    if (
      identity.schema !== 1 ||
      identity.product !== "soul-of-meal" ||
      !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(identity.version) ||
      identity.candidate !== AW2_RELEASE_CANDIDATE_ID ||
      identity.sourcePortable !== true ||
      identity.deliverySecurityProfile !== AW2_DELIVERY_SECURITY_PROFILE ||
      identity.surface?.defaultSurface !== "soul-of-meal-aw2" ||
      JSON.stringify(identity.surface?.retainedLegacySurfaces) !==
        '["chest"]' ||
      !["local", "github", "vercel"].includes(identity.source?.provider) ||
      !(
        identity.source?.revision === null ||
        /^[0-9a-f]{40}$/.test(identity.source?.revision)
      ) ||
      (identity.source.provider === "local") !==
        (identity.source.revision === null)
    )
      throw Error("Invalid release identity")
    sourcePortable = true
  } catch {
    failedChecks.push("release-identity", "source-portability")
  }
  try {
    const contract = parseJson("assets/production-contract.json")
    const config = JSON.parse(
      readFileSync(resolve(root, "vercel.json"), "utf8"),
    )
    if (
      contract.defaultSurface !== "soul-of-meal-aw2" ||
      JSON.stringify(contract.retainedLegacySurfaces) !== '["chest"]' ||
      contract.legacyPageCount !== 1 ||
      contract.reviewUiModules !== 0 ||
      contract.legacyEntryModules !== 0 ||
      config.buildCommand !== "pnpm build" ||
      config.outputDirectory !== "dist"
    )
      throw Error("Invalid production routing")
  } catch {
    failedChecks.push("build-routing")
  }
  try {
    const config = JSON.parse(
      readFileSync(resolve(root, "vercel.json"), "utf8"),
    )
    if (validateAw2DeliveryConfig(config).length)
      throw Error("Invalid delivery security contract")
    deliverySecurity = true
  } catch {
    failedChecks.push("delivery-security")
  }
  try {
    const manifest = parseJson("manifest.webmanifest")
    if (
      manifest.start_url !== "/" ||
      manifest.scope !== "/" ||
      JSON.stringify(manifest.shortcuts?.map((item) => item.url)) !==
        '["/","/chest"]'
    )
      throw Error("Invalid web manifest")
  } catch {
    failedChecks.push("web-manifest")
  }
  try {
    const html = readFileSync(safeArtifactPath("index.html"), "utf8")
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(
      (match) => match[1],
    )
    if (
      !scripts.length ||
      scripts.some(
        (src) =>
          !src.startsWith("/assets/") ||
          lstatSync(safeArtifactPath(src.slice(1))).size === 0,
      )
    )
      throw Error("Missing compiled entry")
  } catch {
    failedChecks.push("production-entry")
  }
  const artifactHash = createHash("sha256")
  for (const path of files)
    artifactHash
      .update(relative(dist, path).split(sep).join("/"))
      .update("\0")
      .update(createHash("sha256").update(readFileSync(path)).digest())
      .update("\0")
  const leaks = existsSync(dist) ? inspectRelease(dist) : ["Missing dist"]
  const buildSize = {
    bytes,
    js_gzip,
    leaks,
    sourcePortable,
    deliverySecurity,
    offlineShell: { bytes: shellBytes },
  }
  const paths = Object.values(REQUIRED_PATHS).flat()
  const presentPaths = new Set(
    paths.filter((path) => {
      const full = resolve(root, path)
      return (
        existsSync(full) && lstatSync(full).isFile() && lstatSync(full).size > 0
      )
    }),
  )
  return {
    ...createReleaseCandidateReport({ buildSize, presentPaths, failedChecks }),
    artifact: {
      sha256: artifactHash.digest("hex"),
      files: files.length,
      bytes,
      jsGzipBytes: js_gzip,
      offlineShellBytes: shellBytes,
    },
  }
}

export function candidateExitCode(report, requireReady = false) {
  if (report.technicalStatus !== "PASS") return 1
  if (requireReady && report.overallStatus !== "READY") return 2
  return 0
}

function main() {
  const report = readReleaseCandidateReport()
  process.stdout.write(`${JSON.stringify(report)}\n`)
  process.exitCode = candidateExitCode(
    report,
    process.argv.includes("--require-ready"),
  )
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main()
