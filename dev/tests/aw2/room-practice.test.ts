import { describe, expect, it, vi } from "vitest"
import { Aw2DevSaveStore } from "@/aw2/save/store"
import { AW2_DEV_SAVE_KEY, decodeAw2Save } from "@/aw2/save/schema"
import { Aw2ModeAdapter } from "@/aw2/modes/session"
import { AW2_MODES } from "@/aw2/modes/catalog"
import { canUseRoomPractice } from "@/aw2/modes/roomPractice"
import {
  TEA_ROOM,
  TEA_DOOR_ID,
  TEA_JOURNAL_ID,
} from "@/aw2/world/interiorLayout"
import { describeObject } from "@/aw2/world/rules"
import { newWorldProgress, type WorldProgress } from "@/aw2/world/model"

async function fixture() {
  const memory = new Map<string, string>([["foodchest.tcg.v1", "stable"]])
  let fail = false,
    serial = 0
  const write = vi.fn((key: string, value: string) => {
    if (fail) throw Error("quota")
    memory.set(key, value)
  })
  let tail = Promise.resolve()
  const store = new Aw2DevSaveStore({
    storage: () => ({ getItem: (k) => memory.get(k) ?? null, setItem: write }),
    lock: <T>(action: () => T) => {
      const next = tail.then(action)
      tail = next.then(
        () => undefined,
        () => undefined,
      )
      return next
    },
    now: () => "2026-10-28T12:00:00.000Z",
    newId: () =>
      `00000000-0000-4000-8000-${String(++serial).padStart(12, "0")}`,
  })
  const first = await store.save(null),
    outside = { ...first.save.progress, x: 300, y: 80, facing: "up" as const }
  const entered = await store.act(
    first.raw,
    outside,
    TEA_DOOR_ID,
    "enter-room",
    () => {},
  )
  const near: WorldProgress = {
    ...entered.save.progress,
    interior: { ...TEA_ROOM.spawn, x: 432, y: 160 },
  }
  return {
    memory,
    write,
    store,
    entered,
    near,
    adapter: new Aw2ModeAdapter(store),
    fail: (value: boolean) => {
      fail = value
    },
  }
}

