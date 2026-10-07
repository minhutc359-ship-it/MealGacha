export type RecipeId = "home" | "street" | "tet"
export type NpcId = "bach" | "nhien" | "moc" | "hai" | "lien"
export interface Bond {
  choice: "share" | "listen"
  completed: boolean
}
export interface WeeklyRecord {
  stage: number
  score: number
  best: number
  claimed: boolean
  completions: number
}
export interface EncounterState {
  kind: "protect" | "rescue"
  progress: number
  target: number
  integrity: number
  maxIntegrity: number
}
export type School = "ember" | "tide" | "grove" | "hearth" | "sugar"
export type CardRarity = "common" | "rare" | "epic" | "legendary"
export type Keyword = "guard" | "rush" | "shield" | "drain"
export type Effect = "damage" | "heal" | "draw" | "buff" | "ward" | "sweep"

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
  chainSchool?: School | null
  recipeTrail?: string[]
  recipesUsed?: RecipeId[]
  resonanceUsed?: boolean
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
  openingGiftUsed?: boolean
  opening?: boolean
  encounter?: EncounterState
  pendingScenes?: string[]
  seenScenes?: string[]
  companion?: {
    id: NpcId
    choice: "share" | "listen"
    used: boolean
  }
  sideQuest?: NpcId
  weekly?: {
    week: string
    index: number
    seed: number
    score?: number
  }
  bossRuleId?: string
  rngState?: number
  comboCounts?: Partial<Record<RecipeId, number>>
  tableAura?: {
    id: RecipeId
    untilRound: number
  }
  loot?: BattleLoot
  expedition?: ExpeditionCombat
}
export interface BattleLoot {
  coins: number
  xp: number
  tickets: number
  cardId?: string
  dust?: number
}
export interface ExpeditionCombat {
  runId: string
  nodeId: string
  relics: string[]
  enemyBoost: number
  summoned: number
}
export type ExpeditionNodeKind = "battle" | "elite" | "boss" | "event" | "camp"
export interface ExpeditionNode {
  id: string
  kind: ExpeditionNodeKind
  school: School
  title: string
  eventId?: string
}
export interface ExpeditionReward {
  cards: string[]
  relics: string[]
  cardPicked: boolean
  relicPicked: boolean
}
export interface ExpeditionRun {
  id: string
  seed: number
  status: "path" | "battle" | "event" | "reward" | "won" | "lost" | "abandoned"
  floor: number
  health: number
  maxHealth: number
  supplies: number
  deck: string[]
  relics: string[]
  nodes: ExpeditionNode[][]
  route: string[]
  currentNode: string | null
  reward: ExpeditionReward | null
  log: string[]
  wins: number
  paid: boolean
}
export interface ExpeditionStats {
  runs: number
  wins: number
  best: number
}
export interface BattleRecord {
  id: string
  mode: "story" | "practice" | "expedition" | "sidequest" | "weekly"
  opponent: string
  result: "win" | "loss"
  rounds: number
  date: string
  stageId: string | null
  loot: BattleLoot
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
  expedition: ExpeditionRun | null
  expeditionStats: ExpeditionStats
  history: BattleRecord[]
  bonds?: Partial<Record<NpcId, Bond>>
  companion?: NpcId | null
  weeklyRecords?: Record<string, WeeklyRecord>
  storyEnding: "remember" | "release" | null
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
