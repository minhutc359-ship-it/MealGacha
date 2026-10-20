import { STARTER_COMBAT_KITS, type StarterSpiritId } from "./roster"
import type { CombatUnitSeed } from "./types"

export const DEVELOPMENT_LEVELING_ID = "aw2-leveling-development-v1" as const
export const MAX_DEVELOPMENT_LEVEL = 20

export interface DevelopmentProgression {
  tuningId: typeof DEVELOPMENT_LEVELING_ID
  level: number
  totalExperience: number
  experienceInLevel: number
  experienceForNextLevel: number | null
}

export interface DevelopmentStarterStats {
  maxHp: number
  attack: number
  defense: number
}

type StarterSeedOverrides = Omit<CombatUnitSeed, "id" | "spiritId" | "hp" | "maxHp" | "attack" | "defense">

function assertLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > MAX_DEVELOPMENT_LEVEL)
    throw Error(`Cấp phát triển phải từ 1 đến ${MAX_DEVELOPMENT_LEVEL}.`)
  return level
}

function assertExperience(totalExperience: number): number {
  if (!Number.isSafeInteger(totalExperience) || totalExperience < 0)
    throw Error("Kinh nghiệm phát triển phải là số nguyên không âm.")
  return totalExperience
}

export function experienceToReachLevel(level: number): number {
  const target = assertLevel(level)
  let total = 0
  for (let current = 1; current < target; current++)
    total += 80 + current * 35 + current * current * 5
  return total
}

export function developmentProgression(
  totalExperience: number,
): DevelopmentProgression {
  const total = assertExperience(totalExperience)
  let level = 1
  while (
    level < MAX_DEVELOPMENT_LEVEL &&
    total >= experienceToReachLevel(level + 1)
  )
    level++
  const floor = experienceToReachLevel(level)
  const next =
    level === MAX_DEVELOPMENT_LEVEL
      ? null
      : experienceToReachLevel(level + 1) - floor
  return {
    tuningId: DEVELOPMENT_LEVELING_ID,
    level,
    totalExperience: total,
    experienceInLevel: total - floor,
    experienceForNextLevel: next,
  }
}

export function developmentStarterStats(
  spiritId: StarterSpiritId,
  level: number,
): DevelopmentStarterStats {
  const safeLevel = assertLevel(level)
  const kit = STARTER_COMBAT_KITS[spiritId]
  const gained = safeLevel - 1
  return {
    maxHp: Math.round(kit.hp * (1 + gained * 0.055)),
    attack: Math.round(kit.attack * (1 + gained * 0.04)),
    defense: Math.round(kit.defense * (1 + gained * 0.045)),
  }
}

export function createDevelopmentStarterSeed(
  id: string,
  spiritId: StarterSpiritId,
  totalExperience: number,
  overrides: StarterSeedOverrides = {},
): CombatUnitSeed {
  if (!id.trim()) throw Error("ID đơn vị tăng cấp không được để trống.")
  const progression = developmentProgression(totalExperience)
  const stats = developmentStarterStats(spiritId, progression.level)
  return {
    ...structuredClone(overrides),
    id,
    spiritId,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    attack: stats.attack,
    defense: stats.defense,
  }
}
