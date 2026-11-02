import type { CombatBattle } from "../combat/types"
import { ROSTER_ASSETS } from "./roster"

export const ULTIMATE_ART_DURATION_MS = 1800

export interface UltimateArtCue {
  battleId: string
  serial: number
  spiritId: string
  side: "player" | "enemy"
  displayName: string
  skillName: string
}

/** Read an accepted cast, never a button intent, impact or historical backlog.
 * One latest cue per rendered tick bounds simultaneous casts and hidden-tab catch-up.
 */
export function latestUltimateArtCue(
  battle: CombatBattle,
  afterSerial: number,
): UltimateArtCue | null {
  if (battle.status !== "active") return null
  for (let index = battle.events.length - 1; index >= 0; index--) {
    const event = battle.events[index]
    if (
      event.serial <= afterSerial ||
      event.tick !== battle.tick ||
      event.kind !== "cast-start"
    )
      continue
    const actor = battle.actors.find((unit) => unit.id === event.sourceId)
    const manifest = actor && ROSTER_ASSETS[actor.spiritId]
    if (!actor || !manifest || event.skillId !== manifest.skills.ultimate.id)
      continue
    return {
      battleId: battle.id,
      serial: event.serial,
      spiritId: actor.spiritId,
      side: actor.side,
      displayName: manifest.displayName,
      skillName: manifest.skills.ultimate.displayName,
    }
  }
  return null
}
