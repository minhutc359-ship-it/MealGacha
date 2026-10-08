import { describe, expect, it } from "vitest"
import { AUTO_UNITS, MONSTERS, UNIT_MAP } from "./catalog"
import { actorFrame, actorPosition, SPRITE_SHEETS, victoryKey } from "./presentation"
import { autoArrange, capacity, copies, createAutoRun } from "./economy"
import { createCombat, advanceCombat } from "./combat"
import { reduceAuto } from "./reducer"
import { emptyAutoSave } from "./types"
import { autoRunSchema } from "./schema"

const initial = () => createAutoRun("survival", 42, "2026-10-09", "presentation")

describe("measured sprite rendering", () => {
  it("addresses every unit/monster and every pose inside its actual source image", () => {
    for (const sheet of Object.values(SPRITE_SHEETS)) for (const row of sheet.rows) {
      expect(row.height).toBeGreaterThan(0)
      for (const [x, y, w, h, px, py] of row.frames) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(x + w).toBeLessThanOrEqual(sheet.width)
        expect(y + h).toBeLessThanOrEqual(sheet.height)
        expect(px).toBeGreaterThanOrEqual(0)
        expect(px).toBeLessThanOrEqual(w)
        expect(py).toBeLessThanOrEqual(h)
      }
    }
    for (const unit of AUTO_UNITS) {
      const sheet = unit.portrait >= 18 ? SPRITE_SHEETS.fresh : SPRITE_SHEETS.base
      const row = unit.portrait >= 18 ? unit.portrait - 18 : unit.sprite
      expect(sheet.rows[row].frames).toHaveLength(unit.portrait >= 18 ? 7 : 14)
    }
    for (const monster of MONSTERS) expect(SPRITE_SHEETS.enemy.rows[monster.sprite].frames).toHaveLength(7)
    // Regression: hats/feet are in an uneven 310–424px band, not 380–507px.
    expect(SPRITE_SHEETS.enemy.rows[3].frames[0][1]).toBeLessThan(380)
  })
  it("interpolates moves continuously without altering the combat actor", () => {
    const actor = createCombat(initial()).actors[0]
    actor.action = { kind: "move", start: 10, hit: 10, end: 14, from: 20, to: 14, target: null }
    const before = structuredClone(actor)
    expect(actorPosition(actor, 9)).toEqual({ x: 2, y: 3 })
    expect(actorPosition(actor, 12)).toEqual({ x: 2, y: 2.5 })
    expect(actorPosition(actor, 16)).toEqual({ x: 2, y: 2 })
    for (const fresh of [true, false]) for (let time = 9; time <= 16; time += .1)
      expect(actorFrame(actor, time, fresh, null)).toBeLessThan(fresh ? 7 : 14)
    expect(actor).toEqual(before)
  })
})

describe("victory presentation and preparation", () => {
  it("celebrates only a settled matching win, including the final cutscene", () => {
    let run = initial()
    expect(victoryKey(run)).toBeNull()
    run.phase = "combat"; run.rounds++ ; run.combat = createCombat(run)
    for (const actor of run.combat.actors) if (actor.side === "enemy") actor.hp = 0
    run = advanceCombat(run)
    const save = reduceAuto({ ...emptyAutoSave(), run: { ...initial(), phase: "combat", rounds: run.rounds, combat: createCombat({ ...run, combat: null }) } }, { type: "checkpoint", run }).save
    // Use the real settlement path, keeping its saved ID/tick/progress intact.
    expect(save.run?.lastResult?.result).toBe("win")
    run = save.run!
    const before = structuredClone(run)
    expect(victoryKey(run)).toBe(`${run.id}:${run.combat!.id}`)
    run.phase = "won"; run.scene = "ending"
    expect(victoryKey(run)).not.toBeNull()
    run.phase = "reward"
    expect(victoryKey(run)).toBeNull()
    run.phase = "result"; run.lastResult!.result = "loss"
    expect(victoryKey(run)).toBeNull()
    expect(before.activeTicks).toBe(run.activeTicks)
    expect(before.gold).toBe(run.gold)
  })
  it("fills a legal formation and preserves all owned pieces, items, pool and resources", () => {
    const run = initial()
    run.xp = 20
    for (const id of ["banh-mi", "banh-khuc", "che-lam", "chao-luon"]) {
      run.roster.push({ uid: `p${run.nextUid++}`, id, star: 1, cell: null, items: [] })
      run.pool[id]--
    }
    run.roster[0].items = ["lantern"]
    const before = structuredClone(run)
    expect(autoArrange(run)).toBeNull()
    expect(run.roster.filter(p => p.cell !== null)).toHaveLength(capacity(run.xp))
    expect(new Set(run.roster.filter(p => p.cell !== null).map(p => p.cell)).size).toBe(5)
    expect(run.roster.filter(p => p.cell === null).length).toBeLessThanOrEqual(6)
    for (const p of run.roster.filter(p => p.cell !== null)) {
      expect(p.cell!).toBeGreaterThanOrEqual(18)
      expect(p.cell!).toBeLessThanOrEqual(35)
      if (UNIT_MAP[p.id].range > 1) expect(p.cell!).toBeGreaterThanOrEqual(24)
    }
    expect(run.pool).toEqual(before.pool)
    expect(run.gold).toBe(before.gold)
    expect(run.score).toBe(before.score)
    expect(run.roster.map(({ cell, ...piece }) => piece)).toEqual(before.roster.map(({ cell, ...piece }) => piece))
    expect(autoRunSchema.safeParse(run).success).toBe(true)
  })
  it("prioritizes a merged unit and refuses to rearrange a running battle or cutscene", () => {
    const run = initial()
    const id = "banh-mi"
    run.roster.push({ uid: `p${run.nextUid++}`, id, star: 2, cell: null, items: [] })
    run.pool[id] -= copies(2)
    const result = reduceAuto({ ...emptyAutoSave(), run }, { type: "auto-place" })
    expect(result.error).toBeNull()
    expect(result.save.run!.roster.find(p => p.id === id)?.cell).not.toBeNull()
    const battle = reduceAuto(result.save, { type: "battle" }).save
    expect(reduceAuto(battle, { type: "auto-place" }).save).toBe(battle)
    expect(reduceAuto(battle, { type: "auto-place" }).error).toBeTruthy()
    const campaign = { ...emptyAutoSave(), run: createAutoRun("campaign", 1, "2026-10-09", "intro") }
    expect(reduceAuto(campaign, { type: "auto-place" }).save).toBe(campaign)
  })
})
