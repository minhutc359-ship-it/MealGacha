import { TACTICAL_CARD_MAP } from "../cards"
import type { TacticalBattleState } from "../engine/types"

/** Reject a corrupt checkpoint instead of replacing it with a new match. */
export function validTacticalCheckpoint(
  value: unknown,
): value is TacticalBattleState {
  if (!value || typeof value !== "object") return false
  const battle = value as TacticalBattleState
  const number = (n: unknown) =>
    typeof n === "number" && Number.isFinite(n) && n >= 0
  if (
    battle.schemaVersion !== 1 ||
    typeof battle.battleId !== "string" ||
    !Number.isInteger(battle.round) ||
    battle.round < 1 ||
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
        typeof u.instanceId === "string" &&
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
    !battle.cardGame?.sides ||
    !battle.cardGame.attacks ||
    !number(battle.cardGame.nextUnit)
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
      !number(owner.spellsThisRound)
    )
      return false
    if (
      ![owner.deck, owner.hand, owner.discard].every(
        (cards) =>
          Array.isArray(cards) &&
          cards.every((id) => typeof id === "string" && TACTICAL_CARD_MAP[id]),
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
