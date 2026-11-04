import { describe, expect, it } from "vitest"
import {
  TACTICAL_DECK_LIBRARY,
  deckRecipeMissing,
  ensureTacticalDeckLibrary,
} from "@/game/tacticalTcg/deckLibrary"
import {
  tacticalDeckErrors,
  ownedTacticalCards,
  TACTICAL_STARTER,
} from "@/game/tacticalTcg/cards"
import {
  ensureTacticalAccount,
  saveTacticalDeck,
  readTacticalProgress,
} from "@/game/tacticalTcg/progression"
import {
  createTacticalBattle,
  playAutomaticRound,
  reduceTacticalBattle,
  type TacticalBattleState,
} from "@/game/tacticalTcg/engine"
import { validTacticalCheckpoint } from "@/game/tacticalTcg/progression/checkpoint"

class MemoryStorage {
  data = new Map<string, string>()
  getItem(k: string) {
    return this.data.get(k) ?? null
  }
  setItem(k: string, v: string) {
    this.data.set(k, v)
  }
  removeItem(k: string) {
    this.data.delete(k)
  }
}
describe("Tactical table and varied decks", () => {
  it("has five distinct, legal 24-card recipes and differentiated spell/unit choices", () => {
    expect(
      new Set(TACTICAL_DECK_LIBRARY.map((d) => [...d.cards].sort().join()))
        .size,
    ).toBe(5)
    for (const template of TACTICAL_DECK_LIBRARY)
      expect(tacticalDeckErrors(template.cards)).toEqual([])
    expect(TACTICAL_DECK_LIBRARY.filter((d) => d.free)).toHaveLength(3)
  })
  it("adds three immediately playable decks exactly once, preserving active deck and currency", () => {
    const storage = new MemoryStorage(),
      original = ensureTacticalAccount(storage)
    const first = ensureTacticalDeckLibrary(storage)
    expect(first.decks).toHaveLength(original.decks.length + 3)
    expect(first.activeDeckId).toBe(original.activeDeckId)
    expect(first.tinhVi).toBe(original.tinhVi)
    expect(first.packTickets).toBe(original.packTickets)
    for (const d of first.decks)
      expect(
        tacticalDeckErrors(d.cards, ownedTacticalCards(first.cardCopies)),
      ).toEqual([])
    const raw = [...storage.data.entries()]
    expect(ensureTacticalDeckLibrary(storage)).toEqual(first)
    expect([...storage.data.entries()]).toEqual(raw)
    expect(
      deckRecipeMissing(TACTICAL_DECK_LIBRARY[3].cards, first.cardCopies)
        .length,
    ).toBeGreaterThan(0)
  })
  it("preserves a full deck library without overwriting player-created decks", () => {
    const storage = new MemoryStorage()
    ensureTacticalAccount(storage)
    for (let i = 0; i < 11; i++)
      saveTacticalDeck(
        storage,
        {
          id: `custom:${i}`,
          name: `Custom ${i}`,
          cards: [...TACTICAL_STARTER],
        },
        false,
      )
    const before = readTacticalProgress(storage)
    const after = ensureTacticalDeckLibrary(storage)
    expect(after.decks).toEqual(before.decks)
    expect(after.activeDeckId).toBe(before.activeDeckId)
  })
  it("presentation frames preserve exactly the automatic round outcome and immutable checkpoints", () => {
    for (const template of TACTICAL_DECK_LIBRARY) {
      let state = createTacticalBattle({
        battleId: `frames:${template.id}`,
        deck: template.cards,
        seed: 101,
      })
      for (let i = 0; i < 4 && state.phase !== "result"; i++) {
        const expected = playAutomaticRound(state),
          frames: TacticalBattleState[] = [],
          copies: string[] = []
        const actual = playAutomaticRound(state, (frame) => {
          frames.push(frame)
          copies.push(JSON.stringify(frame))
        })
        expect(actual).toEqual(expected)
        frames.forEach((f, index) => {
          expect(JSON.stringify(f)).toBe(copies[index])
          expect(validTacticalCheckpoint(f)).toBe(true)
        })
        state = actual
      }
    }
  })
  it("second-copy upgrade is a real paid command and preserves missing HP", () => {
    let state = createTacticalBattle({
      battleId: "upgrade",
      deck: TACTICAL_STARTER,
      seed: 101,
    })
    // Find a legal opening with two cheap matching units using normal seeded hands.
    for (let seed = 1; seed < 200; seed++) {
      const candidate = createTacticalBattle({
        battleId: "upgrade",
        deck: TACTICAL_STARTER,
        seed,
      })
      if (
        candidate.cardGame!.sides.player.hand.filter((id) => id === "pho-bo")
          .length === 2
      ) {
        state = candidate
        break
      }
    }
    const firstIndex = state.cardGame!.sides.player.hand.indexOf("pho-bo")
    expect(firstIndex).toBeGreaterThanOrEqual(0)
    state = reduceTacticalBattle(state, {
      id: "first",
      type: "play-card",
      side: "player",
      handIndex: firstIndex,
      cell: { row: 0, column: 0 },
    })
    state = playAutomaticRound(playAutomaticRound(state))
    const before = state.units.find((u) => u.side === "player")!
    const missing = before.maxHp - before.hp
    expect(missing).toBeGreaterThan(0)
    const manaBefore = state.cardGame!.sides.player.mana
    const upgraded = reduceTacticalBattle(state, {
      id: "upgrade",
      type: "play-card",
      side: "player",
      handIndex: state.cardGame!.sides.player.hand.indexOf("pho-bo"),
      cell: { row: 0, column: 0 },
    })
    expect(upgraded.units[0].star).toBe(2)
    expect(upgraded.units[0].maxHp).toBe(42)
    expect(upgraded.units[0].hp).toBe(42 - missing)
    expect(upgraded.cardGame!.sides.player.mana).toBe(manaBefore - 1)
    expect(upgraded.cardGame!.sides.player.discard).toContain("pho-bo")
  })
})
