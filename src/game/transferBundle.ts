import { GAME_KEY, parseGame } from "./storage"
import { TRANSFER_BACKUP_KEY } from "./saveCode"
import { migrateUserState } from "../infrastructure/storage/repository"
import { useGameStore } from "./useGameStore"
import { useAppStore } from "../store/useAppStore"
import type { GameSave } from "./types"
import type { UserState } from "../domain/models"
const USER_KEY = "foodchest.user.v1"
export function restoreProgress(
  rawSave: unknown,
  rawUser?: unknown,
  backup = true,
): boolean {
  const save = parseGame(rawSave),
    user = rawUser === undefined ? undefined : migrateUserState(rawUser)
  if (!save || user === null) return false
  // Pause an imported encounter until the player is ready on this device.
  if (save.autoChess?.run?.phase === "combat") save.autoChess.run.paused = true
  const keys = [GAME_KEY, USER_KEY, TRANSFER_BACKUP_KEY]
  let previous: (string | null)[]
  try {
    previous = keys.map((key) => localStorage.getItem(key))
  } catch {
    return false
  }
  try {
    if (backup)
      localStorage.setItem(
        TRANSFER_BACKUP_KEY,
        JSON.stringify({
          save: useGameStore.getState().save,
          user: useAppStore.getState().user,
        }),
      )
    localStorage.setItem(GAME_KEY, JSON.stringify(save))
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    for (let i = 0; i < keys.length; i++) {
      try {
        if (previous[i] === null) localStorage.removeItem(keys[i])
        else localStorage.setItem(keys[i], previous[i]!)
      } catch {
        /* Retain in-memory progress if storage is unavailable. */
      }
    }
    return false
  }
  useGameStore.setState({
    save,
    presentation: null,
    notice: "Đã khôi phục tiến trình.",
  })
  if (user) useAppStore.setState({ user, pendingRevealRewardId: null })
  return true
}
export function readTransferBackup(
  raw: unknown,
): { save: GameSave; user?: UserState } | null {
  const bundle =
    raw && typeof raw === "object" && "save" in raw
      ? raw as { save: unknown; user?: unknown }
      : { save: raw, user: undefined }
  const save = parseGame(bundle.save),
    user = bundle.user === undefined ? undefined : migrateUserState(bundle.user)
  return save && user !== null ? { save, ...(user ? { user } : {}) } : null
}
