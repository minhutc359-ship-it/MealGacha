import type { ChessSpiritId } from "./catalog"

export interface ChessPiece {
  uid: string
  spiritId: ChessSpiritId
  stars: 1 | 2
  cell: number | null
}
export interface ChessActor {
  uid: string
  spiritId: ChessSpiritId
  stars: 1 | 2
  side: "player" | "opponent"
  x: number
  y: number
  health: number
  maxHealth: number
  attack: number
  range: number
  shield: number
}
export type ChessRoundStatus = "active" | "player-win" | "opponent-win" | "draw"
export interface ChessBattle {
  tick: number
  status: ChessRoundStatus
  actors: ChessActor[]
  events: string[]
}
export interface ChessMatch {
  profile: "aw2-chess-practice-v1"
  seed: number
  rng: number
  serial: number
  round: number
  health: number
  gold: number
  locked: boolean
  phase: "planning" | "battle" | "round-result" | "finished"
  status: "active" | "player-win" | "opponent-win"
  pool: Record<ChessSpiritId, number>
  offers: (ChessSpiritId | null)[]
  units: ChessPiece[]
  battle: ChessBattle | null
  history: ChessRoundStatus[]
  log: string[]
}
export interface ChessBuy {
  type: "buy"
  slot: number
}
export interface ChessMove {
  type: "move"
  uid: string
  cell: number | null
}
export interface ChessSell {
  type: "sell"
  uid: string
}
export interface ChessSimple {
  type: "refresh" | "lock" | "arrange" | "start" | "tick" | "next" | "surrender" | "rematch"
}
export type ChessCommand = ChessBuy | ChessMove | ChessSell | ChessSimple
export interface ChessSession {
  game: ChessMatch
  feedback: string
}
