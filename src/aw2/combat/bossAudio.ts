import type { CombatEvent } from "./types"
import type { SkillSlot } from "../assets/types"
import { FORGOTTEN_HOST_ASSETS } from "../assets/forgottenHost"
const id = FORGOTTEN_HOST_ASSETS.entityId
function cueKey(event: CombatEvent) {
  if (!event.sourceId || !event.skillId?.startsWith(`${id}:skill:`)) return null
  if (
    event.kind === "status" &&
    event.statusChange === "apply" &&
    event.skillId === FORGOTTEN_HOST_ASSETS.skills.barrier.id
  )
    return "barrier"
  if (event.kind !== "hit") return null
  if (event.skillId === `${id}:skill:basic`) return "basic"
  if (event.skillId === FORGOTTEN_HOST_ASSETS.skills.sweep.id) return "sweep"
  if (event.skillId === FORGOTTEN_HOST_ASSETS.skills.snuff.id) return "snuff"
  return null
}
/** Actual contacts/barrier application only, one voice per source/skill/rules tick. */
export function bossAudioCues(events: CombatEvent[], afterSerial: number) {
  const seen = new Set<string>()
  return events.flatMap((event) => {
    const cue = cueKey(event)
    if (!cue) return []
    const key = `${event.tick}:${event.sourceId}:${cue}`
    if (seen.has(key)) return []
    seen.add(key)
    if (event.serial <= afterSerial) return []
    return [
      {
        serial: event.serial,
        slot: (cue === "snuff"
          ? "ultimate"
          : cue === "basic"
            ? "basic"
            : "auto") as SkillSlot,
        url: FORGOTTEN_HOST_ASSETS.audio[cue].url,
      },
    ]
  })
}
