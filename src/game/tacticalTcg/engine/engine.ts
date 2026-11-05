import { TACTICAL_UNIT_MAP } from "./catalog"
import { TACTICAL_CARD_MAP } from "../cards"
import { enableDirectedBattle } from "./directedRules"
import { reduceDirectedBattle } from "./directed"
import {
  cardLog,
  createCardGame,
  drawCards,
  emptyCardCell,
  playCard,
  recordFallenCards,
  seededShuffle,
} from "./cardRuntime"
import type {
  BattleSide,
  BattleTrap,
  BattleUnit,
  BoardCell,
  CreateBattleOptions,
  TacticalBattleAction,
  TacticalBattleState,
} from "./types"

const defaultPlayer: NonNullable<CreateBattleOptions["player"]> = [
  { definitionId: "hai", cell: { row: 0, column: 0 } },
  { definitionId: "bach", cell: { row: 0, column: 2 } },
  { definitionId: "nhien", cell: { row: 1, column: 0 } },
  { definitionId: "lien", cell: { row: 1, column: 1 } },
  { definitionId: "moc", cell: { row: 1, column: 2 } },
]
const defaultEnemy: NonNullable<CreateBattleOptions["enemy"]> = [
  { definitionId: "salt-scarab", cell: { row: 0, column: 0 } },
  { definitionId: "kiln-knight", cell: { row: 0, column: 2 } },
  { definitionId: "salt-scarab", cell: { row: 1, column: 1 } },
  { definitionId: "aroma-regent", cell: { row: 1, column: 3 } },
]

const clone = (state: TacticalBattleState): TacticalBattleState =>
  structuredClone(state)
const occupied = (
  units: BattleUnit[],
  side: BattleSide,
  cell: BoardCell,
  except?: string,
) =>
  units.some(
    (unit) =>
      !unit.defeated &&
      unit.side === side &&
      unit.instanceId !== except &&
      unit.cell.row === cell.row &&
      unit.cell.column === cell.column,
  )

function makeUnits(
  side: BattleSide,
  formation: NonNullable<CreateBattleOptions["player"]>,
) {
  if (formation.length > 5)
    throw Error("A formation may contain at most five units")
  return formation.map((slot, index): BattleUnit => {
    const definition = TACTICAL_UNIT_MAP.get(slot.definitionId)
    if (!definition) throw Error(`Unknown tactical unit: ${slot.definitionId}`)
    if (occupied([], side, slot.cell)) throw Error("Duplicate board cell")
    const star = slot.star ?? 1
    return {
      ...definition,
      instanceId: `${side}-${index}-${definition.id}`,
      side,
      cell: slot.cell,
      hp: definition.maxHp * star,
      maxHp: definition.maxHp * star,
      attack: definition.attack * star,
      ultimatePower: definition.ultimatePower * star,
      star,
      energy: 0,
      shield: 0,
      defeated: false,
    }
  })
}

export function createTacticalBattle(
  options: CreateBattleOptions,
): TacticalBattleState {
  const cardGame = createCardGame(options)
  const units = [
    ...makeUnits("player", cardGame ? [] : (options.player ?? defaultPlayer)),
    ...makeUnits(
      "enemy",
      cardGame
        ? options.boss
          ? [
              {
                definitionId: options.boss.definitionId,
                cell: { row: 0, column: 1 },
              },
            ]
          : []
        : (options.enemy ?? defaultEnemy),
    ),
  ]
  if (cardGame)
    for (const unit of units) {
      unit.maxHp = unit.hp = Math.ceil(unit.maxHp * 0.55)
      unit.attack = Math.ceil(unit.attack * 0.25)
      unit.ultimatePower = Math.ceil(unit.ultimatePower * 0.4)
    }
  const seen = new Set<string>()
  for (const unit of units) {
    const key = `${unit.side}:${unit.cell.row}:${unit.cell.column}`
    if (seen.has(key)) throw Error(`Duplicate board cell: ${key}`)
    seen.add(key)
  }
  const bossUnit = options.boss
    ? units.find(
        (unit) =>
          unit.side === "enemy" && unit.id === options.boss?.definitionId,
      )
    : null
  if (options.boss && !bossUnit)
    throw Error(`Boss is missing from formation: ${options.boss.definitionId}`)
  const battle: TacticalBattleState = {
    schemaVersion: 1,
    battleId: options.battleId,
    mode: options.mode ?? "campaign",
    nodeId: options.nodeId ?? null,
    seed: options.seed ?? 1,
    round: 1,
    phase: "planning",
    winner: null,
    units,
    traps: [],
    boss:
      options.boss && bossUnit
        ? { unitId: bossUnit.instanceId, title: options.boss.title, phase: 1 }
        : null,
    commanders: {
      player: { hp: cardGame ? 30 : 100, maxHp: cardGame ? 30 : 100 },
      enemy: { hp: cardGame ? 30 : 100, maxHp: cardGame ? 30 : 100 },
    },
    processedActionIds: [],
    log: [{ id: "start", text: "Dàn trận trên bàn 4×2." }],
    lastReaction: null,
    reward: null,
    cardGame,
  }
  return options.manual ? enableDirectedBattle(battle) : battle
}

