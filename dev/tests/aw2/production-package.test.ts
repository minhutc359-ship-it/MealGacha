import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  isProductionPublicAssetPath,
  PRODUCTION_CORE_PUBLIC_FILES,
} from "../../tools/production-public-assets"
import { offlineCoreBundleNames } from "../../../webOffline"
describe("Tactical production package", () => {
  it.each([
    ["favicon.ico", true],
    ["manifest.webmanifest", true],
    ["legal/privacy.html", true],
    ["assets/brand/icon-512.png", true],
    ["assets/music580/mode-chest.mp3", true],
    ["assets/music580/mode-autochess.mp3", true],
    ["assets/tcg/characters/anime/bach.webp", true],
    ["assets/manga5915/tcg/moon.webp", true],
    ["assets/manga5915/adventure/moon.webp", false],
    ["assets/characters/campaign599/salt-scarab-portrait.webp", true],
    ["assets/autochess/world.webp", false],
    ["assets/.draft.webp", false],
    ["../public/favicon.ico", false],
    ["assets/source.psd", false],
  ] as const)("filters %s", (path, expected) =>
    expect(isProductionPublicAssetPath(path)).toBe(expected),
  )
  it("keeps every offline core file", () => {
    for (const path of PRODUCTION_CORE_PUBLIC_FILES)
      expect(existsSync(`public/${path}`), path).toBe(true)
  })
  it("preloads Tactical but leaves Chest lazy", () => {
    const chunk = (modules: string[], extra: Record<string, unknown> = {}) => ({
      type: "chunk",
      modules: Object.fromEntries(modules.map((id) => [id, {}])),
      imports: [],
      dynamicImports: [],
      ...extra,
    })
    expect(
      offlineCoreBundleNames({
        "assets/entry.js": chunk(["/src/production.tsx"], {
          isEntry: true,
          dynamicImports: ["assets/tactical.js", "assets/chest.js"],
        }),
        "assets/tactical.js": chunk(["/src/TacticalTcgApp.tsx"]),
        "assets/chest.js": chunk(["/src/OriginalChestApp.tsx"]),
        "assets/app.css": { type: "asset", source: "" },
      }),
    ).toEqual(["assets/app.css", "assets/entry.js", "assets/tactical.js"])
  })
  it("publishes exactly current shortcuts", () =>
    expect(
      JSON.parse(
        readFileSync("public/manifest.webmanifest", "utf8"),
      ).shortcuts.map((item: { url: string }) => item.url),
    ).toEqual(["/", "/?tab=manga", "/chest"]))
})
