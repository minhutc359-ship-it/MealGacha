import { COMBAT_KITS, isCombatSpiritId } from "../combat/roster"
import {
  developmentCombatStats,
  developmentProgression,
} from "../combat/progression"
import type { VanEmphasis } from "../combat/types"

/** Advisory only: no ownership, result, reward or save authority. */
export function describeDevelopmentParty(
  partyIds: readonly string[],
  teamExperience: number,
  vanEmphasis: VanEmphasis,
) {
  if (
    partyIds.length !== 5 ||
    new Set(partyIds).size !== 5 ||
    !partyIds.every(isCombatSpiritId)
  )
    throw Error("Cần đúng năm Vị Linh khác nhau có bộ kỹ năng hợp lệ.")
  if (vanEmphasis !== "protection" && vanEmphasis !== "attack")
    throw Error("Nhấn Vân không hợp lệ.")
  const progression = developmentProgression(teamExperience)
  const members = partyIds.map((spiritId) => {
    if (!isCombatSpiritId(spiritId)) throw Error("Vị Linh không hợp lệ.")
    return {
      spiritId,
      role: COMBAT_KITS[spiritId].role,
      ...developmentCombatStats(spiritId, progression.level),
      ...(spiritId === "aw2-van" ? { vanEmphasis } : {}),
    }
  })
  const tanks = members.filter((m) => m.role === "tank").length
  const healers = members.filter((m) => m.role === "healer").length
  const damageSpecialists = members.filter(
    (m) => m.role === "striker" || m.role === "mage",
  ).length
  return {
    level: progression.level,
    members,
    tanks,
    healers,
    damageSpecialists,
  }
}
