import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { AUTO_UNITS, MONSTER_MAP, UNIT_MAP } from "@/game/autochess/catalog"
import { actorAttackMotion } from "@/game/adventureRpg/formationLayout"
import { createRpgBattle, newRpgSave } from "@/game/adventureRpg/engine"
import { rpgAttackRange } from "@/game/adventureRpg/attackRange"
import type { RpgActor, RpgEnemy } from "@/game/adventureRpg/types"
import { newGame } from "@/game/progression"

const game = newGame()

function actor(side: RpgActor["side"], slot: number, range: number): RpgActor {
  return {
    uid: `${side}-${slot}`,
    id: "test",
    name: "Test",
    side,
    slot,
    role: "striker",
    school: "hearth",
    level: 1,
    rank: 1,
    skills: [1, 1, 1, 1],
    maxHp: 100,
    hp: 100,
    attack: 10,
    range,
    armor: 0,
    energy: 0,
    shield: 0,
    burn: 0,
    weaken: 0,
    wither: 0,
    stun: 0,
    nextAttack: 0,
    nextSkill: 0,
    nextSupport: 0,
    motion: "idle",
    motionAt: 0,
    phase: 0,
    boss: false,
  }
}

describe("Adventure attack ranges 5.9.23", () => {
  it("snapshots ally and enemy ranges from the shared combat catalog", () => {
    const save = newRpgSave(game)
    const enemyId = Object.keys(MONSTER_MAP)[0]
    const wave: RpgEnemy[] = [{
      uid: "range-enemy",
      id: enemyId,
      name: "Range test",
      level: 1,
      school: "ember",
      boss: false,
    }]
    const battle = createRpgBattle(save, [wave], "range-test")

    const allies = battle.actors.filter(candidate => candidate.side === "ally")
    for (const ally of allies) {
      const definition = UNIT_MAP[ally.id]
        ?? AUTO_UNITS.find(unit => unit.foodId === ally.id)
      expect(ally.range, ally.id).toBe(definition?.range ?? rpgAttackRange(ally))
    }
    expect(allies.find(ally => ally.id === "goi-cuon-tom-thit")?.range).toBe(2)
    expect(battle.actors.find(candidate => candidate.side === "enemy")?.range)
      .toBe(MONSTER_MAP[enemyId].range)
  })

  it("falls back safely for old snapshots that do not store a range", () => {
    expect(rpgAttackRange({ id: "legacy-tank", role: "guardian" })).toBe(1)
    expect(rpgAttackRange({ id: "legacy-trickster", role: "trickster" })).toBe(2)
    expect(rpgAttackRange({ id: "legacy-mage", role: "mage" })).toBe(3)
  })

  it("moves melee to contact, lets mid-range step, and keeps ranged in formation", () => {
    const target = actor("enemy", 0, 1)
    const melee = actorAttackMotion(actor("ally", 0, 1), target)
    const mid = actorAttackMotion(actor("ally", 0, 2), target)
    const ranged = actorAttackMotion(actor("ally", 0, 3), target)

    expect(Math.hypot(melee.x, melee.y)).toBeGreaterThan(Math.hypot(mid.x, mid.y))
    expect(Math.hypot(mid.x, mid.y)).toBeGreaterThan(0)
    expect(Math.hypot(ranged.x, ranged.y)).toBe(0)
    expect(ranged.windupX).toBeLessThan(0)
    expect(actorAttackMotion(actor("enemy", 0, 1), actor("ally", 0, 1)).x).toBeLessThan(0)
  })

  it("wires range travel into actors and reserves projectiles for non-melee attacks", () => {
    const view = readFileSync("src/components/game/RpgBattleView.tsx", "utf8")
    const vfx = readFileSync("src/components/game/RpgBattleVfx.tsx", "utf8")
    const css = readFileSync("src/game/adventureRpg/rpg.css", "utf8")

    expect(view).toContain("actorAttackMotion(a,attackTarget)")
    expect(view).toContain("attack-range-${attackMotion.band}")
    expect(css).toContain("@keyframes rpg-range-attack")
    expect(css).toContain("--attack-wide-x")
    expect(vfx).toContain("rpgAttackRange(c.actor) <= 1 ? \"slash\" : \"projectile\"")
    expect(vfx).toContain('target.side!==c.actor.side && kind!=="slash"')
  })
})