const trapName = (trapId: BattleTrap["trapId"]) =>
  ({
    "bamboo-guard": "Mành Tre",
    "steam-counter": "Hơi Nóng Phản Kích",
    "warm-broth": "Nước Dùng Ấm",
  })[trapId]

function log(state: TacticalBattleState, text: string) {
  state.log.push({ id: `${state.log.length}`, text })
}

function reactionLog(state: TacticalBattleState, text: string) {
  state.lastReaction = text
  log(state, text)
}

function matchingTrap(state: TacticalBattleState, target: BattleUnit) {
  return state.traps.find(
    (trap) =>
      trap.armed &&
      trap.side === target.side &&
      trap.column === target.cell.column,
  )
}

function triggerTrap(
  state: TacticalBattleState,
  trap: BattleTrap,
  attacker: BattleUnit,
  target: BattleUnit,
  moment: "before" | "after",
) {
  if (trap.trapId === "bamboo-guard" && moment === "before") {
    target.shield += 20
    trap.armed = false
    trap.triggeredRound = state.round
    reactionLog(
      state,
      `Bẫy ${trapName(trap.trapId)} chắn 20 sát thương cho ${target.name}.`,
    )
  } else if (trap.trapId === "steam-counter" && moment === "after") {
    attacker.hp = Math.max(0, attacker.hp - 12)
    attacker.defeated = attacker.hp === 0
    trap.armed = false
    trap.triggeredRound = state.round
    reactionLog(
      state,
      `Bẫy ${trapName(trap.trapId)} phản lại ${attacker.name} 12 sát thương.`,
    )
  } else if (
    trap.trapId === "warm-broth" &&
    moment === "after" &&
    !target.defeated &&
    target.hp <= target.maxHp / 2
  ) {
    const healed = Math.min(18, target.maxHp - target.hp)
    target.hp += healed
    trap.armed = false
    trap.triggeredRound = state.round
    reactionLog(
      state,
      `Bẫy ${trapName(trap.trapId)} hồi ${healed} sinh lực cho ${target.name}.`,
    )
  }
}

function advanceBossPhase(state: TacticalBattleState, target: BattleUnit) {
  if (!state.boss || state.boss.unitId !== target.instanceId || target.defeated)
    return
  const desired =
    target.hp / target.maxHp <= 1 / 3
      ? 3
      : target.hp / target.maxHp <= 2 / 3
        ? 2
        : 1
  while (state.boss.phase < desired) {
    state.boss.phase = (state.boss.phase + 1) as 2 | 3
    const shield = state.boss.phase === 2 ? 12 : 18
    target.shield += shield
    target.attack += 4
    target.energy = Math.min(100, target.energy + 20)
    reactionLog(
      state,
      `${state.boss.title} chuyển Pha ${state.boss.phase}: +${shield} khiên, sức đánh tăng.`,
    )
  }
}

export function findTarget(state: TacticalBattleState, attacker: BattleUnit) {
  const side: BattleSide = attacker.side === "player" ? "enemy" : "player"
  const candidates = state.units.filter(
    (unit) => unit.side === side && !unit.defeated,
  )
  return (
    candidates.find(
      (unit) =>
        unit.role === "guardian" &&
        unit.cell.row === 0 &&
        unit.cell.column === attacker.cell.column,
    ) ??
    candidates.find(
      (unit) =>
        unit.cell.column === attacker.cell.column && unit.cell.row === 0,
    ) ??
    candidates
      .filter((unit) => unit.cell.row === 0)
      .sort(
        (a, b) =>
          Math.abs(a.cell.column - attacker.cell.column) -
          Math.abs(b.cell.column - attacker.cell.column),
      )[0] ??
    candidates
      .filter((unit) => unit.cell.row === 1)
      .sort(
        (a, b) =>
          Math.abs(a.cell.column - attacker.cell.column) -
          Math.abs(b.cell.column - attacker.cell.column),
      )[0] ??
    null
  )
}

