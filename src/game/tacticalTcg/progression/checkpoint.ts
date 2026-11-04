import { TACTICAL_CARD_MAP } from "../cards"
import type { TacticalBattleState } from "../engine/types"
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v)
const amount = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0
const integer = (v: unknown): v is number => amount(v) && Number.isInteger(v)
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === "string")
const nullableString = (v: unknown) => v === null || typeof v === "string"
const cardExists = (v: unknown) =>
  typeof v === "string" &&
  Object.prototype.hasOwnProperty.call(TACTICAL_CARD_MAP, v)

/** Reject a corrupt checkpoint instead of replacing it with a new match. */
export function validTacticalCheckpoint(
  value: unknown,
): value is TacticalBattleState {
  if (!record(value)) return false
  const battle = value as unknown as TacticalBattleState
  const number = (n: unknown) =>
    typeof n === "number" && Number.isFinite(n) && n >= 0
  if (
    battle.schemaVersion !== 1 ||
    typeof battle.battleId !== "string" ||
    !Number.isInteger(battle.round) ||
    battle.round < 1 ||
    !integer(battle.seed) ||
    !nullableString(battle.nodeId) ||
    !nullableString(battle.lastReaction) ||
    ![null, "player", "enemy"].includes(battle.winner) ||
    (battle.phase === "result") !== (battle.winner !== null) ||
    !["campaign", "pvp"].includes(battle.mode) ||
    ![
      "planning",
      "clash",
      "reaction",
      "ultimate",
      "round-end",
      "result",
    ].includes(battle.phase)
  )
    return false
  if (
    !Array.isArray(battle.processedActionIds) ||
    !battle.processedActionIds.every((id) => typeof id === "string") ||
    !Array.isArray(battle.log) ||
    !battle.log.every(
      (e) => typeof e?.id === "string" && typeof e.text === "string",
    ) ||
    !Array.isArray(battle.traps)
  )
    return false
  if (
    !Array.isArray(battle.units) ||
    !battle.units.every(
      (u) =>
        record(u) &&
        typeof u.instanceId === "string" &&
        typeof u.id === "string" &&
        typeof u.name === "string" &&
        typeof u.art === "string" &&
        ["guardian", "striker", "support", "mage"].includes(u.role) &&
        strings(u.traits) &&
        [1, 2, 3].includes(u.star) &&
        number(u.ultimatePower) &&
        (u.cardId === undefined || cardExists(u.cardId)) &&
        (u.triggers === undefined ||
          (record(u.triggers) && Object.values(u.triggers).every(integer))) &&
        ["player", "enemy"].includes(u.side) &&
        u.cell &&
        [0, 1].includes(u.cell.row) &&
        [0, 1, 2, 3].includes(u.cell.column) &&
        number(u.hp) &&
        number(u.maxHp) &&
        u.hp <= u.maxHp &&
        number(u.attack) &&
        number(u.shield) &&
        number(u.energy) &&
        u.energy <= 100 &&
        typeof u.defeated === "boolean",
    )
  )
    return false
  if (
    new Set(battle.units.map((u) => u.instanceId)).size !== battle.units.length
  )
    return false
  if (
    !battle.traps.every(
      (t) =>
        record(t) &&
        typeof t.instanceId === "string" &&
        ["bamboo-guard", "steam-counter", "warm-broth"].includes(t.trapId) &&
        ["player", "enemy"].includes(t.side) &&
        [0, 1, 2, 3].includes(t.column) &&
        typeof t.armed === "boolean" &&
        (t.triggeredRound === null || integer(t.triggeredRound)) &&
        (t.cardId === undefined ||
          (cardExists(t.cardId) &&
            TACTICAL_CARD_MAP[t.cardId].kind === "trap")),
    )
  )
    return false
  if (
    battle.boss !== null &&
    (!record(battle.boss) ||
      typeof battle.boss.title !== "string" ||
      ![1, 2, 3].includes(battle.boss.phase) ||
      !battle.units.some((u) => u.instanceId === battle.boss!.unitId))
  )
    return false
  if (
    battle.reward !== null &&
    (!record(battle.reward) ||
      typeof battle.reward.id !== "string" ||
      battle.reward.battleId !== battle.battleId ||
      !nullableString(battle.reward.nodeId) ||
      !amount(battle.reward.tinhVi) ||
      !record(battle.reward.cardCopies) ||
      !Object.values(battle.reward.cardCopies).every(integer))
  )
    return false
  if (
    !battle.cardGame?.sides ||
    !battle.cardGame.attacks ||
    !integer(battle.cardGame.nextUnit) ||
    !record(battle.cardGame.attacks) ||
    !Object.values(battle.cardGame.attacks).every(integer) ||
    !cardExists(battle.cardGame.rewardCardId) ||
    !(
      battle.cardGame.movedRound === null || integer(battle.cardGame.movedRound)
    )
  )
    return false
  for (const side of ["player", "enemy"] as const) {
    const owner = battle.cardGame.sides[side],
      commander = battle.commanders?.[side]
    if (
      !owner ||
      !commander ||
      !number(commander.hp) ||
      !number(commander.maxHp) ||
      commander.hp > commander.maxHp ||
      !number(owner.mana) ||
      !number(owner.maxMana) ||
      owner.mana > owner.maxMana ||
      owner.maxMana > 10 ||
      !number(owner.fatigue) ||
      !integer(owner.spellsThisRound) ||
      typeof owner.mulliganUsed !== "boolean" ||
      !nullableString(owner.lastSchool) ||
      !integer(owner.recipeRound)
    )
      return false
    if (
      ![owner.deck, owner.hand, owner.discard].every(
        (cards) => Array.isArray(cards) && cards.every(cardExists),
      ) ||
      owner.hand.length > 8
    )
      return false
    const living = battle.units.filter((u) => u.side === side && !u.defeated)
    if (
      living.length > 5 ||
      new Set(living.map((u) => `${u.cell.row}:${u.cell.column}`)).size !==
        living.length
    )
      return false
  }
  return true
}
