import { describe, expect, it } from "vitest"
import { newWorldProgress, type WorldProgress } from "@/aw2/world/model"
import { MEMORY_IDS, STARTER_TEAM, ZONE_IDS } from "@/aw2/world/ids"
import { ZONES, zoneById } from "@/aw2/world/maps"
import { describeObject, applyWorldAction } from "@/aw2/world/rules"
import { placeAffordance } from "@/aw2/world/placeAffordance"
import {
  TEA_ROOM,
  TEA_DOOR_ID,
  TEA_EXIT_ID,
  TEA_PARTY_ID,
  TEA_JOURNAL_ID,
} from "@/aw2/world/interiorLayout"
import { PANTRY_STOCK } from "@/aw2/world/pantryLayout"
import {
  newEconomy,
  applyEconomyAction,
  CHEST_RECEIPT,
} from "@/aw2/economy/model"

const zone = (index: number): WorldProgress => ({
  ...newWorldProgress(),
  zoneId: ZONE_IDS[index],
})
const room = (): WorldProgress => ({
  ...zone(0),
  x: 300,
  y: 80,
  interior: { ...TEA_ROOM.spawn },
})
const view = (world: WorldProgress, id: string) =>
  placeAffordance(world, newEconomy(), id)

describe("016I door states follow the real action authority", () => {
  it.each([0, 1, 2, 3, 4, 5])("projects actual doors in region %i", (index) => {
    const world = zone(index)
    for (const object of zoneById(world.zoneId).objects.filter(
      (object) => object.kind === "exit",
    )) {
      const travel = describeObject(world, object).actions.some(
        (action) => action.id === "travel",
      )
      expect(view(world, object.id)?.state).toBe(travel ? "open" : "locked")
    }
  })
  it("opens the yard gate after actual quest acceptance, without executing travel", () => {
    const world: WorldProgress = {
      ...zone(2),
      x: 320,
      y: 160,
      questIndex: 2,
      tableRead: true,
      partyIds: [...STARTER_TEAM],
      memories: [...MEMORY_IDS],
      threadChoice: "return",
    }
    const id = `${ZONE_IDS[2]}:exit:east`
    expect(view(world, id)?.state).toBe("locked")
    const accepted = applyWorldAction(world, "aw2-npc-gac-bep", "accept").state
    expect(view(accepted, id)?.state).toBe("open")
    expect(accepted.zoneId).toBe(world.zoneId)
    expect({ x: accepted.x, y: accepted.y }).toEqual({ x: 320, y: 160 })
  })
  it.each([0, 1, 2, 3])(
    "keeps the inner door locked at puzzle step %i",
    (step) => {
      const world = { ...zone(4), puzzleStep: step }
      expect(view(world, `${ZONE_IDS[4]}:exit:east`)?.state).toBe(
        step === 3 ? "open" : "locked",
      )
    },
  )
  it.each([2, 5])("opens only completed shortcuts in region %i", (index) => {
    const world = zone(index),
      id = index === 2 ? "aw2-shortcut-yard-table" : "aw2-shortcut-table-yard"
    expect(view(world, id)?.state).toBe("locked")
    expect(
      view({ ...world, questIndex: 3, bossDefeated: true }, id)?.state,
    ).toBe("locked")
    expect(view({ ...world, questIndex: 4, puzzleStep: 3 }, id)?.state).toBe(
      "open",
    )
  })
  it("room access is scene-local and never creates an interior", () => {
    const world = zone(0)
    expect(view(world, TEA_DOOR_ID)?.state).toBe("open")
    expect(world.interior).toBeNull()
    expect(view(room(), TEA_EXIT_ID)?.state).toBe("open")
    expect(view(room(), TEA_DOOR_ID)).toBeUndefined()
    expect(view(world, TEA_EXIT_ID)).toBeUndefined()
  })
})

