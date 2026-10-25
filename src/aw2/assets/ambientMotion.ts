import manifest from "./ambient-motion-v1.json"

export const AMBIENT_MOTION = manifest
export type AmbientFrame = keyof typeof manifest.assets["village-water"]["frames"]
export type AmbientRegion = typeof manifest.regions[number]

export const ambientForZone = (zoneId: string) =>
  manifest.regions.find((region) => region.zoneId === zoneId)

function validTime(value: number) {
  if (!Number.isFinite(value) || value < 0)
    throw Error("Invalid ambient animation time")
}

export function sampleAmbientFrame(
  elapsedMs: number,
  reduced: boolean,
): AmbientFrame {
  validTime(elapsedMs)
  if (reduced) return "calm"
  let at = elapsedMs % manifest.cycleMs
  for (const step of manifest.timeline) {
    if (at < step.durationMs) return step.frame as AmbientFrame
    at -= step.durationMs
  }
  return "calm"
}
