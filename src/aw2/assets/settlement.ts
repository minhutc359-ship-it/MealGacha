import { TEA_ROOM } from "../world/interiorLayout"
import { VILLAGE_DISTRICT } from "./villageDistrict"
import manifest from "./settlement-v1.json"
import type { SceneBounds } from "./tableRoom"
import type { landscapeCamera } from "./villageView"
export interface SettlementActor extends SceneBounds {
  groundY: number
}
export const SETTLEMENT = manifest
export type SettlementBuilding = typeof manifest.regions[number]["buildings"][number]
export const settlementForZone = (zoneId: string) => {
  const region = manifest.regions.find((region) => region.zoneId === zoneId)
  return region && zoneId === TEA_ROOM.zoneId
    ? {
        ...region,
        buildings: region.buildings.slice(0, 3).map((building, i) => ({
          ...building,
          frame: i === 2 ? "games" : building.frame,
          ...(i === 2 ? { width: 168, height: 176.6 } : {}),
        })),
        landmarks: [],
      }
    : region
}
export function settlementCameraSpec(
  spec: Parameters<typeof landscapeCamera>[2],
  zoneId: string,
) {
  if (zoneId === TEA_ROOM.zoneId)
    return { ...spec, ...VILLAGE_DISTRICT, canvas: spec.canvas }
  return settlementForZone(zoneId)
    ? { ...spec, camera: { ...spec.camera, followZoom: manifest.followZoom } }
    : spec
}
/** Visual overhang only. Existing collision and legal save coordinates stay authoritative. */
export function settlementRoofAlpha(
  building: SettlementBuilding,
  actors: readonly SettlementActor[],
) {
  const left = building.x - building.width / 2,
    top = building.y - building.height
  return actors.some(
    (actor) =>
      actor.groundY < building.depth &&
      actor.x < left + building.width &&
      actor.x + actor.width > left &&
      actor.y < top + building.height &&
      actor.y + actor.height > top,
  )
    ? building.occludedAlpha
    : 1
}

/** The real tea entrance is already listed by RoomWaypoints, not a scenic roof destination. */
export function scenicWalkingLandmarks(zoneId: string) {
  return (settlementForZone(zoneId)?.landmarks ?? [])
    .filter((point) => !(zoneId === TEA_ROOM.zoneId && point.id === "tea"))
    .map((point) => ({ ...point }))
}
