import { describe, expect, it } from "vitest"
import { advanceCombat } from "@/game/autochess/combat"
import { battleSpeed, OVERTIME_TICKS } from "@/game/autochess/config"
import { createAutoRun } from "@/game/autochess/economy"
import { reduceAuto } from "@/game/autochess/reducer"
import { autoSaveSchema } from "@/game/autochess/schema"
import { emptyAutoSave, type AutoMode, type AutoSave } from "@/game/autochess/types"
import { newGame } from "@/game/progression"
import { parseGame } from "@/game/storage"
import { createSaveCode, readSaveCode } from "@/game/saveCode"

function battle(mode: AutoMode = "survival") {
  const run = createAutoRun(mode, 42, "2026-10-09", `overtime-${mode}`)
  run.scene = null
  run.wave = 2
  run.bestWave = 1
  run.paidWaves = [1]
  run.score = 314
  return reduceAuto({ ...emptyAutoSave(), campaignCleared: mode === "campaign" ? 1 : 0, run }, { type: "battle" }).save
}
function legacyLoss(timeout: boolean): AutoSave {
  const save = battle(), run = save.run!, combat = run.combat!
  combat.tick = timeout ? OVERTIME_TICKS : 600
  run.activeTicks = combat.tick
  if (!timeout) for (const actor of combat.actors) if (actor.side === "ally") actor.hp = 0
  combat.result = "loss"
  combat.settled = true
  run.phase = "result"
  run.lastResult = { id: combat.id, wave: run.wave, result: "loss", seconds: combat.tick / 20,
    survivors: timeout ? 3 : 0, points: 0, damage: 9, gold: 5, reason: "Kết quả bản cũ." }
  run.gold += 5
  run.xp += 2
  run.health -= 9
  run.log.unshift("Thua đợt 2 · 0 điểm · 5 vàng")
  return save
}

describe("overtime has no automatic defeat", () => {
  it("crosses 55 seconds with both teams alive, checkpoints and resumes at ×3", () => {
    const save = battle(), original = save.run!
    original.combat!.tick = OVERTIME_TICKS - 1
    original.activeTicks = OVERTIME_TICKS - 1
    for (const actor of original.combat!.actors) actor.stunnedUntil = 10000
    const after = advanceCombat(original, 40)
    const checkpoint = reduceAuto(save, { type: "checkpoint", run: after }).save
    expect(checkpoint.run).toMatchObject({ phase: "combat", score: 314, wave: 2, finished: false })
    expect(checkpoint.run!.combat!.tick).toBe(1139)
    expect(checkpoint.run!.combat!.result).toBeNull()
    expect(checkpoint.records).toHaveLength(0)
    expect(battleSpeed(original.combat!.tick, 2)).toBe(2)
    expect(battleSpeed(checkpoint.run!.combat!.tick, 1)).toBe(3)
    expect(battleSpeed(checkpoint.run!.combat!.tick, 2)).toBe(3)
    const loaded = autoSaveSchema.parse(checkpoint)
    expect(advanceCombat(loaded.run!).combat!.tick).toBe(1140)
  })
  it("can win after the former deadline and advances only after the settled win", () => {
    const save = battle(), run = save.run!
    run.combat!.tick = 1480
    run.activeTicks = 1480
    for (const actor of run.combat!.actors) if (actor.side === "enemy") actor.hp = 0
    const settled = reduceAuto(save, { type: "checkpoint", run: advanceCombat(run) }).save
    expect(settled.run).toMatchObject({ phase: "result", wave: 2, bestWave: 2, finished: false })
    expect(settled.run!.lastResult).toMatchObject({ result: "win", seconds: 74.05 })
    expect(settled.run!.score).toBeGreaterThan(314)
    expect(autoSaveSchema.safeParse(settled).success).toBe(true)
    const next = reduceAuto(settled, { type: "next" }).save
    expect(next.run).toMatchObject({ phase: "prepare", wave: 3 })
    expect(battleSpeed(next.run?.combat?.tick ?? 0, 1)).toBe(1)
  })
  it("does not trust an old timeout flag when both teams still have living actors", () => {
    const save = battle(), fake = structuredClone(save.run!)
    fake.combat!.tick = 1200
    fake.activeTicks = 1200
    fake.combat!.result = "loss"
    fake.phase = "result"
    const out = reduceAuto(save, { type: "checkpoint", run: fake }).save
    expect(out.run!.phase).toBe("combat")
    expect(out.run!.combat!.result).toBeNull()
    expect(out.run!.score).toBe(314)
    expect(out.records).toHaveLength(0)
  })
  it("round-trips a paused overtime snapshot through local save parsing and MGC1", async () => {
    const save = battle(), run = save.run!
    run.combat!.tick = 1337
    run.activeTicks = 1337
    run.paused = true
    const game = { ...newGame(), autoChess: save }
    expect(parseGame(JSON.parse(JSON.stringify(game)))?.autoChess?.run).toEqual(run)
    expect((await readSaveCode(await createSaveCode(game))).save.autoChess?.run).toEqual(run)
    expect(advanceCombat(run, 40)).toBe(run)
  })
})

