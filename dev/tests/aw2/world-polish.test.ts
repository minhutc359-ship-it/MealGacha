import { describe, expect, it, vi } from "vitest"
import {
  WORLD_PLAY_BOUNDS,
  WORLD_POLISH_PROFILES,
  worldColliderShadows,
  worldEdgeSegments,
  worldPolishFrame,
  worldPolishProfile,
  worldPolishTelemetry,
  type WorldEdgeSegment,
} from "@/aw2/assets/worldPolish"
import { NPC_LIFE_MINUTE_MS } from "@/aw2/world/npcLife"
import { ZONE_IDS, type ZoneId } from "@/aw2/world/ids"
import { canStand, zoneById } from "@/aw2/world/maps"

const phaseTimes = {
  morning: 0,
  day: (10 * 60 - 6 * 60) * NPC_LIFE_MINUTE_MS,
  evening: (17 * 60 - 6 * 60) * NPC_LIFE_MINUTE_MS,
  night: (20 * 60 - 6 * 60) * NPC_LIFE_MINUTE_MS,
} as const

function contains(segment: WorldEdgeSegment, x: number, y: number) {
  return (
    x >= segment.x &&
    x <= segment.x + segment.width &&
    y >= segment.y &&
    y <= segment.y + segment.height
  )
}

