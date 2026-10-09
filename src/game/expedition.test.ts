import { beforeEach, describe, expect, it } from "vitest"
import { CARDS, CARD_MAP, STARTER_DECK } from "./catalog"
import { actBattle } from "./battle"
import {
  createExpedition,
  enterRunNode,
  eventChoices,
  EXPEDITION_EVENTS,
  nextRunFloor,
  pickRunCard,
  pickRunRelic,
  RELICS,
  resolveRunEvent,
  settleRunCombat,
  startRunBattle,
} from "./expedition"
import { newGame, rotateDay, settleBattle } from "./progression"
import { GameSaveSchema, parseGame } from "./storage"
import { useGameStore } from "./useGameStore"
import type { Battle, BattleUnit, ExpeditionRun, GameSave } from "./types"

beforeEach(() => {
  const memory = new Map<string, string>()
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
function fight(run: ExpeditionRun) {
  const entered = enterRunNode(run, run.nodes[run.floor][0].id)
  return { run: entered, battle: startRunBattle(entered) }
}
function wonSave(save = newGame(), seed = 1): GameSave {
  let run = createExpedition(STARTER_DECK, seed)
  let next: GameSave = { ...save, expedition: run }
  for (let floor = 0; floor < 7; floor++) {
    run = enterRunNode(
      run,
      run.nodes[floor].find((n) => n.kind !== "event")!.id,
    )
    if (run.status === "battle") {
      next = settleBattle({
        ...next,
        expedition: run,
        battle: { ...startRunBattle(run), result: "win" },
      })
      run = next.expedition!
      if (run.status === "reward") {
        if (!run.reward!.relicPicked)
          run = pickRunRelic(run, run.reward!.relics[0])
        if (run.status === "reward") run = pickRunCard(run, null)
      }
      next = { ...next, expedition: run, battle: null }
    } else {
      run = resolveRunEvent(run, "rest")
      next = { ...next, expedition: run }
    }
  }
  return next
}
function unit(uid: string, id = "pho-bo", shield = 0): BattleUnit {
  const c = CARD_MAP[id]
  return {
    uid,
    cardId: id,
    attack: c.attack,
    health: 2,
    maxHealth: 2,
    shield,
    ready: true,
    keywords: [],
  }
}
function relicBattle(ids: string[]): Battle {
  const run = { ...createExpedition(STARTER_DECK, 10), relics: ids }
  const b = fight(run).battle
  b.player.mana = b.player.maxMana = 7
  return b
}

describe("expedition journey and rewards", () => {
  it("builds reproducible seven-row maps, keeps all six stories and ten distinct relics", () => {
    expect(createExpedition(STARTER_DECK, 12).nodes).toEqual(
      createExpedition(STARTER_DECK, 12).nodes,
    )
    expect(createExpedition(STARTER_DECK, 13).nodes).not.toEqual(
      createExpedition(STARTER_DECK, 12).nodes,
    )
    expect(EXPEDITION_EVENTS).toHaveLength(6)
    expect(new Set(RELICS.map((r) => r.id)).size).toBe(10)
    expect(CARDS.filter((c) => c.set === "Đoàn lữ hành")).toHaveLength(15)
    for (let seed = 0; seed < 100; seed++) {
      const run = createExpedition(STARTER_DECK, seed)
      expect(
        GameSaveSchema.safeParse({ ...newGame(), expedition: run }).success,
      ).toBe(true)
      expect(run.nodes[6][0].kind).toBe("boss")
      expect(enterRunNode(run, "6-0")).toBe(run)
    }
  })
  it("carries health, snapshots the main deck and blocks entering twice", () => {
    const original = [...STARTER_DECK]
    const run = createExpedition(original, 3)
    original[0] = "caravan-scout"
    expect(run.deck).toEqual(STARTER_DECK)
    run.health = 19
    const { run: entered, battle } = fight(run)
    expect(battle.player.health).toBe(19)
    expect(battle.player.maxHealth).toBe(34)
    expect(enterRunNode(entered, "0-1")).toBe(entered)
    const won = settleRunCombat(entered, {
      ...battle,
      player: { ...battle.player, health: 11 },
      result: "win",
    })
    expect(won.health).toBe(11)
    expect(won.supplies).toBe(65)
    expect(won.status).toBe("reward")
    expect(settleRunCombat(won, { ...battle, result: "win" })).toBe(won)
    expect(
      settleRunCombat(entered, {
        ...battle,
        expedition: { ...battle.expedition!, runId: "wrong" },
        result: "win",
      }),
    ).toBe(entered)
  })
  it("replaces exactly one offered card, preserves 18 cards and rejects third copies or duplicate picks", () => {
    const { run, battle } = fight(createExpedition(STARTER_DECK, 1))
    const won = settleRunCombat(run, { ...battle, result: "win" })
    expect(pickRunCard(won, "spark", 0)).toBe(won)
    const forced = {
      ...won,
      reward: { ...won.reward!, cards: ["spark", "caravan-scout"] },
    }
    expect(pickRunCard(forced, "spark", 0)).toBe(forced)
    expect(pickRunCard(forced, "caravan-scout", 99)).toBe(forced)
    const next = pickRunCard(forced, "caravan-scout", 0)
    expect(next.deck).toHaveLength(18)
    expect(next.deck[0]).toBe("caravan-scout")
    expect(next.floor).toBe(1)
    expect(next.status).toBe("path")
    expect(pickRunCard(next, "caravan-scout", 1)).toBe(next)
    expect(nextRunFloor({ ...won, reward: null }).floor).toBe(1)
  })
  it("requires both card and relic decisions after elite fights, and applies kettle once", () => {
    let run = createExpedition(STARTER_DECK, 8)
    run = { ...run, floor: 2, route: ["0-0", "1-0"] }
    run = enterRunNode(run, "2-1")
    const b = startRunBattle(run)
    expect(b.expedition?.enemyBoost).toBe(1)
    run = settleRunCombat(run, { ...b, result: "win" })
    expect(run.reward?.relics).toHaveLength(3)
    run = { ...run, reward: { ...run.reward!, relics: ["iron-kettle"] } }
    const relic = pickRunRelic(run, "iron-kettle")
    expect(relic.status).toBe("reward")
    expect(relic.maxHealth).toBe(38)
    expect(relic.health).toBe(38)
    expect(pickRunRelic(relic, "iron-kettle")).toBe(relic)
    expect(pickRunCard(relic, null).floor).toBe(3)
  })
  it("prevents unaffordable and lethal event choices and offers a safe alternative", () => {
    const run = createExpedition(STARTER_DECK, 9)
    run.floor = 1
    run.route = ["0-0"]
    run.nodes[1][0].eventId = "empty-bowl"
    const entered = { ...enterRunNode(run, "1-0"), supplies: 0, health: 5 }
    expect(resolveRunEvent(entered, "share")).toBe(entered)
    expect(resolveRunEvent(entered, "listen")).toBe(entered)
    expect(resolveRunEvent(entered, "continue").floor).toBe(2)
    const camp = enterRunNode({ ...run, supplies: 0, health: 1 }, "1-1")
    expect(eventChoices(camp)[0].id).toBe("rest")
    expect(resolveRunEvent(camp, "rest").health).toBe(13)
  })
  it("pays completion once, caps three rewards per day and resets the cap at rollover", () => {
    const one = wonSave()
    expect(one.expedition?.status).toBe("won")
    expect(one.coins).toBe(500)
    expect(one.dust).toBe(90)
    expect(one.xp).toBe(100)
    expect(one.packTickets).toBe(3)
    expect(one.cards).toEqual(newGame().cards)
    expect(one.clearedStages).toEqual([])
    expect(one.expeditionStats.wins).toBe(1)
    const three = wonSave(wonSave(one, 2), 3)
    const four = wonSave(three, 4)
    expect(four.coins).toBe(900)
    expect(four.packTickets).toBe(5)
    expect(four.expeditionStats.wins).toBe(4)
    expect(
      four.claimedDailyQuests.filter((q) => q.startsWith("expedition:")).length,
    ).toBe(3)
    const nextDay = wonSave(rotateDay(four, "2000-01-01"), 5)
    expect(nextDay.coins).toBe(1100)
    expect(nextDay.history.length).toBe(20)
  })
  it("settles a lost or surrendered run without practice rewards, once", () => {
    const { run, battle } = fight(createExpedition(STARTER_DECK))
    const save = settleBattle({
      ...newGame(),
      expedition: run,
      battle: { ...battle, result: "loss" },
    })
    expect(save.expedition?.status).toBe("lost")
    expect(save.expedition?.health).toBe(0)
    expect(save.coins).toBe(300)
    expect(save.history[0].mode).toBe("expedition")
    expect(settleBattle(save)).toBe(save)
  })
})
describe("combat relics and area spells", () => {
  it("adds attack, health, shields and first-unit rush without affecting later summons", () => {
    let b = relicBattle([
      "ember-pin",
      "hearth-apron",
      "sugar-crystal",
      "traveler-boots",
    ])
    b.player.hand = ["caravan-scout", "caravan-smith"]
    b = actBattle(b, { type: "play", index: 0 }).battle
    expect(b.player.board[0]).toMatchObject({
      attack: 2,
      maxHealth: 3,
      shield: 1,
      ready: true,
    })
    b = actBattle(b, { type: "play", index: 0 }).battle
    expect(b.player.board[1]).toMatchObject({
      attack: 4,
      maxHealth: 4,
      shield: 2,
      ready: false,
    })
    expect(b.expedition?.summoned).toBe(2)
  })
  it("draws an opening card, increases initial energy and heals on the player's next turn", () => {
    const run = {
      ...createExpedition(STARTER_DECK),
      health: 15,
      relics: ["tide-compass", "lantern", "grove-seed"],
    }
    const b = fight(run).battle
    expect(b.player.hand).toHaveLength(5)
    expect(b.player.mana).toBe(2)
    b.enemy.hand = []
    b.enemy.deck = ["rebloom"]
    const next = actBattle(b, { type: "end" }).battle
    expect(next.player.health).toBe(16)
    expect(next.player.maxMana).toBe(3)
  })
  it("boosts spells and heals with relics; area damage respects shield and leaves heroes alone", () => {
    let b = relicBattle(["old-recipe", "tea-cup"])
    b.player.health = 10
    b.player.hand = ["caravan-rain", "herb"]
    b.enemy.board = [unit("a"), unit("b", "pho-bo", 1)]
    const enemyHP = b.enemy.health
    b = actBattle(b, { type: "play", index: 0 }).battle
    expect(b.enemy.board).toHaveLength(1)
    expect(b.enemy.board[0].health).toBe(1)
    expect(b.enemy.board[0].shield).toBe(0)
    expect(b.enemy.health).toBe(enemyHP)
    b = actBattle(b, { type: "play", index: 0 }).battle
    expect(b.player.health).toBe(16)
  })
  it("keeps AI summoning healing units when its hero is at full health", () => {
    const b = relicBattle([])
    b.enemy.hand = ["caravan-herbalist"]
    b.enemy.maxMana = 1
    const next = actBattle(b, { type: "end" }).battle
    expect(next.enemy.board.some((u) => u.cardId === "caravan-herbalist")).toBe(
      true,
    )
  })
})
describe("expedition storage and store", () => {
  it("loads v2 saves with default expedition fields, preserves live runs and rejects broken references", () => {
    const old: Record<string, unknown> = { ...newGame() }
    delete old.expedition
    delete old.expeditionStats
    delete old.history
    expect(parseGame(old)?.expedition).toBeNull()
    expect(parseGame(old)?.history).toEqual([])
    const { run, battle } = fight(createExpedition(STARTER_DECK))
    const save = { ...newGame(), expedition: run, battle }
    expect(parseGame(JSON.parse(JSON.stringify(save)))).toEqual(save)
    expect(parseGame({ ...save, expedition: null })).toBeNull()
    expect(
      parseGame({ ...save, expedition: { ...run, relics: ["bogus"] } }),
    ).toBeNull()
    expect(
      parseGame({ ...save, expedition: { ...run, health: 999 } }),
    ).toBeNull()
    expect(
      parseGame({ ...save, expedition: { ...run, route: ["6-0"] } }),
    ).toBeNull()
  })
  it("guards active journeys, resumes through sync and counts surrender as loss", () => {
    const store = useGameStore.getState()
    expect(store.beginExpedition()).toBe(true)
    expect(store.beginExpedition()).toBe(false)
    expect(store.start(null)).toBe(false)
    expect(store.start("lantern-1")).toBe(false)
    store.enterExpedition("0-0")
    const snapshot = useGameStore.getState().save
    store.sync()
    expect(useGameStore.getState().save.expedition).toEqual(snapshot.expedition)
    expect(useGameStore.getState().save.battle?.id).toBe(snapshot.battle?.id)
    store.leaveBattle()
    expect(useGameStore.getState().save.expedition?.status).toBe("lost")
    expect(useGameStore.getState().save.history[0].result).toBe("loss")
    expect(useGameStore.getState().save.expeditionStats.runs).toBe(1)
  })
  it("protects state when persistence fails instead of partially beginning a run", () => {
    const before = useGameStore.getState().save
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        setItem: () => {
          throw new Error("quota")
        },
      },
    })
    expect(useGameStore.getState().beginExpedition()).toBe(false)
    expect(useGameStore.getState().save).toBe(before)
  })
})

