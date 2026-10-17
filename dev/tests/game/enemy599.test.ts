import { describe, it, expect } from "vitest"
import { REGULAR_ENEMY_IDS, enemyVisual, enemyPose } from "@/game/enemyVisuals"
import { drawEnemyVfx } from "@/game/enemyVfx"
import { MONSTERS, MONSTER_MAP } from "@/game/autochess/catalog"
import { monsterCharacter } from "@/infrastructure/assets/characterSprites"
import { encounterWaves } from "@/game/adventureRpg/enemies"
import {
  createRpgBattle,
  newRpgSave,
  advanceRpgBattle,
} from "@/game/adventureRpg/engine"
import { newGame } from "@/game/progression"
const regions = ["mistwood", "sugartower", "ashalley", "lasttable"]
function commands(id: string, age = 300, quiet = false) {
  const out: unknown[] = []
  const ctx = new Proxy({}, {
    get:
      (_, k) =>
      (...args: unknown[]) =>
        out.push([k, ...args]),
    set: () => true,
  }) as CanvasRenderingContext2D
  drawEnemyVfx(ctx, id, 0, 0, 30, age, quiet)
  return out
}
describe("regular campaign creatures 5.9.9", () => {
  it("keeps all eight canon IDs/styles and old spawn pools while selecting their own new atlas", () => {
    expect(REGULAR_ENEMY_IDS).toHaveLength(8)
    for (const [index, id] of REGULAR_ENEMY_IDS.entries()) {
      const v = enemyVisual(id)!
      expect(v.atlas).toBe(`/assets/characters/campaign599/${id}.webp`)
      expect(v.accent).toBe(index + 1)
      expect(monsterCharacter(id).sheet).toBe(v.sheet)
      expect(MONSTER_MAP[id]).toBeTruthy()
      expect(MONSTERS.some((m) => m.id === id)).toBe(false)
    }
    for (const [i, region] of regions.entries()) {
      const wave = encounterWaves(
        "grove",
        30,
        3,
        undefined,
        false,
        1,
        region,
      )[0]
      expect(new Set(wave.map((a) => a.id))).toEqual(
        new Set(REGULAR_ENEMY_IDS.slice(i * 2, i * 2 + 2)),
      )
      expect(wave.every((a) => !a.boss && !a.elite)).toBe(true)
    }
  })
  it("uses the special brace row for shield casters and resolves it at cast contact", () => {
    for (const id of REGULAR_ENEMY_IDS) {
      expect(enemyVisual(id)!.defense).toBe(
        ["jade-sentinel", "kiln-knight", "bronze-warden"].includes(id),
      )
      expect(enemyPose(id, "guard", 379, false, 380)).toBe(17)
      expect(enemyPose(id, "guard", 380, false, 380)).toBe(18)
      expect(enemyPose(id, "guard", 0, true)).toBe(18)
      expect(enemyPose(id, "guard", 1200)).toBe(0)
      expect(enemyPose(id, "attack", 299, false, 300)).toBe(9)
      expect(enemyPose(id, "attack", 300, false, 300)).toBe(10)
    }
  })
  it("has eight distinct bounded motifs, no effect before contact/after expiry and static reduced art", () => {
    expect(
      new Set(REGULAR_ENEMY_IDS.map((id) => JSON.stringify(commands(id)))).size,
    ).toBe(8)
    for (const id of REGULAR_ENEMY_IDS) {
      expect(commands(id).length).toBeLessThan(120)
      expect(commands(id, -1)).toEqual([])
      expect(commands(id, 801)).toEqual([])
      expect(commands(id, 200, true)).toEqual(commands(id, 600, true))
    }
  })
  it("keeps regular skills immediate and does not invent elite warnings or boss phases", () => {
    const save = newRpgSave(newGame())
    for (const [i, region] of regions.entries()) {
      const wave = encounterWaves(
        "grove",
        30,
        3,
        undefined,
        false,
        1,
        region,
      )[0]
      const b = createRpgBattle(save, [wave], `regular:${i}`)
      for (const a of b.actors) {
        a.hp = a.maxHp = 50000
        a.attack = 1
        a.nextAttack = a.nextSupport = a.nextSkill = 10000
        a.energy = 100
        if (a.side === "enemy") a.nextSkill = 0
      }
      const next = advanceRpgBattle(b, 1),
        before = JSON.stringify(next)
      for (const a of next.actors.filter((a) => a.side === "enemy")) {
        expect(
          next.events.some(
            (e) => e.source === a.uid && e.animation === "enemy",
          ),
        ).toBe(true)
        expect(a.phase).toBe(0)
        enemyVisual(a.id)
        enemyPose(a.id, "cast", 380)
        commands(a.id)
      }
      expect(next.warning).toBeNull()
      expect(JSON.stringify(next)).toBe(before)
    }
  })
})
