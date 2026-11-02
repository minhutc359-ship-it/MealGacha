import { describe, expect, it } from "vitest"
import { newWorldProgress, worldProgressSchema } from "@/aw2/world/model"
import { ZONE_IDS, MEMORY_IDS, STARTER_TEAM } from "@/aw2/world/ids"
import { applyWorldAction, describeObject } from "@/aw2/world/rules"
import { canStand, exitApproach, zoneById } from "@/aw2/world/maps"
import { findWorldPath } from "@/aw2/world/navigation"
import { placeApproach } from "@/aw2/world/placeGuidance"
import { journeyWaypoints } from "@/aw2/assets/journeyScenes"
import { newEconomy } from "@/aw2/economy/model"
import { SETTLEMENT, settlementForZone } from "@/aw2/assets/settlement"
import { YARD_PORTALS, yardFacadeTarget } from "@/aw2/assets/yardDistrict"

const yardId = ZONE_IDS[2]
const yard = zoneById(yardId)
const completed = () =>
  worldProgressSchema.parse({
    ...newWorldProgress(),
    zoneId: yardId,
    questIndex: 4,
    tableRead: true,
    memories: [...MEMORY_IDS],
    threadChoice: "wait",
    hintRead: true,
    puzzleStep: 3,
    partyIds: [...STARTER_TEAM],
    bossDefeated: true,
    tableNoteRead: true,
    endingChoice: "wait",
  })

describe("017C functional kitchen yard", () => {
  it("replaces ten scenic facades with exactly two real portal facades", () => {
    const raw = SETTLEMENT.regions.find((r) => r.zoneId === yardId)!
    expect(raw.buildings).toHaveLength(10)
    const active = settlementForZone(yardId)!
    expect(active.landmarks).toEqual([])
    expect(active.buildings).toHaveLength(2)
    expect(active.buildings.map((b) => b.x)).toEqual(
      YARD_PORTALS.map(({ object }) => object.x),
    )
    for (const [i, binding] of YARD_PORTALS.entries()) {
      const target = yardFacadeTarget({ x: active.buildings[i].x, y: -64 })
      expect(target).toEqual(exitApproach(binding.object))
      expect(placeApproach(binding.object)).toEqual(target)
      expect(canStand(yardId, target.x, target.y)).toBe(true)
      expect(
        findWorldPath(yardId, { x: 320, y: 128 }, target).length,
      ).toBeGreaterThan(0)
      expect(
        active.buildings[i].solidBase.y + active.buildings[i].solidBase.height,
      ).toBeLessThanOrEqual(4)
    }
  })

  it("uses one approach authority for map, journal and keyboard walking", () => {
    const world = {
      ...newWorldProgress(),
      zoneId: yardId,
      questIndex: 2,
      accepted: true,
    }
    const points = journeyWaypoints(world, newEconomy())
    for (const { object } of YARD_PORTALS) {
      const approach = exitApproach(object)
      const point = points.find((p) => p.id === object.id)!
      expect({ x: point.walkX, y: point.walkY }).toEqual({
        x: approach.x,
        y: approach.y,
      })
    }
    expect(
      describeObject(world, YARD_PORTALS[0].object).actions.map((a) => a.id),
    ).toContain("travel")
    expect(
      describeObject(world, YARD_PORTALS[1].object).actions.map((a) => a.id),
    ).not.toContain("travel")
  })

  it("travels to safe reciprocal spawns and never writes by merely targeting a roof", () => {
    const source = completed()
    const before = JSON.stringify(source)
    for (const { object } of YARD_PORTALS) {
      yardFacadeTarget({ x: object.x, y: -80 })
      expect(JSON.stringify(source)).toBe(before)
      const approach = exitApproach(object)
      const arrived = applyWorldAction(
        { ...source, x: approach.x, y: approach.y },
        object.id,
        "travel",
      ).state
      expect(arrived.zoneId).toBe(object.to)
      expect({ x: arrived.x, y: arrived.y }).toEqual({
        x: object.spawnX,
        y: object.spawnY ?? 192,
      })
      expect(canStand(arrived.zoneId, arrived.x, arrived.y)).toBe(true)
      const reverse = zoneById(arrived.zoneId).objects.find(
        (candidate) =>
          candidate.kind === "exit" &&
          candidate.to === yardId &&
          !!candidate.requiresCompleted === !!object.requiresCompleted,
      )!
      const reverseApproach = exitApproach(reverse)
      const returned = applyWorldAction(
        { ...arrived, x: reverseApproach.x, y: reverseApproach.y },
        reverse.id,
        "travel",
      ).state
      expect(returned.zoneId).toBe(yardId)
      const yardApproach = exitApproach(object)
      expect({ x: returned.x, y: returned.y }).toEqual({
        x: yardApproach.x,
        y: yardApproach.y,
      })
    }
  })
})
