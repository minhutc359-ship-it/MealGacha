import { describe, expect, it } from "vitest"
import {
  advanceCombatBattle,
  createCombatBattle,
} from "../../../src/aw2/combat"
import {
  FORGOTTEN_HOST_ID,
  FORGOTTEN_HOST_PROFILE,
  FORGOTTEN_HOST_SKILLS,
  forgottenHostTargets,
} from "../../../src/aw2/combat/forgottenHost"
import type {
  CombatBattle,
  CombatEffect,
  CombatUnitSeed,
} from "../../../src/aw2/combat"

function quietBattle(players = 3): CombatBattle {
  const battle = createCombatBattle({
    id: "boss-kit-test",
    players: Array.from({ length: players }, (_, i) => ({
      id: `p${i}`,
      spiritId: "aw2-than",
      position: 50,
      hp: 1000,
      maxHp: 1000,
      defense: 0,
      attack: 50,
      nextBasicTick: 999,
      nextAutoTick: 999,
    })),
    enemies: [
      {
        id: FORGOTTEN_HOST_ID,
        spiritId: FORGOTTEN_HOST_ID,
        boss: true,
        bossProfile: FORGOTTEN_HOST_PROFILE,
        hp: 1000,
        maxHp: 1000,
        position: 50,
        attack: 100,
        defense: 0,
        nextBasicTick: 999,
      },
    ],
  })
  battle.actors.at(-1)!.bossKit!.nextSkillTick = 999
  return battle
}
const host = (battle: CombatBattle) =>
  battle.actors.find((actor) => actor.id === FORGOTTEN_HOST_ID)!
function queued(
  battle: CombatBattle,
  skillId: string,
  resolveTick: number,
  amount = 50,
): CombatEffect {
  return {
    id: `effect:${++battle.actionSerial}`,
    serial: battle.actionSerial,
    sourceId: "p0",
    targetId: FORGOTTEN_HOST_ID,
    kind: "damage",
    skillId,
    resolveTick,
    amount,
  }
}

