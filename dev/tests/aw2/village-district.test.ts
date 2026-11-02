import { describe, it, expect, vi } from "vitest"
import {
  VILLAGE_ROOMS as ROOMS,
  TEA_ROOM,
  HOME_ROOM,
  GUILD_ROOM,
  roomById,
} from "@/aw2/world/interiorLayout"
import { newWorldProgress, worldProgressSchema } from "@/aw2/world/model"
import { applyWorldAction, describeObject } from "@/aw2/world/rules"
import { sceneId, sceneObjects } from "@/aw2/world/scene"
import { findWorldPath, clearPath } from "@/aw2/world/navigation"
import { placeApproach } from "@/aw2/world/placeGuidance"
import {
  settlementForZone,
  scenicWalkingLandmarks,
} from "@/aw2/assets/settlement"
import { villageFacadeTarget } from "@/aw2/assets/villageDistrict"
import { roomScene } from "@/aw2/assets/teaRoom"
import { Aw2DevSaveStore } from "@/aw2/save/store"
import { decodeAw2Save, AW2_DEV_SAVE_KEY } from "@/aw2/save/schema"
import { Aw2ModeAdapter } from "@/aw2/modes/session"

describe("017A functional village graph", () => {
  it("has three distinct buildings/entrances/interiors and no scenic-only village destination", () => {
    const buildings = settlementForZone(TEA_ROOM.zoneId)!.buildings
    expect(buildings).toHaveLength(3)
    expect(new Set(ROOMS.map((r) => r.id)).size).toBe(3)
    for (const building of buildings)
      expect(ROOMS.filter((r) => r.entrance.x === building.x)).toHaveLength(1)
    expect(scenicWalkingLandmarks(TEA_ROOM.zoneId)).toEqual([])
  })
  it.each(ROOMS)(
    "$id has reachable facade/door and own collision/services/return",
    (room) => {
      const start = newWorldProgress(),
        point = villageFacadeTarget({ x: room.entrance.x, y: -64 })
      expect(point).toEqual(room.approach)
      const path = findWorldPath(start.zoneId, start, point)
      expect(path.length).toBeGreaterThan(0)
      const outside = { ...start, ...point, facing: "up" as const }
      delete (outside as { entityId?: string }).entityId
      const inside = applyWorldAction(
        outside,
        room.entrance.id,
        "enter-room",
      ).state
      expect(sceneId(inside)).toBe(room.id)
      expect(sceneObjects(inside)).toEqual(room.objects)
      expect(inside.x).toBe(outside.x)
      expect(inside.y).toBe(outside.y)
      for (const object of room.objects) {
        expect(
          findWorldPath(room.id, room.spawn, placeApproach(object)).length,
        ).toBeGreaterThan(0)
        expect(describeObject(inside, object).actions.length).toBeGreaterThan(0)
      }
      const exit = room.objects[0],
        beforeExit = { ...inside, interior: { ...room.spawn, x: 48, y: 192 } }
      const returned = applyWorldAction(beforeExit, exit.id, "leave-room").state
      expect(returned).toEqual({ ...outside, interior: null })
      expect(() =>
        worldProgressSchema.parse({ ...inside, x: room.entrance.x + 70 }),
      ).toThrow()
      expect(
        roomScene(room.id)
          .props.map((p) => p.entityId)
          .sort(),
      ).toEqual(room.objects.map((o) => o.id).sort())
    },
  )
  it("keeps outdoor story/old-save geometry, and gives the two new interiors separate layouts", () => {
    expect(
      clearPath(TEA_ROOM.zoneId, { x: 96, y: 192 }, { x: 300, y: 80 }),
    ).toBe(true)
    expect(HOME_ROOM.objects[2].y).not.toBe(TEA_ROOM.objects[2].y)
    expect(() => roomById("unknown")).toThrow()
    expect(villageFacadeTarget({ x: 160, y: 240 })).toEqual({ x: 160, y: 240 })
  })
})

