import type { CombatActor, CombatBattle } from "./types"

/** Provisional AW2-007E tuning, not approved final balance. */
export const MUOI_TUNING = {
  id: "aw2-muoi-development-v1",
  reduction: 0.2,
  durationTicks: 6,
  maxLifetimeTicks: 10,
  refreshTicks: 1,
  shieldRemovalFraction: 0.5,
  ultimateMultiplier: 1.3,
} as const

export function selectMuoiTarget(battle: CombatBattle, source: CombatActor) {
  return battle.actors
    .filter(
      (target) =>
        target.hp > 0 &&
        target.side !== source.side &&
        !target.debuffImmune &&
        Math.abs(target.position - source.position) <= source.range,
    )
    .sort(
      (a, b) =>
        (b.damageDealt ?? 0) - (a.damageDealt ?? 0) ||
        a.slot - b.slot ||
        a.id.localeCompare(b.id),
    )[0]
}

export function muoiDamageMultiplier(actor: CombatActor, tick: number) {
  return Object.values(actor.muoiMarks ?? {}).some(
    (mark) => mark.expiresAtTick > tick,
  )
    ? 1 - MUOI_TUNING.reduction
    : 1
}
