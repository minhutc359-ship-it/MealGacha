import { describe, expect, it } from "vitest"
import {
  DEFAULT_TCG_SEED,
  TCG_CARDS,
  TCG_DECK,
  tcgCard,
} from "@/aw2/tcg/catalog"
import {
  applyTcgCommand,
  createTcgMatch,
  legalTcgActions,
  playTcgPlayerCommand,
  recommendTcgAction,
  tcgPlayOptions,
} from "@/aw2/tcg/rules"
import {
  createTcgSession,
  reduceTcgSession,
  selectedTcgActions,
} from "@/aw2/tcg/session"
import type { TcgCardId } from "@/aw2/tcg/catalog"
import type { TcgMatch, TcgSide, TcgUnit } from "@/aw2/tcg/types"

// Boundary fixtures alter transient state only. End-to-end outcomes below use legal moves from shuffle.
function unit(cardId: TcgCardId, uid: string = cardId, ready = true): TcgUnit {
  const card = tcgCard(cardId)
  return {
    uid,
    cardId,
    attack: card.attack,
    health: card.health,
    maxHealth: card.health,
    shield: 0,
    ready,
  }
}
function fixture(cardId: TcgCardId = "aw2-tcg-lua") {
  const game = createTcgMatch(1)
  game.players.player.energy = game.players.player.maxEnergy = 6
  game.players.player.hand = [{ uid: "hand", cardId }]
  return game
}
function invariant(game: TcgMatch) {
  expect(game.turn).toBeLessThanOrEqual(60)
  for (const side of ["player", "opponent"] as const) {
    const p = game.players[side]
    expect(p.health).toBeGreaterThanOrEqual(0)
    expect(p.health).toBeLessThanOrEqual(18)
    expect(p.energy).toBeGreaterThanOrEqual(0)
    expect(p.energy).toBeLessThanOrEqual(p.maxEnergy)
    expect(p.maxEnergy).toBeLessThanOrEqual(6)
    expect(p.hand.length).toBeLessThanOrEqual(7)
    expect(p.board.length).toBeLessThanOrEqual(3)
    const cards = [...p.deck, ...p.hand, ...p.board, ...p.discard]
    expect(cards).toHaveLength(20)
    expect(new Set(cards.map((card) => card.uid)).size).toBe(20)
    expect(cards.map((card) => card.cardId).sort()).toEqual(
      [...TCG_DECK].sort(),
    )
    for (const u of p.board) {
      expect(u.health).toBeGreaterThan(0)
      expect(u.shield).toBeLessThanOrEqual(3)
    }
  }
}
function finish(seed: number, pass = false) {
  let game = createTcgMatch(seed),
    count = 0
  while (game.status === "active" && count++ < 1000) {
    const command = pass
      ? { type: "end-turn" as const, side: "player" as const }
      : recommendTcgAction(game, "player")!
    game = playTcgPlayerCommand(game, command)
    invariant(game)
  }
  expect(game.status).not.toBe("active")
  return game
}
describe("AW2 borrowed TCG rules", () => {
  it("has 20 cards, seven definitions and only five canonical portraits", () => {
    expect(TCG_DECK).toHaveLength(20)
    expect(TCG_CARDS).toHaveLength(7)
    expect(new Set(TCG_CARDS.map((card) => card.spiritId)).size).toBe(5)
    expect(TCG_DECK.filter((id) => id === "aw2-tcg-gentle-mist")).toHaveLength(
      2,
    )
  })
  it("shuffles deterministically per side and opens player turn with four cards", () => {
    const game = createTcgMatch(42)
    expect(game).toEqual(createTcgMatch(42))
    expect(game).not.toEqual(createTcgMatch(43))
    expect(game.players.player.hand).toHaveLength(4)
    expect(game.players.opponent.hand).toHaveLength(3)
    expect(game.players.player.energy).toBe(1)
    invariant(game)
  })
  it.each([-1, 0.5, NaN, Infinity, 0x100000000])(
    "rejects invalid seed %s",
    (seed) => expect(() => createTcgMatch(seed)).toThrow(),
  )
  it("rejects wrong turn, nonexistent cards and insufficient energy without mutation", () => {
    const game = createTcgMatch(1),
      before = structuredClone(game)
    expect(() =>
      applyTcgCommand(game, { type: "end-turn", side: "opponent" }),
    ).toThrow()
    expect(() =>
      applyTcgCommand(game, { type: "play", side: "player", uid: "missing" }),
    ).toThrow()
    const expensive = game.players.player.hand.find(
      (card) => tcgCard(card.cardId).cost > 1,
    )!
    expect(() =>
      applyTcgCommand(game, {
        type: "play",
        side: "player",
        uid: expensive.uid,
      }),
    ).toThrow()
    expect(game).toEqual(before)
  })
  it("spends energy once, respects summon sickness and preserves original state", () => {
    const game = fixture(),
      before = structuredClone(game)
    let next = applyTcgCommand(game, {
      type: "play",
      side: "player",
      uid: "hand",
    })
    expect(game).toEqual(before)
    expect(next.players.player.energy).toBe(4)
    expect(next.players.player.board[0].ready).toBe(false)
    expect(
      legalTcgActions(next, "player").some((a) => a.type === "attack"),
    ).toBe(false)
    expect(() =>
      applyTcgCommand(next, { type: "play", side: "player", uid: "hand" }),
    ).toThrow()
    next = applyTcgCommand(next, { type: "end-turn", side: "player" })
    next = applyTcgCommand(next, { type: "end-turn", side: "opponent" })
    expect(next.players.player.board[0].ready).toBe(true)
  })
  it("guard restricts attacks while targeted spells bypass guard", () => {
    const game = fixture("aw2-tcg-gentle-mist")
    game.players.player.board = [unit("aw2-tcg-lua")]
    game.players.opponent.board = [unit("aw2-tcg-than"), unit("aw2-tcg-lua")]
    const attacks = legalTcgActions(game, "player").filter(
      (a) => a.type === "attack",
    )
    expect(attacks.map((a) => a.targetUid)).toEqual(["aw2-tcg-than"])
    expect(tcgPlayOptions(game, "player", "hand").actions).toHaveLength(2)
    const next = applyTcgCommand(game, {
      type: "play",
      side: "player",
      uid: "hand",
      targetUid: "aw2-tcg-lua",
    })
    expect(next.players.opponent.board.map((u) => u.cardId)).toEqual([
      "aw2-tcg-than",
    ])
    expect(next.players.player.discard[0].uid).toBe("hand")
  })
  it("rejects bad spell targets before spending and full boards before summoning", () => {
    const game = fixture("aw2-tcg-gentle-mist"),
      before = structuredClone(game)
    expect(() =>
      applyTcgCommand(game, {
        type: "play",
        side: "player",
        uid: "hand",
        targetUid: "opponent:leader",
      }),
    ).toThrow()
    expect(game).toEqual(before)
    const full = fixture()
    full.players.player.board = [
      unit("aw2-tcg-than", "a"),
      unit("aw2-tcg-lam", "b"),
      unit("aw2-tcg-suong", "c"),
    ]
    expect(tcgPlayOptions(full, "player", "hand").reason).toMatch(/đủ 3/)
  })
  it("exchanges damage simultaneously, consumes shield and removes both defeated units", () => {
    const game = fixture()
    game.players.player.board = [unit("aw2-tcg-lua")]
    game.players.opponent.board = [unit("aw2-tcg-lua")]
    game.players.player.board[0].shield = 1
    const next = applyTcgCommand(game, {
      type: "attack",
      side: "player",
      uid: "aw2-tcg-lua",
      targetUid: "aw2-tcg-lua",
    })
    expect(next.players.player.board).toHaveLength(0)
    expect(next.players.opponent.board).toHaveLength(0)
    expect(next.players.player.discard).toHaveLength(1)
    expect(next.players.opponent.discard).toHaveLength(1)
  })
  it("one attack exhausts a unit; lethal leader damage produces a terminal result", () => {
    const game = fixture()
    game.players.player.board = [unit("aw2-tcg-lua")]
    const next = applyTcgCommand(game, {
      type: "attack",
      side: "player",
      uid: "aw2-tcg-lua",
      targetUid: "opponent:leader",
    })
    expect(next.players.opponent.health).toBe(15)
    expect(next.players.player.board[0].health).toBe(2)
    expect(() =>
      applyTcgCommand(next, {
        type: "attack",
        side: "player",
        uid: "aw2-tcg-lua",
        targetUid: "opponent:leader",
      }),
    ).toThrow()
    game.players.opponent.health = 3
    const won = applyTcgCommand(game, {
      type: "attack",
      side: "player",
      uid: "aw2-tcg-lua",
      targetUid: "opponent:leader",
    })
    expect(won.status).toBe("player-win")
    expect(legalTcgActions(won, "player")).toEqual([])
    expect(() =>
      applyTcgCommand(won, { type: "surrender", side: "player" }),
    ).toThrow()
  })
  it.each(["aw2-tcg-lam", "aw2-tcg-warm-bowl"] as const)(
    "caps healing for %s",
    (cardId) => {
      const game = fixture(cardId)
      game.players.player.health = 17
      expect(
        applyTcgCommand(game, { type: "play", side: "player", uid: "hand" })
          .players.player.health,
      ).toBe(18)
      if (cardId === "aw2-tcg-warm-bowl") {
        game.players.player.health = 18
        expect(tcgPlayOptions(game, "player", "hand").reason).toMatch(/đầy/)
      }
    },
  )
  it("Moc shields other allies only and caps at three", () => {
    const game = fixture("aw2-tcg-moc-non")
    game.players.player.board = [unit("aw2-tcg-than")]
    game.players.player.board[0].shield = 3
    const next = applyTcgCommand(game, {
      type: "play",
      side: "player",
      uid: "hand",
    })
    expect(next.players.player.board.map((u) => u.shield)).toEqual([3, 0])
    game.players.player.board[0].shield = 1
    expect(
      applyTcgCommand(game, { type: "play", side: "player", uid: "hand" })
        .players.player.board[0].shield,
    ).toBe(2)
  })
  it("Suong hits every enemy unit, respects shields and removes defeats", () => {
    const game = fixture("aw2-tcg-suong")
    game.players.opponent.board = [unit("aw2-tcg-lua"), unit("aw2-tcg-than")]
    game.players.opponent.board[0].health = 1
    game.players.opponent.board[1].shield = 1
    const next = applyTcgCommand(game, {
      type: "play",
      side: "player",
      uid: "hand",
    })
    expect(next.players.opponent.board).toHaveLength(1)
    expect(next.players.opponent.board[0]).toMatchObject({
      health: 6,
      shield: 0,
    })
  })
  it("burns excess draws, refreshes energy and escalates fatigue to defeat", () => {
    const game = fixture()
    game.activeSide = "opponent"
    const p = game.players.player
    p.hand = p.deck.splice(0, 7)
    const next = applyTcgCommand(game, { type: "end-turn", side: "opponent" })
    expect(next.players.player.hand).toHaveLength(7)
    expect(next.players.player.discard).toHaveLength(1)
    expect(next.players.player.energy).toBe(2)
    p.deck = []
    p.health = 2
    p.fatigue = 1
    const fatigued = applyTcgCommand(game, {
      type: "end-turn",
      side: "opponent",
    })
    expect(fatigued.status).toBe("opponent-win")
    expect(fatigued.players.player.fatigue).toBe(2)
  })
  it("ends unresolved turn60 as draw and explicit surrender as loss", () => {
    const game = fixture()
    game.turn = 60
    expect(
      applyTcgCommand(game, { type: "end-turn", side: "player" }).status,
    ).toBe("draw")
    expect(
      applyTcgCommand(game, { type: "surrender", side: "player" }).status,
    ).toBe("opponent-win")
  })
  it("opponent choice ignores hidden player hand and deck ordering", () => {
    const game = applyTcgCommand(createTcgMatch(19), {
      type: "end-turn",
      side: "player",
    })
    const altered = structuredClone(game)
    altered.players.player.hand.reverse()
    altered.players.player.deck.reverse()
    expect(recommendTcgAction(game, "opponent")).toEqual(
      recommendTcgAction(altered, "opponent"),
    )
    expect(
      game.events
        .filter((event) => event.text.startsWith("Chủ bàn rút"))
        .every((event) => event.text === "Chủ bàn rút một lá."),
    ).toBe(true)
    expect(() =>
      playTcgPlayerCommand(game, { type: "end-turn", side: "opponent" }),
    ).toThrow()
  })
  it("finishes 40 legal seeded games with conservation and both outcomes reachable", () => {
    const outcomes = new Set<string>()
    for (let seed = 1; seed <= 40; seed++) outcomes.add(finish(seed).status)
    expect(outcomes.has("player-win")).toBe(true)
    expect(outcomes.has("opponent-win")).toBe(true)
  })
  it("successive borrowed shuffles have genuine coach loss and win; passing loses", () => {
    expect(finish(DEFAULT_TCG_SEED).status).toBe("opponent-win")
    expect(finish(DEFAULT_TCG_SEED + 1).status).toBe("player-win")
    expect(finish(DEFAULT_TCG_SEED, true).status).toBe("opponent-win")
  })
})
describe("TCG transient UI session", () => {
  it("selection never executes a move and cancel preserves match", () => {
    let session = createTcgSession()
    session.match = fixture("aw2-tcg-gentle-mist")
    session.match.players.opponent.board = [unit("aw2-tcg-than")]
    const next = reduceTcgSession(session, {
      type: "select",
      selection: { kind: "play", uid: "hand" },
    })
    expect(next.match).toBe(session.match)
    expect(selectedTcgActions(next)).toHaveLength(1)
    expect(reduceTcgSession(next, { type: "cancel" }).match).toBe(session.match)
  })
  it("rejects stale UI commands and mid-game rematches without touching match", () => {
    const session = createTcgSession()
    expect(reduceTcgSession(session, { type: "rematch" }).match).toBe(
      session.match,
    )
    expect(
      reduceTcgSession(session, {
        type: "command",
        command: { type: "play", side: "player", uid: "stale" },
      }).match,
    ).toBe(session.match)
  })
  it("coach is deterministic/reducer safe and terminal rematch only replaces transient state", () => {
    const session = createTcgSession(),
      snapshot = structuredClone(session)
    expect(reduceTcgSession(session, { type: "recommend" })).toEqual(
      reduceTcgSession(session, { type: "recommend" }),
    )
    expect(session).toEqual(snapshot)
    const lost = reduceTcgSession(session, {
      type: "command",
      command: { type: "surrender", side: "player" },
    })
    const replay = reduceTcgSession(lost, { type: "rematch" })
    expect(replay.match.seed).toBe(DEFAULT_TCG_SEED + 1)
    expect(replay.match.status).toBe("active")
  })
})
