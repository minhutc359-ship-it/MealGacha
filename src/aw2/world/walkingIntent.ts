import type { WorldProgress } from "./model"
import { sceneId, scenePosition, type SceneId } from "./scene"
import { findWorldPath, type Waypoint } from "./navigation"
import { worldObjects, type NpcPatrolState } from "./npcPatrol"
import { placeApproach } from "./placeGuidance"
import { INTERACT_RANGE } from "./rules"

/** In-memory intent only. Never part of WorldProgress or any save envelope. */
export interface WalkingTarget extends Waypoint {
  sceneId: SceneId
  label: string
}
export function planWalking(
  world: WorldProgress,
  requested: Waypoint,
  patrol?: Readonly<NpcPatrolState>,
) {
  if (![requested.x, requested.y].every(Number.isFinite)) return null
  const objects = worldObjects(world, patrol)
  const entity =
    requested.entityId !== undefined
      ? objects.find((object) => object.id === requested.entityId)
      : objects.find((object) => {
          const approach = placeApproach(object)
          return (
            Math.hypot(approach.x - requested.x, approach.y - requested.y) <
            0.01
          )
        })
  if (requested.entityId !== undefined && !entity) return null
  if (
    entity &&
    Math.hypot(requested.x - entity.x, requested.y - entity.y) > INTERACT_RANGE
  )
    return null
  const path = findWorldPath(sceneId(world), scenePosition(world), {
    x: requested.x,
    y: requested.y,
  })
  if (!path.length) return null
  const target: WalkingTarget = {
    x: requested.x,
    y: requested.y,
    sceneId: sceneId(world),
    label: entity?.name ?? "Điểm đã chọn",
    ...(entity ? { entityId: entity.id } : {}),
  }
  return { target, path: path.map((point) => ({ x: point.x, y: point.y })) }
}
export function reachedWalkingTarget(
  world: WorldProgress,
  target: WalkingTarget,
) {
  const here = scenePosition(world)
  return (
    sceneId(world) === target.sceneId &&
    Math.hypot(here.x - target.x, here.y - target.y) <= 1
  )
}
export function walkingArrivalText(target: WalkingTarget) {
  return target.entityId
    ? `Đã tới gần ${target.label}. Dùng E / Tương tác.`
    : "Đã tới điểm đã chọn."
}
