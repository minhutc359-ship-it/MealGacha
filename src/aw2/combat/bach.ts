import type { CombatActor, CombatBattle, CombatEvent } from "./types"

/** Provisional development tuning for the approved Tank, not final balance. */
export const BACH_TUNING = {
  id: "aw2-bach-development-v1",
  basicWindup: 1,
  shellRatio: 0.25,
  shellTicks: 5,
  absorptionRatio: 0.12,
  shareRatio: 0.08,
  shareRadius: 16,
  shareTicks: 4,
  shareCooldown: 8,
  wardTicks: 5,
  impactRange: 12,
  impactMultiplier: 0.8,
  impactTargets: 3,
} as const

export const bachThreshold = (source: CombatActor) =>
  Math.max(1, Math.round(source.maxHp * BACH_TUNING.absorptionRatio))
export const ordinaryShieldCap = (target: CombatActor) =>
  Math.max(1, Math.round(target.maxHp * 0.45))

export function bachAllies(battle: CombatBattle, source: CombatActor) {
  return battle.actors.filter(
    (a) =>
      a.hp > 0 &&
      a.id !== source.id &&
      a.side === source.side &&
      !a.summoned &&
      Math.abs(a.position - source.position) <= BACH_TUNING.shareRadius,
  )
}
export function bachShareTarget(battle: CombatBattle, source: CombatActor) {
  return bachAllies(battle, source)
    .filter((a) => a.shield < ordinaryShieldCap(a))
    .sort(
      (a, b) =>
        Math.abs(a.position - source.position) -
          Math.abs(b.position - source.position) ||
        a.hp / a.maxHp - b.hp / b.maxHp ||
        a.slot - b.slot ||
        a.id.localeCompare(b.id),
    )[0]
}
export function bachFront(
  battle: CombatBattle,
  source: CombatActor,
  facing: 1 | -1,
) {
  return battle.actors
    .filter(
      (a) =>
        a.hp > 0 &&
        a.side !== source.side &&
        (a.position - source.position) * facing >= 0 &&
        Math.abs(a.position - source.position) <= BACH_TUNING.impactRange,
    )
    .sort(
      (a, b) =>
        Math.abs(a.position - source.position) -
          Math.abs(b.position - source.position) ||
        a.slot - b.slot ||
        a.id.localeCompare(b.id),
    )
    .slice(0, BACH_TUNING.impactTargets)
}
export function isBachConfirmedOutcome(event: CombatEvent) {
  return (
    event.skillId?.startsWith("aw2-bach:skill:") &&
    (event.kind === "hit" ||
      (event.kind === "shield" && (event.amount ?? 0) > 0))
  )
}
