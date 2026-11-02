import { describe, it, expect, vi } from "vitest"
import { atEntity } from "./entity-fixture"
import {
  ROOMS,
  STREET_ROOMS,
  VILLAGE_ROOMS,
  roomById,
} from "@/aw2/world/interiorLayout"
import { ZONES } from "@/aw2/world/maps"
import { sceneId, sceneObjects, entityLocation } from "@/aw2/world/scene"
import { newWorldProgress, type WorldProgress } from "@/aw2/world/model"
import { applyWorldAction } from "@/aw2/world/rules"
import { journeyDirections } from "@/aw2/world/journey"
import { findWorldPath, clearPath } from "@/aw2/world/navigation"
import { placeApproach } from "@/aw2/world/placeGuidance"
import { placeAffordance } from "@/aw2/world/placeAffordance"
import { newEconomy } from "@/aw2/economy/model"
import { settlementForZone } from "@/aw2/assets/settlement"
import { npcVisualsForScene } from "@/aw2/assets/npcPatrol"
import { worldAssetUrls } from "@/aw2/assets/worldAssets"
import { streetFacadeTarget } from "@/aw2/assets/streetDistrict"
import { Aw2DevSaveStore } from "@/aw2/save/store"
import { decodeAw2Save, AW2_DEV_SAVE_KEY } from "@/aw2/save/schema"

const memoryIds = ["aw2-npc-nguoi-ban", "aw2-npc-sua-ghe", "aw2-npc-dem-nuoc"]
function action(world: WorldProgress, id: string, action: string) {
  return applyWorldAction(atEntity(world, id), id, action).state
}
function accepted() {
  let w = action(newWorldProgress(), "aw2-npc-giu-cho", "accept")
  w = action(w, "aw2-object-village-table", "inspect")
  w = action(w, "aw2-npc-giu-cho", "turn-in")
  return action(w, "aw2-npc-va-den", "accept")
}

describe("017B scene graph and objective routes", () => {
  it("keeps eight unique canonical NPCs, with four inside and no outdoor ghosts", () => {
    const objects = [
      ...ZONES.flatMap((z) => z.objects),
      ...ROOMS.flatMap((r) => r.objects),
    ]
    const npcs = objects.filter((o) => o.id.startsWith("aw2-npc-"))
    expect(npcs).toHaveLength(8)
    expect(new Set(npcs.map((o) => o.id)).size).toBe(8)
    expect(
      npcVisualsForScene(STREET_ROOMS[0].zoneId)
        .map((n) => n.entityId)
        .sort(),
    ).toEqual(["aw2-npc-dem-nuoc", "aw2-npc-va-den"])
    for (const room of STREET_ROOMS) {
      expect(
        npcVisualsForScene(room.id)
          .map((n) => n.entityId)
          .sort(),
      ).toEqual(
        room.objects
          .filter((o) => o.id.startsWith("aw2-npc-"))
          .map((o) => o.id)
          .sort(),
      )
      for (const n of npcVisualsForScene(room.id))
        expect(worldAssetUrls(atEntity(accepted(), n.entityId))).toContain(
          n.asset.url,
        )
    }
  })
  it.each(STREET_ROOMS)(
    "$id has one functional facade, safe paths and its own return",
    (room) => {
      expect(
        settlementForZone(room.zoneId)!.buildings.filter(
          (b) => b.x === room.entrance.x,
        ),
      ).toHaveLength(1)
      const source = {
        ...accepted(),
        x: room.approach.x,
        y: room.approach.y,
        facing: "up" as const,
      }
      expect(streetFacadeTarget({ x: room.entrance.x, y: -64 })).toEqual(
        room.approach,
      )
      const entered = applyWorldAction(
        source,
        room.entrance.id,
        "enter-room",
      ).state
      expect(sceneId(entered)).toBe(room.id)
      for (const object of sceneObjects(entered)) {
        const path = findWorldPath(room.id, room.spawn, placeApproach(object))
        expect(path.length).toBeGreaterThan(0)
        let previous = { x: room.spawn.x, y: room.spawn.y }
        for (const p of path) {
          expect(clearPath(room.id, previous, p)).toBe(true)
          previous = p
        }
      }
      const exit = room.objects[0]
      expect(
        applyWorldAction(
          { ...entered, interior: { ...room.spawn, x: 48, y: 192 } },
          exit.id,
          "leave-room",
        ).state,
      ).toEqual({ ...source, interior: null })
    },
  )
  it.each([
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ])(
    "routes memory order %s through doors and preserves actual quest rules",
    (...order) => {
      let w = accepted()
      for (const index of order) {
        const id = memoryIds[index],
          target = entityLocation(id)!
        const before = JSON.stringify(w),
          d = journeyDirections(w).find((d) => d.targetId === id)!
        expect(d.targetRoomId).toBe(target.roomId)
        expect(JSON.stringify(w)).toBe(before)
        if (w.interior && w.interior.roomId !== target.roomId)
          expect(d.next.kind).toBe("room-exit")
        else if (target.roomId && !w.interior)
          expect(d.next.id).toBe(roomById(target.roomId).entrance.id)
        const inside = atEntity(w, id),
          direct = journeyDirections(inside).find((d) => d.targetId === id)!
        expect(direct.next.id).toBe(id)
        w = action(w, id, "remember")
        expect(journeyDirections(w).some((d) => d.targetId === id)).toBe(false)
      }
      expect(journeyDirections(w).map((d) => d.targetId)).toEqual([
        "aw2-npc-va-den",
      ])
      expect(action(w, "aw2-npc-va-den", "thread-return")).toMatchObject({
        questIndex: 2,
        accepted: false,
        interior: null,
      })
    },
  )
  it("marks the correct quest door only while its resident memory is available", () => {
    let w = accepted()
    const door = STREET_ROOMS[0].entrance.id
    expect(placeAffordance(w, newEconomy(), door)?.state).toBe("quest-active")
    w = action(w, memoryIds[0], "remember")
    expect(
      placeAffordance({ ...w, interior: null }, newEconomy(), door)?.state,
    ).toBe("open")
    expect(
      placeAffordance({ ...accepted(), accepted: false }, newEconomy(), door)
        ?.state,
    ).toBe("open")
  })
})