function activeTraitBonus(state: TacticalBattleState, side: BattleSide) {
  const counts = new Map<string, number>()
  for (const unit of state.units.filter(
    (item) => item.side === side && !item.defeated,
  ))
    for (const trait of unit.traits)
      counts.set(trait, (counts.get(trait) ?? 0) + 1)
  const traitSystems = [...counts.values()].filter((count) => count >= 2).length
  const distinctSchools = new Set(
    state.units
      .filter((u) => u.side === side && !u.defeated && u.cardId)
      .map((u) => TACTICAL_CARD_MAP[u.cardId!].school),
  ).size
  return {
    attack: [...counts.values()].some((count) => count >= 4)
      ? 6
      : traitSystems >= 3 || (state.cardGame && distinctSchools >= 3)
        ? 3
        : 0,
    systems: traitSystems,
  }
}

function deal(
  state: TacticalBattleState,
  attacker: BattleUnit,
  power: number,
  label: string,
  targetId?: string,
) {
  const target = targetId ? state.units.find(u=>u.instanceId===targetId&&!u.defeated)??null : findTarget(state, attacker)
  const bonus = activeTraitBonus(state, attacker.side).attack
  const ability = attacker.cardId
    ? TACTICAL_CARD_MAP[attacker.cardId].ability
    : null
  const abilityBonus =
    target &&
    ((ability === "duelist" && target.hp === target.maxHp) ||
      (ability === "execute" && target.hp < target.maxHp))
      ? 12
      : 0
  const damage = power + bonus + abilityBonus
  if (target) {
    if (ability === "siphon") {
      const stolen = Math.min(12, target.shield)
      target.shield -= stolen
      attacker.shield += stolen
    }
    const trap = state.cardGame?.directed ? undefined : matchingTrap(state, target)
    if (trap) triggerTrap(state, trap, attacker, target, "before")
    const absorbed = Math.min(target.shield, damage)
    target.shield -= absorbed
    target.hp = Math.max(0, target.hp - damage + absorbed)
    target.defeated = target.hp === 0
    log(
      state,
      `${attacker.name} ${label} ${target.name}: ${damage} sát thương.`,
    )
    if (trap?.armed) triggerTrap(state, trap, attacker, target, "after")
    advanceBossPhase(state, target)
  } else {
    const side: BattleSide = attacker.side === "player" ? "enemy" : "player"
    const commanderDamage = state.cardGame
      ? Math.max(1, Math.ceil(damage / 10))
      : damage
    state.commanders[side].hp = Math.max(
      0,
      state.commanders[side].hp - commanderDamage,
    )
    log(state, `${attacker.name} đánh Chỉ huy: -${commanderDamage} Ý chí.`)
  }
  if (
    attacker.cardId &&
    TACTICAL_CARD_MAP[attacker.cardId].keywords.includes("drain")
  )
    state.commanders[attacker.side].hp = Math.min(
      state.commanders[attacker.side].maxHp,
      state.commanders[attacker.side].hp + 1,
    )
  attacker.energy = Math.min(100, attacker.energy + 25)
}

function finish(state: TacticalBattleState) {
  const living = (side: BattleSide) =>
    state.units.some((unit) => unit.side === side && !unit.defeated)
  if ((!state.cardGame && !living("enemy")) || state.commanders.enemy.hp === 0)
    state.winner = "player"
  else if (
    (!state.cardGame && !living("player")) ||
    state.commanders.player.hp === 0
  )
    state.winner = "enemy"
  if (state.winner) {
    state.phase = "result"
    if (state.winner === "player")
      state.reward = {
        id: `reward:${state.battleId}`,
        battleId: state.battleId,
        nodeId: state.nodeId,
        tinhVi: state.mode === "pvp" ? 0 : state.boss ? 60 : 30,
        cardCopies:
          state.mode === "pvp"
            ? {}
            : { [`card:${state.cardGame?.rewardCardId ?? "chef-nhien"}`]: 1 },
      }
  }
}

