import { describe, expect, it } from "vitest"
import {
  COMBAT_KITS,
  STARTER_SPIRIT_IDS,
  HAI_TUNING,
  createCombatBattle,
  advanceCombatBattle,
  castCombatUltimate,
  interruptCombatCast,
  createDevelopmentCombatSeed,
  experienceToReachLevel,
  createCombatPresentation,
  reduceCombatPresentation,
  type CombatBattle,
  type CombatUnitSeed,
} from "@/aw2/combat"
import { combatAudioCues } from "@/aw2/combat/audio"
import { sampleActorEffect, sampleConfirmedEffect } from "@/aw2/assets/playback"
import { ROSTER_ASSETS } from "@/aw2/assets/roster"
import {
  createBattlePreviewSession,
  reduceBattlePreviewSession,
} from "../../aw2/battleSession"
import { createForgottenHostSeed } from "@/aw2/combat/forgottenHost"

const quiet = { nextBasicTick: 10000, nextAutoTick: 10000 }
const seed = (
  id: string,
  spiritId: string,
  position: number,
  extra: Partial<CombatUnitSeed> = {},
): CombatUnitSeed => ({ id, spiritId, position, ...quiet, ...extra })
const start = (
  extra: Partial<CombatUnitSeed> = {},
  others: CombatUnitSeed[] = [],
) =>
  createCombatBattle({
    id: "hai-contract",
    players: [seed("h", "aw2-hai", 10, { energy: 100, ...extra }), ...others],
    enemies: [
      seed("e", "test-enemy", 18, { hp: 10000, maxHp: 10000, defense: 0 }),
    ],
  })
const a = (b: CombatBattle, id = "h") => b.actors.find((a) => a.id === id)!
const ev = (b: CombatBattle, slot: string) =>
  b.events.filter((e) => e.skillId === `aw2-hai:skill:${slot}`)
const line = (b = start({}, [seed("ally", "aw2-lua", 8, { defense: 0 })])) =>
  advanceCombatBattle(castCombatUltimate(b, "h"), 2)
// Model already-launched impacts, so every test rechecks live positions at commit.
function incoming(b: CombatBattle, target = "ally", amount = 100) {
  const next = structuredClone(b)
  const serial = ++next.actionSerial
  next.effects.push({
    id: `effect:${serial}`,
    serial,
    sourceId: "e",
    targetId: target,
    kind: "damage",
    skillId: "test-enemy:skill:basic",
    amount,
    resolveTick: b.tick + 1,
  })
  return advanceCombatBattle(next)
}