describe("017B strict save7 compatibility", () => {
  async function fixture() {
    const data = new Map<string, string>([["foodchest.tcg.v1", "legacy"]]),
      write = vi.fn((k: string, v: string) => data.set(k, v))
    let fail = false
    const store = new Aw2DevSaveStore({
      storage: () => ({
        getItem: (k) => data.get(k) ?? null,
        setItem: (k, v) => {
          if (fail) throw Error("quota")
          write(k, v)
        },
      }),
      lock: async (action) => action(),
      now: () => "2026-10-28T00:00:00.000Z",
      newId: () => "00000000-0000-4000-8000-000000000001",
    })
    return {
      data,
      write,
      store,
      first: await store.save(null),
      fail: (value: boolean) => (fail = value),
    }
  }
  it.each([null, ...VILLAGE_ROOMS])(
    "reads old7 checkpoint %s without write, explicitly upgrades8",
    async (room) => {
      const f = await fixture(),
        progress = room
          ? {
              ...newWorldProgress(),
              x: room.approach.x,
              y: room.approach.y,
              interior: { ...room.spawn },
            }
          : newWorldProgress()
      const old = { ...f.first.save, schemaVersion: 7, progress },
        raw = JSON.stringify(old)
      f.data.set(AW2_DEV_SAVE_KEY, raw)
      f.write.mockClear()
      expect(f.store.load()).toMatchObject({
        status: "ready",
        raw,
        save: { schemaVersion: 8, progress },
      })
      expect(f.write).not.toHaveBeenCalled()
      const saved = await f.store.save(raw)
      expect(saved.save).toMatchObject({
        schemaVersion: 8,
        saveId: old.saveId,
        createdAt: old.createdAt,
        progress,
      })
      expect(f.data.get("foodchest.tcg.v1")).toBe("legacy")
    },
  )
  it.each(STREET_ROOMS)(
    "$id rejects relabelled7; failed entry preserves raw then retry/reload/exit succeeds",
    async (room) => {
      const f = await fixture(),
        outside = {
          ...newWorldProgress(),
          zoneId: room.zoneId,
          x: room.approach.x,
          y: room.approach.y,
        }
      const moved = await f.store.save(f.first.raw, outside)
      f.fail(true)
      await expect(
        f.store.act(
          moved.raw,
          outside,
          room.entrance.id,
          "enter-room",
          () => {},
        ),
      ).rejects.toThrow()
      expect(f.data.get(AW2_DEV_SAVE_KEY)).toBe(moved.raw)
      f.fail(false)
      const entered = await f.store.act(
        moved.raw,
        outside,
        room.entrance.id,
        "enter-room",
        () => {},
      )
      expect(f.store.load()).toMatchObject({
        status: "ready",
        save: { progress: entered.save.progress },
      })
      expect(
        decodeAw2Save(JSON.stringify({ ...entered.save, schemaVersion: 7 }))
          .status,
      ).toBe("invalid")
      const exited = await f.store.act(
        entered.raw,
        {
          ...entered.save.progress,
          interior: { ...room.spawn, x: 48, y: 192 },
        },
        room.objects[0].id,
        "leave-room",
        () => {},
      )
      expect(exited.save.progress).toEqual({ ...outside, interior: null })
    },
  )
})
