import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { productionRoute } from "@/productionRoute"
import {
  tacticalProductionSurfaceContract,
  tacticalReleaseSourceIdentity,
} from "../../tools/tactical-tcg-production-build"
const text = (path: string) => readFileSync(path, "utf8")
describe("Tactical production cutover", () => {
  it.each([
    ["/", "tcg", null],
    ["/chest", "chest", null],
    ["/manga", "redirect", "/?tab=manga"],
    ["/pvp", "redirect", "/?tab=play&queue=pvp"],
    ["/game", "redirect", "/"],
    ["/adventure/world", "redirect", "/"],
  ] as const)("routes %s", (path, surface, destination) =>
    expect(productionRoute(path)).toEqual({ surface, destination }),
  )
  it("allows only Tactical, Manga, Chest and legal modules", () =>
    expect(
      tacticalProductionSurfaceContract([
        "/repo/src/production.tsx",
        "/repo/src/TacticalTcgApp.tsx",
        "/repo/src/pages/TCGPage.tsx",
        "/repo/src/OriginalChestApp.tsx",
        "/repo/src/pages/ChestPage.tsx",
      ]),
    ).toMatchObject({
      defaultSurface: "soul-of-meal-tactical-tcg",
      retainedSurfaces: ["manga", "chest", "legal"],
    }))
  it.each([
    "/repo/src/App.tsx",
    "/repo/src/pages/AutoChessPage.tsx",
    "/repo/dev/aw2/WorldGame.tsx",
    "/repo/src/components/layout/ModeSwitch.tsx",
  ])("rejects retired module %s", (id) =>
    expect(() =>
      tacticalProductionSurfaceContract([
        "/repo/src/production.tsx",
        "/repo/src/TacticalTcgApp.tsx",
        "/repo/src/pages/TCGPage.tsx",
        "/repo/src/OriginalChestApp.tsx",
        "/repo/src/pages/ChestPage.tsx",
        id,
      ]),
    ).toThrow("entered production"),
  )
  it("uses complete verifiable revisions", () => {
    expect(tacticalReleaseSourceIdentity({})).toEqual({
      provider: "local",
      revision: null,
    })
    expect(
      tacticalReleaseSourceIdentity({ GITHUB_SHA: "a".repeat(40) }),
    ).toEqual({ provider: "github", revision: "a".repeat(40) })
    expect(() =>
      tacticalReleaseSourceIdentity({ GITHUB_SHA: "short" }),
    ).toThrow("complete Git SHA")
  })
  it("boots Tactical after migration and lazy-loads Chest", () => {
    const source = text("src/production.tsx")
    expect(source).toContain("migrateTacticalStorage(localStorage)")
    expect(source.indexOf("migrateTacticalStorage")).toBeLessThan(
      source.indexOf("TacticalTcgApp"),
    )
    expect(source).toContain('import("./OriginalChestApp")')
    expect(source).not.toContain("WorldPreview")
  })
})
