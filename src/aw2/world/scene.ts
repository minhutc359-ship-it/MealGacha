import type { WorldProgress } from "./model"
import type { ZoneId } from "./ids"
import { canStand, ZONES, zoneById, type WorldObject } from "./maps"
import {
  ROOM_IDS,
  ROOMS,
  roomById,
  canStandInRoom,
  type RoomId,
} from "./interiorLayout"

export type SceneId = ZoneId | RoomId
export const sceneId = (world: WorldProgress): SceneId =>
  world.interior?.roomId ?? world.zoneId
export const scenePosition = (world: WorldProgress) => world.interior ?? world
export const sceneName = (world: WorldProgress) =>
  world.interior
    ? roomById(world.interior.roomId).name
    : zoneById(world.zoneId).name
export const sceneObjects = (world: WorldProgress): readonly WorldObject[] =>
  world.interior
    ? roomById(world.interior.roomId).objects
    : zoneById(world.zoneId).objects
export const canStandInScene = (id: SceneId, x: number, y: number) =>
  (ROOM_IDS as readonly string[]).includes(id)
    ? canStandInRoom(id, x, y)
    : canStand(id as ZoneId, x, y)

/** Stable entity lookup across all outdoor maps and optional child rooms. */
export function entityLocation(id: string) {
  for (const zone of ZONES) {
    const object = zone.objects.find((o) => o.id === id)
    if (object) return { zoneId: zone.id, roomId: null, object }
  }
  for (const room of ROOMS) {
    const object = room.objects.find((o) => o.id === id)
    if (object) return { zoneId: room.zoneId, roomId: room.id, object }
  }
}
export function objectsInScene(id: string): readonly WorldObject[] {
  const room = ROOMS.find((room) => room.id === id)
  return room ? room.objects : zoneById(id as ZoneId).objects
}
