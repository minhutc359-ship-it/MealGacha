import { execFileSync } from "node:child_process"
import { lstatSync, readFileSync } from "node:fs"
import { resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

export const AW2_CRITICAL_SOURCE_PREFIXES = [
  "dev/aw2/",
  "dev/tools/",
  "docs/aw2/evidence/",
  "public/",
  "rights/aw2/",
  "src/",
]

export const AW2_CRITICAL_SOURCE_FILES = [
  ".gitattributes",
  ".github/workflows/web.yml",
  "index.html",
  "package.json",
  "pnpm-lock.yaml",
  "releaseGuard.mjs",
  "vercel.json",
  "vite.config.ts",
  "web-service-worker.js",
  "webOffline.ts",
]

const lfsHeader = "version https://git-lfs.github.com/spec/v1\n"

export function isSafeTrackedPath(value) {
  if (
    typeof value !== "string" ||
    !value ||
    value.includes("\\") ||
    value.startsWith("/") ||
    value.includes("\0")
  )
    return false
  const parts = value.split("/")
  return parts.every((part) => part && part !== "." && part !== "..")
}

export function isAw2CriticalSourcePath(value) {
  if (!isSafeTrackedPath(value)) return false
  return (
    AW2_CRITICAL_SOURCE_FILES.includes(value) ||
    AW2_CRITICAL_SOURCE_PREFIXES.some((prefix) => value.startsWith(prefix))
  )
}

export function isGitLfsPointer(data) {
  if (!Buffer.isBuffer(data) || data.byteLength > 1024) return false
  const text = data.toString("utf8").replace(/\r\n/g, "\n")
  return (
    text.startsWith(lfsHeader) &&
    /^oid sha256:[0-9a-f]{64}$/m.test(text) &&
    /^size [1-9][0-9]*$/m.test(text)
  )
}

export function inspectAw2CriticalFiles(root, trackedFiles) {
  if (!Array.isArray(trackedFiles) || trackedFiles.length === 0)
    throw Error("Git tracked-file inventory is empty")
  if (new Set(trackedFiles).size !== trackedFiles.length)
    throw Error("Git tracked-file inventory contains duplicates")
  for (const path of trackedFiles)
    if (!isSafeTrackedPath(path)) throw Error(`Unsafe tracked path: ${path}`)

  const criticalFiles = trackedFiles.filter(isAw2CriticalSourcePath).sort()
  for (const required of AW2_CRITICAL_SOURCE_FILES)
    if (!criticalFiles.includes(required))
      throw Error(`Missing critical tracked file: ${required}`)
  for (const prefix of AW2_CRITICAL_SOURCE_PREFIXES)
    if (!criticalFiles.some((path) => path.startsWith(prefix)))
      throw Error(`Missing critical tracked root: ${prefix}`)

  let bytes = 0
  for (const path of criticalFiles) {
    const full = resolve(root, path)
    if (!full.startsWith(`${resolve(root)}${sep}`))
      throw Error(`Critical path escaped checkout: ${path}`)
    const stat = lstatSync(full)
    if (stat.isSymbolicLink())
      throw Error(`Critical source cannot be a symlink: ${path}`)
    if (!stat.isFile()) throw Error(`Critical source is not a file: ${path}`)
    const data = readFileSync(full)
    if (isGitLfsPointer(data))
      throw Error(`Git LFS pointer found in critical source: ${path}`)
    bytes += data.byteLength
  }
  return {
    status: "PASS",
    trackedFiles: trackedFiles.length,
    criticalFiles: criticalFiles.length,
    criticalBytes: bytes,
    lfsPointers: 0,
    symlinks: 0,
  }
}

export function verifyAw2SourceCheckout(root = process.cwd()) {
  let output
  try {
    output = execFileSync("git", ["ls-files", "-z"], {
      cwd: root,
      encoding: "buffer",
      maxBuffer: 16 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    })
  } catch (error) {
    throw Error(`Cannot read Git tracked-file inventory: ${error.message}`)
  }
  const trackedFiles = output.toString("utf8").split("\0").filter(Boolean)
  return inspectAw2CriticalFiles(root, trackedFiles)
}

function main() {
  process.stdout.write(`${JSON.stringify(verifyAw2SourceCheckout())}\n`)
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main()
