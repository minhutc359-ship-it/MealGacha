import { sampleBattleClip, skillCueTimes } from "./animation"
import type { BattleState, SpiritAssetManifest } from "./types"

export interface ActorPlayback {
  serial: number
  state: BattleState
  startedAtMs: number
}

export interface PlaybackCue {
  serial: number
  state: BattleState
  skillId?: string
  contactIndex?: number
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
  const contacts =
    clock.state === "attack" &&
    cue?.skillId === manifest.skills.basic.id &&
    cue.contactIndex !== undefined
      ? skillCueTimes(manifest.skills.basic)
      : []
  const contactAt = contacts[cue?.contactIndex ?? -1] ?? 0
  const nextContactAt =
    contacts[(cue?.contactIndex ?? -2) + 1] ?? clip.durationMs
  const active =
    clock.state === "defeat" || elapsedMs < clip.durationMs - contactAt
  const state = active ? clock.state : "idle"
  // A confirmed first beat must never advance to an unconfirmed second pose.
  const clipTime =
    active && contacts.length
      ? Math.min(contactAt + elapsedMs, nextContactAt - 1)
      : elapsedMs
  return {
    clock,
    state,
    elapsedMs,
    active,
    pose: sampleBattleClip(manifest.battle[state], clipTime, reducedMotion),
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
