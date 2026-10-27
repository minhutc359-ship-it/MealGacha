import type { Ref } from "react"
import type { WorldProgress } from "../../src/aw2/world/model"
import type { WalkingTarget } from "../../src/aw2/world/walkingIntent"
import { sceneId } from "../../src/aw2/world/scene"
import type { VillageCamera } from "../../src/aw2/assets/villageView"
import { walkingMarkerPlacement } from "../../src/aw2/assets/walkMarker"

export function WalkingStatus({
  target,
  onStop,
}: {
  target: WalkingTarget | null
  onStop: () => void
}) {
  if (!target) return null
  return (
    <div
      className="aw2-walk-status"
      role="group"
      aria-label="Đường đang đi"
      data-testid="walking-status"
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onPointerCancel={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <p role="status">Đang tới: {target.label}</p>
      <button
        type="button"
        aria-label="Dừng đường đi"
        data-aw2-world-control="stop"
        onClick={onStop}
      >
        Dừng
      </button>
    </div>
  )
}
export function WalkingMarker({
  target,
  world,
  markerRef,
}: {
  target?: WalkingTarget | null
  world: WorldProgress
  markerRef: Ref<HTMLSpanElement>
}) {
  if (!target || target.sceneId !== sceneId(world)) return null
  return (
    <span
      ref={markerRef}
      className="aw2-walk-marker"
      aria-hidden="true"
      data-testid="walking-marker"
      data-scene-id={target.sceneId}
      data-target-x={target.x}
      data-target-y={target.y}
      data-entity-id={target.entityId}
      style={{ visibility: "hidden" }}
    >
      <svg className="aw2-walk-ring" width="30" height="30" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r="11" />
        <circle cx="15" cy="15" r="3" />
      </svg>
      <svg
        className="aw2-walk-arrow"
        width="30"
        height="30"
        viewBox="0 0 30 30"
      >
        <path d="M15 3 5 15h6v11h8V15h6Z" />
      </svg>
    </span>
  )
}
/** The visible game crop, including the camera toolbar and optional walking status. */
export function worldVisibleBounds(canvas: HTMLCanvasElement) {
  const bounds = canvas.getBoundingClientRect()
  const map = canvas.closest<HTMLElement>(".aw2-world-map")
  const stage = map?.closest<HTMLElement>(".aw2-game-map")
  const stageBounds = stage?.getBoundingClientRect() ?? bounds
  const statusBottom = (stage ?? map)
    ?.querySelector<HTMLElement>(".aw2-walk-status")
    ?.getBoundingClientRect().bottom
  const toolbarBottom = stage
    ?.querySelector<HTMLElement>(".aw2-map-toolbar")
    ?.getBoundingClientRect().bottom
  const left = Math.max(bounds.left, stageBounds.left, 0)
  const right = Math.min(bounds.right, stageBounds.right, innerWidth)
  const top = Math.max(
    bounds.top,
    stageBounds.top,
    statusBottom ?? bounds.top,
    toolbarBottom ?? bounds.top,
    0,
  )
  const bottom = Math.min(bounds.bottom, stageBounds.bottom, innerHeight)
  return {
    left,
    right,
    top,
    bottom,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  }
}

/** Called from the owning renderer ticker, using its live camera, not QA data attributes. */
export function updateWalkingMarker(
  marker: HTMLSpanElement | null,
  target: WalkingTarget | null | undefined,
  camera: VillageCamera,
  canvas: HTMLCanvasElement,
) {
  if (!marker || !target) return
  const map = marker.closest<HTMLElement>(".aw2-world-map")
  if (!map) return
  const projected = walkingMarkerPlacement(
    target,
    camera,
    canvas.getBoundingClientRect(),
    worldVisibleBounds(canvas),
  )
  marker.style.visibility = projected ? "visible" : "hidden"
  if (!projected) return
  const owner = map.getBoundingClientRect()
  marker.style.left = `${projected.x - owner.left - map.clientLeft}px`
  marker.style.top = `${projected.y - owner.top - map.clientTop}px`
  marker.style.setProperty("--walk-angle", `${projected.angle}deg`)
  marker.dataset.offscreen = String(projected.offscreen)
}
