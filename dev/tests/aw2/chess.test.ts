import { describe, expect, it } from "vitest"
import { CHESS_UNITS, chessCapacity, chessUnit } from "@/aw2/chess/catalog"
import { createChessBattle, stepChessBattle } from "@/aw2/chess/battle"
import {
  applyChessCommand,
  createChessMatch,
  createChessSession,
  reduceChessSession,
} from "@/aw2/chess/rules"
import type { ChessSpiritId } from "@/aw2/chess/catalog"
import type { ChessCommand, ChessMatch, ChessPiece } from "@/aw2/chess/types"

function piece(
  spiritId: ChessSpiritId,
  cell: number | null,
  uid: string = spiritId,
): ChessPiece {
  return { uid, spiritId, cell, stars: 1 }
}
function invariant(game: ChessMatch) {
  expect(game.gold).toBeGreaterThanOrEqual(0)
  expect(game.health).toBeGreaterThanOrEqual(0)
  expect(game.health).toBeLessThanOrEqual(12)
  expect(game.round).toBeLessThanOrEqual(5)
  expect(
    game.units.filter((unit) => unit.cell === null).length,
  ).toBeLessThanOrEqual(6)
  const deployed = game.units.filter((unit) => unit.cell !== null)
  expect(deployed.length).toBeLessThanOrEqual(chessCapacity(game.round))
  expect(new Set(deployed.map((unit) => unit.cell)).size).toBe(deployed.length)
  expect(new Set(game.units.map((unit) => unit.uid)).size).toBe(
    game.units.length,
  )
  for (const kit of CHESS_UNITS) {
    const held = game.units
      .filter((unit) => unit.spiritId === kit.id)
      .reduce((total, unit) => total + (unit.stars === 2 ? 3 : 1), 0)
    expect(game.pool[kit.id]).toBeGreaterThanOrEqual(0)
    expect(
      game.pool[kit.id] +
        held +
        game.offers.filter((id) => id === kit.id).length,
    ).toBe(9)
  }
  if (game.battle) {
    const alive = game.battle.actors.filter((actor) => actor.health > 0)
    expect(new Set(alive.map((actor) => `${actor.x}:${actor.y}`)).size).toBe(
      alive.length,
    )
    for (const actor of alive) {
      expect(actor.health).toBeLessThanOrEqual(actor.maxHealth)
      expect(actor.shield).toBeLessThanOrEqual(12)
      expect(actor.x).toBeGreaterThanOrEqual(0)
      expect(actor.x).toBeLessThan(3)
      expect(actor.y).toBeGreaterThanOrEqual(0)
      expect(actor.y).toBeLessThan(4)
    }
  }
}
function execute(game: ChessMatch, command: ChessCommand) {
  const next = applyChessCommand(game, command)
  invariant(next)
  return next
}
function buyForRound(game: ChessMatch): ChessMatch {
  let current = game
  for (let tries = 0; tries < 40; tries++) {
    const offers = current.offers
      .map((id, slot) => ({ id, slot }))
      .filter((offer) => offer.id !== null)
      .sort((a, b) => {
        const score = (id: ChessSpiritId) =>
          current.units.filter(
            (unit) => unit.spiritId === id && unit.stars === 1,
          ).length *
            20 +
          (!current.units.some((unit) => unit.spiritId === id) ? 8 : 0)
        return score(b.id!) - score(a.id!)
      })
    let bought = false
    for (const offer of offers) {
      try {
        current = execute(current, { type: "buy", slot: offer.slot })
        bought = true
        break
      } catch {
        /* unaffordable/full bench */
      }
    }
    if (bought) {
      current = execute(current, { type: "arrange" })
      continue
    }
    if (current.gold < 3 || current.units.length >= 8) break
    current = execute(current, { type: "refresh" })
  }
  return execute(current, { type: "arrange" })
}
function play(seed: number, weak = false) {
  let game = createChessMatch(seed),
    commands = 0
  while (game.phase !== "finished" && commands++ < 1000) {
    if (game.phase === "planning") {
      if (weak) {
        if (!game.units.length) game = execute(game, { type: "buy", slot: 0 })
        game = execute(game, { type: "move", uid: game.units[0].uid, cell: 3 })
      } else game = buyForRound(game)
      game = execute(game, { type: "start" })
    } else
      game = execute(game, { type: game.phase === "battle" ? "tick" : "next" })
  }
  expect(game.phase).toBe("finished")
  return game
}
describe("AW2 Auto Chess borrowed economy / planning", () => {
  it("opens deterministic finite reserved shop and independent development currency", () => {
    const game = createChessMatch(42)
    expect(game).toEqual(createChessMatch(42))
    expect(game.offers).toHaveLength(3)
    expect(game.gold).toBe(10)
    expect(game.health).toBe(12)
    invariant(game)
    expect(CHESS_UNITS.map((unit) => unit.id)).toEqual([
      "aw2-than",
      "aw2-lua",
      "aw2-lam",
      "aw2-moc-non",
      "aw2-suong",
    ])
  })
  it.each([-1, NaN, 0.1, 0x100000000])("rejects invalid seed %s", (seed) =>
    expect(() => createChessMatch(seed)).toThrow(),
  )
  it("purchases once, preserves input and rejects invalid shop slots", () => {
    const game = createChessMatch(),
      before = structuredClone(game),
      id = game.offers[0]!
    const bought = execute(game, { type: "buy", slot: 0 })
    expect(game).toEqual(before)
    expect(bought.gold).toBe(10 - chessUnit(id).cost)
    expect(bought.offers[0]).toBeNull()
    expect(bought.units[0].cell).toBeNull()
    for (const slot of [-1, 3, NaN, 0.5])
      expect(() => applyChessCommand(bought, { type: "buy", slot })).toThrow()
    expect(() => applyChessCommand(bought, { type: "buy", slot: 0 })).toThrow()
  })
  it("locks exact offers over next round, awards income once and blocks locked refresh", () => {
    let game = execute(createChessMatch(), { type: "buy", slot: 0 })
    game = execute(game, { type: "lock" })
    const offers = [...game.offers]
    expect(() => applyChessCommand(game, { type: "refresh" })).toThrow()
    game = execute(game, { type: "arrange" })
    game = execute(game, { type: "start" })
    while (game.phase === "battle") game = execute(game, { type: "tick" })
    const gold = game.gold
    game = execute(game, { type: "next" })
    expect(game.gold).toBe(gold + 6)
    expect(game.offers).toEqual(offers)
    expect(() => applyChessCommand(game, { type: "next" })).toThrow()
    expect(() => applyChessCommand(game, { type: "tick" })).toThrow()
  })
  it("refresh returns reserved offers and charges exactly one", () => {
    const game = createChessMatch(),
      next = execute(game, { type: "refresh" })
    expect(next.gold).toBe(9)
    expect(next.rng).not.toBe(game.rng)
    const poor = { ...game, gold: 0 }
    expect(() => applyChessCommand(poor, { type: "refresh" })).toThrow()
    expect(() => applyChessCommand(poor, { type: "buy", slot: 0 })).toThrow()
  })
  it("moves, swaps, benches and sells with copy/gold conservation", () => {
    let game = execute(createChessMatch(), { type: "buy", slot: 0 })
    game = execute(game, { type: "buy", slot: 1 })
    const [a, b] = game.units
    game = execute(game, { type: "move", uid: a.uid, cell: 0 })
    game = execute(game, { type: "move", uid: b.uid, cell: 4 })
    game = execute(game, { type: "move", uid: a.uid, cell: 4 })
    expect(game.units.find((unit) => unit.uid === b.uid)!.cell).toBe(0)
    game = execute(game, { type: "move", uid: a.uid, cell: null })
    const gold = game.gold
    game = execute(game, { type: "sell", uid: a.uid })
    expect(game.gold).toBe(gold + chessUnit(a.spiritId).cost)
    expect(() =>
      applyChessCommand(game, { type: "move", uid: a.uid, cell: 1 }),
    ).toThrow()
    expect(() =>
      applyChessCommand(game, { type: "move", uid: b.uid, cell: 6 }),
    ).toThrow()
  })
  it("merges after purchase even at a full bench, preserving deployed copy", () => {
    const game = createChessMatch()
    game.gold = 20
    // Controlled cap/merge boundary fixture; full legal seeded runs check pool conservation separately.
    game.units = [
      piece("aw2-than", 2, "front"),
      piece("aw2-than", null, "copy"),
      ...Array.from({ length: 5 }, (_, i) =>
        piece("aw2-lua", null, `bench${i}`),
      ),
    ]
    game.offers[0] = "aw2-than"
    const next = applyChessCommand(game, { type: "buy", slot: 0 })
    expect(next.units.find((unit) => unit.uid === "front")).toMatchObject({
      stars: 2,
      cell: 2,
    })
    expect(next.units.filter((unit) => unit.cell === null)).toHaveLength(5)
    const sold = applyChessCommand(next, { type: "sell", uid: "front" })
    expect(sold.gold).toBe(next.gold + 6)
    game.offers[0] = "aw2-suong"
    const snapshot = structuredClone(game)
    expect(() => applyChessCommand(game, { type: "buy", slot: 0 })).toThrow(/6/)
    expect(game).toEqual(snapshot)
  })
  it("rejects capacity overflow and all planning actions during combat", () => {
    let game = createChessMatch()
    game.units = [
      piece("aw2-than", 0, "a"),
      piece("aw2-lua", 1, "b"),
      piece("aw2-lam", 2, "c"),
      piece("aw2-suong", null, "d"),
    ]
    expect(() =>
      applyChessCommand(game, { type: "move", uid: "d", cell: 3 }),
    ).toThrow(/đủ quân/)
    game = applyChessCommand(game, { type: "start" })
    for (const type of [
      "arrange",
      "refresh",
      "lock",
      "start",
      "next",
      "rematch",
    ] as const)
      expect(() => applyChessCommand(game, { type })).toThrow()
    expect(() => applyChessCommand(game, { type: "sell", uid: "a" })).toThrow()
    expect(() =>
      applyChessCommand(createChessMatch(), { type: "start" }),
    ).toThrow()
  })
})
describe("AW2 Auto Chess battle truth", () => {
  it("validates deployed cells and ignores benched identities in diversity", () => {
    expect(() => createChessBattle([], [piece("aw2-than", 0)])).toThrow()
    expect(() =>
      createChessBattle([piece("aw2-than", 0), piece("aw2-lua", 0)], [
        piece("aw2-than", 0),
      ]),
    ).toThrow()
    const battle = createChessBattle(
      [piece("aw2-than", 0), piece("aw2-lam", null), piece("aw2-lua", null)],
      [piece("aw2-than", 0)],
    )
    expect(battle.actors[0].attack).toBe(5)
  })
  it("diversity counts distinct deployed identities and applies 2-star stats", () => {
    const army = CHESS_UNITS.map((kit, index) =>
      piece(kit.id, index, String(index)),
    )
    army[0].stars = 2
    const battle = createChessBattle(army, [piece("aw2-than", 0)])
    expect(battle.actors[0]).toMatchObject({ maxHealth: 67, attack: 9 })
    const duplicates = createChessBattle(
      [
        piece("aw2-than", 0, "a"),
        piece("aw2-than", 1, "b"),
        piece("aw2-than", 2, "c"),
      ],
      [piece("aw2-than", 0)],
    )
    expect(duplicates.actors[0].attack).toBe(5)
  })
  it("formation affects range and movement without occupied-cell overlap", () => {
    const front = createChessBattle([piece("aw2-lua", 0)], [
      piece("aw2-than", 0),
    ])
    const rear = createChessBattle([piece("aw2-lua", 3)], [
      piece("aw2-than", 0),
    ])
    expect(stepChessBattle(front).actors[1].health).toBeLessThan(36)
    expect(stepChessBattle(rear).actors[1].health).toBe(36)
    expect(stepChessBattle(rear).actors[0].y).toBe(1)
  })
  it("simultaneous lethal hits resolve a draw without initiative immunity", () => {
    const battle = createChessBattle([piece("aw2-lua", 0)], [
      piece("aw2-lua", 0),
    ])
    battle.actors.forEach((actor) => {
      actor.health = 1
    })
    const before = structuredClone(battle),
      next = stepChessBattle(battle)
    expect(battle).toEqual(before)
    expect(next.status).toBe("draw")
    expect(() => stepChessBattle(next)).toThrow()
  })
  it("every fourth tick triggers bounded shield, healing and all-enemy damage", () => {
    const battle = createChessBattle(
      [
        piece("aw2-than", 0),
        piece("aw2-lam", 3),
        piece("aw2-moc-non", 4),
        piece("aw2-suong", 5),
      ],
      [piece("aw2-than", 2)],
    )
    battle.tick = 3
    battle.actors[0].health = 10
    battle.actors[0].shield = 12
    const next = stepChessBattle(battle)
    expect(next.events.join(" ")).toMatch(/hồi tối đa 6/)
    expect(next.events.join(" ")).toMatch(/mỗi đối thủ/)
    expect(next.actors[0].health).toBeGreaterThan(10)
    expect(next.actors[0].shield).toBeLessThanOrEqual(12)
    expect(next.actors.at(-1)!.health).toBeLessThan(36)
  })
  it("resolves unresolved tick80 as draw, settles it only once", () => {
    let game = applyChessCommand(
      applyChessCommand(createChessMatch(), { type: "buy", slot: 0 }),
      { type: "arrange" },
    )
    game = applyChessCommand(game, { type: "start" })
    game.battle!.tick = 79
    game.battle!.actors.forEach((actor) => {
      actor.health = actor.maxHealth = 10000
    })
    const next = applyChessCommand(game, { type: "tick" })
    expect(next.battle!.status).toBe("draw")
    expect(next.health).toBe(11)
    expect(next.history).toEqual(["draw"])
    expect(() => applyChessCommand(next, { type: "tick" })).toThrow()
  })
  it("legal recruitment/formation reaches real wins and weak armies lose across seeds", () => {
    const results = []
    for (let seed = 1; seed <= 12; seed++) results.push(play(seed).status)
    expect(results).toContain("player-win")
    expect(play(20261021, true).status).toBe("opponent-win")
    expect(play(20261021).status).toBe("player-win")
  })
  it("surrender/rematch and session rejection never accept supplied round outcomes", () => {
    const session = createChessSession(),
      rejected = reduceChessSession(session, { type: "start" })
    expect(rejected.game).toBe(session.game)
    expect(rejected.feedback).toMatch(/ít nhất/)
    const lost = applyChessCommand(session.game, { type: "surrender" })
    expect(lost.status).toBe("opponent-win")
    expect(() => applyChessCommand(lost, { type: "next" })).toThrow()
    expect(applyChessCommand(lost, { type: "rematch" }).seed).toBe(
      session.game.seed + 1,
    )
    expect(reduceChessSession(session, { type: "refresh" })).toEqual(
      reduceChessSession(session, { type: "refresh" }),
    )
  })
})
