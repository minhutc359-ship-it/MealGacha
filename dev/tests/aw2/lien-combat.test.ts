import { describe, expect, it } from "vitest"
import {
  COMBAT_KITS,
  STARTER_SPIRIT_IDS,
  LIEN_TUNING,
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
import { ROSTER_ASSETS } from "@/aw2/assets/roster"
import {
  sampleActorPlayback,
  sampleConfirmedEffect,
} from "@/aw2/assets/playback"
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
): CombatUnitSeed => ({ id, spiritId, position, ...quiet, ...extra })
const initial = (
  extra: Partial<CombatUnitSeed> = {},
  allies: CombatUnitSeed[] = [
    seed("a", "aw2-than", 12, { hp: 10, maxHp: 500 }),
  ],
) =>
  createCombatBattle({
    id: "lien-contract",
    players: [seed("l", "aw2-lien", 10, { energy: 100, ...extra }), ...allies],
    enemies: [
      seed("e", "test-enemy", 30, { hp: 10000, maxHp: 10000, defense: 0 }),
    ],
  })
const actor = (b: CombatBattle, id = "l") => b.actors.find((a) => a.id === id)!
const events = (b: CombatBattle, slot: string, kind?: string) =>
  b.events.filter(
    (e) => e.skillId === `aw2-lien:skill:${slot}` && (!kind || e.kind === kind),
  )
const healing = (b: CombatBattle, slot = "auto") => events(b, slot, "heal")
const guard = (b: CombatBattle) =>
  events(b, "passive").filter((e) => e.statusEffect === "lien-guard")
const ultimate = (b = initial()) =>
  advanceCombatBattle(castCombatUltimate(b, "l"), 2)
function queuedDamage(b: CombatBattle, targetId: string, amount: number) {
  const serial = ++b.actionSerial
  b.effects.push({
    id: `effect:${serial}`,
    serial,
    sourceId: "e",
    targetId,
    amount,
    kind: "damage",
    skillId: "test-enemy:skill:basic",
    resolveTick: b.tick + 1,
  })
  return advanceCombatBattle(b)
}
function mark(b: CombatBattle, id = "a", source = "e", expires = 30) {
  const a = actor(b, id)
  a.muoiMarks = {
    ...a.muoiMarks,
    [source]: { appliedTick: 0, expiresAtTick: expires, capTick: 40 },
  }
}

