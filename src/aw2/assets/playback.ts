import { sampleBattleClip, sampleSkillFx, skillCueTimes } from "./animation"
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
  phase?: "prepare" | "launch" | "confirmed"
}

export interface EffectPlayback {
  serial: number
  startedAtMs: number
}

export interface ConfirmedEffectCue {
  serial: number
  skillId: string
  index: number
}

/** Confirmed effects have their own clock: source pose changes and unrelated
 * ticks cannot erase/restart an already confirmed impact or healing pulse. */
export function sampleConfirmedEffect(
  manifest: SpiritAssetManifest,
  previous: EffectPlayback | undefined,
  cue: ConfirmedEffectCue,
  nowMs: number,
  reducedMotion: boolean,
) {
  const time = Number.isFinite(nowMs) ? Math.max(0, nowMs) : 0
  const clock =
    previous?.serial === cue.serial
      ? previous
      : { serial: cue.serial, startedAtMs: time }
  const skill = Object.values(manifest.skills).find(
    (skill) => skill.id === cue.skillId,
  )
  const elapsedMs = Math.max(0, time - clock.startedAtMs)
  const lifetimeMs = skill
    ? (skill.projectile ? skill.fx.length - 2 : skill.fx.length) *
      skill.fxFrameMs
    : 0
  return {
    clock,
    effect:
      skill && elapsedMs < lifetimeMs
        ? sampleSkillFx(skill, elapsedMs, reducedMotion, cue.index)
        : null,
  }
}

/** Reference previews play whole tracks; combat preparation/flight cannot
 * impersonate a confirmed Lam impact or healing pulse. */
export function sampleActorEffect(
  manifest: SpiritAssetManifest,
  cue: PlaybackCue | undefined,
  elapsedMs: number,
  reducedMotion = false,
) {
  if (!cue || cue.phase === "prepare" || cue.phase === "launch") return null
  const skill = Object.values(manifest.skills).find(
    (skill) => skill.id === cue.skillId,
  )
  return skill
    ? sampleSkillFx(skill, elapsedMs, reducedMotion, cue.contactIndex)
    : null
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
  const skill = Object.values(manifest.skills).find(
    (skill) => skill.id === cue?.skillId,
  )
  const contacts =
    skill &&
    clock.state !== "defeat" &&
    clock.state === cue?.state &&
    cue?.contactIndex !== undefined
      ? skillCueTimes(skill)
      : []
  const contactAt =
    contacts[cue?.contactIndex ?? -1] ??
    (cue?.phase === "launch" ? (skill?.projectile?.launchAtMs ?? 0) : 0)
  const nextContactAt =
    contacts[(cue?.contactIndex ?? -2) + 1] ?? clip.durationMs
  const active =
    clock.state === "defeat" || elapsedMs < clip.durationMs - contactAt
  const state = active ? clock.state : "idle"
  // A confirmed first beat must never advance to an unconfirmed second pose.
  let clipTime =
    active && contacts.length
      ? Math.min(contactAt + elapsedMs, nextContactAt - 1)
      : elapsedMs
  if (active && state === cue?.state && cue?.phase === "launch")
    clipTime = Math.min(
      contactAt + elapsedMs,
      (skill?.projectile?.impactAtMs ?? clip.durationMs) - 1,
    )
  if (active && state === cue?.state && cue?.phase === "prepare" && skill)
    clipTime = Math.min(clipTime, skillCueTimes(skill)[0] - 1)
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
