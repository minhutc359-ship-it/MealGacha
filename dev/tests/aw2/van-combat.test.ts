import { describe, expect, it } from "vitest"
import {
  createCombatBattle,
  advanceCombatBattle,
  castCombatUltimate,
  interruptCombatCast,
  cleanseVanLinks,
  createDevelopmentCombatSeed,
  experienceToReachLevel,
  COMBAT_KITS,
  STARTER_SPIRIT_IDS,
  vanAlly,
  vanThreats,
  vanEnemy,
  vanDamageMultiplier,
  createCombatPresentation,
  reduceCombatPresentation,
  type CombatBattle,
  type CombatUnitSeed,
  type VanEmphasis,
} from "@/aw2/combat"
import { combatAudioCues } from "@/aw2/combat/audio"
import {
  createBattlePreviewSession,
  reduceBattlePreviewSession,
} from "../../aw2/battleSession"
import { ROSTER_ASSETS } from "@/aw2/assets/roster"
const seed = (
  id: string,
  spiritId: string,
  position: number,
  extra: Partial<CombatUnitSeed> = {},
) => ({
  id,
  spiritId,
  position,
  nextBasicTick: 10000,
  nextAutoTick: 10000,
  moveSpeed: 1,
  ...extra,
})
const start = (
  extra: Partial<CombatUnitSeed> = {},
  allies = [seed("a", "aw2-lua", 14, { maxHp: 200, hp: 100 })],
  enemies = [seed("e", "enemy", 30, { maxHp: 10000, hp: 10000, defense: 0 })],
) =>
  createCombatBattle({
    id: "van-contract",
    players: [seed("v", "aw2-van", 10, { energy: 100, ...extra }), ...allies],
    enemies,
  })
const a = (b: CombatBattle, id = "v") => b.actors.find((a) => a.id === id)!
const ev = (b: CombatBattle, slot: string, kind?: string) =>
  b.events.filter(
    (e) => e.skillId === `aw2-van:skill:${slot}` && (!kind || e.kind === kind),
  )
function threat(b: CombatBattle, id = "a", extra = {}) {
  const serial = ++b.actionSerial
  b.effects.push({
    id: `fixture:${serial}`,
    serial,
    sourceId: "e",
    targetId: id,
    skillId: "fixture:skill:basic",
    kind: "damage",
    amount: 1,
    resolveTick: b.tick + 3,
    ...extra,
  })
  return b
}
const link = (b = threat(start())) => {
  a(b).nextAutoTick = b.tick + 1
  return advanceCombatBattle(b, 2)
}
const ult = (b = start()) =>
  advanceCombatBattle(
    castCombatUltimate(b, "v", a(b).vanEmphasis === "attack" ? "e" : undefined),
    2,
  )

