import { describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import { pantryInspection, canInspectPantry } from "@/aw2/world/pantry"
import { PANTRY_STOCK } from "@/aw2/world/pantryLayout"
import { newWorldProgress, worldProgressSchema } from "@/aw2/world/model"
import { ZONE_IDS, STARTER_TEAM, MEMORY_IDS } from "@/aw2/world/ids"
import { canStand, zoneById, ZONES } from "@/aw2/world/maps"
import {
  applyWorldAction,
  describeObject,
  nearestObject,
  INTERACT_RANGE,
} from "@/aw2/world/rules"
import { worldRegistry } from "@/aw2/world/registry"
import { clearPath, findWorldPath } from "@/aw2/world/navigation"
import { journeyWaypoints, journeyProps } from "@/aw2/assets/journeyScenes"
import {
  applyEconomyAction,
  newEconomy,
  grantQuestRewards,
  CHEST_RECEIPT,
  WARM_BOWL_RECIPE,
} from "@/aw2/economy/model"
import { Aw2DevSaveStore } from "@/aw2/save/store"
import { decodeAw2Save } from "@/aw2/save/schema"

// Spatial fixtures contain no new progression. Keep Waypoint entityId out of save data.
function atStock() {
  const { entityId, ...position } = PANTRY_STOCK.approach
  return worldProgressSchema.parse({
    ...newWorldProgress(),
    ...position,
    zoneId: ZONE_IDS[3],
    questIndex: 2,
    accepted: true,
    tableRead: true,
    partyIds: [...STARTER_TEAM],
    memories: [...MEMORY_IDS],
    threadChoice: "wait",
  })
}
const economy = () => grantQuestRewards(newEconomy(), atStock())

describe("016E existing pantry stock inspection", () => {
  it("exposes one optional object, no extra map/NPC/portal or duplicate crate sprite", () => {
    const r = worldRegistry(),
      map = r.maps.find((m) => m.id === PANTRY_STOCK.zoneId)!
    expect(r.maps).toHaveLength(6)
    expect(
      r.maps
        .flatMap((m) => m.entities)
        .filter((e) => e.id.startsWith("aw2-npc-")),
    ).toHaveLength(8)
    expect(map.entities.filter((e) => e.kind === "stock")).toEqual([
      {
        id: PANTRY_STOCK.id,
        name: PANTRY_STOCK.name,
        kind: "stock",
        position: { x: 320, y: 288 },
      },
    ])
    expect(map.portals).toHaveLength(2)
    expect(
      journeyProps(atStock(), economy()).some(
        (p) => p.entityId === PANTRY_STOCK.id,
      ),
    ).toBe(false)
    expect(
      describeObject(
        atStock(),
        zoneById(PANTRY_STOCK.zoneId).objects.find(
          (o) => o.id === PANTRY_STOCK.id,
        )!,
      ).actions,
    ).toEqual([])
  })
  it("keeps every existing wall, portal and original pantry anchor unchanged", () => {
    for (const zone of ZONES)
      expect(zone.walls).toEqual([{ x: 288, y: 304, width: 64, height: 48 }])
    const p = zoneById(PANTRY_STOCK.zoneId)
    expect(
      p.objects
        .filter((o) => o.id !== PANTRY_STOCK.id)
        .map((o) => [o.id, o.x, o.y]),
    ).toEqual([
      ["aw2-object-hearth-hint", 240, 128],
      ["aw2-chest-pantry", 432, 272],
      [PANTRY_STOCK.zoneId + ":exit:west", 24, 192],
      [PANTRY_STOCK.zoneId + ":exit:east", 616, 192],
    ])
    expect(canStand(PANTRY_STOCK.zoneId, 320, 328)).toBe(false)
    expect(canStand(PANTRY_STOCK.zoneId, PANTRY_STOCK.x, PANTRY_STOCK.y)).toBe(
      true,
    )
  })
  it.each([
    { x: 64, y: 192 },
    { x: 576, y: 192 },
    { x: 320, y: 366 },
  ])(
    "offers a collision-safe approach from $x,$y with the stock as E target",
    (from) => {
      const p = journeyWaypoints(atStock(), economy()).find(
        (p) => p.id === PANTRY_STOCK.id,
      )!
      expect([p.walkX, p.walkY]).toEqual([320, 256])
      const path = findWorldPath(PANTRY_STOCK.zoneId, from, {
        x: p.walkX,
        y: p.walkY,
      })
      expect(path.length).toBeGreaterThan(0)
      let prior = from
      for (const next of path) {
        expect(clearPath(PANTRY_STOCK.zoneId, prior, next)).toBe(true)
        prior = next
      }
      expect(nearestObject({ ...atStock(), x: p.walkX, y: p.walkY })?.id).toBe(
        PANTRY_STOCK.id,
      )
    },
  )
  it.each(ZONE_IDS.filter((id) => id !== PANTRY_STOCK.zoneId))(
    "does not inspect remotely in %s",
    (zoneId) => {
      const w = { ...atStock(), zoneId }
      expect(canInspectPantry(w)).toBe(false)
      expect(pantryInspection(w, economy())).toBeUndefined()
    },
  )
  it("requires proximity and a safe player position", () => {
    const w = atStock()
    expect(canInspectPantry({ ...w, x: 320, y: 240 })).toBe(true)
    expect(Math.abs(240 - PANTRY_STOCK.y)).toBe(INTERACT_RANGE)
    expect(canInspectPantry({ ...w, x: 320, y: 239.9 })).toBe(false)
    expect(canInspectPantry({ ...w, x: 320, y: 328 })).toBe(false)
    expect(canInspectPantry({ ...w, x: NaN })).toBe(false)
  })
  it("projects actual committed counts, no implied ownership from world progression", () => {
    const w = atStock(),
      empty = pantryInspection(w, newEconomy())!,
      actual = pantryInspection(w, economy())!
    expect(empty.inventory.map((i) => i.count)).toEqual([0, 0, 0, 0])
    expect(actual.inventory.map((i) => i.count)).toEqual([3, 1, 1, 0])
    expect(actual.possibleMeals).toBe(1)
    expect(actual.ingredients.map((i) => [i.id, i.needed, i.missing])).toEqual([
      ["rice", 1, 0],
      ["herbs", 1, 0],
      ["broth", 1, 0],
    ])
    expect(empty.ingredients.every((i) => i.missing === 1)).toBe(true)
  })
  it("uses actual recipe costs and the least available ingredient, not XP", () => {
    const e = economy()
    e.inventory = { rice: 8, herbs: 2, broth: 5, "warm-bowl": 0 }
    const p = pantryInspection(atStock(), e)!
    expect(p.possibleMeals).toBe(2)
    expect(
      Object.fromEntries(p.ingredients.map((i) => [i.id, i.needed])),
    ).toEqual(WARM_BOWL_RECIPE.ingredients)
    e.inventory.herbs = 0
    expect(pantryInspection(atStock(), e)!.possibleMeals).toBe(0)
  })
  it("projects chest receipt independently from the number of held ingredients", () => {
    const w = atStock(),
      e = economy()
    e.inventory.rice = 9999
    expect(pantryInspection(w, e)!.routes[0].status).toMatch(/Chưa nhận/)
    e.receipts.push(CHEST_RECEIPT)
    e.inventory.rice = 0
    expect(pantryInspection(w, e)!.routes[0].status).toMatch(/Đã nhận/)
  })
  it("does not read or reveal the hint through inspection, and reflects an explicit read", () => {
    const w = atStock(),
      e = economy()
    expect(pantryInspection(w, e)!.routes[1].status).toMatch(/tự ghi lại/)
    expect(w.hintRead).toBe(false)
    expect(
      pantryInspection({ ...w, hintRead: true }, e)!.routes[1].status,
    ).toMatch(/Đã ghi/)
    expect(
      pantryInspection({ ...w, questIndex: 1, accepted: false }, e)!.routes[1]
        .status,
    ).toMatch(/Nhận nhiệm vụ/)
  })
  it("returns only safe same-room walks to chest, hint and both doors", () => {
    const w = atStock()
    for (const route of pantryInspection(w, economy())!.routes) {
      expect(canStand(w.zoneId, route.point.x, route.point.y)).toBe(true)
      expect(findWorldPath(w.zoneId, w, route.point).length).toBeGreaterThan(0)
      expect(nearestObject({ ...w, ...route.point })?.id).toBe(route.id)
      expect(route).not.toHaveProperty("action")
    }
  })
  it.each(["accept", "inspect", "travel", "turn-in", "cook"])(
    "does not make %s a stock world action",
    (action) => {
      const w = atStock(),
        before = JSON.stringify(w)
      expect(() => applyWorldAction(w, PANTRY_STOCK.id, action)).toThrow()
      expect(JSON.stringify(w)).toBe(before)
    },
  )
  it("returns detached snapshots without mutating world, inventory, receipts or layout", () => {
    const w = atStock(),
      e = economy(),
      before = JSON.stringify({ w, e, layout: PANTRY_STOCK })
    const p = pantryInspection(w, e)!
    p.inventory[0].count = 999
    p.routes[0].point.x = 600
    p.ingredients[0].missing = 500
    expect(JSON.stringify({ w, e, layout: PANTRY_STOCK })).toBe(before)
    expect(pantryInspection(w, e)!.inventory[0].count).toBe(3)
  })
  it("actual cook/share keeps the same cost, 45XP and counts shown by inspection", () => {
    const w = {
      ...atStock(),
      zoneId: ZONE_IDS[4],
      x: 432,
      y: 176,
      questIndex: 3,
      accepted: false,
      hintRead: true,
      puzzleStep: 3,
    }
    const e = economy(),
      cooked = applyEconomyAction(e, w, "cook"),
      shared = applyEconomyAction(cooked, w, "share-meal")
    expect(cooked.inventory).toEqual({
      rice: 2,
      herbs: 0,
      broth: 0,
      "warm-bowl": 1,
    })
    expect(shared.teamExperience - e.teamExperience).toBe(45)
    const p = pantryInspection(
      { ...w, ...PANTRY_STOCK.approach, zoneId: PANTRY_STOCK.zoneId },
      shared,
    )!
    expect([p.cooked, p.shared, p.inventory[3].count, p.possibleMeals]).toEqual(
      [1, 1, 0, 0],
    )
  })
  it("reads a historical016D schema5 save without a migration or write", () => {
    const { finalRaw } = JSON.parse(
      readFileSync("docs/aw2/evidence/AW2-016D-source-browser.json", "utf8"),
    )
    expect(JSON.parse(finalRaw).schemaVersion).toBe(5)
    const setItem = vi.fn(),
      getItem = vi.fn(() => finalRaw)
    const store = new Aw2DevSaveStore({ storage: () => ({ getItem, setItem }) })
    expect(store.load()).toEqual(decodeAw2Save(finalRaw))
    const s = store.load()
    expect(s.status).toBe("ready")
    if (s.status !== "ready") throw Error("Expected historical readable save")
    const p = pantryInspection(
      { ...s.save.progress, zoneId: PANTRY_STOCK.zoneId, x: 320, y: 256 },
      s.save.economy,
    )
    expect(p).toBeDefined()
    expect(setItem).not.toHaveBeenCalled()
    expect(s.raw).toBe(finalRaw)
  })
})
