import { describe, expect, it } from "vitest"
import {
  createCombatBattle,
  advanceCombatBattle,
  castCombatUltimate,
  interruptCombatCast,
  createDevelopmentCombatSeed,
  experienceToReachLevel,
  STARTER_SPIRIT_IDS,
  COMBAT_KITS,
  createCombatPresentation,
  reduceCombatPresentation,
  BACH_TUNING,
  bachThreshold,
  type CombatBattle,
  type CombatUnitSeed,
} from "@/aw2/combat"
import { combatAudioCues } from "@/aw2/combat/audio"
import { ROSTER_ASSETS } from "@/aw2/assets/roster"
import { ROSTER } from "@/aw2/world/ids"
import { sampleActorEffect, sampleConfirmedEffect } from "@/aw2/assets/playback"
import {
  createBattlePreviewSession,
  reduceBattlePreviewSession,
} from "../../aw2/battleSession"
const quiet = { nextBasicTick: 10000, nextAutoTick: 10000 }
const seed = (
  id: string,
  spiritId: string,
  position: number,
  extra: Partial<CombatUnitSeed> = {},
) => ({ id, spiritId, position, ...quiet, ...extra })
const start = (
  extra: Partial<CombatUnitSeed> = {},
  allies = [seed("a", "aw2-lua", 14, { maxHp: 200 })],
  enemies = [seed("e", "enemy", 16, { hp: 10000, maxHp: 10000, defense: 0 })],
) =>
  createCombatBattle({
    id: "bach-contract",
    players: [
      seed("b", "aw2-bach", 10, { energy: 100, defense: 0, ...extra }),
      ...allies,
    ],
    enemies,
  })
const a = (b: CombatBattle, id = "b") => b.actors.find((a) => a.id === id)!
const ev = (b: CombatBattle, slot: string, kind?: string) =>
  b.events.filter(
    (e) => e.skillId === `aw2-bach:skill:${slot}` && (!kind || e.kind === kind),
  )
function hit(b: CombatBattle, amount: number, id = "b", source = "e") {
  const serial = ++b.actionSerial
  b.effects.push({
    id: `effect:${serial}`,
    serial,
    sourceId: source,
    targetId: id,
    kind: "damage",
    skillId: "fixture:skill:basic",
    amount,
    resolveTick: b.tick + 1,
  })
  return advanceCombatBattle(b)
}
function shell(b = start()) {
  a(b).nextAutoTick = b.tick + 1
  return advanceCombatBattle(b, 2)
}
const ult = (b = start()) => advanceCombatBattle(castCombatUltimate(b, "b"), 2)

