import { VILLAGE_DISTRICT } from "./villageDistrict"
import { STREET_ROOMS } from "../world/interiorLayout"
import type { Waypoint } from "../world/navigation"
export const STREET_DISTRICT = {
  ...VILLAGE_DISTRICT,
  paths: [
    { x: 16, y: 160, width: 608, height: 64 },
    { x: 48, y: 48, width: 504, height: 64 },
    ...STREET_ROOMS.map((room) => ({
      x: room.entrance.x - 24,
      y: 4,
      width: 48,
      height: 188,
    })),
    { x: 128, y: 112, width: 64, height: 112 },
    { x: 480, y: 112, width: 88, height: 112 },
    { x: 264, y: 224, width: 112, height: 152 },
  ],
} as const
export function streetFacadeTarget(point: Waypoint): Waypoint {
  const room = STREET_ROOMS.find(
    (room) =>
      Math.abs(point.x - room.entrance.x) <= 92 &&
      point.y >= -172 &&
      point.y <= 16,
  )
  return room ? { ...room.approach } : point
}
