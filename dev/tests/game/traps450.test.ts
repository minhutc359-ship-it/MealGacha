import { beforeEach, describe, expect, it } from "vitest"
import { actBattle, startBattle, previewTarget } from "@/game/battle"
import { CARD_MAP, CARDS, STARTER_DECK, cardsForRules } from "@/game/catalog"
import { trapReady } from "@/game/traps"
import { getBattleHint } from "@/game/battleCoach"
import { newGame } from "@/game/progression"
import { parseGame } from "@/game/storage"
import { createSaveCode, readSaveCode } from "@/game/saveCode"
import { useGameStore } from "@/game/useGameStore"
import { clearProtectedState } from "@/infrastructure/storage/protectedStorage"
import { TRAP_CARDS, TRAP_PACK } from "@/game/trapCards"
import { analyzeDeck, suggestDeck } from "@/game/deckStrategy"
import type { Battle, BattleUnit } from "@/game/types"
const piece = (
  uid: string,
  cardId = "banh-mi",
  attack = 3,
  health = 10,
  guard = false,
): BattleUnit => ({
  uid,
  cardId,
  attack,
  health,
  maxHealth: health,
  shield: 0,
  ready: true,
  keywords: guard ? ["guard"] : [],
})
function arena(): Battle {
  const b = startBattle(STARTER_DECK, null, "courage", () => 0.41, false, 450)
  b.player.mana = b.player.maxMana = 7
  b.enemy.maxMana = 0
  b.enemy.mana = 0
  b.player.hand = []
  b.player.deck = Array(10).fill("last-flame")
  b.enemy.hand = []
  b.enemy.deck = Array(10).fill("last-flame")
  b.player.board = []
  b.enemy.board = []
  return b
}
function setTrap(b: Battle, id: string) {
  b.player.hand = [id]
  const out = actBattle(b, { type: "play", index: 0 })
  expect(out.error).toBeNull()
  return out.battle
}
function react(b: Battle, activate = true) {
  const out = actBattle(b, {
    type: "react",
    id: b.pendingReaction!.id,
    activate,
  })
  expect(out.error).toBeNull()
  return out
}
function enemyTrap(b: Battle, id: string, revealed = false) {
  b.round = 2
  b.turnSerial = 3
  b.turnSide = "player"
  b.enemy.trap = { uid: "t1", cardId: id, setTurn: 2, revealed }
  b.nextUid = Math.max(2, b.nextUid)
}
beforeEach(() => {
  const memory = new Map<string, string>()
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, v),
      removeItem: (k: string) => memory.delete(k),
    },
  })
  clearProtectedState()
  useGameStore.setState({ save: newGame(), presentation: null, notice: null })
})
describe("one independent trap slot", () => {
  it("pays once, leaves three unit slots intact, and is not armed on the set turn", () => {
    let b = arena()
    b.player.board = [piece("a"), piece("b"), piece("c")]
    const initial = structuredClone(b)
    b = setTrap(b, "trap-lid")
    expect(b.player.board).toEqual(initial.player.board)
    expect(b.player.mana).toBe(5)
    expect(b.player.hand).toEqual([])
    expect(trapReady(b, b.player.trap)).toBe(false)
    expect(parseGame({ ...newGame(), battle: b })).not.toBeNull()
    const full = { ...b, player: { ...b.player, hand: ["trap-ward"] } }
    const attempt = actBattle(full, { type: "play", index: 0 })
    expect(attempt.error).toBeTruthy()
    expect(attempt.battle).toBe(full)
    expect(attempt.frames).toEqual([])
  })
  it("blocks ordinary actions while waiting and holds across successive attacks without replaying a turn", () => {
    let b = arena()
    b.enemy.board = [piece("weak", "banh-mi", 1), piece("strong", "pho-bo", 6)]
    b = setTrap(b, "trap-mirror")
    const mana = b.player.mana
    b = actBattle(b, { type: "end" }).battle
    expect(b.pendingReaction?.intent.source).toBe("weak")
    expect(b.round).toBe(1)
    expect(b.turnSerial).toBe(2)
    expect(trapReady(b, b.player.trap)).toBe(true)
    expect(actBattle(b, { type: "end" }).error).toBeTruthy()
    expect(actBattle(b, { type: "clear-trap" }).error).toBeTruthy()
    const firstId = b.pendingReaction!.id
    b = react(b, false).battle
    expect(b.player.health).toBe(33)
    expect(b.pendingReaction?.intent.source).toBe("strong")
    expect(b.player.trap).toBeTruthy()
    expect(b.pendingReaction?.id).not.toBe(firstId)
    expect(
      actBattle(b, { type: "react", id: firstId, activate: true }).error,
    ).toBeTruthy()
    const hp = b.enemy.health
    b = react(b).battle
    expect(b.player.health).toBe(33)
    expect(b.enemy.health).toBe(hp - 4)
    expect(b.player.mana).toBe(7)
    expect(mana).toBe(4)
    expect(b.round).toBe(2)
    expect(b.turnSerial).toBe(3)
    expect(b.pendingReaction).toBeUndefined()
    expect(b.enemyPhase).toBeUndefined()
    expect(b.player.trap).toBeNull()
    expect(
      b.player.graveyard?.filter((id) => id === "trap-mirror"),
    ).toHaveLength(1)
    expect(parseGame({ ...newGame(), battle: b })).not.toBeNull()
  })
  it("blocks only a hero attack with the pot lid", () => {
    let b = arena()
    b.enemy.board = [piece("foe", "banh-mi", 4)]
    b = setTrap(b, "trap-lid")
    b = actBattle(b, { type: "end" }).battle
    b = react(b).battle
    expect(b.player.health).toBe(34)
    expect(b.enemy.board[0].ready).toBe(false)
    let guarded = arena()
    guarded.enemy.board = [piece("foe", "banh-mi", 4)]
    guarded.player.board = [piece("guard", "com-tam", 1, 8, true)]
    guarded = setTrap(guarded, "trap-lid")
    guarded = actBattle(guarded, { type: "end" }).battle
    expect(guarded.pendingReaction).toBeUndefined()
    expect(guarded.player.trap).toBeTruthy()
    expect(guarded.player.board[0].health).toBe(4)
  })
  it("applies ward before combat and handles an area trap killing queued attackers", () => {
    let b = arena()
    b.enemy.board = [piece("foe", "banh-mi", 4)]
    b.player.board = [piece("guard", "com-tam", 1, 8, true), piece("friend")]
    b = setTrap(b, "trap-ward")
    b = actBattle(b, { type: "end" }).battle
    b = react(b).battle
    expect(b.player.board[0].health).toBe(6)
    expect(b.player.board[1].shield).toBe(2)
    let sweep = arena()
    sweep.enemy.board = [
      piece("one", "banh-mi", 5, 2),
      piece("two", "pho-bo", 6, 2),
    ]
    sweep = setTrap(sweep, "trap-embers")
    sweep = actBattle(sweep, { type: "end" }).battle
    sweep = react(sweep).battle
    expect(sweep.enemy.board).toEqual([])
    expect(sweep.player.health).toBe(34)
    expect(sweep.round).toBe(2)
  })
  it("can clear an occupied own slot without refunding energy", () => {
    const b = setTrap(arena(), "trap-lid"),
      out = actBattle(b, { type: "clear-trap" })
    expect(out.error).toBeNull()
    expect(out.battle.player.trap).toBeNull()
    expect(out.battle.player.mana).toBe(b.player.mana)
    expect(out.battle.player.graveyard).toContain("trap-lid")
  })
})
describe("spell, summon and casualty timing", () => {
  it("negates a spell but spends its card/energy, without spell passives or recipe trails", () => {
    let b = arena()
    b.enemy.maxMana = 6
    b.enemy.deck = []
    b.enemy.hand = ["tidal-cut"]
    const caster = CARDS.find((c) => c.ability === "weaver")!
    b.enemy.board = [piece("caster", caster.id, 0)]
    b = setTrap(b, "trap-seal")
    b = actBattle(b, { type: "end" }).battle
    expect(b.pendingReaction?.intent.trigger).toBe("spell")
    const out = react(b)
    expect(out.frames.some((f) => f.event.kind === "negated")).toBe(true)
    expect(out.battle.player.health).toBe(34)
    expect(out.battle.enemy.mana).toBe(7 - CARD_MAP["tidal-cut"].cost)
    expect(out.battle.enemy.hand).not.toContain("tidal-cut")
    expect(out.battle.enemy.graveyard).toContain("tidal-cut")
    expect(out.battle.enemy.spellsThisTurn).toBe(0)
    expect(out.battle.enemy.recipeTrail).toEqual([])
    expect(out.battle.enemy.board[0].shield).toBe(0)
  })
  it("checks summon cost, applies entry effects first and then binds the surviving new unit", () => {
    const card = CARDS.find(
      (c) =>
        c.kind === "unit" &&
        c.cost >= 3 &&
        c.cost <= 5 &&
        !c.effect &&
        !c.ability,
    )!
    let b = arena()
    b.enemy.maxMana = 6
    b.enemy.deck = []
    b.enemy.hand = [card.id]
    b = setTrap(b, "trap-root")
    b = actBattle(b, { type: "end" }).battle
    expect(b.enemy.board[0].cardId).toBe(card.id)
    expect(b.pendingReaction?.intent.trigger).toBe("summon")
    b = react(b).battle
    const u = b.enemy.board.find((u) => u.cardId === card.id)!
    expect(u.health).toBe(card.health - 2)
    expect(u.frozen).toBe(true)
    expect(u.ready).toBe(false)
    expect(b.player.health).toBe(34)
    const spell = b.pendingReaction
    expect(spell).toBeUndefined()
    b = actBattle(b, { type: "end" }).battle
    expect(b.player.health).toBe(34)
    expect(b.enemy.board.find((u) => u.cardId === card.id)?.ready).toBe(false)
  })
  it("draws reserve cards with the normal hand cap and restores actual missing health", () => {
    const card = CARDS.find(
      (c) =>
        c.kind === "unit" &&
        c.cost >= 4 &&
        c.cost <= 5 &&
        !c.effect &&
        !c.ability,
    )!
    let b = arena()
    b.enemy.maxMana = 6
    b.enemy.deck = []
    b.enemy.hand = [card.id]
    b.player.health = 33
    b.player.deck = ["spark", "herb", ...b.player.deck]
    b = setTrap(b, "trap-pantry")
    b = actBattle(b, { type: "end" }).battle
    const out = react(b)
    const trapFrame = out.frames.find((f) => f.event.kind === "trap")!
    expect(trapFrame.battle.player.health).toBe(34)
    expect(trapFrame.battle.player.hand).toHaveLength(2)
    expect(trapFrame.battle.player.hand).toEqual(["spark", "herb"])
  })
  it("recalls the exact fallen unit without battlecry, buffs or readiness", () => {
    let b = arena()
    b.player.board = [piece("old", "banh-mi", 1, 1, true)]
    b.enemy.board = [piece("foe", "pho-bo", 3)]
    b = setTrap(b, "trap-recall")
    b = actBattle(b, { type: "end" }).battle
    expect(b.pendingReaction?.intent.trigger).toBe("fallen")
    expect(b.player.board).toEqual([])
    const out = react(b)
    const frame = out.frames.find((f) => f.event.kind === "trap")!
    expect(frame.battle.player.board).toHaveLength(1)
    expect(frame.battle.player.board[0]).toMatchObject({
      cardId: "banh-mi",
      attack: CARD_MAP["banh-mi"].attack,
      health: 2,
      ready: false,
    })
    expect(frame.battle.player.board[0].uid).not.toBe("old")
    expect(frame.battle.player.graveyard).not.toContain("banh-mi")
  })
  it("disarms without a reveal and lets counter-traps negate the reveal spell", () => {
    let b = arena()
    enemyTrap(b, "trap-seal")
    b.player.hand = ["v45-uncover"]
    let out = actBattle(b, { type: "play", index: 0 })
    expect(out.error).toBeNull()
    expect(out.battle.enemy.trap).toBeNull()
    expect(out.battle.enemy.graveyard).toContain("trap-seal")
    expect(out.frames.some((f) => f.event.kind === "trap")).toBe(false)
    b = arena()
    enemyTrap(b, "trap-seal")
    b.player.hand = ["v45-taste"]
    out = actBattle(b, { type: "play", index: 0 })
    expect(out.error).toBeNull()
    expect(out.frames.some((f) => f.event.kind === "negated")).toBe(true)
    expect(out.battle.player.hand).toEqual([])
    expect(out.battle.player.mana).toBe(5)
  })
  it("uses the same one-use response on the enemy side and leaves illegal moves untouched", () => {
    const b = arena()
    enemyTrap(b, "trap-mirror")
    b.player.board = [piece("actor", "banh-mi", 9)]
    const invalid = actBattle(b, {
      type: "attack",
      uid: "actor",
      target: "missing",
    })
    expect(invalid.battle).toBe(b)
    expect(invalid.frames).toEqual([])
    const out = actBattle(b, { type: "attack", uid: "actor", target: "hero" })
    expect(out.error).toBeNull()
    expect(out.battle.player.health).toBe(30)
    expect(out.battle.enemy.health).toBe(b.enemy.health)
    expect(out.battle.player.board[0].ready).toBe(false)
    expect(out.battle.enemy.trap).toBeNull()
    expect(out.frames.filter((f) => f.event.kind === "trap")).toHaveLength(1)
  })
})
describe("hidden information and progress safety", () => {
  it("keeps forecasts and coach identical for different hidden traps, and accounts for a revealed trap", () => {
    const b = arena()
    enemyTrap(b, "trap-mirror")
    b.player.board = [piece("actor", "banh-mi", 3)]
    const alternative = structuredClone(b)
    alternative.enemy.trap!.cardId = "trap-lid"
    expect(previewTarget(b, { type: "attack", uid: "actor" }, "hero")).toEqual(
      previewTarget(alternative, { type: "attack", uid: "actor" }, "hero"),
    )
    expect(getBattleHint(b)).toEqual(getBattleHint(alternative))
    expect(
      previewTarget(b, { type: "attack", uid: "actor" }, "hero").text,
    ).toContain("bẫy úp")
    b.enemy.trap!.revealed = true
    expect(
      previewTarget(b, { type: "attack", uid: "actor" }, "hero").damage,
    ).toBe(0)
    expect(
      previewTarget(b, { type: "attack", uid: "actor" }, "hero").text,
    ).toContain("Mất 3 ý chí")
  })
  it("round-trips an interrupted reaction through encrypted progress and resumes only once", async () => {
    let b = arena()
    b.enemy.board = [piece("foe", "banh-mi", 6)]
    b = setTrap(b, "trap-mirror")
    b = actBattle(b, { type: "end" }).battle
    const save = { ...newGame(), coins: 712, xp: 913, battle: b }
    const restored = await readSaveCode(await createSaveCode(save))
    expect(restored.save.coins).toBe(712)
    expect(restored.save.xp).toBe(913)
    expect(restored.save.decks).toEqual(save.decks)
    expect(restored.save.battle?.pendingReaction).toEqual(b.pendingReaction)
    const resumed = react(restored.save.battle!).battle
    expect(resumed.round).toBe(2)
    expect(parseGame({ ...save, battle: resumed })).not.toBeNull()
    expect(
      actBattle(resumed, {
        type: "react",
        id: b.pendingReaction!.id,
        activate: true,
      }).error,
    ).toBeTruthy()
  })
  it("rejects forged timing, card identity, cursor and target in an imported window", () => {
    let b = arena()
    b.enemy.board = [piece("foe", "banh-mi", 6)]
    b = setTrap(b, "trap-mirror")
    b = actBattle(b, { type: "end" }).battle
    for (const mutate of [
      (x: Battle) => (x.player.trap!.setTurn = 99),
      (x: Battle) => (x.pendingReaction!.intent.cardId = "spark"),
      (x: Battle) => (x.enemyPhase!.cursor = 3),
      (x: Battle) => (x.pendingReaction!.intent.target = "missing"),
      (x: Battle) => (x.turnSerial = 99),
    ]) {
      const invalid = structuredClone(b)
      mutate(invalid)
      expect(parseGame({ ...newGame(), battle: invalid })).toBeNull()
    }
  })
  it.each([350, 400] as const)(
    "keeps a %i battle and expedition pool on its original rules",
    (version) => {
      const b = startBattle(
          STARTER_DECK,
          null,
          "courage",
          () => 0.41,
          false,
          version,
        ),
        snapshot = JSON.stringify(b)
      expect(parseGame({ ...newGame(), battle: b })?.battle?.rulesVersion).toBe(
        version,
      )
      expect(JSON.stringify(b)).toBe(snapshot)
      expect(cardsForRules(version).some((c) => c.kind === "trap")).toBe(false)
      b.player.hand = ["trap-lid"]
      b.player.mana = 7
      expect(actBattle(b, { type: "play", index: 0 }).error).toBeTruthy()
    },
  )
  it("claims the optional card pack once without changing economy, decks or previous progress", () => {
    const before = structuredClone(useGameStore.getState().save)
    useGameStore.getState().claimTrapGift()
    const first = structuredClone(useGameStore.getState().save)
    expect(first.coins).toBe(before.coins)
    expect(first.xp).toBe(before.xp)
    expect(first.dust).toBe(before.dust)
    expect(first.decks).toEqual(before.decks)
    expect(first.clearedStages).toEqual(before.clearedStages)
    for (const card of TRAP_PACK) expect(first.cards[card.id]).toBe(2)
    useGameStore.getState().claimTrapGift()
    expect(useGameStore.getState().save).toEqual(first)
  })
  it("builds an 18-card trap deck with distinct type accounting and a legal curve", () => {
    const owned = Object.fromEntries(CARDS.map((c) => [c.id, 2]))
    const deck = suggestDeck(owned, "traps"),
      analysis = analyzeDeck(deck)
    expect(deck).toHaveLength(18)
    expect(analysis.traps).toBe(4)
    expect(analysis.units).toBe(10)
    expect(analysis.spells).toBe(4)
    expect(TRAP_CARDS).toHaveLength(8)
    for (const id of deck)
      expect(deck.filter((v) => v === id).length).toBeLessThanOrEqual(2)
  })
})

