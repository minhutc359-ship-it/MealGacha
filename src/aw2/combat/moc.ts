import type { CombatActor, CombatBattle, CombatEvent } from "./types"

/** Provisional development contract; Mộc is distinct from Mộc Non. */
export const MOC_TUNING = {
  id: "aw2-moc-development-v1",
  markRadius: 6,
  armTicks: 3,
  markTicks: 6,
  markMultiplier: 0.9,
  newPositionDistance: 4,
  passiveShieldRatio: 0.12,
  passiveShieldTicks: 3,
  passiveCooldown: 8,
  burstDelay: 2,
  burstRadius: 10,
  burstMultiplier: 1.3,
  markedBurstMultiplier: 1.8,
} as const

export function mocEnemy(battle: CombatBattle, source: CombatActor) {
  return battle.actors
    .filter(
      (a) =>
        a.hp > 0 &&
        a.side !== source.side &&
        Math.abs(a.position - source.position) <= source.range,
    )
    .sort(
      (a, b) =>
        Math.abs(a.position - source.position) -
          Math.abs(b.position - source.position) ||
        a.slot - b.slot ||
        a.id.localeCompare(b.id),
    )[0]
}

export function mocOccupants(
  battle: CombatBattle,
  source: CombatActor,
  center: number,
  radius: number,
) {
  return battle.actors
    .filter(
      (a) =>
        a.hp > 0 &&
        a.side !== source.side &&
        Math.abs(a.position - center) <= radius,
    )
    .sort((a, b) => a.slot - b.slot || a.id.localeCompare(b.id))
}

export function isMocConfirmedOutcome(event: CombatEvent) {
  return (
    event.skillId?.startsWith("aw2-moc:skill:") &&
    (event.kind === "hit" ||
      (event.kind === "shield" && (event.amount ?? 0) > 0))
  )
}
