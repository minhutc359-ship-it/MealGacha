import { atEntity } from "./entity-fixture"
import { describe, expect, it } from "vitest"
import {
  newWorldProgress,
  worldProgressSchema,
  type WorldProgress,
} from "@/aw2/world/model"
import {
  MEMORY_IDS,
  STARTER_TEAM,
  ZONE_IDS,
  KITCHEN_BOSS_ID,
  TABLE_NOTE_ID,
} from "@/aw2/world/ids"
import { zoneById } from "@/aw2/world/maps"
import { TEA_ROOM } from "@/aw2/world/interiorLayout"
import { sceneObjects } from "@/aw2/world/scene"
import { applyWorldAction, describeObject } from "@/aw2/world/rules"
import { placeAffordance } from "@/aw2/world/placeAffordance"
import { questJournal } from "@/aw2/world/questJournal"
import { newEconomy } from "@/aw2/economy/model"

const cue = (world: WorldProgress, id: string) =>
  placeAffordance(world, newEconomy(), id)
function state(
  index: number,
  patch: Partial<WorldProgress> = {},
): WorldProgress {
  return worldProgressSchema.parse({
    ...newWorldProgress(),
    questIndex: index,
    tableRead: index > 0,
    partyIds: index > 0 ? [...STARTER_TEAM] : [],
    memories: index > 1 ? [...MEMORY_IDS] : [],
    threadChoice: index > 1 ? "return" : null,
    hintRead: index > 2,
    puzzleStep: index > 2 ? 3 : 0,
    bossDefeated: index === 4,
    tableNoteRead: index === 4,
    endingChoice: index === 4 ? "wait" : null,
    ...patch,
  })
}
const at = atEntity

const act = (world: WorldProgress, id: string, action: string) =>
  applyWorldAction(at(world, id), id, action).state
const giver = [
  "aw2-npc-giu-cho",
  "aw2-npc-va-den",
  "aw2-npc-gac-bep",
  "aw2-npc-gac-bep",
]

describe("016J quest cues use existing action authority", () => {
  it.each([0, 1, 2, 3])(
    "quest%i offers only the current giver and follows acceptance",
    (index) => {
      const world = at(state(index), giver[index])
      expect(cue(world, giver[index])).toMatchObject({
        state: "quest-available",
        symbol: "quest",
        label: "Nhận nhiệm vụ",
      })
      expect(questJournal(world, newEconomy())[index].status).toBe("available")
      const accepted = act(world, giver[index], "accept")
      expect(cue(accepted, giver[index])?.state).not.toBe("quest-available")
      expect(questJournal(accepted, newEconomy())[index].status).toBe("active")
      expect(world.accepted).toBe(false)
    },
  )
  it("actual intro moves the cue from Bà to cloth to Bà, without granting on read", () => {
    let world = newWorldProgress()
    expect(cue(world, "aw2-object-village-table")).toBeUndefined()
    world = act(world, giver[0], "accept")
    expect(cue(world, giver[0])).toBeUndefined()
    expect(cue(world, "aw2-object-village-table")).toMatchObject({
      state: "quest-active",
      detail: expect.stringContaining("Đọc mảnh khăn"),
    })
    world = act(world, "aw2-object-village-table", "inspect")
    expect(cue(world, "aw2-object-village-table")).toBeUndefined()
    world = at(world, giver[0])
    expect(cue(world, giver[0])).toMatchObject({
      state: "quest-ready",
      symbol: "quest-return",
    })
    expect(world.partyIds).toEqual([])
    world = act(world, giver[0], "turn-in")
    expect(cue(world, giver[0])).toBeUndefined()
    expect(world.partyIds).toEqual(STARTER_TEAM)
  })
  it.each(["thread-wait", "thread-return"])(
    "tracks all remaining memories then offers choice%s",
    (choice) => {
      let world = act(state(1), giver[1], "accept")
      const ids = ["aw2-npc-dem-nuoc", "aw2-npc-nguoi-ban", "aw2-npc-sua-ghe"]
      for (const [i, id] of ids.entries()) {
        world = at(world, id)
        expect(cue(world, id)?.state).toBe("quest-active")
        world = act(world, id, "remember")
        expect(cue(world, id)).toBeUndefined()
        expect(cue(at(world, giver[1]), giver[1])?.state).toBe(
          i === 2 ? "quest-ready" : undefined,
        )
      }
      expect(questJournal(world, newEconomy())[1].status).toBe("ready_to_claim")
      world = act(world, giver[1], choice)
      expect(cue(world, giver[1])).toBeUndefined()
      expect(world.questIndex).toBe(2)
    },
  )
  it("shows only the next puzzle action, including reset after a wrong step", () => {
    let world = act(state(2), giver[2], "accept")
    world = at(world, "aw2-object-hearth-hint")
    expect(cue(world, "aw2-object-hearth-hint")?.state).toBe("quest-active")
    world = act(world, "aw2-object-hearth-hint", "inspect")
    expect(cue(world, "aw2-object-hearth-hint")).toBeUndefined()
    const checkStep = (step: number) => {
      world = at(world, "aw2-object-steam-0")
      for (let i = 0; i < 3; i++)
        expect(
          cue(world, `aw2-object-steam-${i}`)?.state === "quest-active",
        ).toBe(i === step)
    }
    checkStep(0)
    world = act(world, "aw2-object-steam-0", "puzzle")
    checkStep(1)
    world = act(world, "aw2-object-steam-2", "puzzle")
    checkStep(0)
    for (let i = 0; i < 3; i++) {
      world = act(world, `aw2-object-steam-${i}`, "puzzle")
      checkStep(i + 1)
    }
    world = at(world, giver[2])
    expect(cue(world, giver[2])).toMatchObject({
      state: "quest-ready",
      detail: expect.stringContaining("Bếp khóa"),
    })
    world = act(world, giver[2], "turn-in")
    expect(cue(world, giver[3])?.state).toBe("quest-available")
  })
  it("boss/note/ending cannot imply a victory or a reward", () => {
    let world = at(state(3), KITCHEN_BOSS_ID)
    expect(cue(world, KITCHEN_BOSS_ID)).toBeUndefined()
    world = act(world, giver[3], "accept")
    world = at(world, KITCHEN_BOSS_ID)
    expect(cue(world, KITCHEN_BOSS_ID)).toMatchObject({
      state: "quest-active",
      detail: expect.stringContaining("Bắt đầu thử thách"),
    })
    expect(cue(world, TABLE_NOTE_ID)).toBeUndefined()
    const won = { ...world, bossDefeated: true }
    expect(cue(won, KITCHEN_BOSS_ID)).toBeUndefined()
    expect(cue(won, TABLE_NOTE_ID)?.state).toBe("quest-active")
    world = act(won, TABLE_NOTE_ID, "read-note")
    expect(cue(world, TABLE_NOTE_ID)).toBeUndefined()
    world = at(world, giver[0])
    expect(cue(world, giver[0])?.state).toBe("quest-ready")
    expect(world.endingChoice).toBeNull()
    expect(newEconomy().receipts).toEqual([])
    for (const ending of ["seat-wait", "seat-share"]) {
      const finished = act(world, giver[0], ending)
      expect(cue(finished, giver[0])).toBeUndefined()
      expect(
        cue(at(finished, KITCHEN_BOSS_ID), KITCHEN_BOSS_ID),
      ).toBeUndefined()
    }
  })
})

