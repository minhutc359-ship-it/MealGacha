import { describe, expect, it } from "vitest"
import { actBattle, startBattle } from "./battle"
import { CARDS, STARTER_DECK } from "./catalog"
import { combatCues } from "./combatEffects"
import type { BattleUnit, GameCard } from "./types"
function unit(uid: string, cardId = "pho-bo", shield = 0): BattleUnit {
  return {
    uid,
    cardId,
    health: 4,
    maxHealth: 4,
    attack: 3,
    shield,
    ready: true,
    keywords: [],
  }
}
function arena(card?: GameCard) {
  const b = startBattle(STARTER_DECK, null)
  b.player.mana = b.player.maxMana = 7
  if (card) b.player.hand = [card.id]
  return b
}
const spell = (effect: GameCard["effect"], school?: GameCard["school"]) =>
  CARDS.find(
    (c) =>
      c.kind === "spell" &&
      c.effect === effect &&
      (!school || c.school === school),
  )!
describe("elemental presentation from actual combat", () => {
  it("puts fire and water on the opposing target; healing stays on the caster", () => {
    for (const school of ["ember", "tide"] as const) {
      const card = spell("damage", school),
        b = arena(card)
      const frame = actBattle(b, { type: "play", index: 0, target: "hero" })
        .frames[0]
      expect(combatCues(frame)).toContainEqual({
        kind: school === "ember" ? "fire" : "water",
        side: "enemy",
        target: "hero",
        school,
        projectile: true,
      })
    }
    const b = arena(spell("heal"))
    b.player.health -= 5
    const cues = combatCues(actBattle(b, { type: "play", index: 0 }).frames[0])
    expect(
      cues.some(
        (c) => c.kind === "heal" && c.side === "player" && c.target === "hero",
      ),
    ).toBe(true)
    expect(cues.some((c) => c.side === "enemy")).toBe(false)
  })
  it("shows shield formation on every protected unit, and shield break with the correct remaining health", () => {
    const b = arena(spell("ward"))
    b.player.board = [unit("a"), unit("b")]
    const shields = combatCues(
      actBattle(b, { type: "play", index: 0 }).frames[0],
    ).filter((c) => c.kind === "shield")
    expect(shields.map((c) => c.target)).toEqual(["a", "b"])
    b.player.hand = [spell("damage").id]
    b.enemy.board = [unit("target", "com-tam", 1)]
    const frame = actBattle(b, { type: "play", index: 0, target: "target" })
      .frames[0]
    expect(frame.battle.enemy.board[0].health).toBe(3)
    expect(
      combatCues(frame).some(
        (c) => c.kind === "break" && c.target === "target",
      ),
    ).toBe(true)
  })
  it("covers all sweep victims and a fallen attacker during simultaneous retaliation", () => {
    const b = arena(spell("sweep", "tide"))
    b.enemy.board = [unit("a"), unit("b"), unit("c")]
    expect(
      combatCues(actBattle(b, { type: "play", index: 0 }).frames[0])
        .filter((c) => c.kind === "water")
        .map((c) => c.target),
    ).toEqual(["a", "b", "c"])
    b.player.board = [
      {
        ...unit(
          "ally",
          CARDS.find((c) => c.kind === "unit" && c.school === "ember")!.id,
        ),
        health: 1,
      },
    ]
    b.enemy.board = [unit("foe")]
    const frame = actBattle(b, { type: "attack", uid: "ally", target: "foe" })
      .frames[0]
    expect(frame.battle.player.board).toHaveLength(0)
    expect(
      combatCues(frame)
        .filter((c) => c.kind === "fire")
        .map((c) => c.target),
    ).toEqual(["ally", "foe"])
  })
  it("separates buffing, drawing and resonance without mutating either snapshot", () => {
    const b = arena(spell("buff"))
    b.player.board = [unit("a")]
    let frame = actBattle(b, { type: "play", index: 0 }).frames[0]
    expect(combatCues(frame).some((c) => c.kind === "buff")).toBe(true)
    expect(combatCues(frame).some((c) => c.kind === "heal")).toBe(false)
    b.player.hand = [spell("draw").id]
    b.player.deck = ["spark", "herb", "pho-bo"]
    frame = actBattle(b, { type: "play", index: 0 }).frames[0]
    expect(
      combatCues(frame).some((c) => c.kind === "draw" && c.target === "hand"),
    ).toBe(true)
    b.player.hand = ["spark"]
    b.player.chainSchool = "ember"
    frame = actBattle(b, { type: "play", index: 0, target: "hero" }).frames[0]
    const before = JSON.stringify(frame)
    expect(combatCues(frame).some((c) => c.kind === "resonance")).toBe(true)
    expect(JSON.stringify(frame)).toBe(before)
  })
})