describe("016I existing services and receipts", () => {
  it.each(["aw2-npc-ban-bai", "aw2-npc-ban-co"])(
    "allows approaching %s before any quest is earned",
    (id) => {
      expect(view(zone(1), id)).toMatchObject({
        state: "ready",
        label: "Sẵn sàng",
      })
      expect(view(zone(0), id)).toBeUndefined()
    },
  )
  it.each([TEA_PARTY_ID, TEA_JOURNAL_ID])(
    "projects desk %s only inside",
    (id) => {
      expect(view(room(), id)?.state).toBe("ready")
      expect(view(zone(0), id)).toBeUndefined()
    },
  )
  it("keeps stock inspection available with an empty or already-used bag", () => {
    const economy = newEconomy()
    expect(placeAffordance(zone(3), economy, PANTRY_STOCK.id)?.state).toBe(
      "ready",
    )
    economy.receipts.push(CHEST_RECEIPT)
    expect(placeAffordance(zone(3), economy, PANTRY_STOCK.id)?.state).toBe(
      "ready",
    )
  })
  it("changes chest cue only after the real once-only economy transaction", () => {
    const world = { ...zone(3), x: 432, y: 256 },
      economy = newEconomy()
    expect(placeAffordance(world, economy, "aw2-chest-pantry")).toMatchObject({
      state: "ready",
      label: "Chưa nhận",
    })
    const claimed = applyEconomyAction(economy, world, "open-chest")
    expect(placeAffordance(world, claimed, "aw2-chest-pantry")).toMatchObject({
      state: "claimed",
      label: "Đã nhận",
    })
    expect(economy.receipts).toEqual([])
    expect(() => applyEconomyAction(claimed, world, "open-chest")).toThrow()
  })
  it("does not infer an already-claimed chest from ingredient counts", () => {
    const economy = newEconomy()
    economy.inventory = { rice: 99, herbs: 99, broth: 99, "warm-bowl": 0 }
    expect(placeAffordance(zone(3), economy, "aw2-chest-pantry")?.label).toBe(
      "Chưa nhận",
    )
  })
})

describe.each([
  [2, "aw2-npc-gac-bep"],
  [4, "aw2-object-steam-2"],
] as const)("016I kitchen at %i/%s", (index, id) => {
  const openKitchen = (): WorldProgress => ({ ...zone(index), questIndex: 3 })
  it("keeps cooking locked before the quest even with a stocked bag", () => {
    const economy = newEconomy()
    economy.inventory = { rice: 10, herbs: 10, broth: 10, "warm-bowl": 1 }
    expect(placeAffordance(zone(index), economy, id)?.label).toBe("Bếp khóa")
  })
  it.each(["rice", "herbs", "broth"] as const)(
    "reports missing %s without claiming that nearby talk is locked",
    (missing) => {
      const economy = newEconomy()
      economy.inventory = { rice: 1, herbs: 1, broth: 1, "warm-bowl": 0 }
      economy.inventory[missing] = 0
      expect(placeAffordance(openKitchen(), economy, id)).toMatchObject({
        state: "unavailable",
        label: "Thiếu đồ",
      })
    },
  )
  it("projects readiness on approach and actual cook/share/empty transitions", () => {
    const world = openKitchen(),
      economy = newEconomy(),
      anchor = zoneById(world.zoneId).objects.find(
        (object) => object.id === id,
      )!,
      nearby = { ...world, x: anchor.x, y: anchor.y + 32 }
    economy.inventory = { rice: 1, herbs: 1, broth: 1, "warm-bowl": 0 }
    expect(placeAffordance(world, economy, id)?.label).toBe("Có thể nấu")
    expect(() => applyEconomyAction(economy, world, "cook")).toThrow()
    const cooked = applyEconomyAction(economy, nearby, "cook")
    expect(placeAffordance(world, cooked, id)?.label).toBe("Có bữa ấm")
    const shared = applyEconomyAction(cooked, nearby, "share-meal")
    expect(placeAffordance(world, shared, id)?.label).toBe("Thiếu đồ")
    expect(shared.teamExperience).toBe(45)
    expect(world.x).toBe(newWorldProgress().x)
  })
})

describe("016I projection boundaries", () => {
  it.each([
    "unknown",
    "tea",
    "aw2-npc-giu-cho",
    "aw2-object-village-table",
    "aw2-npc-ban-bai",
    PANTRY_STOCK.id,
    TEA_PARTY_ID,
  ])("does not invent a service for village %s", (id) => {
    expect(view(zone(0), id)).toBeUndefined()
  })
  it("does not mutate frozen world/economy/geometry or expose mutable source objects", () => {
    const freeze = <T>(value: T): T => {
      if (value && typeof value === "object") {
        Object.values(value).forEach(freeze)
        Object.freeze(value)
      }
      return value
    }
    const worlds = [...ZONE_IDS.map((_, index) => zone(index)), room()],
      economy = freeze(newEconomy()),
      before = JSON.stringify({ worlds, economy, ZONES, TEA_ROOM })
    for (const world of worlds) {
      freeze(world)
      const objects = world.interior
        ? TEA_ROOM.objects
        : zoneById(world.zoneId).objects
      for (const object of objects) {
        const result = placeAffordance(world, economy, object.id)
        if (result) result.label = "local presentation only"
      }
    }
    expect(JSON.stringify({ worlds, economy, ZONES, TEA_ROOM })).toBe(before)
  })
})
