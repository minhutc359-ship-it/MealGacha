import type { WorldProgress } from "./model"
import type { WorldObject } from "./maps"
import { sceneId, sceneObjects, scenePosition } from "./scene"

export const STEP_PORTAL_RADIUS = 18

export interface StepPortalLatch {
  scene: ReturnType<typeof sceneId>
  inside: readonly string[]
}
interface StepPortalAdvanceResult {
  latch: StepPortalLatch
  portal?: WorldObject
}

const portals = (world: WorldProgress) =>
  sceneObjects(world).filter(
    (object) => object.kind === "exit" && object.activation === "step",
  )

const inside = (world: WorldProgress, objects = portals(world)) => {
  const point = scenePosition(world)
  return objects
    .filter(
      (object) =>
        Math.hypot(point.x - object.x, point.y - object.y) <=
        STEP_PORTAL_RADIUS,
    )
    .map((object) => object.id)
}

/** Loading/reloading while already on a threshold never performs travel. */
export function newStepPortalLatch(world: WorldProgress): StepPortalLatch {
  return { scene: sceneId(world), inside: inside(world) }
}

/**
 * Detect one outside→inside edge. The latch updates even for locked portals so
 * a stationary player cannot retrigger; leaving the radius rearms it.
 */
export function advanceStepPortals(
  prior: WorldProgress,
  next: WorldProgress,
  latch: Readonly<StepPortalLatch>,
): StepPortalAdvanceResult {
  const nextScene = sceneId(next)
  if (nextScene !== sceneId(prior) || nextScene !== latch.scene)
    return { latch: newStepPortalLatch(next) }
  const objects = portals(next),
    current = inside(next, objects),
    previous = new Set(latch.inside),
    entered = objects.find(
      (object) => current.includes(object.id) && !previous.has(object.id),
    )
  return {
    latch: { scene: nextScene, inside: current },
    ...(entered ? { portal: entered } : {}),
  }
}
