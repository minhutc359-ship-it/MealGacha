import { createHash } from "node:crypto"
import { lstat, readFile, readdir } from "node:fs/promises"
import { join, posix } from "node:path"
import type { Plugin, ResolvedConfig } from "vite"
import modelAssets from "../../src/game/tacticalTcg/presentation/model-assets.json"
export const PRODUCTION_PUBLIC_MANIFEST =
  "assets/production-public-manifest.json"
export const PRODUCTION_CORE_PUBLIC_FILES = [
  "favicon.ico",
  "manifest.webmanifest",
  "legal/privacy.html",
  "legal/terms.html",
  "legal/rights.html",
  "assets/brand/icon-192.png",
  "assets/brand/icon-512.png",
  ...Array.from(
    { length: 11 },
    (_, index) => `assets/fonts/font-${index + 1}.woff2`,
  ),
] as const
const allowedExtensions = new Set([
  "html",
  "ico",
  "jpg",
  "json",
  "mp3",
  "png",
  "svg",
  "txt",
  "wav",
  "webmanifest",
  "webp",
  "woff2",
])
const exactFiles = new Set<string>([
  ...modelAssets.map((path) => path.replace(/^\//, "")),
  ...PRODUCTION_CORE_PUBLIC_FILES,
  "assets/brand/apple-touch-icon.png",
  "assets/brand/soul-of-meal.webp",
  "assets/music580/mode-chest.mp3",
  "assets/music580/mode-tcg.mp3",
  "assets/music580/mode-autochess.mp3",
  "assets/music580/mode-adventure.mp3",
  "assets/music580/map-lantern.mp3",
  "assets/music580/map-harbor.mp3",
  "assets/music580/map-garden.mp3",
  "assets/music580/map-tide.mp3",
  "assets/music580/map-tea.mp3",
  "assets/music580/map-salt.mp3",
  "assets/music580/map-lotus.mp3",
  "assets/music580/map-aroma.mp3",
  "assets/music580/boss.mp3",
])
function safeRelativePath(value: string) {
  const normalized = value.split("\\").join("/"),
    parts = normalized.split("/")
  return (
    normalized.length > 0 &&
    normalized === posix.normalize(normalized) &&
    !normalized.startsWith("/") &&
    parts.every(
      (part) => part && part !== "." && part !== ".." && !part.startsWith("."),
    )
  )
}
export function isProductionPublicAssetPath(value: string) {
  const path = value.split("\\").join("/")
  if (!safeRelativePath(path)) return false
  const extension = path.includes(".")
    ? path.slice(path.lastIndexOf(".") + 1).toLowerCase()
    : ""
  if (!allowedExtensions.has(extension)) return false
  if (
    exactFiles.has(path) ||
    /^legal\/[a-zA-Z0-9_-]+\.(?:html|txt)$/.test(path)
  )
    return true
  if (
    /^assets\/(?:tcg|intro-manga5918)\/[a-zA-Z0-9_./-]+\.(?:json|svg|webp)$/.test(
      path,
    )
  )
    return true
  if (/^assets\/manga591[56]\/tcg\/[a-z0-9-]+\.(?:json|webp)$/.test(path))
    return true
  if (/^assets\/food\/full\/[a-z0-9-]+\.webp$/.test(path)) return true
  if (/^assets\/rpg\/spirit510\/portraits-[1-9][0-9]*\.webp$/.test(path))
    return true
  if (
    /^assets\/characters\/(?:chefs593\/chef-[a-z0-9-]+-neutral|campaign59[89]\/[a-z0-9-]+-portrait|familiar594\/[a-z0-9-]+-portrait|rare59[56]\/[a-z0-9-]+-portrait|regional5910\/[a-z0-9-]+-portrait|spring5911\/[a-z0-9-]+-portrait|starters590\/[a-z0-9-]+-portrait)\.webp$/.test(
      path,
    )
  )
    return true
  return false
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
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name,
        full = join(directory, entry.name),
        details = await lstat(full)
      if (details.isSymbolicLink())
        throw Error(`Production public asset cannot be a symlink: ${relative}`)
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
export function productionPublicAssets(): Plugin {
  let config: ResolvedConfig
  return {
    name: "tactical-tcg-production-public-assets",
    apply: "build",
    configResolved(resolved) {
      config = resolved
    },
    async generateBundle() {
      const publicDir = join(config.root, "public"),
        files = await listProductionPublicAssets(publicDir)
      for (const file of files)
        this.emitFile({
          type: "asset",
          fileName: file.path,
          source: await readFile(join(publicDir, file.path)),
        })
      this.emitFile({
        type: "asset",
        fileName: PRODUCTION_PUBLIC_MANIFEST,
        source: `${JSON.stringify({ schema: 1, surface: "tactical-tcg-plus-manga-chest", files, bytes: files.reduce((total, file) => total + file.bytes, 0) }, null, 2)}\n`,
      })
    },
  }
}
