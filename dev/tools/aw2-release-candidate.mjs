import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

export const AW2_RELEASE_CANDIDATE_ID = "aw2-web1-rc-v1"
export const TECHNICAL_GATE_IDS = [
  "artifact-size",
  "offline-shell",
  "javascript-gzip",
  "leak-scan",
  "production-entry",
  "offline-worker",
  "web-manifest",
  "aw2-inventory",
  "public-inventory",
  "legal-artifacts",
  "rollback-runbook",
  "build-routing",
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
  "rollback-runbook": ["docs/aw2/ROLLBACK.md"],
  "build-routing": ["src/production.tsx", "vercel.json"],
}

const gate = (id, pass, observed = null, limit = null) => ({
  id,
  status: pass ? "PASS" : "FAIL",
  observed,
  limit,
})

export function createReleaseCandidateReport({ buildSize, presentPaths }) {
  const leakCount = Array.isArray(buildSize.leaks)
    ? buildSize.leaks.length
    : buildSize.leaks
  const gates = [
    gate(
      "artifact-size",
      buildSize.bytes <= 320_000_000,
      buildSize.bytes,
      320_000_000,
    ),
    gate(
      "offline-shell",
      buildSize.offlineShell?.bytes <= 12_000_000,
      buildSize.offlineShell?.bytes ?? null,
      12_000_000,
    ),
    gate(
      "javascript-gzip",
      buildSize.js_gzip <= 710_000,
      buildSize.js_gzip,
      710_000,
    ),
    gate("leak-scan", leakCount === 0, leakCount, 0),
    ...Object.entries(REQUIRED_PATHS).map(([id, paths]) =>
      gate(
        id,
        paths.every((path) => presentPaths.has(path)),
      ),
    ),
  ]
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
  const buildSizePath = resolve(root, "dev/docs/release/build-size.json")
  const buildSize = JSON.parse(readFileSync(buildSizePath, "utf8"))
  const paths = Object.values(REQUIRED_PATHS).flat()
  const presentPaths = new Set(
    paths.filter((path) => existsSync(resolve(root, path))),
  )
  return createReleaseCandidateReport({ buildSize, presentPaths })
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
