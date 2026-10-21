import { describe, expect, it } from "vitest"
import { STARTER_ASSETS } from "@/aw2/assets/starters"
import { BATTLE_STATES } from "@/aw2/assets/types"
import { sampleProjectile, validateAssetManifest } from "@/aw2/assets/animation"
import {
  sampleActorEffect,
  sampleActorPlayback,
  sampleConfirmedEffect,
} from "@/aw2/assets/playback"
import {
  advanceCombatBattle,
  castCombatUltimate,
  createCombatBattle,
  createCombatPresentation,
  interruptCombatCast,
  reduceCombatPresentation,
} from "@/aw2/combat"

const suong = STARTER_ASSETS["aw2-suong"]
const seed = (basic = false, auto = false, immune = false) =>
  createCombatBattle({
    id: "suong-confirmed-zone",
    players: [
      {
        id: "suong",
        spiritId: "aw2-suong",
        position: 10,
        energy: 100,
        nextBasicTick: basic ? 0 : 10_000,
        nextAutoTick: auto ? 0 : 10_000,
      },
    ],
    enemies: [20, 24, 70].map((position, index) => ({
      id: `target-${index}`,
      spiritId: "aw2-enemy-test",
      position,
      controlImmune: immune && index === 1,
      hp: 5000,
      maxHp: 5000,
      nextBasicTick: 10_000,
      nextAutoTick: 10_000,
    })),
  })

