import { describe, expect, it } from "vitest"
import {
  COMBAT_KITS,
  STARTER_SPIRIT_IDS,
  MUOI_TUNING,
  advanceCombatBattle,
  castCombatUltimate,
  cleanseMuoiMarks,
  combatSkillId,
  createCombatBattle,
  createCombatPresentation,
  createDevelopmentCombatSeed,
  developmentCombatStats,
  experienceToReachLevel,
  interruptCombatCast,
  muoiDamageMultiplier,
  reduceCombatPresentation,
  selectMuoiTarget,
  type CombatBattle,
  type CombatUnitSeed,
} from "@/aw2/combat"
import { combatAudioCues } from "@/aw2/combat/audio"
import { ROSTER_ASSETS } from "@/aw2/assets/roster"
import { sampleActorEffect, sampleConfirmedEffect } from "@/aw2/assets/playback"
import { createForgottenHostSeed } from "@/aw2/combat/forgottenHost"
import {
  createBattlePreviewSession,
  reduceBattlePreviewSession,
} from "../../aw2/battleSession"

const quiet = { nextBasicTick: 10000, nextAutoTick: 10000 }
const enemy = (
  id: string,
  extra: Partial<CombatUnitSeed> = {},
): CombatUnitSeed => ({
  id,
  spiritId: "aw2-enemy-test",
  position: 30,
  hp: 5000,
  maxHp: 5000,
  ...quiet,
  ...extra,
})
const initial = (auto = true, foes: CombatUnitSeed[] = [enemy("target")]) =>
  createCombatBattle({
    id: "muoi-contract",
    players: [
      {
        id: "muoi",
        spiritId: "aw2-muoi",
        position: 10,
        energy: 100,
        ...quiet,
        nextAutoTick: auto ? 0 : 10000,
      },
    ],
    enemies: foes,
  })
const actor = (b: CombatBattle, id: string) =>
  b.actors.find((a) => a.id === id)!
const skill = (slot: "basic" | "auto" | "passive" | "ultimate") =>
  combatSkillId("aw2-muoi", slot)
const events = (b: CombatBattle, slot: string) =>
  b.events.filter((e) => e.skillId === `aw2-muoi:skill:${slot}`)

