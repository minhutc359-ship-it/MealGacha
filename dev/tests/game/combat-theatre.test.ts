import { describe, expect, it } from "vitest"
import { actBattle, cardCost, previewTarget, startBattle } from "@/game/battle"
import { CARD_MAP, STARTER_DECK } from "@/game/catalog"
import { newGame, settleBattle } from "@/game/progression"
import { parseGame } from "@/game/storage"
import { SCENES, BOSS_RULES, ENDINGS } from "@/game/narrative"
import { STAGES } from "@/game/story"
import type { BattleUnit } from "@/game/types"
const rng = () => 0.37
function arena(stage: string | null = null) {
  const b = startBattle(STARTER_DECK, stage, "courage", rng)
  b.player.mana = b.player.maxMana = 7
  return b
}
function unit(
  uid: string,
  cardId: string,
  health = 3,
  attack = 3,
  shield = 0,
): BattleUnit {
  return {
    uid,
    cardId,
    health,
    maxHealth: health,
    attack,
    shield,
    ready: true,
    keywords: [],
  }
}
describe("opening choices", () => {
  it("persists opening, swaps up to three slots without changing deck composition, then locks the choice", () => {
    const b = startBattle(STARTER_DECK, null, "wisdom", rng, true)
    expect(b.player.hand).toHaveLength(5)
    expect(actBattle(b, { type: "end" }).error).toContain("mở đầu")
    const before = [...b.player.deck, ...b.player.hand].sort()
    const replacements = b.player.deck.slice(0, 3)
    const result = actBattle(b, { type: "mulligan", indices: [0, 2, 4] }, rng)
    expect(result.error).toBeNull()
    expect([
      result.battle.player.hand[0],
      result.battle.player.hand[2],
      result.battle.player.hand[4],
    ]).toEqual(replacements)
    expect(
      [...result.battle.player.hand, ...result.battle.player.deck].sort(),
    ).toEqual(before)
    expect(result.battle.player.deck).toHaveLength(13)
    expect(result.battle.opening).toBe(false)
    expect(
      actBattle(result.battle, { type: "mulligan", indices: [] }).error,
    ).toContain("một lần")
    expect(parseGame({ ...newGame(), battle: b })?.battle?.opening).toBe(true)
    expect(b.opening).toBe(true)
  })
  it("rejects repeated, negative, fractional and too many slots without mutating the opening hand", () => {
    const b = startBattle(STARTER_DECK, null, "courage", rng, true)
    for (const indices of [[0, 0], [-1], [0.5], [4], [0, 1, 2, 3]]) {
      const result = actBattle(b, { type: "mulligan", indices }, rng)
      expect(result.error).not.toBeNull()
      expect(result.battle).toBe(b)
      expect(result.frames).toEqual([])
    }
    expect(
      actBattle(b, { type: "mulligan", indices: [] }, rng).battle.player.hand,
    ).toEqual(b.player.hand)
  })
})
describe("resonance", () => {
  it("discounts only the next consecutive same-school card, allows zero, and resets each turn", () => {
    let b = arena()
    b.player.mana = 1
    b.player.hand = ["spark", "spark", "spark"]
    b = actBattle(b, { type: "play", index: 0, target: "hero" }).battle
    expect(b.player.mana).toBe(0)
    expect(cardCost(b.player, CARD_MAP.spark)).toBe(0)
    b = actBattle(b, { type: "play", index: 0, target: "hero" }).battle
    expect(b.player.resonanceUsed).toBe(true)
    expect(cardCost(b.player, CARD_MAP.spark)).toBe(1)
    expect(
      actBattle(b, { type: "play", index: 0, target: "hero" }).error,
    ).toContain("năng lượng")
    b.enemy.hand = []
    b.enemy.deck = []
    b = actBattle(b, { type: "end" }).battle
    expect(b.player.resonanceUsed).toBe(false)
    expect(b.player.chainSchool).toBeNull()
  })
  it("breaks the chain on a different school and does not consume a discount on an illegal play", () => {
    let b = arena()
    b.player.hand = ["spark", "herb", "spark", "seasoning"]
    b = actBattle(b, { type: "play", index: 0, target: "hero" }).battle
    b = actBattle(b, { type: "play", index: 0 }).battle
    expect(cardCost(b.player, CARD_MAP.spark)).toBe(1)
    b.player.chainSchool = "hearth"
    const invalid = actBattle(b, { type: "play", index: 1 })
    expect(invalid.error).toContain("đồng minh")
    expect(invalid.battle.player.resonanceUsed).toBe(false)
    expect(invalid.battle.player.mana).toBe(b.player.mana)
  })
})
describe("target previews and replay frames", () => {
  it("predicts blocked damage, simultaneous trade and guard restrictions using the actual reducer", () => {
    const b = arena()
    b.player.board = [unit("mine", "pho-bo", 2, 5)]
    b.enemy.board = [unit("guard", "pho-bo", 3, 2, 1)]
    b.enemy.board[0].keywords = ["guard"]
    const before = structuredClone(b)
    const attack = { type: "attack" as const, uid: "mine" }
    expect(previewTarget(b, attack, "hero").legal).toBe(false)
    const preview = previewTarget(b, attack, "guard")
    expect(preview).toMatchObject({
      legal: true,
      damage: 3,
      counter: 2,
      shield: 1,
      defeated: true,
      attackerDefeated: true,
    })
    expect(b).toEqual(before)
    b.player.hand = ["spark"]
    expect(previewTarget(b, { type: "play", index: 0 }, "hero").legal).toBe(
      true,
    )
  })
  it("records a separate state for every AI action and returns exactly the final rules state", () => {
    const b = arena()
    b.enemy.hand = ["caravan-scout", "spark"]
    b.enemy.deck = ["spark", "herb"]
    b.enemy.maxMana = 2
    const result = actBattle(b, { type: "end" })
    expect(result.frames[0].event).toMatchObject({
      kind: "turn",
      side: "enemy",
    })
    expect(
      result.frames.filter((f) => f.event.kind === "play").length,
    ).toBeGreaterThanOrEqual(2)
    expect(result.frames.some((f) => f.event.kind === "attack")).toBe(true)
    expect(result.frames.at(-1)?.battle).toEqual(result.battle)
    expect(result.frames[0].before).toEqual(b)
    for (let i = 1; i < result.frames.length; i++)
      expect(result.frames[i].before).toEqual(result.frames[i - 1].battle)
    result.frames[0].battle.enemy.mana = 99
    expect(result.battle.enemy.mana).not.toBe(99)
  })
  it("saves and settles a lethal once, while presentation frames do not alter rewards", () => {
    const save = newGame()
    const b = arena("lantern-1")
    b.player.hand = ["spark"]
    b.enemy.health = 2
    const { battle, frames } = actBattle(b, {
      type: "play",
      index: 0,
      target: "hero",
    })
    const result = settleBattle({ ...save, battle })
    expect(frames).toHaveLength(1)
    expect(result.battle?.settled).toBe(true)
    expect(settleBattle(result)).toEqual(result)
    expect(parseGame(result)?.coins).toBe(save.coins + 100)
  })
})
describe("bosses, revelations and save compatibility", () => {
  it("applies boss burn before AI plays and doubles it when below half health", () => {
    const b = arena("harbor-3")
    b.enemy.hand = []
    b.enemy.deck = ["herb"]
    const normal = actBattle(b, { type: "end" })
    expect(normal.battle.player.health).toBe(b.player.health - 1)
    b.enemy.health = 10
    const awake = actBattle(b, { type: "end" })
    expect(awake.battle.player.health).toBe(b.player.health - 2)
    expect(
      awake.frames.find((f) => f.event.kind === "rule")?.event.label,
    ).toContain("THỨC TỈNH")
  })
  it("gives all 18 stages a before and after scene, with six gated clues and six explicit boss rules", () => {
    for (const stage of STAGES) {
      expect(SCENES[stage.id].before.length).toBeGreaterThanOrEqual(3)
      expect(SCENES[stage.id].after.length).toBeGreaterThanOrEqual(2)
      expect(SCENES[stage.id].tactic.length).toBeGreaterThan(30)
      expect(!!BOSS_RULES[stage.id]).toBe(stage.boss)
    }
    expect(Object.values(SCENES).filter((s) => s.clue)).toHaveLength(15)
    expect(ENDINGS.remember.text).not.toEqual(ENDINGS.release.text)
  })
  it("loads a 2.1 save and active battle with defaults and preserves existing inventory and progress", () => {
    const old = {
      ...newGame(),
      battle: arena(),
      clearedStages: ["lantern-1"],
    } as Record<string, any>
    delete old.storyEnding
    delete old.battle.opening
    for (const side of ["player", "enemy"]) {
      delete old.battle[side].chainSchool
      delete old.battle[side].resonanceUsed
    }
    const parsed = parseGame(old)!
    expect(parsed.storyEnding).toBeNull()
    expect(parsed.battle?.opening).toBe(false)
    expect(parsed.battle?.player.chainSchool).toBeNull()
    expect(parsed.cards).toEqual(old.cards)
    expect(parsed.clearedStages).toEqual(old.clearedStages)
    expect(parseGame({ ...parsed, storyEnding: "release" })?.storyEnding).toBe(
      "release",
    )
  })
})
