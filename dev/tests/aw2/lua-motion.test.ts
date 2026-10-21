import { describe, expect, it } from "vitest"
import { STARTER_ASSETS } from "@/aw2/assets/starters"
import { BATTLE_STATES } from "@/aw2/assets/types"
import {
  markersBetween,
  sampleBattleClip,
  sampleSkillFx,
  validateAssetManifest,
} from "@/aw2/assets/animation"
import { sampleActorPlayback } from "@/aw2/assets/playback"
import {
  advanceCombatBattle,
  createCombatBattle,
  createCombatPresentation,
  reduceCombatPresentation,
  type CombatEvent,
} from "@/aw2/combat"

const lua = STARTER_ASSETS["aw2-lua"]
const basic = "aw2-lua:skill:basic"
const seed = (hp = 500) =>
  createCombatBattle({
    id: "lua-two-contact",
    players: [
      {
        id: "lua",
        spiritId: "aw2-lua",
        position: 10,
        nextBasicTick: 0,
        nextAutoTick: 10_000,
      },
    ],
    enemies: [
      {
        id: "target",
        spiritId: "aw2-enemy-test",
        position: 15,
        hp,
        maxHp: hp,
        nextBasicTick: 10_000,
        nextAutoTick: 10_000,
      },
    ],
  })

