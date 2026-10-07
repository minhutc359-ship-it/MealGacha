import { describe, expect, it } from "vitest"
import { existsSync, readFileSync, statSync } from "node:fs"
import { resolve } from "node:path"
import { actBattle, startBattle } from "./battle"
import { getBattleHint } from "./battleCoach"
import { CARD_MAP, STARTER_DECK } from "./catalog"
import { STORY_ART, stageArtId } from "./storyArt"
import { STAGES } from "./story"
import type { BattleUnit } from "./types"

function fixture() {
  const battle = startBattle(STARTER_DECK, "lantern-1", "courage", () => 0.4)
  battle.player.mana = battle.player.maxMana = 7
  battle.player.hand = []
  battle.player.board = []
  battle.enemy.board = []
  return battle
}
function unit(uid: string, id = "pho-bo", ready = true): BattleUnit {
  const card = CARD_MAP[id]
  return {
    uid,
    cardId: id,
    attack: 4,
    health: 5,
    maxHealth: 5,
    shield: 0,
    ready,
    keywords: [...card.keywords],
  }
}

describe("beginner battle guidance", () => {
  it("prioritizes an immediate legal win and only previews without changing the battle", () => {
    const battle = fixture()
    battle.player.board = [unit("ally")]
    battle.enemy.health = 3
    const before = JSON.stringify(battle)
    const hint = getBattleHint(battle)!
    expect(hint.action).toEqual({ type: "attack", uid: "ally", target: "hero" })
    expect(actBattle(battle, hint.action!).battle.result).toBe("win")
    expect(JSON.stringify(battle)).toBe(before)
  })
  it("respects guards and accounts for shields and counterattacks", () => {
    const battle = fixture()
    battle.player.board = [unit("ally")]
    battle.enemy.board = [
      {
        ...unit("guard", "banh-mi"),
        keywords: ["guard"],
        health: 2,
        shield: 1,
      },
    ]
    const action = getBattleHint(battle)!.action!
    expect(action).toEqual({ type: "attack", uid: "ally", target: "guard" })
    const result = actBattle(battle, action)
    expect(result.error).toBeNull()
    expect(result.battle.enemy.board).toHaveLength(0)
    expect(result.battle.player.board[0].health).toBe(1)
  })
  it("can suggest a lethal spell through a guard", () => {
    const battle = fixture()
    battle.player.hand = ["spark"]
    battle.enemy.health = 2
    battle.enemy.board = [{ ...unit("guard", "banh-mi"), keywords: ["guard"] }]
    expect(getBattleHint(battle)!.action).toEqual({
      type: "play",
      index: 0,
      target: "hero",
    })
  })
  it("does not suggest exhausted units or a unit when all three slots are occupied", () => {
    const battle = fixture()
    battle.player.board = [
      unit("a", "pho-bo", false),
      unit("b", "pho-bo", false),
      unit("c", "pho-bo", false),
    ]
    battle.player.hand = ["pho-bo"]
    expect(getBattleHint(battle)!.action).toBeNull()
  })
  it("uses the discounted cost of resonance instead of a card's printed cost", () => {
    const battle = fixture()
    battle.player.mana = 0
    battle.player.chainSchool = "tide"
    battle.player.hand = ["tea-break"]
    const action = getBattleHint(battle)!.action!
    expect(action).toEqual({ type: "play", index: 0 })
    expect(actBattle(battle, action).error).toBeNull()
    battle.player.resonanceUsed = true
    expect(getBattleHint(battle)!.action).toBeNull()
  })
  it("recommends useful healing at low health and holds ineffective healing at full health", () => {
    const battle = fixture()
    battle.player.hand = ["sweet-dream", "pho-bo"]
    battle.player.health = 6
    expect(getBattleHint(battle)!.action).toEqual({ type: "play", index: 0 })
    battle.player.health = battle.player.maxHealth
    battle.player.hand = ["sweet-dream"]
    expect(getBattleHint(battle)!.action).toBeNull()
  })
  it("never suggests a draw that loses through fatigue", () => {
    const battle = fixture()
    battle.player.hand = ["recipe-scroll"]
    battle.player.deck = []
    battle.player.health = 2
    expect(getBattleHint(battle)!.action).toBeNull()
  })
  it("recognizes that a draw spell frees one hand slot and respects the eight-card cap", () => {
    const battle = fixture()
    battle.player.hand = ["recipe-scroll", ...Array(7).fill("last-flame")]
    battle.player.mana = 3
    // Playing the draw spell frees one slot, so exactly one card can still be gained.
    const hint = getBattleHint(battle)!
    expect(actBattle(battle, hint.action!).error).toBeNull()
    expect(actBattle(battle, hint.action!).battle.player.hand).toHaveLength(8)
  })
  it("only proposes legal actions across changing mana, hands and battlefield states", () => {
    for (let mana = 0; mana <= 7; mana++)
      for (let slots = 0; slots <= 3; slots++) {
        const battle = fixture()
        battle.player.mana = mana
        battle.player.hand = [
          "spark",
          "tea-break",
          "sweet-dream",
          "pho-bo",
          "seasoning",
        ]
        battle.player.board = Array.from({ length: slots }, (_, i) =>
          unit(`ally-${i}`, "pho-bo", i % 2 === 0),
        )
        battle.enemy.board = [
          { ...unit("guard", "banh-mi"), keywords: ["guard"], shield: 2 },
        ]
        const before = JSON.stringify(battle),
          hint = getBattleHint(battle)!
        if (hint.action) expect(actBattle(battle, hint.action).error).toBeNull()
        expect(JSON.stringify(battle)).toBe(before)
      }
  })
  it("stays quiet during the opening choice and after the battle is settled", () => {
    const battle = fixture()
    battle.opening = true
    expect(getBattleHint(battle)).toBeNull()
    battle.opening = false
    battle.result = "win"
    expect(getBattleHint(battle)).toBeNull()
    battle.result = null
    battle.settled = true
    expect(getBattleHint(battle)).toBeNull()
  })
})

describe("illustrated campaign assets", () => {
  it("serves actual WebP illustrations for every stage without LFS placeholders", () => {
    for (const stage of STAGES) {
      expect(STORY_ART[stageArtId(stage.id)]).toBeDefined()
      expect(stage.chapter.art).toBe(
        STORY_ART[stageArtId(stage.chapter.stages[0].id)].src,
      )
    }
    let bytes = 0
    for (const art of Object.values(STORY_ART)) {
      const path = resolve("public", art.src.slice(1))
      expect(existsSync(path)).toBe(true)
      expect(readFileSync(path).subarray(0, 4).toString()).toBe("RIFF")
      bytes += statSync(path).size
    }
    expect(bytes).toBeLessThan(1.2 * 1024 * 1024)
  })
})
