import { describe, expect, it } from "vitest"
import {
  applySummonAction,
  earnedSummonMilestones,
  newSummonState,
  summonSchema,
  SUMMON_MILESTONES,
} from "@/aw2/gacha/runtime"
import { drawTier } from "@/aw2/gacha/rules"
import { simulateDraw } from "@/aw2/gacha/simulator"
import { newModeProgress, recordModeResult } from "@/aw2/modes/progress"
import { newEconomy } from "@/aw2/economy/model"
import { QUEST_GRANTS, ROSTER, SPIRIT_IDS, STARTER_TEAM } from "@/aw2/world/ids"
import { AW2_DEV_SAVE_KEY, decodeAw2Save } from "@/aw2/save/schema"
import { ownedSpirits } from "@/aw2/collection/model"
import { completeFirstQuest, freePlayFixture } from "./free-play-fixture"

describe("019B free summons use earned receipts and atomic local writes", () => {
  it("grants nothing on load or render, then explicitly claims an actual quest once", async () => {
    const f = await freePlayFixture(),
      quest = await completeFirstQuest(f)
    expect(quest.save.summons).toEqual(newSummonState())
    const count = f.setItem.mock.calls.length
    expect(f.store.load()).toEqual(quest)
    expect(
      earnedSummonMilestones(quest.save.economy, quest.save.modes),
    ).toEqual([QUEST_GRANTS[0]])
    expect(f.setItem).toHaveBeenCalledTimes(count)
    const claimed = await f.store.summonAction(quest.raw, quest.save.progress, {
      type: "claim",
    })
    expect(claimed.save.summons.tickets).toBe(10)
    await expect(
      f.store.summonAction(claimed.raw, claimed.save.progress, {
        type: "claim",
      }),
    ).rejects.toThrow(/mốc mới/)
    expect(f.random).not.toHaveBeenCalled()
    expect(f.memory.get("foodchest.user.v1")).toBe("original-save")
  })
  it("commits ten draws in one revision and one main write with safe injected randomness", async () => {
    const f = await freePlayFixture(),
      q = await completeFirstQuest(f),
      c = await f.store.summonAction(q.raw, q.save.progress, { type: "claim" })
    f.setItem.mockClear()
    const next = await f.store.summonAction(c.raw, c.save.progress, {
      type: "draw",
      count: 10,
    })
    expect(next.save.revision).toBe(c.save.revision + 1)
    expect(
      f.setItem.mock.calls.filter(([key]) => key === AW2_DEV_SAVE_KEY),
    ).toHaveLength(1)
    expect(f.random).toHaveBeenCalledTimes(20)
    expect(next.save.summons).toMatchObject({
      tickets: 0,
      totalDraws: 10,
      pity: { sr: 0, ssr: 10, ur: 10 },
    })
    expect(next.save.summons.lastDraws[9].spiritId).toBe("aw2-nhien")
    expect(
      ownedSpirits(
        next.save.progress,
        next.save.collection,
        next.save.summons.obtainedIds,
      ),
    ).toContain("aw2-nhien")
    const team = await f.store.collectionAction(next.raw, next.save.progress, {
      type: "team",
      partyIds: [...STARTER_TEAM.slice(0, 4), "aw2-nhien"],
      vanEmphasis: "protection",
    })
    expect(team.save.progress.partyIds[4]).toBe("aw2-nhien")
    expect(f.store.load()).toEqual(team)
  })
  it("rejects insufficient funds, forged currency, bad counts and stale tabs before RNG/write", async () => {
    const f = await freePlayFixture()
    for (const count of [1, 10, 0, -1, 100, NaN])
      await expect(
        f.store.summonAction(f.first.raw, f.first.save.progress, {
          type: "draw",
          count,
        } as never),
      ).rejects.toThrow()
    expect(f.random).not.toHaveBeenCalled()
    const changed = await f.store.save(f.first.raw)
    await expect(
      f.store.summonAction(f.first.raw, f.first.save.progress, {
        type: "claim",
      }),
    ).rejects.toMatchObject({ code: "conflict" })
    expect(f.store.load()).toEqual(changed)
    expect(
      decodeAw2Save(
        JSON.stringify({
          ...changed.save,
          summons: { ...changed.save.summons, tickets: 10 },
        }),
      ).status,
    ).toBe("invalid")
  })
  it("serializes competing spends so only one complete batch can spend the same tickets", async () => {
    const f = await freePlayFixture(),
      q = await completeFirstQuest(f),
      c = await f.store.summonAction(q.raw, q.save.progress, { type: "claim" })
    const result = await Promise.allSettled([
      f.store.summonAction(c.raw, c.save.progress, { type: "draw", count: 10 }),
      f.store.summonAction(c.raw, c.save.progress, { type: "draw", count: 10 }),
    ])
    expect(result.filter((r) => r.status === "fulfilled")).toHaveLength(1)
    expect(f.random).toHaveBeenCalledTimes(20)
    expect(f.store.load()).toMatchObject({
      save: { summons: { tickets: 0, totalDraws: 10 } },
    })
  })
  it("quota or RNG failures preserve main bytes, tickets, party and original chest", async () => {
    let invalid = false
    const f = await freePlayFixture(() => (invalid ? NaN : 0)),
      q = await completeFirstQuest(f),
      c = await f.store.summonAction(q.raw, q.save.progress, { type: "claim" })
    invalid = true
    await expect(
      f.store.summonAction(c.raw, c.save.progress, { type: "draw", count: 10 }),
    ).rejects.toThrow()
    expect(f.store.load()).toEqual(c)
    invalid = false
    f.fail(true)
    await expect(
      f.store.summonAction(c.raw, c.save.progress, { type: "draw", count: 10 }),
    ).rejects.toMatchObject({ code: "write-failed" })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(c.raw)
    f.fail(false)
    const next = await f.store.summonAction(c.raw, c.save.progress, {
      type: "draw",
      count: 10,
    })
    expect(next.save.summons.totalDraws).toBe(10)
    expect(f.memory.get("foodchest.user.v1")).toBe("original-save")
  })
  it("reads strict schema8 with no writes/grants, migrates only explicitly and protects version10", async () => {
    const f = await freePlayFixture(),
      q = await completeFirstQuest(f)
    const { modes, summons, ...historical } = q.save,
      old = JSON.stringify({ ...historical, schemaVersion: 8 })
    f.memory.set(AW2_DEV_SAVE_KEY, old)
    f.setItem.mockClear()
    expect(f.store.load()).toMatchObject({
      status: "ready",
      raw: old,
      save: {
        schemaVersion: 9,
        modes: newModeProgress(),
        summons: newSummonState(),
      },
    })
    expect(f.setItem).not.toHaveBeenCalled()
    const next = await f.store.save(old)
    expect(next.save.economy).toEqual(q.save.economy)
    expect(next.save.collection).toEqual(q.save.collection)
    const future = JSON.stringify({ ...next.save, schemaVersion: 10 })
    f.memory.set(AW2_DEV_SAVE_KEY, future)
    await expect(f.store.save(future)).rejects.toThrow()
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(future)
    expect(
      decodeAw2Save(JSON.stringify({ ...q.save, schemaVersion: 8 })).status,
    ).toBe("invalid")
  })
})

