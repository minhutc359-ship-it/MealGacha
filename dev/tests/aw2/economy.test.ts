import { legacyProgress } from "./legacy-fixtures"
import { describe, expect, it } from "vitest"
import { Aw2DevSaveStore } from "@/aw2/save/store"
import { AW2_DEV_SAVE_KEY, decodeAw2Save } from "@/aw2/save/schema"
import { newWorldProgress, type WorldProgress } from "@/aw2/world/model"
import { MEMORY_IDS, STARTER_TEAM, ZONE_IDS } from "@/aw2/world/ids"
import { CHEST_RECEIPT, economySchema, newEconomy } from "@/aw2/economy/model"
import { developmentStarterStats } from "@/aw2/combat/progression"

const progressed = (extra: Partial<WorldProgress> = {}): WorldProgress => ({
  ...newWorldProgress(),
  zoneId: ZONE_IDS[3],
  x: 432,
  y: 272,
  questIndex: 3,
  tableRead: true,
  memories: [...MEMORY_IDS],
  threadChoice: "wait",
  hintRead: true,
  puzzleStep: 3,
  partyIds: [...STARTER_TEAM],
  ...extra,
})
function fixture(progress = progressed()) {
  const old = {
    gameId: "adventure-world-2",
    environment: "development",
    schemaVersion: 3,
    saveId: "00000000-0000-4000-8000-000000000001",
    revision: 7,
    createdAt: "2026-10-20T08:00:00.000Z",
    updatedAt: "2026-10-20T08:00:00.000Z",
    progress: legacyProgress(progress),
  }
  const raw = JSON.stringify(old)
  const memory = new Map([
    [AW2_DEV_SAVE_KEY, raw],
    ["foodchest.tcg.v1", "stable original"],
  ])
  let fail = false,
    tail = Promise.resolve()
  const options = {
    storage: () => ({
      getItem: (key: string) => {
        expect(key).toBe(AW2_DEV_SAVE_KEY)
        return memory.get(key) ?? null
      },
      setItem: (key: string, value: string) => {
        expect(key).toBe(AW2_DEV_SAVE_KEY)
        if (fail) throw Error("quota")
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
    now: () => "2026-10-21T01:00:00.000Z",
  }
  return {
    raw,
    old,
    memory,
    store: new Aw2DevSaveStore(options),
    other: new Aw2DevSaveStore(options),
    fail: (value: boolean) => {
      fail = value
    },
  }
}
describe("SAVE-02 inventory, chest and cooking transactions", () => {
  it("rejects valid-looking quest/objective changes through ordinary position saves before rewards can be claimed", async () => {
    const initial = newWorldProgress(),
      f = fixture(initial)
    for (const forged of [
      { ...initial, accepted: true },
      { ...initial, accepted: true, tableRead: true },
      {
        ...initial,
        questIndex: 1,
        tableRead: true,
        partyIds: [...STARTER_TEAM],
      },
    ]) {
      await expect(f.store.save(f.raw, forged)).rejects.toThrow()
      expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(f.raw)
    }
    await expect(
      f.store.economyAction(f.raw, initial, "claim-quests"),
    ).rejects.toThrow(/đủ quà/)
  })
  it("requires the accepted boss quest to be persisted before checkpointing", async () => {
    const progress = progressed({
        zoneId: ZONE_IDS[5],
        x: 320,
        y: 128,
        accepted: false,
      }),
      f = fixture(progress)
    await expect(
      f.store.beginBoss(f.raw, { ...progress, accepted: true }),
    ).rejects.toThrow()
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(f.raw)
  })
  it("reads v3 without writing/granting; explicit catch-up preserves identity and grants once", async () => {
    const f = fixture()
    expect(f.store.load()).toMatchObject({
      status: "ready",
      raw: f.raw,
      save: { schemaVersion: 8, economy: newEconomy() },
    })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(f.raw)
    const grant = await f.store.economyAction(
      f.raw,
      progressed(),
      "claim-quests",
    )
    expect(grant.save.economy).toMatchObject({
      teamExperience: 160,
      inventory: { rice: 3, herbs: 3, broth: 2 },
      receipts: expect.any(Array),
    })
    expect(grant.save.economy.receipts).toHaveLength(3)
    expect(grant.save.saveId).toBe(f.old.saveId)
    await expect(
      f.store.economyAction(grant.raw, progressed(), "claim-quests"),
    ).rejects.toThrow(/đủ quà/)
    expect(f.memory.get("foodchest.tcg.v1")).toBe("stable original")
  })
  it("loses neither items nor old bytes on failure; retries chest once", async () => {
    const f = fixture()
    f.fail(true)
    await expect(
      f.store.economyAction(f.raw, progressed(), "open-chest"),
    ).rejects.toMatchObject({ code: "write-failed" })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(f.raw)
    f.fail(false)
    const next = await f.store.economyAction(f.raw, progressed(), "open-chest")
    expect(next.save.economy.inventory).toEqual({
      rice: 4,
      herbs: 3,
      broth: 2,
      "warm-bowl": 0,
    })
    expect(next.save.economy.receipts).toEqual([CHEST_RECEIPT])
    await expect(
      f.store.economyAction(next.raw, progressed(), "open-chest"),
    ).rejects.toThrow(/đã được nhận/)
  })
  it("serializes two chest claims across tabs; stale replays cannot duplicate", async () => {
    const f = fixture()
    const results = await Promise.allSettled([
      f.store.economyAction(f.raw, progressed(), "open-chest"),
      f.other.economyAction(f.raw, progressed(), "open-chest"),
    ])
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1)
    const load = f.store.load()
    expect(load).toMatchObject({
      save: { economy: { receipts: [CHEST_RECEIPT], inventory: { rice: 4 } } },
    })
  })
  it("rejects far-away claims and forged quest or zone changes before granting", async () => {
    const f = fixture()
    for (const progress of [
      progressed({ x: 96, y: 192 }),
      progressed({ zoneId: ZONE_IDS[2] }),
      progressed({ questIndex: 4 }),
    ])
      await expect(
        f.store.economyAction(f.raw, progress, "open-chest"),
      ).rejects.toThrow()
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(f.raw)
  })
  it("uses explicit kitchen actions; failed cooking/share stays atomic and cannot overspend", async () => {
    const kitchen = progressed({ zoneId: ZONE_IDS[2], x: 320, y: 128 }),
      f = fixture(kitchen)
    await expect(f.store.economyAction(f.raw, kitchen, "cook")).rejects.toThrow(
      /Cần 1/,
    )
    let next = await f.store.economyAction(f.raw, kitchen, "claim-quests")
    const before = next.raw
    f.fail(true)
    await expect(
      f.store.economyAction(before, kitchen, "cook"),
    ).rejects.toThrow()
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(before)
    f.fail(false)
    next = await f.store.economyAction(before, kitchen, "cook")
    expect(next.save.economy.inventory).toEqual({
      rice: 2,
      herbs: 2,
      broth: 1,
      "warm-bowl": 1,
    })
    expect(next.save.economy.teamExperience).toBe(160)
    const cooked = next.raw
    f.fail(true)
    await expect(
      f.store.economyAction(cooked, kitchen, "share-meal"),
    ).rejects.toThrow()
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(cooked)
    f.fail(false)
    next = await f.store.economyAction(cooked, kitchen, "share-meal")
    expect(next.save.economy).toMatchObject({
      teamExperience: 205,
      cooked: 1,
      shared: 1,
      inventory: { "warm-bowl": 0 },
    })
    await expect(
      f.store.economyAction(next.raw, kitchen, "share-meal"),
    ).rejects.toThrow(/nấu/)
  })
  it("keeps meals optional; closed hearth and remote kitchen cannot consume", async () => {
    const f = fixture()
    let next = await f.store.economyAction(f.raw, progressed(), "claim-quests")
    await expect(
      f.store.economyAction(next.raw, progressed(), "cook"),
    ).rejects.toThrow(/Đến gần/)
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(next.raw)
  })
  it("grants a quest and ingredients in one action, and closing/replay grants nothing", async () => {
    const progress = {
      ...newWorldProgress(),
      x: 160,
      y: 240,
      accepted: true,
      tableRead: true,
    }
    const f = fixture(progress)
    f.fail(true)
    await expect(
      f.store.act(f.raw, progress, "aw2-npc-giu-cho", "turn-in"),
    ).rejects.toThrow()
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(f.raw)
    f.fail(false)
    const next = await f.store.act(
      f.raw,
      progress,
      "aw2-npc-giu-cho",
      "turn-in",
    )
    expect(next.save.progress.partyIds).toEqual(STARTER_TEAM)
    expect(next.save.economy).toMatchObject({
      teamExperience: 30,
      receipts: ["aw2-grant-kept-seat"],
    })
    await expect(
      f.store.act(next.raw, next.save.progress, "aw2-npc-giu-cho", "turn-in"),
    ).rejects.toThrow()
  })
  it("normal position save preserves inventory and real boss uses persisted level", async () => {
    const progress = progressed({
        zoneId: ZONE_IDS[5],
        accepted: true,
        x: 320,
        y: 128,
      }),
      f = fixture(progress)
    const claimed = await f.store.economyAction(f.raw, progress, "claim-quests")
    const saved = await f.store.save(claimed.raw, progress)
    expect(saved.save.economy).toEqual(claimed.save.economy)
    const { encounter } = await f.store.beginBoss(saved.raw, progress)
    const than = encounter
      .snapshot()
      .battle.actors.find((a) => a.spiritId === "aw2-than")!
    expect(than.maxHp).toBe(developmentStarterStats("aw2-than", 2).maxHp)
  })
  it("preserves malformed inventory/future schemas instead of dropping unknown data", () => {
    const f = fixture()
    for (const economy of [
      { ...newEconomy(), teamExperience: -1 },
      { ...newEconomy(), receipts: [CHEST_RECEIPT, CHEST_RECEIPT] },
      { ...newEconomy(), shared: 1 },
      { ...newEconomy(), inventory: { ...newEconomy().inventory, rice: 1.5 } },
      {
        ...newEconomy(),
        inventory: { ...newEconomy().inventory, "warm-bowl": 1 },
      },
    ]) {
      expect(economySchema.safeParse(economy).success).toBe(false)
      const raw = JSON.stringify({ ...f.old, schemaVersion: 4, economy })
      expect(decodeAw2Save(raw)).toEqual({ status: "invalid", raw })
    }
    const raw = JSON.stringify({ schemaVersion: 9, preserve: true })
    expect(decodeAw2Save(raw)).toEqual({ status: "unsupported", raw })
  })
})