export function reduceTacticalBattle(
  current: TacticalBattleState,
  action: TacticalBattleAction,
) {
  return current.cardGame?.directed ? reduceDirectedBattle(current,action,reduceCoreBattle,finish) : reduceCoreBattle(current,action)
}
function reduceCoreBattle(current:TacticalBattleState,action:TacticalBattleAction) {
  if(["end-turn","enemy-step","react"].includes(action.type))return current
  if (current.processedActionIds.includes(action.id)) return current
  if (current.phase === "result") return current
  const state = clone(current)
  state.processedActionIds.push(action.id)
  const unit =
    "unitId" in action
      ? state.units.find(
          (item) => item.instanceId === action.unitId && !item.defeated,
        )
      : null
  switch (action.type) {
    case "forfeit":
      state.commanders.player.hp = 0
      break
    case "mulligan": {
      const player = state.cardGame?.sides.player
      if (
        !player ||
        player.mulliganUsed ||
        state.round !== 1 ||
        state.phase !== "planning" ||
        state.units.some((u) => u.side === "player")
      )
        return current
      const previous = [...player.hand]
      player.hand = player.deck.splice(0, 4)
      player.deck = seededShuffle(
        [...player.deck, ...previous],
        state.seed + 77,
      )
      player.mulliganUsed = true
      log(state, "Đã đổi tay đầu một lần.")
      break
    }
    case "play-card":
      if (!playCard(state, action)) return current
      break
    case "move":
      if (
        state.phase !== "planning" ||
        !unit ||
        (state.cardGame &&
          (unit.side !== "player" ||
            state.cardGame.movedRound === state.round)) ||
        occupied(state.units, unit.side, action.cell, unit.instanceId)
      )
        return current
      unit.cell = action.cell
      if (state.cardGame) state.cardGame.movedRound = state.round
      break
    case "merge": {
      // exact copies: campaign 3, PvP 2
      if (state.phase !== "planning") return current
      const required = state.mode === "campaign" ? 3 : 2
      if (action.unitIds.length !== required) return current
      const copies = action.unitIds.map((id) =>
        state.units.find((item) => item.instanceId === id && !item.defeated),
      )
      if (
        copies.some((item) => !item) ||
        new Set(action.unitIds).size !== required ||
        copies.some(
          (item) =>
            item!.id !== copies[0]!.id ||
            item!.star !== copies[0]!.star ||
            item!.side !== copies[0]!.side,
        ) ||
        copies[0]!.star === 3
      )
        return current
      copies[0]!.star = Math.min(3, copies[0]!.star + 1) as 1 | 2 | 3
      copies[0]!.attack += copies[0]!.attack
      copies[0]!.maxHp += copies[0]!.maxHp
      copies[0]!.hp = copies[0]!.maxHp
      for (const consumed of copies.slice(1)) {
        consumed!.hp = 0
        consumed!.defeated = true
      }
      log(state, `${copies[0]!.name} hợp nhất thành ${copies[0]!.star} sao.`)
      break
    }
    case "place-trap": {
      if (state.phase !== "planning" || state.cardGame) return current
      state.traps = state.traps.filter(
        (trap) => !(trap.side === action.side && trap.armed),
      )
      state.traps.push({
        instanceId: action.id,
        trapId: action.trapId,
        side: action.side,
        column: action.column,
        armed: true,
        triggeredRound: null,
      })
      log(
        state,
        `${
          action.side === "player" ? "Bạn" : "Địch"
        } đặt bẫy ${trapName(action.trapId)} ở cột ${action.column + 1}.`,
      )
      break
    }
    case "begin-round":
      if (state.phase !== "planning") return current
      state.lastReaction = null
      state.phase = "clash"
      break
    case "basic":
      if (!unit || !["clash", "reaction", ...(state.cardGame?.directed ? ["planning"] : [])].includes(state.phase)) return current
      if (state.cardGame?.attacks[unit.instanceId] === state.round)
        return current
      if (state.cardGame) state.cardGame.attacks[unit.instanceId] = state.round
      deal(state, unit, unit.attack, "đánh", action.targetId)
      state.phase = state.cardGame?.directed ? "planning" : "reaction"
      break
    case "ultimate":
      if (
        !unit ||
        unit.energy < 100 ||
        !["reaction", "ultimate", ...(state.cardGame?.directed ? ["planning"] : [])].includes(state.phase)
      )
        return current
      unit.energy = 0
      deal(state, unit, unit.ultimatePower, "tung tuyệt kỹ vào", action.targetId)
      state.phase = state.cardGame?.directed ? "planning" : "ultimate"
      break
    case "end-round":
      if (state.phase === "planning") return current
      if (state.round >= 8)
        for (const side of ["player", "enemy"] as const)
          state.commanders[side].hp = Math.max(
            0,
            state.commanders[side].hp - (state.round - 7) * 5,
          )
      state.round += 1
      state.phase = "planning"
      for (const item of state.units)
        item.energy = Math.min(100, item.energy + 20)
      if (state.cardGame)
        for (const side of ["player", "enemy"] as const) {
          const cards = state.cardGame.sides[side]
          cards.maxMana = Math.min(10, cards.maxMana + 1)
          cards.mana = cards.maxMana
          cards.spellsThisRound = 0
          cards.lastSchool = null
          drawCards(state, side, 1)
        }
      break
  }
  recordFallenCards(current, state)
  if (state.cardGame)
    for (const side of ["player", "enemy"] as const) {
      if (state.commanders[side].hp <= current.commanders[side].hp) continue
      for (const ally of state.units.filter(
        (u) =>
          !u.defeated &&
          u.side === side &&
          u.cardId &&
          TACTICAL_CARD_MAP[u.cardId].ability === "bloom",
      )) {
        const key = `bloom:${state.round}`
        ally.triggers ??= {}
        if ((ally.triggers[key] ?? 0) < 2) {
          ally.attack += 6
          ally.triggers[key] = (ally.triggers[key] ?? 0) + 1
        }
      }
    }
  if (state.boss) {
    const boss = state.units.find((u) => u.instanceId === state.boss!.unitId)
    if (boss) advanceBossPhase(state, boss)
  }
  finish(state)
  return state
}

