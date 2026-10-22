import type { CombatActor, CombatBattle, NhienSequence } from "./types"

/** Provisional development tuning, not owner-approved final balance. */
export const NHIEN_TUNING = {
  id: "aw2-nhien-development-v1",
  basicMultipliers: [0.6, 0.6],
  autoMultipliers: [0.85],
  ultimateMultipliers: [0.75, 0.75, 0.75],
  basicWindupTicks: 1,
  recoveryTicks: 2,
  maxSweepTargets: 3,
  rhythmWindowTicks: 6,
  rhythmCooldownTicks: 8,
  rhythmEnergy: 8,
  maxRhythmProcs: 3,
  maxRhythmEnergy: 24,
} as const

export function nhienMultipliers(slot: NhienSequence["slot"]) {
  return slot === "basic"
    ? NHIEN_TUNING.basicMultipliers
    : slot === "auto"
      ? NHIEN_TUNING.autoMultipliers
      : NHIEN_TUNING.ultimateMultipliers
}

export function nhienBusy(actor: CombatActor, tick: number) {
  return (
    actor.spiritId === "aw2-nhien" &&
    !!(
      actor.cast ||
      actor.nhienSequence ||
      (actor.nhienRecoveryUntilTick ?? 0) > tick
    )
  )
}

export function nhienFacing(source: CombatActor, target: CombatActor): 1 | -1 {
  return target.position === source.position
    ? source.side === "player"
      ? 1
      : -1
    : target.position > source.position
      ? 1
      : -1
}

export function nhienTargets(
  battle: CombatBattle,
  source: CombatActor,
  facing?: 1 | -1,
) {
  return battle.actors
    .filter(
      (target) =>
        target.hp > 0 &&
        target.side !== source.side &&
        Math.abs(target.position - source.position) <= source.range &&
        (facing === undefined ||
          (target.position - source.position) * facing >= 0),
    )
    .sort(
      (a, b) =>
        Math.abs(a.position - source.position) -
          Math.abs(b.position - source.position) ||
        a.hp / a.maxHp - b.hp / b.maxHp ||
        a.slot - b.slot ||
        a.id.localeCompare(b.id),
    )
}

/** Called only for real positive HP/ordinary-shield contacts by a living source. */
export function grantNhienRhythm(
  source: CombatActor,
  target: CombatActor,
  tick: number,
) {
  if (source.spiritId !== "aw2-nhien" || source.hp <= 0 || target.summoned)
    return 0
  const state = (source.nhienRhythm ??= {
    windowStartTick: tick,
    targetIds: [],
    nextProcTick: 0,
    procs: 0,
    energyGranted: 0,
  })
  if (state.procs >= NHIEN_TUNING.maxRhythmProcs || tick < state.nextProcTick)
    return 0
  if (tick >= state.windowStartTick + NHIEN_TUNING.rhythmWindowTicks) {
    state.targetIds = []
    state.windowStartTick = tick
  }
  if (state.targetIds.includes(target.id)) return 0
  if (!state.targetIds.length) state.windowStartTick = tick
  state.targetIds.push(target.id)
  if (state.targetIds.length < 2) return 0
  state.targetIds = []
  state.nextProcTick = tick + NHIEN_TUNING.rhythmCooldownTicks
  const gained = Math.max(
    0,
    Math.min(
      NHIEN_TUNING.rhythmEnergy,
      100 - source.energy,
      NHIEN_TUNING.maxRhythmEnergy - state.energyGranted,
    ),
  )
  if (gained > 0) {
    source.energy += gained
    state.procs++
    state.energyGranted += gained
  }
  return gained
}
