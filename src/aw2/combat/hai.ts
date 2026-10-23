import type { CombatActor, CombatBattle } from "./types"

/** Provisional development numbers, not final balance. Fields are battle-local. */
export const HAI_TUNING = {
  id: "aw2-hai-development-v1",
  zoneReach: 8,
  zoneRadius: 4,
  zoneTicks: 4,
  slowTicks: 2,
  allyRadius: 12,
  lowHpRatio: 0.35,
  passiveShieldRatio: 0.2,
  passiveShieldTicks: 4,
  passiveCooldown: 10,
  lineOffset: 2,
  lineDepth: 14,
  lineTicks: 6,
  lineCapacityRatio: 0.35,
  blockFraction: 0.5,
} as const

export function haiNearbyEnemy(battle: CombatBattle, source: CombatActor) {
  return battle.actors
    .filter(
      (a) =>
        a.hp > 0 &&
        a.side !== source.side &&
        Math.abs(a.position - source.position) <= HAI_TUNING.zoneReach,
    )
    .sort(
      (a, b) =>
        Math.abs(a.position - source.position) -
          Math.abs(b.position - source.position) ||
        a.slot - b.slot ||
        a.id.localeCompare(b.id),
    )[0]
}

export function haiNeedsShield(battle: CombatBattle, source: CombatActor) {
  return (
    source.spiritId === "aw2-hai" &&
    source.hp > 0 &&
    source.shield === 0 &&
    battle.tick >= (source.haiPassiveUntilTick ?? 0) &&
    battle.actors.some(
      (a) =>
        a.id !== source.id &&
        a.side === source.side &&
        !a.summoned &&
        a.hp > 0 &&
        a.hp / a.maxHp <= HAI_TUNING.lowHpRatio &&
        Math.abs(a.position - source.position) <= HAI_TUNING.allyRadius,
    )
  )
}

/** Select one oldest eligible line. Never stack reductions; use impact positions. */
export function absorbHaiLine(
  battle: CombatBattle,
  attacker: CombatActor,
  target: CombatActor,
  amount: number,
) {
  const protector = battle.actors
    .filter((a) => {
      const line = a.haiLine
      if (
        a.spiritId !== "aw2-hai" ||
        a.hp <= 0 ||
        a.side !== target.side ||
        attacker.side === target.side ||
        !line ||
        line.remaining <= 0 ||
        line.expiresAtTick <= battle.tick
      )
        return false
      const behind = (line.position - target.position) * line.facing
      return (
        behind >= 0 &&
        behind <= HAI_TUNING.lineDepth &&
        (attacker.position - line.position) * line.facing >= 0
      )
    })
    .sort(
      (a, b) =>
        a.haiLine!.createdTick - b.haiLine!.createdTick ||
        a.id.localeCompare(b.id),
    )[0]
  if (!protector) return null
  const blocked = Math.min(
    protector.haiLine!.remaining,
    Math.floor(amount * HAI_TUNING.blockFraction),
  )
  if (blocked <= 0) return null
  protector.haiLine!.remaining -= blocked
  if (protector.haiLine!.remaining === 0) delete protector.haiLine
  return { protector, blocked }
}