describe("AW2-007G actual directional Hải kit", () => {
  it("retains Hải among supported kits and level1–20 without granting starter ownership", () => {
    expect(Object.keys(COMBAT_KITS)).toHaveLength(9)
    expect(STARTER_SPIRIT_IDS).toHaveLength(5)
    expect(STARTER_SPIRIT_IDS).not.toContain("aw2-hai")
    for (const level of [1, 5, 10, 20]) {
      const s = createDevelopmentCombatSeed(
        "h",
        "aw2-hai",
        experienceToReachLevel(level),
      )
      expect(s.maxHp).toBe(Math.round(240 * (1 + (level - 1) * 0.055)))
    }
    expect(() => start({ spiritId: "aw2-unknown" })).toThrow(
      "chưa có combat kit",
    )
  })
  it("melee hits only within range and never launches a projectile", () => {
    let b = advanceCombatBattle(start({ nextBasicTick: 1 }))
    expect(ev(b, "basic").filter((e) => e.kind === "hit")).toHaveLength(1)
    expect(b.events.some((e) => e.kind === "projectile-launch")).toBe(false)
    b = start({ position: 1, nextBasicTick: 1 })
    b = advanceCombatBattle(b)
    expect(ev(b, "basic").some((e) => e.kind === "hit")).toBe(false)
    expect(a(b).position).toBe(7)
  })
  it("does not consume auto cooldown without a nearby enemy", () => {
    const b = advanceCombatBattle(start({ position: 1, nextAutoTick: 1 }))
    expect(a(b).cast).toBeNull()
    expect(a(b).nextAutoTick).toBe(1)
  })
  it("locks direction then commits a fixed finite slow zone", () => {
    let b = advanceCombatBattle(start({ nextAutoTick: 1 }))
    expect(a(b).cast?.facing).toBe(1)
    a(b, "e").position = 2 // Moving past the cast does not rotate its future field.
    b = advanceCombatBattle(b)
    expect(a(b).haiZone).toEqual({ center: 14, radius: 4, expiresAtTick: 6 })
    expect(a(b, "e").slowUntilTick).toBe(0)
    a(b).position = 30
    a(b, "e").position = 18
    b = advanceCombatBattle(b)
    expect(a(b).haiZone?.center).toBe(14)
    expect(a(b, "e").slowUntilTick).toBe(5)
    b = advanceCombatBattle(b, 3)
    expect(a(b).haiZone).toBeUndefined()
    expect(a(b, "e").slowUntilTick).toBeLessThanOrEqual(b.tick)
  })
  it("real slow halves movement without blocking collision or moving the enemy", () => {
    let b = advanceCombatBattle(start({ nextAutoTick: 1 }), 2)
    a(b, "e").nextBasicTick = 3
    a(b, "e").range = 1
    b = advanceCombatBattle(b)
    expect(a(b, "e").position).toBe(15) // Speed6 halved, toward Hải10.
    expect(a(b).position).toBe(10)
  })
  it.each(["controlImmune", "debuffImmune"] as const)(
    "zone respects %s",
    (flag) => {
      let b = start({ nextAutoTick: 1 })
      a(b, "e")[flag] = true
      b = advanceCombatBattle(b, 3)
      expect(a(b, "e").slowUntilTick).toBe(0)
      expect(
        ev(b, "auto").filter((e) => e.statusEffect === "hai-slow"),
      ).toHaveLength(0)
    },
  )
  it("clamps field origin at arena edge with left-facing geometry", () => {
    let b = start({ position: 1, nextAutoTick: 1 })
    a(b, "e").position = 0
    b = advanceCombatBattle(b, 2)
    expect(a(b).haiZone?.center).toBe(0)
    b = castCombatUltimate(b, "h")
    b = advanceCombatBattle(b, 2)
    expect(a(b).haiLine?.position).toBe(0)
    expect(a(b).haiLine?.facing).toBe(-1)
  })
  it("passive requires another living low-HP ally within12", () => {
    let b = advanceCombatBattle(start({ hp: 30, maxHp: 240 }))
    expect(a(b).shield).toBe(0)
    b = advanceCombatBattle(
      start({}, [seed("ally", "aw2-lua", 22, { hp: 35, maxHp: 100 })]),
    )
    expect(a(b).shield).toBe(48)
    expect(a(b).haiPassiveUntilTick).toBe(11)
    expect(a(b).shieldExpiresAtTick).toBe(5)
  })
  it.each([
    { position: 22.1, hp: 35 },
    { position: 20, hp: 36 },
    { position: 20, hp: 35, summoned: true },
  ])("does not proc for ineligible ally %j", (extra) => {
    const b = advanceCombatBattle(
      start({}, [seed("ally", "aw2-lua", 20, { maxHp: 100, ...extra })]),
    )
    expect(a(b).shield).toBe(0)
  })
  it("does not stack/refresh per tick and waits for both shield expiry and cooldown", () => {
    let b = start({}, [seed("ally", "aw2-lua", 8, { hp: 30, maxHp: 100 })])
    b = advanceCombatBattle(b, 10)
    expect(ev(b, "passive").filter((e) => e.kind === "shield")).toHaveLength(1)
    expect(a(b).shield).toBe(0)
    b = advanceCombatBattle(b)
    expect(a(b).shield).toBe(48)
    expect(ev(b, "passive").filter((e) => e.kind === "shield")).toHaveLength(2)
  })
  it("ordinary shield delays passive without consuming its cooldown", () => {
    let b = start({}, [seed("ally", "aw2-lua", 8, { hp: 30, maxHp: 100 })])
    a(b).shield = 12
    a(b).shieldExpiresAtTick = 2
    b = advanceCombatBattle(b)
    expect(a(b).haiPassiveUntilTick).toBeUndefined()
    b = advanceCombatBattle(b)
    expect(a(b).shield).toBe(48)
  })
  it("reacts to real ally HP loss in the same tick without retroactive absorption", () => {
    const b = incoming(
      start({}, [
        seed("ally", "aw2-lua", 8, { hp: 100, maxHp: 100, defense: 0 }),
      ]),
      "ally",
      70,
    )
    expect(a(b, "ally").hp).toBe(30)
    expect(a(b).shield).toBe(48)
  })
  it("ultimate spends100 then creates one line only on actual commit", () => {
    let b = castCombatUltimate(start(), "h")
    expect(a(b).energy).toBe(0)
    expect(a(b).haiLine).toBeUndefined()
    expect(() => castCombatUltimate(b, "h")).toThrow()
    b = advanceCombatBattle(b, 2)
    expect(a(b).haiLine).toEqual({
      position: 12,
      facing: 1,
      expiresAtTick: 8,
      remaining: 84,
      createdTick: 2,
    })
  })
  it("interruption consumes paid energy but creates no promised line or cue", () => {
    let b = interruptCombatCast(castCombatUltimate(start(), "h"), "h")
    b = advanceCombatBattle(b, 3)
    expect(a(b).energy).toBe(0)
    expect(a(b).haiLine).toBeUndefined()
    expect(combatAudioCues(b.events, 0)).toEqual([])
    const view = reduceCombatPresentation(createCombatPresentation(), b.events)
    expect(view.actors.h.state).toBe("hit")
    expect(view.effects.h).toBeUndefined()
  })
  it("blocks50% before ordinary shield and shares a finite84-point capacity", () => {
    let b = line()
    a(b, "ally").shield = 10
    b = incoming(b)
    expect(a(b, "ally").hp).toBe(110) // Base150 -40, ten ordinary shield absorbed.
    expect(a(b).haiLine?.remaining).toBe(34)
    const hit = b.events
      .slice()
      .reverse()
      .find((e) => e.kind === "hit")!
    expect(hit).toMatchObject({ amount: 40, absorbed: 10, blocked: 50 })
    expect(a(b, "e").damageDealt).toBe(50)
    b = incoming(b)
    expect(a(b).haiLine).toBeUndefined()
    expect(
      b.events
        .slice()
        .reverse()
        .find((e) => e.kind === "hit")?.blocked,
    ).toBe(34)
  })
  it.each(["flank", "front-ally", "outside-depth"])(
    "%s bypasses line",
    (scenario) => {
      let b = line()
      if (scenario === "flank") a(b, "e").position = 9
      if (scenario === "front-ally") a(b, "ally").position = 13
      if (scenario === "outside-depth") {
        a(b).haiLine!.position = 30
        a(b, "e").position = 40
      }
      b = incoming(b)
      expect(
        b.events
          .slice()
          .reverse()
          .find((e) => e.kind === "hit")?.blocked,
      ).toBeUndefined()
      expect(a(b).haiLine?.remaining).toBe(84)
    },
  )
  it("uses impact positions and a fixed line while Hải moves away", () => {
    let b = line()
    a(b).position = 40
    b = incoming(b)
    expect(a(b).haiLine?.position).toBe(12)
    expect(
      b.events
        .slice()
        .reverse()
        .find((e) => e.kind === "hit")?.blocked,
    ).toBe(50)
  })
  it("never stacks lines: equal-age tie uses sourceID and only one capacity", () => {
    let b = start({}, [
      seed("ally", "aw2-lua", 8, { defense: 0 }),
      seed("h2", "aw2-hai", 10, { energy: 100 }),
    ])
    b = advanceCombatBattle(
      castCombatUltimate(castCombatUltimate(b, "h2"), "h"),
      2,
    )
    b = incoming(b)
    expect(
      b.events
        .slice()
        .reverse()
        .find((e) => e.kind === "hit")?.blocked,
    ).toBe(50)
    expect(a(b).haiLine?.remaining).toBe(34)
    expect(a(b, "h2").haiLine?.remaining).toBe(84)
  })
  it("line expires at its exact tick and source death cancels all fields", () => {
    let b = advanceCombatBattle(line(), 6)
    expect(a(b).haiLine).toBeUndefined()
    b = advanceCombatBattle(start({ nextAutoTick: 1 }), 2)
    b = advanceCombatBattle(castCombatUltimate(b, "h"), 2)
    b = incoming(b, "h", 10000)
    expect(a(b).hp).toBe(0)
    expect(a(b).haiLine).toBeUndefined()
    expect(a(b).haiZone).toBeUndefined()
    expect(b.status).toBe("enemy-win")
  })
  it("recast replaces capacity, old committed field survives only a different interrupted cast", () => {
    let b = line()
    a(b).energy = 100
    a(b).position = 30
    b = castCombatUltimate(b, "h")
    b = interruptCombatCast(b, "h")
    expect(a(b).haiLine?.position).toBe(12)
    a(b).energy = 100
    b = advanceCombatBattle(castCombatUltimate(b, "h"), 2)
    expect(a(b).haiLine?.position).toBe(28) // Enemy now left of Hải.
    expect(a(b).haiLine?.remaining).toBe(84)
  })
  it("boss control immunity and barrier remain authoritative", () => {
    let b = createCombatBattle({
      id: "boss",
      players: [
        seed("h", "aw2-hai", 10, { nextAutoTick: 1, nextBasicTick: 1 }),
      ],
      enemies: [
        { ...createForgottenHostSeed(), position: 18, nextBasicTick: 10000 },
      ],
    })
    const boss = b.actors.find((x) => x.bossKit)!
    boss.bossKit!.barrierHits = 4
    boss.bossKit!.barrierExpiresAtTick = 100
    boss.bossKit!.nextSkillTick = 10000
    b = advanceCombatBattle(b, 3)
    const current = b.actors.find((x) => x.bossKit)!
    expect(current.slowUntilTick).toBe(0)
    expect(current.bossKit!.barrierHits).toBe(3)
    expect(current.hp).toBe(current.maxHp)
  })
  it("JSON resume replays active fields and cooldown byte-identically", () => {
    let b = advanceCombatBattle(
      start({ nextAutoTick: 1 }, [
        seed("ally", "aw2-lua", 8, { hp: 35, maxHp: 100 }),
      ]),
      2,
    )
    b = advanceCombatBattle(castCombatUltimate(b, "h"), 2)
    expect(advanceCombatBattle(JSON.parse(JSON.stringify(b)), 8)).toEqual(
      advanceCombatBattle(b, 8),
    )
  })
  it("death before ultimate commit cancels it and cannot revive a dead ally", () => {
    let b = start({}, [seed("ally", "aw2-lua", 8, { hp: 1, maxHp: 100 })])
    b = castCombatUltimate(b, "h")
    b = incoming(b, "h", 10000)
    b = advanceCombatBattle(b, 3)
    expect(a(b).haiLine).toBeUndefined()
    expect(ev(b, "ultimate").some((e) => e.statusChange === "apply")).toBe(
      false,
    )
    b = incoming(
      start({}, [
        seed("ally", "aw2-lua", 8, { hp: 100, maxHp: 100, defense: 0 }),
      ]),
      "ally",
      1000,
    )
    expect(a(b, "ally").hp).toBe(0)
    expect(a(b).shield).toBe(0)
  })
  it("terminal victory clears both fields while living Hải remains", () => {
    let b = advanceCombatBattle(start({ nextAutoTick: 1 }), 2)
    b = advanceCombatBattle(castCombatUltimate(b, "h"), 2)
    a(b, "e").hp = 1
    a(b).nextBasicTick = b.tick + 1
    b = advanceCombatBattle(b)
    expect(b.status).toBe("player-win")
    expect(a(b).haiZone).toBeUndefined()
    expect(a(b).haiLine).toBeUndefined()
    expect(advanceCombatBattle(b)).toBe(b)
  })
  it("older line takes priority over newer source ID and replacement never adds capacity", () => {
    let b = start({}, [
      seed("ally", "aw2-lua", 8, { defense: 0 }),
      seed("a", "aw2-hai", 10, { energy: 100 }),
    ])
    b = advanceCombatBattle(castCombatUltimate(b, "h"), 2)
    b = advanceCombatBattle(castCombatUltimate(b, "a"), 2)
    b = incoming(b)
    expect(a(b).haiLine?.remaining).toBe(34)
    expect(a(b, "a").haiLine?.remaining).toBe(84)
  })
  it("presentation/audio are confirmed-only; slow refresh and block never restart casting FX", () => {
    let b = advanceCombatBattle(
      start({ nextAutoTick: 1 }, [seed("ally", "aw2-lua", 8, { defense: 0 })]),
      2,
    )
    const prepared = ev(b, "auto").find((e) => e.kind === "cast-start")!
    const v = reduceCombatPresentation(createCombatPresentation(), b.events)
    expect(v.effects.h.auto.skillId).toBe("aw2-hai:skill:auto")
    expect(v.actors.h.phase).toBe("confirmed")
    expect(
      combatAudioCues(b.events, 0).filter((c) => c.slot === "auto"),
    ).toHaveLength(1)
    expect(
      sampleActorEffect(
        ROSTER_ASSETS["aw2-hai"],
        {
          serial: prepared.serial,
          state: "cast",
          phase: "prepare",
          skillId: prepared.skillId,
        },
        500,
      ),
    ).toBeNull()
    const cue = v.effects.h.auto
    const first = sampleConfirmedEffect(
      ROSTER_ASSETS["aw2-hai"],
      undefined,
      cue,
      0,
      true,
    )
    expect(first.effect).not.toBeNull()
    expect(
      sampleConfirmedEffect(
        ROSTER_ASSETS["aw2-hai"],
        first.clock,
        cue,
        1000,
        true,
      ).effect,
    ).toBeNull()
    b = line(b)
    const before = b.eventSerial
    b = incoming(b)
    expect(combatAudioCues(b.events, before)).toEqual([])
  })
  it("isolated max5 practice resets levels/preset and exposes real interrupt command", () => {
    let s = createBattlePreviewSession(5, "hai")
    expect(
      s.battle.actors.filter((x) => x.side === "player").map((x) => x.spiritId),
    ).toEqual(["aw2-hai", "aw2-lua", "aw2-lam", "aw2-moc-non", "aw2-suong"])
    s = reduceBattlePreviewSession(s, {
      type: "ultimate",
      actorId: "player-aw2-hai",
    })
    s = reduceBattlePreviewSession(s, { type: "interrupt-hai" })
    expect(s.battle.actors[0].cast).toBeNull()
    s = reduceBattlePreviewSession(s, { type: "reset", level: 20 })
    expect(s.practice).toBe("hai")
    expect(s.level).toBe(20)
    expect(createBattlePreviewSession(5).battle.actors[0].spiritId).toBe(
      "aw2-than",
    )
  })
})
