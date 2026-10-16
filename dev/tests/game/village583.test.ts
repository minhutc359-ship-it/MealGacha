import { describe, it, expect } from "vitest"
import {
  VILLAGE_NPCS,
  VILLAGE_START,
  villagePath,
  villageTrip,
  villagePointAt,
} from "@/game/villageRpg"
describe("walkable village paths", () => {
  it("routes between houses through the crossroads rather than cutting through buildings", () => {
    const path = villagePath(VILLAGE_NPCS[0].stop, VILLAGE_NPCS[3].stop)
    expect(path.at(-1)).toEqual(VILLAGE_NPCS[3].stop)
    expect(path).toContainEqual({ x: 50, y: 45 })
    expect(path).toContainEqual({ x: 50, y: 72 })
    for (const npc of VILLAGE_NPCS)
      expect(villagePath(VILLAGE_START, npc.stop).at(-1)).toEqual(npc.stop)
  })
  it("can retarget from an interpolated mid-walk position without snapping back", () => {
    const path = villagePath(VILLAGE_START, VILLAGE_NPCS[0].stop),
      trip = villageTrip(path)
    const current = villagePointAt(path, trip.offsets, 0.43),
      reroute = villagePath(current, VILLAGE_NPCS[1].stop)
    expect(reroute[0]).toEqual(current)
    expect(reroute.at(-1)).toEqual(VILLAGE_NPCS[1].stop)
    expect(villagePointAt(path, trip.offsets, 0)).toEqual(VILLAGE_START)
    expect(villagePointAt(path, trip.offsets, 1)).toEqual(VILLAGE_NPCS[0].stop)
  })
  it("projects off-road clicks onto a finite walkable route and respects reduced motion", () => {
    const path = villagePath(VILLAGE_START, { x: -500, y: 200 })
    expect(
      path.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    ).toBe(true)
    expect(path.at(-1)!.x).toBeGreaterThanOrEqual(35)
    expect(villageTrip(path, true).duration).toBe(120)
  })
})
