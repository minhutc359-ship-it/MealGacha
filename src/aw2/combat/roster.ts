import type { CombatSkillSlot } from "./types"

export const STARTER_SPIRIT_IDS = [
  "aw2-than",
  "aw2-lua",
  "aw2-lam",
  "aw2-moc-non",
  "aw2-suong",
] as const
export type StarterSpiritId = (typeof STARTER_SPIRIT_IDS)[number]

export type CombatSpiritId =
  | StarterSpiritId
  | "aw2-muoi"
  | "aw2-nhien"
  | "aw2-hai"
  | "aw2-lien"
  | "aw2-moc"
  | "aw2-bach"

export interface CombatKit {
  spiritId: CombatSpiritId
  role: "tank" | "striker" | "healer" | "support" | "mage" | "debuffer"
  hp: number
  attack: number
  defense: number
  range: number
  moveSpeed: number
  projectileTicks: number
  basicCooldown: number
  autoCooldown: number
  autoCastTicks: number
  ultimateCastTicks: number
}

// Development-only tuning. Identity and skill direction are approved; these
// values are intentionally not a final balance or rarity promise.
export const STARTER_COMBAT_KITS: Record<StarterSpiritId, CombatKit> = {
  "aw2-than": {
    spiritId: "aw2-than",
    role: "tank",
    hp: 220,
    attack: 30,
    defense: 25,
    range: 8,
    moveSpeed: 6,
    projectileTicks: 0,
    basicCooldown: 4,
    autoCooldown: 10,
    autoCastTicks: 1,
    ultimateCastTicks: 1,
  },
  "aw2-lua": {
    spiritId: "aw2-lua",
    role: "striker",
    hp: 150,
    attack: 38,
    defense: 10,
    range: 8,
    moveSpeed: 9,
    projectileTicks: 0,
    basicCooldown: 4,
    autoCooldown: 7,
    autoCastTicks: 1,
    ultimateCastTicks: 2,
  },
  "aw2-lam": {
    spiritId: "aw2-lam",
    role: "healer",
    hp: 140,
    attack: 24,
    defense: 8,
    range: 40,
    moveSpeed: 5,
    projectileTicks: 2,
    basicCooldown: 5,
    autoCooldown: 8,
    autoCastTicks: 1,
    ultimateCastTicks: 1,
  },
  "aw2-moc-non": {
    spiritId: "aw2-moc-non",
    role: "support",
    hp: 155,
    attack: 24,
    defense: 12,
    range: 38,
    moveSpeed: 6,
    projectileTicks: 2,
    basicCooldown: 5,
    autoCooldown: 7,
    autoCastTicks: 1,
    ultimateCastTicks: 1,
  },
  "aw2-suong": {
    spiritId: "aw2-suong",
    role: "mage",
    hp: 145,
    attack: 34,
    defense: 8,
    range: 42,
    moveSpeed: 5,
    projectileTicks: 2,
    basicCooldown: 5,
    autoCooldown: 9,
    autoCastTicks: 1,
    ultimateCastTicks: 2,
  },
}

export function isStarterSpiritId(value: string): value is StarterSpiritId {
  return (STARTER_SPIRIT_IDS as readonly string[]).includes(value)
}

export function combatSkillId(
  spiritId: CombatSpiritId,
  slot: CombatSkillSlot,
): string {
  return `${spiritId}:skill:${slot}`
}

export const COMBAT_KITS: Record<CombatSpiritId, CombatKit> = {
  ...STARTER_COMBAT_KITS,
  "aw2-bach": {
    spiritId: "aw2-bach",
    role: "tank",
    hp: 250,
    attack: 28,
    defense: 28,
    range: 8,
    moveSpeed: 4,
    projectileTicks: 0,
    basicCooldown: 6,
    autoCooldown: 10,
    autoCastTicks: 1,
    ultimateCastTicks: 2,
  },
  "aw2-moc": {
    spiritId: "aw2-moc",
    role: "mage",
    hp: 150,
    attack: 36,
    defense: 9,
    range: 42,
    moveSpeed: 5,
    projectileTicks: 2,
    basicCooldown: 5,
    autoCooldown: 5,
    autoCastTicks: 1,
    ultimateCastTicks: 2,
  },
  "aw2-lien": {
    spiritId: "aw2-lien",
    role: "healer",
    hp: 145,
    attack: 28,
    defense: 10,
    range: 40,
    moveSpeed: 5,
    projectileTicks: 2,
    basicCooldown: 5,
    autoCooldown: 10,
    autoCastTicks: 1,
    ultimateCastTicks: 2,
  },
  "aw2-hai": {
    spiritId: "aw2-hai",
    role: "tank",
    hp: 240,
    attack: 26,
    defense: 28,
    range: 8,
    moveSpeed: 6,
    projectileTicks: 0,
    basicCooldown: 5,
    autoCooldown: 10,
    autoCastTicks: 1,
    ultimateCastTicks: 2,
  },
  "aw2-muoi": {
    spiritId: "aw2-muoi",
    role: "debuffer",
    hp: 150,
    attack: 27,
    defense: 10,
    range: 40,
    moveSpeed: 5,
    projectileTicks: 2,
    basicCooldown: 5,
    autoCooldown: 10,
    autoCastTicks: 1,
    ultimateCastTicks: 2,
  },
  "aw2-nhien": {
    spiritId: "aw2-nhien",
    role: "striker",
    hp: 170,
    attack: 34,
    defense: 11,
    range: 9,
    moveSpeed: 7,
    projectileTicks: 0,
    basicCooldown: 5,
    autoCooldown: 9,
    autoCastTicks: 1,
    ultimateCastTicks: 2,
  },
}

export function isCombatSpiritId(value: string): value is CombatSpiritId {
  return Object.prototype.hasOwnProperty.call(COMBAT_KITS, value)
}
