import { describe, it, expect } from "vitest"
import { ADVENTURE_MAPS, ADVENTURE_MAP_BY_ID } from "@/game/adventureWorld"
import { newAdventure } from "@/game/adventure"
import {
  AdventureStepper,
  WorldMotion,
  worldView,
  tileAt,
  RUN_STEP_MS,
  WALK_STEP_MS,
} from "@/game/adventurePresentation"
describe("Adventure control clock", () => {
  it("continues without operating-system key repeats and never catches up a backlog", () => {
    const input = new AdventureStepper()
    expect(input.press("key:right", "right", 0, WALK_STEP_MS)).toBe("right")
    expect(input.press("key:right", "right", 80, WALK_STEP_MS)).toBeNull()
    expect(input.tick(169, WALK_STEP_MS)).toBeNull()
    expect(input.tick(170, WALK_STEP_MS)).toBe("right")
    expect(input.tick(1400, WALK_STEP_MS)).toBe("right")
    expect(input.tick(1400, WALK_STEP_MS)).toBeNull()
    expect(input.delay(1400)).toBe(WALK_STEP_MS)
  })
  it("uses the latest held direction and releases each source independently", () => {
    const input = new AdventureStepper()
    input.press("key:right", "right", 0, WALK_STEP_MS)
    input.press("pointer:1", "up", 10, WALK_STEP_MS)
    expect(input.tick(170, WALK_STEP_MS)).toBe("up")
    input.release("pointer:1")
    expect(input.tick(340, WALK_STEP_MS)).toBe("right")
    input.release("key:right")
    expect(input.active).toBe(false)
    expect(input.tick(1000, WALK_STEP_MS)).toBeNull()
  })
  it("clears held input when a menu or hidden tab blocks movement", () => {
    const input = new AdventureStepper()
    input.press("key:down", "down", 0, WALK_STEP_MS)
    input.clear()
    expect(input.tick(1000, RUN_STEP_MS)).toBeNull()
    expect(input.press("new", "left", 10, RUN_STEP_MS)).toBe("left")
    expect(input.tick(110, RUN_STEP_MS)).toBe("left")
  })
})
describe("Adventure camera and interpolation", () => {
  it("interpolates player and follower independently without altering a save", () => {
    const save = { ...newAdventure(), follower: { x: 1, y: 14 } },
      snapshot = structuredClone(save),
      motion = new WorldMotion(save)
    motion.update({ ...save, x: 3, follower: { x: 2, y: 14 } }, 100, 170)
    expect(motion.at(185).player).toEqual({ x: 2.5, y: 14 })
    expect(motion.at(185).follower).toEqual({ x: 1.5, y: 14 })
    expect(motion.at(270).moving).toBe(false)
    expect(save).toEqual(snapshot)
  })
  it("snaps map transitions, travel and reduced motion without sliding through walls", () => {
    const save = newAdventure(),
      motion = new WorldMotion(save)
    motion.update({ ...save, x: 3 }, 0, 100)
    expect(motion.at(50, true).player.x).toBe(3)
    motion.update(
      { ...save, mapId: "lantern-quarter:clinic", x: 5, y: 7, follower: null },
      70,
    )
    expect(motion.at(70).player).toEqual({ x: 5, y: 7 })
    expect(motion.at(70).follower).toBeNull()
    motion.update({ ...save, mapId: "lantern-quarter:clinic", x: 10, y: 8 }, 80)
    expect(motion.at(80).moving).toBe(false)
  })
  it("keeps the camera in map bounds and converts taps at visible tiles for all 20 maps", () => {
    for (const map of ADVENTURE_MAPS)
      for (const [width, height] of [
        [1440, 650],
        [390, 580],
        [320, 320],
        [680, 210],
      ])
        for (const point of [
          map.spawn,
          { x: map.grid[0].length - 2, y: map.grid.length - 2 },
        ]) {
          const view = worldView(map, point, width, height),
            w = map.grid[0].length * view.tile,
            h = map.grid.length * view.tile
          if (w >= width) {
            expect(view.x).toBeLessThanOrEqual(0)
            expect(view.x).toBeGreaterThanOrEqual(width - w - 1e-8)
          } else expect(view.x).toBeCloseTo((width - w) / 2)
          if (h >= height) {
            expect(view.y).toBeLessThanOrEqual(0)
            expect(view.y).toBeGreaterThanOrEqual(height - h - 1e-8)
          } else expect(view.y).toBeCloseTo((height - h) / 2)
          expect(
            tileAt(
              view,
              view.x + (point.x + 0.5) * view.tile,
              view.y + (point.y + 0.5) * view.tile,
            ),
          ).toEqual(point)
        }
  })
  it("does not ease at the edge beyond the world's extent", () => {
    const map = ADVENTURE_MAP_BY_ID["lantern-quarter"]
    const a = worldView(map, { x: 2, y: 14 }, 390, 580),
      b = worldView(map, { x: 2.5, y: 14 }, 390, 580)
    expect(a.x).toBe(b.x)
    expect(Number.isFinite(a.x + a.y + a.tile)).toBe(true)
  })
})