describe("AW2-007H Liên finite healing and selective cleanse", () => {
  it("retains its actual kit and projects levels without starter/save ownership", () => {
    expect(COMBAT_KITS).toHaveProperty("aw2-lien")
    expect(STARTER_SPIRIT_IDS).toHaveLength(5)
    expect(STARTER_SPIRIT_IDS).not.toContain("aw2-lien")
    for (const level of [1, 5, 10, 20]) {
      const s = createDevelopmentCombatSeed(
        "l",
        "aw2-lien",
        experienceToReachLevel(level),
      )
      expect(s.maxHp).toBe(Math.round(145 * (1 + (level - 1) * 0.055)))
      expect(s.attack).toBe(Math.round(28 * (1 + (level - 1) * 0.04)))
    }
    expect(() => initial({ spiritId: "aw2-unknown" })).toThrow(
      "chưa có combat kit",
    )
  })
  it("basic launches one projectile, confirms later and never heals", () => {
    const start = initial({ nextBasicTick: 1 })
    const launch = advanceCombatBattle(start)
    expect(events(launch, "basic", "projectile-launch")).toHaveLength(1)
    expect(events(launch, "basic", "hit")).toHaveLength(0)
    const hit = advanceCombatBattle(launch, 2)
    expect(events(hit, "basic", "hit")).toHaveLength(1)
    expect(hit.events.some((e) => e.kind === "heal")).toBe(false)
    expect(guard(hit)).toHaveLength(0)
    expect(start.tick).toBe(0)
  })
  it("launched basic misses dead target instead of retarget or healing", () => {
    let b = advanceCombatBattle(initial({ nextBasicTick: 1 }))
    b.actors.push({ ...actor(b, "e"), id: "other", slot: 1 })
    actor(b, "e").hp = 0
    b = advanceCombatBattle(b, 2)
    expect(events(b, "basic", "miss")).toHaveLength(1)
    expect(actor(b, "other").hp).toBe(10000)
    expect(healing(b)).toHaveLength(0)
  })
  it("full team skips auto without paying cooldown", () => {
    const b = advanceCombatBattle(initial({ nextAutoTick: 1 }, []))
    expect(actor(b).cast).toBeNull()
    expect(actor(b).nextAutoTick).toBe(1)
  })
  it("auto selects lowestHP ratio before distance with deterministic ties", () => {
    const b = advanceCombatBattle(
      initial({ nextAutoTick: 1 }, [
        seed("a", "aw2-than", 11, { hp: 100, maxHp: 200 }),
        seed("b", "aw2-lua", 90, { hp: 10, maxHp: 100 }),
      ]),
    )
    expect(actor(b).cast?.targetId).toBe("b")
    const tied = advanceCombatBattle(
      initial({ nextAutoTick: 1 }, [
        seed("a", "aw2-than", 30, { hp: 10, maxHp: 100 }),
        seed("b", "aw2-lua", 12, { hp: 10, maxHp: 100 }),
      ]),
    )
    expect(actor(tied).cast?.targetId).toBe("b")
  })
  it("commit falls back only if preferred ally is no longer injured/alive", () => {
    let b = advanceCombatBattle(
      initial({ nextAutoTick: 1 }, [
        seed("a", "aw2-than", 12, { hp: 10, maxHp: 500 }),
        seed("b", "aw2-lua", 20, { hp: 50, maxHp: 200 }),
      ]),
    )
    actor(b, "a").hp = 500
    b = advanceCombatBattle(b)
    expect(actor(b).lienHoT?.targetId).toBe("b")
    expect(healing(b)[0].targetIds).toEqual(["b"])
  })
  it("failed auto commit spends original cooldown and creates no future promise", () => {
    let b = advanceCombatBattle(initial({ nextAutoTick: 1 }))
    actor(b, "a").hp = 500
    b = advanceCombatBattle(b)
    expect(actor(b).lienHoT).toBeUndefined()
    expect(events(b, "auto", "miss")).toHaveLength(1)
    expect(actor(b).nextAutoTick).toBe(11)
  })
  it("auto has exactly three finite pulses at commit/2/4 and no refresh", () => {
    let b = advanceCombatBattle(initial({ nextAutoTick: 1 }), 2)
    expect(healing(b).map((e) => [e.tick, e.amount])).toEqual([[2, 21]])
    const id = actor(b).lienHoT!.id
    actor(b).nextAutoTick = 1
    b = advanceCombatBattle(b, 3)
    expect(actor(b).lienHoT?.id).toBe(id)
    expect(events(b, "auto", "cast-start")).toHaveLength(1)
    b = advanceCombatBattle(b)
    expect(healing(b).map((e) => e.tick)).toEqual([2, 4, 6])
    expect(new Set(healing(b).map((e) => e.actionId))).toEqual(new Set([id]))
  })
  it("full-HP pulses heal0 without extending schedule, overheal shield or proc", () => {
    let b = advanceCombatBattle(
      initial({ nextAutoTick: 1 }, [
        seed("a", "aw2-than", 12, { hp: 95, maxHp: 100 }),
      ]),
      6,
    )
    expect(healing(b).map((e) => e.amount)).toEqual([5, 0, 0])
    expect(actor(b, "a").hp).toBe(100)
    expect(actor(b, "a").shield).toBe(0)
    expect(actor(b).lienHoT).toBeUndefined()
    expect(guard(b)).toHaveLength(0)
    expect(
      combatAudioCues(b.events, 0).filter((c) => c.slot === "auto"),
    ).toHaveLength(1)
  })
  it("recipient death cancels HoT without revival or changing recipient", () => {
    let b = advanceCombatBattle(initial({ nextAutoTick: 1 }), 2)
    b = queuedDamage(b, "a", 10000)
    b = advanceCombatBattle(b, 4)
    expect(actor(b, "a").hp).toBe(0)
    expect(actor(b).lienHoT).toBeUndefined()
    expect(healing(b)).toHaveLength(1)
  })
  it("source death cancels all committed healing before due heal can save her", () => {
    let b = advanceCombatBattle(initial({ nextAutoTick: 1 }), 2)
    b = castCombatUltimate(b, "l")
    b = queuedDamage(b, "l", 10000)
    b = advanceCombatBattle(b, 4)
    expect(actor(b).hp).toBe(0)
    expect(actor(b).lienHoT).toBeUndefined()
    expect(actor(b).lienUltimate).toBeUndefined()
    expect(healing(b)).toHaveLength(1)
    expect(healing(b, "ultimate")).toHaveLength(0)
  })
  it("interrupted anticipation gives no future heals or refund", () => {
    let b = interruptCombatCast(castCombatUltimate(initial(), "l"), "l")
    b = advanceCombatBattle(b, 5)
    expect(actor(b).energy).toBe(0)
    expect(healing(b, "ultimate")).toHaveLength(0)
    expect(combatAudioCues(b.events, 0)).toEqual([])
  })
  it("source death after first ultimate pulse cannot promise a second effect", () => {
    let b = ultimate()
    const first = reduceCombatPresentation(createCombatPresentation(), b.events)
    const serial = first.effects.l.ultimate.serial
    b = queuedDamage(b, "l", 10000)
    b = advanceCombatBattle(b, 3)
    expect(healing(b, "ultimate").some((e) => e.contactIndex === 1)).toBe(false)
    const view = reduceCombatPresentation(first, b.events)
    expect(view.effects.l.ultimate.serial).toBe(serial)
    expect(view.actors.l.state).toBe("defeat")
    expect(
      combatAudioCues(b.events, 0).filter((c) => c.slot === "ultimate"),
    ).toHaveLength(1)
  })
  it("auto interruption produces no HoT and keeps its cooldown", () => {
    let b = advanceCombatBattle(initial({ nextAutoTick: 1 }))
    b = interruptCombatCast(b, "l")
    b = advanceCombatBattle(b, 5)
    expect(actor(b).lienHoT).toBeUndefined()
    expect(healing(b)).toHaveLength(0)
    expect(actor(b).nextAutoTick).toBe(11)
  })
  it("interrupting later cast preserves an already committed finite HoT", () => {
    let b = advanceCombatBattle(initial({ nextAutoTick: 1 }), 2)
    b = interruptCombatCast(castCombatUltimate(b, "l"), "l")
    b = advanceCombatBattle(b, 4)
    expect(healing(b).map((e) => e.tick)).toEqual([2, 4, 6])
    expect(healing(b, "ultimate")).toHaveLength(0)
  })
  it("ultimate cleanses once then heals in exactly two indexed pulses", () => {
    let b = initial()
    actor(b, "a").slowUntilTick = 20
    actor(b, "a").weakenUntilTick = 20
    b = ultimate(b)
    expect(actor(b, "a").slowUntilTick).toBe(0)
    expect(actor(b, "a").weakenUntilTick).toBe(20)
    expect(
      healing(b, "ultimate").map((e) => [e.contactIndex, e.amount]),
    ).toEqual([
      [0, 0],
      [0, 33],
    ])
    b = advanceCombatBattle(b, 2)
    expect(
      healing(b, "ultimate")
        .filter((e) => e.targetIds[0] === "a")
        .map((e) => [e.tick, e.contactIndex, e.amount]),
    ).toEqual([
      [2, 0, 33],
      [4, 1, 26],
    ])
    expect(
      events(b, "ultimate").filter((e) => e.statusEffect === "lien-cleanse"),
    ).toHaveLength(1)
    expect(actor(b).lienUltimate).toBeUndefined()
  })
  it("cannot recast while ultimate pulse remains pending even with100energy", () => {
    let b = ultimate()
    actor(b).energy = 100
    expect(() => castCombatUltimate(b, "l")).toThrow("hoàn tất nhịp")
    expect(actor(b).energy).toBe(100)
    b = advanceCombatBattle(b, 2)
    expect(() => castCombatUltimate(b, "l")).not.toThrow()
  })
  it("cleanse chooses one earliest mark before slow/weaken and does not strip shields or guards", () => {
    let b = initial()
    b.actors.push({ ...actor(b, "e"), id: "e2", slot: 1 })
    mark(b, "a", "e", 20)
    mark(b, "a", "e2", 15)
    Object.assign(actor(b, "a"), {
      slowUntilTick: 30,
      weakenUntilTick: 30,
      shield: 30,
      shieldExpiresAtTick: 30,
      interruptGuardCharges: 1,
      interruptGuardUntilTick: 30,
    })
    b = ultimate(b)
    expect(Object.keys(actor(b, "a").muoiMarks!)).toEqual(["e"])
    expect(actor(b, "a").slowUntilTick).toBe(30)
    expect(actor(b, "a").weakenUntilTick).toBe(30)
    expect(actor(b, "a").shield).toBe(30)
    expect(actor(b, "a").interruptGuardUntilTick).toBe(30)
    expect(guard(b)).toHaveLength(0)
  })
  it("last equal-expiry mark uses sourceID tie and expired instances are ignored", () => {
    let b = initial()
    b.actors.push({ ...actor(b, "e"), id: "aa", slot: 1 })
    mark(b, "a", "e", 20)
    mark(b, "a", "aa", 20)
    b = ultimate(b)
    expect(Object.keys(actor(b, "a").muoiMarks!)).toEqual(["e"])
    b = initial()
    mark(b, "a", "e", 1)
    actor(b, "a").weakenUntilTick = 20
    b = ultimate(b)
    expect(
      events(b, "ultimate").find((e) => e.statusEffect === "lien-cleanse")
        ?.cleansedEffect,
    ).toBe("weaken")
  })
  it("cleanse permits ordinary debuffs only and never reaches enemy boss conditions", () => {
    let b = initial()
    actor(b, "a").controlImmune = true
    actor(b, "a").slowUntilTick = 20
    const enemy = actor(b, "e")
    enemy.slowUntilTick = 40
    enemy.shield = 30
    enemy.shieldExpiresAtTick = 50
    enemy.bossKit = {
      profile: "aw2-forgotten-host-development-v2",
      nextSkillTick: 10000,
      phase: 0,
      barrierHits: 4,
      barrierExpiresAtTick: 50,
      intent: null,
    }
    b = ultimate(b)
    expect(actor(b, "a").slowUntilTick).toBe(0)
    expect(actor(b, "e").bossKit!.barrierHits).toBe(4)
    expect(actor(b, "e").shield).toBe(30)
    expect(actor(b, "e").slowUntilTick).toBe(40)
  })
  it("cleanse alone at fullHP is a real outcome but never a passive heal proc", () => {
    let b = initial({}, [seed("a", "aw2-than", 12)])
    actor(b, "a").slowUntilTick = 30
    b = ultimate(b)
    expect(guard(b)).toHaveLength(0)
    expect(
      combatAudioCues(b.events, 0).filter((c) => c.slot === "ultimate"),
    ).toHaveLength(1)
    const v = reduceCombatPresentation(createCombatPresentation(), b.events)
    expect(v.effects.l.ultimate.targetIds).toEqual(["a"])
  })
  it("cleansed sole debuff disappears before healing, so no incompatible passive", () => {
    let b = initial()
    actor(b, "a").slowUntilTick = 30
    b = ultimate(b)
    expect(guard(b)).toHaveLength(0)
    expect(actor(b, "a").interruptGuardCharges).toBe(0)
  })
  it.each(["slow", "weaken", "muoi-mark"])(
    "positive HoT healing on %s grants one4tick guard",
    (kind) => {
      let b = initial({ nextAutoTick: 1 })
      if (kind === "muoi-mark") mark(b)
      else if (kind === "slow") actor(b, "a").slowUntilTick = 30
      else actor(b, "a").weakenUntilTick = 30
      b = advanceCombatBattle(b, 2)
      expect(actor(b, "a").interruptGuardCharges).toBe(1)
      expect(actor(b, "a").interruptGuardUntilTick).toBe(6)
      expect(actor(b).lienGuardCooldowns).toEqual({ a: 10 })
      expect(guard(b)).toHaveLength(1)
    },
  )
  it("remaining compatible debuff after one cleanse may trigger passive", () => {
    let b = initial()
    Object.assign(actor(b, "a"), { slowUntilTick: 30, weakenUntilTick: 30 })
    b = ultimate(b)
    expect(guard(b)).toHaveLength(1)
    expect(actor(b, "a").interruptGuardCharges).toBe(1)
  })
  it("never refreshes/extends own guard and respects per-recipient cooldown after consumption", () => {
    let b = initial({ nextAutoTick: 1 })
    actor(b, "a").slowUntilTick = 50
    b = advanceCombatBattle(b, 2)
    actor(b, "a").cast = {
      id: "a-cast",
      sourceId: "a",
      skillId: "aw2-than:skill:ultimate",
      slot: "ultimate",
      targetId: null,
      commitTick: 100,
    }
    b = interruptCombatCast(b, "a")
    expect(actor(b, "a").cast).not.toBeNull()
    expect(actor(b, "a").interruptGuardCharges).toBe(0)
    b = advanceCombatBattle(b, 4)
    expect(guard(b)).toHaveLength(1)
    b = interruptCombatCast(b, "a")
    expect(actor(b, "a").cast).toBeNull()
    b = advanceCombatBattle(b, 6)
    expect(guard(b)).toHaveLength(2)
  })
  it("existing Mộc Non interrupt guard is not stacked or refreshed", () => {
    let b = initial({ nextAutoTick: 1 })
    actor(b, "a").slowUntilTick = 30
    Object.assign(actor(b, "a"), {
      interruptGuardCharges: 1,
      interruptGuardUntilTick: 10,
    })
    b = advanceCombatBattle(b, 6)
    expect(guard(b)).toHaveLength(0)
    expect(actor(b, "a").interruptGuardUntilTick).toBe(10)
    expect(actor(b).lienGuardCooldowns).toBeUndefined()
  })
  it("two Liên sources keep independent HoTs but cannot stack one recipient guard", () => {
    let b = initial({ nextAutoTick: 1 }, [
      seed("a", "aw2-than", 12, { hp: 10, maxHp: 500 }),
      seed("l2", "aw2-lien", 14, { nextAutoTick: 1 }),
    ])
    actor(b, "a").slowUntilTick = 30
    b = advanceCombatBattle(b, 2)
    expect(healing(b)).toHaveLength(2)
    expect(actor(b).lienHoT).toBeDefined()
    expect(actor(b, "l2").lienHoT).toBeDefined()
    expect(guard(b)).toHaveLength(1)
    expect(actor(b, "a").interruptGuardCharges).toBe(1)
    expect(actor(b, "l2").lienGuardCooldowns).toBeUndefined()
  })
  it("ultimate snapshots alive recipients and never revives a dead one for pulse1", () => {
    let b = ultimate()
    b = queuedDamage(b, "a", 10000)
    b = advanceCombatBattle(b)
    expect(actor(b, "a").hp).toBe(0)
    expect(
      healing(b, "ultimate").filter((e) => e.targetIds[0] === "a"),
    ).toHaveLength(1)
    expect(events(b, "ultimate", "miss")).toHaveLength(1)
  })
  it("ultimate and HoT keep independent finite schedules and one target each before group heals", () => {
    let b = advanceCombatBattle(initial({ nextAutoTick: 1 }), 2)
    b = advanceCombatBattle(castCombatUltimate(b, "l"), 4)
    expect(healing(b).map((e) => e.tick)).toEqual([2, 4, 6])
    expect(
      healing(b, "ultimate")
        .filter((e) => e.targetIds[0] === "a")
        .map((e) => e.tick),
    ).toEqual([4, 6])
    expect(actor(b).lienHoT).toBeUndefined()
    expect(actor(b).lienUltimate).toBeUndefined()
  })
  it("JSON replay preserves pending HoT/ultimate/passive cooldown state", () => {
    let b = initial({ nextAutoTick: 1 })
    actor(b, "a").slowUntilTick = 50
    b = advanceCombatBattle(b, 2)
    b = advanceCombatBattle(castCombatUltimate(b, "l"), 2)
    expect(advanceCombatBattle(JSON.parse(JSON.stringify(b)), 6)).toEqual(
      advanceCombatBattle(b, 6),
    )
  })
  it("terminal cancels all pending healing and later advance is an identity no-op", () => {
    let b = advanceCombatBattle(initial({ nextAutoTick: 1 }), 2)
    b = castCombatUltimate(b, "l")
    actor(b, "e").hp = 1
    actor(b, "a").nextBasicTick = 3
    actor(b, "a").range = 100
    actor(b, "a").projectileTicks = 0
    b = advanceCombatBattle(b)
    expect(b.status).toBe("player-win")
    expect(actor(b).lienHoT).toBeUndefined()
    expect(actor(b).lienUltimate).toBeUndefined()
    expect(advanceCombatBattle(b)).toBe(b)
  })
  it("groups partial cleanse/heal recipients per pulse without restarting FX/audio", () => {
    let b = initial({}, [
      seed("a", "aw2-than", 12, { hp: 10, maxHp: 500 }),
      seed("b", "aw2-lua", 14, { hp: 10, maxHp: 500 }),
    ])
    actor(b, "a").slowUntilTick = 30
    actor(b, "b").slowUntilTick = 30
    b = ultimate(b)
    const first = b.events.find((e) => e.statusEffect === "lien-cleanse")!
    let v = reduceCombatPresentation(
      createCombatPresentation(),
      b.events.filter((e) => e.serial <= first.serial),
    )
    const serial = v.effects.l.ultimate.serial
    v = reduceCombatPresentation(v, b.events)
    expect(v.effects.l.ultimate.serial).toBe(serial)
    expect(v.effects.l.ultimate.targetIds).toEqual(["a", "b"])
    expect(
      combatAudioCues(b.events, 0).filter((c) => c.slot === "ultimate"),
    ).toHaveLength(1)
    expect(
      combatAudioCues(b.events, first.serial).filter(
        (c) => c.slot === "ultimate",
      ),
    ).toHaveLength(0)
    expect(reduceCombatPresentation(v, b.events)).toBe(v)
    b = advanceCombatBattle(b, 2)
    v = reduceCombatPresentation(v, b.events)
    expect(v.effects.l.ultimate.index).toBe(1)
    expect(v.effects.l.ultimate.serial).not.toBe(serial)
    expect(
      combatAudioCues(b.events, 0).filter((c) => c.slot === "ultimate"),
    ).toHaveLength(2)
  })
  it("own projectile flight and finite confirmed FX obey pause-independent clocks/reduced mode", () => {
    let b = advanceCombatBattle(initial({ nextBasicTick: 1 }))
    let v = reduceCombatPresentation(createCombatPresentation(), b.events)
    expect(v.actors.l.phase).toBe("launch")
    expect(v.effects.l).toBeUndefined()
    b = advanceCombatBattle(b, 2)
    v = reduceCombatPresentation(v, b.events)
    const m = ROSTER_ASSETS["aw2-lien"],
      cue = v.effects.l.basic
    const first = sampleConfirmedEffect(m, undefined, cue, 0, true)
    expect(first.effect?.frame).toMatch(/^fx.basic.[23]$/)
    expect(
      sampleConfirmedEffect(m, first.clock, cue, 1000, true).effect,
    ).toBeNull()
    const view = sampleActorPlayback(m, undefined, v.actors.l, false, 0, false)
    expect(view.pose.frame).toMatch(/^battle.attack./)
  })
  it("fullHP second pulse cannot invent an ultimate contact or its future pose", () => {
    let b = initial({}, [seed("a", "aw2-than", 12, { hp: 99, maxHp: 100 })])
    b = ultimate(b)
    let v = reduceCombatPresentation(createCombatPresentation(), b.events)
    const serial = v.effects.l.ultimate.serial
    b = advanceCombatBattle(b, 2)
    v = reduceCombatPresentation(v, b.events)
    expect(v.effects.l.ultimate.index).toBe(0)
    expect(v.effects.l.ultimate.serial).toBe(serial)
    expect(
      combatAudioCues(b.events, 0).filter((c) => c.slot === "ultimate"),
    ).toHaveLength(1)
  })
  it("practice is max5, resettable and real interrupt is restricted to allied actors in own preset", () => {
    let s = createBattlePreviewSession(5, "lien")
    expect(
      s.battle.actors.filter((a) => a.side === "player").map((a) => a.spiritId),
    ).toEqual(["aw2-than", "aw2-lua", "aw2-lien", "aw2-moc-non", "aw2-suong"])
    expect(s.battle.actors.find((a) => a.id === "enemy-suong")?.spiritId).toBe(
      "aw2-muoi",
    )
    s = reduceBattlePreviewSession(s, {
      type: "ultimate",
      actorId: "player-aw2-lien",
    })
    s = reduceBattlePreviewSession(s, {
      type: "interrupt-lien-target",
      actorId: "player-aw2-lien",
    })
    expect(actor(s.battle, "player-aw2-lien").energy).toBe(0)
    expect(actor(s.battle, "player-aw2-lien").cast).toBeNull()
    const invalid = reduceBattlePreviewSession(s, {
      type: "interrupt-lien-target",
      actorId: "enemy-than",
    })
    expect(invalid.battle).toBe(s.battle)
    s = reduceBattlePreviewSession(s, { type: "reset", level: 20 })
    expect(s.practice).toBe("lien")
    expect(s.level).toBe(20)
    expect(createBattlePreviewSession(5).battle.actors[2].spiritId).toBe(
      "aw2-lam",
    )
  })
})
