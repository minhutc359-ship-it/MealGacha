import { createHash } from "node:crypto"
import { cp, lstat, mkdir, readFile, readdir } from "node:fs/promises"
import { basename, extname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import type { Plugin, ResolvedConfig } from "vite"
import {
  worldLeaderAssetUrls,
  worldSceneAssetGroups,
} from "../../src/aw2/assets/worldAssets"

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

function productionAssetCatalog(assets: RuntimeAsset[]) {
  const byPath = new Map(assets.map((asset) => [asset.path, asset]))
  const productionUrls = (urls: readonly string[]) =>
    [...new Set(urls)]
      .map((url) => {
        if (!url.startsWith(AW2_SOURCE_ASSET_PREFIX))
          throw Error(`Unexpected AW2 scene asset URL: ${url}`)
        const relative = url.slice(AW2_SOURCE_ASSET_PREFIX.length)
        if (!byPath.has(relative))
          throw Error(`AW2 scene catalog asset is not packaged: ${relative}`)
        return `${AW2_PRODUCTION_ASSET_PREFIX}${relative}`
      })
      .sort()
  const bytesFor = (urls: readonly string[]) =>
    urls.reduce((total, url) => {
      const relative = url.slice(AW2_PRODUCTION_ASSET_PREFIX.length)
      return total + (byPath.get(relative)?.bytes ?? 0)
    }, 0)
  const sceneGroups = worldSceneAssetGroups().map((group) => {
    const urls = productionUrls(group.urls)
    return { sceneId: group.sceneId, urls, bytes: bytesFor(urls) }
  })
  const leaderUrls = productionUrls(worldLeaderAssetUrls())
  return {
    sceneGroups,
    worldLeaders: { urls: leaderUrls, bytes: bytesFor(leaderUrls) },
  }
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
      const catalog = productionAssetCatalog(assets)
      this.emitFile({
        type: "asset",
        fileName: AW2_PRODUCTION_INVENTORY,
        source: `${JSON.stringify(
          {
            schema: 2,
            sourcePrefix: AW2_SOURCE_ASSET_PREFIX,
            productionPrefix: AW2_PRODUCTION_ASSET_PREFIX,
            assets,
            bytes: assets.reduce((total, asset) => total + asset.bytes, 0),
            ...catalog,
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
