import { describe, expect, it, beforeEach } from "vitest"
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { CARDS, CARD_MAP, RARITIES, STARTER_DECK, deckErrors } from "./catalog"
import { actBattle, startBattle } from "./battle"
import {
  newGame,
  grantCard,
  openPack,
  rotateDay,
  settleBattle,
  QUESTS,
  dailyTrades,
  tradeError,
  PACKS,
} from "./progression"
import { CHAPTERS, STAGES, isStageUnlocked } from "./story"
import { GameSaveSchema, parseGame, GAME_KEY } from "./storage"
import { useGameStore } from "./useGameStore"
import { repository } from "../infrastructure/storage/repository"
import type { Battle, BattleUnit, GameSave } from "./types"

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
  useGameStore.setState({ save: newGame(), notice: null })
})
function rng(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}
function arena(): Battle {
  const b = startBattle(STARTER_DECK, null, "courage", rng(5))
  b.player.mana = 7
  b.player.maxMana = 7
  return b
}
function unit(
  uid: string,
  cardId: string,
  overrides: Partial<BattleUnit> = {},
): BattleUnit {
  const card = CARD_MAP[cardId]
  return {
    uid,
    cardId,
    attack: card.attack,
    health: card.health,
    maxHealth: card.health,
    keywords: [...card.keywords],
    shield: 0,
    ready: true,
    ...overrides,
  }
}

