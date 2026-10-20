import type { BattleClip, ClipMarker, MotionKey, SpiritAssetManifest, WorldDirection } from "./types"

const neutral = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 }
const safeTime = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0

/** Timelines describe presentation only; markers never award damage or rewards. */
export function sampleBattleClip(clip: BattleClip, elapsedMs: number, reducedMotion = false) {
  const elapsed = safeTime(elapsedMs)
  const time = clip.loop ? elapsed % clip.durationMs : Math.min(elapsed, clip.durationMs)
  if (reducedMotion) {
    const keyPose = clip.frames.find(frame => frame.frame !== "battle.idle") ?? clip.frames[0]
    return { frame: keyPose.frame, time, ...neutral }
  }
  const frame = [...clip.frames].reverse().find(frame => time >= frame.atMs) ?? clip.frames[0]
  const before = [...clip.motion].reverse().find(key => time >= key.atMs) ?? clip.motion[0]
  const after = clip.motion.find(key => key.atMs > time) ?? before
  const progress = before === after ? 0 : (time - before.atMs) / (after.atMs - before.atMs)
  const sample = { ...neutral }
  for (const property of ["x", "y", "rotation", "scale", "opacity"] as const) sample[property] = before[property] + (after[property] - before[property]) * progress
  return { frame: frame.frame, time, ...sample }
}

export function markersBetween(clip: BattleClip, previousMs: number, currentMs: number): ClipMarker[] {
  const previous = safeTime(previousMs), current = safeTime(currentMs)
  if (current <= previous) return []
  if (!clip.loop) return clip.markers.filter(marker => marker.atMs > previous && marker.atMs <= Math.min(current, clip.durationMs))
  // Bound catch-up work after a hidden tab; never replay an unbounded event backlog.
  const start = Math.max(previous, current - clip.durationMs)
  const result: ClipMarker[] = []
  for (let cycle = Math.floor(start / clip.durationMs); cycle <= Math.floor(current / clip.durationMs); cycle++) {
    for (const marker of clip.markers) {
      const at = cycle * clip.durationMs + marker.atMs
      if (at > start && at <= current) result.push(marker)
    }
  }
  return result
}

export function sampleWorldFrame(manifest: SpiritAssetManifest, direction: WorldDirection, walking: boolean, elapsedMs: number, reducedMotion = false): string {
  const clip = manifest.world[direction]
  return !walking || reducedMotion ? clip.idle : clip.walk[Math.floor(safeTime(elapsedMs) / clip.frameMs) % clip.walk.length]
}

export function validateAssetManifest(manifest: SpiritAssetManifest): string[] {
  const errors: string[] = []
  if (!/^aw2-[a-z-]+$/.test(manifest.spiritId) || manifest.artVariantId !== "base-v1" || manifest.fullCharacterComplete) errors.push("Unexpected identity/completion claim")
  for (const asset of Object.values(manifest.assets)) {
    if (!asset.id.startsWith(`${manifest.spiritId}:`) || !asset.url.startsWith("/") || !/^[a-f0-9]{64}$/.test(asset.sha256) || asset.width <= 0 || asset.height <= 0) errors.push(`Invalid asset ${asset.id}`)
  }
  for (const [id, frame] of Object.entries(manifest.frames)) {
    const asset = manifest.assets[frame.asset]
    if (!asset || ![frame.x, frame.y, frame.width, frame.height].every(Number.isSafeInteger) || ![frame.anchorX, frame.anchorY].every(Number.isFinite) ||
      frame.x < 0 || frame.y < 0 || frame.width <= 0 || frame.height <= 0 ||
      frame.x + frame.width > asset.width || frame.y + frame.height > asset.height ||
      frame.anchorX < 0 || frame.anchorX > frame.width || frame.anchorY < 0 || frame.anchorY > frame.height ||
      frame.maxEdgeAlpha > manifest.provenance.alphaEdgeTolerance) errors.push(`Invalid frame ${id}`)
  }
  for (const direction of ["up", "down", "left", "right"] as const) {
    const clip = manifest.world[direction]
    if (!clip || clip.frameMs <= 0 || clip.walk.length < 3 || !manifest.frames[clip.idle] || clip.walk.some(frame => !manifest.frames[frame])) errors.push(`Invalid world direction ${direction}`)
  }
  for (const state of ["idle", "move", "attack", "cast", "hit", "guard", "ultimate", "defeat"] as const) {
    const clip = manifest.battle[state]
    const ordered = (keys: { atMs: number }[]) => keys.every((key, index) => key.atMs >= 0 && key.atMs <= clip.durationMs && (index === 0 || key.atMs > keys[index - 1].atMs))
    if (!clip || clip.durationMs <= 0 || !clip.frames.length || !clip.motion.length) { errors.push(`Missing state ${state}`); continue }
    if (!ordered(clip.frames) || !ordered(clip.motion) || clip.frames[0].atMs !== 0 || clip.motion[0].atMs !== 0 || clip.motion[clip.motion.length - 1].atMs !== clip.durationMs ||
      clip.frames.some(key => !manifest.frames[key.frame]) || clip.markers.some(marker => marker.atMs < 0 || marker.atMs > clip.durationMs)) errors.push(`Invalid timeline ${state}`)
    if (clip.motion.some((key: MotionKey) => !Object.values(key).every(Number.isFinite) || key.scale <= 0 || key.opacity < 0 || key.opacity > 1)) errors.push(`Invalid motion ${state}`)
  }
  for (const slot of ["basic", "auto", "passive", "ultimate"] as const) {
    const skill = manifest.skills[slot]
    const state = skill && manifest.battle[skill.battleState as keyof typeof manifest.battle]
    const placement = skill?.fxPlacement
    if (!skill || !state || skill.id !== `${manifest.spiritId}:skill:${slot}` || skill.projectile !== null || skill.fxFrameMs <= 0 || skill.fxTriggerAtMs < 0 || skill.fxTriggerAtMs > state.durationMs || skill.fx.length !== 4 || skill.fx.some(frame => !manifest.frames[frame])) errors.push(`Invalid skill ${slot}`)
    if (!placement || !["contact", "unit"].includes(placement.attachment) || !["front", "behind"].includes(placement.layer) || ![placement.x, placement.y, placement.scale].every(Number.isFinite) || placement.scale <= 0) errors.push(`Invalid FX placement ${slot}`)
  }
  return errors
}
