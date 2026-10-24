import hearth from "./kitchen-hearth.environment-v2.json"
import table from "./kitchen-table.environment-v2.json"
import type { WorldProgress } from "../world/model"
import { hearthRoomWaypoints } from "./hearthRoom"
import { tableRoomWaypoints } from "./tableRoom"

export const INTERIOR_LANDSCAPES = [hearth, table] as const
export function interiorScene(zoneId: string) {
  return INTERIOR_LANDSCAPES.find((scene) => scene.zoneId === zoneId)
}
/** Walk-only approach below authored silhouettes; permissions remain in world rules. */
export function interiorWaypoints(progress: WorldProgress) {
  const scene = interiorScene(progress.zoneId)
  if (!scene) return []
  const points =
    scene.zoneId === hearth.zoneId
      ? hearthRoomWaypoints(progress)
      : tableRoomWaypoints(progress)
  return points.map((point) => ({
    ...point,
    walkX: point.x,
    walkY:
      point.y +
      (point.id.startsWith("aw2-object-steam-") ||
      point.id === "aw2-enemy-forgotten-host" ||
      point.id === "aw2-object-table-note"
        ? 32
        : 0),
  }))
}