describe("modern trap-deck campaign simulation", () => {
  it("resolves 30 deterministic games with both AI and optional player reactions while every snapshot remains loadable", () => {
    const owned = Object.fromEntries(CARDS.map((c) => [c.id, 2])),
      deck = suggestDeck(owned, "traps")
    let windows = 0,
      flips = 0
    for (let seed = 1; seed <= 30; seed++) {
      let value = seed,
        b = startBattle(
          deck,
          null,
          "courage",
          () => {
            value = (Math.imul(value, 1664525) + 1013904223) >>> 0
            return value / 4294967296
          },
          false,
          450,
        )
      for (let steps = 0; !b.result && steps < 1200; steps++) {
        const action = b.pendingReaction
          ? { type: "react" as const, id: b.pendingReaction.id, activate: true }
          : b.tactic?.status === "pending"
            ? { type: "tactic" as const, id: "shelter" as const }
            : (getBattleHint(b)?.action ?? { type: "end" as const })
        if (b.pendingReaction) windows++
        const out = actBattle(b, action)
        expect(out.error).toBeNull()
        flips += out.frames.filter((f) => f.event.kind === "trap").length
        b = out.battle
        expect(
          parseGame({ ...newGame(), cards: owned, battle: b }),
        ).not.toBeNull()
        expect(b.player.board.length).toBeLessThanOrEqual(3)
        expect(b.enemy.board.length).toBeLessThanOrEqual(3)
        expect(b.player.hand.length).toBeLessThanOrEqual(8)
        expect(b.enemy.hand.length).toBeLessThanOrEqual(8)
      }
      expect(b.result).not.toBeNull()
    }
    expect(windows).toBeGreaterThan(5)
    expect(flips).toBeGreaterThan(10)
  }, 20000)
})