describe("AW2-007D canonical Forgotten Host development kit", () => {
  it("requires explicit canonical enemy boss profile and leaves generic enemies untouched", () => {
    const battle = quietBattle()
    expect(host(battle).bossKit?.profile).toBe(FORGOTTEN_HOST_PROFILE)
    const seed: CombatUnitSeed = {
      id: "foreign",
      spiritId: "foreign",
      boss: true,
      bossProfile: FORGOTTEN_HOST_PROFILE,
    }
    expect(() =>
      createCombatBattle({
        id: "invalid",
        players: [{ id: "p", spiritId: "aw2-than" }],
        enemies: [seed],
      }),
    ).toThrow(/profile/)
    const generic = createCombatBattle({
      id: "generic",
      players: [{ id: "p", spiritId: "aw2-than" }],
      enemies: [
        { id: FORGOTTEN_HOST_ID, spiritId: FORGOTTEN_HOST_ID, boss: true },
      ],
    })
    expect(host(generic).bossKit).toBeUndefined()
  })

  it("announces, counts three beats and resolves snuff once against living opponents", () => {
    let battle = quietBattle()
    Object.assign(host(battle).bossKit!, { phase: 2, nextSkillTick: 1 })
    battle.actors[2].hp = 0
    const original = JSON.stringify(battle)
    battle = advanceCombatBattle(battle)
    expect(battle.actors[0].hp).toBe(1000)
    expect(host(battle).bossKit?.intent?.resolveTick).toBe(4)
    expect(advanceCombatBattle(JSON.parse(original))).toEqual(battle)
    battle = advanceCombatBattle(battle, 3)
    const skill = FORGOTTEN_HOST_SKILLS.snuff.id
    expect(
      battle.events
        .filter(
          (e) =>
            e.skillId === skill && ["cast-start", "status"].includes(e.kind),
        )
        .map((e) => e.text),
    ).toEqual([
      "Tắt bếp: còn 3 nhịp.",
      "Tắt bếp: còn 2 nhịp.",
      "Tắt bếp: còn 1 nhịp.",
    ])
    expect(
      battle.events
        .filter((e) => e.skillId === skill && e.kind === "hit")
        .map((e) => e.targetIds[0]),
    ).toEqual(["p0", "p1"])
    expect(battle.actors[0].hp).toBe(930)
    const again = advanceCombatBattle(battle)
    expect(
      again.events.filter(
        (e) => e.skillId === skill && e.kind === "cast-commit",
      ),
    ).toHaveLength(1)
    expect(again.actors[0].hp).toBe(930)
  })

  it("freezes the sweep center but evaluates real range/liveness at impact", () => {
    let battle = quietBattle()
    battle.actors[0].position = 30
    battle.actors[2].position = 90
    Object.assign(host(battle).bossKit!, { phase: 1, nextSkillTick: 1 })
    battle = advanceCombatBattle(battle)
    const center = host(battle).bossKit!.intent!.areaCenter
    expect(center).toBe(50)
    battle.actors[0].position = 50
    battle.actors[1].position = 90
    expect(forgottenHostTargets(battle, host(battle)).map((a) => a.id)).toEqual(
      ["p0"],
    )
    battle = advanceCombatBattle(battle, 3)
    expect(battle.actors[0].hp).toBe(900)
    expect(battle.actors[1].hp).toBe(1000)
    expect(
      battle.events.find((e) => e.kind === "cast-commit")?.targetIds,
    ).toEqual(["p0"])
  })

  it("absorbs exactly four real basics including the breaking contact", () => {
    let battle = quietBattle(4)
    const kit = host(battle).bossKit!
    kit.barrierHits = 4
    kit.barrierExpiresAtTick = 99
    for (const actor of battle.actors.filter((a) => a.side === "player"))
      actor.nextBasicTick = 1
    battle = advanceCombatBattle(battle)
    expect(host(battle).bossKit?.barrierHits).toBe(0)
    expect(host(battle).hp).toBe(1000)
    expect(battle.events.filter((e) => e.kind === "hit")).toHaveLength(4)
    expect(
      battle.events
        .filter((e) => e.kind === "hit")
        .every((e) => e.amount === 0),
    ).toBe(true)
    battle = advanceCombatBattle(battle, 4)
    expect(host(battle).hp).toBeLessThan(1000)
  })

  it("special attacks cannot spend or bypass the basic-contact barrier", () => {
    let battle = quietBattle()
    Object.assign(host(battle).bossKit!, {
      barrierHits: 4,
      barrierExpiresAtTick: 10,
    })
    battle.effects.push(queued(battle, "aw2-lua:skill:ultimate", 1, 9999))
    battle = advanceCombatBattle(battle)
    expect(host(battle).hp).toBe(1000)
    expect(host(battle).bossKit?.barrierHits).toBe(4)
    expect(battle.events.find((e) => e.kind === "hit")?.amount).toBe(0)
  })

  it("expires protection before a due contact on the exact expiry tick", () => {
    let battle = quietBattle()
    Object.assign(host(battle).bossKit!, {
      barrierHits: 4,
      barrierExpiresAtTick: 2,
    })
    battle.effects.push(queued(battle, "aw2-than:skill:basic", 2))
    battle = advanceCombatBattle(battle, 2)
    expect(host(battle).hp).toBe(950)
    expect(host(battle).bossKit?.barrierHits).toBe(0)
  })

  it("cancels pending intent on source death or terminal before it can damage", () => {
    let battle = quietBattle()
    Object.assign(host(battle).bossKit!, { phase: 2, nextSkillTick: 1 })
    battle = advanceCombatBattle(battle)
    battle.effects.push(queued(battle, "aw2-than:skill:basic", 2, 9999))
    battle = advanceCombatBattle(battle, 4)
    expect(battle.status).toBe("player-win")
    expect(host(battle).bossKit?.intent).toBeNull()
    expect(
      battle.events.filter(
        (e) => e.kind === "hit" && e.sourceId === FORGOTTEN_HOST_ID,
      ),
    ).toEqual([])
    expect(battle.events.filter((e) => e.kind === "battle-end")).toHaveLength(1)
  })

  it("keeps corpse/terminal protection cleared and deterministic across JSON roundtrips", () => {
    const original = quietBattle()
    Object.assign(host(original).bossKit!, { phase: 1, nextSkillTick: 1 })
    const started = advanceCombatBattle(original)
    const restored = JSON.parse(JSON.stringify(started)) as CombatBattle
    expect(advanceCombatBattle(restored, 4)).toEqual(
      advanceCombatBattle(started, 4),
    )
    expect(host(original).bossKit?.intent).toBeNull()
  })

  it("cancels the defeated caster's intent even when a second enemy keeps battle active", () => {
    let battle = quietBattle()
    battle.actors.push({
      ...structuredClone(host(battle)),
      id: "other",
      spiritId: "other",
      slot: 1,
      bossKit: undefined,
    })
    Object.assign(host(battle).bossKit!, { phase: 2, nextSkillTick: 1 })
    battle = advanceCombatBattle(battle)
    battle.effects.push(queued(battle, "aw2-than:skill:basic", 2, 9999))
    battle = advanceCombatBattle(battle, 4)
    expect(battle.status).toBe("active")
    expect(host(battle).bossKit?.intent).toBeNull()
    expect(battle.actors[0].hp).toBe(1000)
    expect(battle.events.filter((e) => e.kind === "cast-commit")).toEqual([])
  })

  it("counts Lua's separately confirmed basic contacts without counting the launch twice", () => {
    let battle = quietBattle(1)
    const original = battle.actors[0]
    const lua = createCombatBattle({
      id: "lua-seed",
      players: [
        {
          id: "p0",
          spiritId: "aw2-lua",
          position: 50,
          nextBasicTick: 1,
          nextAutoTick: 999,
        },
      ],
      enemies: [{ id: "enemy", spiritId: "enemy" }],
    }).actors[0]
    battle.actors[0] = { ...lua, hp: original.hp, maxHp: original.maxHp }
    Object.assign(host(battle).bossKit!, {
      barrierHits: 4,
      barrierExpiresAtTick: 10,
    })
    battle = advanceCombatBattle(battle, 2)
    expect(host(battle).bossKit?.barrierHits).toBe(2)
    expect(host(battle).hp).toBe(1000)
  })
})