describe("AW2-007J Bách actual Tank shielding tradeoff", () => {
  it("preserves Tank identity/four names and five starter ownership", () => {
    const r = ROSTER.find((r) => r.spiritId === "aw2-bach")!
    expect([
      r.displayName,
      r.recipeAffiliation,
      r.rarity,
      COMBAT_KITS["aw2-bach"].role,
    ]).toEqual(["Bách", "Bánh chưng", "SSR", "tank"])
    expect(
      Object.values(ROSTER_ASSETS["aw2-bach"].skills).map((s) => s.displayName),
    ).toEqual(["Mối Buộc", "Gói Chắc", "Chia Phần", "Mở Vòng Dây"])
    expect(STARTER_SPIRIT_IDS).toHaveLength(5)
    expect(STARTER_SPIRIT_IDS).not.toContain("aw2-bach")
  })
  it.each([1, 5, 10, 20])(
    "uses existing level %i curve without gaining summons",
    (level) => {
      const s = createDevelopmentCombatSeed(
        "b",
        "aw2-bach",
        experienceToReachLevel(level),
      )
      expect(s.maxHp).toBe(Math.round(250 * (1 + (level - 1) * 0.055)))
      expect(
        createCombatBattle({
          id: "projected",
          players: [s],
          enemies: [seed("e", "enemy", 80)],
        }).actors[0].projectileTicks,
      ).toBe(0)
    },
  )
  it("heavy basic has one-tick anticipation, no projectile and exactly one contact", () => {
    let b = advanceCombatBattle(start({ nextBasicTick: 1 }))
    expect(a(b).bachStrike?.resolveTick).toBe(2)
    expect(ev(b, "basic", "hit")).toHaveLength(0)
    expect(b.effects).toHaveLength(0)
    expect(a(b).nextBasicTick).toBe(7)
    b = advanceCombatBattle(b)
    expect(ev(b, "basic", "hit")[0].amount).toBe(28)
    expect(a(b).bachStrike).toBeUndefined()
    b = advanceCombatBattle(b, 4)
    expect(ev(b, "basic", "hit")).toHaveLength(1)
  })
  it.each(["dead", "range"])(
    "heavy contact misses a %s target without retarget",
    (kind) => {
      let b = advanceCombatBattle(
        start({ nextBasicTick: 1 }, undefined, [
          seed("e", "enemy", 16),
          seed("f", "enemy", 17),
        ]),
      )
      if (kind === "dead") a(b, "e").hp = 0
      else a(b, "e").position = 40
      b = advanceCombatBattle(b)
      expect(ev(b, "basic", "hit")).toHaveLength(0)
      expect(ev(b, "basic", "miss")[0].targetIds).toEqual(["e"])
    },
  )
  it("basic windup blocks a concurrent ultimate/auto and can be interrupted without cooldown refund", () => {
    let b = advanceCombatBattle(start({ nextBasicTick: 1, nextAutoTick: 2 }))
    expect(() => castCombatUltimate(b, "b")).toThrow("điểm chạm")
    b = interruptCombatCast(b, "b")
    expect(a(b).nextBasicTick).toBe(7)
    expect(a(b).bachStrike).toBeUndefined()
    b = advanceCombatBattle(b)
    expect(ev(b, "basic", "hit")).toHaveLength(0)
    expect(a(b).cast?.slot).toBe("auto")
  })
  it("one real interruption guard preserves heavy strike once, second interrupt cancels", () => {
    let b = advanceCombatBattle(start({ nextBasicTick: 1 }))
    a(b).interruptGuardCharges = 1
    a(b).interruptGuardUntilTick = 5
    b = interruptCombatCast(b, "b")
    expect(a(b).bachStrike).toBeDefined()
    expect(a(b).interruptGuardCharges).toBe(0)
    b = interruptCombatCast(b, "b")
    expect(a(b).bachStrike).toBeUndefined()
  })
  it("source defeat cancels a heavy contact", () => {
    let b = advanceCombatBattle(start({ nextBasicTick: 1 }))
    b = hit(b, 10000)
    expect(a(b).hp).toBe(0)
    expect(a(b).bachStrike).toBeUndefined()
    expect(ev(b, "basic", "hit")).toHaveLength(0)
  })
  it("Gói Chắc grants one bounded personal ordinary shield after anticipation", () => {
    let b = advanceCombatBattle(start({ nextAutoTick: 1 }))
    expect(a(b).shield).toBe(0)
    b = advanceCombatBattle(b)
    expect(a(b).shield).toBe(63)
    expect(a(b).shieldExpiresAtTick).toBe(7)
    expect(a(b).bachGuarded ?? 0).toBe(0)
  })
  it("auto cannot begin or add to an already present shield at commit", () => {
    let b = start({ nextAutoTick: 1 })
    a(b).shield = 20
    a(b).shieldExpiresAtTick = 20
    b = advanceCombatBattle(b)
    expect(a(b).cast).toBeNull()
    b = advanceCombatBattle(start({ nextAutoTick: 1 }))
    a(b).shield = 20
    a(b).shieldExpiresAtTick = 20
    b = advanceCombatBattle(b)
    expect(a(b).shield).toBe(20)
    expect(a(b).shieldExpiresAtTick).toBe(20)
    expect(ev(b, "auto", "shield")).toHaveLength(0)
  })
  it("interrupted Gói Chắc cannot grant a future shell", () => {
    let b = advanceCombatBattle(start({ nextAutoTick: 1 }))
    b = interruptCombatCast(b, "b")
    b = advanceCombatBattle(b)
    expect(a(b).shield).toBe(0)
    expect(a(b).nextAutoTick).toBe(11)
  })
  it("ordinary shell expiry does not credit absorbed meter or proc sharing", () => {
    const b = advanceCombatBattle(shell(), 5)
    expect(a(b).shield).toBe(0)
    expect(a(b).bachGuarded ?? 0).toBe(0)
    expect(ev(b, "passive", "shield")).toHaveLength(0)
  })
  it("only actual shield absorption reaches threshold, then grants one nearby ally protection", () => {
    let b = shell()
    b = hit(b, 10)
    expect(a(b).bachGuarded).toBe(10)
    expect(a(b, "a").shield).toBe(0)
    b = hit(b, 20)
    expect(a(b).bachGuarded).toBe(0)
    expect(a(b, "a").shield).toBe(20)
    expect(a(b).bachShareUntilTick).toBe(12)
    expect(ev(b, "passive", "shield")).toHaveLength(1)
  })
  it("HP damage without shield and same-side damage cannot feed Chia Phần", () => {
    let b = hit(start(), 40)
    expect(a(b).bachGuarded ?? 0).toBe(0)
    b = shell()
    b = hit(b, 35, "b", "a")
    expect(a(b).bachGuarded ?? 0).toBe(0)
    expect(ev(b, "passive", "shield")).toHaveLength(0)
  })
  it("defense mitigation and Hải line blocking are excluded before counting ordinary absorption", () => {
    let b = shell(start({ defense: 100 }, [seed("h", "aw2-hai", 8)]))
    a(b, "h").haiLine = {
      position: 12,
      facing: 1,
      remaining: 100,
      createdTick: 0,
      expiresAtTick: 20,
    }
    b = hit(b, 60)
    expect(a(b).bachGuarded).toBe(15)
    expect(a(b).shield).toBe(48)
  })
  it("meter is capped if no nearby eligible recipient and waits for another real absorption", () => {
    let b = shell(start({}, [seed("a", "aw2-lua", 40)]))
    b = hit(b, 60)
    expect(a(b).bachGuarded).toBe(bachThreshold(a(b)))
    a(b, "a").position = 14
    b = advanceCombatBattle(b)
    expect(a(b, "a").shield).toBe(0)
    b = hit(b, 1)
    expect(a(b, "a").shield).toBe(20)
    expect(a(b).bachGuarded).toBe(0)
  })
  it("full, dead, summoned and distant recipients are excluded from passive targeting", () => {
    let b = shell(
      start({}, [
        seed("full", "aw2-lua", 11, { maxHp: 100 }),
        seed("dead", "aw2-lam", 12),
        seed("summon", "aw2-lua", 13, { summoned: true }),
        seed("eligible", "aw2-lam", 20),
      ]),
    )
    a(b, "full").shield = 45
    a(b, "full").shieldExpiresAtTick = 20
    a(b, "dead").hp = 0
    b = hit(b, 30)
    expect(ev(b, "passive", "shield")[0].targetIds).toEqual(["eligible"])
  })
  it("passive chooses distance then injured ratio and applies recipient cap", () => {
    let b = shell(
      start({}, [
        seed("a", "aw2-lua", 14, { hp: 100, maxHp: 200 }),
        seed("c", "aw2-lam", 6, { hp: 10, maxHp: 100 }),
      ]),
    )
    a(b, "c").shield = 44
    a(b, "c").shieldExpiresAtTick = 10
    b = hit(b, 30)
    expect(ev(b, "passive", "shield")[0]).toMatchObject({
      targetIds: ["c"],
      amount: 1,
    })
    expect(a(b).bachGuarded).toBe(0)
  })
  it("cooldown discards absorbed damage, cannot bank another free proc", () => {
    let b = hit(shell(), 30)
    b = hit(b, 30)
    expect(a(b).bachGuarded).toBe(0)
    expect(ev(b, "passive", "shield")).toHaveLength(1)
    a(b).nextAutoTick = 10000
    b = advanceCombatBattle(b, 7)
    a(b).shield = 63
    a(b).shieldExpiresAtTick = b.tick + 5
    b = hit(b, 30)
    expect(ev(b, "passive", "shield")).toHaveLength(2)
  })
  it("a lethal hit cannot proc protection from a defeated source", () => {
    const b = hit(shell(), 10000)
    expect(a(b).hp).toBe(0)
    expect(ev(b, "passive", "shield")).toHaveLength(0)
  })
  it("ultimate consumes remaining personal shield and conserves the granted budget", () => {
    let b = shell(
      start({}, [
        seed("a", "aw2-lua", 14, { maxHp: 200 }),
        seed("c", "aw2-lam", 18, { maxHp: 200 }),
        seed("d", "aw2-suong", 20, { maxHp: 200 }),
      ]),
    )
    b = ult(b)
    expect(a(b).shield).toBe(0)
    expect(a(b).shieldExpiresAtTick).toBe(0)
    expect(a(b).bachGuarded).toBe(0)
    expect(ev(b, "ultimate", "shield").map((e) => e.amount)).toEqual([
      21, 21, 21,
    ])
    expect(ev(b, "ultimate", "status")[0].amount).toBe(63)
    expect(ev(b, "ultimate", "hit")[0].amount).toBe(22)
  })
  it("integer remainder is deterministic and shield cap waste is not redistributed", () => {
    let b = start({}, [
      seed("a", "aw2-lua", 14, { maxHp: 100 }),
      seed("c", "aw2-lam", 18, { maxHp: 100 }),
    ])
    a(b).shield = 63
    a(b).shieldExpiresAtTick = 20
    a(b, "a").shield = 44
    a(b, "a").shieldExpiresAtTick = 20
    b = ult(b)
    expect(ev(b, "ultimate", "shield").map((e) => e.amount)).toEqual([1, 31])
    expect(a(b, "a").shield).toBe(45)
    expect(a(b, "c").shield).toBe(31)
    expect(a(b).shield).toBe(0)
  })
  it("full-cap ward recipients consume allocation without extending existing expiry", () => {
    let b = start()
    a(b).shield = 63
    a(b).shieldExpiresAtTick = 20
    a(b, "a").shield = 90
    a(b, "a").shieldExpiresAtTick = 20
    b = ult(b)
    expect(ev(b, "ultimate", "shield")).toHaveLength(0)
    expect(a(b, "a").shieldExpiresAtTick).toBe(20)
    expect(a(b).shield).toBe(0)
  })
  it("no nearby ally or zero personal shield creates no invented protection", () => {
    let b = shell(start({}, []))
    b = ult(b)
    expect(a(b).shield).toBe(0)
    expect(ev(b, "ultimate", "shield")).toHaveLength(0)
    b = ult(start())
    expect(ev(b, "ultimate", "shield")).toHaveLength(0)
    expect(ev(b, "ultimate", "hit")).toHaveLength(1)
  })
  it("ultimate snapshots remaining shield at commit, not at request", () => {
    let b = castCombatUltimate(shell(), "b")
    b = hit(b, 10)
    b = advanceCombatBattle(b)
    expect(ev(b, "ultimate", "status")[0].amount).toBe(53)
    expect(ev(b, "ultimate", "shield")[0].amount).toBe(53)
  })
  it("ultimate interruption preserves personal shield but energy stays spent", () => {
    let b = castCombatUltimate(shell(), "b")
    b = interruptCombatCast(b, "b")
    expect(a(b).shield).toBe(63)
    expect(a(b).energy).toBe(0)
    b = advanceCombatBattle(b, 2)
    expect(ev(b, "ultimate", "shield")).toHaveLength(0)
    expect(ev(b, "ultimate", "hit")).toHaveLength(0)
  })
  it("front impact follows locked facing with at most three current near opponents", () => {
    let b = start(
      {},
      [],
      [
        seed("e", "enemy", 16),
        seed("c", "enemy", 18),
        seed("d", "enemy", 20),
        seed("f", "enemy", 21),
        seed("behind", "enemy", 0),
      ],
    )
    b = castCombatUltimate(b, "b")
    a(b, "e").position = 5
    b = advanceCombatBattle(b, 2)
    expect(ev(b, "ultimate", "hit").map((e) => e.targetIds[0])).toEqual([
      "c",
      "d",
      "f",
    ])
  })
  it("ultimate supports allies without requiring a front opponent or chasing a target", () => {
    const b = ult(shell(start({}, undefined, [seed("e", "enemy", 90)])))
    expect(ev(b, "ultimate", "hit")).toHaveLength(0)
    expect(ev(b, "ultimate", "shield")[0].amount).toBe(63)
    expect(ev(b, "ultimate", "miss")).toHaveLength(1)
  })
  it("boss protection only loses heavy basic charges, not ultimate bypass damage", () => {
    let b = start(
      { nextBasicTick: 1 },
      [],
      [
        seed("e", "aw2-enemy-forgotten-host", 16, {
          hp: 1000,
          maxHp: 1000,
          boss: true,
          bossProfile: "aw2-forgotten-host-development-v2",
          nextAutoTick: 10000,
        }),
      ],
    )
    a(b, "e").bossKit!.nextSkillTick = 10000
    a(b, "e").bossKit!.barrierHits = 4
    a(b, "e").bossKit!.barrierExpiresAtTick = 20
    b = advanceCombatBattle(b, 2)
    expect(ev(b, "basic", "hit")[0].amount).toBe(0)
    expect(a(b, "e").bossKit!.barrierHits).toBe(3)
    b = ult(b)
    expect(ev(b, "ultimate", "hit")[0].amount).toBe(0)
    expect(a(b, "e").bossKit!.barrierHits).toBe(3)
  })
  it("ult release and ordinary shield removal/expiry cannot feed passive meter", () => {
    let b = shell()
    a(b).bachGuarded = 29
    b = ult(b)
    expect(a(b).bachGuarded).toBe(0)
    expect(ev(b, "passive", "shield")).toHaveLength(0)
  })
  it("Muối's ordinary-shield dispel cannot count as absorbed damage", () => {
    let b = shell(
      start(
        {},
        [],
        [seed("e", "aw2-muoi", 16, { hp: 1000, maxHp: 1000, attack: 1 })],
      ),
    )
    a(b, "e").cast = {
      id: "enemy-disperse",
      sourceId: "e",
      skillId: "aw2-muoi:skill:ultimate",
      slot: "ultimate",
      targetId: "b",
      commitTick: b.tick + 1,
    }
    b = advanceCombatBattle(b)
    expect(a(b).shield).toBe(31)
    expect(a(b).bachGuarded).toBe(1)
    expect(ev(b, "passive", "shield")).toHaveLength(0)
  })
  it("a shield received from an ally can absorb real damage without grant-time credit", () => {
    let b = start()
    const serial = ++b.actionSerial
    b.effects.push({
      id: `effect:${serial}`,
      serial,
      sourceId: "a",
      targetId: "b",
      skillId: "aw2-than:skill:ultimate",
      kind: "shield",
      amount: 50,
      resolveTick: 1,
    })
    b = advanceCombatBattle(b)
    expect(a(b).bachGuarded ?? 0).toBe(0)
    b = hit(b, 30)
    expect(a(b, "a").shield).toBe(20)
  })
  it("one passive share cannot recursively trigger another Bách from a shield grant", () => {
    let b = shell(start({}, [seed("c", "aw2-bach", 14)]))
    b = hit(b, 30)
    expect(a(b, "c").shield).toBe(20)
    expect(a(b, "c").bachGuarded ?? 0).toBe(0)
    expect(ev(b, "passive", "shield")).toHaveLength(1)
  })
  it("ult uses living nearby recipients at commit and drops the departed allocation", () => {
    let b = castCombatUltimate(
      shell(start({}, [seed("a", "aw2-lua", 14), seed("c", "aw2-lam", 18)])),
      "b",
    )
    a(b, "a").position = 50
    b = advanceCombatBattle(b, 2)
    expect(ev(b, "ultimate", "shield").map((e) => e.targetIds[0])).toEqual([
      "c",
    ])
    expect(a(b, "c").shield).toBe(63)
  })
  it("ult shield expires without giving energy or another absorption proc", () => {
    let b = ult(shell())
    const energy = a(b).energy
    b = advanceCombatBattle(b, 5)
    expect(a(b, "a").shield).toBe(0)
    expect(a(b).energy).toBe(energy)
    expect(ev(b, "passive", "shield")).toHaveLength(0)
  })
  it("same-tick heavy anticipation cannot erase the confirmed ultimate gesture", () => {
    let b = shell()
    a(b).nextBasicTick = 4
    b = ult(b)
    expect(a(b).bachStrike).toBeDefined()
    const p = reduceCombatPresentation(createCombatPresentation(), b.events)
    expect(p.actors.b.skillId).toBe("aw2-bach:skill:ultimate")
    expect(p.actors.b.phase).toBe("confirmed")
  })
  it("source death during ult anticipation preserves no future shield or impact", () => {
    let b = castCombatUltimate(shell(), "b")
    b = hit(b, 10000)
    b = advanceCombatBattle(b, 2)
    expect(a(b).hp).toBe(0)
    expect(ev(b, "ultimate", "shield")).toHaveLength(0)
    expect(ev(b, "ultimate", "hit")).toHaveLength(0)
  })
  it("pure old JSON replay has bounded meter/events and cleans terminal strike", () => {
    const initial = start({ nextBasicTick: 1, nextAutoTick: 3 })
    const raw = JSON.stringify(initial)
    let b = initial
    for (let i = 0; i < 45; i++) {
      const replay = advanceCombatBattle(JSON.parse(JSON.stringify(b)))
      b = advanceCombatBattle(b)
      expect(b).toEqual(replay)
      expect(a(b).bachGuarded ?? 0).toBeLessThanOrEqual(bachThreshold(a(b)))
      expect(b.events.length).toBeLessThanOrEqual(160)
    }
    expect(JSON.stringify(initial)).toBe(raw)
    b = start({ nextBasicTick: 1 })
    b = advanceCombatBattle(b)
    b = hit(b, 100000, "e", "a")
    expect(b.status).toBe("player-win")
    expect(a(b).bachStrike).toBeUndefined()
    expect(advanceCombatBattle(b)).toBe(b)
  })
  it("prepare, interrupted strike and release-only events cannot create FX/audio", () => {
    let b = advanceCombatBattle(start({ nextBasicTick: 1 }))
    let p = reduceCombatPresentation(createCombatPresentation(), b.events)
    expect(p.actors.b.phase).toBe("prepare")
    expect(p.effects.b).toBeUndefined()
    expect(combatAudioCues(b.events, 0)).toHaveLength(0)
    expect(
      sampleActorEffect(ROSTER_ASSETS["aw2-bach"], p.actors.b, 800, false),
    ).toBeNull()
    b = ult(start({}, [], [seed("e", "enemy", 90)]))
    p = reduceCombatPresentation(createCombatPresentation(), b.events)
    expect(p.effects.b).toBeUndefined()
    expect(combatAudioCues(b.events, 0)).toHaveLength(0)
  })
  it("ultimate shield and impact recipients share one gesture/cue across partial batches", () => {
    const b = ult(shell())
    const outcomes = ev(b, "ultimate").filter(
      (e) => e.kind === "shield" || e.kind === "hit",
    )
    expect(outcomes).toHaveLength(2)
    const cut = outcomes[0].serial
    let p = reduceCombatPresentation(
      createCombatPresentation(),
      b.events.filter((e) => e.serial <= cut),
    )
    const serial = p.effects.b.ultimate.serial
    p = reduceCombatPresentation(p, b.events)
    expect(p.effects.b.ultimate.serial).toBe(serial)
    expect(p.effects.b.ultimate.targetIds).toEqual(["a", "e"])
    expect(combatAudioCues(b.events, cut)).toHaveLength(0)
    expect(
      combatAudioCues(b.events, 0).filter((c) => c.slot === "ultimate"),
    ).toHaveLength(1)
    expect(
      sampleConfirmedEffect(
        ROSTER_ASSETS["aw2-bach"],
        undefined,
        p.effects.b.ultimate,
        0,
        false,
      ).effect,
    ).toBeTruthy()
  })
  it("actual heavy impact uses its authored460ms contact, no predicted followup", () => {
    const b = advanceCombatBattle(start({ nextBasicTick: 1 }), 2)
    const p = reduceCombatPresentation(createCombatPresentation(), b.events)
    const fx = sampleConfirmedEffect(
      ROSTER_ASSETS["aw2-bach"],
      undefined,
      p.effects.b.basic,
      0,
      false,
    )
    expect(fx.effect?.cue).toBe(460)
    expect(combatAudioCues(b.events, 0)[0].url).toBe(
      ROSTER_ASSETS["aw2-bach"].skills.basic.audio.url,
    )
  })
  it("a genuine incoming hit stays visible across later own windup while ultimate FX survive", () => {
    let s = createBattlePreviewSession(5, "bach")
    for (let i = 0; i < 14; i++)
      s = reduceBattlePreviewSession(s, { type: "advance", manual: true })
    s = reduceBattlePreviewSession(s, {
      type: "ultimate",
      actorId: "player-aw2-bach",
    })
    for (let i = 0; i < 2; i++)
      s = reduceBattlePreviewSession(s, { type: "advance", manual: true })
    expect(a(s.battle, "player-aw2-bach").bachStrike).toBeDefined()
    expect(s.presentation.actors["player-aw2-bach"].state).toBe("hit")
    expect(
      s.presentation.effects["player-aw2-bach"].ultimate.targetIds,
    ).toHaveLength(5)
    expect(s.presentation.effects["player-aw2-bach"].ultimate.tick).toBe(16)
  })
  it("isolated practice keeps five units, supports real interrupt and level reset", () => {
    let s = createBattlePreviewSession(5, "bach")
    expect(
      s.battle.actors.filter((a) => a.side === "player").map((a) => a.spiritId),
    ).toEqual(["aw2-bach", "aw2-lua", "aw2-lam", "aw2-moc-non", "aw2-suong"])
    s = reduceBattlePreviewSession(s, {
      type: "ultimate",
      actorId: "player-aw2-bach",
    })
    expect(a(s.battle, "player-aw2-bach").cast?.slot).toBe("ultimate")
    s = reduceBattlePreviewSession(s, { type: "interrupt-bach" })
    expect(a(s.battle, "player-aw2-bach").cast).toBeNull()
    s = reduceBattlePreviewSession(s, { type: "reset", level: 20 })
    expect(s.practice).toBe("bach")
    expect(a(s.battle, "player-aw2-bach").maxHp).toBe(511)
    expect(
      reduceBattlePreviewSession(createBattlePreviewSession(5), {
        type: "interrupt-bach",
      }).message,
    ).toContain("chỉ có")
  })
})
