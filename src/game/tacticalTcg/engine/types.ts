export type BattleSide = "player" | "enemy"
export type BattlePhase = "planning" | "clash" | "reaction" | "ultimate" | "round-end" | "result"
export type BattleMode = "campaign" | "pvp"
export type UnitRole = "guardian" | "striker" | "support" | "mage"

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
  commanders: Record<BattleSide, BattleCommander>
  processedActionIds: string[]
  log: BattleLogEntry[]
  reward: BattleRewardReceipt | null
}
export type TacticalBattleAction =
  | { id: string; type: "move"; unitId: string; cell: BoardCell }
  | { id: string; type: "merge"; unitIds: [string, string] }
  | { id: string; type: "begin-round" }
  | { id: string; type: "basic"; unitId: string }
  | { id: string; type: "ultimate"; unitId: string }
  | { id: string; type: "end-round" }

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
}