describe("016J scene, service and read-only boundaries", () => {
  it("does not project future quests or a foreign-scene object", () => {
    expect(cue(newWorldProgress(), giver[1])).toBeUndefined()
    expect(cue(at(state(1), giver[0]), giver[0])).toBeUndefined()
    const room = {
      ...newWorldProgress(),
      x: 300,
      y: 80,
      interior: { ...TEA_ROOM.spawn },
    }
    expect(cue(room, giver[0])).toBeUndefined()
    expect(cue(room, TEA_ROOM.objects[0].id)?.state).toBe("open")
    expect(cue(room, "scenic-house")).toBeUndefined()
  })
  it("prioritizes a real quest over kitchen status and retains its explanation", () => {
    const world = at(state(3), giver[3]),
      economy = newEconomy()
    economy.inventory["warm-bowl"] = 1
    expect(placeAffordance(world, economy, giver[3])).toMatchObject({
      state: "quest-available",
      detail: expect.stringContaining("Có bữa ấm"),
    })
    const accepted = act(world, giver[3], "accept")
    expect(placeAffordance(accepted, economy, giver[3])).toMatchObject({
      state: "ready",
      label: "Có bữa ấm",
    })
  })
  it.each([0, 1, 2, 3, 4])(
    "quest%i markers agree with offered actions and never change frozen inputs",
    (index) => {
      const freeze = <T>(value: T): T => {
        if (value && typeof value === "object") {
          Object.values(value).forEach(freeze)
          Object.freeze(value)
        }
        return value
      }
      const economy = freeze(newEconomy())
      for (const zoneId of ZONE_IDS) {
        const world = freeze({ ...state(index), zoneId }),
          before = JSON.stringify({ world, economy })
        for (const object of sceneObjects(world)) {
          const result = placeAffordance(world, economy, object.id)
          if (result?.state.startsWith("quest-")) {
            expect(
              describeObject(world, object).actions.length,
            ).toBeGreaterThan(0)
            result.label = "detached"
          }
        }
        expect(JSON.stringify({ world, economy })).toBe(before)
      }
    },
  )
})
