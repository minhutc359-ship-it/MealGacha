import type { WorldProgress } from "./model"
import type { ZoneId } from "./ids"
import { canStand, zoneById, type WorldObject } from "./maps"
import { TEA_ROOM, TEA_ROOM_ID, canStandInTeaRoom } from "./interiorLayout"

export type SceneId = ZoneId | typeof TEA_ROOM_ID
export const sceneId = (world: WorldProgress): SceneId =>
  world.interior?.roomId ?? world.zoneId
export const scenePosition = (world: WorldProgress) => world.interior ?? world
export const sceneName = (world: WorldProgress) =>
  world.interior ? TEA_ROOM.name : zoneById(world.zoneId).name
export const sceneObjects = (world: WorldProgress): readonly WorldObject[] =>
  world.interior ? TEA_ROOM.objects : zoneById(world.zoneId).objects
export const canStandInScene = (id: SceneId, x: number, y: number) =>
  id === TEA_ROOM_ID ? canStandInTeaRoom(x, y) : canStand(id, x, y)
