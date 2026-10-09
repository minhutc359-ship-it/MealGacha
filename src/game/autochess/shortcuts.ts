import { UNIT_MAP } from "./catalog"
import { benchLayout } from "./economy"
import type { AutoAction } from "./reducer"
import type { AutoRun } from "./types"

export function shortcutAction(run: AutoRun, key: string, hoveredUid: string | null): AutoAction | null {
  if (run.phase !== "prepare" || run.scene || run.combat?.pendingScene) return null
  if (key === "f") return { type: "xp" }
  if (key === "d") return { type: "reroll" }
  const piece = run.roster.find(p => p.uid === hoveredUid)
  if (!piece) return null
  if (key === "e") return { type: "sell", uid: piece.uid }
  if (key !== "w") return null
  if (piece.cell !== null) {
    const slot = benchLayout(run).findIndex(p => !p)
    // A full bench is rejected by the same reducer as the touch controls.
    return { type: "move", uid: piece.uid, cell: null, benchSlot: slot >= 0 ? slot : undefined }
  }
  const front = [20, 21, 19, 22, 18, 23, 26, 27, 25, 28, 24, 29, 32, 33, 31, 34, 30, 35]
  const order = UNIT_MAP[piece.id].range === 1 ? front : [...front.slice(12), ...front.slice(6, 12), ...front.slice(0, 6)]
  const cell = order.find(cell => !run.roster.some(p => p.cell === cell))
  return cell === undefined ? null : { type: "move", uid: piece.uid, cell }
}

export function acceptsShortcut(event: Pick<KeyboardEvent, "key" | "repeat" | "isComposing" | "ctrlKey" | "metaKey" | "altKey">, editable: boolean) {
  return !editable && !event.repeat && !event.isComposing && !event.ctrlKey && !event.metaKey && !event.altKey &&
    ["w", "e", "f", "d"].includes(event.key.toLowerCase())
}