export function playAutomaticRound(
  current: TacticalBattleState,
  onFrame?: (state: TacticalBattleState) => void,
) {
  if (["reaction", "ultimate", "round-end"].includes(current.phase))
    return reduceTacticalBattle(current, {
      id: `r${current.round}:end`,
      type: "end-round",
    })
  let state = current
  if (state.cardGame && state.phase === "planning") {
    for (let i = 0; i < 8; i++) {
      const owner = state.cardGame!.sides.enemy
      let played = false
      for (let handIndex = 0; handIndex < owner.hand.length; handIndex++) {
        const card = TACTICAL_CARD_MAP[owner.hand[handIndex]]
        if (card.cost > owner.mana) continue
        const next = reduceTacticalBattle(state, {
          id: `r${state.round}:enemy:${i}:${handIndex}`,
          type: "play-card",
          side: "enemy",
          handIndex,
          cell:
            emptyCardCell(state, "enemy", card.tacticalRole !== "guardian") ??
            undefined,
          column: (state.round % 4) as 0 | 1 | 2 | 3,
        })
        if (next !== state) {
          state = next
          onFrame?.(state)
          played = true
          break
        }
      }
      if (!played || state.phase === "result") break
    }
  }
  state = reduceTacticalBattle(state, {
    id: `r${current.round}:begin`,
    type: "begin-round",
  })
  onFrame?.(state)
  const order = [...state.units]
    .filter((unit) => !unit.defeated)
    .sort(
      (a, b) =>
        b.attack - a.attack ||
        (state.cardGame && a.side !== b.side
          ? a.side === (state.round % 2 ? "player" : "enemy")
            ? -1
            : 1
          : a.instanceId.localeCompare(b.instanceId)),
    )
  for (const unit of order) {
    if (state.phase === "result") break
    state = reduceTacticalBattle(state, {
      id: `r${state.round}:basic:${unit.instanceId}`,
      type: "basic",
      unitId: unit.instanceId,
    })
    onFrame?.(state)
    if (state.cardGame && unit.side === "enemy" && state.phase !== "result") {
      state = reduceTacticalBattle(state, {
        id: `r${state.round}:enemy-ult:${unit.instanceId}`,
        type: "ultimate",
        unitId: unit.instanceId,
      })
      onFrame?.(state)
    }
  }
  return state
}

export function replayTacticalBattle(
  initial: TacticalBattleState,
  actions: TacticalBattleAction[],
) {
  return actions.reduce(reduceTacticalBattle, initial)
}
