import {
  TACTICAL_PROFILE_KEY,
  type StorageLike,
  type TacticalMigrationProfile,
} from "../migration"
import type { BattleRewardReceipt } from "../engine"
import {
  TACTICAL_PROGRESS_JOURNAL_KEY,
  TACTICAL_PROGRESS_KEY,
  type ProgressCommitResult,
  type ProgressMutation,
  type TacticalProgress,
} from "./schema"

const uniqueStrings = (value: unknown) =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter((item): item is string => typeof item === "string"),
        ),
      ]
    : []
const copies = (value: unknown) =>
  value && typeof value === "object"
    ? Object.fromEntries(
        Object.entries(value).filter(
          (entry): entry is [string, number] =>
            typeof entry[1] === "number" &&
            Number.isFinite(entry[1]) &&
            entry[1] >= 0,
        ),
      )
    : {}

export function emptyTacticalProgress(
  now = new Date().toISOString(),
): TacticalProgress {
  return {
    schemaVersion: 1,
    revision: 0,
    tinhVi: 0,
    cardCopies: {},
    claimedRewardReceiptIds: [],
    completedCampaignNodes: [],
    unlockedMangaChapters: ["manga:act-1"],
    updatedAt: now,
  }
}

export function parseTacticalProgress(
  raw: string | null,
  now = new Date().toISOString(),
): TacticalProgress | null {
  if (raw === null) return null
  try {
    const value = JSON.parse(raw) as Partial<TacticalProgress>
    if (
      value.schemaVersion !== 1 ||
      typeof value.revision !== "number" ||
      typeof value.tinhVi !== "number"
    )
      return null
    return {
      schemaVersion: 1,
      revision: Math.max(0, Math.floor(value.revision)),
      tinhVi: Math.max(0, value.tinhVi),
      cardCopies: copies(value.cardCopies),
      claimedRewardReceiptIds: uniqueStrings(value.claimedRewardReceiptIds),
      completedCampaignNodes: uniqueStrings(value.completedCampaignNodes),
      unlockedMangaChapters: uniqueStrings(value.unlockedMangaChapters),
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
    }
  } catch {
    return null
  }
}

function migrationBaseline(storage: StorageLike) {
  const raw = storage.getItem(TACTICAL_PROFILE_KEY)
  if (!raw) return emptyTacticalProgress()
  try {
    const profile = JSON.parse(raw) as TacticalMigrationProfile
    const progress = emptyTacticalProgress(profile.migratedAt)
    progress.tinhVi = Math.max(0, profile.collection?.tinhVi ?? 0)
    progress.cardCopies = copies(profile.collection?.cardCopies)
    return progress
  } catch {
    return emptyTacticalProgress()
  }
}

export function readTacticalProgress(storage: StorageLike): TacticalProgress {
  const raw = storage.getItem(TACTICAL_PROGRESS_KEY)
  const parsed = parseTacticalProgress(raw)
  if (raw !== null && !parsed)
    throw Error("Tactical progress is corrupt; original bytes were preserved.")
  return parsed ?? migrationBaseline(storage)
}

function restore(
  storage: StorageLike,
  previous: Record<string, string | null>,
) {
  let first: unknown = null
  for (const [key, value] of Object.entries(previous)) {
    try {
      if (value === null) storage.removeItem(key)
      else storage.setItem(key, value)
    } catch (error) {
      first ??= error
    }
  }
  if (first) throw first
}

/** Exact-once local transaction with optimistic concurrency and rollback. */
export function commitTacticalProgress(
  storage: StorageLike,
  mutation: ProgressMutation,
  now = new Date().toISOString(),
): ProgressCommitResult {
  if (!mutation.receiptId.trim()) throw Error("Reward receipt id is required")
  const baseRaw = storage.getItem(TACTICAL_PROGRESS_KEY)
  const current = readTacticalProgress(storage)
  if (current.claimedRewardReceiptIds.includes(mutation.receiptId))
    return { status: "duplicate", progress: current }
  const next: TacticalProgress = structuredClone(current)
  next.revision += 1
  next.updatedAt = now
  next.tinhVi += Math.max(0, mutation.tinhVi ?? 0)
  for (const [id, count] of Object.entries(mutation.cardCopies ?? {}))
    next.cardCopies[id] = (next.cardCopies[id] ?? 0) + Math.max(0, count)
  next.claimedRewardReceiptIds.push(mutation.receiptId)
  if (
    mutation.completedNodeId &&
    !next.completedCampaignNodes.includes(mutation.completedNodeId)
  )
    next.completedCampaignNodes.push(mutation.completedNodeId)
  if (
    mutation.unlockMangaChapterId &&
    !next.unlockedMangaChapters.includes(mutation.unlockMangaChapterId)
  )
    next.unlockedMangaChapters.push(mutation.unlockMangaChapterId)
  if (storage.getItem(TACTICAL_PROGRESS_KEY) !== baseRaw)
    throw Error(
      "Tactical progress changed in another tab; reload before claiming.",
    )

  const previous = {
    [TACTICAL_PROGRESS_KEY]: baseRaw,
    [TACTICAL_PROGRESS_JOURNAL_KEY]: storage.getItem(
      TACTICAL_PROGRESS_JOURNAL_KEY,
    ),
  }
  try {
    storage.setItem(
      TACTICAL_PROGRESS_JOURNAL_KEY,
      JSON.stringify({
        schemaVersion: 1,
        receiptId: mutation.receiptId,
        previous,
      }),
    )
    storage.setItem(TACTICAL_PROGRESS_KEY, JSON.stringify(next))
    const verified = parseTacticalProgress(
      storage.getItem(TACTICAL_PROGRESS_KEY),
    )
    if (
      !verified ||
      verified.revision !== next.revision ||
      !verified.claimedRewardReceiptIds.includes(mutation.receiptId)
    )
      throw Error("Progress readback failed")
    storage.removeItem(TACTICAL_PROGRESS_JOURNAL_KEY)
    return { status: "committed", progress: verified }
  } catch (error) {
    try {
      restore(storage, previous)
    } catch {
      throw Error("Progress commit and rollback failed")
    }
    throw error
  }
}

export function claimBattleReward(
  storage: StorageLike,
  reward: BattleRewardReceipt,
  mangaChapterId?: string | null,
) {
  return commitTacticalProgress(storage, {
    receiptId: reward.id,
    tinhVi: reward.tinhVi,
    cardCopies: reward.cardCopies,
    completedNodeId: reward.nodeId,
    unlockMangaChapterId: mangaChapterId,
  })
}
