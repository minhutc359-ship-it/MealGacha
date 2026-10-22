import { describe, expect, it } from "vitest"
import {
  COMBAT_KITS,
  STARTER_SPIRIT_IDS,
  NHIEN_TUNING,
  createCombatBattle,
  advanceCombatBattle,
  castCombatUltimate,
  interruptCombatCast,
  createDevelopmentCombatSeed,
  developmentCombatStats,
  experienceToReachLevel,
  nhienBusy,
  createCombatPresentation,
  reduceCombatPresentation,
  type CombatBattle,
  type CombatUnitSeed,
} from "@/aw2/combat"
import { createForgottenHostSeed } from "@/aw2/combat/forgottenHost"
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
const foe = (
  id: string,
  extra: Partial<CombatUnitSeed> = {},
): CombatUnitSeed => ({
  id,
  spiritId: "aw2-enemy-test",
  hp: 10000,
  maxHp: 10000,
  defense: 0,
  position: 17,
  ...quiet,
  ...extra,
})
const initial = (extra: Partial<CombatUnitSeed> = {}, enemies = [foe("a")]) =>
  createCombatBattle({
    id: "nhien-contract",
    players: [
      {
        id: "n",
        spiritId: "aw2-nhien",
        position: 10,
        energy: 100,
        ...quiet,
        ...extra,
      },
    ],
    enemies,
  })
const actor = (b: CombatBattle, id = "n") => b.actors.find((a) => a.id === id)!
const events = (b: CombatBattle, slot: string, kind?: string) =>
  b.events.filter(
    (e) =>
      e.skillId === `aw2-nhien:skill:${slot}` && (!kind || e.kind === kind),
  )
const hits = (b: CombatBattle, slot: string) => events(b, slot, "hit")
const gains = (b: CombatBattle) =>
  events(b, "passive").filter((e) => e.statusEffect === "nhien-energy")
const multi = () => [
  foe("a", { position: 15 }),
  foe("b", { position: 16 }),
  foe("c", { position: 17 }),
]

