import { expect, it } from "vitest"
import {
  simulateDraw,
  simulatePopulation,
  seededRandom,
} from "@/aw2/gacha/simulator"
const fresh = { sr: 0, ssr: 0, ur: 0 }
it("implements exact 10,000-weight interval boundaries", () => {
  for (const [sample, tier] of [
    [0, "N"],
    [0.549999, "N"],
    [0.55, "R"],
    [0.85, "SR"],
    [0.96, "SSR"],
    [0.995, "UR"],
    [0.999999, "UR"],
  ] as const)
    expect(simulateDraw(fresh, sample).tier).toBe(tier)
  for (const sample of [-1, 1, NaN, Infinity])
    expect(() => simulateDraw(fresh, sample)).toThrow()
})
it("forces the highest due pity and resets only thresholds satisfied by the result", () => {
  expect(simulateDraw({ sr: 9, ssr: 3, ur: 4 }, 0)).toEqual({
    tier: "SR",
    pity: { sr: 0, ssr: 4, ur: 5 },
  })
  expect(simulateDraw({ sr: 9, ssr: 79, ur: 12 }, 0)).toEqual({
    tier: "SSR",
    pity: { sr: 0, ssr: 0, ur: 13 },
  })
  expect(simulateDraw({ sr: 9, ssr: 79, ur: 199 }, 0)).toEqual({
    tier: "UR",
    pity: fresh,
  })
  expect(simulateDraw(fresh, 0.999).pity).toEqual(fresh)
  expect(() => simulateDraw({ sr: 10, ssr: 0, ur: 0 }, 0)).toThrow()
})
it("carries counters over serialized sessions exactly like uninterrupted draws", () => {
  const random = seededRandom(99)
  let a = fresh,
    b = fresh
  for (let i = 0; i < 1000; i++) {
    const sample = random()
    a = simulateDraw(a, sample).pity
    b = simulateDraw(JSON.parse(JSON.stringify(b)), sample).pity
    expect(a).toEqual(b)
  }
})
it("is reproducible with non-guaranteed samples and meets hard caps for every player", () => {
  const a = simulatePopulation(300, 200, 42)
  expect(a).toEqual(simulatePopulation(300, 200, 42))
  expect(a).not.toEqual(simulatePopulation(300, 200, 43))
  expect(a.firstSSRorUR.missing).toBe(0)
  expect(a.firstSSRorUR.max).toBeLessThanOrEqual(80)
  expect(a.firstUR.missing).toBe(0)
  expect(a.firstUR.max).toBeLessThanOrEqual(200)
  expect(Object.values(a.counts).reduce((x, y) => x + y, 0)).toBe(60000)
})
