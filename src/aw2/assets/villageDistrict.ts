import { ROOMS } from "../world/interiorLayout"
import type { Waypoint } from "../world/navigation"

/** Functional town layout; ground paths and facades share actual entrance anchors. */
export const VILLAGE_DISTRICT = {
  landscape: { x: -160, y: -192, width: 960, height: 640 },
  camera: { followZoom: 1.05, overviewZoom: 0.68, centerX: 320, centerY: 100 },
  // Original project courtyard brick, sampled at runtime only; no new/edit raster.
  pavingFrame: { x: 620, y: 410, width: 192, height: 128 },
  paths: [
    { x: 16, y: 160, width: 608, height: 64 },
    { x: 48, y: 48, width: 504, height: 64 },
    ...ROOMS.map((room) => ({
      x: room.entrance.x - 24,
      y: 4,
      width: 48,
      height: 188,
    })),
    { x: 128, y: 112, width: 64, height: 176 },
    { x: 104, y: 208, width: 128, height: 80 },
    { x: 232, y: 240, width: 112, height: 48 },
    { x: 264, y: 264, width: 112, height: 112 },
  ],
} as const

/** Selecting a visible facade walks to its own door, never to an unreachable roof. */
export function villageFacadeTarget(point: Waypoint): Waypoint {
  const room = ROOMS.find(
    (room) =>
      Math.abs(point.x - room.entrance.x) <= 92 &&
      point.y >= -172 &&
      point.y <= 16,
  )
  return room ? { ...room.approach } : point
}
