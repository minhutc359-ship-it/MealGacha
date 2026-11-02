import {
  BOARD_LIMIT,
  ENERGY_LIMIT,
  HAND_LIMIT,
  LEADER_HEALTH,
  TCG_DECK,
  TCG_PROFILE,
  TURN_LIMIT,
  tcgCard,
} from "./catalog"
import type {
  TcgCardInstance,
  TcgCommand,
  TcgEvent,
  TcgMatch,
  TcgPlayOptions,
  TcgPlayer,
  TcgSide,
  TcgUnit,
} from "./types"

export const otherTcgSide = (side: TcgSide): TcgSide =>
  side === "player" ? "opponent" : "player"
export const tcgSideName = (side: TcgSide) =>
  side === "player" ? "Bạn" : "Chủ bàn"
export const tcgLeaderTarget = (side: TcgSide) => `${side}:leader`

function emit(game: TcgMatch, kind: TcgEvent["kind"], text: string): void {
  game.events.push({ serial: ++game.eventSerial, kind, text })
  game.events = game.events.slice(-50)
}
function settle(game: TcgMatch): void {
  const player = game.players.player.health <= 0,
    opponent = game.players.opponent.health <= 0
  if (!player && !opponent) return
  game.status =
    player && opponent ? "draw" : player ? "opponent-win" : "player-win"
  emit(
    game,
    "end",
    game.status === "draw"
      ? "Ván hòa."
      : game.status === "player-win"
        ? "Bạn thắng ván này."
        : "Chủ bàn thắng ván này.",
  )
}
function draw(game: TcgMatch, side: TcgSide): void {
  const player = game.players[side],
    card = player.deck.shift()
  if (!card) {
    player.fatigue++
    player.health = Math.max(0, player.health - player.fatigue)
    emit(
      game,
      "fatigue",
      `${tcgSideName(side)} hết bài và mất ${player.fatigue} máu.`,
    )
    settle(game)
    return
  }
  if (player.hand.length >= HAND_LIMIT) {
    player.discard.push(card)
    emit(
      game,
      "burn",
      `${tcgSideName(side)} đầy tay, bỏ ${tcgCard(card.cardId).name}.`,
    )
  } else {
    player.hand.push(card)
    emit(
      game,
      "draw",
      side === "player"
        ? `Bạn rút ${tcgCard(card.cardId).name}.`
        : "Chủ bàn rút một lá.",
    )
  }
}
function startTurn(game: TcgMatch, side: TcgSide): void {
  game.activeSide = side
  game.turn++
  const player = game.players[side]
  player.turnsTaken++
  player.maxEnergy = Math.min(ENERGY_LIMIT, player.turnsTaken)
  player.energy = player.maxEnergy
  player.board.forEach((unit) => {
    unit.ready = true
  })
  emit(
    game,
    "turn",
    `Lượt ${game.turn}: ${tcgSideName(side)} nhận ${player.energy} năng lượng.`,
  )
  draw(game, side)
}
function makePlayer(seed: number, side: TcgSide): TcgPlayer {
  const deck = TCG_DECK.map((cardId, index) => ({
    uid: `${side}:card:${index}`,
    cardId,
  }))
  let state = (seed ^ (side === "player" ? 0x9e3779b9 : 0x85ebca6b)) >>> 0
  for (let index = deck.length - 1; index > 0; index--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    const chosen = state % (index + 1)
    ;[deck[index], deck[chosen]] = [deck[chosen], deck[index]]
  }
  return {
    health: LEADER_HEALTH,
    energy: 0,
    maxEnergy: 0,
    turnsTaken: 0,
    fatigue: 0,
    deck,
    hand: [],
    board: [],
    discard: [],
  }
}
export function createTcgMatch(seed: number): TcgMatch {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw Error("Seed TCG phải là số nguyên uint32.")
  const game: TcgMatch = {
    profile: TCG_PROFILE,
    seed,
    turn: 0,
    activeSide: "player",
    status: "active",
    players: {
      player: makePlayer(seed, "player"),
      opponent: makePlayer(seed, "opponent"),
    },
    events: [],
    eventSerial: 0,
  }
  for (const side of ["player", "opponent"] as const)
    for (let count = 0; count < 3; count++) draw(game, side)
  startTurn(game, "player")
  return game
}

