import scene from "./covenant-village.environment-v2.json"
import type { Waypoint } from "../world/navigation"
import type { SceneBounds } from "./tableRoom"

export type VillageViewMode = "follow" | "overview"
export interface VillageCamera {
  x: number
  y: number
  zoom: number
  width: number
  height: number
  mode: VillageViewMode
}
const clamp = (n: number, low: number, high: number) =>
  Math.max(low, Math.min(high, n))
function finite(...numbers: number[]) {
  if (!numbers.every(Number.isFinite))
    throw Error("Invalid village view coordinates")
}
function validCamera(camera: VillageCamera) {
  finite(camera.x, camera.y, camera.zoom, camera.width, camera.height)
  if (camera.zoom <= 0 || camera.width <= 0 || camera.height <= 0)
    throw Error("Invalid village view scale")
}
/** Presentation only. Logical world positions, navigation and save bytes never change. */
export function villageCamera(
  position: Waypoint,
  mode: VillageViewMode,
): VillageCamera {
  return landscapeCamera(position, mode, scene)
}
/** Shared scenic camera; callers supply their authored bounds, never world authority. */
export function landscapeCamera(
  position: Waypoint,
  mode: VillageViewMode,
  spec: Pick<typeof scene, "camera" | "canvas" | "landscape">,
): VillageCamera {
  finite(position.x, position.y)
  const zoom =
    mode === "follow" ? spec.camera.followZoom : spec.camera.overviewZoom
  const { width, height } = spec.canvas,
    bounds = spec.landscape
  const halfX = width / zoom / 2,
    halfY = height / zoom / 2
  return {
    x: clamp(
      mode === "follow" ? position.x : spec.camera.centerX,
      bounds.x + halfX,
      bounds.x + bounds.width - halfX,
    ),
    y: clamp(
      mode === "follow" ? position.y : spec.camera.centerY,
      bounds.y + halfY,
      bounds.y + bounds.height - halfY,
    ),
    zoom,
    width,
    height,
    mode,
  }
}
export function projectVillage(
  point: Waypoint,
  camera: VillageCamera,
): Waypoint {
  finite(point.x, point.y)
  validCamera(camera)
  return {
    x: (point.x - camera.x) * camera.zoom + camera.width / 2,
    y: (point.y - camera.y) * camera.zoom + camera.height / 2,
  }
}
export function unprojectVillage(
  point: Waypoint,
  camera: VillageCamera,
): Waypoint {
  finite(point.x, point.y)
  validCamera(camera)
  return {
    x: (point.x - camera.width / 2) / camera.zoom + camera.x,
    y: (point.y - camera.height / 2) / camera.zoom + camera.y,
  }
}
export function villageWorldBounds(
  rect: SceneBounds,
  camera: VillageCamera,
): SceneBounds {
  const origin = unprojectVillage(rect, camera)
  finite(rect.width, rect.height)
  return {
    ...origin,
    width: rect.width / camera.zoom,
    height: rect.height / camera.zoom,
  }
}
export function villageFoliage(
  camera: VillageCamera,
  actor: SceneBounds,
  reducedMotion: boolean,
  spec: Pick<typeof scene, "camera" | "foliage"> = scene,
) {
  validCamera(camera)
  finite(actor.x, actor.y, actor.width, actor.height)
  return spec.foliage.map((prop) => {
    const x =
      prop.x +
      (reducedMotion
        ? 0
        : clamp((camera.x - spec.camera.centerX) * prop.parallax, -12, 12))
    const y =
      prop.y +
      (reducedMotion
        ? 0
        : clamp((camera.y - spec.camera.centerY) * prop.parallax, -8, 8))
    const left = x - prop.width * prop.anchorX,
      top = y - prop.height * prop.anchorY
    const overlaps =
      actor.x < left + prop.width &&
      actor.x + actor.width > left &&
      actor.y < top + prop.height &&
      actor.y + actor.height > top
    return { ...prop, x, y, alpha: overlaps ? prop.occludedAlpha : 1 }
  })
}
