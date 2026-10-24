import manifest from "./settlement-v1.json"
import type { SceneBounds } from "./tableRoom"
import type { landscapeCamera } from "./villageView"
export interface SettlementActor extends SceneBounds {
  groundY: number
}
export const SETTLEMENT = manifest
export type SettlementBuilding = typeof manifest.regions[number]["buildings"][number]
export const settlementForZone = (zoneId: string) =>
  manifest.regions.find((region) => region.zoneId === zoneId)
export function settlementCameraSpec(
  spec: Parameters<typeof landscapeCamera>[2],
  zoneId: string,
) {
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
