import type { StorageLike } from "../migration"
import type { Deck } from "../../types"
import type { TacticalBattleState } from "../engine/types"

export interface TacticalPackReceipt {
  id: string
  packId: string
  cards: string[]
  newCardIds: string[]
  duplicateTinhVi: number
  openedAt: string
}

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
  accountReady: boolean
  decks: Deck[]
  activeDeckId: string
  packTickets: number
  packsOpened: number
  packPity: number
  lastPack: TacticalPackReceipt | null
  packHistory: TacticalPackReceipt[]
  dailyClaimedDate: string | null
  campaignChoices: Record<string, string>
  checkpoint: TacticalBattleState | null
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
  spendTinhVi?: number
  packTicketsDelta?: number
  packOpened?: TacticalPackReceipt
  packPity?: number
  decks?: Deck[]
  activeDeckId?: string
  accountReady?: boolean
  dailyClaimedDate?: string
  campaignChoice?: { nodeId: string; choice: string }
  checkpoint?: TacticalBattleState | null
}

export type { StorageLike }
