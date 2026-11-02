import { atEntity } from "./entity-fixture"
import { describe, expect, it } from "vitest"
import { AW2_MODES, type Aw2ModeId, type ModeEntry } from "@/aw2/modes/catalog"
import { Aw2ModeAdapter } from "@/aw2/modes/session"
import { Aw2DevSaveStore } from "@/aw2/save/store"
import { AW2_DEV_SAVE_KEY, AW2_RESET_CONFIRMATION } from "@/aw2/save/schema"
import { ZONE_IDS } from "@/aw2/world/ids"

async function fixture() {
  const memory = new Map([["foodchest.tcg.v1", "stable unchanged"]])
  let fail = false,
    writes = 0,
    serial = 0
  let tail = Promise.resolve()
  const store = new Aw2DevSaveStore({
    storage: () => ({
      getItem: (key) => {
        expect(key).toBe(AW2_DEV_SAVE_KEY)
        return memory.get(key) ?? null
      },
      setItem: (key, value) => {
        expect(key).toBe(AW2_DEV_SAVE_KEY)
        if (fail) throw Error("quota")
        writes++
        memory.set(key, value)
      },
    }),
    lock: <T>(action: () => T) => {
      const next = tail.then(action)
      tail = next.then(
        () => undefined,
        () => undefined,
      )
      return next
    },
    now: () => "2026-10-21T12:00:00.000Z",
    newId: () =>
      `00000000-0000-4000-8000-${String(++serial).padStart(12, "0")}`,
  })
  const saved = await store.save(null)
  return {
    store,
    saved,
    memory,
    adapter: new Aw2ModeAdapter(store),
    fail: (value: boolean) => {
      fail = value
    },
    writes: () => writes,
  }
}

