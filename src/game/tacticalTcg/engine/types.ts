export type BattleSide = "player" | "enemy"
export type BattlePhase = "planning" | "clash" | "reaction" | "ultimate" | "round-end" | "result"
export type BattleMode = "campaign" | "pvp"
export type UnitRole = "guardian" | "striker" | "support" | "mage"
export type TrapId = "bamboo-guard" | "steam-counter" | "warm-broth"

export interface BoardCell {
  row: 0 | 1
  column: 0 | 1 | 2 | 3
}
export interface UnitDefinition {
  id: string
  name: string
  role: UnitRole
  traits: string[]
  maxHp: number
  attack: number
  ultimatePower: number
  art: string
}
export interface BattleUnit extends UnitDefinition {
  spellShield?: boolean
  summonedRound?: number
  stunnedUntil?: number
  rootedUntil?: number
  burn?: { damage: number ; remaining: number }
  cardId?: string
  triggers?: Record<string, number>
  instanceId: string
  side: BattleSide
  cell: BoardCell
  hp: number
  energy: number
  star: 1 | 2 | 3
  shield: number
  defeated: boolean
}
export interface BattleCommander {
  hp: number
  maxHp: number
}
export interface BattleRewardReceipt {
  id: string
  battleId: string
  nodeId: string | null
  tinhVi: number
  cardCopies: Record<string, number>
}
export interface BattleLogEntry {
  id: string
  text: string
}
export interface BattleTrap {
  revealed?: boolean
  cardId?: string
  instanceId: string
  trapId: TrapId
  side: BattleSide
  column: 0 | 1 | 2 | 3
  armed: boolean
  triggeredRound: number | null
}
export interface BattleBossState {
  unitId: string
  title: string
  phase: 1 | 2 | 3
}
export interface TacticalBattleState {
  schemaVersion: 1
  battleId: string
  mode: BattleMode
  nodeId: string | null
  seed: number
  round: number
  phase: BattlePhase
  winner: BattleSide | null
  units: BattleUnit[]
  traps: BattleTrap[]
  boss: BattleBossState | null
  commanders: Record<BattleSide, BattleCommander>
  processedActionIds: string[]
  log: BattleLogEntry[]
  lastReaction: string | null
  reward: BattleRewardReceipt | null
  cardGame?: TacticalCardGame
}
export interface CardCombatant {
  deck: string[]
  hand: string[]
  discard: string[]
  mana: number
  maxMana: number
  fatigue: number
  mulliganUsed: boolean
  spellsThisRound: number
  lastSchool: string | null
  recipeRound: number
}
export interface TacticalCardGame {
  rulesVersion?: 3
  botLevel?: "normal" | "hard" | "extreme"
  stats?: Record<BattleSide, {
    spells: number
    traps: number
    summons: number
    kills: number
    healing: number
  }>
  directed?: {
    version: 2
    turn: BattleSide
    pending: DirectedReaction | null
    event: DirectedEvent | null
  }
  sides: Record<BattleSide, CardCombatant>
  nextUnit: number
  rewardCardId: string
  movedRound: number | null
  attacks: Record<string, number>
}
interface PlayCardAction {
  choiceIndex?: 0 | 1
  id: string
  type: "play-card"
  side: BattleSide
  handIndex: number
  cell?: BoardCell
  targetId?: string
  column?: 0 | 1 | 2 | 3
}
interface MulliganAction {
  id: string
  type: "mulligan"
}
interface ForfeitAction {
  id: string
  type: "forfeit"
}
interface MoveAction {
  id: string
  type: "move"
  unitId: string
  cell: BoardCell
}
interface MergeAction {
  id: string
  type: "merge"
  unitIds: [string, string] | [string, string, string]
}
interface PlaceTrapAction {
  id: string
  type: "place-trap"
  side: BattleSide
  trapId: TrapId
  column: 0 | 1 | 2 | 3
}
interface BeginRoundAction {
  id: string
  type: "begin-round"
}
interface BasicAction {
  id: string
  type: "basic"
  unitId: string
  targetId?: string
}
interface UltimateAction {
  id: string
  type: "ultimate"
  unitId: string
  targetId?: string
}
interface EndRoundAction {
  id: string
  type: "end-round"
}
export type TacticalBattleAction = {
  id: string
  type: "end-turn" | "enemy-step"
} | {
  id: string
  type: "react"
  reactionId: string
  activate: boolean
} | MoveAction | MergeAction | PlaceTrapAction | BeginRoundAction | BasicAction | UltimateAction | EndRoundAction | PlayCardAction | MulliganAction | ForfeitAction

export interface CreateBattleOptions {
  duel?: boolean
  botLevel?: "normal" | "hard" | "extreme"
  manual?: boolean
  battleId: string
  mode?: BattleMode
  nodeId?: string | null
  seed?: number
  deck?: string[]
  enemyDeck?: string[]
  rewardCardId?: string
  enemyManaPenalty?: number
  player?: Array<{
    definitionId: string
    cell: BoardCell
    star?: 1 | 2 | 3
  }>
  enemy?: Array<{
    definitionId: string
    cell: BoardCell
    star?: 1 | 2 | 3
  }>
  boss?: {
    definitionId: string
    title: string
  }
}

export type DirectedIntent = PlayCardAction | BasicAction | UltimateAction
export interface DirectedReaction {
  legacyTarget?: true
  id: string
  trapInstanceId: string
  stage: "before" | "after"
  action: DirectedIntent
  cardId: string | null
  affectedUnitId: string | null
}
export interface DirectedEvent {
  impacts?: { id: string ; hp: number ; shield: number }[]
  id: string
  kind: "attack" | "ultimate" | "summon" | "upgrade" | "spell" | "trap" | "reaction" | "negate" | "turn" | "intent" | "move"
  side: BattleSide
  sourceId: string
  targetId?: string
  cardId: string | null
  trapCardId?: string
  note?: string
}