describe("one defeat ends the run and records accumulated score", () => {
  it.each(["campaign", "survival", "daily"] as const)("ends %s on actual defeat with positive willpower", mode => {
    const save = battle(mode), run = save.run!
    run.combat!.tick = 1260
    run.activeTicks = 2460
    for (const actor of run.combat!.actors) if (actor.side === "ally") actor.hp = 0
    const advanced = advanceCombat(run)
    const settled = reduceAuto(save, { type: "checkpoint", run: advanced }).save
    expect(settled.run).toMatchObject({ phase: "lost", wave: 2, bestWave: 1, score: 314, finished: true, pendingRewards: [] })
    expect(settled.run!.health).toBeGreaterThan(0)
    expect(settled.run!.lastResult).toMatchObject({ result: "loss", points: 0, seconds: 63.05 })
    expect(settled.campaignCleared).toBe(save.campaignCleared)
    expect(settled.seals).toBe(save.seals)
    expect(settled.records).toMatchObject([{ id: run.id, mode, score: 314, wave: 1, result: "lost" }])
    for (const action of [{ type: "next" }, { type: "battle" }, { type: "abandon" }, { type: "checkpoint", run: advanced }] as const) {
      const rejected = reduceAuto(settled, action)
      expect(rejected.error).toBeTruthy()
      expect(rejected.save).toBe(settled)
    }
    const restored = autoSaveSchema.parse(settled)
    expect(restored.records).toHaveLength(1)
    expect(restored.run!.wave).toBe(2)
  })
  it("normalizes an old genuine defeat to a terminal result without double payouts or mutation", () => {
    const old = legacyLoss(false), before = structuredClone(old)
    const parsed = autoSaveSchema.parse(old)
    expect(parsed.run).toMatchObject({ phase: "lost", finished: true, wave: 2, score: 314 })
    expect(parsed.run!.gold).toBe(old.run!.gold)
    expect(parsed.run!.xp).toBe(old.run!.xp)
    expect(parsed.records).toHaveLength(1)
    expect(autoSaveSchema.parse(parsed).records).toHaveLength(1)
    expect(old).toEqual(before)
    expect(reduceAuto(old, { type: "next" }).save.run!.wave).toBe(2)
    expect(reduceAuto(old, { type: "next" }).save.run!.phase).toBe("lost")
  })
  it("resumes an old unacknowledged timeout and rolls back its old payout/penalty exactly once", () => {
    const old = legacyLoss(true), before = structuredClone(old)
    const parsed = autoSaveSchema.parse(old)
    expect(parsed.run).toMatchObject({ phase: "combat", paused: true, finished: false, wave: 2, score: 314, lastResult: null })
    expect(parsed.run!.combat).toMatchObject({ tick: 1100, result: null, settled: false })
    expect(parsed.run!.gold).toBe(old.run!.gold - 5)
    expect(parsed.run!.xp).toBe(old.run!.xp - 2)
    expect(parsed.run!.health).toBe(100)
    expect(parsed.run!.pool).toEqual(old.run!.pool)
    expect(parsed.run!.roster).toEqual(old.run!.roster)
    expect(parsed.run!.rng).toBe(old.run!.rng)
    expect(parsed.records).toHaveLength(0)
    expect(autoSaveSchema.parse(parsed)).toEqual(parsed)
    expect(old).toEqual(before)
  })
  it("keeps already finished records and already acknowledged preparation unchanged", () => {
    const finished = legacyLoss(false)
    const ended = autoSaveSchema.parse(finished)
    expect(autoSaveSchema.parse(ended)).toEqual(ended)
    const prepared = battle(); prepared.run!.phase = "prepare"; prepared.run!.combat = null
    expect(autoSaveSchema.parse(prepared)).toEqual(prepared)
  })
})
