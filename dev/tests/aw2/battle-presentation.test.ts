import { describe, expect, it } from "vitest"
import {
  DEVELOPMENT_LEVELING_ID,
  MAX_DEVELOPMENT_LEVEL,
  createCombatPresentation,
  createDevelopmentStarterSeed,
  developmentProgression,
  developmentStarterStats,
  experienceToReachLevel,
  reduceCombatPresentation,
  type CombatEvent,
} from "@/aw2/combat"

const event = (
  serial: number,
  kind: CombatEvent["kind"],
  overrides: Partial<CombatEvent> = {},
): CombatEvent => ({
  serial,
  tick: serial,
  kind,
  sourceId: "source",
  targetIds: ["target"],
  ...overrides,
})

describe("BATTLE-01 AW2 event-driven presentation", () => {
  it("reduces ordered events deterministically and ignores an already consumed batch", () => {
    const events = [
      event(1, "cast-start", { skillId: "aw2-lua:skill:ultimate" }),
      event(2, "cast-commit", { skillId: "aw2-lua:skill:ultimate" }),
      event(3, "hit", {
        skillId: "aw2-lua:skill:ultimate",
        amount: 42,
      }),
    ]
    const first = reduceCombatPresentation(createCombatPresentation(), events)
    const second = reduceCombatPresentation(first, events)
    expect(second).toBe(first)
    expect(first.lastSerial).toBe(3)
    expect(first.actors.source.state).toBe("attack")
    expect(first.actors.target.state).toBe("hit")
    expect(first.floating.at(-1)?.text).toBe("-42")
    expect(JSON.stringify(first)).toBe(
      JSON.stringify(
        reduceCombatPresentation(createCombatPresentation(), events),
      ),
    )
  })

  it("keeps a launched projectile until an authoritative hit or miss settles it", () => {
    const launch = event(1, "projectile-launch", {
      tick: 3,
      skillId: "aw2-lam:skill:basic",
      projectileId: "projectile:1",
      resolveTick: 5,
    })
    const launched = reduceCombatPresentation(createCombatPresentation(), [
      launch,
    ])
    expect(launched.projectiles["projectile:1"]).toMatchObject({
      launchTick: 3,
      resolveTick: 5,
      sourceId: "source",
      targetId: "target",
    })
    const settled = reduceCombatPresentation(launched, [
      launch,
      event(2, "hit", {
        tick: 5,
        skillId: "aw2-lam:skill:basic",
        projectileId: "projectile:1",
        amount: 17,
      }),
    ])
    expect(settled.projectiles).toEqual({})
    expect(settled.actors.target.state).toBe("hit")
  })

  it("maps support, interrupt, defeat and terminal events without outcome authority", () => {
    const state = reduceCombatPresentation(createCombatPresentation(), [
      event(1, "heal", { amount: 12 }),
      event(2, "shield", { amount: 9 }),
      event(3, "interrupt-resist", { text: "Giữ nhịp" }),
      event(4, "defeat"),
      event(5, "battle-end", {
        sourceId: null,
        targetIds: [],
        text: "player-win",
      }),
    ])
    expect(state.actors.target.state).toBe("defeat")
    expect(state.terminal).toMatchObject({ text: "player-win", tick: 5 })
    expect(state.floating.map((item) => item.text)).toEqual([
      "+12",
      "Khiên +9",
      "Giữ nhịp",
      "player-win",
    ])
    expect("hp" in state).toBe(false)
    expect("reward" in state).toBe(false)
    expect("save" in state).toBe(false)
  })

  it("cancels unfinished visual flights on terminal without inventing impact outcomes", () => {
    const launched = reduceCombatPresentation(createCombatPresentation(), [
      event(1, "projectile-launch", {
        tick: 1,
        skillId: "aw2-lam:skill:basic",
        projectileId: "projectile:pending",
        resolveTick: 3,
      }),
    ])
    const terminal = event(2, "battle-end", {
      tick: 2,
      sourceId: null,
      targetIds: [],
      text: "player-win",
    })
    const ended = reduceCombatPresentation(launched, [terminal])
    expect(Object.keys(launched.projectiles)).toEqual(["projectile:pending"])
    expect(ended.projectiles).toEqual({})
    expect(ended.terminal?.text).toBe("player-win")
    expect(ended.floating.map((item) => item.kind)).toEqual(["battle-end"])
    expect(reduceCombatPresentation(ended, [terminal])).toBe(ended)
  })

  it("rejects gaps and incomplete projectile presentation metadata", () => {
    expect(() =>
      reduceCombatPresentation(createCombatPresentation(), [event(2, "move")]),
    ).toThrow(/liên tục/)
    expect(() =>
      reduceCombatPresentation(createCombatPresentation(), [
        event(1, "projectile-launch", {
          skillId: "aw2-lam:skill:basic",
          projectileId: "projectile:1",
        }),
      ]),
    ).toThrow(/Projectile event/)
  })
})

describe("AW2 development-only leveling projection", () => {
  it("uses monotonic thresholds and caps safely at development level 20", () => {
    const thresholds = Array.from(
      { length: MAX_DEVELOPMENT_LEVEL },
      (_, index) => experienceToReachLevel(index + 1),
    )
    expect(thresholds[0]).toBe(0)
    expect(
      thresholds.every(
        (value, index) => !index || value > thresholds[index - 1],
      ),
    ).toBe(true)
    expect(developmentProgression(thresholds[9]).level).toBe(10)
    const capped = developmentProgression(Number.MAX_SAFE_INTEGER)
    expect(capped).toMatchObject({
      tuningId: DEVELOPMENT_LEVELING_ID,
      level: 20,
      experienceForNextLevel: null,
    })
  })

  it("rejects invalid XP and produces monotonic starter combat stats", () => {
    expect(() => developmentProgression(-1)).toThrow(/không âm/)
    expect(() => developmentProgression(1.5)).toThrow(/số nguyên/)
    const level1 = developmentStarterStats("aw2-than", 1)
    const level10 = developmentStarterStats("aw2-than", 10)
    const level20 = developmentStarterStats("aw2-than", 20)
    expect(level10.maxHp).toBeGreaterThan(level1.maxHp)
    expect(level20.attack).toBeGreaterThan(level10.attack)
    expect(level20.defense).toBeGreaterThan(level10.defense)
    expect(() => developmentStarterStats("aw2-than", 21)).toThrow(/1 đến 20/)
  })

  it("creates a fresh full-health seed without mutating caller overrides", () => {
    const overrides = { energy: 100, position: 24 }
    const before = JSON.stringify(overrides)
    const seed = createDevelopmentStarterSeed(
      "player-than",
      "aw2-than",
      experienceToReachLevel(5),
      overrides,
    )
    expect(JSON.stringify(overrides)).toBe(before)
    expect(seed).toMatchObject({
      id: "player-than",
      spiritId: "aw2-than",
      energy: 100,
      position: 24,
    })
    expect(seed.hp).toBe(seed.maxHp)
    expect(seed.maxHp).toBeGreaterThan(220)
    expect(() => createDevelopmentStarterSeed(" ", "aw2-than", 0)).toThrow(
      /để trống/,
    )
  })
})
