import type { CombatActor, CombatBattle, CombatEvent } from "./types"

/** Provisional hybrid budget; one ultimate emphasis is chosen at construction. */
export const VAN_TUNING = {
  id: "aw2-van-development-v1",
  allyRange: 24,
  supportMultiplier: 0.55,
  supportFlat: 8,
  supportTicks: 4,
  linkTicks: 4,
  reduction: 0.1,
  memoryMultiplier: 0.25,
  memoryFlat: 4,
  memoryCooldown: 8,
  wardMultiplier: 0.8,
  wardFlat: 12,
  wardTicks: 5,
  burstMultiplier: 0.9,
  burstRadius: 8,
  burstTargets: 3,
} as const
export const vanEmphasis = (actor: CombatActor) =>
  actor.vanEmphasis ?? "protection"
export const vanShieldRoom = (actor: CombatActor) =>
  Math.max(0, Math.max(1, Math.round(actor.maxHp * 0.45)) - actor.shield)

export function vanThreats(
  battle: CombatBattle,
  source: CombatActor,
  ally: CombatActor,
) {
  const hostile = (id: string) =>
    battle.actors.some((a) => a.id === id && a.side !== source.side)
  return (
    battle.effects.filter(
      (e) =>
        e.kind === "damage" &&
        e.resolveTick >= battle.tick &&
        hostile(e.sourceId) &&
        (e.areaCenter !== undefined && e.areaRadius !== undefined
          ? Math.abs(ally.position - e.areaCenter) <= e.areaRadius
          : e.targetId === ally.id),
    ).length +
    battle.actors.filter(
      (a) =>
        a.hp > 0 &&
        a.side !== source.side &&
        ((a.cast?.targetId === ally.id && a.cast.commitTick >= battle.tick) ||
          (a.bossKit?.intent &&
            a.bossKit.intent.resolveTick >= battle.tick &&
            Math.abs(ally.position - a.bossKit.intent.areaCenter) <=
              a.bossKit.intent.areaRadius)),
    ).length
  )
}
export function vanSupportEligible(
  battle: CombatBattle,
  source: CombatActor,
  ally: CombatActor,
) {
  return (
    ally.hp > 0 &&
    ally.side === source.side &&
    !ally.summoned &&
    vanShieldRoom(ally) > 0 &&
    Math.abs(source.position - ally.position) <= VAN_TUNING.allyRange &&
    vanThreats(battle, source, ally) > 0
  )
}
export function vanAlly(battle: CombatBattle, source: CombatActor) {
  return battle.actors
    .filter((a) => vanSupportEligible(battle, source, a))
    .sort(
      (a, b) =>
        vanThreats(battle, source, b) - vanThreats(battle, source, a) ||
        a.hp / a.maxHp - b.hp / b.maxHp ||
        Math.abs(a.position - source.position) -
          Math.abs(b.position - source.position) ||
        a.slot - b.slot ||
        a.id.localeCompare(b.id),
    )[0]
}
export function vanEnemy(
  battle: CombatBattle,
  source: CombatActor,
  anchor = source,
) {
  return battle.actors
    .filter(
      (a) =>
        a.hp > 0 &&
        a.side !== source.side &&
        !a.debuffImmune &&
        Math.abs(a.position - source.position) <= source.range,
    )
    .sort(
      (a, b) =>
        Math.abs(a.position - anchor.position) -
          Math.abs(b.position - anchor.position) ||
        a.slot - b.slot ||
        a.id.localeCompare(b.id),
    )[0]
}
export function vanDamageMultiplier(
  battle: CombatBattle,
  attacker: CombatActor,
) {
  return battle.actors.some(
    (a) =>
      a.spiritId === "aw2-van" &&
      a.hp > 0 &&
      a.side !== attacker.side &&
      a.vanLink?.enemyId === attacker.id &&
      a.vanLink.endsAtTick > battle.tick,
  )
    ? 1 - VAN_TUNING.reduction
    : 1
}
export function isVanConfirmedOutcome(event: CombatEvent) {
  return (
    event.skillId?.startsWith("aw2-van:skill:") &&
    (event.kind === "hit" ||
      (["shield", "heal"].includes(event.kind) && (event.amount ?? 0) > 0) ||
      (event.statusEffect === "van-link" && event.statusChange === "apply"))
  )
}
