import { describe, expect, it } from "vitest"
import { createAutoRun } from "@/game/autochess/economy"
import { advanceCombat, createCombat } from "@/game/autochess/combat"
import { reduceAuto } from "@/game/autochess/reducer"
import { autoSaveSchema } from "@/game/autochess/schema"
import { emptyAutoSave, type AutoMode, type AutoSave } from "@/game/autochess/types"
import { willpowerRatio } from "@/game/autochess/willpower"
import { newGame } from "@/game/progression"
import { parseGame } from "@/game/storage"
import { createSaveCode, readSaveCode } from "@/game/saveCode"

const start = (mode: AutoMode): AutoSave => {
  const run = createAutoRun(mode, 17, "2026-10-09", `will-${mode}`)
  run.scene = null; run.wave = 2; run.bestWave = 1; run.paidWaves = [1]; run.score = 432
  return { ...emptyAutoSave(), run, campaignCleared: mode === "campaign" ? 1 : 0 }
}
function round(save: AutoSave, win = false) {
  const begun = reduceAuto(save, { type: "battle" })
  expect(begun.error).toBeNull()
  const run = structuredClone(begun.save.run!)
  for (const a of run.combat!.actors) if (a.side === (win ? "enemy" : "ally")) a.hp = 0
  const result = reduceAuto(begun.save, { type: "checkpoint", run: advanceCombat(run) })
  expect(result.error).toBeNull()
  return result.save
}
describe("mode-specific willpower", () => {
  it("survival retries the same wave twice, keeps score/roster, then records the third loss once", () => {
    let save = start("survival")
    const roster = structuredClone(save.run!.roster)
    for (const health of [2, 1, 0]) {
      save = round(save)
      expect(save.run).toMatchObject({ health, wave: 2, score: 432, bestWave: 1, finished: health === 0, phase: health ? "result" : "lost" })
      expect(save.run!.lastResult).toMatchObject({ damage: 1, points: 0 })
      expect(save.run!.roster).toEqual(roster)
      expect(save.seals).toBe(0); expect(save.campaignCleared).toBe(0)
      expect(save.run!.paidWaves).toEqual([1]); expect(save.run!.pendingRewards).toEqual([])
      expect(autoSaveSchema.parse(save)).toEqual(save)
      if (health) {
        expect(save.records).toHaveLength(0)
        const retry = reduceAuto(save, { type: "next" }); expect(retry.error).toBeNull()
        save = retry.save
        expect(save.run).toMatchObject({ phase: "prepare", wave: 2, health })
        expect(save.run!.combat).toBeNull()
      }
    }
    expect(save.records).toMatchObject([{ id: "will-survival", score: 432, wave: 1, result: "lost" }])
    for (const action of [{ type: "next" }, { type: "battle" }, { type: "abandon" }, { type: "xp" }] as const) {
      expect(reduceAuto(save, action)).toMatchObject({ save, error: expect.any(String) })
    }
    expect(autoSaveSchema.parse(save).records).toHaveLength(1)
  })
  it("winning after a retry advances exactly once and never restores survival willpower", () => {
    const lost = round(start("survival")), retry = reduceAuto(lost, { type: "next" }).save
    const won = round(retry, true), next = reduceAuto(won, { type: "next" }).save
    expect(won.run).toMatchObject({ health: 2, wave: 2, bestWave: 2 })
    expect(won.run!.score).toBeGreaterThan(432); expect(won.run!.paidWaves).toEqual([1, 2])
    expect(next.run).toMatchObject({ health: 2, wave: 3, phase: "prepare" })
    expect(reduceAuto(next, { type: "next" }).error).toBeTruthy()
    expect(next.records).toHaveLength(0)
  })
  it("campaign retains variable damage and cannot unlock a lost wave, ending only at zero", () => {
    let save = start("campaign")
    const first = round(save)
    expect(first.run!.lastResult!.damage).toBe(Math.min(25, 5 + 2 * first.run!.combat!.actors.filter(a => a.side === "enemy" && a.hp > 0).length))
    expect(first.run!.health).toBe(100 - first.run!.lastResult!.damage)
    expect(first.campaignCleared).toBe(1); expect(first.records).toHaveLength(0)
    save = reduceAuto(first, { type: "next" }).save; save.run!.health = 1
    const terminal = round(save)
    expect(terminal.run).toMatchObject({ phase: "lost", finished: true, wave: 2, health: 0 })
    expect(terminal.records).toHaveLength(1)
  })
  it("loss checkpoint is idempotent and cannot pay gold or XP twice", () => {
    const save = start("survival"), begun = reduceAuto(save, { type: "battle" }).save
    const snapshot = structuredClone(begun.run!)
    snapshot.combat!.actors.filter(a => a.side === "ally").forEach(a => a.hp = 0)
    const advanced = advanceCombat(snapshot), settled = reduceAuto(begun, { type: "checkpoint", run: advanced }).save
    expect(reduceAuto(settled, { type: "checkpoint", run: advanced }).save).toBe(settled)
    expect(settled.run!.gold).toBeGreaterThan(begun.run!.gold); expect(settled.run!.xp).toBe(begun.run!.xp + 2)
  })
  it("migrates active old survival once, preserves past runs, and round-trips retry through text export", async () => {
    const old = start("survival"); old.run!.rulesVersion = 4; old.run!.health = 60; delete old.run!.willpowerVersion
    const migrated = autoSaveSchema.parse(old)
    expect(migrated.run).toMatchObject({ health: 2, willpowerVersion: 1 })
    expect(autoSaveSchema.parse(migrated)).toEqual(migrated)
    expect(old.run!.health).toBe(60)
    const loss = round(migrated), game = { ...newGame(), autoChess: loss }
    expect(parseGame(JSON.parse(JSON.stringify(game)))?.autoChess).toEqual(loss)
    expect((await readSaveCode(await createSaveCode(game))).save.autoChess).toEqual(loss)
    old.run!.finished = true; old.run!.phase = "lost"
    expect(autoSaveSchema.parse(old).run!.health).toBe(60)
  })
  it("low-willpower bonuses use a proportion and health imports cannot exceed three lives", () => {
    const survival = start("survival").run!, campaign = start("campaign").run!
    expect(willpowerRatio(survival)).toBe(1)
    survival.augments = ["last-light"]; campaign.augments = ["last-light"]
    expect(createCombat(survival).actors.filter(a => a.side === "ally").map(a => a.shield)).toEqual(createCombat(campaign).actors.filter(a => a.side === "ally").map(a => a.shield))
    survival.health = 1; expect(willpowerRatio(survival)).toBeCloseTo(1 / 3)
    survival.health = 4
    expect(autoSaveSchema.safeParse({ ...emptyAutoSave(), run: survival }).success).toBe(false)
  })
  it("an exhausted imported preparation cannot start another round or revive the run", () => {
    const old = start("survival"); old.run!.health = 0; delete old.run!.willpowerVersion
    const imported = autoSaveSchema.parse(old)
    expect(imported.run).toMatchObject({ phase: "lost", health: 0, finished: true })
    expect(imported.records).toHaveLength(1)
    expect(reduceAuto(imported, { type: "battle" }).error).toBeTruthy()
    expect(autoSaveSchema.parse(imported)).toEqual(imported)
  })
})
