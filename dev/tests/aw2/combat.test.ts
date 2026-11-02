import { describe, expect, it } from "vitest"
import {
  STARTER_SPIRIT_IDS,
  advanceCombatBattle,
  castCombatUltimate,
  combatSkillId,
  createCombatBattle,
  interruptCombatCast,
  type CombatBattle,
  type CombatUnitSeed,
} from "@/aw2/combat"

const enemy = (
  id: string,
  overrides: Partial<CombatUnitSeed> = {},
): CombatUnitSeed => ({
  id,
  spiritId: "aw2-enemy-test",
  nextBasicTick: 10_000,
  nextAutoTick: 10_000,
  ...overrides,
})
const player = (
  id: string,
  spiritId: (typeof STARTER_SPIRIT_IDS)[number],
  overrides: Partial<CombatUnitSeed> = {},
): CombatUnitSeed => ({
  id,
  spiritId,
  nextAutoTick: 10_000,
  ...overrides,
})
const battle = (players: CombatUnitSeed[], enemies: CombatUnitSeed[]) =>
  createCombatBattle({ id: "aw2-test", players, enemies })
const actor = (state: CombatBattle, id: string) =>
  state.actors.find((candidate) => candidate.id === id)!

describe("BATTLE-01 AW2 deterministic combat contract", () => {
  it("accepts one to five unique units and keeps the approved starter skill namespace", () => {
    const players = STARTER_SPIRIT_IDS.map((spiritId, index) =>
      player(`p${index}`, spiritId),
    )
    expect(battle(players, [enemy("e")]).actors).toHaveLength(6)
    expect(
      STARTER_SPIRIT_IDS.flatMap((spiritId) =>
        ["basic", "auto", "ultimate"].map((slot) =>
          combatSkillId(spiritId, slot as "basic" | "auto" | "ultimate"),
        ),
      ),
    ).toHaveLength(15)
    expect(() => battle([], [enemy("e")])).toThrow(/một đến năm/)
    expect(() =>
      battle([...players, player("p5", "aw2-than")], [enemy("e")]),
    ).toThrow(/một đến năm/)
    expect(() => battle([player("same", "aw2-than")], [enemy("same")])).toThrow(
      /duy nhất/,
    )
    expect(() =>
      battle([{ id: "future", spiritId: "aw2-unknown" }], [enemy("e")]),
    ).toThrow(/chưa có combat kit/)
    expect(() =>
      battle([player("dead", "aw2-than", { hp: 0 })], [enemy("e")]),
    ).toThrow(/HP không hợp lệ/)
  })

  it("replays and resumes from JSON with byte-identical deterministic output without mutating input", () => {
    const initial = battle(
      STARTER_SPIRIT_IDS.map((spiritId, index) =>
        player(`p${index}`, spiritId, { nextAutoTick: 2 + index }),
      ),
      [
        enemy("e0", { hp: 2_000, maxHp: 2_000, nextBasicTick: 2 }),
        enemy("e1", {
          hp: 2_000,
          maxHp: 2_000,
          range: 38,
          projectileTicks: 2,
          nextBasicTick: 3,
        }),
      ],
    )
    const before = JSON.stringify(initial)
    const first = advanceCombatBattle(initial, 24)
    const second = advanceCombatBattle(initial, 24)
    expect(JSON.stringify(initial)).toBe(before)
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
    const restored = JSON.parse(JSON.stringify(first)) as CombatBattle
    expect(JSON.stringify(advanceCombatBattle(restored, 8))).toBe(
      JSON.stringify(advanceCombatBattle(first, 8)),
    )
  })

  it("resolves melee at contact and ranged damage only when its launched projectile impacts", () => {
    let melee = battle(
      [player("lua", "aw2-lua", { position: 10, nextBasicTick: 0 })],
      [enemy("target", { position: 15, hp: 500, maxHp: 500 })],
    )
    melee = advanceCombatBattle(melee)
    expect(
      melee.events.filter(
        (event) =>
          event.kind === "hit" &&
          event.skillId === combatSkillId("aw2-lua", "basic"),
      ),
    ).toHaveLength(1)
    melee = advanceCombatBattle(melee)
    expect(
      melee.events.filter(
        (event) =>
          event.kind === "hit" &&
          event.skillId === combatSkillId("aw2-lua", "basic"),
      ),
    ).toHaveLength(2)

    let ranged = battle(
      [player("lam", "aw2-lam", { position: 10, nextBasicTick: 0 })],
      [enemy("target", { position: 20, hp: 500, maxHp: 500 })],
    )
    ranged = advanceCombatBattle(ranged)
    const launch = ranged.events.find(
      (event) => event.kind === "projectile-launch",
    )
    expect(launch?.resolveTick).toBe(3)
    expect(actor(ranged, "target").hp).toBe(500)
    ranged = advanceCombatBattle(ranged)
    expect(actor(ranged, "target").hp).toBe(500)
    ranged = advanceCombatBattle(ranged)
    expect(actor(ranged, "target").hp).toBeLessThan(500)
    expect(
      ranged.events.find((event) => event.kind === "hit")?.projectileId,
    ).toMatch(/^projectile:/)
  })

  it("moves a melee actor into range without teleporting through its target", () => {
    let state = battle(
      [player("than", "aw2-than", { position: 10, nextBasicTick: 0 })],
      [enemy("target", { position: 90, hp: 500, maxHp: 500 })],
    )
    state = advanceCombatBattle(state)
    expect(actor(state, "than").position).toBe(16)
    expect(state.events.some((event) => event.kind === "hit")).toBe(false)
    state = advanceCombatBattle(state, 12)
    expect(actor(state, "than").position).toBeLessThan(
      actor(state, "target").position,
    )
    expect(
      state.events.some(
        (event) => event.kind === "hit" && event.sourceId === "than",
      ),
    ).toBe(true)
  })

  it("validates, spends and interrupts a manual ultimate while an earlier projectile remains authoritative", () => {
    const low = battle(
      [player("lam", "aw2-lam", { energy: 99 })],
      [enemy("target", { position: 30, hp: 500, maxHp: 500 })],
    )
    expect(() => castCombatUltimate(low, "lam")).toThrow(/năng lượng/)
    const offensive = battle(
      [player("lua", "aw2-lua", { energy: 100 })],
      [enemy("target")],
    )
    expect(() => castCombatUltimate(offensive, "lua")).toThrow(/mục tiêu địch/)

    let state = battle(
      [
        player("lam", "aw2-lam", {
          energy: 100,
          position: 10,
          nextBasicTick: 0,
        }),
      ],
      [enemy("target", { position: 20, hp: 500, maxHp: 500 })],
    )
    state = advanceCombatBattle(state)
    const hpBeforeImpact = actor(state, "target").hp
    state = castCombatUltimate(state, "lam")
    expect(actor(state, "lam").energy).toBe(0)
    expect(() => castCombatUltimate(state, "lam")).toThrow(/đang thi triển/)
    state = interruptCombatCast(state, "lam")
    expect(actor(state, "lam").cast).toBeNull()
    expect(actor(state, "lam").energy).toBe(0)
    state = advanceCombatBattle(state, 2)
    expect(actor(state, "target").hp).toBeLessThan(hpBeforeImpact)
    expect(
      state.events.some(
        (event) =>
          event.kind === "heal" &&
          event.skillId === combatSkillId("aw2-lam", "ultimate"),
      ),
    ).toBe(false)
  })

  it("falls back deterministically when an ultimate target is defeated before commit", () => {
    let state = battle(
      [
        player("lua", "aw2-lua", { energy: 100, nextBasicTick: 10_000 }),
        player("than", "aw2-than", {
          attack: 1_000,
          range: 100,
          nextBasicTick: 1,
        }),
      ],
      [
        enemy("first", { hp: 1, maxHp: 1, position: 20 }),
        enemy("fallback", { hp: 1_000, maxHp: 1_000, position: 22 }),
      ],
    )
    state = castCombatUltimate(state, "lua", "first")
    state = advanceCombatBattle(state, 2)
    expect(actor(state, "first").hp).toBe(0)
    expect(
      state.events.some(
        (event) =>
          event.kind === "hit" &&
          event.sourceId === "lua" &&
          event.targetIds.includes("fallback") &&
          event.skillId === combatSkillId("aw2-lua", "ultimate"),
      ),
    ).toBe(true)
  })
})

