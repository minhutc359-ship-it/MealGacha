import { describe, expect, it } from "vitest"
import {
  advanceCombatBattle,
  castCombatUltimate,
  createCombatBattle,
  interruptCombatCast,
  COMBAT_KITS,
  STARTER_SPIRIT_IDS,
  createDevelopmentCombatSeed,
  experienceToReachLevel,
  createCombatPresentation,
  reduceCombatPresentation,
  MOC_TUNING,
  type CombatBattle,
  type CombatUnitSeed,
} from "@/aw2/combat"
import { combatAudioCues } from "@/aw2/combat/audio"
import { ROSTER_ASSETS } from "@/aw2/assets/roster"
import { sampleActorEffect, sampleConfirmedEffect } from "@/aw2/assets/playback"
import {
  createBattlePreviewSession,
  reduceBattlePreviewSession,
} from "../../aw2/battleSession"
import { ROSTER } from "@/aw2/world/ids"
const quiet = { nextBasicTick: 10000, nextAutoTick: 10000 }
const seed = (
  id: string,
  spiritId: string,
  position: number,
  extra: Partial<CombatUnitSeed> = {},
) => ({ id, spiritId, position, ...quiet, ...extra })
const start = (
  extra: Partial<CombatUnitSeed> = {},
  enemies = [seed("e", "enemy", 30, { hp: 10000, maxHp: 10000, defense: 0 })],
) =>
  createCombatBattle({
    id: "moc-contract",
    players: [seed("m", "aw2-moc", 10, { energy: 100, ...extra })],
    enemies,
  })
const a = (b: CombatBattle, id = "m") => b.actors.find((a) => a.id === id)!
const events = (b: CombatBattle, slot: string, kind?: string) =>
  b.events.filter(
    (e) => e.skillId === `aw2-moc:skill:${slot}` && (!kind || e.kind === kind),
  )
const planted = () => advanceCombatBattle(start({ nextAutoTick: 1 }), 2)
const ultimate = (b = start(), target = "e") =>
  advanceCombatBattle(castCombatUltimate(b, "m", target), 2)
function kill(b: CombatBattle, id: string) {
  const s = ++b.actionSerial
  b.effects.push({
    id: `effect:${s}`,
    serial: s,
    sourceId: id === "m" ? "e" : "m",
    skillId: "fixture:skill:basic",
    kind: "damage",
    targetId: id,
    amount: 100000,
    resolveTick: b.tick + 1,
  })
  return advanceCombatBattle(b)
}

