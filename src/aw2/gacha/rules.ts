import { PITY_LIMITS, TIERS, WEIGHTS } from "./proposal"
export interface PityState {
  sr: number
  ssr: number
  ur: number
}
export function drawTier(before: PityState, random: number) {
  if (!Number.isFinite(random) || random < 0 || random >= 1)
    throw Error("Random sample must be in [0, 1).")
  if (
    ![before.sr, before.ssr, before.ur].every(Number.isInteger) ||
    before.sr < 0 ||
    before.sr >= PITY_LIMITS.sr ||
    before.ssr < 0 ||
    before.ssr >= PITY_LIMITS.ssr ||
    before.ur < 0 ||
    before.ur >= PITY_LIMITS.ur
  )
    throw Error("Invalid pity counters")
  const floor =
    before.ur === PITY_LIMITS.ur - 1
      ? 4
      : before.ssr === PITY_LIMITS.ssr - 1
        ? 3
        : before.sr === PITY_LIMITS.sr - 1
          ? 2
          : 0
  let value =
      random * WEIGHTS.slice(floor).reduce((sum, weight) => sum + weight, 0),
    index = floor
  for (; index < 4; index++) {
    value -= WEIGHTS[index]
    if (value < 0) break
  }
  return {
    tier: TIERS[index],
    pity: {
      sr: index >= 2 ? 0 : before.sr + 1,
      ssr: index >= 3 ? 0 : before.ssr + 1,
      ur: index === 4 ? 0 : before.ur + 1,
    },
  }
}
