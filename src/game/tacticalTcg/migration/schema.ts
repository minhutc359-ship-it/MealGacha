import type { GameSave } from "../../types"
import type { UserState } from "../../../domain/models"
export const TACTICAL_PROFILE_KEY = "soul-of-meal.tactical-tcg.profile.v1"
export const TACTICAL_MIGRATION_RECEIPT_KEY =
  "soul-of-meal.tactical-tcg.migration-receipt.v1"
export const TACTICAL_LEGACY_BACKUP_KEY =
  "soul-of-meal.tactical-tcg.legacy-backup.v1"
export const TACTICAL_MIGRATION_JOURNAL_KEY =
  "soul-of-meal.tactical-tcg.migration-journal.v1"
export const LEGACY_TCG_KEY = "foodchest.tcg.v1",
  LEGACY_USER_KEY = "foodchest.user.v1",
  LEGACY_AW2_KEY = "aw2.development.save"
export const TACTICAL_NEW_KEYS = [
  TACTICAL_PROFILE_KEY,
  TACTICAL_MIGRATION_RECEIPT_KEY,
  TACTICAL_LEGACY_BACKUP_KEY,
  TACTICAL_MIGRATION_JOURNAL_KEY,
] as const
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
export interface TacticalLegacyRawSnapshot {
  tcg: string | null
  user: string | null
  aw2: string | null
}
export interface TacticalLegacyBackup {
  schemaVersion: 1
  capturedAt: string
  raw: TacticalLegacyRawSnapshot
}
export interface TacticalMigrationProfile {
  schemaVersion: 1
  migratedAt: string
  tcg: GameSave | null
  chest: UserState | null
  collection: {
    cardCopies: Record<string, number>
    ownedSpiritAliases: string[]
    tinhVi: number
  }
  legacy: {
    autoChess: unknown | null
    aw2: unknown | null
    badges: string[]
    cosmetics: string[]
    warnings: string[]
  }
  pvp: {
    importedPowerBonuses: false
    importedRating: false
  }
}
export interface TacticalMigrationPreview {
  ok: boolean
  error: string | null
  backup: TacticalLegacyBackup
  profile: TacticalMigrationProfile | null
}
