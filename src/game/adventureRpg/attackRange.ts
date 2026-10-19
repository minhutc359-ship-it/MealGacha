import { AUTO_UNITS, MONSTER_MAP, UNIT_MAP } from "../autochess/catalog"
import type { RpgRole } from "./types"

export type RpgAttackBand = "melee" | "mid" | "ranged"

const UNIT_BY_FOOD_ID = Object.fromEntries(
  AUTO_UNITS.filter(unit => unit.foodId).map(unit => [unit.foodId!, unit]),
)

type RangeSource = {
  id: string
  role: RpgRole
  boss?: boolean
  range?: number
  style?: "bulwark" | "raider" | "hexer" | "mender"
}

/** New snapshots store range, while older saves recover it from the shared
 * Auto Chess catalog or their Adventure combat role. */
export function rpgAttackRange(actor: RangeSource) {
  // Adventure uses the stable food/card ID. A few Auto Chess definitions use
  // a shorter board ID and expose that stable identity through `foodId`.
  const catalog = UNIT_MAP[actor.id]
    ?? UNIT_BY_FOOD_ID[actor.id]
    ?? MONSTER_MAP[actor.id]
  const fallback = actor.boss || actor.role === "mage" || actor.role === "healer"
    ? 3
    : actor.role === "trickster" || actor.style === "hexer" || actor.style === "mender"
      ? 2
      : 1
  return Math.max(1, Math.min(4, Math.round(actor.range ?? catalog?.range ?? fallback)))
}

export function rpgAttackBand(actor: RangeSource): RpgAttackBand {
  const range = rpgAttackRange(actor)
  return range <= 1 ? "melee" : range === 2 ? "mid" : "ranged"
}
