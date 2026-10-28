import manifest from "./npc-idle-v1.json"
import { npcLifeActivity } from "../world/npcLife"
export const NPC_MOTION = manifest
export type NpcMotion = typeof manifest.npc[number]
export type NpcIdleFrame = keyof NpcMotion["frames"]
export const npcForEntity = (entityId: string) =>
  manifest.npc.find((npc) => npc.entityId === entityId)
export const npcsForZone = (zoneId: string) =>
  manifest.npc.filter((npc) => npc.zoneId === zoneId)
function time(value: number) {
  if (!Number.isFinite(value) || value < 0)
    throw Error("Invalid NPC animation time")
}
/** Presentation clock only: freeze while paused/reduced; avoid suspended-tab catch-up. */
export function advanceNpcClock(
  elapsedMs: number,
  deltaMs: number,
  paused: boolean,
  reduced: boolean,
) {
  time(elapsedMs)
  time(deltaMs)
  return paused || reduced ? elapsedMs : elapsedMs + Math.min(deltaMs, 100)
}
/** Authored discrete poses only; never changes world position or executes an action. */
export function sampleNpcIdle(
  npc: NpcMotion,
  elapsedMs: number,
  reduced: boolean,
): NpcIdleFrame {
  time(elapsedMs)
  if (reduced) return "neutral"
  let at = (elapsedMs + npc.phaseMs) % manifest.cycleMs
  for (const step of manifest.timeline) {
    if (at < step.durationMs) return step.frame as NpcIdleFrame
    at -= step.durationMs
  }
  return "neutral"
}

/** Activity cue is brief; the authored idle timeline remains visible between cues. */
export function sampleNpcLifeFrame(
  npc: NpcMotion,
  elapsedMs: number,
  lifeMs: number,
  reduced: boolean,
): NpcIdleFrame {
  time(lifeMs)
  if (reduced) return "neutral"
  const current = npcLifeActivity(npc.entityId, lifeMs)
  if ((elapsedMs + npc.phaseMs) % manifest.cycleMs < 400 && current)
    return current.frame
  return sampleNpcIdle(npc, elapsedMs, false)
}