export function tcgPlayOptions(
  game: TcgMatch,
  side: TcgSide,
  uid: string,
): TcgPlayOptions {
  const blocked = (reason: string): TcgPlayOptions => ({ actions: [], reason })
  if (game.status !== "active" || game.activeSide !== side)
    return blocked("Chưa đến lượt.")
  const player = game.players[side],
    card = player.hand.find((candidate) => candidate.uid === uid)
  if (!card) return blocked("Lá này không còn trên tay.")
  const definition = tcgCard(card.cardId)
  if (definition.cost > player.energy)
    return blocked(`Cần ${definition.cost} năng lượng.`)
  if (definition.kind === "unit" && player.board.length >= BOARD_LIMIT)
    return blocked("Bàn đã đủ 3 Vị Linh.")
  if (definition.effect === "heal-3" && player.health >= LEADER_HEALTH)
    return blocked("Máu đang đầy.")
  if (definition.effect === "bolt-2") {
    const targets = game.players[otherTcgSide(side)].board
    return targets.length
      ? {
          actions: targets.map((target) => ({
            type: "play",
            side,
            uid,
            targetUid: target.uid,
          })),
          reason: null,
        }
      : blocked("Chưa có mục tiêu.")
  }
  return { actions: [{ type: "play", side, uid }], reason: null }
}

export function legalTcgActions(game: TcgMatch, side: TcgSide): TcgCommand[] {
  if (game.status !== "active" || game.activeSide !== side) return []
  const player = game.players[side],
    enemySide = otherTcgSide(side),
    enemy = game.players[enemySide]
  const guards = enemy.board.filter(
    (unit) => tcgCard(unit.cardId).effect === "guard",
  )
  const targets = guards.length
    ? guards.map((unit) => unit.uid)
    : [...enemy.board.map((unit) => unit.uid), tcgLeaderTarget(enemySide)]
  const actions: TcgCommand[] = player.hand.flatMap(
    (card) => tcgPlayOptions(game, side, card.uid).actions,
  )
  for (const unit of player.board)
    if (unit.ready && unit.attack > 0)
      for (const targetUid of targets)
        actions.push({ type: "attack", side, uid: unit.uid, targetUid })
  actions.push({ type: "end-turn", side }, { type: "surrender", side })
  return actions
}
function sameCommand(a: TcgCommand, b: TcgCommand): boolean {
  if (a.type !== b.type || a.side !== b.side) return false
  if (a.type === "play" && b.type === "play")
    return a.uid === b.uid && a.targetUid === b.targetUid
  if (a.type === "attack" && b.type === "attack")
    return a.uid === b.uid && a.targetUid === b.targetUid
  return a.type === "end-turn" || a.type === "surrender"
}
function damageUnit(game: TcgMatch, unit: TcgUnit, amount: number): void {
  const absorbed = Math.min(unit.shield, amount)
  unit.shield -= absorbed
  unit.health = Math.max(0, unit.health - amount + absorbed)
  if (absorbed)
    emit(game, "effect", `${tcgCard(unit.cardId).name} dùng ${absorbed} khiên.`)
}
function sweepDefeated(game: TcgMatch): void {
  for (const side of ["player", "opponent"] as const) {
    const player = game.players[side]
    for (const unit of player.board.filter((unit) => unit.health <= 0)) {
      player.discard.push({ uid: unit.uid, cardId: unit.cardId })
      emit(
        game,
        "defeat",
        `${tcgSideName(side)}: ${tcgCard(unit.cardId).name} rời bàn.`,
      )
    }
    player.board = player.board.filter((unit) => unit.health > 0)
  }
}
function healLeader(game: TcgMatch, side: TcgSide, amount: number): void {
  const player = game.players[side],
    restored = Math.min(amount, LEADER_HEALTH - player.health)
  player.health += restored
  if (restored)
    emit(game, "effect", `${tcgSideName(side)} hồi ${restored} máu.`)
}

