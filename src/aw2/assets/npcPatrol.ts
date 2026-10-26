import manifest from "./dem-nuoc.patrol-v1.json"
import { npcPatrolView, type NpcPatrolState } from "../world/npcPatrol"
import type { WorldProgress } from "../world/model"

export const PATROL_VISUAL = manifest
export type PatrolVisual = typeof manifest
export type PatrolFrame = keyof PatrolVisual["frames"]

/** Reduced motion keeps the authored idle pose for the NPC's real facing. */
export function samplePatrolVisual(
  world: WorldProgress,
  state?: Readonly<NpcPatrolState>,
  reduced = false,
): PatrolFrame {
  const pose = npcPatrolView(world, state)
  const step = [1, 2, 3, 2][Math.floor(pose.walkMs / 140) % 4]
  return `${pose.facing}-${
    pose.moving && !reduced ? `walk${step}` : "idle"
  }` as PatrolFrame
}
