import type { StorageLike } from "../migration"

export const TACTICAL_PROGRESS_KEY = "soul-of-meal.tactical-tcg.progress.v1"
export const TACTICAL_PROGRESS_JOURNAL_KEY =
  "soul-of-meal.tactical-tcg.progress-journal.v1"

export interface TacticalProgress {
  schemaVersion: 1
  revision: number
  tinhVi: number
  cardCopies: Record<string, number>
  claimedRewardReceiptIds: string[]
  completedCampaignNodes: string[]
  unlockedMangaChapters: string[]
  updatedAt: string
}

export interface ProgressCommitResult {
  status: "committed" | "duplicate"
  progress: TacticalProgress
}

export interface ProgressMutation {
  receiptId: string
  tinhVi?: number
  cardCopies?: Record<string, number>
  completedNodeId?: string | null
  unlockMangaChapterId?: string | null
}

export type { StorageLike }