describe("MODE-01 transition foundation (lobby only)", () => {
  it.each(AW2_MODES)(
    "checkpoints and returns from $id without quest, item or legacy writes",
    async (mode) => {
      const f = await fixture()
      const progress = { ...f.saved.save.progress, x: 192, y: 224 }
      const entered = await f.adapter.enter(
        f.saved.raw,
        progress,
        mode.id,
        "quick-entry",
      )
      expect(entered.checkpoint.save.revision).toBe(1)
      expect(entered.checkpoint.save.progress).toEqual(progress)
      expect(entered.checkpoint.save.economy).toEqual(f.saved.save.economy)
      const writes = f.writes()
      expect(f.adapter.returnToWorld()).toEqual(entered.checkpoint)
      expect(f.writes()).toBe(writes)
      expect(f.memory.get("foodchest.tcg.v1")).toBe("stable unchanged")
      expect(() => f.adapter.returnToWorld()).toThrow()
    },
  )

  it.each(AW2_MODES)(
    "uses the same checkpoint policy through the $id portal",
    async (mode) => {
      const f = await fixture()
      const progress = atEntity(f.saved.save.progress, mode.portalId)
      const outside = { ...progress, interior: null }
      const moved = await f.store.save(f.saved.raw, outside)
      const checkpoint = await f.store.act(
        moved.raw,
        outside,
        "aw2-object-street-play-door",
        "enter-room",
        () => {},
      )
      const entered = await f.adapter.enter(
        checkpoint.raw,
        progress,
        mode.id,
        "portal",
      )
      expect(entered.visit).toEqual({
        modeId: mode.id,
        entry: "portal",
        returnZoneId: ZONE_IDS[1],
        returnRoomId: "aw2-room-street-play",
      })
      expect(f.adapter.returnToWorld().save.progress).toEqual(progress)
    },
  )

  it("rejects wrong-zone, distant and mismatched portals before writing", async () => {
    const f = await fixture(),
      before = f.writes()
    for (const progress of [
      f.saved.save.progress,
      { ...f.saved.save.progress, zoneId: ZONE_IDS[1], x: 96, y: 192 },
      { ...f.saved.save.progress, zoneId: ZONE_IDS[1], x: 432, y: 272 },
    ])
      await expect(
        f.adapter.enter(f.saved.raw, progress, "tcg", "portal"),
      ).rejects.toThrow(/đúng bàn/)
    expect(f.writes()).toBe(before)
  })

  it("rejects unknown modes/sources, invalid positions and absent saves before writes", async () => {
    const f = await fixture(),
      before = f.writes()
    await expect(
      f.adapter.enter(
        f.saved.raw,
        f.saved.save.progress,
        "legacy" as Aw2ModeId,
        "quick-entry",
      ),
    ).rejects.toThrow()
    await expect(
      f.adapter.enter(
        f.saved.raw,
        f.saved.save.progress,
        "tcg",
        "other" as ModeEntry,
      ),
    ).rejects.toThrow()
    await expect(
      f.adapter.enter("null", f.saved.save.progress, "tcg", "quick-entry"),
    ).rejects.toThrow()
    await expect(
      f.adapter.enter(
        f.saved.raw,
        { ...f.saved.save.progress, x: 320, y: 320 },
        "tcg",
        "quick-entry",
      ),
    ).rejects.toThrow()
    expect(f.writes()).toBe(before)
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(f.saved.raw)
  })

  it("keeps a failed checkpoint retryable and rejects stale entry", async () => {
    const f = await fixture()
    f.fail(true)
    await expect(
      f.adapter.enter(f.saved.raw, f.saved.save.progress, "tcg", "quick-entry"),
    ).rejects.toMatchObject({ code: "write-failed" })
    expect(() => f.adapter.returnToWorld()).toThrow()
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(f.saved.raw)
    f.fail(false)
    const newer = await f.store.save(f.saved.raw)
    await expect(
      f.adapter.enter(f.saved.raw, f.saved.save.progress, "tcg", "quick-entry"),
    ).rejects.toMatchObject({ code: "conflict" })
    const entered = await f.adapter.enter(
      newer.raw,
      newer.save.progress,
      "tcg",
      "quick-entry",
    )
    expect(f.adapter.returnToWorld()).toEqual(entered.checkpoint)
  })

  it("blocks a second entry during checkpointing and while a visit is active", async () => {
    const f = await fixture()
    const first = f.adapter.enter(
      f.saved.raw,
      f.saved.save.progress,
      "tcg",
      "quick-entry",
    )
    expect(() => f.adapter.abandon()).toThrow()
    await expect(
      f.adapter.enter(
        f.saved.raw,
        f.saved.save.progress,
        "auto-chess",
        "quick-entry",
      ),
    ).rejects.toThrow()
    const entered = await first
    await expect(
      f.adapter.enter(
        entered.checkpoint.raw,
        entered.checkpoint.save.progress,
        "auto-chess",
        "quick-entry",
      ),
    ).rejects.toThrow()
    expect(f.writes()).toBe(2)
  })

  it("allows one winner for competing adapter checkpoints", async () => {
    const f = await fixture(),
      other = new Aw2ModeAdapter(f.store)
    const results = await Promise.allSettled([
      f.adapter.enter(f.saved.raw, f.saved.save.progress, "tcg", "quick-entry"),
      other.enter(
        f.saved.raw,
        f.saved.save.progress,
        "auto-chess",
        "quick-entry",
      ),
    ])
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1)
    expect(f.writes()).toBe(2)
  })

  it("rejects entry while a world battle is active, including late activity changes", async () => {
    const f = await fixture()
    let canEnter = false
    const adapter = new Aw2ModeAdapter(f.store, () => canEnter)
    await expect(
      adapter.enter(f.saved.raw, f.saved.save.progress, "tcg", "quick-entry"),
    ).rejects.toThrow()
    expect(f.writes()).toBe(1)
    canEnter = true
    const pending = adapter.enter(
      f.saved.raw,
      f.saved.save.progress,
      "tcg",
      "quick-entry",
    )
    canEnter = false
    await expect(pending).rejects.toMatchObject({ code: "conflict" })
    expect(() => adapter.returnToWorld()).toThrow()
  })

  it("does not trust mutated renderer snapshots when returning", async () => {
    const f = await fixture()
    const entered = await f.adapter.enter(
      f.saved.raw,
      f.saved.save.progress,
      "tcg",
      "quick-entry",
    )
    entered.visit.returnZoneId = ZONE_IDS[5]
    entered.checkpoint.save.progress.questIndex = 4
    entered.checkpoint.save.economy.teamExperience = 1000
    const returned = f.adapter.returnToWorld()
    expect(returned.save.progress).toEqual(f.saved.save.progress)
    expect(returned.save.economy).toEqual(f.saved.save.economy)
  })

  it.each(["newer", "reset", "missing", "corrupt", "future"])(
    "cannot overwrite a %s save on return",
    async (condition) => {
      const f = await fixture()
      const entered = await f.adapter.enter(
        f.saved.raw,
        f.saved.save.progress,
        "tcg",
        "quick-entry",
      )
      if (condition === "newer") await f.store.save(entered.checkpoint.raw)
      if (condition === "reset")
        await f.store.confirmReset(
          f.store.beginReset(entered.checkpoint.raw),
          AW2_RESET_CONFIRMATION,
        )
      if (condition === "missing") f.memory.delete(AW2_DEV_SAVE_KEY)
      if (condition === "corrupt") f.memory.set(AW2_DEV_SAVE_KEY, "{invalid")
      if (condition === "future")
        f.memory.set(AW2_DEV_SAVE_KEY, '{"schemaVersion":99}')
      const before = f.memory.get(AW2_DEV_SAVE_KEY),
        writes = f.writes()
      expect(() => f.adapter.returnToWorld()).toThrow(/Đọc lại/)
      expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(before)
      f.adapter.abandon()
      expect(f.writes()).toBe(writes)
    },
  )

  it("reload abandons the visit at its checkpoint without grants or resume", async () => {
    const f = await fixture()
    const entered = await f.adapter.enter(
      f.saved.raw,
      f.saved.save.progress,
      "auto-chess",
      "quick-entry",
    )
    const reloaded = new Aw2ModeAdapter(f.store)
    expect(() => reloaded.returnToWorld()).toThrow()
    expect(f.store.load()).toEqual(entered.checkpoint)
    f.adapter.abandon()
    expect(() => f.adapter.returnToWorld()).toThrow()
    expect(f.writes()).toBe(2)
  })
})
