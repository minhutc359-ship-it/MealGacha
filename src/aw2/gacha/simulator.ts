/** D11 PROPOSAL ONLY. No runtime draw/spend/save API imports this simulator. */
import {
  GACHA_BASE_RATES,
  GACHA_PROPOSAL_ID,
  GACHA_PROPOSAL_STATUS,
  TIERS,
} from "./proposal"
import { drawTier, type PityState } from "./rules"
export type { PityState } from "./rules"

export { DUPLICATE_SHARDS, TIERS, WEIGHTS } from "./proposal"
export interface SimulatedDraw {
  tier: typeof TIERS[number]
  pity: PityState
}
export function simulateDraw(before: PityState, random: number): SimulatedDraw {
  return drawTier(before, random)
}
export function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}
export function simulatePopulation(
  players = 10000,
  drawsPerPlayer = 200,
  seed = 20261021,
) {
  if (
    !Number.isSafeInteger(players) ||
    players < 1 ||
    players > 100000 ||
    !Number.isSafeInteger(drawsPerPlayer) ||
    drawsPerPlayer < 1 ||
    drawsPerPlayer > 1000
  )
    throw Error("Bounded simulation size required")
  const random = seededRandom(seed),
    counts = [0, 0, 0, 0, 0],
    firstUR: number[] = [],
    firstSSR: number[] = []
  for (let player = 0; player < players; player++) {
    let pity: PityState = { sr: 0, ssr: 0, ur: 0 },
      ur = 0,
      ssr = 0
    for (let draw = 1; draw <= drawsPerPlayer; draw++) {
      const result = simulateDraw(pity, random())
      pity = result.pity
      const index = TIERS.indexOf(result.tier)
      counts[index]++
      if (index >= 3 && !ssr) ssr = draw
      if (index === 4 && !ur) ur = draw
    }
    if (ur) firstUR.push(ur)
    if (ssr) firstSSR.push(ssr)
  }
  const summary = (values: number[]) => {
    values.sort((a, b) => a - b)
    return {
      received: values.length,
      missing: players - values.length,
      mean: values.length
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null,
      p50: values[Math.ceil(values.length * 0.5) - 1] ?? null,
      p90: values[Math.ceil(values.length * 0.9) - 1] ?? null,
      p99: values[Math.ceil(values.length * 0.99) - 1] ?? null,
      max: values.at(-1) ?? null,
    }
  }
  return {
    status: GACHA_PROPOSAL_STATUS,
    profile: GACHA_PROPOSAL_ID,
    seed,
    players,
    drawsPerPlayer,
    totalDraws: players * drawsPerPlayer,
    baseRates: GACHA_BASE_RATES,
    effectiveRates: Object.fromEntries(
      TIERS.map((tier, i) => [
        tier,
        (counts[i] / (players * drawsPerPlayer)) * 100,
      ]),
    ),
    counts: Object.fromEntries(TIERS.map((tier, i) => [tier, counts[i]])),
    firstSSRorUR: summary(firstSSR),
    firstUR: summary(firstUR),
  }
}
