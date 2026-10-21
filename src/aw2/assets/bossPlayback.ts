import type { CombatActor, CombatBattle, CombatPresentation } from "../combat"
import { forgottenHostTargets } from "../combat/forgottenHost"
import { FORGOTTEN_HOST_ASSETS as manifest } from "./forgottenHost"
import type { BattleState } from "./types"
import { sampleBattleClip } from "./animation"

type BossSkill = keyof typeof manifest.skills
interface ImpactClock {
  key: string
  tick: number
  kind: BossSkill
  startedAtMs: number
  targetIds: string[]
}
export interface BossPlaybackClock {
  poseKey: string
  poseStartedAtMs: number
  barrierHits: number
  impact: ImpactClock | null
}
export interface BossVisualEffect {
  frame: string
  targetIds: string[]
  phase: "warning" | "protection" | "confirmed"
  skillId: string
}

/** Samples authoritative state/events only. Never predicts contact or changes rules. */
export function sampleBossVisual(
  battle: CombatBattle,
  actor: CombatActor,
  presentation: CombatPresentation,
  previous: BossPlaybackClock | undefined,
  nowMs: number,
  reducedMotion: boolean,
  stopped = false,
) {
  const now = Number.isFinite(nowMs) ? Math.max(0, nowMs) : 0
  const active = !stopped && battle.status === "active" && actor.hp > 0
  const kit = actor.bossKit
  const cue = presentation.actors[actor.id]
  const heldState: BattleState | null =
    actor.hp <= 0
      ? "defeat"
      : !active
        ? "idle"
        : kit?.intent
          ? kit.intent.kind === "snuff"
            ? "ultimate"
            : "cast"
          : (kit?.barrierHits ?? 0) > 0
            ? "guard"
            : null
  const state: BattleState = heldState ?? cue?.state ?? "idle"
  const poseKey = heldState
    ? `${heldState}:${
        heldState === "guard"
          ? kit?.barrierExpiresAtTick
          : heldState === "defeat"
            ? "end"
            : (kit?.intent?.startedTick ?? "end")
      }`
    : `${state}:${cue?.serial ?? 0}`
  const clock: BossPlaybackClock = {
    poseKey,
    poseStartedAtMs:
      previous?.poseKey === poseKey ? previous.poseStartedAtMs : now,
    barrierHits: kit?.barrierHits ?? 0,
    impact: active ? (previous?.impact ?? null) : null,
  }
  const elapsed = now - clock.poseStartedAtMs
  const clip = manifest.battle[state]
  const visibleState =
    heldState || clip.loop || elapsed < clip.durationMs ? state : "idle"
  const effects: BossVisualEffect[] = []
  if (active) {
    const intent = kit?.intent
    if (intent)
      effects.push({
        frame: manifest.skills[intent.kind].warningFrame,
        targetIds: forgottenHostTargets(battle, actor).map(
          (target) => target.id,
        ),
        phase: "warning",
        skillId: manifest.skills[intent.kind].id,
      })
    if ((kit?.barrierHits ?? 0) > 0)
      effects.push({
        frame: `fx.barrier.${kit!.barrierHits > 2 ? 0 : 1}`,
        targetIds: [actor.id],
        phase: "protection",
        skillId: manifest.skills.barrier.id,
      })
    const hits = battle.events.filter(
      (event) =>
        event.sourceId === actor.id &&
        event.kind === "hit" &&
        event.tick === battle.tick &&
        [manifest.skills.sweep.id, manifest.skills.snuff.id].includes(
          event.skillId ?? "",
        ),
    )
    const last = hits.at(-1)
    if (last) {
      const kind = last.skillId === manifest.skills.sweep.id ? "sweep" : "snuff"
      const key = `${kind}:${last.tick}`
      const targets = hits
        .filter((hit) => hit.skillId === last.skillId)
        .flatMap((hit) => hit.targetIds)
      clock.impact = {
        key,
        tick: battle.tick,
        kind,
        startedAtMs:
          previous?.impact?.key === key ? previous.impact.startedAtMs : now,
        targetIds: [
          ...new Set([
            ...(previous?.impact?.key === key ? previous.impact.targetIds : []),
            ...targets,
          ]),
        ],
      }
    } else if ((previous?.barrierHits ?? 0) > 0 && !kit?.barrierHits) {
      clock.impact = {
        key: `barrier:${battle.tick}`,
        tick: battle.tick,
        kind: "barrier",
        startedAtMs: now,
        targetIds: [actor.id],
      }
    }
    if (clock.impact) {
      const impact = clock.impact,
        skill = manifest.skills[impact.kind]
      const age = Math.max(0, now - impact.startedAtMs)
      const frames =
        impact.kind === "barrier" ? [skill.impactFrames[1]] : skill.impactFrames
      if (battle.tick <= impact.tick + 1 && age < frames.length * skill.frameMs)
        effects.push({
          frame: frames[reducedMotion ? 0 : Math.floor(age / skill.frameMs)],
          targetIds: impact.targetIds,
          phase: "confirmed",
          skillId: skill.id,
        })
    }
  }
  return {
    clock,
    state: visibleState,
    pose: sampleBattleClip(
      manifest.battle[visibleState],
      elapsed,
      reducedMotion,
    ),
    effects,
  }
}
