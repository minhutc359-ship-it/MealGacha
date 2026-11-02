import type { WorldProgress } from "@/aw2/world/model"
import { entityLocation } from "@/aw2/world/scene"
import { roomById } from "@/aw2/world/interiorLayout"
/** Legal spatial unit fixture only; browser journeys must walk and enter real doors. */
export function atEntity(world: WorldProgress, id: string): WorldProgress {
  const location = entityLocation(id)
  if (!location) throw Error(`Missing fixture entity: ${id}`)
  const { object, zoneId, roomId } = location
  if (roomId) {
    const room = roomById(roomId)
    return {
      ...world,
      zoneId,
      x: room.approach.x,
      y: room.approach.y,
      interior: { ...room.spawn, x: object.x, y: object.y + 32 },
    }
  }
  return { ...world, zoneId, x: object.x, y: object.y, interior: null }
}
