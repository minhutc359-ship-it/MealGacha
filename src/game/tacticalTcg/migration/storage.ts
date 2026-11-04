import {
  LEGACY_AW2_KEY,
  LEGACY_TCG_KEY,
  LEGACY_USER_KEY,
  TACTICAL_LEGACY_BACKUP_KEY,
  TACTICAL_MIGRATION_JOURNAL_KEY,
  TACTICAL_MIGRATION_RECEIPT_KEY,
  TACTICAL_NEW_KEYS,
  TACTICAL_PROFILE_KEY,
  type StorageLike,
  type TacticalLegacyRawSnapshot,
} from "./schema"
import { previewTacticalMigration } from "./migrate"
export interface TacticalMigrationResult {
  status: "migrated" | "existing" | "blocked" | "failed"
  error: string | null
}
const snapshot = (storage: StorageLike): TacticalLegacyRawSnapshot => ({
  tcg: storage.getItem(LEGACY_TCG_KEY),
  user: storage.getItem(LEGACY_USER_KEY),
  aw2: storage.getItem(LEGACY_AW2_KEY),
})
function restore(
  storage: StorageLike,
  previous: Record<string, string | null>,
) {
  let first: unknown = null
  for (const [key, value] of Object.entries(previous))
    try {
      value === null ? storage.removeItem(key) : storage.setItem(key, value)
    } catch (error) {
      first ??= error
    }
  if (first) throw first
}
export function migrateTacticalStorage(
  storage: StorageLike,
  now = new Date().toISOString(),
): TacticalMigrationResult {
  if (
    storage.getItem(TACTICAL_MIGRATION_RECEIPT_KEY) &&
    storage.getItem(TACTICAL_PROFILE_KEY)
  )
    return { status: "existing", error: null }
  const preview = previewTacticalMigration(snapshot(storage), now)
  if (!preview.ok || !preview.profile)
    return { status: "blocked", error: preview.error }
  const previous = Object.fromEntries(
    TACTICAL_NEW_KEYS.map((key) => [key, storage.getItem(key)]),
  )
  try {
    storage.setItem(
      TACTICAL_MIGRATION_JOURNAL_KEY,
      JSON.stringify({ schemaVersion: 1, startedAt: now, previous }),
    )
    storage.setItem(TACTICAL_LEGACY_BACKUP_KEY, JSON.stringify(preview.backup))
    storage.setItem(TACTICAL_PROFILE_KEY, JSON.stringify(preview.profile))
    storage.setItem(
      TACTICAL_MIGRATION_RECEIPT_KEY,
      JSON.stringify({
        schemaVersion: 1,
        migrationId: `migration:${now}`,
        completedAt: now,
        profileKey: TACTICAL_PROFILE_KEY,
        backupKey: TACTICAL_LEGACY_BACKUP_KEY,
      }),
    )
    if (
      !storage.getItem(TACTICAL_PROFILE_KEY) ||
      !storage.getItem(TACTICAL_LEGACY_BACKUP_KEY)
    )
      throw Error("Migration readback failed")
    storage.removeItem(TACTICAL_MIGRATION_JOURNAL_KEY)
    return { status: "migrated", error: null }
  } catch (error) {
    try {
      restore(storage, previous)
    } catch {
      return { status: "failed", error: "Migration and rollback failed" }
    }
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Migration failed",
    }
  }
}
