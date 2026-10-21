import { DEFAULT_TCG_SEED } from "./catalog"
import {
  createTcgMatch,
  legalTcgActions,
  playTcgPlayerCommand,
  recommendTcgAction,
} from "./rules"
import type { TcgCommand, TcgMatch } from "./types"

export interface TcgSelection {
  kind: "play" | "attack"
  uid: string
}
export interface TcgSession {
  match: TcgMatch
  selection: TcgSelection | null
  feedback: string
}
export interface TcgSelectAction {
  type: "select"
  selection: TcgSelection
}
export interface TcgCommandAction {
  type: "command"
  command: TcgCommand
}
export interface TcgSimpleAction {
  type: "cancel" | "recommend" | "rematch"
}
export type TcgSessionAction = TcgSelectAction | TcgCommandAction | TcgSimpleAction

export function createTcgSession(seed = DEFAULT_TCG_SEED): TcgSession {
  return {
    match: createTcgMatch(seed),
    selection: null,
    feedback: "Bạn đi trước. Gọi Vị Linh khi đủ năng lượng, rồi kết thúc lượt.",
  }
}
export function selectedTcgActions(session: TcgSession): TcgCommand[] {
  const selected = session.selection
  return selected
    ? legalTcgActions(session.match, "player").filter(
        (action) =>
          action.type === selected.kind &&
          "uid" in action &&
          action.uid === selected.uid,
      )
    : []
}
export function reduceTcgSession(
  session: TcgSession,
  action: TcgSessionAction,
): TcgSession {
  try {
    if (action.type === "cancel")
      return { ...session, selection: null, feedback: "Đã hủy chọn." }
    if (action.type === "rematch") {
      if (session.match.status === "active")
        throw Error("Hãy hoàn tất ván hiện tại trước.")
      return createTcgSession((session.match.seed + 1) >>> 0)
    }
    if (action.type === "select") {
      const next = { ...session, selection: action.selection }
      if (!selectedTcgActions(next).length) throw Error("Chưa thể dùng lá này.")
      return {
        ...next,
        feedback: "Chọn một mục tiêu sáng trên bàn đối phương.",
      }
    }
    const command =
      "command" in action
        ? action.command
        : recommendTcgAction(session.match, "player")
    if (!command) throw Error("Ván đã kết thúc.")
    const match = playTcgPlayerCommand(session.match, command)
    return {
      match,
      selection: null,
      feedback: match.events.at(-1)?.text ?? "Đã thực hiện nước đi.",
    }
  } catch (cause) {
    return {
      ...session,
      feedback:
        cause instanceof Error ? cause.message : "Không thể thực hiện nước đi.",
    }
  }
}