describe("ART-LUA / BATTLE-01 authored motion and confirmed contacts", () => {
  it("keeps a complete reference inventory without claiming finished art/rights", () => {
    expect(validateAssetManifest(lua)).toEqual([])
    expect(Object.keys(lua.frames)).toHaveLength(72)
    for (const state of BATTLE_STATES) {
      const cels = lua.battle[state].frames.filter((key) =>
        key.frame.startsWith(`battle.${state}.`),
      )
      expect(new Set(cels.map((key) => key.frame)).size).toBe(4)
      expect(lua.battle[state].reducedMotionFrame).toBe(`battle.${state}`)
    }
    expect(lua.fullCharacterComplete).toBe(false)
    expect(lua.provenance.commercialRelease).toBe("NOT_CLEARED")
    expect(lua.skills.basic.projectile).toBeNull()
  })

  it("separates the two contact poses, retraction and recovery at authored boundaries", () => {
    const expected = [
      [219, "battle.attack.0"],
      [220, "battle.attack.1"],
      [299, "battle.attack.1"],
      [300, "battle.attack.2"],
      [379, "battle.attack.2"],
      [380, "battle.attack.3"],
      [559, "battle.attack.3"],
      [560, "battle.idle.0"],
    ] as const
    for (const [time, frame] of expected)
      expect(sampleBattleClip(lua.battle.attack, time).frame).toBe(frame)
    expect(
      markersBetween(lua.battle.attack, 0, 1000).map((marker) => marker.atMs),
    ).toEqual([220, 380])
    expect(sampleSkillFx(lua.skills.basic, 379)?.cue).toBe(220)
    expect(sampleSkillFx(lua.skills.basic, 380)?.cue).toBe(380)
  })

  it("never advances a single confirmed hit to the unconfirmed second pose or FX", () => {
    const cue = {
      state: "attack" as const,
      serial: 1,
      skillId: basic,
      contactIndex: 0,
    }
    const first = sampleActorPlayback(lua, undefined, cue, false, 0, false)
    expect(first.pose.frame).toBe("battle.attack.1")
    const waiting = sampleActorPlayback(
      lua,
      first.clock,
      cue,
      false,
      380,
      false,
    )
    expect(waiting.pose.frame).toBe("battle.attack.2")
    expect(sampleSkillFx(lua.skills.basic, 160, false, 0)?.cue).toBe(220)
    expect(sampleSkillFx(lua.skills.basic, 380, false, 0)).toBeNull()
    const settled = sampleActorPlayback(
      lua,
      first.clock,
      cue,
      false,
      650,
      false,
    )
    expect(settled.active).toBe(false)
    expect(settled.state).toBe("idle")
  })

  it("plays only the second confirmed beat and its recovery instead of replaying the first", () => {
    const first = sampleActorPlayback(
      lua,
      undefined,
      { state: "attack", serial: 1, skillId: basic, contactIndex: 0 },
      false,
      0,
      false,
    )
    const cue = {
      state: "attack" as const,
      serial: 2,
      skillId: basic,
      contactIndex: 1,
    }
    const second = sampleActorPlayback(lua, first.clock, cue, false, 650, false)
    expect(second.pose.frame).toBe("battle.attack.3")
    expect(
      sampleSkillFx(lua.skills.basic, second.elapsedMs, false, 1),
    ).toMatchObject({ cue: 380, frame: "fx.basic.0" })
    expect(
      sampleActorPlayback(lua, second.clock, cue, false, 830, false).pose.frame,
    ).toBe("battle.idle.0")
    expect(
      sampleActorPlayback(lua, second.clock, cue, false, 830, true).pose.frame,
    ).toBe("battle.attack")
  })

  it("derives both beats from unchanged real rules events across partial presentation batches", () => {
    let battle = advanceCombatBattle(seed())
    const firstHit = battle.events.find(
      (event) => event.kind === "hit" && event.skillId === basic,
    )!
    const first = reduceCombatPresentation(
      createCombatPresentation(),
      battle.events,
    )
    expect(first.actors.lua.contactIndex).toBe(0)
    const firstHp = battle.actors.find((actor) => actor.id === "target")!.hp
    battle = advanceCombatBattle(battle)
    const incoming = battle.events.filter(
      (event) => event.serial > first.lastSerial,
    )
    const second = reduceCombatPresentation(first, incoming)
    const hits = battle.events.filter(
      (event) => event.kind === "hit" && event.skillId === basic,
    )
    expect(hits).toHaveLength(2)
    expect(hits[1].tick).toBe(firstHit.tick + 1)
    expect(second.actors.lua.contactIndex).toBe(1)
    expect(
      battle.actors.find((actor) => actor.id === "target")!.hp,
    ).toBeLessThan(firstHp)
    expect(second.actors.target.contactIndex).toBeUndefined()
    expect(reduceCombatPresentation(second, battle.events)).toBe(second)
  })

  it("does not invent another hit or second contact when the first hit ends combat", () => {
    const battle = advanceCombatBattle(seed(1))
    expect(battle.status).toBe("player-win")
    expect(
      battle.events.filter(
        (event) => event.kind === "hit" && event.skillId === basic,
      ),
    ).toHaveLength(1)
    const presentation = reduceCombatPresentation(
      createCombatPresentation(),
      battle.events,
    )
    expect(presentation.contacts.lua.index).toBe(0)
    expect(
      sampleSkillFx(
        lua.skills.basic,
        380,
        false,
        presentation.contacts.lua.index,
      ),
    ).toBeNull()
  })

  it("resets contact grouping on miss, changed target or a later combo", () => {
    const event = (
      serial: number,
      tick: number,
      kind: CombatEvent["kind"],
      target = "target",
    ): CombatEvent => ({
      serial,
      tick,
      kind,
      sourceId: "lua",
      targetIds: [target],
      skillId: basic,
    })
    let current = reduceCombatPresentation(createCombatPresentation(), [
      event(1, 1, "hit"),
    ])
    current = reduceCombatPresentation(current, [event(2, 2, "miss")])
    expect(current.contacts.lua).toBeUndefined()
    current = reduceCombatPresentation(current, [
      event(3, 3, "hit"),
      event(4, 4, "hit", "other"),
    ])
    expect(current.actors.lua.contactIndex).toBe(0)
    current = reduceCombatPresentation(current, [event(5, 8, "hit", "other")])
    expect(current.actors.lua.contactIndex).toBe(0)
  })
})
