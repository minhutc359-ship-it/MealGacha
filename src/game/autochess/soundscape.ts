import type { GameSound } from "../audioScore"
import type { Actor, CombatEvent } from "./types"

export interface AutoCue { cue: GameSound; pan: number; priority: number }
export function autoCue(event: CombatEvent, actors: readonly Actor[]): AutoCue | null {
  const source = actors.find(actor => actor.uid === event.source)
  const cell = ["attack", "cast"].includes(event.kind) ? source?.cell ?? event.cell : event.cell
  const pan = Math.max(-.7, Math.min(.7, (cell % 6 - 2.5) / 2.5 * .7))
  const cue: GameSound | null = event.kind === "phase" ? "auto-boss"
    : event.kind === "death" ? "auto-fall"
    : event.kind === "cast" ? event.amount === 0 ? "auto-channel" : ({ ember: "fire", tide: "water", grove: "leaves", hearth: "shield", sugar: "sparkle" } as const)[event.school]
    : event.kind === "hit" ? "auto-contact"
    : event.kind === "attack" ? (source?.range ?? 1) > 1 ? "auto-shot" : "auto-slash"
    : event.kind === "heal" ? "heal" : event.kind === "shield" ? "shield" : event.kind === "summon" ? "summon" : null
  const priority = event.kind === "phase" ? 10 : event.kind === "death" ? 8 : event.kind === "cast" && event.amount > 0 ? 7 : event.kind === "cast" ? 6 : event.kind === "hit" ? 5 : event.kind === "attack" ? 2 : 4
  return cue ? { cue, pan, priority } : null
}
// Wall-clock cadence stays listenable at x3. Dropped events are consumed once;
// resuming or restoring a snapshot never replays the whole saved event buffer.
export class AutoSoundscape {
  private lastBatch = -Infinity
  private played = new Map<GameSound, number>()
  constructor(private lastEvent = 0) {}
  collect(events: readonly CombatEvent[], actors: readonly Actor[], now: number): AutoCue[] {
    const candidates = new Map<GameSound, AutoCue>()
    for (const event of events) {
      if (event.id <= this.lastEvent) continue
      this.lastEvent = event.id
      const cue = autoCue(event, actors)
      if (cue) candidates.set(cue.cue, cue)
    }
    if (now - this.lastBatch < 85) return []
    const cues = [...candidates.values()].filter(({ cue }) => now - (this.played.get(cue) ?? -Infinity) >=
      (cue === "auto-contact" ? 130 : cue === "auto-channel" ? 350 : 220)).sort((a, b) => b.priority - a.priority).slice(0, 2)
    if (cues.length) this.lastBatch = now
    for (const { cue } of cues) this.played.set(cue, now)
    return cues
  }
}
