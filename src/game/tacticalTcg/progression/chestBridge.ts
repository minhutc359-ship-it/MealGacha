import type { RewardInstance } from "../../../domain/models"
import {
  SPIRIT_RARITY,
  SPIRIT_RARITY_NAMES,
  type SpiritRarity,
} from "../../../domain/spiritSummons"
import { TACTICAL_CATALOG, resolveCanonicalAlias } from "../catalog"
import {
  TACTICAL_PROFILE_KEY,
  type StorageLike,
  type TacticalMigrationProfile,
} from "../migration"
import { commitTacticalProgress, readTacticalProgress } from "./storage"

const DUPLICATE_TINH_VI: Record<SpiritRarity, number> = {
  common: 8,
  rare: 15,
  epic: 30,
  legendary: 60,
}

export interface TacticalChestGrant {
  receiptId: string
  collectibleId: string
  collectibleName: string
  rarity: SpiritRarity
  rarityName: string
  status: "committed" | "duplicate"
  reward: "card" | "tinh-vi" | "already-synced"
  cardCopies: number
  tinhVi: number
}

function chestCollectible(reward: RewardInstance) {
  const legacyId = reward.spiritCardId ?? reward.dishId
  const collectibleId = resolveCanonicalAlias("chest", legacyId)
  if (!collectibleId)
    throw Error("Thẻ trong Rương chưa có định danh Tactical canonical.")
  const collectible = TACTICAL_CATALOG.spirits.find(
    (spirit) => spirit.id === collectibleId,
  )
  return {
    legacyId,
    collectibleId,
    collectibleName: collectible?.name ?? reward.dish.name,
    rarity: SPIRIT_RARITY[legacyId] ?? "common",
  }
}

/** Converts one durable Chest reward into one exact-once Tactical receipt. */
export function claimChestReward(
  storage: StorageLike,
  reward: RewardInstance,
): TacticalChestGrant {
  if (reward.source !== "chest")
    throw Error("Chỉ phần thưởng mở trực tiếp từ Rương mới được đồng bộ.")
  const receiptId = `chest:${reward.id}`
  const collectible = chestCollectible(reward)
  const current = readTacticalProgress(storage)
  if (current.claimedRewardReceiptIds.includes(receiptId))
    return {
      receiptId,
      ...collectible,
      rarityName: SPIRIT_RARITY_NAMES[collectible.rarity],
      status: "duplicate",
      reward: "already-synced",
      cardCopies: 0,
      tinhVi: 0,
    }

  const alreadyOwned =
    (current.cardCopies[collectible.collectibleId] ?? 0) > 0 ||
    migrationOwnsCollectible(storage, collectible.collectibleId)
  const tinhVi = alreadyOwned ? DUPLICATE_TINH_VI[collectible.rarity] : 0
  const result = commitTacticalProgress(storage, {
    receiptId,
    tinhVi,
    cardCopies: alreadyOwned ? {} : { [collectible.collectibleId]: 1 },
  })
  if (result.status === "duplicate")
    return {
      receiptId,
      ...collectible,
      rarityName: SPIRIT_RARITY_NAMES[collectible.rarity],
      status: "duplicate",
      reward: "already-synced",
      cardCopies: 0,
      tinhVi: 0,
    }
  return {
    receiptId,
    ...collectible,
    rarityName: SPIRIT_RARITY_NAMES[collectible.rarity],
    status: result.status,
    reward: alreadyOwned ? "tinh-vi" : "card",
    cardCopies: alreadyOwned ? 0 : 1,
    tinhVi,
  }
}

function migrationCutoff(storage: StorageLike) {
  const raw = storage.getItem(TACTICAL_PROFILE_KEY)
  if (!raw) return null
  try {
    const profile = JSON.parse(raw) as TacticalMigrationProfile
    return Date.parse(profile.migratedAt)
  } catch {
    return null
  }
}

function migrationOwnsCollectible(storage: StorageLike, collectibleId: string) {
  const raw = storage.getItem(TACTICAL_PROFILE_KEY)
  if (!raw) return false
  try {
    const profile = JSON.parse(raw) as TacticalMigrationProfile
    return (
      profile.collection?.ownedSpiritAliases?.includes(collectibleId) ?? false
    )
  } catch {
    return false
  }
}

/** Replays only post-migration Chest rewards after a reload or interrupted reveal. */
export function syncPendingChestRewards(
  storage: StorageLike,
  rewards: readonly RewardInstance[],
) {
  const cutoff = migrationCutoff(storage)
  if (cutoff === null || !Number.isFinite(cutoff)) return []
  const grants: TacticalChestGrant[] = []
  for (const reward of rewards) {
    if (reward.source !== "chest" || Date.parse(reward.acquiredAt) < cutoff)
      continue
    const grant = claimChestReward(storage, reward)
    if (grant.status === "committed") grants.push(grant)
  }
  return grants
}