describe("019B bounded draw rules and canonical pool", () => {
  it.each([0, 0.55, 0.85, 0.96, 0.995, 0.999999])(
    "uses the simulated interval at %s",
    (sample) => {
      expect(drawTier({ sr: 0, ssr: 0, ur: 0 }, sample)).toEqual(
        simulateDraw({ sr: 0, ssr: 0, ur: 0 }, sample),
      )
    },
  )
  it("gives equal pool intervals within all five tiers and never invents an identity", () => {
    const economy = { ...newEconomy(), receipts: [...QUEST_GRANTS] },
      modes = newModeProgress()
    const c = applySummonAction(
      newSummonState(),
      economy,
      modes,
      [],
      { type: "claim" },
      () => {
        throw Error("claim RNG")
      },
    )
    for (const [sample, rarity] of [
      [0, "N"],
      [0.6, "R"],
      [0.9, "SR"],
      [0.98, "SSR"],
      [0.999, "UR"],
    ] as const) {
      const pool = ROSTER.filter((u) => u.rarity === rarity)
      for (let index = 0; index < pool.length; index++) {
        let call = 0
        const state = applySummonAction(
          c,
          economy,
          modes,
          [],
          { type: "draw", count: 1 },
          () => (call++ === 0 ? sample : (index + 0.5) / pool.length),
        )
        expect(state.lastDraws[0]).toEqual({
          spiritId: pool[index].spiritId,
          duplicate: false,
        })
        expect(SPIRIT_IDS).toContain(state.obtainedIds[0])
      }
    }
  })
  it("limits earned supply, records duplicates without power creep and keeps latest batch bounded", () => {
    const economy = { ...newEconomy(), receipts: [...QUEST_GRANTS] }
    let modes = newModeProgress()
    for (const mode of ["tcg", "auto-chess"] as const)
      for (let stage = 1; stage <= 3; stage++)
        modes = recordModeResult(modes, mode, stage, "player-win")
    expect(earnedSummonMilestones(economy, modes)).toEqual([
      ...SUMMON_MILESTONES,
    ])
    let state = applySummonAction(
      newSummonState(),
      economy,
      modes,
      STARTER_TEAM,
      { type: "claim" },
      () => 0,
    )
    expect(state.tickets).toBe(100)
    for (let i = 0; i < 10; i++)
      state = applySummonAction(
        state,
        economy,
        modes,
        STARTER_TEAM,
        { type: "draw", count: 10 },
        () => 0,
      )
    expect(state.totalDraws).toBe(100)
    expect(state.lastDraws).toHaveLength(10)
    expect(state.fragments["aw2-than"]).toBeGreaterThan(0)
    expect(() =>
      applySummonAction(
        state,
        economy,
        modes,
        STARTER_TEAM,
        { type: "claim" },
        () => 0,
      ),
    ).toThrow()
    expect(() =>
      applySummonAction(
        state,
        economy,
        modes,
        STARTER_TEAM,
        { type: "draw", count: 1 },
        () => 0,
      ),
    ).toThrow()
    expect(
      summonSchema.safeParse({
        ...state,
        obtainedIds: ["aw2-than", "aw2-than"],
      }).success,
    ).toBe(false)
  })
})