describe("card catalog and decks", () => {
  it("has distinct IDs, 25 new cards and a legal starter with all five schools available", () => {
    expect(CARDS.length).toBeGreaterThan(120)
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length)
    expect(CARDS.filter((c) => c.set === "Bí thuật vị giác")).toHaveLength(20)
    expect(CARDS.filter((c) => c.set === "Người giữ vị")).toHaveLength(5)
    expect(new Set(CARDS.map((c) => c.school)).size).toBe(5)
    expect(deckErrors(STARTER_DECK, newGame().cards)).toEqual([])
    expect(CARDS).toHaveLength(152)
    for (const card of CARDS)
      if (card.art)
        expect(existsSync(resolve("public", card.art.slice(1))), card.id).toBe(
          true,
        )
  })
  it("rejects missing ownership, over 2 copies, invalid IDs and wrong deck size", () => {
    expect(deckErrors(STARTER_DECK, {})).not.toHaveLength(0)
    expect(
      deckErrors(
        [...STARTER_DECK.slice(0, 15), "spark", "spark", "spark"],
        newGame().cards,
      ).join(),
    ).toContain("tối đa 2")
    expect(deckErrors(["missing"], {})).toHaveLength(2)
  })
})
describe("turn combat rules", () => {
  it("gives each side the same energy on its first turn", () => {
    const b = startBattle(STARTER_DECK, "lantern-1", "courage", rng(1))
    expect(b.player.maxMana).toBe(1)
    expect(b.enemy.maxMana).toBe(0)
    const next = actBattle(b, { type: "end" }).battle
    expect(next.enemy.maxMana).toBe(1)
    expect(next.player.maxMana).toBe(2)
  })
  it("does not mutate a battle on invalid actions or spend mana", () => {
    const b = arena()
    b.player.mana = 0
    b.player.hand = ["spark"]
    const before = structuredClone(b)
    const result = actBattle(b, { type: "play", index: 0, target: "hero" })
    expect(result.error).toContain("năng lượng")
    expect(result.battle).toEqual(before)
    expect(b).toEqual(before)
  })
  it("enforces the three-unit limit and summon sickness", () => {
    const b = arena()
    b.player.hand = ["pho-bo"]
    b.player.board = [
      unit("a", "pho-bo"),
      unit("b", "pho-bo"),
      unit("c", "pho-bo"),
    ]
    expect(actBattle(b, { type: "play", index: 0 }).error).toContain("3")
    b.player.board = []
    const played = actBattle(b, { type: "play", index: 0 }).battle
    expect(played.player.board[0].ready).toBe(false)
    expect(
      actBattle(played, {
        type: "attack",
        uid: played.player.board[0].uid,
        target: "hero",
      }).error,
    ).toContain("sẵn sàng")
  })
  it("guards protect the hero and other units, but damage spells bypass them", () => {
    const b = arena()
    b.player.board = [unit("a", "pho-bo")]
    b.enemy.board = [unit("guard", "chef-bach"), unit("other", "pho-bo")]
    expect(
      actBattle(b, { type: "attack", uid: "a", target: "hero" }).error,
    ).toContain("Hộ vệ")
    expect(
      actBattle(b, { type: "attack", uid: "a", target: "other" }).error,
    ).toContain("Hộ vệ")
    b.player.hand = ["spark"]
    expect(
      actBattle(b, { type: "play", index: 0, target: "hero" }).battle.enemy
        .health,
    ).toBe(b.enemy.health - 2)
  })
  it("shield blocks first, simultaneous retaliation and lifesteal use actual damage", () => {
    const b = arena()
    b.player.health = 20
    b.player.board = [unit("a", "chef-nhien", { attack: 4, health: 5 })]
    b.enemy.board = [
      unit("g", "chef-bach", { health: 3, shield: 2, attack: 7 }),
    ]
    const result = actBattle(b, {
      type: "attack",
      uid: "a",
      target: "g",
    }).battle
    expect(result.player.health).toBe(22)
    expect(result.player.board).toHaveLength(0)
    expect(result.enemy.board[0].health).toBe(1)
    expect(result.enemy.board[0].shield).toBe(0)
  })
  it("rush and synergy work on summon and mana never exceeds 7", () => {
    const b = arena()
    b.player.board = [unit("old", "chef-nhien")]
    b.player.hand = ["chef-nhien"]
    const result = actBattle(b, { type: "play", index: 0 }).battle
    expect(result.player.board[1].ready).toBe(true)
    expect(result.player.board[1].shield).toBe(1)
    const next = actBattle(result, { type: "end" }).battle
    expect(next.player.maxMana).toBe(7)
    expect(next.player.mana).toBe(7)
  })
  it("healing respects max HP, buffs need a board, and full hands burn draws", () => {
    const b = arena()
    b.player.hand = ["herb"]
    b.player.health = 33
    expect(actBattle(b, { type: "play", index: 0 }).battle.player.health).toBe(
      34,
    )
    b.player.hand = ["seasoning"]
    expect(actBattle(b, { type: "play", index: 0 }).error).toContain(
      "đồng minh",
    )
    b.player.hand = ["recipe-scroll", ...Array(7).fill("spark")]
    b.player.deck = ["herb", "herb", "herb", "herb"]
    const drawn = actBattle(b, { type: "play", index: 0 }).battle
    expect(drawn.player.hand).toHaveLength(8)
    expect(drawn.player.deck).toHaveLength(1)
  })
  it("fatigue ends a stalemate and completed battles reject further actions", () => {
    let b = arena()
    b.player.deck = []
    b.enemy.deck = []
    b.player.hand = []
    b.enemy.hand = []
    for (let i = 0; i < 20 && !b.result; i++) {
      if (b.tactic?.status === "pending")
        b = actBattle(b, { type: "tactic", id: "shelter" }).battle
      b = actBattle(b, { type: "end" }).battle
    }
    expect(b.result).not.toBeNull()
    expect(actBattle(b, { type: "end" }).battle).toBe(b)
  })
})
describe("progression and economy", () => {
  it("guarantees a rare and an epic by the eighth pack, charging once and converting duplicates", () => {
    const save = {
      ...newGame(),
      cards: Object.fromEntries(CARDS.map((c) => [c.id, 2])),
      packTickets: 0,
      coins: 1000,
      pity: 7,
    }
    const result = openPack(save, "origin", () => 0.99)
    expect(result.cards).toHaveLength(5)
    expect(
      result.cards.some((id) =>
        ["epic", "legendary"].includes(CARD_MAP[id].rarity),
      ),
    ).toBe(true)
    expect(result.save.coins).toBe(750)
    expect(result.save.pity).toBe(0)
    expect(result.save.dust).toBeGreaterThan(save.dust)
    expect(openPack({ ...save, coins: 249 }, "origin").save).toBeDefined()
    expect(openPack({ ...save, coins: 249 }, "origin").cards).toEqual([])
    expect(openPack(save, "invalid").error).toBeDefined()
  })
  it("each school pack supports all rarity guarantees", () => {
    for (const id of ["ember", "tide", "grove", "hearth", "sugar"]) {
      const result = openPack({ ...newGame(), pity: 7 }, id, () => 0.99)
      expect(result.cards.every((c) => CARD_MAP[c].school === id)).toBe(true)
      expect(result.cards.some((c) => CARD_MAP[c].rarity === "epic")).toBe(true)
    }
  })
  it("requires the increased crafting price at every rarity without changing owned cards on failure", () => {
    for (const rarity of ["common", "rare", "epic", "legendary"] as const) {
      const card = CARDS.find((c) => c.rarity === rarity)!
      const save = {
        ...newGame(),
        dust: RARITIES[rarity].dust - 1,
        cards: { ...newGame().cards, [card.id]: 0 },
      }
      useGameStore.setState({ save, notice: null })
      useGameStore.getState().craft(card.id)
      expect(useGameStore.getState().save).toBe(save)
      useGameStore.setState({ save: { ...save, dust: RARITIES[rarity].dust } })
      useGameStore.getState().craft(card.id)
      expect(useGameStore.getState().save.cards[card.id]).toBe(1)
      expect(useGameStore.getState().save.dust).toBe(0)
      useGameStore.getState().craft(card.id)
      expect(useGameStore.getState().save.cards[card.id]).toBe(1)
    }
  })
  it("charges the displayed pack price exactly once and preserves the save when unaffordable", () => {
    for (const pack of PACKS) {
      expect(pack.coinCost).toBe(pack.school ? 350 : 250)
      const poor = { ...newGame(), packTickets: 0, coins: pack.coinCost - 1 }
      const failed = openPack(poor, pack.id)
      expect(failed.error).toContain(String(pack.coinCost))
      expect(failed.save).toBe(poor)
      expect(failed.cards).toEqual([])
      const exact = openPack({ ...poor, coins: pack.coinCost }, pack.id)
      expect(exact.save.coins).toBe(0)
      expect(exact.save.stats.packs).toBe(1)
      expect(exact.cards).toHaveLength(5)
      const ticket = openPack({ ...poor, packTickets: 1, coins: 0 }, pack.id)
      expect(ticket.save.packTickets).toBe(0)
      expect(ticket.save.coins).toBe(0)
      expect(ticket.cards).toHaveLength(5)
    }
  })
  it("pays story rewards once, settlement is idempotent, and locks sequentially", () => {
    expect(CHAPTERS).toHaveLength(6)
    expect(STAGES).toHaveLength(18)
    expect(isStageUnlocked("lantern-2", [])).toBe(false)
    expect(isStageUnlocked("missing", [])).toBe(false)
    const b = { ...arena(), stageId: "lantern-1", result: "win" as const }
    const save = settleBattle({ ...newGame(), battle: b })
    expect(save.coins).toBe(400)
    expect(save.cards["tea-break"]).toBe(1)
    expect(isStageUnlocked("lantern-2", save.clearedStages)).toBe(true)
    expect(settleBattle(save)).toBe(save)
    const replay = settleBattle({
      ...save,
      battle: { ...b, id: "replay", settled: false },
    })
    expect(replay.coins).toBe(save.coins)
    expect(replay.xp).toBe(save.xp)
    expect(replay.cards).toEqual(save.cards)
  })
  it("boss rewards a ticket and practice stops awarding after five daily wins", () => {
    const boss = settleBattle({
      ...newGame(),
      battle: { ...arena(), stageId: "lantern-3", result: "win" },
    })
    expect(boss.coins).toBe(480)
    expect(boss.packTickets).toBe(3)
    expect(boss.cards["chef-bach"]).toBe(1)
    const save = newGame()
    save.daily.wins = 5
    const result = settleBattle({
      ...save,
      battle: { ...arena(), result: "win" },
    })
    expect(result.coins).toBe(save.coins)
    expect(result.stats.wins).toBe(1)
  })
  it("daily rotation keeps collection, long-term stats and the current battle", () => {
    const save = {
      ...newGame(),
      battle: arena(),
      daily: { wins: 4, battles: 6, packs: 2, crafted: 1 },
      claimedDailyQuests: ["daily-win"],
    }
    const next = rotateDay(save, "2099-01-01")
    expect(next.cards).toEqual(save.cards)
    expect(next.daily.wins).toBe(0)
    expect(next.claimedDailyQuests).toEqual([])
    expect(next.battle).toEqual(save.battle)
  })
  it("offers deterministic daily NPC trades and requires a spare card beyond every saved deck", () => {
    const save = newGame(),
      offers = dailyTrades(save.day),
      offer = offers[0]
    expect(offers).toHaveLength(3)
    expect(dailyTrades(save.day)).toEqual(offers)
    expect(tradeError(save, offer)).not.toBeNull()
    save.cards[offer.inputId] = 2
    save.decks[0].cards = [
      ...STARTER_DECK.filter((id) => id !== offer.inputId),
      ...Array(STARTER_DECK.filter((id) => id === offer.inputId).length).fill(
        "recipe-scroll",
      ),
    ]
    save.cards["recipe-scroll"] = 2
    expect(tradeError(save, offer)).toBeNull()
    useGameStore.setState({ save })
    useGameStore.getState().trade(offer.id)
    const after = useGameStore.getState().save
    expect(after.cards[offer.inputId]).toBe(1)
    expect(after.cards[offer.outputId]).toBe(1)
    expect(after.coins).toBe(240)
    useGameStore.getState().trade(offer.id)
    expect(useGameStore.getState().save.coins).toBe(240)
    expect(tradeError(after, offer)).toContain("đã đổi")
  })
})
describe("store safeguards and persistence", () => {
  it("imports legacy dishes exactly once without altering the old save", () => {
    localStorage.setItem("foodchest.user.v1", "old-profile")
    useGameStore
      .getState()
      .importLegacy(["pho-bo", "pho-bo", "sushi", "missing"])
    const save = useGameStore.getState().save
    useGameStore.getState().importLegacy(["pho-bo", "sushi"])
    expect(useGameStore.getState().save.cards).toEqual(save.cards)
    expect(useGameStore.getState().save.dust).toBe(save.dust)
    expect(localStorage.getItem("foodchest.user.v1")).toBe("old-profile")
  })
  it("requires owning a legal deck, locks stages and prevents abandoning an ongoing battle silently", () => {
    expect(useGameStore.getState().start("lantern-2")).toBe(false)
    expect(useGameStore.getState().start("lantern-1")).toBe(true)
    const battle = useGameStore.getState().save.battle
    expect(useGameStore.getState().start(null)).toBe(false)
    expect(useGameStore.getState().save.battle).toBe(battle)
    expect(
      GameSaveSchema.safeParse(JSON.parse(localStorage.getItem(GAME_KEY)!))
        .success,
    ).toBe(true)
    useGameStore.getState().leaveBattle()
    expect(useGameStore.getState().save.stats.battles).toBe(1)
  })
  it("prevents double check-in and quest claims, and protects cards used by any saved deck", () => {
    useGameStore.getState().checkIn()
    useGameStore.getState().checkIn()
    expect(useGameStore.getState().save.coins).toBe(400)
    useGameStore.getState().salvage("pho-bo")
    expect(useGameStore.getState().save.cards["pho-bo"]).toBe(2)
    useGameStore.getState().claimQuest("first-win")
    expect(useGameStore.getState().save.coins).toBe(400)
    const save = useGameStore.getState().save
    save.stats.wins = 1
    useGameStore.getState().claimQuest("first-win")
    useGameStore.getState().claimQuest("first-win")
    expect(useGameStore.getState().save.coins).toBe(500)
  })
  it("crafts only affordable cards and never exceeds two copies", () => {
    useGameStore.setState({ save: { ...newGame(), dust: 100 } })
    useGameStore.getState().craft("spark")
    expect(useGameStore.getState().save.dust).toBe(100)
    useGameStore.getState().craft("sugar-veil")
    expect(useGameStore.getState().save.cards["sugar-veil"]).toBe(1)
    useGameStore.getState().craft("sugar-veil")
    useGameStore.getState().craft("sugar-veil")
    expect(useGameStore.getState().save.cards["sugar-veil"]).toBe(2)
    expect(useGameStore.getState().save.dust).toBe(0)
  })
  it("validates saves, preserves battles through JSON, and includes TCG in existing backup", () => {
    const save = { ...newGame(), battle: arena() }
    expect(parseGame(JSON.parse(JSON.stringify(save)))).toEqual(save)
    expect(parseGame({ ...save, coins: -1 })).toBeNull()
    expect(parseGame({ ...save, cards: { spark: 99 } })).toBeNull()
    expect(useGameStore.getState().importSave({ version: 2 })).toBe(false)
    localStorage.setItem(GAME_KEY, JSON.stringify(save))
    const backup = JSON.parse(repository.exportBackup())
    expect(backup.tcg.battle.id).toBe(save.battle.id)
    expect(
      repository.importBackup(
        JSON.stringify({ ...backup, tcg: { version: 2 } }),
      ),
    ).toBe(false)
    expect(JSON.parse(localStorage.getItem(GAME_KEY)!).battle.id).toBe(
      save.battle.id,
    )
  })
})

