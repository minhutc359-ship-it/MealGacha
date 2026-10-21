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
  type CombatEvent,
} from "@/aw2/combat"

const moc = STARTER_ASSETS["aw2-moc-non"]
const seed = (basic = false, auto = false) =>
  createCombatBattle({
    id: "moc-confirmed-support",
    players: [
      {
        id: "moc",
        spiritId: "aw2-moc-non",
        position: 10,
        energy: 100,
        nextBasicTick: basic ? 0 : 10_000,
        nextAutoTick: auto ? 0 : 10_000,
      },
      {
        id: "than",
        spiritId: "aw2-than",
        position: 14,
        nextBasicTick: 10_000,
        nextAutoTick: 10_000,
      },
      {
        id: "lua",
        spiritId: "aw2-lua",
        position: 12,
        nextBasicTick: 10_000,
        nextAutoTick: 10_000,
      },
    ],
    enemies: [
      {
        id: "target",
        spiritId: "aw2-enemy-test",
        position: 20,
        hp: 500,
        maxHp: 500,
        nextBasicTick: 10_000,
        nextAutoTick: 10_000,
      },
    ],
  })

describe("ART-MOC-NON / BATTLE-01 motion and confirmed support", () => {
  it("declares32 new cels/eight states, preserved reduced poses and unchanged reference timings", () => {
    expect(validateAssetManifest(moc)).toEqual([])
    expect(Object.keys(moc.frames)).toHaveLength(72)
    for (const state of BATTLE_STATES) {
      expect(
        new Set(moc.battle[state].frames.map((key) => key.frame)).size,
      ).toBe(4)
      expect(moc.battle[state].reducedMotionFrame).toBe(`battle.${state}`)
    }
    expect(sampleProjectile(moc.skills.basic, 259)).toBeNull()
    expect(sampleProjectile(moc.skills.basic, 260)).not.toBeNull()
    expect(sampleProjectile(moc.skills.basic, 700)).toBeNull()
    expect(moc.skills.auto.fxCueAtMs).toEqual([420])
    expect(moc.skills.ultimate.fxCueAtMs).toEqual([560])
    expect(moc.fullCharacterComplete).toBe(false)
    expect(moc.provenance.commercialRelease).toBe("NOT_CLEARED")
  })

  it("shows basic flight without premature impact, then uses confirmed target impact art only", () => {
    const launched = advanceCombatBattle(seed(true))
    const first = reduceCombatPresentation(
      createCombatPresentation(),
      launched.events,
    )
    expect(first.actors.moc.phase).toBe("launch")
    expect(Object.values(first.projectiles)).toHaveLength(1)
    expect(sampleActorEffect(moc, first.actors.moc, 700)).toBeNull()
    const final = reduceCombatPresentation(
      first,
      advanceCombatBattle(launched, 2).events,
    )
    const cue = final.effects.moc.basic
    expect(cue.targetId).toBe("target")
    expect(Object.values(final.projectiles)).toHaveLength(0)
    const start = sampleConfirmedEffect(moc, undefined, cue, 0, false)
    expect(start.effect?.frame).toBe("fx.basic.2")
    expect(
      sampleConfirmedEffect(moc, start.clock, cue, 90, false).effect?.frame,
    ).toBe("fx.basic.3")
    expect(
      sampleConfirmedEffect(moc, start.clock, cue, 180, true).effect,
    ).toBeNull()
    expect(final.actors.target.contactIndex).toBeUndefined()
  })

  it("casts no shield FX until the real auto shield is granted to an ally", () => {
    const started = advanceCombatBattle(seed(false, true))
    const first = reduceCombatPresentation(
      createCombatPresentation(),
      started.events,
    )
    expect(first.actors.moc.phase).toBe("prepare")
    expect(first.effects.moc).toBeUndefined()
    expect(sampleActorEffect(moc, first.actors.moc, 420)).toBeNull()
    const battle = advanceCombatBattle(started)
    const final = reduceCombatPresentation(first, battle.events)
    expect(final.effects.moc.auto).toMatchObject({
      skillId: moc.skills.auto.id,
      targetId: "than",
      index: 0,
    })
    expect(battle.actors.find((a) => a.id === "than")!.shield).toBeGreaterThan(
      0,
    )
    expect(final.actors.than).toMatchObject({ state: "guard" })
    expect(final.actors.than.skillId).toBeUndefined()
    expect(
      sampleConfirmedEffect(moc, undefined, final.effects.moc.auto, 0, false)
        .effect?.cue,
    ).toBe(420)
  })

  it("groups real multi-recipient ultimate statuses into one source FX across partial batches", () => {
    const battle = advanceCombatBattle(castCombatUltimate(seed(), "moc"), 2)
    const statuses = battle.events.filter(
      (e) => e.kind === "status" && e.skillId === moc.skills.ultimate.id,
    )
    expect(statuses).toHaveLength(3)
    expect(new Set(statuses.map((e) => e.tick)).size).toBe(1)
    let presentation = createCombatPresentation()
    const serials = new Set<number>()
    for (const e of battle.events) {
      presentation = reduceCombatPresentation(presentation, [e])
      if (presentation.effects.moc?.ultimate)
        serials.add(presentation.effects.moc.ultimate.serial)
    }
    expect([...serials]).toEqual([statuses[0].serial])
    expect(presentation.actors.moc).toMatchObject({
      state: "ultimate",
      phase: "confirmed",
      contactIndex: 0,
    })
    expect(presentation.actors.than).toMatchObject({
      state: "guard",
      serial: statuses.find((e) => e.targetIds.includes("than"))!.serial,
    })
    expect(presentation.actors.lua.skillId).toBeUndefined()
    expect(
      battle.actors
        .filter((a) => a.side === "player")
        .every((a) => a.interruptGuardCharges === 1),
    ).toBe(true)
    expect(presentation).toEqual(
      reduceCombatPresentation(createCombatPresentation(), battle.events),
    )
    expect(reduceCombatPresentation(presentation, battle.events)).toBe(
      presentation,
    )
    const pose = sampleActorPlayback(
      moc,
      undefined,
      presentation.actors.moc,
      false,
      0,
      false,
    )
    expect(pose.pose.frame).toBe("battle.ultimate.2")
  })

  it("keeps simultaneous real support and basic effects while preserving the ultimate source gesture", () => {
    const battle = advanceCombatBattle(castCombatUltimate(seed(true), "moc"), 3)
    const p = reduceCombatPresentation(
      createCombatPresentation(),
      battle.events,
    )
    expect(p.effects.moc.ultimate).toBeDefined()
    expect(p.effects.moc.basic.targetId).toBe("target")
    const firstTick = p.effects.moc.ultimate.tick
    const atCommit = reduceCombatPresentation(
      createCombatPresentation(),
      battle.events.filter((e) => e.tick <= firstTick),
    )
    expect(atCommit.actors.moc.skillId).toBe(moc.skills.ultimate.id)
    expect(Object.values(atCommit.projectiles)).toHaveLength(1)
    const fx = sampleConfirmedEffect(
      moc,
      undefined,
      p.effects.moc.ultimate,
      0,
      true,
    )
    expect(fx.effect?.cue).toBe(560)
    expect(
      sampleConfirmedEffect(moc, fx.clock, p.effects.moc.ultimate, 440, true)
        .effect,
    ).toBeNull()
    expect(
      sampleConfirmedEffect(moc, fx.clock, p.effects.moc.ultimate, 1320, true)
        .effect,
    ).toBeNull()
  })

  it("presents the passive only after two real distinct ally shields and no simulated proc", () => {
    const battle = advanceCombatBattle(seed(false, true), 10)
    const shields = battle.events.filter(
      (e) => e.kind === "shield" && e.skillId === moc.skills.auto.id,
    )
    expect(new Set(shields.map((e) => e.targetIds[0])).size).toBe(2)
    const proc = battle.events.filter(
      (e) => e.kind === "status" && e.skillId === moc.skills.passive.id,
    )
    expect(proc).toHaveLength(1)
    const p = reduceCombatPresentation(
      createCombatPresentation(),
      battle.events,
    )
    expect(p.effects.moc.passive.serial).toBe(proc[0].serial)
    expect(p.actors.moc.state).toBe("guard")
    expect(
      sampleConfirmedEffect(moc, undefined, p.effects.moc.passive, 0, false)
        .effect?.cue,
    ).toBe(180)
  })

  it("an interrupted cast produces no ultimate support, and miss/terminal do not fabricate impact", () => {
    const started = castCombatUltimate(seed(), "moc")
    const canceled = advanceCombatBattle(interruptCombatCast(started, "moc"), 5)
    expect(
      canceled.events.filter(
        (e) => e.kind === "status" && e.skillId === moc.skills.ultimate.id,
      ),
    ).toEqual([])
    expect(
      reduceCombatPresentation(createCombatPresentation(), canceled.events)
        .effects.moc,
    ).toBeUndefined()
    const events: CombatEvent[] = [
      {
        serial: 1,
        tick: 1,
        kind: "projectile-launch",
        sourceId: "moc",
        targetIds: ["target"],
        skillId: moc.skills.basic.id,
        projectileId: "p",
        resolveTick: 3,
      },
      {
        serial: 2,
        tick: 3,
        kind: "miss",
        sourceId: "moc",
        targetIds: ["target"],
        skillId: moc.skills.basic.id,
        projectileId: "p",
      },
      {
        serial: 3,
        tick: 3,
        kind: "battle-end",
        sourceId: null,
        targetIds: [],
        text: "draw",
      },
    ]
    const p = reduceCombatPresentation(createCombatPresentation(), events)
    expect(Object.values(p.projectiles)).toHaveLength(0)
    expect(p.effects.moc).toBeUndefined()
    expect(sampleActorEffect(moc, p.actors.moc, 700)).toBeNull()
  })
})
