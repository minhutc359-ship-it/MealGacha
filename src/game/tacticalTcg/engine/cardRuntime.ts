import { SCHOOLS } from "../../catalog"
import {
  TACTICAL_CARD_MAP,
  TACTICAL_STARTER,
  tacticalDeckErrors,
} from "../cards"
import type {
  BattleSide,
  BoardCell,
  CardCombatant,
  CreateBattleOptions,
  TacticalBattleAction,
  TacticalBattleState,
} from "./types"

export function seededShuffle(cards: readonly string[], seed: number) {
  const result = [...cards]
  let next = seed >>> 0
  for (let i = result.length - 1; i > 0; i--) {
    next = (Math.imul(next, 1664525) + 1013904223) >>> 0
    const j = next % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
export function createCardGame(options: CreateBattleOptions) {
  if (!options.deck) return undefined
  const errors = tacticalDeckErrors(options.deck)
  if (errors.length) throw Error(errors[0])
  const enemyErrors = tacticalDeckErrors(options.enemyDeck ?? TACTICAL_STARTER)
  if (enemyErrors.length) throw Error(enemyErrors[0])
  const side = (cards: string[], seed: number): CardCombatant => {
    const shuffled = seededShuffle(cards, seed)
    return {
      hand: shuffled.slice(0, 4),
      deck: shuffled.slice(4),
      discard: [],
      mana: 3,
      maxMana: 3,
      fatigue: 0,
      mulliganUsed: false,
      spellsThisRound: 0,
      lastSchool: null,
      recipeRound: 0,
    }
  }
  const player = side(options.deck, options.seed ?? 1)
  const enemy = side(
    options.enemyDeck ?? TACTICAL_STARTER,
    (options.seed ?? 1) + 909,
  )
  if (options.mode !== "pvp")
    enemy.mana = enemy.maxMana = Math.max(
      1,
      3 - Math.min(2, options.enemyManaPenalty ?? 0),
    )
  return {
    sides: { player, enemy },
    nextUnit: 0,
    rewardCardId: options.rewardCardId ?? "chef-nhien",
    movedRound: null,
    attacks: {},
  }
}
export const cardLog = (state: TacticalBattleState, text: string) =>
  state.log.push({ id: `${state.log.length}`, text })
export const otherSide = (side: BattleSide): BattleSide =>
  side === "player" ? "enemy" : "player"
export function drawCards(
  state: TacticalBattleState,
  side: BattleSide,
  count: number,
) {
  const owner = state.cardGame!.sides[side]
  for (let i = 0; i < count; i++) {
    const id = owner.deck.shift()
    if (!id) {
      owner.fatigue++
      state.commanders[side].hp = Math.max(
        0,
        state.commanders[side].hp - owner.fatigue,
      )
      cardLog(
        state,
        `${side === "player" ? "Bạn" : "Địch"} kiệt sức: -${owner.fatigue} Ý chí.`,
      )
    } else if (owner.hand.length < 8) owner.hand.push(id)
    else {
      owner.discard.push(id)
      cardLog(state, `Tay đầy: ${TACTICAL_CARD_MAP[id].name} vào ký ức.`)
    }
  }
}
export function emptyCardCell(
  state: TacticalBattleState,
  side: BattleSide,
  back = false,
): BoardCell | null {
  for (const row of (back ? [1, 0] : [0, 1]) as (0 | 1)[])
    for (const column of [0, 1, 2, 3] as const)
      if (
        !state.units.some(
          (u) =>
            !u.defeated &&
            u.side === side &&
            u.cell.row === row &&
            u.cell.column === column,
        )
      )
        return { row, column }
  return null
}
function validCell(cell?: BoardCell) {
  return (
    !!cell && [0, 1].includes(cell.row) && [0, 1, 2, 3].includes(cell.column)
  )
}
export function playCard(
  state: TacticalBattleState,
  action: Extract<TacticalBattleAction, { type: "play-card" }>,
) {
  if (!state.cardGame || state.phase !== "planning") return false
  const owner = state.cardGame.sides[action.side]
  const id = owner.hand[action.handIndex]
  const card = TACTICAL_CARD_MAP[id]
  if (!Number.isInteger(action.handIndex) || !card || owner.mana < card.cost)
    return false
  owner.mana -= card.cost
  const allies = state.units.filter(
    (u) => u.side === action.side && !u.defeated,
  )
  const enemies = state.units.filter(
    (u) => u.side !== action.side && !u.defeated,
  )
  const enemy = action.targetId
    ? enemies.find((u) => u.instanceId === action.targetId)
    : enemies[0]
  const ally = action.targetId
    ? allies.find((u) => u.instanceId === action.targetId)
    : [...allies].sort((a, b) => a.hp - b.hp)[0]
  if (card.kind === "unit") {
    if (!validCell(action.cell)) return false
    const existing = allies.find(
      (u) =>
        u.cell.row === action.cell!.row &&
        u.cell.column === action.cell!.column,
    )
    if (existing) {
      if (existing.cardId !== id || existing.star >= 2) return false
      existing.star = 2
      existing.attack += Math.ceil(card.attack * 0.4)
      const missing = existing.maxHp - existing.hp
      existing.maxHp += Math.ceil(card.health * 0.4)
      existing.hp = Math.max(1, existing.maxHp - missing)
      owner.hand.splice(action.handIndex, 1)
      owner.discard.push(id)
      cardLog(state, `${existing.name} lên 2 sao; giữ nguyên lượng máu đã mất.`)
    } else {
      if (allies.length >= 5) return false
      owner.hand.splice(action.handIndex, 1)
      const summoned = {
        id,
        cardId: id,
        instanceId: `${action.side}:card:${state.cardGame.nextUnit++}`,
        name: card.name,
        art: card.art ?? "",
        role: card.tacticalRole,
        traits: [
          SCHOOLS[card.school].name,
          card.tacticalRole === "guardian"
            ? "Hộ Vệ"
            : card.tacticalRole === "mage"
              ? "Pháp Sư"
              : card.tacticalRole === "support"
                ? "Hồi Phục"
                : "Đấu Sĩ",
        ],
        side: action.side,
        cell: { ...action.cell! },
        star: 1,
        hp: card.health,
        maxHp: card.health,
        attack: card.attack,
        ultimatePower: Math.max(18, card.attack * 2),
        energy: card.keywords.includes("rush") ? 25 : 0,
        shield:
          (card.keywords.includes("shield") ? 10 : 0) +
          (allies.some(
            (u) =>
              u.cardId && TACTICAL_CARD_MAP[u.cardId].school === card.school,
          )
            ? 5
            : 0),
        defeated: false,
      } as TacticalBattleState["units"][number]
      state.units.push(summoned)
      if (card.tacticalEffect === "draw")
        drawCards(state, action.side, Math.min(2, card.tacticalPower))
      if (card.tacticalEffect === "heal")
        state.commanders[action.side].hp = Math.min(
          30,
          state.commanders[action.side].hp + Math.min(5, card.tacticalPower),
        )
      resolveEntryAbility(state, summoned)
    }
  } else if (card.kind === "trap") {
    const column = action.column ?? 0
    if (![0, 1, 2, 3].includes(column)) return false
    owner.hand.splice(action.handIndex, 1)
    for (const trap of state.traps.filter(
      (t) => t.side === action.side && t.armed,
    )) {
      trap.armed = false
      if (trap.cardId) owner.discard.push(trap.cardId)
    }
    state.traps.push({
      instanceId: action.id,
      cardId: id,
      trapId: card.tacticalTrap!,
      side: action.side,
      column,
      armed: true,
      triggeredRound: null,
    })
  } else {
    const p = card.tacticalPower
    if (action.targetId && !enemy && !ally) return false
    if (card.tacticalEffect === "buff" && !ally) return false
    if (
      card.tacticalEffect === "damage" &&
      (enemies.length || action.targetId) &&
      !enemy
    )
      return false
    if (
      card.tacticalEffect === "revive" &&
      (allies.length >= 5 ||
        !state.units.some(
          (u) => u.side === action.side && u.cardId && u.defeated,
        ))
    )
      return false
    if (
      card.tacticalEffect === "revive" &&
      !state.units.some(
        (u) =>
          u.side === action.side &&
          u.cardId &&
          u.defeated &&
          owner.discard.includes(u.cardId),
      )
    )
      return false
    owner.hand.splice(action.handIndex, 1)
    switch (card.tacticalEffect) {
      case "damage": {
        if (enemy) {
          const absorbed = Math.min(enemy.shield, p * 10)
          enemy.shield -= absorbed
          enemy.hp = Math.max(0, enemy.hp - p * 10 + absorbed)
          enemy.defeated = enemy.hp === 0
        } else
          state.commanders[otherSide(action.side)].hp = Math.max(
            0,
            state.commanders[otherSide(action.side)].hp - p,
          )
        break
      }
      case "sweep":
        for (const u of enemies) {
          const absorbed = Math.min(u.shield, p * 6)
          u.shield -= absorbed
          u.hp = Math.max(0, u.hp - p * 6 + absorbed)
          u.defeated = u.hp === 0
        }
        break
      case "heal":
        state.commanders[action.side].hp = Math.min(
          30,
          state.commanders[action.side].hp + p,
        )
        for (const u of allies) u.hp = Math.min(u.maxHp, u.hp + p * 5)
        break
      case "draw":
        drawCards(state, action.side, Math.min(3, p))
        break
      case "buff":
        ally!.attack += p * 5
        ally!.maxHp += p * 8
        ally!.hp += p * 8
        break
      case "ward":
        for (const u of allies) u.shield += p * 10
        break
      case "revive": {
        const fallen = [...state.units]
          .reverse()
          .find(
            (u) =>
              u.side === action.side &&
              u.cardId &&
              u.defeated &&
              owner.discard.includes(u.cardId),
          )!
        const graveIndex = owner.discard.lastIndexOf(fallen.cardId!)
        if (graveIndex < 0) return false
        owner.discard.splice(graveIndex, 1)
        fallen.cell = emptyCardCell(state, action.side)!
        fallen.defeated = false
        fallen.hp = Math.ceil(fallen.maxHp / 2)
        fallen.energy = 0
        fallen.shield = 0
        break
      }
      case "disarm":
        for (const trap of state.traps.filter(
          (t) => t.side !== action.side && t.armed,
        )) {
          trap.armed = false
          if (trap.cardId)
            state.cardGame.sides[otherSide(action.side)].discard.push(
              trap.cardId,
            )
        }
        drawCards(state, action.side, 1)
        break
    }
    owner.discard.push(id)
    owner.spellsThisRound++
    resolveSpellPassives(state, action.side, card)
  }
  owner.mulliganUsed = true
  if (owner.lastSchool === card.school && owner.recipeRound !== state.round) {
    for (const unit of state.units.filter(
      (u) => !u.defeated && u.side === action.side,
    ))
      unit.shield += 5
    owner.recipeRound = state.round
    cardLog(
      state,
      "Công thức Đồng Vị: hai lá liên tiếp cùng hệ, toàn đội +5 khiên.",
    )
  }
  owner.lastSchool = card.school
  cardLog(
    state,
    action.side === "enemy" && card.kind === "trap"
      ? "Địch gài một Bẫy Hương úp."
      : `${action.side === "player" ? "Bạn" : "Địch"} dùng ${card.name} · ${card.cost} Lửa Bếp.`,
  )
  return true
}

export function recordFallenCards(
  before: TacticalBattleState,
  state: TacticalBattleState,
) {
  if (!state.cardGame) return
  for (const u of state.units)
    if (
      u.cardId &&
      u.defeated &&
      before.units.some(
        (old) => old.instanceId === u.instanceId && !old.defeated,
      )
    ) {
      state.cardGame.sides[u.side].discard.push(u.cardId)
      const ability = TACTICAL_CARD_MAP[u.cardId].ability
      if (ability === "pantry")
        state.commanders[u.side].hp = Math.min(
          30,
          state.commanders[u.side].hp + 3,
        )
      if (ability === "farewell") drawCards(state, u.side, 1)
      if (ability === "testament") {
        const ally = state.units
          .filter((v) => v.side === u.side && !v.defeated)
          .sort((a, b) => a.hp - b.hp)[0]
        if (ally) {
          ally.attack += 6
          ally.shield += 20
        }
      }
    }
  for (const t of state.traps)
    if (
      t.cardId &&
      !t.armed &&
      t.triggeredRound !== null &&
      before.traps.some((old) => old.instanceId === t.instanceId && old.armed)
    )
      state.cardGame.sides[t.side].discard.push(t.cardId)
}

function resolveEntryAbility(
  state: TacticalBattleState,
  unit: TacticalBattleState["units"][number],
) {
  const card = TACTICAL_CARD_MAP[unit.cardId!],
    allies = state.units.filter((u) => u.side === unit.side && !u.defeated),
    enemies = state.units.filter((u) => u.side !== unit.side && !u.defeated)
  const others = allies.filter((u) => u !== unit)
  switch (card.ability) {
    case "breach": {
      const enemy = [...enemies].sort((a, b) => b.shield - a.shield)[0]
      if (enemy) enemy.shield = 0
      break
    }
    case "triage": {
      const ally = [...others].sort(
        (a, b) => b.maxHp - b.hp - (a.maxHp - a.hp),
      )[0]
      if (ally) ally.hp = Math.min(ally.maxHp, ally.hp + 40)
      break
    }
    case "thawer":
      for (const ally of others) ally.energy = Math.min(100, ally.energy + 10)
      break
    case "reserve":
      if (!state.cardGame!.sides[unit.side].hand.length)
        drawCards(state, unit.side, 2)
      break
    case "scout":
      if (state.cardGame!.sides[unit.side].hand.length <= 3)
        drawCards(state, unit.side, 1)
      break
    case "ambush": {
      const enemy = enemies
        .filter((u) => u.hp < u.maxHp)
        .sort((a, b) => a.hp - b.hp)[0]
      if (enemy) {
        const absorbed = Math.min(20, enemy.shield)
        enemy.shield -= absorbed
        enemy.hp = Math.max(0, enemy.hp - 20 + absorbed)
        enemy.defeated = enemy.hp === 0
      }
      break
    }
    case "snare": {
      const enemy = [...enemies].sort((a, b) => b.attack - a.attack)[0]
      if (enemy) enemy.attack = Math.max(0, enemy.attack - 6)
      break
    }
    case "mender":
      for (const ally of allies) ally.hp = Math.min(ally.maxHp, ally.hp + 20)
      break
    case "host":
      for (const ally of others) ally.shield += 10
      break
    case "welcome":
      if (
        new Set(
          allies.map((u) => u.cardId && TACTICAL_CARD_MAP[u.cardId].school),
        ).size >= 3
      )
        for (const ally of allies) ally.attack += 6
      break
  }
}
function resolveSpellPassives(
  state: TacticalBattleState,
  side: BattleSide,
  card: (typeof TACTICAL_CARD_MAP)[string],
) {
  const allies = state.units.filter(
    (u) => u.side === side && !u.defeated && u.cardId,
  )
  const cards = state.cardGame!.sides[side]
  for (const unit of allies) {
    const source = TACTICAL_CARD_MAP[unit.cardId!],
      ability = source.ability
    const key = `${ability}:${state.round}`
    unit.triggers ??= {}
    const limit = ability === "spellfire" || ability === "weaver" ? 2 : 1
    if ((unit.triggers[key] ?? 0) >= limit) continue
    if (ability === "spellfire") unit.attack += 6
    else if (ability === "weaver")
      [...allies].sort((a, b) => a.hp - b.hp)[0].shield += 10
    else if (ability === "relay" && source.school !== card.school) {
      const ally = allies
        .filter((u) => u !== unit)
        .sort((a, b) => a.hp - b.hp)[0]
      if (!ally) continue
      ally.attack += 6
      ally.shield += 10
    } else if (ability === "conductor" && cards.spellsThisRound === 2)
      cards.mana = Math.min(cards.maxMana, cards.mana + 1)
    else if (ability === "season-host" && card.tacticalEffect === "buff")
      drawCards(state, side, 1)
    else continue
    unit.triggers[key] = (unit.triggers[key] ?? 0) + 1
    cardLog(state, `${unit.name} cộng hưởng với Bí thuật vừa dùng.`)
  }
}
