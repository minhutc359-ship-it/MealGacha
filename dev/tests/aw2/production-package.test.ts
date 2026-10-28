import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { FOOD_ASSET_IDS } from "@/infrastructure/assets/foodAssets"
import { MUSIC_TRACKS } from "@/game/audioScore"
import { SPIRIT_IDS, spiritArt } from "@/game/adventureRpg/spiritArt"
import {
  PRODUCTION_CORE_PUBLIC_FILES,
  isProductionPublicAssetPath,
} from "../../tools/production-public-assets"
import { offlineCoreBundleNames } from "../../../webOffline"

describe("018B selective production public assets", () => {
  it.each([
    ["favicon.ico", true],
    ["manifest.webmanifest", true],
    ["legal/privacy.html", true],
    ["assets/brand/icon-512.png", true],
    ["assets/fonts/font-1.woff2", true],
    ["assets/food/full/pho-bo.webp", true],
    ["assets/music580/mode-chest.mp3", true],
    ["assets/music580/mode-tcg.mp3", false],
    ["assets/rpg/spirit510/portraits-1.webp", true],
    ["assets/rpg/spirit510/skills.webp", false],
    ["assets/characters/rare595/banh-chung-portrait.webp", true],
    ["assets/characters/rare595/banh-chung.webp", false],
    ["assets/characters/campaign598/tea-oracle-portrait.webp", false],
    ["assets/autochess/world.webp", false],
    ["assets/events/hanoi-autumn/banner.webp", false],
    ["assets/tcg/characters/anime/bach.webp", true],
    ["assets/tcg/characters/anime/hero.webp", false],
    ["../public/favicon.ico", false],
    ["assets/food/full/.draft.webp", false],
    ["assets\\food\\full\\pho-bo.webp", true],
  ] as const)("filters %s", (path, expected) => {
    expect(isProductionPublicAssetPath(path)).toBe(expected)
  })

  it("keeps every original chest food and every resolved spirit portrait", () => {
    for (const id of FOOD_ASSET_IDS) {
      const path = `assets/food/full/${id}.webp`
      expect(isProductionPublicAssetPath(path), path).toBe(true)
      expect(existsSync(`public/${path}`), path).toBe(true)
    }
    for (const id of SPIRIT_IDS) {
      const art = spiritArt(id)
      expect(art, id).not.toBeNull()
      const path = art!.path.slice(1)
      expect(isProductionPublicAssetPath(path), `${id}: ${path}`).toBe(true)
      expect(existsSync(`public/${path}`), `${id}: ${path}`).toBe(true)
    }
  })

  it("retains only the original chest soundtrack", () => {
    for (const [track, path] of Object.entries(MUSIC_TRACKS))
      expect(isProductionPublicAssetPath(path), track).toBe(
        track === "mode-chest",
      )
  })

  it("keeps every declared offline public core file", () => {
    for (const path of PRODUCTION_CORE_PUBLIC_FILES)
      expect(existsSync(`public/${path}`), path).toBe(true)
  })

  it("disables wholesale Vite public copying before the selector", () => {
    const config = readFileSync("vite.config.ts", "utf8")
    expect(config).toContain("publicDir: false")
    expect(config).toContain("productionPublicAssets()")
  })

  it("keeps legacy battle styles out of the original chest bundle", () => {
    const app = readFileSync("src/OriginalChestApp.tsx", "utf8")
    const card = readFileSync(
      "src/components/chest/ChestSpiritCard.tsx",
      "utf8",
    )
    expect(app).not.toContain("presentation440.css")
    expect(card).not.toContain("adventureRpg/rpg.css")
    expect(card).toContain("ChestSpiritCard.css")
  })
})