describe("AW2-007K Vân hybrid and immutable pre-battle emphasis", () => {
  it("has four authored names, Hybrid role, and no ownership grant", () => {
    expect(
      Object.values(ROSTER_ASSETS["aw2-van"].skills).map((s) => s.displayName),
    ).toEqual(["Mảnh Âm", "Nối Hai Đầu", "Nhớ Một Phần", "Bữa Ăn Chưa Gọi Tên"])
    expect(COMBAT_KITS["aw2-van"].role).toBe("hybrid")
    expect(STARTER_SPIRIT_IDS).toHaveLength(5)
    expect(STARTER_SPIRIT_IDS).not.toContain("aw2-van")
  })
  it.each([1, 5, 10, 20])("uses existing level %i curve", (level) => {
    const s = createDevelopmentCombatSeed(
      "v",
      "aw2-van",
      experienceToReachLevel(level),
    )
    expect(s.maxHp).toBe(Math.round(155 * (1 + (level - 1) * 0.055)))
    expect(s.attack).toBeGreaterThanOrEqual(26)
  })
  it.each(["protection", "attack"] as const)(
    "stores chosen %s and JSON replays",
    (vanEmphasis) => {
      const b = start({ vanEmphasis })
      expect(a(b).vanEmphasis).toBe(vanEmphasis)
      expect(advanceCombatBattle(JSON.parse(JSON.stringify(b)), 8)).toEqual(
        advanceCombatBattle(b, 8),
      )
    },
  )
  it("defaults to protection and supports older JSON without the field", () => {
    const b = start()
    expect(a(b).vanEmphasis).toBe("protection")
    delete (a(b) as { vanEmphasis?: VanEmphasis }).vanEmphasis
    expect(ev(ult(b), "ultimate", "shield")).toHaveLength(2)
  })
  it("rejects invalid emphasis and emphasis on a different character", () => {
    expect(() => start({ vanEmphasis: "both" as VanEmphasis })).toThrow(
      "trước trận",
    )
    expect(() =>
      start({}, [seed("x", "aw2-lua", 14, { vanEmphasis: "attack" })]),
    ).toThrow("trước trận")
  })
  it("basic launches once, waits for real impact and never heals or marks", () => {
    let b = advanceCombatBattle(start({ nextBasicTick: 1 }))
    expect(ev(b, "basic", "projectile-launch")).toHaveLength(1)
    expect(ev(b, "basic", "hit")).toHaveLength(0)
    b = advanceCombatBattle(b, 2)
    expect(ev(b, "basic", "hit")).toHaveLength(1)
    expect(ev(b, "passive")).toHaveLength(0)
    expect(a(b).vanLink).toBeUndefined()
  })
  it("counts pending targeted, area, cast and boss threats but excludes friendly effects", () => {
    const b = threat(start())
    threat(b, "x", { areaCenter: 14, areaRadius: 2 })
    threat(b, "a", { sourceId: "v" })
    a(b, "e").cast = {
      id: "cast",
      sourceId: "e",
      slot: "auto",
      skillId: "aw2-lua:skill:auto",
      targetId: "a",
      commitTick: 4,
    }
    expect(vanThreats(b, a(b), a(b, "a"))).toBe(3)
    a(b, "e").bossKit = {
      profile: "aw2-forgotten-host-development-v2",
      nextSkillTick: 8,
      phase: 0,
      barrierHits: 0,
      barrierExpiresAtTick: 0,
      intent: {
        kind: "sweep",
        startedTick: 0,
        resolveTick: 4,
        areaCenter: 14,
        areaRadius: 2,
      },
    }
    expect(vanThreats(b, a(b), a(b, "a"))).toBe(3)
  })
  it("threat count wins before HP ratio, then HP ratio selects", () => {
    const b = threat(
      start({}, [
        seed("a", "aw2-lua", 14, { hp: 90, maxHp: 100 }),
        seed("c", "aw2-lam", 18, { hp: 10, maxHp: 100 }),
      ]),
    )
    threat(b)
    threat(b, "c")
    expect(vanAlly(b, a(b))?.id).toBe("a")
    threat(b, "c")
    expect(vanAlly(b, a(b))?.id).toBe("c")
  })
  it("uses distance then slot/ID for tied threatened allies and closest-to-ally enemy", () => {
    const b = threat(
      start(
        {},
        [seed("a", "aw2-lua", 14), seed("c", "aw2-lam", 18)],
        [seed("e", "enemy", 35), seed("f", "enemy", 24)],
      ),
    )
    threat(b, "c")
    expect(vanAlly(b, a(b))?.id).toBe("a")
    expect(vanEnemy(b, a(b), a(b, "c"))?.id).toBe("f")
  })
  it.each(["full", "dead", "far", "summoned"])(
    "excludes %s ally from support",
    (kind) => {
      const b = threat(start())
      if (kind === "full") a(b, "a").shield = 90
      if (kind === "dead") a(b, "a").hp = 0
      if (kind === "far") a(b, "a").position = 60
      if (kind === "summoned") a(b, "a").summoned = true
      expect(vanAlly(b, a(b))).toBeUndefined()
    },
  )
  it("can protect self against an actual threat", () => {
    const b = link(threat(start(), "v"))
    expect(a(b).shield).toBe(22)
  })
  it("grants exact positive shield and one source-owned mark", () => {
    const b = link()
    expect(a(b, "a").shield).toBe(22)
    expect(a(b).vanLink).toMatchObject({
      enemyId: "e",
      allyId: "a",
      supportedShield: 22,
      endsAtTick: 6,
    })
    expect(vanDamageMultiplier(b, a(b, "e"))).toBe(0.9)
    expect(ev(b, "auto", "shield")[0].amount).toBe(22)
  })
  it("records only actual cap room, never extends a full shield", () => {
    let b = threat(start())
    a(b, "a").shield = 89
    a(b, "a").shieldExpiresAtTick = 20
    b = link(b)
    expect(a(b).vanLink?.supportedShield).toBe(1)
    expect(a(b, "a").shield).toBe(90)
    const c = link(threat(start()))
    c.effects = []
    a(c, "a").shield = 90
    a(c, "a").shieldExpiresAtTick = 50
    threat(c)
    a(c).nextAutoTick = c.tick + 1
    const d = advanceCombatBattle(c, 2)
    expect(a(d, "a").shieldExpiresAtTick).toBe(50)
    expect(ev(d, "auto", "shield")).toHaveLength(1)
  })
  it.each(["threat", "range", "dead"])(
    "revalidates original ally after %s change without retarget",
    (kind) => {
      let b = threat(
        start({}, [seed("a", "aw2-lua", 14), seed("c", "aw2-lam", 18)]),
      )
      a(b).nextAutoTick = 1
      b = advanceCombatBattle(b)
      if (kind === "threat") b.effects = []
      if (kind === "range") a(b, "a").position = 60
      if (kind === "dead") a(b, "a").hp = 0
      threat(b, "c")
      b = advanceCombatBattle(b)
      expect(ev(b, "auto", "shield")).toHaveLength(0)
      expect(a(b).vanLink?.supportedShield).toBe(0)
    },
  )
  it("support half survives an immune enemy and cannot invent passive credit", () => {
    const b = threat(start())
    a(b, "e").debuffImmune = true
    const c = link(b)
    expect(ev(c, "auto", "shield")).toHaveLength(1)
    expect(a(c).vanLink).toBeUndefined()
    expect(ev(advanceCombatBattle(c, 6), "passive", "heal")).toHaveLength(0)
  })
  it("enemy half works without threatened ally and never heals for free", () => {
    let b = link(start())
    expect(a(b).vanLink?.supportedShield).toBe(0)
    b = advanceCombatBattle(b, 6)
    expect(ev(b, "passive", "heal")).toHaveLength(0)
  })
  it.each(["dead", "range", "immune"])(
    "does not retarget enemy after %s change",
    (kind) => {
      let b = threat(
        start({}, undefined, [seed("e", "enemy", 30), seed("f", "enemy", 34)]),
      )
      a(b).nextAutoTick = 1
      b = advanceCombatBattle(b)
      if (kind === "dead") a(b, "e").hp = 0
      if (kind === "range") a(b, "e").position = 80
      if (kind === "immune") a(b, "e").debuffImmune = true
      b = advanceCombatBattle(b)
      expect(a(b).vanLink).toBeUndefined()
      expect(ev(b, "auto", "shield")).toHaveLength(1)
    },
  )
  it("does not start or pay cooldown if neither half is eligible", () => {
    const b = start({ nextAutoTick: 1 }, [], [seed("e", "enemy", 90)])
    const c = advanceCombatBattle(b)
    expect(a(c).cast).toBeNull()
    expect(a(c).nextAutoTick).toBe(1)
  })
  it("mark reduces real damage and uses strongest-only with weaken/Muối", () => {
    const b = link()
    a(b, "a").shield = 0
    const damage = (x: CombatBattle) => {
      threat(x, "a", { amount: 40, resolveTick: x.tick + 1 })
      return advanceCombatBattle(x)
        .events.filter(
          (e) => e.skillId === "fixture:skill:basic" && e.kind === "hit",
        )
        .at(-1)!.amount
    }
    const c = structuredClone(b)
    a(c, "e").weakenUntilTick = 20
    expect(damage(structuredClone(b))).toBe(
      Math.round((36 * 100) / (100 + a(b, "a").defense)),
    )
    expect(damage(c)).toBe(Math.round((30 * 100) / (100 + a(c, "a").defense)))
  })
  it.each(["expiry", "cleanse", "defeat"])(
    "removes link before one earned heal on %s",
    (reason) => {
      let b = link()
      const hp = a(b, "a").hp
      if (reason === "expiry") b = advanceCombatBattle(b, 4)
      if (reason === "cleanse") b = cleanseVanLinks(b, "e")
      if (reason === "defeat") {
        a(b, "e").hp = 0
        b.actors.push({ ...a(b, "e"), id: "f", hp: 10000 })
        b = advanceCombatBattle(b)
      }
      expect(a(b).vanLink).toBeUndefined()
      expect(ev(b, "passive", "heal")).toHaveLength(1)
      expect(ev(b, "passive", "heal")[0].amount).toBe(11)
      expect(a(b).vanPassiveUntilTick).toBe(b.tick + 8)
      expect(a(b, "a").hp).toBeGreaterThanOrEqual(hp + 10)
      expect(
        cleanseVanLinks(b, reason === "defeat" ? "f" : "e").events,
      ).toEqual(b.events)
    },
  )
  it("bounds healing to shield actually granted and missing HP", () => {
    let b = threat(start())
    a(b, "a").shield = 89
    b = link(b)
    b = cleanseVanLinks(b, "e")
    expect(ev(b, "passive", "heal")[0].amount).toBe(1)
  })
  it.each(["source", "terminal", "full", "dead", "far", "cooldown"])(
    "gives no passive for %s cancellation/ineligibility",
    (kind) => {
      let b = link()
      if (kind === "source") a(b).hp = 0
      if (kind === "terminal") a(b, "e").hp = 0
      if (kind === "full") a(b, "a").hp = a(b, "a").maxHp
      if (kind === "dead") a(b, "a").hp = 0
      if (kind === "far") a(b, "a").position = 80
      if (kind === "cooldown") a(b).vanPassiveUntilTick = 100
      b = advanceCombatBattle(b, 4)
      expect(a(b).vanLink).toBeUndefined()
      expect(ev(b, "passive", "heal")).toHaveLength(0)
    },
  )
  it("replacement is bounded, cancels without heal, and does not accumulate links", () => {
    let b = link()
    threat(b)
    a(b).nextAutoTick = b.tick + 1
    b = advanceCombatBattle(b, 2)
    expect(
      ev(b, "auto", "status").filter((e) => e.statusChange === "apply"),
    ).toHaveLength(2)
    expect(ev(b, "passive", "heal")).toHaveLength(0)
    expect(a(b).vanLink?.endsAtTick).toBe(8)
  })
  it("protection ultimate only grants nearby living nonsummoned shields", () => {
    const b = ult(
      start({}, [seed("a", "aw2-lua", 14), seed("c", "aw2-lam", 60)]),
    )
    expect(ev(b, "ultimate", "shield").map((e) => e.targetIds[0])).toEqual([
      "v",
      "a",
    ])
    expect(ev(b, "ultimate", "shield")[0].amount).toBe(33)
    expect(ev(b, "ultimate", "hit")).toHaveLength(0)
    expect(a(b).energy).toBe(0)
    expect(a(b).vanLink).toBeUndefined()
  })
  it("attack ultimate hits at most three by center-distance and grants no shields", () => {
    const b = ult(
      start({ vanEmphasis: "attack" }, undefined, [
        seed("e", "enemy", 30),
        seed("f", "enemy", 31),
        seed("g", "enemy", 33),
        seed("h", "enemy", 35),
      ]),
    )
    expect(ev(b, "ultimate", "hit").map((e) => e.targetIds[0])).toEqual([
      "e",
      "f",
      "g",
    ])
    expect(ev(b, "ultimate", "shield")).toHaveLength(0)
    expect(a(b).energy).toBe(0)
    expect(() => castCombatUltimate(b, "v", "e")).toThrow("năng lượng")
  })
  it("attack requires live selected enemy in range before paying energy", () => {
    const b = start({ vanEmphasis: "attack" })
    expect(() => castCombatUltimate(b, "v")).toThrow("mục tiêu")
    a(b, "e").position = 80
    expect(() => castCombatUltimate(b, "v", "e")).toThrow("ngoài tầm")
    expect(a(b).energy).toBe(100)
  })
  it.each(["dead", "range"])(
    "attack loses original target after %s without retarget or refund",
    (kind) => {
      let b = castCombatUltimate(
        start({ vanEmphasis: "attack" }, undefined, [
          seed("e", "enemy", 30),
          seed("f", "enemy", 32),
        ]),
        "v",
        "e",
      )
      if (kind === "dead") a(b, "e").hp = 0
      else a(b, "e").position = 80
      b = advanceCombatBattle(b, 2)
      expect(ev(b, "ultimate", "hit")).toHaveLength(0)
      expect(ev(b, "ultimate", "miss")).toHaveLength(1)
      expect(a(b).energy).toBe(0)
    },
  )
  it.each(["protection", "attack"] as const)(
    "interrupt spends energy without either %s branch",
    (vanEmphasis) => {
      let b = castCombatUltimate(
        start({ vanEmphasis }),
        "v",
        vanEmphasis === "attack" ? "e" : undefined,
      )
      b = interruptCombatCast(b, "v")
      b = advanceCombatBattle(b, 3)
      expect(a(b).energy).toBe(0)
      expect(
        ev(b, "ultimate").filter((e) =>
          ["shield", "hit", "heal"].includes(e.kind),
        ),
      ).toHaveLength(0)
    },
  )
  it("groups positive actual recipient FX and audio across partial batches; preparation/removal silent", () => {
    const b = ult()
    const p = reduceCombatPresentation(createCombatPresentation(), b.events)
    expect(p.effects.v.ultimate?.targetIds).toEqual(["v", "a"])
    expect(
      combatAudioCues(b.events, 0).filter((c) => c.slot === "ultimate"),
    ).toHaveLength(1)
    const first = ev(b, "ultimate", "shield")[0]
    expect(combatAudioCues(b.events, first.serial)).toHaveLength(0)
    let partial = createCombatPresentation()
    for (const e of b.events) partial = reduceCombatPresentation(partial, [e])
    expect(partial).toEqual(p)
    const c = cleanseVanLinks(link(start()), "e")
    expect(
      combatAudioCues(c.events, 0).filter((x) => x.slot === "passive"),
    ).toHaveLength(0)
  })
  it("pending reset choice changes only a fresh battle identity, never current battle or starters", () => {
    const s = createBattlePreviewSession(5, "van")
    expect(s.battle.actors.filter((a) => a.side === "player")).toHaveLength(5)
    const t = reduceBattlePreviewSession(s, {
      type: "reset",
      level: 20,
      vanEmphasis: "attack",
    })
    expect(a(s.battle, "player-aw2-van").vanEmphasis).toBe("protection")
    expect(a(t.battle, "player-aw2-van").vanEmphasis).toBe("attack")
    expect(t.battle.id).not.toBe(s.battle.id)
    expect(
      reduceBattlePreviewSession(t, {
        type: "reset",
        level: 5,
      }).battle.actors.find((a) => a.spiritId === "aw2-van")?.vanEmphasis,
    ).toBe("attack")
    expect(
      createBattlePreviewSession(5).battle.actors.some(
        (a) => a.spiritId === "aw2-van",
      ),
    ).toBe(false)
  })
  it("practice counterplay is scoped and cannot change the active mode", () => {
    const s = createBattlePreviewSession(5)
    expect(
      reduceBattlePreviewSession(s, { type: "interrupt-van" }).battle,
    ).toBe(s.battle)
    expect(
      reduceBattlePreviewSession(s, {
        type: "cleanse-van",
        targetId: "enemy-than",
      }).battle,
    ).toBe(s.battle)
    const v = createBattlePreviewSession(5, "van", "attack")
    expect(
      reduceBattlePreviewSession(v, {
        type: "cleanse-van",
        targetId: "player-aw2-van",
      }).message,
    ).toMatch(/chọn địch/)
    expect(
      a(
        reduceBattlePreviewSession(v, { type: "advance" }).battle,
        "player-aw2-van",
      ).vanEmphasis,
    ).toBe("attack")
  })
  it("Muối/weaken and two source links use strongest debuff without multiplication", () => {
    const b = link()
    a(b, "e").muoiMarks = {
      v: { appliedTick: 0, expiresAtTick: 20, capTick: 20 },
    }
    b.actors.push({ ...a(b), id: "v2", slot: 2 })
    a(b, "a").shield = 0
    b.effects = []
    threat(b, "a", { amount: 100, resolveTick: 3 })
    const c = advanceCombatBattle(b)
    expect(
      c.events
        .filter((e) => e.skillId === "fixture:skill:basic" && e.kind === "hit")
        .at(-1)?.amount,
    ).toBe(Math.round((80 * 100) / (100 + a(b, "a").defense)))
  })
  it("boss protection blocks attack outcome without bypass", () => {
    const b = start({ vanEmphasis: "attack" }, undefined, [
      seed("e", "aw2-enemy-forgotten-host", 30, {
        boss: true,
        bossProfile: "aw2-forgotten-host-development-v2",
      }),
    ])
    a(b, "e").bossKit!.barrierHits = 4
    a(b, "e").bossKit!.barrierExpiresAtTick = 20
    a(b, "e").bossKit!.nextSkillTick = 100
    const c = ult(b)
    expect(ev(c, "ultimate", "hit")[0].amount).toBe(0)
    expect(a(c, "e").bossKit!.barrierHits).toBe(4)
  })
  it("positive passive starts cooldown; a second supported link cannot heal during it", () => {
    let b = cleanseVanLinks(link(), "e")
    const until = a(b).vanPassiveUntilTick
    threat(b)
    a(b).nextAutoTick = b.tick + 1
    b = advanceCombatBattle(b, 2)
    b = cleanseVanLinks(b, "e")
    expect(ev(b, "passive", "heal")).toHaveLength(1)
    expect(a(b).vanPassiveUntilTick).toBe(until)
  })
  it("zero missing HP consumes no passive cooldown or outcome cue", () => {
    let b = link()
    a(b, "a").hp = a(b, "a").maxHp
    b = cleanseVanLinks(b, "e")
    expect(a(b).vanPassiveUntilTick).toBeUndefined()
    expect(ev(b, "passive", "heal")).toHaveLength(0)
    expect(
      combatAudioCues(b.events, ev(b, "auto", "status")[0].serial),
    ).toHaveLength(0)
  })
  it("terminal and source death cancel uncommitted ultimates", () => {
    let b = castCombatUltimate(start(), "v")
    a(b).hp = 0
    b = advanceCombatBattle(b, 2)
    expect(ev(b, "ultimate", "shield")).toHaveLength(0)
    expect(a(b).cast).toBeNull()
  })
  it("an area target ID cannot threaten an ally outside its actual radius", () => {
    const b = threat(start(), "a", { areaCenter: 80, areaRadius: 2 })
    expect(vanThreats(b, a(b), a(b, "a"))).toBe(0)
    expect(vanAlly(b, a(b))).toBeUndefined()
  })
})
