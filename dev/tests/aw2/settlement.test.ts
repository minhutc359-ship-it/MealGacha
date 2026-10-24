import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { describe, it, expect } from "vitest"
import {
  SETTLEMENT,
  settlementForZone,
  settlementCameraSpec,
  settlementRoofAlpha,
} from "@/aw2/assets/settlement"
import {
  landscapeCamera,
  projectVillage,
  unprojectVillage,
} from "@/aw2/assets/villageView"
import { VILLAGE_SCENE } from "@/aw2/assets/village"
import { ZONE_IDS, type ZoneId } from "@/aw2/world/ids"
import { zoneById, canStand } from "@/aw2/world/maps"
import { findWorldPath, clearPath } from "@/aw2/world/navigation"
const hash = (p: string) =>
  createHash("sha256").update(readFileSync(p)).digest("hex")
it("binds two original transparent architecture atlases and eight safe frames without authority claims", () => {
  expect(Object.keys(SETTLEMENT.frames)).toHaveLength(8)
  expect(SETTLEMENT.fullEnvironmentComplete).toBe(false)
  expect(SETTLEMENT.geometryAuthorityChanged).toBe(false)
  expect(SETTLEMENT.provenance.licenseStatus).toBe("REVIEW_REQUIRED")
  for (const a of Object.values(SETTLEMENT.assets)) {
    expect(hash(a.url.slice(1))).toBe(a.sha256)
    expect(hash(a.source.path)).toBe(a.source.sha256)
    expect(readFileSync(a.url.slice(1)).length).toBe(a.bytes)
  }
  for (const r of [
    ...SETTLEMENT.provenance.prompts,
    ...SETTLEMENT.provenance.references,
  ])
    expect(hash(r.path)).toBe(r.sha256)
  for (const f of Object.values(SETTLEMENT.frames)) {
    expect(f.alphaEdgeMax).toBeLessThanOrEqual(8)
    expect(f.x).toBeGreaterThanOrEqual(f.cell.x)
    expect(f.y).toBeGreaterThanOrEqual(f.cell.y)
    expect(f.x + f.width).toBeLessThanOrEqual(f.cell.x + f.cell.width)
    expect(f.y + f.height).toBeLessThanOrEqual(f.cell.y + f.cell.height)
  }
})
describe.each(SETTLEMENT.regions)("006O $zoneId", (region) => {
  it("adds a dense varied neighborhood with solid bases outside legal saved positions", () => {
    expect(settlementForZone(region.zoneId)).toBe(region)
    expect(region.buildings.length).toBeGreaterThanOrEqual(10)
    expect(
      new Set(region.buildings.map((b) => b.frame)).size,
    ).toBeGreaterThanOrEqual(4)
    expect(new Set(region.buildings.map((b) => b.id)).size).toBe(
      region.buildings.length,
    )
    for (const b of region.buildings) {
      const f = b.solidBase
      expect(
        f.x + f.width <= 6 || f.x >= 634 || f.y + f.height <= 6 || f.y >= 378,
      ).toBe(true)
      expect(b.height / b.width).toBeCloseTo(
        SETTLEMENT.frames[(b.frame as keyof typeof SETTLEMENT.frames)].height /
          SETTLEMENT.frames[(b.frame as keyof typeof SETTLEMENT.frames)].width,
        5,
      )
    }
    expect(region.budget.compressedBytes).toBeLessThanOrEqual(
      region.budget.maxCompressedBytes,
    )
    expect(region.budget.decodedRgbaBytes).toBeLessThanOrEqual(
      region.budget.maxDecodedRgbaBytes,
    )
  })
  it("keeps all original NPCs, both spawns and landmark approaches reachable with collision-safe segments", () => {
    const zone = region.zoneId as ZoneId
    const goals = [
      ...zoneById(zone).objects.map((o) => ({
        x: o.x,
        y: o.y + (o.kind === "exit" ? 0 : 32),
      })),
      ...region.landmarks,
    ]
    for (const from of [
      { x: 64, y: 192 },
      { x: 576, y: 192 },
    ])
      for (const to of goals) {
        expect(canStand(zone, to.x, to.y)).toBe(true)
        const path = findWorldPath(zone, from, { x: to.x, y: to.y })
        expect(path.length).toBeGreaterThan(0)
        expect(path.at(-1)).toEqual({ x: to.x, y: to.y })
        let prev = from
        for (const p of path) {
          expect(clearPath(zone, prev, p)).toBe(true)
          prev = p
        }
      }
    expect(zoneById(zone).walls).toEqual([
      { x: 288, y: 304, width: 64, height: 48 },
    ])
  })
  it("projects unchanged coordinates with the denser default camera and preserves overview/inverse math", () => {
    const spec = settlementCameraSpec(VILLAGE_SCENE, region.zoneId)
    expect(spec.camera.followZoom).toBe(0.65)
    expect(spec.camera.overviewZoom).toBe(VILLAGE_SCENE.camera.overviewZoom)
    for (const mode of ["follow", "overview"] as const) {
      const view = landscapeCamera({ x: 320, y: 240 }, mode, spec)
      for (const p of region.landmarks) {
        const screen = projectVillage(p, view),
          world = unprojectVillage(screen, view)
        expect(world.x).toBeCloseTo(p.x, 10)
        expect(world.y).toBeCloseTo(p.y, 10)
      }
    }
  })
  it("fades overhanging roof only on actual overlap behind its ground depth", () => {
    const b = region.buildings.at(-1)!,
      actor = {
        x: b.x - 5,
        y: b.y - b.height + 5,
        width: 10,
        height: 20,
        groundY: b.y - 20,
      }
    expect(settlementRoofAlpha(b, [actor])).toBe(0.25)
    expect(settlementRoofAlpha(b, [{ ...actor, x: b.x + b.width }])).toBe(1)
    expect(settlementRoofAlpha(b, [{ ...actor, groundY: b.y + 1 }])).toBe(1)
    expect(settlementRoofAlpha(b, [])).toBe(1)
  })
})
it("adds32structures only to outdoor regions and leaves interior camera alone", () => {
  expect(SETTLEMENT.regions.reduce((n, r) => n + r.buildings.length, 0)).toBe(
    32,
  )
  expect(settlementForZone(ZONE_IDS[3])).toBeUndefined()
  expect(settlementCameraSpec(VILLAGE_SCENE, ZONE_IDS[3])).toBe(VILLAGE_SCENE)
})
