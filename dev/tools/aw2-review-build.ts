import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { join, relative } from "node:path"
import type { Plugin } from "vite"
import type { ReviewBuildInfo } from "../../src/aw2/review/feedback"

const ROOT = fileURLToPath(new URL("../../", import.meta.url))
const directories = ["src/aw2", "dev/aw2"]
const extra = [
  "dev/vite.aw2.config.ts",
  "dev/vite.dev.config.ts",
  "dev/tools/aw2-review-build.ts",
  "dev/tools/aw2-production-build.ts",
  "src/production.tsx",
  "src/productionRoute.ts",
  "src/OriginalChestApp.tsx",
  "src/production.css",
  "index.html",
  "vercel.json",
  "package.json",
  "pnpm-lock.yaml",
]
interface ReviewBuildInput {
  path: string
  bytes: Uint8Array
}
export function fingerprintReviewInputs(
  entries: readonly ReviewBuildInput[],
): string {
  const hash = createHash("sha256")
  const sorted = [...entries].sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
  )
  if (
    !sorted.length ||
    new Set(sorted.map((e) => e.path)).size !== sorted.length
  )
    throw Error("Invalid AW2 build inputs")
  for (const e of sorted)
    hash.update(e.path).update("\0").update(e.bytes).update("\0")
  return hash.digest("hex")
}
export function collectReviewBuild(
  mode: ReviewBuildInfo["mode"],
): ReviewBuildInfo {
  const paths: string[] = []
  const walk = (directory: string) => {
    for (const item of readdirSync(join(ROOT, directory), {
      withFileTypes: true,
    })) {
      const path = `${directory}/${item.name}`
      if (item.isDirectory()) walk(path)
      else if (/\.(ts|tsx|css|html|json|webp|wav)$/.test(item.name))
        paths.push(path)
    }
  }
  directories.forEach(walk)
  paths.push(...extra)
  return {
    version: 1,
    mode,
    baseGitSha: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim(),
    sourceDirty: !!execFileSync(
      "git",
      ["status", "--porcelain", "--", ...directories, ...extra],
      { cwd: ROOT, encoding: "utf8" },
    ).trim(),
    codeFingerprint: fingerprintReviewInputs(
      paths.map((path) => ({ path, bytes: readFileSync(join(ROOT, path)) })),
    ),
    inputFiles: paths.length,
  }
}
export function aw2ReviewBuild(): Plugin {
  const name = "virtual:aw2-review-build",
    resolved = `\0${name}`
  let mode: ReviewBuildInfo["mode"] = "source"
  return {
    name: "aw2-review-build-identity",
    configResolved(config) {
      mode = config.command === "build" ? "compiled" : "source"
    },
    resolveId(id) {
      if (id === name) return resolved
    },
    load(id) {
      if (id === resolved)
        return `export default ${JSON.stringify(collectReviewBuild(mode))}`
    },
    handleHotUpdate({ file, server }) {
      const path = relative(ROOT, file).replace(/\\/g, "/")
      if (
        !directories.some((d) => path.startsWith(`${d}/`)) ||
        !/\.(ts|tsx|css|html|json|webp|wav)$/.test(path)
      )
        return
      const module = server.moduleGraph.getModuleById(resolved)
      if (module) server.moduleGraph.invalidateModule(module)
      server.ws.send({ type: "full-reload", path: "/dev/aw2/world.html" })
    },
  }
}
