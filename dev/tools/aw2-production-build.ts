import { createHash } from "node:crypto"
import { cp, lstat, mkdir, readFile, readdir } from "node:fs/promises"
import { basename, extname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import type { Plugin, ResolvedConfig } from "vite"

export const AW2_SOURCE_ASSET_PREFIX = "/dev/aw2/assets/"
export const AW2_PRODUCTION_ASSET_PREFIX = "/assets/aw2/"

const root = fileURLToPath(new URL("../../", import.meta.url))
const runtimeExtensions = new Set([".json", ".wav", ".webp"])
const authoringJson = /(?:^|[-])(provenance|prompts|selection|spec)\.json$/
export const AW2_PRODUCTION_INVENTORY = "assets/aw2/inventory.json"

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

interface RuntimeAsset {
  path: string
  bytes: number
  sha256: string
}

async function runtimeInventory(source: string) {
  const assets: RuntimeAsset[] = []
  const visit = async (directory: string, prefix = ""): Promise<void> => {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      if (item.name.startsWith(".")) continue
      const relative = prefix ? `${prefix}/${item.name}` : item.name
      const path = join(directory, item.name)
      const details = await lstat(path)
      if (details.isSymbolicLink())
        throw Error(`AW2 production assets cannot contain symlink: ${relative}`)
      if (item.isDirectory()) {
        await visit(path, relative)
        continue
      }
      if (!item.isFile() || !isAw2ProductionRuntimePath(path)) continue
      const sourceBytes = await readFile(path)
      assets.push({
        path: relative.split("\\").join("/"),
        bytes: sourceBytes.byteLength,
        sha256: createHash("sha256").update(sourceBytes).digest("hex"),
      })
    }
  }
  await visit(source)
  return assets.sort((a, b) => a.path.localeCompare(b.path))
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
    async generateBundle() {
      const assets = await runtimeInventory(join(root, "dev/aw2/assets"))
      this.emitFile({
        type: "asset",
        fileName: AW2_PRODUCTION_INVENTORY,
        source: `${JSON.stringify(
          {
            schema: 1,
            sourcePrefix: AW2_SOURCE_ASSET_PREFIX,
            productionPrefix: AW2_PRODUCTION_ASSET_PREFIX,
            assets,
            bytes: assets.reduce((total, asset) => total + asset.bytes, 0),
          },
          null,
          2,
        )}\n`,
      })
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
          if (item.name.startsWith(".")) continue
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
