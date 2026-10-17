import { describe, it, expect } from "vitest"
import { existsSync } from "node:fs"
import { ENEMY_VISUALS, enemyVisual, enemyPose } from "@/game/enemyVisuals"
import {
  activeEnemyWarning,
  enemyWarningTargets,
  isEnemyPhaseEvent,
} from "@/game/enemyPresentation"
import { drawEnemyVfx } from "@/game/enemyVfx"
import { MONSTERS, MONSTER_MAP } from "@/game/autochess/catalog"
import { SPRITE_SHEETS } from "@/game/autochess/presentation"
import { monsterCharacter } from "@/infrastructure/assets/characterSprites"
import { newGame } from "@/game/progression"
import {
  newRpgSave,
  createRpgBattle,
  advanceRpgBattle,
} from "@/game/adventureRpg/engine"
import type { RpgEvent } from "@/game/adventureRpg/types"
function fixture(id = "salt-colossus", boss = true) {
  const g = newGame(),
    s = newRpgSave(g),
    def = MONSTER_MAP[id]
  const b = createRpgBattle(
    s,
    [
      [
        {
          id,
          uid: "qa-enemy",
          name: def.name,
          school: def.school,
          boss,
          elite: !boss,
          style: "mender",
          level: 1,
        },
      ],
    ],
    "qa598",
    undefined,
    0,
    530,
  )
  b.auto = false
  for (const a of b.actors) {
    a.nextAttack = a.nextSkill = a.nextSupport = 10000
    a.hp = a.maxHp = 10000
    a.attack = 0
    a.energy = 100
  }
  return b
}
describe("post-story authored presentation 5.9.8", () => {
  it("resolves post-story identities with full HD/pixel poses without adding opponents to Auto spawn pools", () => {
    expect(Object.keys(ENEMY_VISUALS)).toHaveLength(16)
    for (const v of Object.values(ENEMY_VISUALS)) {
      expect(monsterCharacter(v.id).sheet).toBe(v.sheet)
      expect(MONSTERS.some((m) => m.id === v.id)).toBe(false)
      for (const sheet of [v.sheet, v.pixelSheet]) {
        expect(SPRITE_SHEETS[sheet].rows[0].frames).toHaveLength(32)
        expect(existsSync("public" + SPRITE_SHEETS[sheet].path)).toBe(true)
      }
      expect(existsSync("public" + v.portrait.path)).toBe(true)
      for (const motion of [
        "idle",
        "walk",
        "attack",
        "cast",
        "phase",
        "hit",
        "fall",
        "victory",
        "stun",
        "channel",
      ])
        for (let t = 0; t < 4000; t += 79) {
          expect(enemyPose(v.id, motion, t)).toBeGreaterThanOrEqual(0)
          expect(enemyPose(v.id, motion, t)).toBeLessThan(32)
        }
      expect(enemyPose(v.id, "channel", 3000)).toBe(13)
      expect(enemyPose(v.id, "cast", 379, false, 380)).toBe(13)
      expect(enemyPose(v.id, "cast", 380, false, 380)).toBe(14)
      expect(enemyPose(v.id, "fall", 3000, true)).toBe(27)
    }
    expect(enemyVisual("__proto__")).toBeUndefined()
  })
  it("shows the actual target row, support recipients and cancellation without touching state", () => {
    const b = fixture(),
      a = b.actors.find((a) => a.side === "enemy")!
    b.warning = { source: a.uid, until: 8, row: "back" }
    const before = JSON.stringify(b)
    expect(
      enemyWarningTargets(b)
        .filter((t) => t.side === "ally")
        .every((t) => t.slot >= 2),
    ).toBe(true)
    expect(activeEnemyWarning(b)?.actor).toBe(a)
    expect(JSON.stringify(b)).toBe(before)
    for (const property of ["stun", "hp", "energy"] as const) {
      const old = a[property]
      a[property] = property === "stun" ? 1 : 0
      expect(activeEnemyWarning(b)).toBeNull()
      a[property] = old
    }
    b.tick = 8
    expect(activeEnemyWarning(b)).toBeNull()
    b.tick = 0
    b.rulesVersion = 520
    a.energy = 0
    expect(activeEnemyWarning(b)).not.toBeNull()
    const support = fixture("tea-oracle", false),
      healer = support.actors.find((a) => a.side === "enemy")!
    support.warning = { source: healer.uid, until: 8, row: "front" }
    expect(enemyWarningTargets(support).map((a) => a.uid)).toEqual([healer.uid])
  })
  it("consumes real one-time phase/warning events and respects an interrupted cast", () => {
    const b = fixture(),
      a = b.actors.find((a) => a.side === "enemy")!
    a.hp = 4000
    a.nextSkill = 0
    const phase = advanceRpgBattle(b, 1),
      enemy = phase.actors.find((a) => a.side === "enemy")!
    expect(
      phase.events.filter((e) => isEnemyPhaseEvent(e, enemy)),
    ).toHaveLength(1)
    expect(activeEnemyWarning(phase)?.warning.row).toBe("back")
    enemy.energy = 0
    const interrupted = advanceRpgBattle(phase, 10)
    expect(
      interrupted.events.filter((e) => isEnemyPhaseEvent(e, enemy)),
    ).toHaveLength(1)
    expect(
      interrupted.events.filter((e) => e.animation === "enemy"),
    ).toHaveLength(0)
    expect(
      isEnemyPhaseEvent(
        { kind: "boss", source: enemy.uid, text: "Boss chuẩn bị" } as RpgEvent,
        enemy,
      ),
    ).toBe(false)
  })
  it("covers global phase casts, empty-row fallback and both hostile/support effects", () => {
    for (const id of ["moon-heron", "aroma-regent"]) {
      const b = fixture(id),
        a = b.actors.find((a) => a.side === "enemy")!
      a.phase = 1
      b.warning = { source: a.uid, until: 8, row: "back" }
      expect(
        enemyWarningTargets(b).filter((t) => t.side === "ally"),
      ).toHaveLength(5)
    }
    const b = fixture("cloud-teapot"),
      a = b.actors.find((a) => a.side === "enemy")!
    b.warning = { source: a.uid, until: 8, row: "front" }
    expect(enemyWarningTargets(b)).toContain(a)
    for (const t of b.actors.filter((t) => t.side === "ally" && t.slot < 2))
      t.hp = 0
    expect(
      enemyWarningTargets(b).filter((t) => t.side === "ally"),
    ).toHaveLength(3)
    const hard = fixture("salt-alchemist", false),
      alchemist = hard.actors.find((a) => a.side === "enemy")!
    hard.difficulty = "extreme"
    hard.warning = { source: alchemist.uid, until: 8, row: "back" }
    expect(enemyWarningTargets(hard)).toContain(alchemist)
    expect(
      enemyWarningTargets(hard).filter((t) => t.side === "ally"),
    ).toHaveLength(3)
  })
  it("uses four distinct bounded motifs, static reduced effects and no stale pixels after expiry", () => {
    const commands = (id: string, age = 300, quiet = false, phase = false) => {
      const c: unknown[] = []
      const ctx = new Proxy({}, {
        get:
          (_, key) =>
          (...args: unknown[]) =>
            c.push([key, ...args]),
        set: () => true,
      }) as CanvasRenderingContext2D
      drawEnemyVfx(ctx, id, 0, 0, 30, age, quiet, phase)
      return c
    }
    const ids = ["cloud-teapot", "salt-colossus", "moon-heron", "aroma-regent"]
    expect(new Set(ids.map((id) => JSON.stringify(commands(id)))).size).toBe(4)
    for (const id of ids) {
      expect(commands(id, -1)).toEqual([])
      expect(commands(id, 900)).toEqual([])
      expect(commands(id, 200, true)).toEqual(commands(id, 600, true))
      expect(commands(id).length).toBeLessThan(100)
      expect(commands(id, 300, false, true)).not.toEqual(commands(id))
    }
  })
})
