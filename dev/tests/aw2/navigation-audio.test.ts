import { expect, it } from "vitest"
import { findWorldPath, clearPath } from "@/aw2/world/navigation"
import { ZONE_IDS } from "@/aw2/world/ids"
import { combatAudioCues } from "@/aw2/combat/audio"
import type { CombatEvent } from "@/aw2/combat/types"

it("finds collision-safe touch paths across all zones without wall/corner clipping", () => {
  for (const zone of ZONE_IDS) {
    const start = { x: 240, y: 336 },
      end = { x: 400, y: 336 }
    expect(clearPath(zone, start, end)).toBe(false)
    const path = findWorldPath(zone, start, end)
    expect(path.length).toBeGreaterThan(1)
    expect(path.at(-1)).toEqual(end)
    let last = start
    for (const point of path) {
      expect(clearPath(zone, last, point)).toBe(true)
      last = point
    }
    expect(findWorldPath(zone, start, { x: 310, y: 330 })).toEqual([])
    expect(findWorldPath(zone, start, { x: 0, y: 0 })).toEqual([])
  }
})
it("direct touch routes retain exact valid endpoints and reject non-finite inputs", () => {
  for (const coordinate of [NaN, Infinity, -Infinity]) {
    expect(
      clearPath(ZONE_IDS[0], { x: 96, y: 192 }, { x: coordinate, y: 240 }),
    ).toBe(false)
    expect(
      clearPath(ZONE_IDS[0], { x: coordinate, y: 192 }, { x: 96, y: 240 }),
    ).toBe(false)
  }
  expect(
    findWorldPath(ZONE_IDS[0], { x: 96, y: 192 }, { x: 160.5, y: 240 }),
  ).toEqual([{ x: 160.5, y: 240 }])
  expect(
    findWorldPath(ZONE_IDS[0], { x: 96, y: 192 }, { x: NaN, y: 240 }),
  ).toEqual([])
})
it("audio plays only new authoritative cues and deduplicates multi-target passive events", () => {
  const event = (
    serial: number,
    kind: CombatEvent["kind"],
    skillId = "aw2-than:skill:basic",
  ): CombatEvent => ({
    serial,
    kind,
    skillId,
    tick: 1,
    sourceId: "than",
    targetIds: [],
  })
  const events = [
    event(1, "cast-start"),
    event(2, "cast-commit"),
    event(3, "hit"),
    event(4, "shield", "aw2-lam:skill:passive"),
    event(5, "shield", "aw2-lam:skill:passive"),
    event(6, "cast-commit", "aw2-enemy:skill:basic"),
  ]
  expect(combatAudioCues(events, 0).map((c) => c.serial)).toEqual([2, 4])
  expect(combatAudioCues(events, 6)).toEqual([])
})
