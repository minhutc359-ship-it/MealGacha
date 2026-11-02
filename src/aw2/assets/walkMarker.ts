import { projectVillage, type VillageCamera } from "./villageView"
import type { Waypoint } from "../world/navigation"

export interface WalkViewport {
  left: number
  top: number
  width: number
  height: number
}
/** Screen-pixel projection; independent of rules, save, DOM and renderer ownership. */
export function walkingMarkerPlacement(
  target: Waypoint,
  camera: VillageCamera,
  canvas: WalkViewport,
  visible: WalkViewport,
  padding = 18,
) {
  if (
    ![
      target.x,
      target.y,
      camera.x,
      camera.y,
      camera.zoom,
      camera.width,
      camera.height,
      canvas.left,
      canvas.top,
      canvas.width,
      canvas.height,
      visible.left,
      visible.top,
      visible.width,
      visible.height,
      padding,
    ].every(Number.isFinite) ||
    camera.zoom <= 0 ||
    camera.width <= 0 ||
    camera.height <= 0 ||
    canvas.width <= 0 ||
    canvas.height <= 0 ||
    padding < 0
  )
    return null
  const left = Math.max(canvas.left, visible.left) + padding
  const right =
    Math.min(canvas.left + canvas.width, visible.left + visible.width) - padding
  const top = Math.max(canvas.top, visible.top) + padding
  const bottom =
    Math.min(canvas.top + canvas.height, visible.top + visible.height) - padding
  if (right <= left || bottom <= top) return null
  const point = projectVillage(target, camera)
  const x = canvas.left + (point.x / camera.width) * canvas.width
  const y = canvas.top + (point.y / camera.height) * canvas.height
  return {
    x: Math.max(left, Math.min(right, x)),
    y: Math.max(top, Math.min(bottom, y)),
    offscreen: x < left || x > right || y < top || y > bottom,
    angle:
      (Math.atan2(y - (top + bottom) / 2, x - (left + right) / 2) * 180) /
        Math.PI +
      90,
  }
}
