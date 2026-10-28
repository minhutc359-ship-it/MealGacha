import { cp, mkdir, readdir } from "node:fs/promises"
import { basename, extname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import type { Plugin, ResolvedConfig } from "vite"

export const AW2_SOURCE_ASSET_PREFIX = "/dev/aw2/assets/"
export const AW2_PRODUCTION_ASSET_PREFIX = "/assets/aw2/"

const root = fileURLToPath(new URL("../../", import.meta.url))
const runtimeExtensions = new Set([".json", ".wav", ".webp"])
const authoringJson = /(?:^|[-])(provenance|prompts|selection|spec)\.json$/

export function rewriteAw2AssetUrls(code: string) {
  return code.split(AW2_SOURCE_ASSET_PREFIX).join(AW2_PRODUCTION_ASSET_PREFIX)
}

export function isAw2ProductionRuntimePath(path: string) {
  const name = basename(path)
  if (name.startsWith(".")) return false
  const extension = extname(name).toLowerCase()
  if (!extension) return true
  if (extension === ".json" && authoringJson.test(name)) return false
  return runtimeExtensions.has(extension)
}

/** Production-only URL rewrite and source-safe runtime asset copy. */
export function aw2ProductionBuild(): Plugin {
  let config: ResolvedConfig
  return {
    name: "aw2-production-build",
    apply: "build",
    enforce: "pre",
    configResolved(resolved) {
      config = resolved
    },
    transform(code, id) {
      if (
        !id.includes("/src/aw2/") &&
        !id.includes("/dev/aw2/") &&
        !code.includes(AW2_SOURCE_ASSET_PREFIX)
      )
        return
      const rewritten = rewriteAw2AssetUrls(code)
      return rewritten === code ? undefined : rewritten
    },
    async closeBundle() {
      const source = join(root, "dev/aw2/assets")
      const outDir = resolve(root, config.build.outDir)
      const destination = join(outDir, "assets/aw2")
      await mkdir(destination, { recursive: true })
      await cp(source, destination, {
        recursive: true,
        filter: async (path) => isAw2ProductionRuntimePath(path),
      })
      const inspect = async (directory: string): Promise<void> => {
        for (const item of await readdir(directory, { withFileTypes: true })) {
          const path = join(directory, item.name)
          if (item.isDirectory()) await inspect(path)
          else if (!runtimeExtensions.has(extname(item.name).toLowerCase()))
            throw Error(`Unexpected AW2 production asset: ${path}`)
        }
      }
      await inspect(destination)
    },
  }
}