describe("AW2-007E bounded Muối combat", () => {
  it("explicitly supports Muoi seeds/levels without expanding starters or falling back for future identities", () => {
    expect(STARTER_SPIRIT_IDS).toHaveLength(5)
    expect(COMBAT_KITS["aw2-muoi"].role).toBe("debuffer")
    for (const level of [1, 5, 10, 20]) {
      const seed = createDevelopmentCombatSeed(
        "m",
        "aw2-muoi",
        experienceToReachLevel(level),
      )
      expect(seed.attack).toBe(developmentCombatStats("aw2-muoi", level).attack)
      expect(seed.maxHp).toBeGreaterThanOrEqual(150)
    }
    expect(() =>
      createCombatBattle({
        id: "future",
        players: [{ id: "f", spiritId: "aw2-unknown" }],
        enemies: [enemy("e")],
      }),
    ).toThrow(/chưa có combat kit/)
  })
  it("ranks only actual damage caused and uses deterministic slot/ID ties, not attack prediction", () => {
    const b = createCombatBattle({
      id: "threat",
      players: [
        {
          id: "m",
          spiritId: "aw2-muoi",
          hp: 5000,
          maxHp: 5000,
          position: 10,
          defense: 0,
          ...quiet,
        },
      ],
      enemies: [
        enemy("low", { attack: 10, nextBasicTick: 1, range: 100 }),
        enemy("high", { attack: 80, nextBasicTick: 1, range: 100 }),
      ],
    })
    expect(selectMuoiTarget(b, b.actors[0])?.id).toBe("low")
    const after = advanceCombatBattle(b, 3)
    expect(actor(after, "high").damageDealt).toBe(80)
    expect(selectMuoiTarget(after, after.actors[0])?.id).toBe("high")
    const marked = advanceCombatBattle(
      {
        ...after,
        actors: after.actors.map((a) =>
          a.id === "m" ? { ...a, nextAutoTick: 0 } : a,
        ),
      },
      2,
    )
    expect(actor(marked, "high").muoiMarks?.m).toBeDefined()
    expect(actor(marked, "low").muoiMarks).toBeUndefined()
  })
  it("requires eligible range, ignores explicit debuff immunity but not mere movement immunity", () => {
    const b = initial(true, [
      enemy("immune", { debuffImmune: true }),
      enemy("far", { position: 95 }),
      enemy("control", { controlImmune: true }),
    ])
    const after = advanceCombatBattle(b, 2)
    expect(actor(after, "control").muoiMarks?.muoi).toBeDefined()
    expect(actor(after, "immune").muoiMarks).toBeUndefined()
    const far = advanceCombatBattle(
      initial(true, [enemy("far", { position: 95 })]),
      2,
    )
    expect(events(far, "auto").some((e) => e.statusChange === "apply")).toBe(
      false,
    )
  })
  it("prepares without a mark, interruption cancels it and dead targets retarget at commit", () => {
    const b = advanceCombatBattle(initial())
    expect(actor(b, "target").muoiMarks).toBeUndefined()
    expect(actor(b, "muoi").cast?.slot).toBe("auto")
    const canceled = advanceCombatBattle(interruptCombatCast(b, "muoi"), 2)
    expect(
      events(canceled, "auto").some((e) => e.statusChange === "apply"),
    ).toBe(false)
    const pending = advanceCombatBattle(
      initial(true, [enemy("first"), enemy("fallback")]),
    )
    actor(pending, "first").hp = 0
    const committed = advanceCombatBattle(pending)
    expect(actor(committed, "fallback").muoiMarks?.muoi).toBeDefined()
  })
  it("reduces actual outgoing damage20% and uses strongest non-stacking modifier with Than weaken", () => {
    const b = initial()
    actor(b, "target").attack = 100
    actor(b, "target").range = 100
    actor(b, "target").nextBasicTick = 3
    actor(b, "muoi").defense = 0
    actor(b, "muoi").hp = 5000
    actor(b, "muoi").maxHp = 5000
    const marked = advanceCombatBattle(b, 3)
    expect(
      marked.events.find((e) => e.kind === "hit" && e.sourceId === "target")
        ?.amount,
    ).toBe(80)
    actor(marked, "target").weakenUntilTick = 20
    actor(marked, "target").nextBasicTick = 4
    const weakened = advanceCombatBattle(marked)
    expect(
      weakened.events
        .filter((e) => e.kind === "hit" && e.sourceId === "target")
        .at(-1)?.amount,
    ).toBe(75)
  })
  it("basic launches/impacts on separate ticks and refreshes only its own existing mark to hard cap", () => {
    let b = advanceCombatBattle(initial(), 2)
    actor(b, "muoi").nextAutoTick = 10000
    actor(b, "muoi").nextBasicTick = 3
    b = advanceCombatBattle(b)
    expect(events(b, "basic").some((e) => e.kind === "projectile-launch")).toBe(
      true,
    )
    expect(events(b, "passive")).toHaveLength(0)
    b = advanceCombatBattle(b, 2)
    expect(events(b, "basic").some((e) => e.kind === "hit")).toBe(true)
    expect(actor(b, "target").muoiMarks!.muoi.expiresAtTick).toBe(9)
    actor(b, "muoi").projectileTicks = 0
    for (let i = 0; i < 5; i++) {
      actor(b, "muoi").nextBasicTick = b.tick + 1
      b = advanceCombatBattle(b)
    }
    const mark = actor(b, "target").muoiMarks!.muoi
    expect(mark.expiresAtTick).toBe(mark.capTick)
    expect(mark.capTick).toBe(2 + MUOI_TUNING.maxLifetimeTicks)
    b = advanceCombatBattle(b, 2)
    expect(actor(b, "target").muoiMarks).toBeUndefined()
  })
  it("a cleanse cannot be undone by an already launched basic and preserves unrelated statuses", () => {
    let b = advanceCombatBattle(initial(), 2)
    actor(b, "muoi").nextAutoTick = 10000
    actor(b, "muoi").nextBasicTick = 3
    actor(b, "target").slowUntilTick = 20
    b = advanceCombatBattle(b)
    const cleansed = cleanseMuoiMarks(b, "target")
    expect(actor(cleansed, "target").muoiMarks).toBeUndefined()
    expect(actor(cleansed, "target").slowUntilTick).toBe(20)
    const impacted = advanceCombatBattle(cleansed, 2)
    expect(events(impacted, "basic").some((e) => e.kind === "hit")).toBe(true)
    expect(events(impacted, "passive")).toHaveLength(0)
    expect(actor(b, "target").muoiMarks).toBeDefined()
  })
  it("retargeting removes only the casting source mark and multiple sources never stack reductions", () => {
    const b = createCombatBattle({
      id: "two",
      players: [
        {
          id: "a",
          spiritId: "aw2-muoi",
          position: 10,
          ...quiet,
          nextAutoTick: 0,
        },
        {
          id: "b",
          spiritId: "aw2-muoi",
          position: 10,
          ...quiet,
          nextAutoTick: 0,
        },
      ],
      enemies: [enemy("x"), enemy("y")],
    })
    let after = advanceCombatBattle(b, 2)
    expect(Object.keys(actor(after, "x").muoiMarks!)).toEqual(["a", "b"])
    expect(muoiDamageMultiplier(actor(after, "x"), after.tick)).toBe(0.8)
    actor(after, "y").damageDealt = 100
    actor(after, "a").nextAutoTick = 3
    after = advanceCombatBattle(after, 2)
    expect(Object.keys(actor(after, "x").muoiMarks!)).toEqual(["b"])
    expect(Object.keys(actor(after, "y").muoiMarks!)).toEqual(["a"])
  })
  it("source death immediately removes marks, while prior projectile may hit but cannot refresh", () => {
    let b = advanceCombatBattle(initial(), 2)
    actor(b, "muoi").nextAutoTick = 10000
    actor(b, "muoi").nextBasicTick = 3
    b = advanceCombatBattle(b)
    actor(b, "muoi").hp = 1
    actor(b, "muoi").defense = 0
    actor(b, "target").attack = 100
    actor(b, "target").range = 100
    actor(b, "target").nextBasicTick = 4
    b = advanceCombatBattle(b)
    expect(b.status).toBe("enemy-win")
    expect(actor(b, "target").muoiMarks).toBeUndefined()
    expect(events(b, "passive")).toHaveLength(0)
    expect(advanceCombatBattle(b)).toBe(b)
  })
  it("target defeat and terminal remove marks exactly once with no future proc events", () => {
    let b = advanceCombatBattle(initial(), 2)
    actor(b, "muoi").attack = 10000
    actor(b, "muoi").projectileTicks = 0
    actor(b, "muoi").nextBasicTick = 3
    b = advanceCombatBattle(b)
    expect(b.status).toBe("player-win")
    expect(actor(b, "target").muoiMarks).toBeUndefined()
    expect(
      events(b, "auto").filter((e) => e.statusChange === "remove"),
    ).toHaveLength(1)
    expect(events(b, "passive")).toHaveLength(0)
  })
  it("ultimate removes only floor half ordinary shield before real burst, needs valid target and can miss or interrupt", () => {
    let b = initial(false)
    expect(() => castCombatUltimate(b, "muoi")).toThrow(/mục tiêu địch/)
    actor(b, "target").shield = 101
    actor(b, "target").shieldExpiresAtTick = 100
    b = advanceCombatBattle(castCombatUltimate(b, "muoi", "target"), 2)
    expect(
      events(b, "ultimate").find((e) => e.statusChange === "dispel")?.amount,
    ).toBe(50)
    expect(actor(b, "target").shield).toBe(18) // round(27*1.3*100/108)=33 absorbed after the50 dispel
    const cast = castCombatUltimate(initial(false), "muoi", "target")
    const cancel = advanceCombatBattle(interruptCombatCast(cast, "muoi"), 2)
    expect(events(cancel, "ultimate").some((e) => e.kind === "hit")).toBe(false)
    actor(cast, "target").position = 95
    expect(
      events(advanceCombatBattle(cast, 2), "ultimate").some(
        (e) => e.kind === "miss",
      ),
    ).toBe(true)
  })
  it("phase barrier counters and interrupt guard are immune to generic shield removal; blocked hits cannot refresh", () => {
    const b = createCombatBattle({
      id: "barrier",
      players: [
        {
          id: "muoi",
          spiritId: "aw2-muoi",
          position: 50,
          energy: 100,
          ...quiet,
        },
      ],
      enemies: [{ ...createForgottenHostSeed(), ...quiet }],
    })
    const boss = b.actors[1]
    boss.bossKit!.barrierHits = 4
    boss.bossKit!.barrierExpiresAtTick = 100
    boss.bossKit!.nextSkillTick = 100
    boss.shield = 100
    boss.shieldExpiresAtTick = 100
    boss.interruptGuardCharges = 1
    boss.interruptGuardUntilTick = 100
    const after = advanceCombatBattle(castCombatUltimate(b, "muoi", boss.id), 2)
    expect(after.actors[1].bossKit!.barrierHits).toBe(4)
    expect(after.actors[1].shield).toBe(50)
    expect(after.actors[1].interruptGuardCharges).toBe(1)
    expect(
      events(after, "ultimate").find((e) => e.kind === "hit")?.amount,
    ).toBe(0)
    expect(actor(after, "muoi").damageDealt ?? 0).toBe(0)
  })
  it("JSON resume is deterministic with optional old fields, no mutation, no rewards/save", () => {
    const b = initial()
    const before = JSON.stringify(b)
    const first = advanceCombatBattle(b, 5)
    expect(JSON.stringify(b)).toBe(before)
    expect(advanceCombatBattle(JSON.parse(JSON.stringify(first)), 5)).toEqual(
      advanceCombatBattle(first, 5),
    )
    expect("save" in first).toBe(false)
    expect("reward" in first).toBe(false)
    const old = JSON.parse(before) as CombatBattle
    old.actors.forEach((a) => {
      delete a.damageDealt
      delete a.muoiMarks
    })
    expect(advanceCombatBattle(old, 5)).toEqual(first)
  })
  it("actual isolated five-person practice, reset and ultimate remain coherent without changing starter session", () => {
    const starter = createBattlePreviewSession(5)
    expect(
      starter.battle.actors
        .filter((a) => a.side === "player")
        .map((a) => a.spiritId),
    ).toEqual(STARTER_SPIRIT_IDS)
    let m = createBattlePreviewSession(5, "muoi")
    expect(m.battle.actors.filter((a) => a.side === "player")).toHaveLength(5)
    expect(m.battle.actors.some((a) => a.spiritId === "aw2-muoi")).toBe(true)
    m = reduceBattlePreviewSession(m, {
      type: "ultimate",
      actorId: "player-aw2-muoi",
    })
    expect(m.message).toContain("đã bắt đầu")
    m = reduceBattlePreviewSession(m, { type: "reset", level: 10 })
    expect(m.practice).toBe("muoi")
    expect(m.level).toBe(10)
  })
  it("confirmed presentation/audio use own effects, never cast preparation/removal as successful mark", () => {
    const m = ROSTER_ASSETS["aw2-muoi"]
    const first = advanceCombatBattle(initial())
    const prepare = reduceCombatPresentation(
      createCombatPresentation(),
      first.events,
    )
    expect(sampleActorEffect(m, prepare.actors.muoi, 1000)).toBeNull()
    expect(combatAudioCues(first.events, 0)).toEqual([])
    const b = advanceCombatBattle(first)
    const p = reduceCombatPresentation(prepare, b.events)
    expect(p.effects.muoi.auto.targetId).toBe("target")
    const fx = sampleConfirmedEffect(m, undefined, p.effects.muoi.auto, 0, true)
    expect(fx.effect?.frame).toBe("fx.auto.2")
    expect(
      sampleConfirmedEffect(m, fx.clock, p.effects.muoi.auto, 440, true).effect,
    ).toBeNull()
    const clean = cleanseMuoiMarks(b, "target")
    const result = reduceCombatPresentation(p, clean.events)
    expect(result.effects.muoi.auto.serial).toBe(p.effects.muoi.auto.serial)
    expect(combatAudioCues(clean.events, b.eventSerial)).toEqual([])
    expect(combatAudioCues(b.events, 0).map((c) => c.url)).toEqual([
      m.skills.auto.audio.url,
    ])
  })
  it("groups ultimate dispel and hit into one FX and keeps victim-owned reaction cues", () => {
    const seed = initial(false)
    actor(seed, "target").shield = 100
    actor(seed, "target").shieldExpiresAtTick = 100
    const b = advanceCombatBattle(castCombatUltimate(seed, "muoi", "target"), 2)
    const p = reduceCombatPresentation(createCombatPresentation(), b.events)
    expect(p.effects.muoi.ultimate.serial).toBe(
      events(b, "ultimate").find((e) => e.statusChange === "dispel")!.serial,
    )
    expect(p.actors.target.skillId).toBeUndefined()
    expect(reduceCombatPresentation(p, b.events)).toBe(p)
  })
  it("expiry before a same-tick projectile impact cannot recreate a mark", () => {
    let b = advanceCombatBattle(initial(), 2)
    actor(b, "muoi").nextAutoTick = 10000
    actor(b, "muoi").nextBasicTick = 6
    b = advanceCombatBattle(b, 6)
    expect(b.tick).toBe(8)
    expect(events(b, "basic").some((e) => e.kind === "hit")).toBe(true)
    expect(actor(b, "target").muoiMarks).toBeUndefined()
    expect(events(b, "passive")).toHaveLength(0)
  })
  it("a dead source's launched projectile can finish while a living teammate keeps battle active, without refresh", () => {
    const seed = createCombatBattle({
      id: "survivor",
      players: [
        {
          id: "muoi",
          spiritId: "aw2-muoi",
          position: 10,
          energy: 100,
          ...quiet,
          nextAutoTick: 0,
        },
        {
          id: "ally",
          spiritId: "aw2-than",
          position: 5,
          ...quiet,
          hp: 5000,
          maxHp: 5000,
        },
      ],
      enemies: [enemy("target")],
    })
    let b = advanceCombatBattle(seed, 2)
    actor(b, "muoi").nextBasicTick = 3
    b = advanceCombatBattle(b)
    actor(b, "muoi").hp = 1
    actor(b, "muoi").defense = 0
    actor(b, "target").attack = 100
    actor(b, "target").range = 100
    actor(b, "target").nextBasicTick = 4
    b = advanceCombatBattle(b, 2)
    expect(actor(b, "muoi").hp).toBe(0)
    expect(b.status).toBe("active")
    expect(events(b, "basic").some((e) => e.kind === "hit")).toBe(true)
    expect(actor(b, "target").muoiMarks).toBeUndefined()
    expect(events(b, "passive")).toHaveLength(0)
  })
  it("practice counterplay uses the real cleanse transition and cannot appear in normal starter preview", () => {
    let m = createBattlePreviewSession(5, "muoi")
    for (let i = 0; i < 8; i++)
      m = reduceBattlePreviewSession(m, { type: "advance" })
    const target = m.battle.actors.find(
      (a) => Object.keys(a.muoiMarks ?? {}).length,
    )!
    expect(target).toBeDefined()
    const clean = reduceBattlePreviewSession(m, {
      type: "cleanse",
      targetId: target.id,
    })
    expect(actor(clean.battle, target.id).muoiMarks).toBeUndefined()
    expect(clean.presentation.lastSerial).toBe(clean.battle.eventSerial)
    expect(
      reduceBattlePreviewSession(createBattlePreviewSession(5), {
        type: "cleanse",
        targetId: "enemy-than",
      }).message,
    ).toContain("chỉ có")
  })
})
