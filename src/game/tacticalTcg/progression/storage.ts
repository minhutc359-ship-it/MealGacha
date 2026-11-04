import {
  TACTICAL_PROFILE_KEY,
  type StorageLike,
  type TacticalMigrationProfile,
} from "../migration"
import type { BattleRewardReceipt } from "../engine"
import { RARITIES } from "../../catalog"
import { TACTICAL_CARD_MAP, ownedTacticalCards } from "../cards"
import { validTacticalCheckpoint } from "./checkpoint"
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
    accountReady: false,
    decks: [],
    activeDeckId: "",
    packTickets: 0,
    packsOpened: 0,
    packPity: 0,
    lastPack: null,
    packHistory: [],
    dailyClaimedDate: null,
    campaignChoices: {},
    checkpoint: null,
  }
}

export function parseTacticalProgress(
  raw: string | null,
  now = new Date().toISOString(),
): TacticalProgress | null {
  if (raw === null) return null
  try {
    const value = JSON.parse(raw) as Partial<TacticalProgress>
    if (value.checkpoint && !validTacticalCheckpoint(value.checkpoint))
      return null
    for (const n of [value.packTickets, value.packsOpened, value.packPity])
      if (n !== undefined && !Number.isFinite(n)) return null
    if (
      value.schemaVersion !== 1 ||
      typeof value.revision !== "number" ||
      typeof value.tinhVi !== "number" ||
      !Number.isFinite(value.tinhVi) ||
      !Number.isFinite(value.revision)
    )
      return null
    return {
      ...emptyTacticalProgress(now),
      schemaVersion: 1,
      revision: Math.max(0, Math.floor(value.revision)),
      tinhVi: Math.max(0, value.tinhVi),
      cardCopies: copies(value.cardCopies),
      claimedRewardReceiptIds: uniqueStrings(value.claimedRewardReceiptIds),
      completedCampaignNodes: uniqueStrings(value.completedCampaignNodes),
      unlockedMangaChapters: uniqueStrings(value.unlockedMangaChapters),
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
      accountReady: value.accountReady === true,
      decks: Array.isArray(value.decks)
        ? value.decks.filter(
            (d) =>
              typeof d.id === "string" &&
              typeof d.name === "string" &&
              Array.isArray(d.cards) &&
              d.cards.every((id) => typeof id === "string"),
          )
        : [],
      activeDeckId:
        typeof value.activeDeckId === "string" ? value.activeDeckId : "",
      packTickets: Math.max(0, Math.floor(Number(value.packTickets) || 0)),
      packsOpened: Math.max(0, Math.floor(Number(value.packsOpened) || 0)),
      packPity: Math.max(0, Math.floor(Number(value.packPity) || 0)),
      lastPack: value.lastPack?.cards?.every((id) => !!TACTICAL_CARD_MAP[id])
        ? value.lastPack
        : null,
      packHistory: Array.isArray(value.packHistory)
        ? value.packHistory
            .filter((p) => p.cards?.every((id) => !!TACTICAL_CARD_MAP[id]))
            .slice(-20)
        : [],
      dailyClaimedDate:
        typeof value.dailyClaimedDate === "string"
          ? value.dailyClaimedDate
          : null,
      campaignChoices:
        value.campaignChoices && typeof value.campaignChoices === "object"
          ? value.campaignChoices
          : {},
      checkpoint: value.checkpoint ?? null,
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
    for (const id of profile.collection?.ownedSpiritAliases ?? [])
      if (typeof id === "string" && !progress.cardCopies[id])
        progress.cardCopies[id] = 1
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
  const progress = parsed ?? migrationBaseline(storage)
  // Materialize legacy Chest aliases into the playable collection in memory;
  // a subsequent validated transaction persists the additive mapping.
  for (const [id, count] of Object.entries(
    ownedTacticalCards(progress.cardCopies),
  ))
    progress.cardCopies[`card:${id}`] = Math.max(
      progress.cardCopies[`card:${id}`] ?? 0,
      count,
    )
  return progress
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
  for (const value of [mutation.tinhVi, mutation.spendTinhVi])
    if (value !== undefined && (!Number.isFinite(value) || value < 0))
      throw Error("Số lượng Tinh Vị không hợp lệ.")
  const baseRaw = storage.getItem(TACTICAL_PROGRESS_KEY)
  const current = readTacticalProgress(storage)
  if (current.claimedRewardReceiptIds.includes(mutation.receiptId))
    return { status: "duplicate", progress: current }
  const next: TacticalProgress = structuredClone(current)
  if ((mutation.spendTinhVi ?? 0) > next.tinhVi)
    throw Error("Không đủ Tinh Vị.")
  if (next.packTickets + (mutation.packTicketsDelta ?? 0) < 0)
    throw Error("Không đủ vé gói thẻ.")
  next.revision += 1
  next.updatedAt = now
  next.tinhVi += Math.max(0, mutation.tinhVi ?? 0)
  next.tinhVi -= Math.max(0, mutation.spendTinhVi ?? 0)
  for (const [id, count] of Object.entries(mutation.cardCopies ?? {})) {
    const total = (next.cardCopies[id] ?? 0) + Math.max(0, count)
    const card = id.startsWith("card:") ? TACTICAL_CARD_MAP[id.slice(5)] : null
    next.cardCopies[id] = card ? Math.min(2, total) : total
    if (card && total > 2)
      next.tinhVi += (total - 2) * RARITIES[card.rarity].salvage
  }
  next.packTickets += mutation.packTicketsDelta ?? 0
  if (mutation.packPity !== undefined) next.packPity = mutation.packPity
  if (mutation.packOpened) {
    next.lastPack = mutation.packOpened
    next.packHistory = [...next.packHistory, mutation.packOpened].slice(-20)
    next.packsOpened++
  }
  if (mutation.decks) next.decks = structuredClone(mutation.decks)
  if (mutation.activeDeckId) next.activeDeckId = mutation.activeDeckId
  if (mutation.accountReady !== undefined)
    next.accountReady = mutation.accountReady
  if (mutation.dailyClaimedDate)
    next.dailyClaimedDate = mutation.dailyClaimedDate
  if (mutation.campaignChoice)
    next.campaignChoices[mutation.campaignChoice.nodeId] =
      mutation.campaignChoice.choice
  if ("checkpoint" in mutation) next.checkpoint = mutation.checkpoint ?? null
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
    packTicketsDelta: reward.tinhVi > 0 ? 1 : 0,
  })
}
