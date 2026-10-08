import { beforeEach, describe, expect, it } from "vitest"
import { actBattle, startBattle } from "./battle"
import { CARD_MAP, STARTER_DECK } from "./catalog"
import { prepareEncounter } from "./encounters"
import { startSideQuest, startWeekly } from "./journeys"
import { newGame, settleBattle } from "./progression"
import { GAME_KEY, parseGame } from "./storage"
import { STAGES, isStageUnlocked } from "./story"
import { useGameStore } from "./useGameStore"
import type { BattleUnit } from "./types"

const memory = new Map<string, string>()
beforeEach(() => {
  memory.clear()
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
      removeItem: (key: string) => memory.delete(key),
    },
  })
  useGameStore.setState({ save: newGame(), notice: null, presentation: null })
})
const guard = (): BattleUnit => ({
  uid: "guard",
  cardId: "chef-bach",
  attack: 0,
  health: 100,
  maxHealth: 100,
  shield: 0,
  ready: true,
  keywords: ["guard"],
})

describe("defeat and campaign gates", () => {
  it("actual lethal enemy turns in all 18 stages never clear a stage or open the next one", () => {
    for (const stage of STAGES) {
      const save = newGame()
      save.clearedStages = STAGES.slice(0, stage.index).map((s) => s.id)
      const battle = prepareEncounter(startBattle(STARTER_DECK, stage.id))
      battle.player.health = 1
      battle.player.board = []
      battle.enemy.hand = []
      battle.enemy.deck = ["herb"]
      battle.enemy.board = [
        { ...guard(), uid: "enemy", attack: 99, keywords: [] },
      ]
      const outcome = actBattle(battle, { type: "end" })
      expect(outcome.error).toBeNull()
      expect(outcome.battle.result, stage.id).toBe("loss")
      const next = settleBattle({ ...save, battle: outcome.battle })
      expect(next.clearedStages).toEqual(save.clearedStages)
      expect(next.cards).toEqual(save.cards)
      expect([next.coins, next.dust, next.xp, next.packTickets]).toEqual([
        save.coins,
        save.dust,
        save.xp,
        save.packTickets,
      ])
      expect(next.stats.wins).toBe(0)
      expect(next.history[0].result).toBe("loss")
      expect(isStageUnlocked(stage.id, next.clearedStages)).toBe(true)
      if (STAGES[stage.index + 1])
        expect(
          isStageUnlocked(STAGES[stage.index + 1].id, next.clearedStages),
        ).toBe(false)
      expect(settleBattle(next)).toBe(next)
    }
  })

  it("surrendering the chapter boss persists a loss and leaves chapter two locked after reload", () => {
    const save = newGame()
    save.clearedStages = ["lantern-1", "lantern-2"]
    useGameStore.setState({ save })
    expect(useGameStore.getState().start("lantern-3")).toBe(true)
    useGameStore.getState().leaveBattle()
    const loaded = parseGame(JSON.parse(memory.get(GAME_KEY)!))!
    expect(loaded.clearedStages).toEqual(save.clearedStages)
    expect(loaded.history[0].result).toBe("loss")
    expect(loaded.stats.wins).toBe(0)
    expect(useGameStore.getState().start(STAGES[3].id)).toBe(false)
    expect(loaded.coins).toBe(save.coins)
  })

  it("fatigue defeat takes priority over completing the third protected turn", () => {
    const battle = prepareEncounter(startBattle(STARTER_DECK, "lantern-3"))
    battle.round = 3
    battle.encounter!.progress = 2
    battle.player.health = 1
    battle.player.deck = []
    battle.player.board = [guard()]
    battle.enemy.hand = []
    battle.enemy.deck = ["herb"]
    const next = actBattle(battle, { type: "end" }).battle
    expect(next.player.health).toBe(0)
    expect(next.result).toBe("loss")
    expect(next.encounter!.progress).toBe(2)
  })

  it("rejects a stale victory when will reaches zero before any reward or progression is granted", () => {
    const battle = startBattle(STARTER_DECK, "lantern-3")
    battle.player.health = 0
    battle.result = "win"
    const save = newGame(),
      snapshot = structuredClone(battle)
    const next = settleBattle({ ...save, battle })
    expect(next.battle!.result).toBe("loss")
    expect(next.clearedStages).toEqual([])
    expect(next.coins).toBe(save.coins)
    expect(next.cards).toEqual(save.cards)
    expect(next.packTickets).toBe(save.packTickets)
    expect(next.history[0].result).toBe("loss")
    expect(battle).toEqual(snapshot)
    expect(settleBattle(next)).toBe(next)
  })

  it("applies the same death priority to companion and weekly rewards", () => {
    for (const battle of [
      startSideQuest(STARTER_DECK, "bach", "share"),
      startWeekly(0),
    ]) {
      battle.player.health = 0
      battle.result = "win"
      const save = newGame(),
        next = settleBattle({ ...save, battle })
      expect(next.battle!.result).toBe("loss")
      expect(next.coins).toBe(save.coins)
      expect(next.bonds?.bach?.completed).not.toBe(true)
      expect(next.clearedStages).toEqual([])
      expect(next.stats.wins).toBe(0)
    }
  })

  it("a valid objective victory unlocks the next chapter once; losing a replay preserves the earlier victory", () => {
    let battle = prepareEncounter(startBattle(STARTER_DECK, "lantern-3"))
    battle.player.board = [guard()]
    battle.enemy.hand = []
    battle.enemy.deck = Array(10).fill("herb")
    for (let i = 0; i < 3; i++)
      battle = actBattle(battle, { type: "end" }).battle
    expect(battle.result).toBe("win")
    expect(battle.enemy.health).toBeGreaterThan(0)
    const save = newGame()
    save.clearedStages = ["lantern-1", "lantern-2"]
    const won = settleBattle({ ...save, battle })
    expect(won.clearedStages).toEqual(["lantern-1", "lantern-2", "lantern-3"])
    expect(isStageUnlocked(STAGES[3].id, won.clearedStages)).toBe(true)
    expect(won.cards[CARD_MAP["chef-bach"].id]).toBe(1)
    expect(settleBattle(won)).toBe(won)
    const lost = settleBattle({
      ...won,
      battle: { ...battle, id: "replay", result: "loss", settled: false },
    })
    expect(lost.clearedStages).toEqual(won.clearedStages)
    expect(lost.coins).toBe(won.coins)
    expect(lost.cards).toEqual(won.cards)
  })

  it("requires the entire preceding campaign, not a single imported boss flag, to unlock a chapter", () => {
    expect(isStageUnlocked(STAGES[3].id, ["lantern-3"])).toBe(false)
    expect(
      isStageUnlocked(STAGES[3].id, ["lantern-1", "lantern-2", "lantern-3"]),
    ).toBe(true)
  })
})