describe("017F world edge, collider and lighting polish", () => {
  it("owns one explicit, distinct profile for every canonical zone", () => {
    expect(WORLD_POLISH_PROFILES).toHaveLength(ZONE_IDS.length)
    expect(
      new Set(WORLD_POLISH_PROFILES.map((profile) => profile.zoneId)),
    ).toEqual(new Set(ZONE_IDS))
    expect(
      new Set(WORLD_POLISH_PROFILES.map((profile) => profile.edgeStyle)).size,
    ).toBe(ZONE_IDS.length)
    for (const zoneId of ZONE_IDS)
      expect(worldPolishProfile(zoneId).zoneId).toBe(zoneId)
  })

  it.each(Object.entries(phaseTimes))(
    "projects NPC-life %s without consulting wall-clock time",
    (phase, time) => {
      const now = vi.spyOn(Date, "now").mockImplementation(() => {
        throw Error("wall clock forbidden")
      })
      for (const zoneId of ZONE_IDS)
        expect(worldPolishFrame(zoneId, time, 100).phase).toBe(phase)
      expect(now).not.toHaveBeenCalled()
      now.mockRestore()
    },
  )

  it.each(ZONE_IDS)(
    "keeps %s border on exact canonical stand bounds",
    (zoneId) => {
      const edges = worldEdgeSegments(zoneId)
      expect(new Set(edges.map((edge) => edge.edge))).toEqual(
        new Set(["north", "east", "south", "west"]),
      )
      for (const edge of edges) {
        expect(edge.width).toBeGreaterThan(0)
        expect(edge.height).toBeGreaterThan(0)
        if (edge.edge === "north")
          expect([edge.y, edge.height]).toEqual([0, 16])
        if (edge.edge === "south")
          expect([edge.y, edge.height]).toEqual([368, 16])
        if (edge.edge === "west") expect([edge.x, edge.width]).toEqual([0, 16])
        if (edge.edge === "east")
          expect([edge.x, edge.width]).toEqual([624, 16])
      }
      expect(WORLD_PLAY_BOUNDS).toEqual({
        x: 16,
        y: 16,
        width: 608,
        height: 352,
      })
    },
  )

  it.each(ZONE_IDS)(
    "opens %s edge art around every boundary exit",
    (zoneId) => {
      const edges = worldEdgeSegments(zoneId)
      for (const exit of zoneById(zoneId).objects.filter(
        (item) => item.kind === "exit",
      )) {
        const onBoundary =
          exit.x <= 24 || exit.x >= 616 || exit.y <= 16 || exit.y >= 368
        if (onBoundary)
          expect(edges.some((edge) => contains(edge, exit.x, exit.y))).toBe(
            false,
          )
      }
    },
  )

  it.each(ZONE_IDS)("does not overlap edge segments within %s", (zoneId) => {
    const edges = worldEdgeSegments(zoneId)
    for (const [index, current] of edges.entries())
      for (const other of edges.slice(index + 1)) {
        if (current.edge !== other.edge) continue
        const overlapX =
          Math.min(current.x + current.width, other.x + other.width) -
          Math.max(current.x, other.x)
        const overlapY =
          Math.min(current.y + current.height, other.y + other.height) -
          Math.max(current.y, other.y)
        expect(overlapX > 0 && overlapY > 0).toBe(false)
      }
  })

  it.each(ZONE_IDS)(
    "derives %s collider shadows from exact map authority",
    (zoneId) => {
      const before = JSON.stringify(zoneById(zoneId))
      const shadows = worldColliderShadows(zoneId)
      expect(shadows.map((shadow) => shadow.footprint)).toEqual(
        zoneById(zoneId).walls,
      )
      for (const shadow of shadows) {
        expect(shadow.width).toBeGreaterThan(shadow.footprint.width)
        expect(shadow.height).toBeGreaterThan(0)
        expect(shadow.x).toBeGreaterThanOrEqual(0)
        expect(shadow.y + shadow.height).toBeLessThanOrEqual(384)
      }
      expect(JSON.stringify(zoneById(zoneId))).toBe(before)
    },
  )

  it.each(ZONE_IDS)(
    "keeps %s light pools bounded and presentation-safe",
    (zoneId) => {
      const frame = worldPolishFrame(zoneId, phaseTimes.evening, 600)
      expect(frame.lights.length).toBeGreaterThanOrEqual(2)
      for (const light of frame.lights) {
        expect(light.x - light.radius).toBeGreaterThanOrEqual(0)
        expect(light.x + light.radius).toBeLessThanOrEqual(640)
        expect(light.y - light.radius).toBeGreaterThanOrEqual(0)
        expect(light.y + light.radius).toBeLessThanOrEqual(384)
        expect(light.intensity).toBeGreaterThan(0)
        expect(light.intensity).toBeLessThanOrEqual(0.22)
      }
      expect(frame.ambient.alpha).toBeGreaterThanOrEqual(0.03)
      expect(frame.ambient.alpha).toBeLessThanOrEqual(0.18)
    },
  )

  it("freezes the pulse for pause and reduced motion", () => {
    for (const zoneId of ZONE_IDS) {
      expect(worldPolishFrame(zoneId, 0, 0, { paused: true }).pulse).toBe(0.5)
      expect(worldPolishFrame(zoneId, 0, 9999, { paused: true }).pulse).toBe(
        0.5,
      )
      expect(worldPolishFrame(zoneId, 0, 0, { reduced: true }).pulse).toBe(0.5)
      expect(worldPolishFrame(zoneId, 0, 9999, { reduced: true }).pulse).toBe(
        0.5,
      )
    }
  })

  it("keeps animation finite, bounded and deterministic", () => {
    for (const zoneId of ZONE_IDS) {
      const first = worldPolishFrame(zoneId, phaseTimes.day, 500)
      const second = worldPolishFrame(zoneId, phaseTimes.day, 500)
      expect(second).toEqual(first)
      expect(first.pulse).toBeGreaterThanOrEqual(0)
      expect(first.pulse).toBeLessThanOrEqual(1)
    }
  })

  it.each([-1, NaN, Infinity])("rejects invalid life time %s", (time) => {
    expect(() => worldPolishFrame(ZONE_IDS[0], time, 0)).toThrow(
      "Invalid polish life time",
    )
  })

  it.each([-1, NaN, Infinity])("rejects invalid animation time %s", (time) => {
    expect(() => worldPolishFrame(ZONE_IDS[0], 0, time)).toThrow(
      "Invalid polish animation time",
    )
  })

  it("rejects missing profiles instead of silently falling back", () => {
    expect(() => worldPolishProfile("aw2-zone-missing" as ZoneId)).toThrow(
      "Missing world polish profile",
    )
  })

  it("exports compact renderer telemetry with canonical collider footprints", () => {
    for (const zoneId of ZONE_IDS) {
      const frame = worldPolishFrame(zoneId, phaseTimes.night, 1200)
      expect(worldPolishTelemetry(frame)).toMatchObject({
        zoneId,
        phase: "night",
        edgeStyle: worldPolishProfile(zoneId).edgeStyle,
        edgeSegments: frame.edges.length,
        colliderFootprints: zoneById(zoneId).walls,
      })
    }
  })

  it("never changes collision results or map/save-facing data", () => {
    for (const zoneId of ZONE_IDS) {
      const zone = zoneById(zoneId)
      const before = JSON.stringify(zone)
      const stands = [
        [16, 16],
        [320, 192],
        [624, 368],
        [310, 330],
      ].map(([x, y]) => canStand(zoneId, x, y))
      worldPolishFrame(zoneId, phaseTimes.evening, 800)
      expect([16, 16, 624, 368].every(Number.isFinite)).toBe(true)
      expect(
        [
          [16, 16],
          [320, 192],
          [624, 368],
          [310, 330],
        ].map(([x, y]) => canStand(zoneId, x, y)),
      ).toEqual(stands)
      expect(JSON.stringify(zone)).toBe(before)
    }
  })
})
