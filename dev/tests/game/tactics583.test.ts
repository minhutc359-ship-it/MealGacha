import { describe, it, expect } from "vitest"
import { getBattleHint } from "@/game/battleCoach"
import { actBattle, startBattle } from "@/game/battle"
import { CARD_MAP, STARTER_DECK } from "@/game/catalog"
import { DECK_STYLES, suggestDeck, analyzeDeck } from "@/game/deckStrategy"
import { newGame } from "@/game/progression"
import { parseGame } from "@/game/storage"
import type { Battle, BattleUnit } from "@/game/types"
function unit(id: string, uid = id): BattleUnit {
  const c = CARD_MAP[id]
  return {
    uid,
    cardId: id,
    attack: c.attack,
    health: c.health,
    maxHealth: c.health,
    shield: 0,
    ready: true,
    keywords: [...c.keywords],
  }
}
function arena() {
  const b = startBattle(STARTER_DECK, null, "wisdom", () => 0.42)
  for (const side of ["player", "enemy"] as const) {
    b[side].board = []
    b[side].mana = b[side].maxMana = 7
    b[side].hand = []
    b[side].deck = Array(15).fill("spark")
    b[side].health = 30
  }
  return b
}
function play(b: Battle, id: string, target?: string) {
  b.player.mana = 7
  b.player.hand.push(id)
  const r = actBattle(b, {
    type: "play",
    index: b.player.hand.length - 1,
    target,
  })
  expect(r.error).toBeNull()
  return r.battle
}
function strike(b: Battle, uid: string, target: string) {
  const r = actBattle(b, { type: "attack", uid, target })
  expect(r.error).toBeNull()
  return r.battle
}
describe("ten tactical identities", () => {
  it("the coach removes a visible lethal attacker before non-lethal face damage", () => {
    const b = arena(),
      a = unit("banh-mi", "a"),
      d = unit("pho-bo", "threat")
    a.attack = 3
    a.health = 10
    a.keywords = []
    d.health = 2
    d.attack = 8
    d.keywords = []
    b.player.health = 4
    b.player.board = [a]
    b.enemy.board = [d]
    expect(getBattleHint(b)?.action).toEqual({
      type: "attack",
      uid: "a",
      target: "threat",
    })
  })
  it("breaks the largest shield without dealing free damage or touching another shield", () => {
    const b = arena()
    b.enemy.board = [unit("pho-bo", "a"), unit("pho-bo", "b")]
    b.enemy.board[0].shield = 8
    b.enemy.board[1].shield = 2
    const out = play(b, "bun-bo-hue")
    expect(out.enemy.board[0]).toMatchObject({
      shield: 0,
      health: b.enemy.board[0].health,
    })
    expect(out.enemy.board[1].shield).toBe(2)
  })
  it.each([
    ["banh-xeo", false, 2],
    ["banh-xeo", true, 0],
    ["cha-ruoi", true, 2],
    ["cha-ruoi", false, 0],
  ] as const)(
    "%s conditions damage on a real unit's wound state %s",
    (id, wounded, bonus) => {
      const b = arena(),
        a = unit(id, "a"),
        d = unit("pho-bo", "d")
      d.maxHealth = 20
      d.health = wounded ? 19 : 20
      d.attack = 0
      b.player.board = [a]
      b.enemy.board = [d]
      expect(strike(b, "a", "d").enemy.board[0].health).toBe(
        d.health - a.attack - bonus,
      )
      b.enemy.board = []
      expect(strike(b, "a", "hero").enemy.health).toBe(30 - a.attack)
    },
  )
  it("siphons shield before the simultaneous counterattack and cannot siphon from a hero", () => {
    const b = arena()
    b.player.board = [unit("cha-ca-la-vong", "a")]
    const d = unit("pho-bo", "d")
    d.shield = 3
    d.attack = 1
    d.health = d.maxHealth = 20
    b.enemy.board = [d]
    const out = strike(b, "a", "d")
    expect(out.player.board[0].shield).toBe(1)
    expect(out.player.board[0].health).toBe(b.player.board[0].health)
    expect(out.enemy.board[0].shield).toBe(0)
  })
  it("triage chooses missing health rather than lowest current health", () => {
    const b = arena(),
      a = unit("pho-bo", "a"),
      z = unit("pho-bo", "z")
    a.maxHealth = 10
    a.health = 4
    z.maxHealth = 3
    z.health = 1
    b.player.board = [a, z]
    const out = play(b, "che-buoi")
    expect(out.player.board.find((u) => u.uid === "a")!.health).toBe(8)
    expect(out.player.board.find((u) => u.uid === "z")!.health).toBe(1)
  })
  it("relay needs another school and another living ally, then triggers only once per turn", () => {
    let b = arena()
    b.player.board = [unit("bun-rieu", "relay"), unit("pho-bo", "friend")]
    b = play(b, "tea-break")
    expect(b.player.board[0].triggers ?? 0).toBe(0)
    const different = Object.values(CARD_MAP).find(
      (ca) =>
        ca.kind === "spell" &&
        ca.school !== CARD_MAP["bun-rieu"].school &&
        ca.effect === "damage" &&
        ca.cost <= 3,
    )!
    const attack = b.player.board[1].attack
    b = play(b, different.id, "hero")
    b = play(b, different.id, "hero")
    expect(b.player.board[1].attack).toBe(attack + 1)
    expect(b.player.board[0].triggers).toBe(1)
  })
  it("second-spell refund is once per turn and never overfills mana", () => {
    let b = arena()
    b.player.board = [unit("xoi-xeo")]
    b = play(b, "spark", "hero")
    expect(b.player.board[0].triggers ?? 0).toBe(0)
    b = play(b, "spark", "hero")
    expect(b.player.mana).toBe(7)
    expect(b.player.board[0].triggers).toBe(1)
    b = play(b, "spark", "hero")
    expect(b.player.mana).toBe(6)
  })
  it("last-hand reserve draws twice; extra hand cards suppress it", () => {
    expect(play(arena(), "banh-tet").player.hand).toHaveLength(2)
    const b = arena()
    b.player.hand = ["spark"]
    expect(play(b, "banh-tet").player.hand).toEqual(["spark"])
  })
  it("thaw restores an iced turn without refreshing an ally that already attacked", () => {
    const b = arena(),
      a = unit("pho-bo", "ice"),
      z = unit("pho-bo", "used")
    a.ready = false
    a.icedThisTurn = true
    z.ready = false
    b.player.board = [a, z]
    const out = play(b, "ca-phe-trung")
    expect(out.player.board[0]).toMatchObject({
      ready: true,
      icedThisTurn: false,
      frozen: false,
    })
    expect(out.player.board[1].ready).toBe(false)
  })
  it("a simultaneous death transfers testament only to survivors and only once", () => {
    const b = arena(),
      a = unit("banh-chung", "a"),
      z = unit("pho-bo", "friend"),
      d = unit("pho-bo", "d")
    a.health = d.health = 1
    a.attack = d.attack = 10
    b.player.board = [a, z]
    b.enemy.board = [d]
    const out = strike(b, "a", "d")
    expect(out.player.board[0]).toMatchObject({
      uid: "friend",
      attack: z.attack + 1,
      shield: 2,
    })
    expect(out.player.graveyard).toEqual(["banh-chung"])
    const g = newGame()
    g.battle = out
    const parsed = parseGame(g)
    expect(parsed?.battle?.player.board[0].shield).toBe(2)
  })
  it("AI chooses a live shield counter before a similar-cost unit", () => {
    const b = arena()
    b.enemy.hand = ["cha-ruoi", "bun-bo-hue"]
    b.player.board = [unit("pho-bo", "tank")]
    b.player.board[0].shield = 8
    const out = actBattle(b, { type: "end" })
    expect(
      out.frames.find(
        (f) => f.event.kind === "play" && f.event.side === "enemy",
      )?.event.cardId,
    ).toBe("bun-bo-hue")
  })
  it("builds a legal counterplay deck without changing IDs or starter ownership", () => {
    const owned = Object.fromEntries(
        Object.keys(CARD_MAP).map((id) => [id, 2]),
      ),
      deck = suggestDeck(owned, "counterplay")
    expect(DECK_STYLES.some((s) => s.id === "counterplay")).toBe(true)
    expect(deck).toHaveLength(24)
    expect(analyzeDeck(deck).units).toBeGreaterThanOrEqual(14)
    expect(deck.some((id) => CARD_MAP[id].ability === "breach")).toBe(true)
  })
})
