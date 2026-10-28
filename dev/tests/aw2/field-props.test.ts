import { describe, expect, it } from "vitest"
import { newEconomy } from "@/aw2/economy/model"
import { journeyWaypoints } from "@/aw2/assets/journeyScenes"
import { villageWaypoints } from "@/aw2/assets/village"
import { ZONE_IDS } from "@/aw2/world/ids"
import { canStand, zoneById } from "@/aw2/world/maps"
import { newWorldProgress } from "@/aw2/world/model"
import { findWorldPath } from "@/aw2/world/navigation"
import { placeApproach, placeKind } from "@/aw2/world/placeGuidance"
import {
  applyWorldAction,
  describeObject,
  INTERACT_RANGE,
} from "@/aw2/world/rules"

const expected = [
  [ZONE_IDS[0], "aw2-object-village-well", "well"],
  [ZONE_IDS[1], "aw2-object-street-repair-crate", "repair-crate"],
  [ZONE_IDS[2], "aw2-object-yard-wash-basin", "wash-basin"],
] as const

describe("017D read-only field props", () => {
  it.each(expected)(
    "binds %s / %s to a visible obstacle approach",
    (zoneId, id, field) => {
      const object = zoneById(zoneId).objects.find(
        (candidate) => candidate.id === id,
      )!
      expect(object).toMatchObject({ kind: "field", field })
      const approach = placeApproach(object)
      expect(placeKind(object)).toBe("Đồ vật ngoài trời")
      expect(canStand(zoneId, approach.x, approach.y)).toBe(true)
      expect(
        Math.hypot(approach.x - object.x, approach.y - object.y),
      ).toBeLessThanOrEqual(INTERACT_RANGE)
      expect(
        findWorldPath(zoneId, { x: 96, y: 192 }, approach).length,
      ).toBeGreaterThan(0)
    },
  )

  it.each(expected)(
    "describes %s / %s without action, reward or progress write",
    (zoneId, id) => {
      const world = { ...newWorldProgress(), zoneId },
        object = zoneById(zoneId).objects.find(
          (candidate) => candidate.id === id,
        )!,
        before = JSON.stringify(world),
        description = describeObject(world, object)
      expect(description.text).toContain("không nhận vật phẩm")
      expect(description.actions).toEqual([])
      expect(() =>
        applyWorldAction({ ...world, ...placeApproach(object) }, id, "inspect"),
      ).toThrow()
      expect(JSON.stringify(world)).toBe(before)
    },
  )

  it("lists all three props as reachable destinations with no implicit action", () => {
    const village = villageWaypoints(newWorldProgress()).find(
      (point) => point.id === expected[0][1],
    )!
    expect(village.status).toContain("không nhận vật phẩm")
    for (const [zoneId, id] of expected.slice(1)) {
      const point = journeyWaypoints(
        { ...newWorldProgress(), zoneId },
        newEconomy(),
      ).find((candidate) => candidate.id === id)!
      expect(point.status).toContain("không nhận vật phẩm")
      expect(point).not.toHaveProperty("action")
    }
  })
})
