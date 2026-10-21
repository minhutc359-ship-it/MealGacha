import { describe, expect, it } from "vitest"
import { STARTER_ASSETS } from "@/aw2/assets/starters"
import { BATTLE_STATES } from "@/aw2/assets/types"
import {
  markersBetween,
  sampleProjectile,
  sampleSkillFx,
  validateAssetManifest,
} from "@/aw2/assets/animation"
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
  type CombatEvent,
} from "@/aw2/combat"

const lam = STARTER_ASSETS["aw2-lam"]
const basic = lam.skills.basic.id
const ultimate = lam.skills.ultimate.id
const event = (
  serial: number,
  tick: number,
  kind: CombatEvent["kind"],
  skillId = ultimate,
  target = "ally",
): CombatEvent => ({
  serial,
  tick,
  kind,
  sourceId: "lam",
  targetIds: [target],
  skillId,
})
const seed = (basicReady = false) =>
  createCombatBattle({
    id: "lam-confirmed-presentation",
    players: [
      {
        id: "lam",
        spiritId: "aw2-lam",
        position: 10,
        energy: 100,
        nextAutoTick: 10_000,
        nextBasicTick: basicReady ? 0 : 10_000,
      },
      {
        id: "ally",
        spiritId: "aw2-than",
        position: 12,
        nextAutoTick: 10_000,
        nextBasicTick: 10_000,
      },
    ],
    enemies: [
      {
        id: "target",
        spiritId: "aw2-enemy-test",
        position: 20,
        hp: 500,
        maxHp: 500,
        nextAutoTick: 10_000,
        nextBasicTick: 10_000,
      },
    ],
  })

