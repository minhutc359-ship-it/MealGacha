import type { CombatEvent } from "./types"
import { ROSTER_ASSETS } from "../assets/roster"
import type { SkillSlot } from "../assets/types"

/** Audio consumes confirmed casts/passive procs; it never dispatches gameplay. */
export function combatAudioCues(events: CombatEvent[], afterSerial: number) {
  const seen = new Set<string>()
  return events
    .filter((event) => event.serial > afterSerial)
    .flatMap((event) => {
      const [spiritId, , slot] = event.skillId?.split(":") ?? []
      const manifest = ROSTER_ASSETS[spiritId]
      if (!manifest || !["basic", "auto", "passive", "ultimate"].includes(slot))
        return []
      if (spiritId === "aw2-nhien") {
        if (
          !(event.kind === "hit" && event.contactIndex !== undefined) &&
          !(
            event.statusEffect === "nhien-energy" &&
            event.statusChange === "gain-energy" &&
            (event.amount ?? 0) > 0
          )
        )
          return []
      } else if (spiritId === "aw2-muoi") {
        if (
          !(
            event.kind === "hit" ||
            (event.kind === "status" &&
              ["apply", "refresh", "dispel"].includes(event.statusChange ?? ""))
          )
        )
          return []
      } else if (
        event.kind !== "cast-commit" &&
        !(
          slot === "passive" &&
          ["status", "shield", "heal"].includes(event.kind)
        )
      )
        return []
      const key = `${event.tick}:${event.sourceId}:${event.skillId}`
      if (seen.has(key)) return []
      seen.add(key)
      return [
        {
          serial: event.serial,
          slot: slot as SkillSlot,
          url: manifest.skills[(slot as SkillSlot)].audio.url,
        },
      ]
    })
}
