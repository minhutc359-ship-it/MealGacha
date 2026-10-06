export type School = "ember" | "tide" | "grove" | "hearth" | "sugar"
export type CardRarity = "common" | "rare" | "epic" | "legendary"
export type Keyword = "guard" | "rush" | "shield" | "drain"
export type Effect = "damage" | "heal" | "draw" | "buff" | "ward"

export interface GameCard {
  id: string
  name: string
  school: School
  rarity: CardRarity
  kind: "unit" | "spell"
  cost: number
  attack: number
  health: number
  keywords: Keyword[]
  effect?: Effect
  power?: number
  text: string
  lore: string
  art?: string
  symbol: string
  set: string
}

export interface Deck {
  id: string
  name: string
  cards: string[]
}
export interface BattleUnit {
  uid: string
  cardId: string
  attack: number
  health: number
  maxHealth: number
  shield: number
  ready: boolean
  keywords: Keyword[]
}
export interface Combatant {
  health: number
  maxHealth: number
  mana: number
  maxMana: number
  deck: string[]
  hand: string[]
  board: BattleUnit[]
  fatigue: number
}
export interface Battle {
  id: string
  stageId: string | null
  opponent: string
  round: number
  player: Combatant
  enemy: Combatant
  log: string[]
  result: "win" | "loss" | null
  settled: boolean
  nextUid: number
  loot?: BattleLoot
}
interface BattleLoot {
  coins: number
  xp: number
  tickets: number
  cardId?: string
}
export interface GameStats {
  wins: number
  battles: number
  packs: number
  crafted: number
}
export interface GameSave {
  version: 1
  coins: number
  dust: number
  xp: number
  packTickets: number
  cards: Record<string, number>
  foils: string[]
  decks: Deck[]
  activeDeckId: string
  clearedStages: string[]
  choices: Record<string, "courage" | "wisdom">
  claimedQuests: string[]
  claimedDailyQuests: string[]
  day: string
  lastCheckIn: string | null
  daily: GameStats
  stats: GameStats
  pity: number
  battle: Battle | null
  legacyImported: string[]
  updatedAt: string
}
export interface Chapter {
  id: string
  title: string
  subtitle: string
  school: School
  art: string
  character: string
  intro: string
  stages: {
    id: string
    title: string
    opponent: string
    dialogue: string
    ending: string
    boss: boolean
    rewardCard: string
  }[]
}