describe("AW2-007I bounded Mộc mage", () => {
  it("keeps approved identity, separate Mộc Non and five saved starters", () => {
    const m = ROSTER_ASSETS["aw2-moc"]
    expect([
      m.displayName,
      m.spiritId,
      ROSTER.find((r) => r.spiritId === m.spiritId)?.rarity,
      ROSTER.find((r) => r.spiritId === m.spiritId)?.recipeAffiliation,
    ]).toEqual(["Mộc", "aw2-moc", "SSR", "Cốm"])
    expect(Object.values(m.skills).map((s) => s.displayName)).toEqual([
      "Nét Lá",
      "Gieo Dấu",
      "Mùa Nối Mùa",
      "Mở Gói Mùa Xanh",
    ])
    expect(COMBAT_KITS["aw2-moc"].role).toBe("mage")
    expect(STARTER_SPIRIT_IDS).toHaveLength(5)
    expect(STARTER_SPIRIT_IDS).not.toContain("aw2-moc")
  })
  it.each([1, 5, 10, 20])(
    "uses existing development level %i curve",
    (level) => {
      const s = createDevelopmentCombatSeed(
        "m",
        "aw2-moc",
        experienceToReachLevel(level),
      )
      expect(s.maxHp).toBe(Math.round(150 * (1 + (level - 1) * 0.055)))
    },
  )
  it("basic is one launched projectile, with no premature contact or mark", () => {
    let b = advanceCombatBattle(start({ nextBasicTick: 1 }))
    expect(events(b, "basic", "projectile-launch")).toHaveLength(1)
    expect(events(b, "basic", "hit")).toHaveLength(0)
    expect(a(b).mocMark).toBeUndefined()
    b = advanceCombatBattle(b, 2)
    expect(events(b, "basic", "hit")).toHaveLength(1)
    expect(events(b, "basic", "hit")[0].amount).toBe(36)
  })
  it("a launched basic keeps established source-death semantics while fields cancel", () => {
    let b = advanceCombatBattle(start({ nextBasicTick: 1 }))
    b = kill(b, "m")
    expect(b.status).toBe("enemy-win")
    // A living teammate keeps battle active, allowing the already launched projectile.
    b = start({ nextBasicTick: 1 })
    const ally = createCombatBattle({
      id: "ally",
      players: [seed("x", "aw2-than", 10)],
      enemies: [seed("z", "enemy", 90)],
    }).actors[0]
    b.actors.push({ ...ally, slot: 1 })
    b = advanceCombatBattle(b)
    b = kill(b, "m")
    b = advanceCombatBattle(b)
    expect(events(b, "basic", "hit")).toHaveLength(1)
  })
  it("auto waits for range and deterministic nearest/slot choice", () => {
    let b = start({ nextAutoTick: 1 }, [
      seed("far", "enemy", 90),
      seed("near", "enemy", 30),
      seed("tie", "enemy", 30),
    ])
    b = advanceCombatBattle(b, 2)
    expect(a(b).mocMark?.center).toBe(30)
    expect(events(b, "auto", "cast-start")[0].targetIds).toEqual(["near"])
    b = advanceCombatBattle(
      start({ nextAutoTick: 1 }, [seed("far", "enemy", 90)]),
    )
    expect(a(b).cast).toBeNull()
    expect(a(b).mocMark).toBeUndefined()
  })
  it.each(["dead", "range"])(
    "auto loses its committed target (%s) without fallback",
    (kind) => {
      let b = advanceCombatBattle(
        start({ nextAutoTick: 1 }, [
          seed("e", "enemy", 30),
          seed("other", "enemy", 40),
        ]),
      )
      if (kind === "dead") a(b, "e").hp = 0
      else a(b, "e").position = 90
      b = advanceCombatBattle(b)
      expect(a(b).mocMark).toBeUndefined()
      expect(events(b, "auto", "miss")).toHaveLength(1)
      expect(a(b).nextAutoTick).toBe(6)
    },
  )
  it("mark locks ground center, waits three ticks, and hits all current occupants once", () => {
    let b = planted()
    expect(a(b).mocMark).toMatchObject({
      center: 30,
      armedAtTick: 5,
      expiresAtTick: 8,
    })
    b = advanceCombatBattle(b, 2)
    expect(events(b, "auto", "hit")).toHaveLength(0)
    b = advanceCombatBattle(b)
    expect(events(b, "auto", "hit")[0].amount).toBe(32)
    expect(a(b).mocMark).toBeUndefined()
    a(b).nextAutoTick = 10000
    b = advanceCombatBattle(b, 4)
    expect(events(b, "auto", "hit")).toHaveLength(1)
  })
  it("opponents can leave, then enter an armed mark before its exclusive expiry", () => {
    let b = planted()
    a(b).nextAutoTick = 10000
    a(b, "e").position = 50
    b = advanceCombatBattle(b, 3)
    expect(a(b).mocMark?.center).toBe(30)
    expect(events(b, "auto", "hit")).toHaveLength(0)
    a(b, "e").position = 36
    b = advanceCombatBattle(b)
    expect(events(b, "auto", "hit")).toHaveLength(1)
  })
  it("empty marks expire without damage, and cannot trigger on expiry boundary", () => {
    let b = planted()
    a(b).nextAutoTick = 10000
    a(b, "e").position = 50
    b = advanceCombatBattle(b, 5)
    a(b, "e").position = 30
    b = advanceCombatBattle(b)
    expect(b.tick).toBe(8)
    expect(a(b).mocMark).toBeUndefined()
    expect(events(b, "auto", "hit")).toHaveLength(0)
  })
  it("one mark hits each present enemy including summons, never allies", () => {
    let b = advanceCombatBattle(
      start({ nextAutoTick: 1 }, [
        seed("e", "enemy", 30, { hp: 1000, maxHp: 1000 }),
        seed("f", "enemy", 36, { hp: 1000, maxHp: 1000, summoned: true }),
        seed("g", "enemy", 37),
      ]),
      5,
    )
    expect(events(b, "auto", "hit").map((e) => e.targetIds[0])).toEqual([
      "e",
      "f",
    ])
  })
  it("a protected or shielded hit still consumes the one activation", () => {
    let b = planted()
    a(b).nextAutoTick = 10000
    a(b, "e").shield = 100
    b = advanceCombatBattle(b, 3)
    expect(events(b, "auto", "hit")[0].absorbed).toBe(32)
    expect(a(b).mocMark).toBeUndefined()
  })
  function replacement(center = 40) {
    let b = planted()
    a(b, "e").position = center
    a(b).nextAutoTick = 3
    return advanceCombatBattle(b, 2)
  }
  it("replacement at a new position grants one finite ordinary shield", () => {
    let b = replacement()
    expect(a(b).mocMark?.center).toBe(40)
    expect(a(b).shield).toBe(18)
    expect(a(b).shieldExpiresAtTick).toBe(7)
    expect(a(b).mocPassiveUntilTick).toBe(12)
    a(b).nextAutoTick = 10000
    b = advanceCombatBattle(b, 3)
    expect(a(b).shield).toBe(0)
  })
  it("same-place replacement cannot grant passive shield", () => {
    const b = replacement(33)
    expect(a(b).shield).toBe(0)
    expect(events(b, "passive", "shield")).toHaveLength(0)
  })
  it("existing ordinary shield is neither stacked nor extended by replacement", () => {
    let b = planted()
    a(b).shield = 7
    a(b).shieldExpiresAtTick = 12
    a(b, "e").position = 40
    a(b).nextAutoTick = 3
    b = advanceCombatBattle(b, 2)
    expect(a(b).shield).toBe(7)
    expect(a(b).shieldExpiresAtTick).toBe(12)
    expect(events(b, "passive", "shield")).toHaveLength(0)
  })
  it("cooldown prevents repeated replacement advantage even after shield depleted", () => {
    let b = replacement()
    a(b).shield = 0
    a(b, "e").position = 50
    a(b).nextAutoTick = 5
    b = advanceCombatBattle(b, 2)
    expect(a(b).mocMark?.center).toBe(50)
    expect(a(b).shield).toBe(0)
    expect(events(b, "passive", "shield")).toHaveLength(1)
  })
  it("expired or consumed marks do not count as replacements", () => {
    let b = planted()
    a(b).nextAutoTick = 10000
    a(b, "e").position = 50
    b = advanceCombatBattle(b, 6)
    a(b).nextAutoTick = 9
    b = advanceCombatBattle(b, 2)
    expect(a(b).shield).toBe(0)
  })
  it("ultimate checks enemy/range/energy and reserves no mark before commit", () => {
    expect(() => castCombatUltimate(start(), "m")).toThrow()
    expect(() => castCombatUltimate(start(), "m", "m")).toThrow()
    expect(() =>
      castCombatUltimate(start({}, [seed("e", "enemy", 90)]), "m", "e"),
    ).toThrow("ngoài tầm")
    expect(() => castCombatUltimate(start({ energy: 99 }), "m", "e")).toThrow(
      "năng lượng",
    )
    const b = castCombatUltimate(planted(), "m", "e")
    expect(a(b).mocMark).toBeDefined()
    expect(a(b).mocBurst).toBeUndefined()
    expect(a(b).energy).toBe(0)
  })
  it("marked ultimate consumes one valid mark and warns two ticks before one burst", () => {
    let b = ultimate(planted())
    a(b).nextAutoTick = 10000
    expect(a(b).mocMark).toBeUndefined()
    expect(a(b).mocBurst).toMatchObject({
      center: 30,
      resolveTick: 6,
      consumedMark: true,
      amount: 64.8,
    })
    expect(events(b, "ultimate", "hit")).toHaveLength(0)
    b = advanceCombatBattle(b)
    expect(events(b, "ultimate", "hit")).toHaveLength(0)
    b = advanceCombatBattle(b)
    expect(events(b, "ultimate", "hit")[0].amount).toBe(65)
    expect(a(b).mocBurst).toBeUndefined()
  })
  it("unmarked ultimate uses smaller burst and current target center at commit", () => {
    let b = castCombatUltimate(start(), "m", "e")
    a(b, "e").position = 35
    b = advanceCombatBattle(b, 2)
    expect(a(b).mocBurst).toMatchObject({
      center: 35,
      amount: 46.800000000000004,
      consumedMark: false,
    })
    b = advanceCombatBattle(b, 2)
    expect(events(b, "ultimate", "hit")[0].amount).toBe(47)
  })
  it("ultimate occupants are checked at burst, not locked target HP promises", () => {
    let b = ultimate()
    a(b, "e").position = 50
    b = advanceCombatBattle(b, 2)
    expect(events(b, "ultimate", "hit")).toHaveLength(0)
    expect(events(b, "ultimate", "miss")).toHaveLength(1)
    expect(a(b).mocBurst).toBeUndefined()
  })
  it("a dead ultimate target at commit misses without consuming a valid mark", () => {
    let b = castCombatUltimate(planted(), "m", "e")
    a(b, "e").hp = 0 // keep another enemy alive
    b.actors.push({
      ...a(b, "e"),
      id: "f",
      slot: 1,
      hp: 1000,
      maxHp: 1000,
      position: 90,
    })
    b = advanceCombatBattle(b, 2)
    expect(a(b).mocMark).toBeDefined()
    expect(a(b).mocBurst).toBeUndefined()
    expect(events(b, "ultimate", "miss")).toHaveLength(1)
  })
  it("precommit interrupt spends energy but keeps the old mark", () => {
    const b = interruptCombatCast(castCombatUltimate(planted(), "m", "e"), "m")
    expect(a(b).mocMark).toBeDefined()
    expect(a(b).mocBurst).toBeUndefined()
    expect(a(b).energy).toBe(0)
  })
  it("interrupting later auto anticipation leaves an already committed burst", () => {
    let b = ultimate()
    a(b).nextAutoTick = 3
    b = advanceCombatBattle(b)
    expect(a(b).cast?.slot).toBe("auto")
    b = interruptCombatCast(b, "m")
    b = advanceCombatBattle(b)
    expect(events(b, "ultimate", "hit")).toHaveLength(1)
  })
  it("pending burst cannot be recast even with externally restored energy", () => {
    const b = ultimate()
    a(b).energy = 100
    expect(() => castCombatUltimate(b, "m", "e")).toThrow("đang chờ")
  })
  it.each(["mark", "burst"])(
    "source death cancels unconfirmed %s and terminal state",
    (kind) => {
      const b = kill(kind === "mark" ? planted() : ultimate(), "m")
      expect(a(b).mocMark).toBeUndefined()
      expect(a(b).mocBurst).toBeUndefined()
      expect(
        events(b, kind === "mark" ? "auto" : "ultimate", "hit"),
      ).toHaveLength(0)
      expect(advanceCombatBattle(b)).toBe(b)
    },
  )
  it("terminal victory clears pending mark/burst without subsequent pulses", () => {
    let b = planted()
    b = kill(b, "e")
    expect(b.status).toBe("player-win")
    expect(a(b).mocMark).toBeUndefined()
    expect(a(b).mocBurst).toBeUndefined()
  })
  it("boss barrier absorbs skills without stripping protection or bypassing immunity", () => {
    let b = start({ nextAutoTick: 1 }, [
      seed("e", "aw2-enemy-forgotten-host", 30, {
        hp: 1000,
        maxHp: 1000,
        boss: true,
        bossProfile: "aw2-forgotten-host-development-v2",
        nextAutoTick: 10000,
      }),
    ])
    a(b, "e").bossKit!.barrierHits = 4
    a(b, "e").bossKit!.barrierExpiresAtTick = 20
    b = advanceCombatBattle(b, 5)
    expect(events(b, "auto", "hit")[0].amount).toBe(0)
    expect(a(b, "e").bossKit!.barrierHits).toBe(4)
    expect(a(b).mocMark).toBeUndefined()
  })
  it("one source replacement cannot overwrite another Mộc's mark", () => {
    let b = planted()
    const other = {
      ...a(b),
      id: "m2",
      slot: 1,
      mocMark: {
        id: "independent",
        center: 70,
        armedAtTick: 50,
        expiresAtTick: 60,
      },
      nextAutoTick: 10000,
      cast: null,
    }
    b.actors.push(other)
    a(b, "e").position = 40
    a(b).nextAutoTick = 3
    b = advanceCombatBattle(b, 2)
    expect(a(b).mocMark?.center).toBe(40)
    expect(a(b, "m2").mocMark?.center).toBe(70)
  })
  it("control/debuff immune opponents still receive ordinary damage without new control", () => {
    let b = start({ nextAutoTick: 1 }, [
      seed("e", "enemy", 30, {
        hp: 1000,
        maxHp: 1000,
        defense: 0,
        controlImmune: true,
        debuffImmune: true,
      }),
    ])
    b = advanceCombatBattle(b, 5)
    expect(events(b, "auto", "hit")[0].amount).toBe(32)
    expect(a(b, "e").slowUntilTick).toBe(0)
    expect(a(b, "e").weakenUntilTick).toBe(0)
  })
  it("a mark triggered during anticipation cannot be consumed again by the ultimate", () => {
    let b = planted()
    b = advanceCombatBattle(b, 2)
    b = ultimate(b)
    expect(a(b).mocBurst?.consumedMark).toBe(false)
    expect(events(b, "auto", "hit")).toHaveLength(1)
  })
  it("a replacement shield becomes eligible again only after its real cooldown", () => {
    let b = replacement()
    a(b).nextAutoTick = 10000
    a(b, "e").position = 90
    b = advanceCombatBattle(b, 6)
    expect(b.tick).toBe(10)
    a(b, "e").position = 40
    a(b).nextAutoTick = 11
    b = advanceCombatBattle(b, 2)
    a(b, "e").position = 50
    a(b).nextAutoTick = 13
    b = advanceCombatBattle(b, 2)
    expect(events(b, "passive", "shield")).toHaveLength(2)
    expect(a(b).shield).toBe(18)
  })
  it("ordinary projectile damage consumes the passive shield through shared damage rules", () => {
    let b = replacement()
    const serial = ++b.actionSerial
    b.effects.push({
      id: `effect:${serial}`,
      serial,
      sourceId: "e",
      skillId: "enemy:skill:basic",
      kind: "damage",
      targetId: "m",
      amount: 100,
      resolveTick: b.tick + 1,
    })
    b = advanceCombatBattle(b)
    expect(a(b).shield).toBe(0)
    expect(a(b).hp).toBeLessThan(150)
    expect(a(b).mocMark).toBeDefined()
  })
  it("old JSON with absent optional state remains replayable and pure", () => {
    const original = start({ nextAutoTick: 1 })
    const raw = JSON.stringify(original)
    let b = original
    for (let i = 0; i < 30; i++) {
      const replay = advanceCombatBattle(JSON.parse(JSON.stringify(b)))
      b = advanceCombatBattle(b)
      expect(b).toEqual(replay)
    }
    expect(JSON.stringify(original)).toBe(raw)
    expect(b.events.length).toBeLessThanOrEqual(160)
  })
  it("preparation, launch, warning, miss and removal cannot invent confirmed effects/audio", () => {
    let b = advanceCombatBattle(start({ nextBasicTick: 1 }))
    let p = reduceCombatPresentation(createCombatPresentation(), b.events)
    expect(p.effects.m).toBeUndefined()
    expect(combatAudioCues(b.events, 0)).toHaveLength(0)
    expect(
      sampleActorEffect(ROSTER_ASSETS["aw2-moc"], p.actors.m, 500, false),
    ).toBeNull()
    b = ultimate()
    p = reduceCombatPresentation(createCombatPresentation(), b.events)
    expect(p.effects.m).toBeUndefined()
    expect(combatAudioCues(b.events, 0)).toHaveLength(0)
  })
  it("actual area contacts share one gesture, own FX and cue across partial batches", () => {
    let b = advanceCombatBattle(
      start({ nextAutoTick: 1 }, [
        seed("e", "enemy", 30, { hp: 1000, maxHp: 1000 }),
        seed("f", "enemy", 32, { hp: 1000, maxHp: 1000 }),
      ]),
      5,
    )
    const hits = events(b, "auto", "hit")
    expect(hits).toHaveLength(2)
    const cut = hits[0].serial
    const first = b.events.filter((e) => e.serial <= cut)
    let p = reduceCombatPresentation(createCombatPresentation(), first)
    const serial = p.effects.m.auto.serial
    p = reduceCombatPresentation(p, b.events)
    expect(p.effects.m.auto.serial).toBe(serial)
    expect(p.effects.m.auto.targetIds).toEqual(["e", "f"])
    expect(combatAudioCues(b.events, cut)).toHaveLength(0)
    expect(combatAudioCues(b.events, 0).map((c) => c.url)).toEqual([
      ROSTER_ASSETS["aw2-moc"].skills.auto.audio.url,
    ])
    expect(
      sampleConfirmedEffect(
        ROSTER_ASSETS["aw2-moc"],
        undefined,
        p.effects.m.auto,
        0,
        false,
      ).effect,
    ).toBeTruthy()
  })
  it("practice retains five members, actual targeting/interrupt and level reset without granting ownership", () => {
    let s = createBattlePreviewSession(5, "moc")
    expect(
      s.battle.actors.filter((a) => a.side === "player").map((a) => a.spiritId),
    ).toEqual(["aw2-than", "aw2-lua", "aw2-lam", "aw2-moc-non", "aw2-moc"])
    s = reduceBattlePreviewSession(s, {
      type: "ultimate",
      actorId: "player-aw2-moc",
      targetId: "enemy-than",
    })
    expect(a(s.battle, "player-aw2-moc").cast?.targetId).toBe("enemy-than")
    s = reduceBattlePreviewSession(s, { type: "interrupt-moc" })
    expect(a(s.battle, "player-aw2-moc").cast).toBeNull()
    s = reduceBattlePreviewSession(s, { type: "reset", level: 20 })
    expect(s.practice).toBe("moc")
    expect(s.level).toBe(20)
    expect(s.battle.tick).toBe(0)
    expect(
      reduceBattlePreviewSession(createBattlePreviewSession(5), {
        type: "interrupt-moc",
      }).message,
    ).toContain("chỉ có")
  })
})