describe("016K real tea desk service", () => {
  it("offers only a view action at the existing journal desk without changing geometry", async () => {
    const f = await fixture(),
      before = f.write.mock.calls.length
    const desk = TEA_ROOM.objects.find((o) => o.id === TEA_JOURNAL_ID)!
    expect(describeObject(f.near, desk).actions.map((a) => a.id)).toEqual([
      "view-journal",
      "view-recipe",
      "view-practice",
    ])
    expect(TEA_ROOM.objects).toHaveLength(3)
    expect(f.write).toHaveBeenCalledTimes(before)
  })
  it.each(AW2_MODES)(
    "$id stores exact inside and outside once, then returns without reward/write",
    async (mode) => {
      const f = await fixture(),
        before = f.write.mock.calls.length
      const started = await f.adapter.enter(
        f.entered.raw,
        f.near,
        mode.id,
        "room-service",
      )
      expect(started.visit).toEqual({
        modeId: mode.id,
        entry: "room-service",
        returnZoneId: f.near.zoneId,
        returnRoomId: TEA_ROOM.id,
      })
      expect(started.checkpoint.save.progress).toEqual(f.near)
      expect(started.checkpoint.save.economy).toEqual(f.entered.save.economy)
      expect(started.checkpoint.save.collection).toEqual(
        f.entered.save.collection,
      )
      expect(started.checkpoint.save.schemaVersion).toBe(8)
      expect(started.checkpoint.save.revision).toBe(f.entered.save.revision + 1)
      expect(f.write).toHaveBeenCalledTimes(before + 1)
      expect(f.adapter.returnToWorld()).toEqual(started.checkpoint)
      expect(f.write).toHaveBeenCalledTimes(before + 1)
      expect(f.memory.get("foodchest.tcg.v1")).toBe("stable")
    },
  )
  it.each([0, 32, 48, 48.01, 60])(
    "checks true desk range at %fpx",
    async (distance) => {
      const f = await fixture(),
        progress = {
          ...f.near,
          interior: { ...TEA_ROOM.spawn, x: 432, y: 128 + distance },
        }
      expect(canUseRoomPractice(progress)).toBe(distance <= 48)
      const writes = f.write.mock.calls.length
      if (distance <= 48)
        await f.adapter.enter(f.entered.raw, progress, "tcg", "room-service")
      else {
        await expect(
          f.adapter.enter(f.entered.raw, progress, "tcg", "room-service"),
        ).rejects.toThrow(/góc nhật ký/)
        expect(f.write).toHaveBeenCalledTimes(writes)
      }
    },
  )
  it("rejects outdoors, the other desk, the room spawn and malformed scene before saving", async () => {
    const f = await fixture(),
      writes = f.write.mock.calls.length
    for (const progress of [
      newWorldProgress(),
      { ...f.near, interior: null },
      { ...f.near, interior: { ...TEA_ROOM.spawn } },
      { ...f.near, interior: { ...TEA_ROOM.spawn, x: 240, y: 160 } },
      { ...f.near, interior: { ...TEA_ROOM.spawn, x: NaN } },
    ]) {
      expect(canUseRoomPractice(progress)).toBe(false)
      await expect(
        f.adapter.enter(f.entered.raw, progress, "tcg", "room-service"),
      ).rejects.toThrow()
    }
    expect(f.write).toHaveBeenCalledTimes(writes)
  })
  it("write failure keeps exact bytes and permits one explicit retry", async () => {
    const f = await fixture()
    f.fail(true)
    await expect(
      f.adapter.enter(f.entered.raw, f.near, "tcg", "room-service"),
    ).rejects.toMatchObject({ code: "write-failed" })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(f.entered.raw)
    expect(() => f.adapter.returnToWorld()).toThrow()
    f.fail(false)
    const result = await f.adapter.enter(
      f.entered.raw,
      f.near,
      "tcg",
      "room-service",
    )
    expect(result.checkpoint.save.revision).toBe(f.entered.save.revision + 1)
  })
  it("concurrent requests mount at most one visit and checkpoint once", async () => {
    const f = await fixture(),
      writes = f.write.mock.calls.length
    const attempts = await Promise.allSettled([
      f.adapter.enter(f.entered.raw, f.near, "tcg", "room-service"),
      f.adapter.enter(f.entered.raw, f.near, "auto-chess", "room-service"),
    ])
    expect(attempts.filter((a) => a.status === "fulfilled")).toHaveLength(1)
    expect(attempts.filter((a) => a.status === "rejected")).toHaveLength(1)
    expect(f.write).toHaveBeenCalledTimes(writes + 1)
  })
  it("rejects stale checkpoint before overwrite, and stale return after a visit", async () => {
    const f = await fixture(),
      newer = await f.store.save(f.entered.raw, f.near)
    await expect(
      f.adapter.enter(f.entered.raw, f.near, "tcg", "room-service"),
    ).rejects.toMatchObject({ code: "conflict" })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(newer.raw)
    const visit = await f.adapter.enter(
      newer.raw,
      f.near,
      "tcg",
      "room-service",
    )
    const next = await f.store.save(visit.checkpoint.raw, f.near)
    expect(() => f.adapter.returnToWorld()).toThrow(/thay đổi/)
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(next.raw)
    f.adapter.abandon()
  })
  it("reread keeps a completed room checkpoint byte-identical and cannot resume a mode", async () => {
    const f = await fixture(),
      visit = await f.adapter.enter(
        f.entered.raw,
        f.near,
        "auto-chess",
        "room-service",
      )
    const writes = f.write.mock.calls.length
    expect(decodeAw2Save(visit.checkpoint.raw)).toMatchObject({
      status: "ready",
      save: { schemaVersion: 8, progress: f.near },
    })
    expect(() => new Aw2ModeAdapter(f.store).returnToWorld()).toThrow()
    expect(f.store.load()).toEqual(visit.checkpoint)
    expect(f.write).toHaveBeenCalledTimes(writes)
  })
})