export function applyTcgCommand(game: TcgMatch, command: TcgCommand): TcgMatch {
  const legal = legalTcgActions(game, command.side).find((candidate) =>
    sameCommand(candidate, command),
  )
  if (!legal)
    throw Error("Nước đi không hợp lệ. Kiểm tra lượt, năng lượng và mục tiêu.")
  const next = structuredClone(game),
    side = legal.side,
    player = next.players[side],
    enemySide = otherTcgSide(side),
    enemy = next.players[enemySide]
  if (legal.type === "surrender") {
    next.status = side === "player" ? "opponent-win" : "player-win"
    emit(next, "end", `${tcgSideName(side)} nhận thua ván này.`)
  } else if (legal.type === "end-turn") {
    if (next.turn >= TURN_LIMIT) {
      next.status = "draw"
      emit(next, "end", "Ván hòa sau 60 lượt.")
    } else startTurn(next, enemySide)
  } else if (legal.type === "play") {
    const index = player.hand.findIndex((card) => card.uid === legal.uid)
    const [card] = player.hand.splice(index, 1),
      definition = tcgCard(card.cardId)
    player.energy -= definition.cost
    emit(next, "play", `${tcgSideName(side)} dùng ${definition.name}.`)
    if (definition.kind === "unit") {
      player.board.push({
        ...card,
        attack: definition.attack,
        health: definition.health,
        maxHealth: definition.health,
        shield: 0,
        ready: false,
      })
    } else player.discard.push(card)
    if (definition.effect === "heal-2") healLeader(next, side, 2)
    if (definition.effect === "heal-3") healLeader(next, side, 3)
    if (definition.effect === "shield-others")
      for (const ally of player.board.filter((unit) => unit.uid !== card.uid)) {
        const gained = Math.min(3, ally.shield + 1) - ally.shield
        ally.shield += gained
        if (gained)
          emit(
            next,
            "effect",
            `${tcgCard(ally.cardId).name} nhận ${gained} khiên.`,
          )
      }
    if (definition.effect === "mist-1")
      enemy.board.forEach((unit) => damageUnit(next, unit, 1))
    if (definition.effect === "bolt-2")
      damageUnit(
        next,
        enemy.board.find((unit) => unit.uid === legal.targetUid)!,
        2,
      )
    sweepDefeated(next)
  } else if (legal.type === "attack") {
    const unit = player.board.find((candidate) => candidate.uid === legal.uid)!
    unit.ready = false
    if (legal.targetUid === tcgLeaderTarget(enemySide)) {
      enemy.health = Math.max(0, enemy.health - unit.attack)
      emit(
        next,
        "attack",
        `${tcgCard(unit.cardId).name} đánh ${tcgSideName(enemySide)}: ${unit.attack} sát thương.`,
      )
    } else {
      const target = enemy.board.find(
        (candidate) => candidate.uid === legal.targetUid,
      )!
      const retaliation = target.attack
      emit(
        next,
        "attack",
        `${tcgCard(unit.cardId).name} giao đấu với ${tcgCard(target.cardId).name}.`,
      )
      damageUnit(next, target, unit.attack)
      damageUnit(next, unit, retaliation)
      sweepDefeated(next)
    }
    settle(next)
  }
  return next
}

/** Uses own hand and public board/HP only, for the opponent and optional player coach. */
export function recommendTcgAction(
  game: TcgMatch,
  side: TcgSide,
): TcgCommand | null {
  const player = game.players[side],
    enemy = game.players[otherTcgSide(side)]
  const score = (action: TcgCommand): number => {
    if (action.type === "surrender") return -Infinity
    if (action.type === "end-turn") return -1000
    if (action.type === "play") {
      const card = tcgCard(
        player.hand.find((card) => card.uid === action.uid)!.cardId,
      )
      if (card.effect === "heal-3")
        return player.health <= 6 ? 600 : 35 + LEADER_HEALTH - player.health
      if (card.effect === "bolt-2") {
        const target = enemy.board.find(
          (unit) => unit.uid === action.targetUid,
        )!
        return (
          45 +
          (target.health + target.shield <= 2 ? 150 : 0) +
          target.attack * 3
        )
      }
      return (
        80 +
        card.attack * 4 +
        card.health +
        (card.effect === "shield-others" ? player.board.length * 5 : 0)
      )
    }
    if (action.type !== "attack") return -Infinity
    const unit = player.board.find((unit) => unit.uid === action.uid)!
    const target = enemy.board.find((unit) => unit.uid === action.targetUid)
    if (!target) return unit.attack >= enemy.health ? 10000 : 60 + unit.attack
    const kills = target.health + target.shield <= unit.attack,
      dies = unit.health + unit.shield <= target.attack
    return 30 + (kills ? 70 + target.attack * 3 : 0) - (dies ? 20 : 0)
  }
  return (
    legalTcgActions(game, side)
      .filter((action) => action.type !== "surrender")
      .sort((a, b) => score(b) - score(a))[0] ?? null
  )
}

export function runTcgOpponent(game: TcgMatch): TcgMatch {
  let current = game
  for (let step = 0; step < 64; step++) {
    if (current.status !== "active" || current.activeSide !== "opponent")
      return current
    const command = recommendTcgAction(current, "opponent")
    if (!command) throw Error("Đối thủ không có nước đi hợp lệ.")
    current = applyTcgCommand(current, command)
  }
  throw Error("Lượt đối thủ vượt giới hạn an toàn.")
}

export function playTcgPlayerCommand(
  game: TcgMatch,
  command: TcgCommand,
): TcgMatch {
  if (command.side !== "player") throw Error("Bạn chỉ điều khiển phía mình.")
  return runTcgOpponent(applyTcgCommand(game, command))
}
