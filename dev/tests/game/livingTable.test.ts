import { clearProtectedState } from "@/infrastructure/storage/protectedStorage"
import { beforeEach, describe, expect, it } from "vitest"
import { readFileSync, statSync } from "node:fs"
import { actBattle, startBattle } from "@/game/battle"
import { CARDS, CARD_MAP, STARTER_DECK, deckErrors } from "@/game/catalog"
import { newGame, settleBattle } from "@/game/progression"
import { bossIntent, midScene, prepareEncounter } from "@/game/encounters"
import {
  DECK_STYLES,
  analyzeDeck,
  sampleHand,
  suggestDeck,
} from "@/game/deckStrategy"
import {
  emptyWeekly,
  startSideQuest,
  startWeekly,
  weeklyChallenge,
  weeklyId,
} from "@/game/journeys"
import { createSaveCode, readSaveCode } from "@/game/saveCode"
import { CHARACTER_ART } from "@/game/characters"
import { parseGame } from "@/game/storage"
import { useGameStore } from "@/game/useGameStore"
import type { Battle, BattleUnit } from "@/game/types"

function unit(
  uid: string,
  cardId = "pho-bo",
  overrides: Partial<BattleUnit> = {},
): BattleUnit {
  const c = CARD_MAP[cardId]
  return {
    uid,
    cardId,
    attack: c.attack,
    health: c.health,
    maxHealth: c.health,
    shield: 0,
    ready: true,
    keywords: [...c.keywords],
    ...overrides,
  }
}
function arena(): Battle {
  const b = startBattle(STARTER_DECK, null)
  b.player.mana = b.player.maxMana = 7
  b.player.health = 10
  return b
}
function playPair(first: string, second: string) {
  const b = arena()
  b.player.hand = [first, second]
  b.player.deck = ["pho-bo"]
  const a = actBattle(b, { type: "play", index: 0 })
  expect(a.error).toBeNull()
  return {
    before: a.battle,
    result: actBattle(a.battle, {
      type: "play",
      index: 0,
      ...(CARD_MAP[second].effect === "damage" ? { target: "hero" } : {}),
    }),
  }
}
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
  clearProtectedState()
  useGameStore.setState({ save: newGame(), notice: null, presentation: null })
})
describe("recipe combat", () => {
  it("resolves three distinct recipes with separate frames and actual bonuses", () => {
    const home = playPair("pho-bo", "herb")
    expect(home.result.error).toBeNull()
    expect(home.result.battle.player.health).toBe(
      Math.min(34, home.before.player.health + (CARD_MAP.herb.power ?? 0) + 3),
    )
    expect(home.result.battle.player.board[0].shield).toBe(
      home.before.player.board[0].shield + 1,
    )
    const street = playPair("banh-mi", "spark")
    expect(street.result.battle.enemy.health).toBe(
      street.before.enemy.health - (CARD_MAP.spark.power ?? 0) - 1,
    )
    expect(street.result.battle.player.hand).toEqual(["pho-bo"])
    const tet = playPair("com-tam", "seasoning")
    expect(tet.result.battle.player.board[0].attack).toBe(
      tet.before.player.board[0].attack + (CARD_MAP.seasoning.power ?? 0) + 1,
    )
    expect(tet.result.battle.player.board[0].shield).toBe(
      tet.before.player.board[0].shield + 1,
    )
    for (const [id, entry] of [
      ["home", home],
      ["street", street],
      ["tet", tet],
    ] as const) {
      expect(entry.result.frames.map((f) => f.event.kind)).toEqual([
        "play",
        "combo",
      ])
      expect(entry.result.battle.comboCounts?.[id]).toBe(1)
      expect(entry.result.battle.tableAura?.id).toBe(id)
    }
  })
  it("requires consecutive plays in one turn, honors once-per-turn and preserves invalid attempts", () => {
    const b = arena()
    b.player.recipeTrail = ["pho-bo"]
    b.player.recipesUsed = ["home"]
    b.player.hand = ["herb"]
    expect(
      actBattle(b, { type: "play", index: 0 }).frames.some(
        (f) => f.event.kind === "combo",
      ),
    ).toBe(false)
    b.player.recipesUsed = []
    b.player.mana = 0
    const invalid = actBattle(b, { type: "play", index: 0 })
    expect(invalid.battle).toBe(b)
    expect(b.player.recipeTrail).toEqual(["pho-bo"])
    b.player.mana = 7
    b.enemy.deck = ["herb", "herb"]
    b.enemy.hand = []
    b.enemy.board = []
    const next = actBattle(b, { type: "end" }).battle
    expect(next.player.recipeTrail).toEqual([])
    expect(next.player.recipesUsed).toEqual([])
    const heal = actBattle(next, { type: "play", index: 0 })
    expect(heal.frames.some((f) => f.event.kind === "combo")).toBe(false)
  })
  it("does not grant a combo after a lethal spell, and records objective wins", () => {
    const b = arena()
    b.enemy.health = 1
    b.player.hand = ["spark"]
    b.player.recipeTrail = ["banh-mi"]
    const hit = actBattle(b, { type: "play", index: 0, target: "hero" })
    expect(hit.battle.result).toBe("win")
    expect(hit.frames.some((f) => f.event.kind === "combo")).toBe(false)
  })
})
describe("boss objectives and scene continuity", () => {
  it("wins by keeping a Guard on the table through three enemy turns", () => {
    let b = prepareEncounter(startBattle(STARTER_DECK, "lantern-3"))
    b.player.board = [
      unit("guard", "pho-bo", {
        keywords: ["guard"],
        health: 100,
        maxHealth: 100,
      }),
    ]
    b.enemy.hand = []
    b.enemy.deck = Array(10).fill("herb")
    for (let i = 0; i < 3; i++) b = actBattle(b, { type: "end" }).battle
    expect(b.result).toBe("win")
    expect(b.enemy.health).toBeGreaterThan(0)
    expect(b.encounter).toMatchObject({ progress: 3, integrity: 6 })
  })
  it("extinguishes an undefended fire without an automatic loss; rescue wins after three removals", () => {
    let b = prepareEncounter(startBattle(STARTER_DECK, "lantern-3"))
    b.enemy.hand = []
    b.enemy.deck = Array(10).fill("herb")
    for (let i = 0; i < 3; i++) b = actBattle(b, { type: "end" }).battle
    expect(b.encounter?.integrity).toBe(0)
    expect(b.result).toBeNull()
    const rescue = prepareEncounter(arena())
    rescue.bossRuleId = "harbor-3"
    prepareEncounter(rescue)
    rescue.enemy.board = [
      unit("e1", "pho-bo", { health: 1, shield: 0 }),
      unit("e2", "pho-bo", { health: 1, shield: 0 }),
      unit("e3", "pho-bo", { health: 1, shield: 0 }),
    ]
    rescue.player.board = [
      unit("p", "pho-bo", { attack: 10, health: 100, maxHealth: 100 }),
    ]
    for (const uid of ["e1", "e2", "e3"]) {
      rescue.player.board[0].ready = true
      const next = actBattle(rescue, { type: "attack", uid: "p", target: uid })
      Object.assign(rescue, next.battle)
    }
    expect(rescue.result).toBe("win")
    expect(rescue.encounter?.progress).toBe(3)
  })
  it("queues boss cutscenes once, preserves them on reload, and acknowledgement only updates scene state", () => {
    const b = prepareEncounter(startBattle(STARTER_DECK, "lantern-3"))
    b.player.mana = 7
    b.player.maxMana = 7
    b.player.hand = ["spark"]
    b.enemy.health = Math.floor(b.enemy.maxHealth / 2) + 1
    const r = actBattle(b, { type: "play", index: 0, target: "hero" })
    expect(r.battle.pendingScenes).toEqual(["awaken:lantern-3"])
    const save = parseGame({ ...newGame(), battle: r.battle })!
    expect(save.battle?.pendingScenes).toEqual(r.battle.pendingScenes)
    useGameStore.setState({ save })
    useGameStore.getState().acknowledgeScene("awaken:lantern-3")
    const acknowledged = useGameStore.getState().save
    expect(acknowledged.coins).toBe(save.coins)
    expect(acknowledged.stats).toEqual(save.stats)
    expect(acknowledged.battle?.seenScenes).toEqual(["awaken:lantern-3"])
    expect(acknowledged.battle?.pendingScenes).toEqual([])
    expect(midScene("awaken:garden-3", arena()).lines[0].text).not.toContain(
      "ba lần",
    )
    expect(
      bossIntent({ ...b, enemy: { ...b.enemy, health: 1 } })?.text,
    ).toContain("2")
  })
})
describe("decks and companions", () => {
  it("suggests owned legal decks, distinct strategies, recipe coverage and non-mutating hands", () => {
    const owned = Object.fromEntries(CARDS.map((c) => [c.id, 2])),
      decks = DECK_STYLES.map((s) => suggestDeck(owned, s.id))
    for (const cards of decks) {
      expect(deckErrors(cards, owned)).toEqual([])
      expect(
        analyzeDeck(cards).combos.some(
          (c) => c.anchors.length && c.finishers.length,
        ),
      ).toBe(true)
    }
    expect(new Set(decks.map((d) => JSON.stringify(d))).size).toBeGreaterThan(3)
    const starter = suggestDeck(newGame().cards, "guard")
    expect(deckErrors(starter, newGame().cards)).toEqual([])
    const copy = [...starter]
    expect(sampleHand(starter, () => 0.5)).toHaveLength(4)
    expect(starter).toEqual(copy)
  })
  it("captures a quest choice, helps exactly once at turn 3, and pays the first win once", () => {
    let b = startSideQuest(STARTER_DECK, "moc", "share")
    b.opening = false
    b.player.health = 10
    b.enemy.hand = []
    b.enemy.deck = Array(10).fill("herb")
    b = actBattle(b, { type: "end" }).battle
    expect(b.companion?.used).toBe(false)
    const assistance = actBattle(b, { type: "end" })
    b = assistance.battle
    expect(b.companion?.used).toBe(true)
    expect(
      assistance.frames.filter((f) => f.event.kind === "assist"),
    ).toHaveLength(1)
    expect(b.pendingScenes).toEqual(["assist:moc"])
    expect(
      actBattle(b, { type: "end" }).frames.some(
        (f) => f.event.kind === "assist",
      ),
    ).toBe(false)
    const first = settleBattle({
      ...newGame(),
      battle: { ...b, result: "win" },
    })
    expect(first.bonds?.moc).toEqual({ choice: "share", completed: true })
    expect(first.coins).toBe(380)
    expect(settleBattle(first)).toBe(first)
    const replay = settleBattle({
      ...first,
      battle: {
        ...startSideQuest(STARTER_DECK, "moc", "listen"),
        result: "win",
      },
    })
    expect(replay.coins).toBe(first.coins)
    expect(replay.bonds?.moc?.choice).toBe("listen")
  })
  it("gates quests and supports six decks", () => {
    expect(useGameStore.getState().startSideQuest("bach", "share")).toBe(false)
    const store = useGameStore.getState()
    for (let i = 0; i < 5; i++) store.saveDeck(`d${i}`, `Bộ ${i}`, STARTER_DECK)
    expect(useGameStore.getState().save.decks).toHaveLength(6)
    store.saveDeck("seventh", "Không", STARTER_DECK)
    expect(useGameStore.getState().save.decks).toHaveLength(6)
  })
})
describe("weekly consistency and rewards", () => {
  it("uses Monday weeks and identical fixed shuffles, including saved mulligan RNG", () => {
    expect(weeklyId("2026-10-11")).toBe("2026-10-05")
    expect(weeklyId("2026-10-12")).toBe("2026-10-12")
    expect(weeklyChallenge("2026-10-07")).toEqual(weeklyChallenge("2026-10-09"))
    const a = startWeekly(0, "2026-10-07"),
      b = startWeekly(0, "2026-10-09")
    expect(a.player).toEqual(b.player)
    expect(a.enemy).toEqual(b.enemy)
    const loaded = parseGame({ ...newGame(), battle: a })!.battle!
    const action = { type: "mulligan" as const, indices: [0, 2] }
    expect(actBattle(a, action).battle.player).toEqual(
      actBattle(loaded, action).battle.player,
    )
  })
  it("advances three legs, pays once per week and restarts a losing sequence", () => {
    const week = weeklyId()
    let save = { ...newGame(), weeklyRecords: { [week]: emptyWeekly() } }
    for (let i = 0; i < 3; i++) {
      const battle = startWeekly(i)
      battle.result = "win"
      save = (settleBattle({ ...save, battle }) as typeof save)
    }
    expect(save.weeklyRecords[week]).toMatchObject({
      stage: 0,
      claimed: true,
      completions: 1,
    })
    expect(save.weeklyRecords[week].best).toBeGreaterThan(0)
    expect(save.coins).toBe(450)
    expect(save.battle?.weekly?.score).toBe(save.weeklyRecords[week].best)
    for (let i = 0; i < 3; i++) {
      const battle = startWeekly(i)
      battle.result = "win"
      save = (settleBattle({ ...save, battle }) as typeof save)
    }
    expect(save.coins).toBe(450)
    expect(save.weeklyRecords[week].completions).toBe(2)
    const loss = startWeekly(1)
    loss.result = "loss"
    const reset = settleBattle({
      ...save,
      weeklyRecords: {
        [week]: { ...save.weeklyRecords[week], stage: 1, score: 160 },
      },
      battle: loss,
    })
    expect(reset.weeklyRecords?.[week]).toMatchObject({
      stage: 0,
      score: 0,
      claimed: true,
    })
  })
})
describe("portable save codes and shipped art", () => {
  it("rejects conflicting modes, repeated scenes and unearned companions", () => {
    const battle = startWeekly(0)
    expect(
      parseGame({ ...newGame(), battle: { ...battle, sideQuest: "bach" } }),
    ).toBeNull()
    expect(
      parseGame({
        ...newGame(),
        battle: { ...battle, pendingScenes: ["assist:bach", "assist:bach"] },
      }),
    ).toBeNull()
    expect(parseGame({ ...newGame(), companion: "bach" })).toBeNull()
  })
  it("round-trips live battles, choices, scenes and weekly state through authenticated codes", async () => {
    const save = {
      ...newGame(),
      bonds: { bach: { choice: "listen" as const, completed: true } },
      companion: "bach" as const,
      battle: startWeekly(0),
      weeklyRecords: { [weeklyId()]: emptyWeekly() },
    }
    save.battle.pendingScenes = ["assist:bach"]
    for (const compressed of [false, true]) {
      const code = await createSaveCode(save, compressed)
      expect(code).toMatch(/^MGC1\.[gn]\./)
      expect((await readSaveCode(code)).save).toEqual(save)
      expect(await createSaveCode(save, compressed)).not.toBe(code)
    }
  })
  it("rejects corrupted, truncated, oversized and unsupported codes before changing current progress", async () => {
    const save = useGameStore.getState().save,
      code = await createSaveCode(save, false),
      parts = code.split(".")
    parts[4] = (parts[4][0] === "A" ? "B" : "A") + parts[4].slice(1)
    for (const invalid of [
      parts.join("."),
      code.slice(0, -10),
      code.replace("MGC1", "MGC2"),
      "MGC1.g....",
      "x".repeat(2_000_001),
    ])
      await expect(readSaveCode(invalid)).rejects.toThrow()
    expect(useGameStore.getState().save).toBe(save)
  })
  it("loads legacy saves with defaults and validates actual new portrait/board/effect bytes", () => {
    const old = JSON.parse(JSON.stringify(newGame()))
    delete old.bonds
    delete old.companion
    delete old.weeklyRecords
    expect(parseGame(old)).toMatchObject({
      bonds: {},
      companion: null,
      weeklyRecords: {},
    })
    let bytes = 0
    for (const src of [
      ...new Set(Object.values(CHARACTER_ART)),
      ...["home", "street", "tet"].map((id) => `/assets/tcg/boards/${id}.webp`),
      "/assets/tcg/fx/recipe-burst.webp",
    ]) {
      const path = `public${src}`
      expect(readFileSync(path).subarray(0, 4).toString()).toBe("RIFF")
      bytes += statSync(path).size
    }
    expect(bytes).toBeLessThan(3 * 1024 * 1024)
  })
})
