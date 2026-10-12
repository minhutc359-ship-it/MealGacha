import type { Battle, Combatant } from "./types"

export const CURRENT_TCG_RULES = 470 as const
export const LEGACY_DECK_SIZE = 18
export const DECK_SIZE = 24
export type TcgRulesVersion = 350 | 400 | 450 | 470
export const boardLimit = (b: Pick<Battle, "rulesVersion">) => (b.rulesVersion ?? 350) >= 470 ? 4 : 3
export const deckSizeForRules = (version = CURRENT_TCG_RULES as number) => version >= 470 ? DECK_SIZE : LEGACY_DECK_SIZE
export const fatigueDamage = (b: Pick<Battle, "rulesVersion">, attempt: number) => (b.rulesVersion ?? 350) >= 470 ? Math.min(3, attempt) : attempt
export const nextFatigueDamage = (b: Pick<Battle, "rulesVersion">, p: Combatant) => fatigueDamage(b, p.fatigue + 1)
