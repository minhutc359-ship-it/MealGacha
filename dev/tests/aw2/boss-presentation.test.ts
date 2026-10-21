import { describe, expect, it } from "vitest"
import { FORGOTTEN_HOST_ASSETS as art } from "../../../src/aw2/assets/forgottenHost"
import { sampleBossVisual } from "../../../src/aw2/assets/bossPlayback"
import { BATTLE_STATES } from "../../../src/aw2/assets/types"
import { createForgottenHostSeed } from "../../../src/aw2/combat/forgottenHost"
import {
  advanceCombatBattle,
  createCombatBattle,
  createCombatPresentation,
  reduceCombatPresentation,
} from "../../../src/aw2/combat"

function setup(phase = 1) {
  const battle = createCombatBattle({
    id: "boss-art",
    players: [0, 1, 2].map((i) => ({
      id: `p${i}`,
      spiritId: "aw2-than",
      hp: 5000,
      maxHp: 5000,
      position: 50,
      nextBasicTick: 999,
      nextAutoTick: 999,
    })),
    enemies: [
      { ...createForgottenHostSeed(), position: 50, nextBasicTick: 999 },
    ],
  })
  battle.actors.at(-1)!.bossKit!.phase = phase
  battle.actors.at(-1)!.bossKit!.nextSkillTick = 1
  return battle
}
function sample(
  battle: ReturnType<typeof setup>,
  previous: Parameters<typeof sampleBossVisual>[3],
  time = 0,
  reduced = false,
  stopped = false,
) {
  return sampleBossVisual(
    battle,
    battle.actors.at(-1)!,
    reduceCombatPresentation(createCombatPresentation(), battle.events),
    previous,
    time,
    reduced,
    stopped,
  )
}

describe("ART-BOSS-01 authoritative reference presentation", () => {
  it("has8 own key poses/9 effect frames, enemy identity and safe measured source rectangles", () => {
    expect(art.entityId).toBe("aw2-enemy-forgotten-host")
    expect(art.fullEnemyComplete).toBe(false)
    expect(art.facing).toBe("left")
    expect(Object.keys(art.frames)).toHaveLength(17)
    for (const state of BATTLE_STATES) {
      expect(art.battle[state].frames[0].frame).toBe(`battle.${state}`)
      expect(art.battle[state].reducedMotionFrame).toBe(`battle.${state}`)
    }
    for (const frame of Object.values(art.frames)) {
      const asset = art.assets[frame.asset]
      expect(frame.x + frame.width).toBeLessThanOrEqual(asset.width)
      expect(frame.y + frame.height).toBeLessThanOrEqual(asset.height)
      expect(frame.maxEdgeAlpha).toBeLessThanOrEqual(8)
      expect(frame.anchorY).toBeLessThanOrEqual(frame.height)
    }
  })
  it("uses real sweep/snuff intent for warning, never a predicted impact", () => {
    for (const phase of [1, 2]) {
      const battle = advanceCombatBattle(setup(phase))
      const result = sample(battle, undefined)
      expect(result.state).toBe(phase === 1 ? "cast" : "ultimate")
      expect(result.effects).toHaveLength(1)
      expect(result.effects[0].phase).toBe("warning")
      expect(result.effects[0].targetIds).toEqual(["p0", "p1", "p2"])
      expect(
        result.effects.some((effect) => effect.phase === "confirmed"),
      ).toBe(false)
    }
  })
  it("groups only real hit recipients and expires finite impacts even with reduced motion", () => {
    const battle = advanceCombatBattle(setup(), 4)
    const bossHits = battle.events.filter(
      (event) =>
        event.kind === "hit" &&
        event.sourceId === art.entityId &&
        event.tick === 4,
    )
    expect(bossHits).toHaveLength(3)
    const first = sample(battle, undefined, 100, true)
    expect(first.effects[0].phase).toBe("confirmed")
    expect(first.effects[0].targetIds).toEqual(["p0", "p1", "p2"])
    const expired = sample(battle, first.clock, 460, true)
    expect(expired.effects).toEqual([])
    expect(sample(battle, expired.clock, 1000, false).effects).toEqual([])
    expect(expired.clock.impact!.startedAtMs).toBe(100)
  })
  it("keeps independent impact time during pose changes/unrelated ticks and pause", () => {
    const battle = advanceCombatBattle(setup(), 4)
    const first = sample(battle, undefined, 100)
    expect(sample(battle, first.clock, 100).effects).toEqual(first.effects)
    const next = advanceCombatBattle(battle)
    const second = sample(next, first.clock, 200)
    expect(second.clock.impact!.startedAtMs).toBe(100)
    expect(second.effects[0].targetIds).toEqual(first.effects[0].targetIds)
    const stepped = advanceCombatBattle(next)
    expect(sample(stepped, second.clock, 200).effects).toEqual([])
  })
  it("shows actual protection and one finite dissolve after real expiry", () => {
    const barrier = advanceCombatBattle(setup(0))
    const first = sample(barrier, undefined)
    expect(first.state).toBe("guard")
    expect(first.effects[0].phase).toBe("protection")
    const expired = advanceCombatBattle(barrier, 8)
    expect(expired.actors.at(-1)!.bossKit!.barrierHits).toBe(0)
    const dissolve = sample(expired, first.clock, 100)
    expect(dissolve.effects[0].frame).toBe("fx.barrier.2")
    expect(sample(expired, dissolve.clock, 280, true).effects).toEqual([])
  })
  it("cancels warnings/impacts on retreat, source death or terminal without mutating rules", () => {
    const battle = advanceCombatBattle(setup(), 4)
    const before = JSON.stringify(battle)
    const current = sample(battle, undefined)
    expect(sample(battle, current.clock, 20, false, true).effects).toEqual([])
    expect(JSON.stringify(battle)).toBe(before)
    const dead = structuredClone(battle)
    dead.actors.at(-1)!.hp = 0
    expect(sample(dead, current.clock).state).toBe("defeat")
    expect(sample(dead, current.clock).effects).toEqual([])
    dead.status = "player-win"
    expect(sample(dead, current.clock).effects).toEqual([])
  })
})