async function fixture() {
  const memory = new Map<string, string>([["foodchest.tcg.v1", "legacy"]])
  const setItem = vi.fn((k: string, v: string) => memory.set(k, v))
  let fail = false
  const store = new Aw2DevSaveStore({
    storage: () => ({
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => {
        if (fail) throw Error("quota")
        setItem(k, v)
      },
    }),
    lock: (action) => Promise.resolve().then(action),
    now: () => "2026-10-28T00:00:00.000Z",
    newId: () => "00000000-0000-4000-8000-000000000001",
  })
  return {
    memory,
    setItem,
    store,
    first: await store.save(null),
    fail: (v: boolean) => {
      fail = v
    },
  }
}
describe("017A save6 to7 and real room services", () => {
  it("reads strict historical6 without writes and upgrades only on explicit save", async () => {
    const f = await fixture(),
      old = { ...f.first.save, schemaVersion: 6 }
    const raw = JSON.stringify(old)
    f.memory.set(AW2_DEV_SAVE_KEY, raw)
    f.setItem.mockClear()
    expect(f.store.load()).toMatchObject({
      status: "ready",
      raw,
      save: {
        schemaVersion: 8,
        saveId: old.saveId,
        revision: old.revision,
        progress: old.progress,
      },
    })
    expect(f.setItem).not.toHaveBeenCalled()
    const saved = await f.store.save(raw)
    expect(saved.save.schemaVersion).toBe(8)
    expect(saved.save.progress).toEqual(old.progress)
    expect(f.memory.get("foodchest.tcg.v1")).toBe("legacy")
  })
  it.each(ROOMS)(
    "persists/reloads $id, failed entry never commits, exit restores exact outside",
    async (room) => {
      const f = await fixture(),
        outside = {
          ...f.first.save.progress,
          ...room.approach,
          facing: "up" as const,
        }
      delete (outside as { entityId?: string }).entityId
      f.fail(true)
      await expect(
        f.store.act(
          f.first.raw,
          outside,
          room.entrance.id,
          "enter-room",
          () => {},
        ),
      ).rejects.toThrow()
      expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(f.first.raw)
      f.fail(false)
      const entry = await f.store.act(
        f.first.raw,
        outside,
        room.entrance.id,
        "enter-room",
        () => {},
      )
      expect(f.store.load()).toEqual(entry)
      expect(entry.save.progress.interior!.roomId).toBe(room.id)
      const legacy6 = JSON.stringify({ ...entry.save, schemaVersion: 6 })
      expect(decodeAw2Save(legacy6).status).toBe(
        room.id === TEA_ROOM.id ? "ready" : "invalid",
      )
      const result = await f.store.act(
        entry.raw,
        { ...entry.save.progress, interior: { ...room.spawn, x: 48, y: 192 } },
        room.objects[0].id,
        "leave-room",
        () => {},
      )
      expect(result.save.progress).toEqual({ ...outside, interior: null })
      expect(result.save.economy).toEqual(f.first.save.economy)
    },
  )
  it.each(["tcg", "auto-chess"] as const)(
    "guild %s portal checkpoints actual room coordinates and returns without write",
    async (mode) => {
      const f = await fixture(),
        outside = { ...f.first.save.progress, ...GUILD_ROOM.approach }
      delete (outside as { entityId?: string }).entityId
      const room = await f.store.act(
        f.first.raw,
        outside,
        GUILD_ROOM.entrance.id,
        "enter-room",
        () => {},
      )
      const table = GUILD_ROOM.objects[mode === "tcg" ? 1 : 2],
        progress = {
          ...room.save.progress,
          interior: { ...GUILD_ROOM.spawn, x: table.x, y: table.y + 32 },
        }
      const adapter = new Aw2ModeAdapter(f.store),
        visit = await adapter.enter(room.raw, progress, mode, "portal")
      expect(visit.visit.returnRoomId).toBe(GUILD_ROOM.id)
      expect(visit.checkpoint.save.progress).toEqual(progress)
      const writes = f.setItem.mock.calls.length
      expect(adapter.returnToWorld()).toEqual(visit.checkpoint)
      expect(f.setItem).toHaveBeenCalledTimes(writes)
    },
  )
})
