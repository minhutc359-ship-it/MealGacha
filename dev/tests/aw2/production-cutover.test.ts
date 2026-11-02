import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  AW2_PRODUCTION_ASSET_PREFIX,
  AW2_SOURCE_ASSET_PREFIX,
  isAw2ProductionRuntimePath,
  rewriteAw2AssetUrls,
  productionSurfaceContract,
  runtimeAw2Manifest,
} from "../../tools/aw2-production-build"
import { productionSurface } from "@/productionRoute"

const text = (path: string) => readFileSync(path, "utf8")

describe("018A production route allowlist", () => {
  it.each(["/chest", "/chest/"])(
    "retains only %s as original chest",
    (path) => {
      expect(productionSurface(path)).toBe("chest")
    },
  )

  it.each([
    "/",
    "/game",
    "/adventure",
    "/autochess",
    "/pvp",
    "/collection",
    "/achievements",
    "/wheel",
    "/settings",
    "/daily-quiz",
    "/taste-swipe",
    "/events",
    "/anything-else",
    "/dev/aw2/world.html",
    "/dev/aw2/index.html",
    "/chest/collection",
  ])("routes old surface %s to AW2", (path) => {
    expect(productionSurface(path)).toBe("aw2")
  })
})

describe("018M actual production module graph", () => {
  const graph = [
    "/repo/src/production.tsx",
    "/repo/dev/aw2/WorldGame.tsx",
    "/repo/src/pages/ChestPage.tsx",
  ]
  it("accepts only the new game with the original chest", () => {
    expect(productionSurfaceContract(graph)).toMatchObject({
      defaultSurface: "soul-of-meal-aw2",
      retainedLegacySurfaces: ["chest"],
      legacyPageCount: 1,
      reviewUiModules: 0,
      legacyEntryModules: 0,
    })
  })
  it.each([
    "/repo/src/App.tsx",
    "/repo/src/main.tsx",
    "/repo/src/pages/AdventurePage.tsx",
    "/repo/dev/aw2/CharacterReadinessDisclosure.tsx",
    "/repo/dev/aw2/PlaytestFeedback.tsx",
    "/repo/dev/aw2/free-play.tsx",
    "/repo/src/aw2/gacha/simulator.ts",
    "/repo/src/aw2/roster/readiness.ts",
  ])("refuses retired or internal UI %s", (id) => {
    expect(() => productionSurfaceContract([...graph, id])).toThrow(
      "entered production",
    )
  })
  it("refuses a graph that dropped the actual new game", () => {
    expect(() =>
      productionSurfaceContract(
        graph.filter((id) => !id.endsWith("WorldGame.tsx")),
      ),
    ).toThrow("new game")
  })
})

describe("018A production asset contract", () => {
  it("strips authoring provenance only, preserving every runtime asset/frame/skill value", () => {
    const raw = text("src/aw2/assets/forgotten-host.reference-v1.json"),
      before = JSON.parse(raw),
      runtime = JSON.parse(runtimeAw2Manifest(raw))
    expect(runtime.assets).toEqual(before.assets)
    expect(runtime.frames).toEqual(before.frames)
    expect(runtime.battle).toEqual(before.battle)
    expect(runtime.skills).toEqual(before.skills)
    expect(runtime.audio).toEqual(before.audio)
    expect(runtime).not.toHaveProperty("provenance")
    expect(runtime).not.toHaveProperty("motionProvenance")
    expect(JSON.parse(raw)).toHaveProperty("motionProvenance")
  })
  it("rewrites every AW2 source prefix without changing unrelated URLs", () => {
    expect(
      rewriteAw2AssetUrls(
        `a=${JSON.stringify(`${AW2_SOURCE_ASSET_PREFIX}than/world.webp`)};b="/assets/food/full/pho.webp"`,
      ),
    ).toBe(
      `a=${JSON.stringify(`${AW2_PRODUCTION_ASSET_PREFIX}than/world.webp`)};b="/assets/food/full/pho.webp"`,
    )
  })

  it.each([
    ["dev/aw2/assets/than/world.webp", true],
    ["dev/aw2/assets/than/basic.wav", true],
    ["dev/aw2/assets/than/runtime.json", true],
    ["dev/aw2/assets/than", true],
    ["dev/aw2/assets/than/provenance.json", false],
    ["dev/aw2/assets/than/motion-prompts.json", false],
    ["dev/aw2/assets/than/world-selection.json", false],
    ["dev/aw2/assets/than/spec.json", false],
    ["dev/aw2/assets/than/world.png", false],
    ["dev/aw2/assets/than/source.ts", false],
    ["dev/aw2/assets/than/.portrait.png.tmp", false],
    ["dev/aw2/assets/than/archive.zip", false],
  ] as const)("filters %s", (path, allowed) => {
    expect(isAw2ProductionRuntimePath(path)).toBe(allowed)
  })
})

describe("018A server build contract", () => {
  it("uses the production router instead of the stable main entry", () => {
    const html = text("index.html")
    expect(html).toContain("/src/production.tsx")
    expect(html).not.toContain("/src/main.tsx")
  })

  it("keeps Vercel on the guarded dist build with SPA fallback", () => {
    const config = JSON.parse(text("vercel.json"))
    expect(config.buildCommand).toBe("pnpm build")
    expect(config.outputDirectory).toBe("dist")
    expect(config.rewrites[0].destination).toBe("/index.html")
  })

  it("wires AW2 production assets and preserves the review build", () => {
    const production = text("vite.config.ts")
    const review = text("dev/vite.aw2.config.ts")
    expect(production).toContain("aw2ProductionBuild()")
    expect(production).toContain("aw2ReviewBuild()")
    expect(review).toContain('outDir: "dist-aw2"')
  })

  it("keeps old source for data compatibility but exposes only chest", () => {
    expect(text("src/main.tsx")).toContain('import("./App")')
    expect(text("src/production.tsx")).toContain(
      'productionSurface(location.pathname) === "chest"',
    )
    expect(text("src/OriginalChestApp.tsx")).toContain(
      "<ChestPage standalone />",
    )
  })
})
