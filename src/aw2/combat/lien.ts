import type { CombatActor, CombatBattle, CombatEvent } from "./types"

/** Development tuning only; schedules and cooldowns never enter saved ownership. */
export const LIEN_TUNING = {
  id: "aw2-lien-development-v1",
  hotPulses: 3,
  pulseInterval: 2,
  hotMultiplier: 0.55,
  hotFlat: 6,
  ultimateMultipliers: [0.9, 0.7],
  ultimateFlats: [8, 6],
  guardTicks: 4,
  guardCooldown: 8,
} as const

export function selectLienAlly(
  battle: CombatBattle,
  source: CombatActor,
  preferredId?: string | null,
) {
  const eligible = battle.actors.filter(
    (a) => a.side === source.side && a.hp > 0 && a.hp < a.maxHp,
  )
  return (
    eligible.find((a) => a.id === preferredId) ??
    eligible.sort(
      (a, b) =>
        a.hp / a.maxHp - b.hp / b.maxHp ||
        Math.abs(a.position - source.position) -
          Math.abs(b.position - source.position) ||
        a.slot - b.slot ||
        a.id.localeCompare(b.id),
    )[0]
  )
}

export function lienDebuff(target: CombatActor, tick: number) {
  const mark = Object.entries(target.muoiMarks ?? {})
    .filter(([, m]) => m.expiresAtTick > tick)
    .sort(
      ([a, x], [b, y]) =>
        x.expiresAtTick - y.expiresAtTick || a.localeCompare(b),
    )[0]
  if (mark) return { kind: "muoi-mark" as const, sourceId: mark[0] }
  if (target.slowUntilTick > tick) return { kind: "slow" as const }
  if (target.weakenUntilTick > tick) return { kind: "weaken" as const }
  return null
}

/** Only one whitelisted instance. Never touches protection, casts or boss state. */
export function cleanseLienDebuff(target: CombatActor, tick: number) {
  const chosen = lienDebuff(target, tick)
  if (!chosen) return null
  if (chosen.kind === "muoi-mark") {
    delete target.muoiMarks![chosen.sourceId!]
    if (!Object.keys(target.muoiMarks!).length) delete target.muoiMarks
  } else if (chosen.kind === "slow") target.slowUntilTick = 0
  else target.weakenUntilTick = 0
  return chosen
}

export function isLienConfirmedOutcome(event: CombatEvent) {
  const slot = event.skillId?.split(":").at(-1)
  return (
    (slot === "basic" && event.kind === "hit") ||
    (["auto", "ultimate"].includes(slot ?? "") &&
      event.kind === "heal" &&
      (event.amount ?? 0) > 0) ||
    (event.statusEffect === "lien-guard" && event.statusChange === "apply") ||
    (event.statusEffect === "lien-cleanse" && event.statusChange === "dispel")
  )
}