describe("018C offline code graph", () => {
  it("preloads entry and static AW2 dependencies while keeping scene/chest chunks lazy", () => {
    const chunk = (
      modules: string[],
      options: Partial<{
        isEntry: boolean
        imports: string[]
        dynamicImports: string[]
      }> = {},
    ) => ({
      type: "chunk" as const,
      modules: Object.fromEntries(modules.map((id) => [id, {}])),
      imports: [],
      dynamicImports: [],
      ...options,
    })
    const names = offlineCoreBundleNames({
      "assets/entry.js": chunk(["/src/production.tsx"], {
        isEntry: true,
        dynamicImports: ["assets/aw2.js", "assets/original-chest.js"],
      }),
      "assets/aw2.js": chunk(["/dev/aw2/world.tsx"], {
        imports: ["assets/pixi.js"],
        dynamicImports: ["assets/aw2-scene.js"],
      }),
      "assets/aw2-scene.js": chunk(["/dev/aw2-scenes/VillageLandscape.tsx"]),
      "assets/pixi.js": chunk(["/node_modules/pixi.js/index.mjs"]),
      "assets/original-chest.js": chunk(["/src/OriginalChestApp.tsx"]),
      "assets/original-chest.css": { type: "asset", source: "" },
      "assets/app.css": { type: "asset", source: "" },
    })
    expect(names).toEqual([
      "assets/app.css",
      "assets/aw2.js",
      "assets/entry.js",
      "assets/pixi.js",
    ])
  })

  it("warms visited media and lazy code without broadening player storage scope", () => {
    const worker = readFileSync("web-service-worker.js", "utf8")
    const client = readFileSync("src/infrastructure/web/offline.ts", "utf8")
    expect(worker).toContain("webp|png|jpg|mp3|wav")
    expect(client).toContain("webp|png|jpe?g|mp3|wav")
    expect(worker).toContain("wav|js|css")
    expect(client).toContain("wav|js|css")
    expect(client).toContain("warmPasses >= 2")
    expect(worker).not.toContain("localStorage")
    expect(worker).not.toContain("indexedDB")
  })
})

describe("018D production PWA contract", () => {
  it("publishes an installable root manifest with only current product shortcuts", () => {
    const manifest = JSON.parse(
      readFileSync("public/manifest.webmanifest", "utf8"),
    ) as {
      id: string
      scope: string
      start_url: string
      display: string
      lang: string
      icons: Array<Record<"sizes" | "src", string>>
      shortcuts: Array<Record<"url", string>>
    }
    expect(manifest).toMatchObject({
      id: "/",
      scope: "/",
      start_url: "/",
      display: "standalone",
      lang: "vi",
    })
    expect(manifest.icons.map((icon) => icon.sizes)).toEqual([
      "192x192",
      "512x512",
    ])
    expect(
      manifest.icons.every((icon) => existsSync(`public${icon.src}`)),
    ).toBe(true)
    expect(manifest.shortcuts.map((shortcut) => shortcut.url)).toEqual([
      "/",
      "/chest",
    ])
  })

  it("makes update and readiness controls reachable from the AW2 production UI", () => {
    const entry = readFileSync("src/production.tsx", "utf8")
    const game = readFileSync("dev/aw2/WorldGame.tsx", "utf8")
    const world = readFileSync("dev/aw2/world.tsx", "utf8")
    expect(entry).toContain('import("./components/layout/WebUpdatePrompt")')
    expect(entry).toContain("<WebUpdatePrompt />")
    expect(game).toContain("<WebReadiness compact />")
    expect(game).toContain("props.production && <WebReadiness")
    expect(game).toContain("Phục hồi bản an toàn")
    expect(world).toContain("store.inspectRecovery()")
    expect(world).toContain("await store.recover(")
    expect(world).toContain("AW2_SAVE_STORAGE_KEYS.some")
  })

  it("keeps recovery bounded to Soul of Meal caches and explicit updates", () => {
    const worker = readFileSync("web-service-worker.js", "utf8")
    expect(worker).toContain("await caches.delete(CORE)")
    expect(worker).toContain("shellFromCurrentOrPrevious")
    expect(worker).toContain("trimMedia(cache, body.size, 1)")
    expect(worker).toContain("WEB_CACHE_STATUS")
    expect(worker).toContain("APPLY_WEB_UPDATE")
    expect(worker).not.toContain("caches.keys()).map(key => caches.delete")
    expect(worker).not.toContain("localStorage")
    expect(worker).not.toContain("indexedDB")
  })
})
