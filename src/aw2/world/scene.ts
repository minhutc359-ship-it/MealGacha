import type { WorldProgress } from "./model"
import type { ZoneId } from "./ids"
import { canStand, zoneById, type WorldObject } from "./maps"
import {
  ROOM_IDS,
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
