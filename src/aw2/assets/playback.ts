import { sampleBattleClip } from "./animation"
import type { BattleState, SpiritAssetManifest } from "./types"

export interface ActorPlayback {
  serial: number
  state: BattleState
  startedAtMs: number
}

export interface PlaybackCue {
  serial: number
  state: BattleState
}

/** Presentation time survives unrelated core ticks; received/new cues can interrupt.
 * Defeat holds its final cel instead of restarting whenever another unit acts.
 * This clock has no combat, contact, audio or reward authority.
 */
export function sampleActorPlayback(
  manifest: SpiritAssetManifest,
  previous: ActorPlayback | undefined,
  cue: PlaybackCue | undefined,
  defeated: boolean,
  nowMs: number,
  reducedMotion: boolean,
) {
  const time = Number.isFinite(nowMs) ? Math.max(0, nowMs) : 0
  let clock = previous ?? {
    serial: -1,
    state: "idle" as BattleState,
    startedAtMs: time,
  }
  if (defeated) {
    if (clock.state !== "defeat")
      clock = {
        serial: cue?.serial ?? clock.serial,
        state: "defeat",
        startedAtMs: time,
      }
  } else if (cue && cue.serial !== clock.serial) {
    clock = { serial: cue.serial, state: cue.state, startedAtMs: time }
  }
  const elapsedMs = Math.max(0, time - clock.startedAtMs)
  const clip = manifest.battle[clock.state]
  const active = clock.state === "defeat" || elapsedMs < clip.durationMs
  const state = active ? clock.state : "idle"
  return {
    clock,
    state,
    elapsedMs,
    active,
    pose: sampleBattleClip(manifest.battle[state], elapsedMs, reducedMotion),
  }
}

/** Load only atlases actually referenced by the declared clips and effects. */
export function battleAtlasKeys(manifest: SpiritAssetManifest): string[] {
  const frames = Object.values(manifest.battle).flatMap((clip) => [
    ...clip.frames.map((key) => key.frame),
    ...(clip.reducedMotionFrame ? [clip.reducedMotionFrame] : []),
  ])
  return [
    ...new Set([
      "battle",
      "fx",
      ...frames.map((id) => manifest.frames[id].asset),
    ]),
  ]
}