function seededRandom(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}
function playJourneyBattle(initial: Battle): Battle {
  let b = initial
  for (let turn = 0; turn < 60 && !b.result; turn++) {
    if (b.tactic?.status === "pending") {
      const next = actBattle(b, {
        type: "tactic",
        id: b.player.board.length >= 2 ? "flame" : "shelter",
      })
      expect(next.error).toBeNull()
      b = next.battle
    }
    for (let i = 0; i < 12 && !b.result; i++) {
      const choices = b.player.hand
        .map((id, index) => ({ card: CARD_MAP[id], index }))
        .filter(
          ({ card: c }) =>
            c.cost <= b.player.mana &&
            (c.kind !== "unit" || b.player.board.length < 3) &&
            (!["ward", "buff"].includes(c.effect ?? "") ||
              b.player.board.length > 0) &&
            (c.kind === "unit" ||
              c.effect !== "heal" ||
              b.player.health < b.player.maxHealth) &&
            (c.effect !== "draw" || b.player.deck.length > 0) &&
            (c.effect !== "sweep" || b.enemy.board.length > 0),
        )
      choices.sort(
        (a, z) =>
          (z.card.kind === "unit" ? z.card.cost + 5 : z.card.cost) -
          (a.card.kind === "unit" ? a.card.cost + 5 : a.card.cost),
      )
      if (!choices.length) break
      const { card, index } = choices[0]
      const target =
        b.enemy.health <= (card.power ?? 0)
          ? "hero"
          : (b.enemy.board.find((u) => u.health + u.shield <= (card.power ?? 0))
              ?.uid ?? "hero")
      const next = actBattle(b, {
        type: "play",
        index,
        target: card.effect === "damage" ? target : undefined,
      })
      expect(next.error).toBeNull()
      b = next.battle
    }
    for (const uid of b.player.board.filter((u) => u.ready).map((u) => u.uid)) {
      if (b.result) break
      const attacker = b.player.board.find((u) => u.uid === uid)!
      const guard = b.enemy.board
        .filter((u) => u.keywords.includes("guard"))
        .sort((a, z) => a.health + a.shield - z.health - z.shield)[0]
      const trade = b.enemy.board.find(
        (u) =>
          u.health + u.shield <= attacker.attack &&
          u.attack < attacker.health + attacker.shield,
      )
      const result = actBattle(b, {
        type: "attack",
        uid,
        target:
          guard?.uid ??
          (b.enemy.health <= attacker.attack ? "hero" : (trade?.uid ?? "hero")),
      })
      expect(result.error).toBeNull()
      b = result.battle
    }
    if (!b.result) b = actBattle(b, { type: "end" }).battle
  }
  expect(b.result).not.toBeNull()
  return b
}
it("resolves 30 starter encounters and 20 complete journeys with real turns, health carryover and seeded decks", () => {
  let starterWins = 0,
    completed = 0
  for (let seed = 1; seed <= 30; seed++) {
    const run = enterRunNode(createExpedition(STARTER_DECK, seed), "0-0")
    if (
      playJourneyBattle(startRunBattle(run, seededRandom(seed))).result ===
      "win"
    )
      starterWins++
  }
  const mature = [
    "chef-nhien",
    "chef-nhien",
    "chef-moc",
    "chef-moc",
    "caravan-porter",
    "caravan-porter",
    "pho-bo",
    "pho-bo",
    "banh-mi",
    "banh-mi",
    "caravan-thorns",
    "caravan-thorns",
    "herb",
    "herb",
    "family-table",
    "family-table",
    "seasoning",
    "seasoning",
  ]
  for (let seed = 1; seed <= 20; seed++) {
    let run = createExpedition(mature, seed)
    for (let floor = 0; floor < 7; floor++) {
      run = enterRunNode(
        run,
        run.nodes[floor].find((n) => n.kind !== "event")!.id,
      )
      if (run.status === "battle") {
        run = settleRunCombat(
          run,
          playJourneyBattle(
            startRunBattle(run, seededRandom(seed * 17 + floor)),
          ),
        )
        if (run.status === "lost") break
        if (run.status === "reward" && !run.reward!.relicPicked)
          run = pickRunRelic(
            run,
            run.reward!.relics.find(
              (id) => id === "iron-kettle" || id === "traveler-boots",
            ) ?? run.reward!.relics[0],
          )
        if (run.status === "reward") run = pickRunCard(run, null)
      } else run = resolveRunEvent(run, "rest")
      if (run.status === "won") completed++
      expect(run.health).toBeLessThanOrEqual(run.maxHealth)
      expect(run.deck).toHaveLength(18)
    }
  }
  expect(starterWins).toBeGreaterThanOrEqual(10)
  // Harder leaders reduce this fixed greedy policy's clears; full journeys must remain viable.
  expect(completed).toBeGreaterThanOrEqual(3)
})
