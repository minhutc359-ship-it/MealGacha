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
}
interface UltimateAction {
  id: string
  type: "ultimate"
  unitId: string
}
interface EndRoundAction {
  id: string
  type: "end-round"
}
export type TacticalBattleAction = MoveAction | MergeAction | PlaceTrapAction | BeginRoundAction | BasicAction | UltimateAction | EndRoundAction

export interface CreateBattleOptions {
  battleId: string
  mode?: BattleMode
  nodeId?: string | null
  seed?: number
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
