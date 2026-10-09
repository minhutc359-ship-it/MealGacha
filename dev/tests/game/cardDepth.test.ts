import { describe, expect, it } from "vitest"
import { actBattle, playError, startBattle } from "@/game/battle"
import { CARD_MAP, CARDS, STARTER_DECK } from "@/game/catalog"
import { analyzeDeck, suggestDeck } from "@/game/deckStrategy"
import { getBattleHint } from "@/game/battleCoach"
import { newGame } from "@/game/progression"
import { parseGame } from "@/game/storage"
import type { Ability, Battle, BattleUnit } from "@/game/types"

const abilityCard = (ability: Ability) => CARDS.find(c => c.kind === "unit" && c.ability === ability)!
function unit(id: string, uid: string): BattleUnit {
  const c = CARD_MAP[id]
  return { uid, cardId: id, attack: c.attack, health: c.health, maxHealth: c.health, shield: 0, keywords: [...c.keywords], ready: true }
}
function arena(): Battle {
  const b = startBattle(STARTER_DECK, null, "wisdom", () => .42)
  b.player.mana = b.player.maxMana = 7; b.enemy.mana = b.enemy.maxMana = 7
  b.enemy.hand = []; b.enemy.deck = []
  b.player.deck = Array(12).fill("spark"); b.player.hand = []
  b.player.health = 10; b.enemy.health = 30
  return b
}
const play = (b: Battle, id: string, target?: string) => {
  b.player.hand.push(id)
  const r = actBattle(b, { type: "play", index: b.player.hand.length - 1, target })
  expect(r.error).toBeNull()
  return r.battle
}
describe("distinct card engines and tactical decisions", () => {
  it("distributes all eleven unit abilities and preserves the starter curve", () => {
    for (const id of ["ambush", "spellfire", "scout", "snare", "mender", "bloom", "host", "pantry", "farewell", "weaver", "welcome"] as Ability[]) expect(abilityCard(id), id).toBeDefined()
    expect(new Set(CARDS.filter(c => c.kind === "spell").map(c => `${c.effect}:${c.ability ?? "basic"}`)).size).toBeGreaterThanOrEqual(20)
    expect(STARTER_DECK).toHaveLength(18)
    expect(analyzeDeck(STARTER_DECK).cheap).toBeGreaterThanOrEqual(6)
  })
  it("casts activate spellfire/weaver only twice and actual healing alone activates bloom", () => {
    let b = arena()
    b.player.board = [unit(abilityCard("spellfire").id, "fire"), unit(abilityCard("weaver").id, "weave"), unit(abilityCard("bloom").id, "bloom")]
    const attack = b.player.board[0].attack, bloom = b.player.board[2].attack
    for (let n = 0; n < 3; n++) b = play(b, "spark", "hero")
    expect(b.player.board[0].attack).toBe(attack + 2)
    expect(b.player.board[1].triggers).toBe(2)
    expect(b.player.spellsThisTurn).toBe(3)
    b = play(b, "herb")
    expect(b.player.board[2].attack).toBe(bloom + 1)
    b.player.health = b.player.maxHealth
    b.player.mana = 7; b = play(b, "herb")
    expect(b.player.board[2].attack).toBe(bloom + 1)
  })
  it("piercing preserves shields, washing removes shields, and starlight scales with prior spells", () => {
    let b = arena()
    b.enemy.board = [unit("chef-bach", "tank")]; b.enemy.board[0].shield = 10; b.enemy.board[0].health = b.enemy.board[0].maxHealth = 20
    const pierce = play(structuredClone(b), "dragon-breath", "tank")
    expect(pierce.enemy.board[0]).toMatchObject({ health: 13, shield: 10 })
    const wash = play(structuredClone(b), "tidal-cut", "tank")
    expect(wash.enemy.board[0]).toMatchObject({ health: 17, shield: 0 })
    b = play(b, "spark", "hero"); b = play(b, "tea-break"); b = play(b, "starlight", "hero")
    expect(b.enemy.health).toBe(22)
  })
  it("sacrifice fires a death trigger once, stores the corpse, and revival skips entry/rush", () => {
    let b = arena()
    const victim = unit(abilityCard("pantry").id, "pantry"), survivor = unit("pho-bo", "survivor")
    victim.health = 1
    b.player.board = [victim, survivor]
    b = play(b, "hearth-legacy")
    expect(b.player.health).toBe(13)
    expect(b.player.board).toHaveLength(1)
    expect(b.player.board[0]).toMatchObject({ attack: survivor.attack + 2, maxHealth: survivor.maxHealth + 3 })
    expect(b.player.graveyard).toEqual([victim.cardId])
    // Re-enter a rushing unit with a draw ability: neither rush nor entry repeats.
    b.player.graveyard = ["chef-nhien", "caravan-letter"]
    b.player.mana = 7
    const deck = b.player.deck.length
    b = play(b, "sea-memory")
    expect(b.player.board.at(-1)).toMatchObject({ cardId: "caravan-letter", health: 2, ready: false })
    expect(b.player.deck).toHaveLength(deck)
    expect(b.player.graveyard).toEqual(["chef-nhien"])
  })
  it("invalid sacrifice/revival does not consume mana, cards or mutate the input", () => {
    const b = arena(); b.player.hand = ["hearth-legacy", "sea-memory"]
    const before = structuredClone(b)
    expect(playError(b, 0)).toBeTruthy(); expect(playError(b, 1)).toContain("ô trống")
    for (const index of [0, 1]) expect(actBattle(b, { type: "play", index }).battle).toBe(b)
    expect(b).toEqual(before)
  })
  it("opponent recognizes that a piercing spell can kill through a large shield", () => {
    const b = arena(); b.player.board = [unit("chef-bach", "guard")]
    b.player.board[0].health = 5; b.player.board[0].shield = 10
    b.enemy.hand = ["dragon-breath"]
    const out = actBattle(b, { type: "end" })
    expect(out.frames.some(f => f.event.cardId === "dragon-breath" && f.event.target === "guard")).toBe(true)
    expect(out.battle.player.board).toEqual([])
  })
  it("frozen carry skips exactly one enemy attack and AI can revive without any cards left in its deck", () => {
    const b = arena(); b.enemy.board = [unit("chef-bach", "sleep")]
    b.enemy.board[0].attack = 0; b.enemy.hand = ["sea-memory"]; b.enemy.graveyard = ["pho-bo"]
    const dream = play(b, "sweet-dream")
    expect(dream.enemy.board[0].frozen).toBe(true)
    const next = actBattle(dream, { type: "end" })
    expect(next.frames.some(f => f.event.kind === "attack" && f.event.source === "sleep")).toBe(false)
    expect(next.battle.enemy.board.some(u => u.cardId === "pho-bo")).toBe(true)
    expect(next.battle.enemy.graveyard).toEqual([])
    const second = actBattle(next.battle, { type: "end" })
    expect(second.frames.some(f => f.event.kind === "attack" && f.event.source === "sleep")).toBe(true)
  })
  it.each([
    ["coast", "pho-bo", "tea-break"], ["garden", "goi-cuon-tom-thit", "herb"], ["moon", "xoi", "sugar-veil"],
  ])("%s recipe resolves once with a legal table, effects and save round-trip", (recipe, food, spell) => {
    let b = arena(); b.enemy.board = [unit("chef-bach", "target")]
    b.player.mana = 7; b = play(b, food); b.player.mana = 7; b = play(b, spell)
    expect(b.comboCounts?.[recipe as keyof typeof b.comboCounts]).toBe(1)
    expect(b.tableAura?.id).toBe(recipe)
    if (recipe === "coast") expect(b.enemy.board[0].frozen).toBe(true)
    if (recipe === "garden") expect(b.player.board[0].attack).toBeGreaterThan(CARD_MAP[food].attack)
    if (recipe === "moon") expect(b.player.board[0].shield).toBeGreaterThanOrEqual(2)
    expect(parseGame({ ...newGame(), battle: b })?.battle).toMatchObject({ comboCounts: { [recipe]: 1 } })
  })
  it("new deck plans include their engines when owned and always respect two-copy limits", () => {
    const owned = Object.fromEntries(CARDS.map(c => [c.id, 2]))
    const rebirth = suggestDeck(owned, "rebirth"), spells = suggestDeck(owned, "spellcraft")
    expect(rebirth.some(id => ["revive", "rebloom", "offering"].includes(CARD_MAP[id].ability ?? ""))).toBe(true)
    expect(spells.some(id => ["spellfire", "weaver", "starlight"].includes(CARD_MAP[id].ability ?? ""))).toBe(true)
    for (const deck of [rebirth, spells]) { expect(deck).toHaveLength(18); for (const id of deck) expect(deck.filter(c => c === id).length).toBeLessThanOrEqual(2) }
  })
})

it("coach evaluates sacrifice, revival and control without reading a removed unit", () => {
  for (const id of ["hearth-legacy", "sea-memory", "sweet-dream", "herb"]) {
    const b = arena(); b.player.board = [unit("pho-bo", "a"), unit("banh-mi", "b")]
    b.player.board[0].health = 1; b.player.graveyard = ["caravan-letter"]; b.player.hand = [id]
    const before = structuredClone(b), hint = getBattleHint(b)
    expect(hint).toBeDefined(); expect(b).toEqual(before)
    if (hint?.action) expect(actBattle(b, hint.action).error).toBeNull()
  }
})