describe("ART-LAM / BATTLE-01 motion and confirmed projectile/healing", () => {
  it("declares 32 distinct state-owned cels, original reduced poses and incomplete full DoD", () => {
    expect(validateAssetManifest(lam)).toEqual([])
    expect(Object.keys(lam.frames)).toHaveLength(72)
    for (const state of BATTLE_STATES) {
      expect(
        new Set(lam.battle[state].frames.map((key) => key.frame)).size,
      ).toBe(4)
      expect(lam.battle[state].reducedMotionFrame).toBe(`battle.${state}`)
    }
    expect(lam.fullCharacterComplete).toBe(false)
    expect(lam.provenance.commercialRelease).toBe("NOT_CLEARED")
  })

  it("preserves reference launch260/impact700 and two healing markers520/1040", () => {
    expect(sampleProjectile(lam.skills.basic, 259)).toBeNull()
    expect(sampleProjectile(lam.skills.basic, 260)?.frame).toBe("fx.basic.0")
    expect(sampleProjectile(lam.skills.basic, 699)).not.toBeNull()
    expect(sampleProjectile(lam.skills.basic, 700)).toBeNull()
    expect(sampleSkillFx(lam.skills.basic, 700)?.frame).toBe("fx.basic.2")
    expect(
      markersBetween(lam.battle.ultimate, 0, 1700).map((marker) => marker.atMs),
    ).toEqual([520, 1040])
    expect(sampleSkillFx(lam.skills.ultimate, 1040)?.cue).toBe(1040)
  })

  it("shows flight from real launch, no impact before confirmation, then target-owned impact art only", () => {
    const launched = advanceCombatBattle(seed(true))
    const first = reduceCombatPresentation(
      createCombatPresentation(),
      launched.events,
    )
    expect(Object.values(first.projectiles)).toHaveLength(1)
    expect(first.actors.lam.phase).toBe("launch")
    expect(sampleActorEffect(lam, first.actors.lam, 800)).toBeNull()
    const pose = sampleActorPlayback(
      lam,
      undefined,
      first.actors.lam,
      false,
      0,
      false,
    )
    expect(pose.pose.frame).toBe("battle.attack.1")
    expect(
      sampleActorPlayback(lam, pose.clock, first.actors.lam, false, 500, false)
        .pose.frame,
    ).toBe("battle.attack.1")
    const settled = advanceCombatBattle(launched, 2)
    const final = reduceCombatPresentation(first, settled.events)
    expect(Object.values(final.projectiles)).toHaveLength(0)
    expect(final.actors.lam).toMatchObject({
      phase: "confirmed",
      contactIndex: 0,
      effectTargetId: "target",
    })
    expect(sampleActorEffect(lam, final.actors.lam, 0)).toEqual({
      frame: "fx.basic.2",
      cue: 700,
    })
    expect(sampleActorEffect(lam, final.actors.lam, 90)?.frame).toBe(
      "fx.basic.3",
    )
    expect(sampleActorEffect(lam, final.actors.lam, 180)).toBeNull()
    expect(sampleActorEffect(lam, final.actors.lam, 0, true)?.frame).toBe(
      "fx.basic.2",
    )
  })

  it("groups a real multi-ally two-pulse ultimate once per rules tick through interleaved passive shields", () => {
    const committed = advanceCombatBattle(castCombatUltimate(seed(), "lam"), 3)
    const heals = committed.events.filter(
      (e) => e.kind === "heal" && e.skillId === ultimate,
    )
    expect(heals).toHaveLength(4)
    expect(new Set(heals.map((e) => e.tick)).size).toBe(2)
    expect(heals[2].tick).toBe(heals[0].tick + 2)
    expect(
      committed.events.some(
        (e) => e.kind === "shield" && e.skillId === lam.skills.passive.id,
      ),
    ).toBe(true)
    let presentation = createCombatPresentation()
    const cues = new Map<number, number>()
    for (const e of committed.events) {
      presentation = reduceCombatPresentation(presentation, [e])
      const cue = presentation.actors.lam
      if (cue?.skillId === ultimate && cue.phase === "confirmed")
        cues.set(cue.serial, cue.contactIndex!)
    }
    expect([...cues.values()]).toEqual([0, 1])
    expect(presentation.actors.lam.serial).toBe(heals[2].serial)
    expect(presentation).toEqual(
      reduceCombatPresentation(createCombatPresentation(), committed.events),
    )
    expect(reduceCombatPresentation(presentation, committed.events)).toBe(
      presentation,
    )
    expect(presentation.actors.ally.contactIndex).toBeUndefined()
  })

  it("starts each confirmed healing gesture at its own beat and never advances first to second", () => {
    const first = reduceCombatPresentation(createCombatPresentation(), [
      event(1, 1, "heal"),
    ])
    const cue = first.actors.lam
    const play = sampleActorPlayback(lam, undefined, cue, false, 0, false)
    expect(play.pose.frame).toBe("battle.ultimate.1")
    expect(
      sampleActorPlayback(lam, play.clock, cue, false, 800, false).pose.frame,
    ).toBe("battle.ultimate.2")
    expect(sampleActorEffect(lam, cue, 520)).toBeNull()
    const second = reduceCombatPresentation(first, [event(2, 3, "heal")])
    expect(
      sampleActorPlayback(
        lam,
        play.clock,
        second.actors.lam,
        false,
        1300,
        false,
      ).pose.frame,
    ).toBe("battle.ultimate.3")
    expect(sampleActorEffect(lam, second.actors.lam, 0)).toEqual({
      frame: "fx.ultimate.0",
      cue: 1040,
    })
    expect(
      sampleActorPlayback(lam, play.clock, second.actors.lam, false, 1300, true)
        .pose.frame,
    ).toBe("battle.ultimate")
  })

  it("does not play healing FX during cast preparation or after a pre-commit interruption", () => {
    const started = castCombatUltimate(seed(), "lam")
    const p = reduceCombatPresentation(
      createCombatPresentation(),
      started.events,
    )
    expect(p.actors.lam.phase).toBe("prepare")
    expect(sampleActorEffect(lam, p.actors.lam, 1040)).toBeNull()
    const play = sampleActorPlayback(
      lam,
      undefined,
      p.actors.lam,
      false,
      0,
      false,
    )
    expect(
      sampleActorPlayback(lam, play.clock, p.actors.lam, false, 1500, false)
        .pose.frame,
    ).toBe("battle.ultimate.0")
    const canceled = advanceCombatBattle(interruptCombatCast(started, "lam"), 6)
    expect(canceled.events.filter((e) => e.kind === "heal")).toEqual([])
    const final = reduceCombatPresentation(p, canceled.events)
    expect(final.healingPulses.lam.index).toBe(-1)
    expect(sampleActorEffect(lam, final.actors.lam, 1040)).toBeNull()
    const dead = sampleActorPlayback(
      lam,
      undefined,
      p.actors.lam,
      true,
      0,
      false,
    )
    expect(
      sampleActorPlayback(lam, dead.clock, p.actors.lam, true, 2000, false).pose
        .frame,
    ).toBe("battle.defeat.3")
  })

  it("misses/terminal cancel flights without inventing impact or a second healing pulse", () => {
    let p = reduceCombatPresentation(createCombatPresentation(), [
      {
        ...event(1, 1, "projectile-launch", basic, "target"),
        projectileId: "p",
        resolveTick: 3,
      },
      { ...event(2, 3, "miss", basic, "target"), projectileId: "p" },
    ])
    expect(Object.values(p.projectiles)).toHaveLength(0)
    expect(p.actors.lam.phase).toBe("launch")
    expect(sampleActorEffect(lam, p.actors.lam, 700)).toBeNull()
    p = reduceCombatPresentation(p, [
      event(3, 4, "heal"),
      { ...event(4, 4, "battle-end"), sourceId: null },
    ])
    expect(p.healingPulses.lam.index).toBe(0)
    expect(sampleActorEffect(lam, p.actors.lam, 1040)).toBeNull()
    expect(p.terminal).not.toBeNull()
    expect(
      sampleActorPlayback(lam, undefined, p.actors.lam, true, 2000, false)
        .state,
    ).toBe("defeat")
  })

  it("a real terminal event after the first pulse cancels the queued second pulse", () => {
    const battle = createCombatBattle({
      id: "lam-terminal-between-pulses",
      players: [
        {
          id: "lam",
          spiritId: "aw2-lam",
          position: 10,
          hp: 25,
          maxHp: 100,
          energy: 100,
          nextBasicTick: 10_000,
          nextAutoTick: 10_000,
        },
      ],
      enemies: [
        {
          id: "enemy",
          spiritId: "aw2-enemy-test",
          position: 15,
          attack: 10_000,
          nextBasicTick: 2,
          nextAutoTick: 10_000,
        },
      ],
    })
    const final = advanceCombatBattle(castCombatUltimate(battle, "lam"), 4)
    expect(final.status).toBe("enemy-win")
    expect(
      final.events.filter((e) => e.kind === "heal" && e.skillId === ultimate),
    ).toHaveLength(1)
    const presentation = reduceCombatPresentation(
      createCombatPresentation(),
      final.events,
    )
    expect(presentation.healingPulses.lam.index).toBe(0)
    expect(presentation.actors.lam.state).toBe("defeat")
    expect(sampleActorEffect(lam, presentation.actors.lam, 1040)).toBeNull()
  })

  it("retains simultaneous real heal and ranged impact effects independently from the source pose", () => {
    const committed = advanceCombatBattle(castCombatUltimate(seed(true), "lam"))
    const first = reduceCombatPresentation(
      createCombatPresentation(),
      committed.events,
    )
    expect(Object.values(first.projectiles)).toHaveLength(1)
    expect(first.actors.lam).toMatchObject({
      state: "ultimate",
      phase: "confirmed",
      contactIndex: 0,
    })
    const firstEffect = first.effects.lam.ultimate
    const started = sampleConfirmedEffect(lam, undefined, firstEffect, 0, false)
    expect(started.effect?.cue).toBe(520)
    const settled = advanceCombatBattle(committed, 2)
    const final = reduceCombatPresentation(first, settled.events)
    expect(final.effects.lam.ultimate.index).toBe(1)
    expect(final.effects.lam.basic.targetId).toBe("target")
    expect(final.actors.lam.skillId).toBe(ultimate)
    expect(
      sampleConfirmedEffect(lam, started.clock, firstEffect, 600, false).effect,
    ).toBeNull()
    const second = sampleConfirmedEffect(
      lam,
      started.clock,
      final.effects.lam.ultimate,
      1300,
      false,
    )
    expect(second.effect?.cue).toBe(1040)
    expect(
      sampleConfirmedEffect(
        lam,
        second.clock,
        final.effects.lam.ultimate,
        1300,
        false,
      ).clock,
    ).toBe(second.clock)
    expect(
      sampleConfirmedEffect(
        lam,
        undefined,
        final.effects.lam.basic,
        1300,
        false,
      ).effect?.frame,
    ).toBe("fx.basic.2")
    expect(Object.keys(final.effects.lam).sort()).toEqual(["basic", "ultimate"])
    expect(final).toEqual(
      reduceCombatPresentation(createCombatPresentation(), settled.events),
    )
  })

  it("reduced motion preserves the finite confirmed FX lifetime and cannot revive expired effects", () => {
    const cue = { serial: 1, skillId: ultimate, index: 0 }
    const first = sampleConfirmedEffect(lam, undefined, cue, 0, false)
    expect(
      sampleConfirmedEffect(lam, first.clock, cue, 439, true).effect?.frame,
    ).toBe("fx.ultimate.2")
    expect(
      sampleConfirmedEffect(lam, first.clock, cue, 440, true).effect,
    ).toBeNull()
    expect(
      sampleConfirmedEffect(lam, first.clock, cue, 1040, true).effect,
    ).toBeNull()
    const impact = { serial: 2, skillId: basic, index: 0 }
    const hit = sampleConfirmedEffect(lam, undefined, impact, 0, true)
    expect(hit.effect?.frame).toBe("fx.basic.2")
    expect(
      sampleConfirmedEffect(lam, hit.clock, impact, 180, true).effect,
    ).toBeNull()
  })

  it("resets grouping for a new cast and retains recipient reactions without foreign healing cues", () => {
    const p = reduceCombatPresentation(createCombatPresentation(), [
      event(1, 1, "heal"),
      event(2, 3, "heal"),
      event(3, 10, "cast-start"),
      event(4, 11, "cast-commit"),
      event(5, 11, "heal"),
      {
        ...event(6, 11, "hit", "aw2-lua:skill:basic", "lam"),
        sourceId: "enemy",
      },
      event(7, 11, "heal", ultimate, "other-ally"),
    ])
    expect(p.healingPulses.lam).toMatchObject({
      castSerial: 4,
      index: 0,
      tick: 11,
    })
    expect(p.actors.lam).toMatchObject({ state: "hit", serial: 6 })
    expect(p.actors.lam.contactIndex).toBeUndefined()
    expect(p.floating.filter((item) => item.kind === "heal")).toHaveLength(4)
  })
})
