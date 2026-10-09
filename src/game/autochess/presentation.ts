import frames from "./spriteFrames.json"
import type { Actor, AutoRun } from "./types"

export const SPRITE_SHEETS = frames
export const VICTORY_DURATION = 3200
export const QUIET_VICTORY_DURATION = 1000

// Presentation never advances combat, awards gold or changes a saved phase.
export function victoryKey(run: AutoRun | null) {
  return run && (run.phase === "result" || run.phase === "won") &&
    run.combat?.settled && run.combat.result === "win" &&
    run.lastResult?.id === run.combat.id && run.lastResult.result === "win"
    ? `${run.id}:${run.combat.id}` : null
}

export function actorPosition(actor: Actor, time: number) {
  const a = actor.action
  const t = a?.kind === "move"
    ? Math.min(1, Math.max(0, (time - a.start) / Math.max(1, a.end - a.start))) : 0
  return {
    x: a?.kind === "move" ? (a.from % 6) + ((a.to % 6) - (a.from % 6)) * t : actor.cell % 6,
    y: a?.kind === "move" ? Math.floor(a.from / 6) + (Math.floor(a.to / 6) - Math.floor(a.from / 6)) * t : Math.floor(actor.cell / 6),
  }
}

export function actorFrame(actor: Actor, time: number, fresh: boolean, combat: AutoRun["combat"]) {
  if (actor.hp <= 0) return fresh ? 6 : 12
  const a = actor.action
  if (!a && combat?.events.some(e => e.target === actor.uid && e.kind === "hit" && time - e.tick >= 0 && time - e.tick < 3)) return fresh ? 4 : 11
  if (!a) return 0
  const progress = Math.min(.999, Math.max(0, (time - a.start) / Math.max(1, a.end - a.start)))
  if (a.kind === "move") return fresh ? 1 + (Math.floor(progress * 4) % 2) : 1 + Math.floor(progress * 4)
  if (a.kind === "cast") return fresh ? (progress < .4 ? 3 : 4) : 8 + Math.floor(progress * 3)
  return fresh ? (progress < .4 ? 3 : 4) : 5 + Math.floor(progress * 3)
}
