import type { TcgCardId } from "./catalog"

export type TcgSide = "player" | "opponent"
export type TcgStatus = "active" | "player-win" | "opponent-win" | "draw"
export interface TcgCardInstance {
  uid: string
  cardId: TcgCardId
}
export interface TcgUnit extends TcgCardInstance {
  attack: number
  health: number
  maxHealth: number
  shield: number
  ready: boolean
}
export interface TcgPlayer {
  health: number
  energy: number
  maxEnergy: number
  turnsTaken: number
  fatigue: number
  deck: TcgCardInstance[]
  hand: TcgCardInstance[]
  board: TcgUnit[]
  discard: TcgCardInstance[]
}
export interface TcgEvent {
  serial: number
  kind: "draw" | "burn" | "play" | "attack" | "effect" | "defeat" | "fatigue" | "turn" | "end"
  text: string
}
export interface TcgMatch {
  profile: "aw2-tcg-practice-v1"
  seed: number
  turn: number
  activeSide: TcgSide
  status: TcgStatus
  players: Record<TcgSide, TcgPlayer>
  events: TcgEvent[]
  eventSerial: number
}
export interface TcgPlay {
  type: "play"
  side: TcgSide
  uid: string
  targetUid?: string
}
export interface TcgAttack {
  type: "attack"
  side: TcgSide
  uid: string
  targetUid: string
}
export interface TcgTurnAction {
  type: "end-turn" | "surrender"
  side: TcgSide
}
export type TcgCommand = TcgPlay | TcgAttack | TcgTurnAction
export interface TcgPlayOptions {
  actions: TcgPlay[]
  reason: string | null
}
