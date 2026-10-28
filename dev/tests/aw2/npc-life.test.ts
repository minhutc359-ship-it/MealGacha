import { describe, expect, it, vi } from "vitest"
import {
  NPC_LIFE_DAY_MINUTES,
  NPC_LIFE_MINUTE_MS,
  NPC_LIFE_SCHEDULES,
  npcLifeActivity,
  npcLifeClock,
} from "@/aw2/world/npcLife"
import {
  advanceNpcLife,
  advanceNpcPatrol,
  newNpcPatrol,
  worldObjects,
} from "@/aw2/world/npcPatrol"
import { newWorldProgress, worldProgressSchema } from "@/aw2/world/model"
import { entityLocation, sceneObjects } from "@/aw2/world/scene"
import { roomById } from "@/aw2/world/interiorLayout"
import { MEMORY_IDS, STARTER_TEAM, ZONE_IDS } from "@/aw2/world/ids"
import { describeObject } from "@/aw2/world/rules"
import {
  NPC_MOTION,
  npcForEntity,
  sampleNpcLifeFrame,
} from "@/aw2/assets/npcMotion"
import { villageWaypoints } from "@/aw2/assets/village"
import { journeyWaypoints } from "@/aw2/assets/journeyScenes"
import { newEconomy } from "@/aw2/economy/model"

const phaseTimes = {
  morning: 0,
  day: (10 * 60 - 6 * 60) * NPC_LIFE_MINUTE_MS,
  evening: (17 * 60 - 6 * 60) * NPC_LIFE_MINUTE_MS,
  night: (20 * 60 - 6 * 60) * NPC_LIFE_MINUTE_MS,
} as const

function worldAtNpc(entityId: string) {
  const location = entityLocation(entityId)!
  const room = location.roomId ? roomById(location.roomId) : null
  return {
    ...newWorldProgress(),
    zoneId: location.zoneId,
    ...(room ? { x: room.approach.x, y: room.approach.y } : {}),
    interior: room ? { ...room.spawn } : null,
  }
}

