import type { WorldProgress } from "../world/model"
import { TEA_ROOM, TEA_JOURNAL_ID } from "../world/interiorLayout"
import { INTERACT_RANGE } from "../world/rules"

/** The service belongs to the actual journal desk, never the outside checkpoint. */
export function canUseRoomPractice(world: Readonly<WorldProgress>): boolean {
  const desk = TEA_ROOM.objects.find((object) => object.id === TEA_JOURNAL_ID)!
  return (
    world.zoneId === TEA_ROOM.zoneId &&
    world.interior?.roomId === TEA_ROOM.id &&
    Math.hypot(world.interior.x - desk.x, world.interior.y - desk.y) <=
      INTERACT_RANGE
  )
}
