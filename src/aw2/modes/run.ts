import { createTcgSession, reduceTcgSession } from "../tcg/session"
import type { TcgSession, TcgSessionAction } from "../tcg/session"
import { createChessSession, reduceChessSession } from "../chess/rules"
import type { ChessCommand, ChessSession } from "../chess/types"
import type { Aw2ModeId } from "./catalog"
import type { ModeOutcome } from "./progress"

export interface TcgRun {
  readonly mode: "tcg"
  readonly stage: number
  snapshot: () => TcgSession
  dispatch: (action: TcgSessionAction) => TcgSession
}
export interface ChessRun {
  readonly mode: "auto-chess"
  readonly stage: number
  snapshot: () => ChessSession
  dispatch: (action: ChessCommand) => ChessSession
}
export type TableRun = TcgRun | ChessRun
interface IssuedResult {
  raw: string
  mode: Aw2ModeId
  stage: number
  consumed: boolean
  outcome: () => string
}
const issued = new WeakMap<TableRun, IssuedResult>()
/** Issued engines own their state. UI only receives clones and legal command dispatch. */
export function createTableRun(
  raw: string,
  mode: Aw2ModeId,
  stage: number,
): TableRun {
  if (!Number.isInteger(stage) || stage < 1 || stage > 3)
    throw Error("Bậc bàn chơi không hợp lệ.")
  if (!["tcg", "auto-chess"].includes(mode))
    throw Error("Bàn chơi không hợp lệ.")
  const seed = 20261021 + (mode === "tcg" ? stage : stage - 1)
  let run: TableRun, result: IssuedResult
  const locked = () => result.consumed || result.outcome() !== "active"
  if (mode === "tcg") {
    let state = createTcgSession(seed)
    run = Object.freeze({
      mode,
      stage,
      snapshot: () => structuredClone(state),
      dispatch: (action: TcgSessionAction) => {
        if (!locked() && action.type !== "rematch")
          state = reduceTcgSession(state, structuredClone(action))
        return structuredClone(state)
      },
    })
    result = {
      raw,
      mode,
      stage,
      consumed: false,
      outcome: () => state.match.status,
    }
  } else {
    let state = createChessSession(seed)
    run = Object.freeze({
      mode,
      stage,
      snapshot: () => structuredClone(state),
      dispatch: (action: ChessCommand) => {
        if (!locked() && action.type !== "rematch")
          state = reduceChessSession(state, structuredClone(action))
        return structuredClone(state)
      },
    })
    result = {
      raw,
      mode,
      stage,
      consumed: false,
      outcome: () => state.game.status,
    }
  }
  issued.set(run, result)
  return run
}
export function inspectTableResult(run: TableRun, raw: string) {
  const proof = issued.get(run)
  if (!proof || proof.consumed || proof.raw !== raw)
    throw Error("Kết quả không thuộc lượt ghé bàn hiện tại.")
  const outcome = proof.outcome()
  if (!["player-win", "opponent-win", "draw"].includes(outcome))
    throw Error("Hãy hoàn tất ván trước khi lưu kết quả.")
  return {
    mode: proof.mode,
    stage: proof.stage,
    outcome: outcome as ModeOutcome,
  }
}
export function consumeTableResult(run: TableRun): void {
  const proof = issued.get(run)
  if (!proof) throw Error("Lượt bàn chơi không hợp lệ.")
  proof.consumed = true
}
