import type { TacticalTransition } from "./transitions"
import type { TimedSound } from "../../audioScore"
export function duelSounds(t: TacticalTransition): TimedSound[] {
  const result: TimedSound[] = []
  const add = (cue: TimedSound["cue"], delay = 0) => {
    if (!result.some((s) => s.cue === cue)) result.push({ cue, delay })
  }
  if (t.kind === "attack") {
    add("cast")
    add("impact", t.contact)
  }
  if (t.kind === "summon") add("summon")
  if (t.kind === "upgrade" || t.kind === "ultimate") add("awaken")
  if (t.kind === "spell")
    add(
      ({
        ember: "fire",
        tide: "water",
        grove: "leaves",
        hearth: "cast",
        sugar: "sparkle",
      } as const)[t.school],
    )
  if (t.kind === "trap") add("trap-set")
  if (t.trapCardId || t.kind === "reaction") add("resonance", t.contact)
  if (t.kind === "negate") add("break", t.contact)
  if (t.kind === "turn") add("turn")
  if (t.deltas.some((d) => d.statuses.includes("heal"))) add("heal", t.contact)
  if (t.deltas.some((d) => d.shield > 0)) add("shield", t.contact)
  if (t.deltas.some((d) => d.fallen)) add("vanish", t.contact + 100)
  if (t.combo) add("combo", t.contact + 100)
  return result
}
