import manifest from "./forgotten-host.world-v1.json"
import type { WorldProgress } from "../world/model"
import { KITCHEN_BOSS_ID, ZONE_IDS } from "../world/ids"
import { zoneById } from "../world/maps"

export const FORGOTTEN_HOST_WORLD = manifest

/** Read-only facing/appearance; never moves the enemy or authorizes an interaction. */
export function worldBossPresentation(progress: WorldProgress) {
  if (progress.zoneId !== ZONE_IDS[5]) return null
  const object = zoneById(progress.zoneId).objects.find(
    (o) => o.id === KITCHEN_BOSS_ID,
  )!
  const dx = progress.x - object.x,
    dy = progress.y - object.y
  const facing =
    Math.abs(dx) > Math.abs(dy)
      ? dx < 0
        ? "left"
        : "right"
      : dy < 0
        ? "up"
        : "down"
  return {
    entityId: object.id,
    facing,
    frame: manifest.directions[facing],
    x: object.x,
    y: object.y + manifest.display.footOffsetY,
    depth: object.y + manifest.display.depthOffset,
    alpha:
      progress.bossDefeated && progress.questIndex !== 4
        ? manifest.states.defeatedBeforeEndingAlpha
        : manifest.states.defaultAlpha,
  }
}
