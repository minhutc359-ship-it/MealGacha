import { describe, expect, it } from "vitest"
import { AUTO_UNITS, MONSTERS } from "@/game/autochess/catalog"
import { createAutoRun } from "@/game/autochess/economy"
import { createCombat } from "@/game/autochess/combat"
import { actorPose, actorBody } from "@/game/autochess/actorPresentation"
import { stageCell, stagePoint, stageScale } from "@/game/autochess/stage"
import { SPRITE_SHEETS } from "@/game/autochess/presentation"
import { unitCharacter, monsterCharacter } from "@/infrastructure/assets/characterSprites"

describe("shared 2.5D stage", () => {
  it("keeps each projected center inside exactly its own pointer polygon", () => {
    const inside = (p: {x: number; y: number}, corners: ReturnType<typeof stageCell>) => corners.every((a, i) => {
      const b = corners[(i+1)%4]
      return (b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x) >= 0
    })
    for (let i = 0; i < 36; i++) {
      const p = stagePoint(i % 6 + .5, Math.floor(i / 6) + .5)
      expect(Array.from({length:36}, (_,j) => j).filter(j => inside(p,stageCell(j)))).toEqual([i])
      for (const corner of stageCell(i)) { expect(corner.x).toBeGreaterThanOrEqual(0); expect(corner.x).toBeLessThanOrEqual(1); expect(corner.y).toBeGreaterThan(0); expect(corner.y).toBeLessThan(1) }
    }
    expect(stageScale(5)).toBeGreaterThan(stageScale(0))
  })
  it("uses identical shared edges, including the two teams' boundary", () => {
    for (let i = 0; i < 36; i++) {
      const p = stageCell(i)
      if (i % 6 < 5) { const r = stageCell(i+1);expect(p[1]).toEqual(r[0]);expect(p[2]).toEqual(r[3]) }
      if (i < 30) { const b = stageCell(i+6);expect(p[3]).toEqual(b[0]);expect(p[2]).toEqual(b[1]) }
    }
  })
})

describe("whole-catalog animation", () => {
  for (const def of [...AUTO_UNITS, ...MONSTERS]) it(`${def.id}: bounded poses and contact aligned for its atlas`, () => {
    const b = createCombat(createAutoRun("survival", 42, "2026-10-16", "visual-test"))
    const actor = {...b.actors[0], id:def.id}
    const model = AUTO_UNITS.some(u => u.id === def.id) ? unitCharacter(def.id) : monsterCharacter(def.id)
    const poses = SPRITE_SHEETS[model.sheet].rows[model.row].frames
    for (const kind of ["attack","cast","move"] as const) {
      actor.action = { kind, start:10, hit:14, end:22, from:20, to:14, target:null }
      const before = structuredClone(actor)
      for (let time = 10; time <= 23; time += .125) {
        const pose = actorPose(actor,model.sheet,time,b,false,false)
        expect(Number.isInteger(pose)).toBe(true);expect(poses[pose]).toBeDefined()
        const body = actorBody(actor,time,false)
        expect(Math.abs(body.lift)).toBeLessThan(.05);expect(Math.abs(body.lean)).toBeLessThan(.07)
        expect(actorBody(actor,time,true)).toEqual({lift:0,lean:0,stretch:0})
      }
      if (kind !== "move") expect(actorPose(actor,model.sheet,13.99,b,false,false)).not.toBe(actorPose(actor,model.sheet,14,b,false,false))
      expect(actor).toEqual(before)
    }
    actor.hp = 0;actor.diedAt = 22
    for (const time of [22,23,30,50]) expect(poses[actorPose(actor,model.sheet,time,b,false,false)]).toBeDefined()
  })
})
