import frames from "./spriteFrames.json"
import type { Actor, AutoRun, Piece } from "./types"

export const SPRITE_SHEETS = frames
export const VICTORY_DURATION = 3200
export const QUIET_VICTORY_DURATION = 1000
export const STAR_UPGRADE_MS = 1700
export const starScale = (star: number) => 1.07 ** (Math.max(1, Math.min(3, star)) - 1)
export interface StarUpgrade { uid: string; id: string; from: number; to: number; at: number; sources: Piece[] }
export function starUpgrades(before: Piece[], after: Piece[], at: number): StarUpgrade[] {
  const owned = new Map(before.map(p => [p.uid, p]))
  return after.flatMap(p => {
    const old = owned.get(p.uid)
    return old && p.star > old.star ? [{ uid: p.uid, id: p.id, from: old.star, to: p.star, at,
      sources: before.filter(source => source.id === p.id && source.uid !== p.uid && !after.some(next => next.uid === source.uid)) }] : []
  })
}

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
  const ease = t * t * (3 - 2 * t)
  return {
    x: a?.kind === "move" ? (a.from % 6) + ((a.to % 6) - (a.from % 6)) * ease : actor.cell % 6,
    y: a?.kind === "move" ? Math.floor(a.from / 6) + (Math.floor(a.to / 6) - Math.floor(a.from / 6)) * ease : Math.floor(actor.cell / 6),
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
