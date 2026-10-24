import { readFileSync, statSync } from "node:fs"
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  HEARTH_ROOM_SCENE as scene,
  hearthRoomWaypoints,
  hearthRoomProps,
} from "@/aw2/assets/hearthRoom"
import { TABLE_ROOM_SCENE } from "@/aw2/assets/tableRoom"
import { TABLE_ROOM_INTERACTIONS } from "@/aw2/assets/tableInteractions"
import { newWorldProgress, worldProgressSchema } from "@/aw2/world/model"
import { ZONE_IDS, STARTER_TEAM, MEMORY_IDS } from "@/aw2/world/ids"
import { canStand, zoneById } from "@/aw2/world/maps"
import { clearPath, findWorldPath } from "@/aw2/world/navigation"
import { describeObject } from "@/aw2/world/rules"

function progress(step = 0, hint = true) {
  return worldProgressSchema.parse({
    ...newWorldProgress(),
    zoneId: ZONE_IDS[4],
    x: 64,
    y: 192,
    questIndex: 2,
    accepted: true,
    tableRead: true,
    memories: [...MEMORY_IDS],
    threadChoice: "wait",
    partyIds: [...STARTER_TEAM],
    hintRead: hint,
    puzzleStep: step,
  })
}
const hash = (p: string) =>
  createHash("sha256").update(readFileSync(p)).digest("hex")
describe("006F hearth scene derives truthful appearance from unchanged world authority", () => {
  it("keeps canonical room/obstacle, honest status, original reuse and measured budgets", () => {
    expect(scene.zoneId).toBe(ZONE_IDS[4])
    expect(scene.canvas).toEqual({ width: 640, height: 384 })
    expect(scene.prop).toEqual(TABLE_ROOM_SCENE.prop)
    expect(scene.prop.footprint).toEqual(zoneById(ZONE_IDS[4]).walls[0])
    expect(scene.assets.sideboard).toEqual(TABLE_ROOM_SCENE.assets.sideboard)
    expect(scene.assets.threshold).toEqual(
      TABLE_ROOM_INTERACTIONS.assets.threshold,
    )
    expect(scene.fullEnvironmentComplete).toBe(false)
    expect(scene.provenance.licenseStatus).toBe("REVIEW_REQUIRED")
    expect(scene.provenance.commercialRelease).toBe("NOT_CLEARED")
    expect(scene.budget.compressedBytes).toBe(
      Object.values(scene.assets).reduce((sum, a) => sum + a.bytes, 0),
    )
    expect(scene.budget.compressedBytes).toBeLessThanOrEqual(
      scene.budget.maxCompressedBytes,
    )
    expect(scene.budget.decodedRgbaBytes).toBe(
      Object.values(scene.assets).reduce(
        (sum, a) => sum + a.width * a.height * 4,
        0,
      ),
    )
    expect(scene.budget.decodedRgbaBytes).toBeLessThanOrEqual(
      scene.budget.maxDecodedRgbaBytes,
    )
  })
  it.each(["floor", "puzzles", "sideboard", "threshold"] as const)(
    "binds %s to actual source/runtime hashes/bytes",
    (key) => {
      const a = scene.assets[key]
      expect(hash(a.url.slice(1))).toBe(a.sha256)
      expect(hash(a.source.path)).toBe(a.source.sha256)
      expect(statSync(a.url.slice(1)).size).toBe(a.bytes)
    },
  )
  it("preserves prompt/reference chain and three distinct safe frames with uniform prop ratios", () => {
    for (const p of [scene.provenance.prompts, scene.provenance.reference])
      expect(hash(p.path)).toBe(p.sha256)
    expect(Object.keys(scene.frames)).toEqual(["vent", "pot", "brazier"])
    for (const [key, f] of Object.entries(scene.frames)) {
      expect(f.x).toBeGreaterThan(0)
      expect(f.y).toBeGreaterThan(0)
      expect(f.x + f.width).toBeLessThan(scene.assets.puzzles.width)
      expect(f.y + f.height).toBeLessThan(scene.assets.puzzles.height)
      const p = scene.props.find((p) => p.frame === key)!
      expect(p.width / p.height).toBeCloseTo(f.width / f.height, 5)
      expect(p.width).toBeLessThanOrEqual(44)
      expect(p.height).toBeLessThanOrEqual(34)
    }
  })
  it.each([0, 1, 2, 3])(
    "step %s matches native exit permission and ordered prop states without mutation",
    (step) => {
      const p = progress(step),
        before = JSON.stringify(p),
        points = hearthRoomWaypoints(p),
        props = hearthRoomProps(p)
      expect(points).toHaveLength(5)
      expect(props).toHaveLength(5)
      for (const point of points) {
        const object = zoneById(p.zoneId).objects.find(
          (o) => o.id === point.id,
        )!
        expect([point.name, point.x, point.y]).toEqual([
          object.name,
          object.x,
          object.y,
        ])
        if (object.kind === "exit")
          expect(point.locked).toBe(
            !describeObject(p, object).actions.some((a) => a.id === "travel"),
          )
        else
          expect(point.state).toBe(
            step === 3
              ? "solved"
              : object.step! < step
                ? "done"
                : object.step === step
                  ? "ready"
                  : "waiting",
          )
        expect(point).not.toHaveProperty("action")
      }
      expect(
        props.filter((p) => p.asset === "puzzles").map((p) => p.frame),
      ).toEqual(["vent", "pot", "brazier"])
      expect(JSON.stringify(p)).toBe(before)
      props[0].x = 999
      expect(hearthRoomProps(p)[0].x).toBe(208)
    },
  )
  it("allows discovery before hint but labels puzzle unavailable and inner exit locked", () => {
    const p = progress(0, false),
      points = hearthRoomWaypoints(p)
    expect(
      points
        .slice(0, 3)
        .every(
          (p) =>
            p.state === "unavailable" &&
            !p.locked &&
            p.status.includes("Bảng dấu hơi"),
        ),
    ).toBe(true)
    expect(
      hearthRoomProps(p)
        .slice(0, 3)
        .every((p) => p.alpha === scene.states.unavailableAlpha),
    ).toBe(true)
    expect(points.find((p) => p.id.endsWith(":east"))?.locked).toBe(true)
    expect(points.find((p) => p.id.endsWith(":west"))?.locked).toBe(false)
    expect(hearthRoomWaypoints({ ...p, zoneId: ZONE_IDS[0] })).toEqual([])
    expect(hearthRoomProps({ ...p, zoneId: ZONE_IDS[0] })).toEqual([])
  })
  it.each([
    { x: 64, y: 192 },
    { x: 576, y: 192 },
    { x: 272, y: 320 },
    { x: 320, y: 366 },
  ])(
    "native routes reach every target from $x,$y without crossing collider",
    (from) => {
      for (const target of hearthRoomWaypoints(progress(3))) {
        const path = findWorldPath(ZONE_IDS[4], from, {
          x: target.x,
          y: target.y,
        })
        expect(path.length).toBeGreaterThan(0)
        let prior = from
        for (const next of path) {
          expect(canStand(ZONE_IDS[4], next.x, next.y)).toBe(true)
          expect(clearPath(ZONE_IDS[4], prior, next)).toBe(true)
          prior = next
        }
        expect(prior).toEqual({ x: target.x, y: target.y })
      }
    },
  )
})