describe("AW2-007F bounded Nhiên melee and energy", () => {
  it("supports seventh explicit kit/level1–20 while five starters and unknown rejection remain fixed", () => {
    expect(STARTER_SPIRIT_IDS).toHaveLength(5)
    expect(COMBAT_KITS["aw2-nhien"].projectileTicks).toBe(0)
    for (const level of [1, 5, 10, 20]) {
      const seed = createDevelopmentCombatSeed(
        "n",
        "aw2-nhien",
        experienceToReachLevel(level),
      )
      expect(seed.attack).toBe(
        developmentCombatStats("aw2-nhien", level).attack,
      )
      expect(seed.maxHp).toBeGreaterThanOrEqual(170)
    }
    expect(() =>
      createCombatBattle({
        id: "future",
        players: [{ id: "h", spiritId: "aw2-hai" }],
        enemies: [foe("a")],
      }),
    ).toThrow(/chưa có combat kit/)
  })
  it("winds up basic, resolves exactly two real contacts and reserves two full recovery ticks", () => {
    const start = advanceCombatBattle(initial({ nextBasicTick: 1 }), 1)
    expect(hits(start, "basic")).toHaveLength(0)
    expect(actor(start).nhienSequence?.nextIndex).toBe(0)
    const done = advanceCombatBattle(start, 2)
    expect(hits(done, "basic").map((e) => [e.tick, e.contactIndex])).toEqual([
      [2, 0],
      [3, 1],
    ])
    expect(new Set(hits(done, "basic").map((e) => e.actionId)).size).toBe(1)
    expect(done.events.some((e) => e.kind === "projectile-launch")).toBe(false)
    expect(actor(done).nhienSequence).toBeUndefined()
    expect(actor(done).nhienRecoveryUntilTick).toBe(6)
    for (const tick of [4, 5]) {
      const b = advanceCombatBattle(done, tick - 3)
      expect(nhienBusy(actor(b), b.tick)).toBe(true)
      expect(() => castCombatUltimate(b, "n", "a")).toThrow(/hồi thế/)
      expect(hits(b, "basic")).toHaveLength(2)
    }
    const ready = advanceCombatBattle(done, 3)
    // At6 the next automatic basic may start, never before the reserved ticks4/5.
    expect(events(ready, "basic", "cast-start").map((e) => e.tick)).toEqual([
      1, 6,
    ])
  })
  it.each([1, 2])(
    "interrupts basic at tick%s without replaying a future contact",
    (tick) => {
      const before = advanceCombatBattle(initial({ nextBasicTick: 1 }), tick)
      const interrupted = interruptCombatCast(before, "n")
      const after = advanceCombatBattle(interrupted, 2)
      expect(hits(after, "basic")).toHaveLength(tick === 1 ? 0 : 1)
      expect(actor(after).nhienSequence).toBeUndefined()
      expect(after.events.some((e) => e.kind === "interrupt")).toBe(true)
    },
  )
  it("rejects out-of-range ultimate before spending and emits three indexed actual contacts after wind-up", () => {
    const outside = initial({}, [foe("a", { position: 80 })])
    expect(() => castCombatUltimate(outside, "n", "a")).toThrow(/ngoài tầm/)
    expect(actor(outside).energy).toBe(100)
    const cast = castCombatUltimate(initial(), "n", "a")
    const prepare = advanceCombatBattle(cast, 1)
    expect(hits(prepare, "ultimate")).toHaveLength(0)
    const done = advanceCombatBattle(prepare, 3)
    expect(hits(done, "ultimate").map((e) => [e.tick, e.contactIndex])).toEqual(
      [
        [2, 0],
        [3, 1],
        [4, 2],
      ],
    )
    expect(actor(done).energy).toBe(0)
    expect(actor(done).nhienRecoveryUntilTick).toBe(7)
    expect(actor(done).position).toBe(10)
  })
  it.each([1, 2, 3])(
    "cancels unconfirmed ultimate contacts when interrupted at tick%s",
    (tick) => {
      const before = advanceCombatBattle(
        castCombatUltimate(initial(), "n", "a"),
        tick,
      )
      const after = advanceCombatBattle(interruptCombatCast(before, "n"), 2)
      expect(hits(after, "ultimate")).toHaveLength(Math.max(0, tick - 1))
      expect(actor(after).energy).toBe(0)
      expect(actor(after).nhienSequence).toBeUndefined()
    },
  )
  it("honors one interrupt guard then permits a real interruption of the remaining channel", () => {
    let b = advanceCombatBattle(castCombatUltimate(initial(), "n", "a"), 2)
    actor(b).interruptGuardCharges = 1
    actor(b).interruptGuardUntilTick = 20
    b = interruptCombatCast(b, "n")
    expect(actor(b).nhienSequence).toBeDefined()
    expect(b.events.at(-1)?.kind).toBe("interrupt-resist")
    b = advanceCombatBattle(interruptCombatCast(b, "n"), 2)
    expect(hits(b, "ultimate")).toHaveLength(1)
  })
  it("presents a real interruption with its own reaction and never predicts cancelled contacts", () => {
    const first = advanceCombatBattle(
      castCombatUltimate(initial(), "n", "a"),
      2,
    )
    const confirmed = reduceCombatPresentation(
      createCombatPresentation(),
      first.events,
    )
    const cancelled = interruptCombatCast(first, "n")
    const view = reduceCombatPresentation(confirmed, cancelled.events)
    expect(view.actors.n.state).toBe("hit")
    expect(view.actors.n.skillId).toBeUndefined()
    expect(view.effects.n.ultimate).toEqual(confirmed.effects.n.ultimate)
    const later = advanceCombatBattle(cancelled, 2)
    expect(hits(later, "ultimate")).toHaveLength(1)
    expect(combatAudioCues(later.events, first.eventSerial)).toEqual([])
    expect(
      reduceCombatPresentation(view, later.events).effects.n.ultimate,
    ).toEqual(confirmed.effects.n.ultimate)
  })
  it.each(["basic", "ultimate"] as const)(
    "replays an active %s sequence across JSON without duplicating contacts",
    (slot) => {
      const start =
        slot === "basic"
          ? advanceCombatBattle(initial({ nextBasicTick: 1 }), 1)
          : advanceCombatBattle(castCombatUltimate(initial(), "n", "a"), 2)
      expect(actor(start).nhienSequence).toBeDefined()
      const bytes = JSON.stringify(start)
      const next = advanceCombatBattle(JSON.parse(bytes) as CombatBattle, 3)
      expect(next).toEqual(advanceCombatBattle(start, 3))
      expect(JSON.stringify(start)).toBe(bytes)
      expect(hits(next, slot).map((e) => e.contactIndex)).toEqual(
        slot === "basic" ? [0, 1] : [0, 1, 2],
      )
    },
  )
  it("rechecks each living target's range instead of moving or guaranteeing later hits", () => {
    const first = advanceCombatBattle(
      castCombatUltimate(initial(), "n", "a"),
      2,
    )
    actor(first, "a").position = 40
    const after = advanceCombatBattle(first, 2)
    expect(hits(after, "ultimate")).toHaveLength(1)
    expect(
      events(after, "ultimate", "miss").map((e) => e.contactIndex),
    ).toEqual([1, 2])
    expect(actor(after).position).toBe(10)
    expect(gains(after)).toHaveLength(0)
  })
  it("falls back deterministically inside melee range after the original target dies", () => {
    const b = initial({ nextBasicTick: 1 }, [
      foe("a", { hp: 1, maxHp: 1, position: 16 }),
      foe("b", { position: 18 }),
      foe("c", { position: 18 }),
    ])
    const after = advanceCombatBattle(b, 3)
    expect(hits(after, "basic").map((e) => e.targetIds[0])).toEqual(["a", "b"])
    expect(actor(after, "a").hp).toBe(0)
  })
  it("sweeps at most three actual frontal recipients and leaves rear/fourth target untouched", () => {
    const b = initial({ energy: 0, nextAutoTick: 1 }, [
      ...multi(),
      foe("d", { position: 18 }),
      foe("rear", { position: 1 }),
    ])
    const after = advanceCombatBattle(b, 2)
    expect(hits(after, "auto").map((e) => e.targetIds[0])).toEqual([
      "a",
      "b",
      "c",
    ])
    expect(actor(after, "d").hp).toBe(10000)
    expect(actor(after, "rear").hp).toBe(10000)
    expect(new Set(hits(after, "auto").map((e) => e.actionId)).size).toBe(1)
    expect(hits(after, "auto").every((e) => e.contactIndex === 0)).toBe(true)
  })
  it("skips distant auto without spending its cooldown and approaches with ordinary movement", () => {
    const b = advanceCombatBattle(
      initial({ nextAutoTick: 1, nextBasicTick: 1 }, [
        foe("far", { position: 90 }),
      ]),
      1,
    )
    expect(actor(b).cast).toBeNull()
    expect(actor(b).nextAutoTick).toBe(1)
    expect(actor(b).position).toBe(17)
    expect(events(b, "auto", "cast-start")).toHaveLength(0)
  })
  it("keeps auto facing locked and misses an empty front after wind-up", () => {
    const b = advanceCombatBattle(
      initial({ nextAutoTick: 1 }, [
        foe("a", { position: 15 }),
        foe("rear", { position: 1 }),
      ]),
      1,
    )
    actor(b, "a").position = 90
    const after = advanceCombatBattle(b, 1)
    expect(hits(after, "auto")).toHaveLength(0)
    expect(events(after, "auto", "miss")).toHaveLength(1)
    expect(actor(after, "rear").hp).toBe(10000)
    expect(actor(after).nhienRecoveryUntilTick).toBe(5)
  })
  it("grants one bounded rhythm for distinct actual sweep targets, not one proc per recipient", () => {
    const b = advanceCombatBattle(
      initial({ energy: 0, nextAutoTick: 1 }, multi()),
      2,
    )
    expect(gains(b).map((e) => e.amount)).toEqual([8])
    expect(actor(b).nhienRhythm).toMatchObject({
      procs: 1,
      energyGranted: 8,
      targetIds: [],
      nextProcTick: 10,
    })
    expect(actor(b).energy).toBe(8)
  })
  it("does not reward repeated same-target basic contacts or prototype-like target names twice", () => {
    const b = advanceCombatBattle(
      initial({ energy: 0, nextBasicTick: 1 }, [foe("__proto__")]),
      3,
    )
    expect(actor(b).energy).toBe(24)
    expect(actor(b).nhienRhythm?.targetIds).toEqual(["__proto__"])
    expect(gains(b)).toHaveLength(0)
  })
  it("enforces cooldown and lifetime three-proc/24energy cap across real automatic sweeps", () => {
    const b = advanceCombatBattle(
      initial({ energy: 0, nextAutoTick: 1 }, multi()),
      40,
    )
    expect(gains(b).map((e) => [e.tick, e.amount])).toEqual([
      [2, 8],
      [11, 8],
      [20, 8],
    ])
    expect(actor(b).nhienRhythm).toMatchObject({
      procs: 3,
      energyGranted: 24,
      targetIds: [],
    })
    expect(actor(b).energy).toBe(24)
    expect(actor(b).nhienRhythm!.targetIds.length).toBeLessThanOrEqual(2)
  })
  it("expires an old target window before a same-tick new contact", () => {
    let b = advanceCombatBattle(
      initial({ energy: 0, nextBasicTick: 1 }, [
        foe("a"),
        foe("b", { position: 90 }),
      ]),
      3,
    )
    actor(b).nextBasicTick = 10000
    actor(b).nextAutoTick = 7
    actor(b, "a").position = 90
    actor(b, "b").position = 17
    b = advanceCombatBattle(b, 5)
    expect(gains(b)).toHaveLength(0)
    expect(actor(b).nhienRhythm?.targetIds).toEqual(["b"])
  })
  it("excludes summoned targets even when they take real damage", () => {
    const b = advanceCombatBattle(
      initial({ energy: 0, nextAutoTick: 1 }, [
        foe("a", { position: 15 }),
        foe("summon", { position: 16, summoned: true }),
      ]),
      2,
    )
    expect(hits(b, "auto")).toHaveLength(2)
    expect(gains(b)).toHaveLength(0)
    expect(actor(b).nhienRhythm?.targetIds).toEqual(["a"])
  })
  it("preserves boss phase protection/basic counters without granting rhythm from blocked hits", () => {
    const boss = { ...createForgottenHostSeed(), position: 17, ...quiet }
    const b = initial({ energy: 0, nextBasicTick: 1 }, [boss])
    actor(b, boss.id).bossKit!.nextSkillTick = 10000
    actor(b, boss.id).bossKit!.barrierHits = 4
    actor(b, boss.id).bossKit!.barrierExpiresAtTick = 30
    const after = advanceCombatBattle(b, 3)
    expect(
      hits(after, "basic").every((e) => e.amount === 0 && e.absorbed === 0),
    ).toBe(true)
    expect(actor(after, boss.id).bossKit?.barrierHits).toBe(2)
    expect(actor(after).nhienRhythm).toBeUndefined()
    expect(actor(after).energy).toBe(24)
    const ult = castCombatUltimate(initial({}, [boss]), "n", boss.id)
    actor(ult, boss.id).bossKit!.nextSkillTick = 10000
    actor(ult, boss.id).bossKit!.barrierHits = 4
    actor(ult, boss.id).bossKit!.barrierExpiresAtTick = 30
    const blocked = advanceCombatBattle(ult, 4)
    expect(actor(blocked, boss.id).bossKit?.barrierHits).toBe(4)
    expect(hits(blocked, "ultimate").every((e) => e.amount === 0)).toBe(true)
  })
  it("counts positive ordinary-shield damage and clips the actual energy grant at100", () => {
    const b = initial({ energy: 97, nextAutoTick: 1 }, multi())
    for (const e of b.actors.filter((a) => a.side === "enemy")) {
      e.shield = 100
      e.shieldExpiresAtTick = 20
    }
    const after = advanceCombatBattle(b, 2)
    expect(
      hits(after, "auto").every((e) => e.amount === 0 && (e.absorbed ?? 0) > 0),
    ).toBe(true)
    expect(gains(after).map((e) => e.amount)).toEqual([3])
    expect(actor(after).energy).toBe(100)
    expect(actor(after).nhienRhythm?.energyGranted).toBe(3)
  })
  it("consumes a full-energy attempt window/cooldown without a fake gain event or lifetime proc", () => {
    const b = advanceCombatBattle(initial({ nextAutoTick: 1 }, multi()), 2)
    expect(gains(b)).toHaveLength(0)
    expect(actor(b).nhienRhythm).toMatchObject({
      procs: 0,
      energyGranted: 0,
      targetIds: [],
      nextProcTick: 10,
    })
  })
  it("cancels unlaunched contacts when an earlier projectile kills the source before its first hit", () => {
    const b = initial({ hp: 1, maxHp: 1, nextBasicTick: 1 }, [
      foe("a", {
        attack: 999,
        range: 30,
        projectileTicks: 1,
        nextBasicTick: 1,
      }),
    ])
    const ally = createCombatBattle({
      id: "ally",
      players: [
        {
          id: "stay",
          spiritId: "aw2-than",
          position: 0,
          hp: 10000,
          maxHp: 10000,
          ...quiet,
        },
      ],
      enemies: [foe("e")],
    }).actors[0]
    b.actors.push({ ...ally, slot: 1 })
    const after = advanceCombatBattle(b, 3)
    expect(actor(after).hp).toBe(0)
    expect(hits(after, "basic")).toHaveLength(0)
    expect(actor(after).nhienSequence).toBeUndefined()
    expect(after.status).toBe("active")
  })
  it("clears future sequence/recovery at an actual terminal and emits only one result", () => {
    const b = advanceCombatBattle(
      initial({ nextBasicTick: 1 }, [foe("a", { hp: 1, maxHp: 1 })]),
      5,
    )
    expect(b.status).toBe("player-win")
    expect(b.tick).toBe(2)
    expect(hits(b, "basic")).toHaveLength(1)
    expect(actor(b).nhienSequence).toBeUndefined()
    expect(actor(b).nhienRecoveryUntilTick).toBeUndefined()
    expect(b.events.filter((e) => e.kind === "battle-end")).toHaveLength(1)
    expect(advanceCombatBattle(b)).toBe(b)
  })
  it("roundtrips optional ephemeral state deterministically without mutating the previous command", () => {
    const b = advanceCombatBattle(
      initial({ energy: 0, nextAutoTick: 1 }, multi()),
      2,
    )
    const frozen = JSON.stringify(b)
    const copy = JSON.parse(frozen) as CombatBattle
    expect(advanceCombatBattle(copy, 15)).toEqual(advanceCombatBattle(b, 15))
    expect(JSON.stringify(b)).toBe(frozen)
    const old = createCombatBattle({
      id: "old",
      players: [{ id: "p", spiritId: "aw2-than" }],
      enemies: [foe("a")],
    })
    expect(
      advanceCombatBattle(JSON.parse(JSON.stringify(old)) as CombatBattle, 2),
    ).toEqual(advanceCombatBattle(old, 2))
  })
  it("groups actual auto recipients/one source gesture while preserving independent passive and own victim reactions", () => {
    const b = advanceCombatBattle(
      initial({ energy: 0, nextAutoTick: 1 }, multi()),
      2,
    )
    const p = reduceCombatPresentation(createCombatPresentation(), b.events)
    expect(p.effects.n.auto.targetIds).toEqual(["a", "b", "c"])
    expect(p.effects.n.auto.serial).toBe(hits(b, "auto")[0].serial)
    expect(p.effects.n.passive.targetId).toBe("n")
    expect(p.actors.n.skillId).toBe("aw2-nhien:skill:auto")
    expect(p.actors.a.skillId).toBeUndefined()
    let split = createCombatPresentation()
    for (const event of b.events)
      split = reduceCombatPresentation(split, [event])
    expect(split).toEqual(p)
    expect(reduceCombatPresentation(p, b.events)).toBe(p)
  })
  it("uses explicit actual contact indices and finite effects without advancing an unconfirmed ultimate pose", () => {
    const b = advanceCombatBattle(castCombatUltimate(initial(), "n", "a"), 2)
    const p = reduceCombatPresentation(createCombatPresentation(), b.events)
    const m = ROSTER_ASSETS["aw2-nhien"],
      cue = p.actors.n
    expect(cue.contactIndex).toBe(0)
    const first = sampleActorPlayback(m, undefined, cue, false, 0, false)
    expect(
      sampleActorPlayback(m, first.clock, cue, false, 400, false).pose.frame,
    ).toBe("battle.ultimate.1")
    const fx = p.effects.n.ultimate
    const clock = sampleConfirmedEffect(m, undefined, fx, 0, true).clock
    expect(sampleConfirmedEffect(m, clock, fx, 221, true).effect).toBeNull()
    const prepare = advanceCombatBattle(
      castCombatUltimate(initial(), "n", "a"),
      1,
    )
    const pre = reduceCombatPresentation(
      createCombatPresentation(),
      prepare.events,
    )
    expect(pre.effects.n).toBeUndefined()
    expect(pre.actors.n.phase).toBe("prepare")
  })
  it("plays exactly actual beat cues and one sweep/passive cue without preparation/recovery/miss audio", () => {
    const basic = advanceCombatBattle(initial({ nextBasicTick: 1 }), 3)
    expect(
      combatAudioCues(basic.events, 0).filter((c) => c.slot === "basic"),
    ).toHaveLength(2)
    const ult = advanceCombatBattle(castCombatUltimate(initial(), "n", "a"), 4)
    expect(
      combatAudioCues(ult.events, 0).filter((c) => c.slot === "ultimate"),
    ).toHaveLength(3)
    const sweep = advanceCombatBattle(
      initial({ energy: 0, nextAutoTick: 1 }, multi()),
      2,
    )
    expect(combatAudioCues(sweep.events, 0).map((c) => c.slot)).toEqual([
      "auto",
      "passive",
    ])
    const pre = advanceCombatBattle(castCombatUltimate(initial(), "n", "a"), 1)
    expect(combatAudioCues(pre.events, 0)).toEqual([])
    const missed = advanceCombatBattle(pre)
    actor(missed, "a").position = 90
    const after = advanceCombatBattle(missed, 2)
    expect(combatAudioCues(after.events, missed.eventSerial)).toEqual([])
  })
  it("keeps practice five-member/pure/resettable and restricts the real interrupt command to Nhiên practice", () => {
    let session = createBattlePreviewSession(5, "nhien")
    expect(
      session.battle.actors
        .filter((a) => a.side === "player")
        .map((a) => a.spiritId),
    ).toEqual(["aw2-than", "aw2-nhien", "aw2-lam", "aw2-moc-non", "aw2-suong"])
    for (
      let i = 0;
      i < 20 &&
      !actor(session.battle, "player-aw2-nhien").cast &&
      !actor(session.battle, "player-aw2-nhien").nhienSequence;
      i++
    )
      session = reduceBattlePreviewSession(session, { type: "advance" })
    const interrupted = reduceBattlePreviewSession(session, {
      type: "interrupt-nhien",
    })
    expect(interrupted.battle.events.at(-1)?.kind).toBe("interrupt")
    expect(
      reduceBattlePreviewSession(interrupted, { type: "reset", level: 10 })
        .practice,
    ).toBe("nhien")
    expect(
      reduceBattlePreviewSession(createBattlePreviewSession(5), {
        type: "interrupt-nhien",
      }).message,
    ).toContain("chỉ có trong trận luyện")
  })
})
