import { createHash } from "node:crypto"
import { lstat, readFile, readdir } from "node:fs/promises"
import { join, posix } from "node:path"
import type { Plugin, ResolvedConfig } from "vite"

export const PRODUCTION_PUBLIC_MANIFEST =
  "assets/production-public-manifest.json"

export const PRODUCTION_CORE_PUBLIC_FILES = [
  "favicon.ico",
  "manifest.webmanifest",
  "assets/brand/icon-192.png",
  "assets/brand/icon-512.png",
  "assets/fonts/font-1.woff2",
  "assets/fonts/font-2.woff2",
  "assets/fonts/font-3.woff2",
  "assets/fonts/font-4.woff2",
  "assets/fonts/font-5.woff2",
  "assets/fonts/font-6.woff2",
  "assets/fonts/font-7.woff2",
  "assets/fonts/font-8.woff2",
  "assets/fonts/font-9.woff2",
  "assets/fonts/font-10.woff2",
  "assets/fonts/font-11.woff2",
] as const

const exactFiles = new Set<string>([
  ...PRODUCTION_CORE_PUBLIC_FILES,
  "assets/brand/apple-touch-icon.png",
  "assets/brand/soul-of-meal.webp",
  "assets/music580/mode-chest.mp3",
  "assets/tcg/characters/anime/bach.webp",
])

function safeRelativePath(value: string) {
  const normalized = value.split("\\").join("/")
  const parts = normalized.split("/")
  return (
    normalized.length > 0 &&
    normalized === posix.normalize(normalized) &&
    !normalized.startsWith("/") &&
    parts.every(
      (part) => part && part !== "." && part !== ".." && !part.startsWith("."),
    )
  )
}

/** Public files required by AW2 shell or the only retained original surface. */
export function isProductionPublicAssetPath(value: string) {
  const path = value.split("\\").join("/")
  if (!safeRelativePath(path)) return false
  if (exactFiles.has(path)) return true
  if (/^legal\/[a-zA-Z0-9_-]+\.(?:html|txt)$/.test(path)) return true
  if (/^assets\/food\/full\/[a-z0-9-]+\.webp$/.test(path)) return true
  if (/^assets\/rpg\/spirit510\/portraits-[1-9][0-9]*\.webp$/.test(path))
    return true
  if (
    /^assets\/characters\/chefs593\/chef-[a-z0-9-]+-neutral\.webp$/.test(path)
  )
    return true
  return /^assets\/characters\/(?:familiar594|rare595|rare596|regional5910|spring5911|starters590)\/[a-z0-9-]+-portrait\.webp$/.test(
    path,
  )
}

export interface ProductionPublicAsset {
  path: string
  bytes: number
  sha256: string
}

export async function listProductionPublicAssets(publicDir: string) {
  const files: ProductionPublicAsset[] = []
  const visit = async (directory: string, prefix = ""): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name
      const full = join(directory, entry.name)
      const details = await lstat(full)
      if (details.isSymbolicLink())
        throw Error(
          `Production public assets cannot contain symlink: ${relative}`,
        )
      if (entry.isDirectory()) {
        await visit(full, relative)
        continue
      }
      if (!entry.isFile() || !isProductionPublicAssetPath(relative)) continue
      const source = await readFile(full)
      files.push({
        path: relative,
        bytes: source.byteLength,
        sha256: createHash("sha256").update(source).digest("hex"),
      })
    }
  }
  await visit(publicDir)
  return files.sort((a, b) => a.path.localeCompare(b.path))
}

/** Emits only the public files used by AW2 plus the original chest. */
export function productionPublicAssets(): Plugin {
  let config: ResolvedConfig
  return {
    name: "aw2-production-public-assets",
    apply: "build",
    configResolved(resolved) {
      config = resolved
    },
    async generateBundle() {
      const publicDir = join(config.root, "public")
      const files = await listProductionPublicAssets(publicDir)
      for (const file of files) {
        this.emitFile({
          type: "asset",
          fileName: file.path,
          source: await readFile(join(publicDir, file.path)),
        })
      }
      this.emitFile({
        type: "asset",
        fileName: PRODUCTION_PUBLIC_MANIFEST,
        source: `${JSON.stringify(
          {
            schema: 1,
            surface: "aw2-plus-original-chest",
            files,
            bytes: files.reduce((total, file) => total + file.bytes, 0),
          },
          null,
          2,
        )}\n`,
      })
    },
  }
}