describe("BATTLE-01 bounded starter passives", () => {
  it("arms Than once when a shield ends and consumes the weaken on one later basic", () => {
    let state = battle(
      [
        player("than", "aw2-than", {
          position: 10,
          nextAutoTick: 0,
          nextBasicTick: 6,
        }),
      ],
      [enemy("target", { position: 15, hp: 2_000, maxHp: 2_000 })],
    )
    state = advanceCombatBattle(state, 7)
    const passiveEvents = state.events.filter(
      (event) => event.skillId === combatSkillId("aw2-than", "passive"),
    )
    expect(
      passiveEvents.some((event) => event.text?.includes("sẵn sàng")),
    ).toBe(true)
    expect(
      passiveEvents.filter((event) => event.text?.includes("làm yếu")),
    ).toHaveLength(1)
    expect(actor(state, "than").passive.thanArmed).toBe(false)
    expect(actor(state, "target").weakenUntilTick).toBeGreaterThan(state.tick)
  })

  it("caps Lửa Nhỏ focus, Lam Lam overheal shield, Mộc Non cadence and Sương Lành slow", () => {
    let lua = battle(
      [player("lua", "aw2-lua", { position: 10, nextBasicTick: 1 })],
      [enemy("target", { position: 15, hp: 2_000, maxHp: 2_000 })],
    )
    lua = advanceCombatBattle(lua, 6)
    expect(
      lua.events.filter(
        (event) => event.skillId === combatSkillId("aw2-lua", "passive"),
      ),
    ).toHaveLength(1)
    expect(actor(lua, "lua").passive.luaFocus).toBeLessThan(3)

    let lam = battle(
      [
        player("lam", "aw2-lam", { nextAutoTick: 0, nextBasicTick: 10_000 }),
        player("than", "aw2-than", {
          hp: 219,
          maxHp: 220,
          nextBasicTick: 10_000,
        }),
      ],
      [enemy("target")],
    )
    lam = advanceCombatBattle(lam, 2)
    expect(actor(lam, "than").hp).toBe(220)
    expect(actor(lam, "than").shield).toBe(44)

    let moc = battle(
      [
        player("moc", "aw2-moc-non", {
          nextAutoTick: 0,
          nextBasicTick: 10_000,
        }),
        player("than", "aw2-than", { nextBasicTick: 10_000 }),
        player("lua", "aw2-lua", { nextBasicTick: 10_000 }),
      ],
      [enemy("target")],
    )
    moc = advanceCombatBattle(moc, 10)
    expect(
      moc.events.filter(
        (event) => event.skillId === combatSkillId("aw2-moc-non", "passive"),
      ),
    ).toHaveLength(1)
    expect(actor(moc, "moc").passive.mocSupportedIds).toEqual([])

    let suong = battle(
      [
        player("suong", "aw2-suong", {
          position: 30,
          nextAutoTick: 0,
          nextBasicTick: 10_000,
        }),
      ],
      [enemy("target", { position: 50, hp: 2_000, maxHp: 2_000 })],
    )
    suong = advanceCombatBattle(suong, 5)
    expect(
      suong.events.filter(
        (event) =>
          event.kind === "hit" &&
          event.skillId === combatSkillId("aw2-suong", "auto"),
      ),
    ).toHaveLength(3)
    expect(
      suong.events.filter(
        (event) => event.skillId === combatSkillId("aw2-suong", "passive"),
      ),
    ).toHaveLength(1)
  })

  it("uses Mộc Non's ultimate as one finite interrupt guard, not immunity", () => {
    let state = battle(
      [
        player("moc", "aw2-moc-non", { energy: 100, nextBasicTick: 10_000 }),
        player("lam", "aw2-lam", { energy: 100, nextBasicTick: 10_000 }),
      ],
      [enemy("target")],
    )
    state = castCombatUltimate(state, "moc")
    state = advanceCombatBattle(state)
    state = castCombatUltimate(state, "lam")
    state = interruptCombatCast(state, "lam")
    expect(actor(state, "lam").cast).not.toBeNull()
    expect(actor(state, "lam").interruptGuardCharges).toBe(0)
    state = interruptCombatCast(state, "lam")
    expect(actor(state, "lam").cast).toBeNull()
    expect(
      state.events.filter((event) => event.kind === "interrupt-resist"),
    ).toHaveLength(1)
    expect(
      state.events.filter((event) => event.kind === "interrupt"),
    ).toHaveLength(1)
  })

  it("settles simultaneous projectile defeats once and never creates rewards or save outcomes", () => {
    let state = battle(
      [
        player("lam", "aw2-lam", {
          hp: 10,
          maxHp: 10,
          attack: 1_000,
          range: 100,
          projectileTicks: 2,
          nextBasicTick: 1,
        }),
      ],
      [
        enemy("target", {
          hp: 10,
          maxHp: 10,
          attack: 1_000,
          range: 100,
          projectileTicks: 2,
          nextBasicTick: 1,
        }),
      ],
    )
    state = advanceCombatBattle(state, 3)
    expect(state.status).toBe("draw")
    expect(
      state.events.filter((event) => event.kind === "battle-end"),
    ).toHaveLength(1)
    expect("reward" in state).toBe(false)
    expect("save" in state).toBe(false)
    expect(advanceCombatBattle(state)).toBe(state)
  })
})