function autoPlay(initial: Battle): Battle {
  let b = initial
  for (let turns = 0; turns < 60 && !b.result; turns++) {
    if (b.tactic?.status === "pending") {
      const result = actBattle(b, {
        type: "tactic",
        id: b.player.board.length >= 2 ? "flame" : "shelter",
      })
      expect(result.error).toBeNull()
      b = result.battle
    }
    for (let plays = 0; plays < 12 && !b.result; plays++) {
      const choices = b.player.hand
        .map((id, index) => ({ c: CARD_MAP[id], index }))
        .filter(
          ({ c }) =>
            c.cost <= b.player.mana &&
            (c.kind !== "unit" || b.player.board.length < 3) &&
            ((c.effect !== "buff" && c.effect !== "ward") ||
              b.player.board.length > 0) &&
            (c.effect !== "heal" ||
              b.player.health <= b.player.maxHealth - (c.power ?? 1)),
        )
      choices.sort(
        (a, z) =>
          (z.c.kind === "unit" ? 5 + z.c.cost : z.c.cost) -
          (a.c.kind === "unit" ? 5 + a.c.cost : a.c.cost),
      )
      if (!choices.length) break
      const { c, index } = choices[0]
      const lethal = b.enemy.board.find(
        (u) => u.health + u.shield <= (c.power ?? 0),
      )
      const result = actBattle(b, {
        type: "play",
        index,
        target:
          c.effect === "damage"
            ? b.enemy.health <= (c.power ?? 0)
              ? "hero"
              : (lethal?.uid ?? "hero")
            : undefined,
      })
      expect(result.error).toBeNull()
      b = result.battle
    }
    for (const uid of b.player.board.filter((u) => u.ready).map((u) => u.uid)) {
      if (b.result) break
      const attacker = b.player.board.find((u) => u.uid === uid)!
      const guards = b.enemy.board
        .filter((u) => u.keywords.includes("guard"))
        .sort((a, z) => a.health + a.shield - z.health - z.shield)
      const trade = b.enemy.board.find(
        (u) =>
          u.health + u.shield <= attacker.attack &&
          u.attack < attacker.health + attacker.shield,
      )
      const result = actBattle(b, {
        type: "attack",
        uid,
        target: guards[0]?.uid ?? trade?.uid ?? "hero",
      })
      expect(result.error).toBeNull()
      b = result.battle
    }
    if (!b.result) b = actBattle(b, { type: "end" }).battle
    expect(b.player.board.length).toBeLessThanOrEqual(3)
    expect(b.enemy.board.length).toBeLessThanOrEqual(3)
    expect(b.player.hand.length).toBeLessThanOrEqual(8)
    expect(b.enemy.hand.length).toBeLessThanOrEqual(8)
    expect(b.player.mana).toBeGreaterThanOrEqual(0)
    expect(b.enemy.mana).toBeGreaterThanOrEqual(0)
  }
  return b
}
describe("campaign playthrough", () => {
  it("resolves 200 seeded games, offers a winnable starter encounter, and can complete all chapters with a mature deck", () => {
    let starterWins = 0
    for (let seed = 1; seed <= 20; seed++) {
      const b = autoPlay(
        startBattle(STARTER_DECK, STAGES[0].id, "wisdom", rng(seed)),
      )
      expect(b.result).not.toBeNull()
      if (b.result === "win") starterWins++
    }
    expect(starterWins).toBeGreaterThanOrEqual(10)
    const advanced = [
      "chef-nhien",
      "chef-nhien",
      "chef-moc",
      "chef-moc",
      "wok-storm",
      "wok-storm",
      "pho-bo",
      "pho-bo",
      "banh-mi",
      "banh-mi",
      "spark",
      "spark",
      "herb",
      "herb",
      "family-table",
      "family-table",
      "dragon-breath",
      "dragon-breath",
    ]
    let save = newGame()
    for (const stage of STAGES) {
      let winning: Battle | undefined
      for (let seed = 1; seed <= 10; seed++) {
        const battle = autoPlay(
          startBattle(
            advanced,
            stage.id,
            "wisdom",
            rng(seed + stage.index * 30),
          ),
        )
        expect(battle.result).not.toBeNull()
        if (battle.result === "win") winning = battle
      }
      expect(winning, `Stage ${stage.id} should be winnable`).toBeDefined()
      expect(isStageUnlocked(stage.id, save.clearedStages)).toBe(true)
      save = settleBattle({ ...save, battle: winning! })
    }
    expect(save.clearedStages).toHaveLength(18)
    expect(save.packTickets).toBe(8)
    expect(save.xp).toBe(900)
    expect(QUESTS.find((q) => q.id === "dawn")!.progress(save)).toBe(18)
  })
})