describe("ART-SUONG / BATTLE-01 confirmed area motion", () => {
  it("declares32 distinct cels and retains original reduced poses, IDs and launch/impact timings", () => {
    expect(validateAssetManifest(suong)).toEqual([])
    expect(Object.keys(suong.frames)).toHaveLength(72)
    for (const state of BATTLE_STATES) {
      expect(new Set(suong.battle[state].frames.map((k) => k.frame)).size).toBe(
        4,
      )
      expect(suong.battle[state].reducedMotionFrame).toBe(`battle.${state}`)
    }
    expect(sampleProjectile(suong.skills.basic, 259)).toBeNull()
    expect(sampleProjectile(suong.skills.basic, 260)).not.toBeNull()
    expect(sampleProjectile(suong.skills.basic, 700)).toBeNull()
    expect(suong.fullCharacterComplete).toBe(false)
    expect(suong.provenance.commercialRelease).toBe("NOT_CLEARED")
  })
  it("launches without impact then attaches confirmed basic impact only to the actual target", () => {
    const launch = advanceCombatBattle(seed(true))
    const p = reduceCombatPresentation(
      createCombatPresentation(),
      launch.events,
    )
    expect(p.actors.suong.phase).toBe("launch")
    expect(sampleActorEffect(suong, p.actors.suong, 1000)).toBeNull()
    expect(p.effects.suong).toBeUndefined()
    const b = advanceCombatBattle(launch, 2)
    const result = reduceCombatPresentation(p, b.events)
    expect(result.effects.suong.basic.targetId).toBe("target-0")
    const first = sampleConfirmedEffect(
      suong,
      undefined,
      result.effects.suong.basic,
      0,
      false,
    )
    expect(first.effect?.frame).toBe("fx.basic.2")
    expect(
      sampleConfirmedEffect(
        suong,
        first.clock,
        result.effects.suong.basic,
        180,
        true,
      ).effect,
    ).toBeNull()
    expect(Object.values(result.projectiles)).toHaveLength(0)
  })
  it("groups only actual same-tick area recipients and preserves serial/clock across partial batches", () => {
    const b = advanceCombatBattle(seed(false, true), 5)
    const hits = b.events.filter(
      (e) => e.kind === "hit" && e.skillId === suong.skills.auto.id,
    )
    expect(hits).toHaveLength(6)
    expect(new Set(hits.map((e) => e.tick)).size).toBe(3)
    let p = createCombatPresentation()
    const serials = new Map<number, number>()
    for (const e of b.events) {
      p = reduceCombatPresentation(p, [e])
      const cue = p.effects.suong?.auto
      if (e.kind === "hit" && e.skillId === suong.skills.auto.id) {
        if (!serials.has(e.tick)) serials.set(e.tick, e.serial)
        expect(cue.serial).toBe(serials.get(e.tick))
        expect(cue.targetIds).not.toContain("target-2")
        expect(p.actors[e.targetIds[0]].skillId).toBeUndefined()
      }
    }
    expect(p.effects.suong.auto.targetIds).toEqual(["target-0", "target-1"])
    expect(p).toEqual(
      reduceCombatPresentation(createCombatPresentation(), b.events),
    )
    expect(reduceCombatPresentation(p, b.events)).toBe(p)
    const cue = p.effects.suong.auto
    const start = sampleConfirmedEffect(suong, undefined, cue, 100, false)
    expect(start.effect?.cue).toBe(420)
    expect(
      sampleConfirmedEffect(suong, start.clock, cue, 540, true).effect,
    ).toBeNull()
    expect(
      sampleConfirmedEffect(suong, start.clock, cue, 2000, false).effect,
    ).toBeNull()
  })
  it("shows no future zone pulse during prepare or after a canceled cast", () => {
    const b = advanceCombatBattle(seed(false, true))
    const p = reduceCombatPresentation(createCombatPresentation(), b.events)
    expect(p.actors.suong.phase).toBe("prepare")
    expect(p.effects.suong).toBeUndefined()
    expect(sampleActorEffect(suong, p.actors.suong, 420)).toBeNull()
    const canceled = advanceCombatBattle(interruptCombatCast(b, "suong"), 5)
    expect(
      canceled.events.filter(
        (e) => e.kind === "hit" && e.skillId === suong.skills.auto.id,
      ),
    ).toEqual([])
    expect(
      reduceCombatPresentation(p, canceled.events).effects.suong,
    ).toBeUndefined()
  })
  it("presents bounded passive slow only for authoritative eligible recipients", () => {
    const b = advanceCombatBattle(seed(false, true), 5)
    const statuses = b.events.filter(
      (e) => e.kind === "status" && e.skillId === suong.skills.passive.id,
    )
    expect(statuses).toHaveLength(2)
    expect(new Set(statuses.map((e) => e.tick)).size).toBe(1)
    const p = reduceCombatPresentation(createCombatPresentation(), b.events)
    expect(p.effects.suong.passive.serial).toBe(statuses[0].serial)
    expect(p.effects.suong.passive.targetIds).toEqual(["target-0", "target-1"])
    expect(
      sampleConfirmedEffect(suong, undefined, p.effects.suong.passive, 0, false)
        .effect?.cue,
    ).toBe(180)
    expect(
      b.actors.find((a) => a.id === "suong")!.passive.suongSlowCooldowns,
    ).toEqual({
      "target-0": statuses[0].tick + 8,
      "target-1": statuses[0].tick + 8,
    })
  })
  it("deduplicates ultimate hits/pull statuses, respects control immunity and keeps target-owned reactions", () => {
    const b = advanceCombatBattle(
      castCombatUltimate(seed(false, false, true), "suong", "target-0"),
      3,
    )
    const hits = b.events.filter(
      (e) => e.kind === "hit" && e.skillId === suong.skills.ultimate.id,
    )
    const pulls = b.events.filter(
      (e) => e.kind === "status" && e.skillId === suong.skills.ultimate.id,
    )
    expect(hits).toHaveLength(2)
    expect(pulls.map((e) => e.targetIds[0])).toEqual(["target-0"])
    expect(b.actors.find((a) => a.id === "target-1")!.position).toBe(24)
    const p = reduceCombatPresentation(createCombatPresentation(), b.events)
    expect(p.effects.suong.ultimate.serial).toBe(hits[0].serial)
    expect(p.effects.suong.ultimate.targetIds).toEqual(["target-0", "target-1"])
    expect(p.actors.suong.skillId).toBe(suong.skills.ultimate.id)
    expect(p.actors["target-1"].skillId).toBeUndefined()
    expect(
      sampleActorPlayback(suong, undefined, p.actors.suong, false, 0, false)
        .pose.frame,
    ).toBe("battle.ultimate.2")
    const before = castCombatUltimate(seed(), "suong", "target-0")
    const canceled = advanceCombatBattle(
      interruptCombatCast(before, "suong"),
      4,
    )
    expect(
      reduceCombatPresentation(createCombatPresentation(), canceled.events)
        .effects.suong,
    ).toBeUndefined()
  })
  it("empty zones and terminal cancellation fabricate no future contacts", () => {
    const empty = advanceCombatBattle(seed(false, true), 2)
    empty.actors
      .filter((a) => a.side === "enemy")
      .forEach((a) => {
        a.position = 95
      })
    const missed = advanceCombatBattle(empty, 5)
    expect(missed.events.some((e) => e.kind === "miss")).toBe(true)
    const visible = reduceCombatPresentation(
      createCombatPresentation(),
      missed.events,
    )
    expect(visible.effects.suong.auto.tick).toBe(empty.tick)
    expect(missed.events.filter((e) => e.kind === "hit")).toHaveLength(2)
    const terminal = advanceCombatBattle(seed(false, true))
    terminal.actors
      .filter((a) => a.side === "enemy")
      .forEach((a) => {
        a.hp = 0
      })
    const ended = advanceCombatBattle(terminal, 8)
    const p = reduceCombatPresentation(createCombatPresentation(), ended.events)
    expect(p.terminal).not.toBeNull()
    expect(p.effects.suong).toBeUndefined()
    expect(Object.keys(p.projectiles)).toHaveLength(0)
  })
})