describe("017E deterministic NPC life", () => {
  it.each([
    [phaseTimes.morning, "06:00 · Buổi sáng", "morning"],
    [phaseTimes.day, "10:00 · Ban ngày", "day"],
    [phaseTimes.evening, "17:00 · Chiều tối", "evening"],
    [phaseTimes.night, "20:00 · Ban đêm", "night"],
    [NPC_LIFE_DAY_MINUTES * NPC_LIFE_MINUTE_MS, "06:00 · Buổi sáng", "morning"],
  ] as const)("maps %sms to %s", (elapsed, label, phase) => {
    expect(npcLifeClock(elapsed)).toMatchObject({ label, phase })
  })

  it("does not read wall-clock time", () => {
    const now = vi.spyOn(Date, "now").mockImplementation(() => {
      throw Error("wall clock forbidden")
    })
    expect(npcLifeClock(30 * NPC_LIFE_MINUTE_MS).label).toBe(
      "06:30 · Buổi sáng",
    )
    expect(now).not.toHaveBeenCalled()
    now.mockRestore()
  })

  it.each([-1, NaN, Infinity])("rejects invalid clock time %s", (time) => {
    expect(() => npcLifeClock(time)).toThrow("Invalid NPC life time")
  })

  it("defines four distinct activities for all eight canonical NPCs", () => {
    expect(NPC_LIFE_SCHEDULES).toHaveLength(8)
    expect(new Set(NPC_LIFE_SCHEDULES.map((s) => s.entityId)).size).toBe(8)
    for (const schedule of NPC_LIFE_SCHEDULES) {
      const labels = Object.values(schedule.activities).map((a) => a.label)
      expect(new Set(labels).size, schedule.entityId).toBe(4)
      expect(labels.every((label) => label.length >= 12)).toBe(true)
    }
  })

  it.each(NPC_LIFE_SCHEDULES)(
    "$name exposes every scheduled phase through the live projection",
    (schedule) => {
      const world = worldAtNpc(schedule.entityId)
      for (const [phase, time] of Object.entries(phaseTimes)) {
        const life = npcLifeActivity(schedule.entityId, time)!
        expect(life.clock.phase).toBe(phase)
        expect(life.label).toBe(
          schedule.activities[(phase as keyof typeof phaseTimes)].label,
        )
        const projected = worldObjects(
          world,
          newNpcPatrol(world.zoneId, time),
        ).find((object) => object.id === schedule.entityId)!
        expect(projected).toMatchObject({
          activity: life.label,
          lifePhase: phase,
          lifeClock: life.clock.label,
        })
      }
    },
  )

  it("keeps projections detached and canonical positions unchanged", () => {
    for (const schedule of NPC_LIFE_SCHEDULES) {
      const world = worldAtNpc(schedule.entityId)
      const canonical = sceneObjects(world).find(
        (object) => object.id === schedule.entityId,
      )!
      const projected = worldObjects(
        world,
        newNpcPatrol(world.zoneId, phaseTimes.evening),
      ).find((object) => object.id === schedule.entityId)!
      expect([projected.x, projected.y]).toEqual([canonical.x, canonical.y])
      expect(canonical).not.toHaveProperty("activity")
      projected.activity = "mutated projection"
      expect(canonical).not.toHaveProperty("activity")
    }
  })

  it("advances at a bounded rate and freezes for pause or reduced motion", () => {
    const start = newNpcPatrol(ZONE_IDS[0])
    expect(advanceNpcLife(start, 500).lifeMs).toBe(500)
    expect(advanceNpcLife(start, 10_000).lifeMs).toBe(1_000)
    expect(advanceNpcLife(start, 500, { paused: true })).toEqual(start)
    expect(advanceNpcLife(start, 500, { reduced: true })).toEqual(start)
  })

  it.each([-1, NaN, Infinity])("rejects invalid life delta %s", (delta) => {
    expect(() => advanceNpcLife(newNpcPatrol(ZONE_IDS[0]), delta)).toThrow(
      "Invalid NPC life delta",
    )
  })

  it("preserves the session clock while resetting local patrol on zone entry", () => {
    const timed = advanceNpcLife(newNpcPatrol(ZONE_IDS[1]), 750)
    const next = advanceNpcPatrol(
      { ...newWorldProgress(), zoneId: ZONE_IDS[2] },
      timed,
      33,
    )
    expect(next).toEqual(newNpcPatrol(ZONE_IDS[2], 750))
  })

  it("uses authored activity frames briefly and neutral under reduced motion", () => {
    for (const schedule of NPC_LIFE_SCHEDULES) {
      const npc = npcForEntity(schedule.entityId)!
      const pulseAt =
        (NPC_MOTION.cycleMs - (npc.phaseMs % NPC_MOTION.cycleMs)) %
        NPC_MOTION.cycleMs
      for (const [phase, time] of Object.entries(phaseTimes)) {
        expect(sampleNpcLifeFrame(npc, pulseAt, time, false)).toBe(
          schedule.activities[(phase as keyof typeof phaseTimes)].frame,
        )
        expect(sampleNpcLifeFrame(npc, pulseAt, time, true)).toBe("neutral")
      }
    }
  })

  it("surfaces the activity in dialog, village and journey waypoints", () => {
    const village = newWorldProgress(),
      morning = newNpcPatrol(village.zoneId, phaseTimes.morning),
      keeper = worldObjects(village, morning).find(
        (object) => object.id === "aw2-npc-giu-cho",
      )!
    expect(describeObject(village, keeper).text).toContain(
      "Nhịp sống 06:00 · Buổi sáng",
    )
    expect(
      villageWaypoints(village, morning).find((point) => point.id === keeper.id)
        ?.activity,
    ).toBe(keeper.activity)

    const street = { ...village, zoneId: ZONE_IDS[1] },
      day = newNpcPatrol(street.zoneId, phaseTimes.day),
      an = journeyWaypoints(street, newEconomy(), day).find(
        (point) => point.id === "aw2-npc-va-den",
      )!
    expect(an.activity).toBe("Vá những chiếc đèn cũ")
  })

  it("keeps quest, memory and mode actions available at every phase", () => {
    const afterIntro = {
        questIndex: 1,
        tableRead: true,
        partyIds: [...STARTER_TEAM],
      },
      afterMemories = {
        ...afterIntro,
        questIndex: 2,
        memories: [...MEMORY_IDS],
        threadChoice: "wait" as const,
      }
    const fixtures = [
      ["aw2-npc-giu-cho", { questIndex: 0, accepted: false }, "accept"],
      ["aw2-npc-va-den", { ...afterIntro, accepted: false }, "accept"],
      ["aw2-npc-nguoi-ban", { ...afterIntro, accepted: true }, "remember"],
      ["aw2-npc-sua-ghe", { ...afterIntro, accepted: true }, "remember"],
      ["aw2-npc-dem-nuoc", { ...afterIntro, accepted: true }, "remember"],
      ["aw2-npc-gac-bep", { ...afterMemories, accepted: false }, "accept"],
      ["aw2-npc-ban-bai", {}, "visit-mode"],
      ["aw2-npc-ban-co", {}, "visit-mode"],
    ] as const
    for (const [entityId, progress, action] of fixtures) {
      const base = worldAtNpc(entityId),
        world = worldProgressSchema.parse({ ...base, ...progress })
      for (const time of Object.values(phaseTimes)) {
        const object = worldObjects(
          world,
          newNpcPatrol(world.zoneId, time),
        ).find((candidate) => candidate.id === entityId)!
        expect(
          describeObject(world, object).actions.map((a) => a.id),
        ).toContain(action)
      }
    }
  })

  it("never adds life state to WorldProgress or serialized save authority", () => {
    const world = newWorldProgress(),
      before = JSON.stringify(world),
      patrol = advanceNpcLife(newNpcPatrol(world.zoneId), phaseTimes.day)
    worldObjects(world, patrol)
    expect(JSON.stringify(world)).toBe(before)
    expect(worldProgressSchema.parse(world)).not.toHaveProperty("lifeMs")
    expect(JSON.stringify(world)).not.toContain("activity")
  })
})
