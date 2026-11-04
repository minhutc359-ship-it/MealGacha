import { describe, expect, it } from "vitest"
import type { RewardInstance } from "@/domain/models"
import { resolveCanonicalAlias } from "@/game/tacticalTcg/catalog"
import {
  migrateTacticalStorage,
  TACTICAL_PROFILE_KEY,
} from "@/game/tacticalTcg/migration"
import {
  claimChestReward,
  commitTacticalProgress,
  readTacticalProgress,
  syncPendingChestRewards,
} from "@/game/tacticalTcg/progression"

class MemoryStorage {
  data = new Map<string, string>()
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
}

const reward = (id: string, acquiredAt: string): RewardInstance => ({
  id,
  dishId: "pho-bo",
  spiritCardId: "pho-bo",
  dish: { id: "pho-bo", name: "Phở bò", searchQuery: "phở bò" },
  mealSlot: "breakfast",
  source: "chest",
  status: "available",
  acquiredAt,
  acquiredDate: acquiredAt.slice(0, 10),
  favorite: false,
  rarity: "common",
})

describe("Chest to Tactical economy bridge", () => {
  it("grants the first canonical card, then Tinh Vi for a duplicate exactly once", () => {
    const storage = new MemoryStorage()
    migrateTacticalStorage(storage, "2026-11-04T00:00:00.000Z")
    const first = claimChestReward(
        storage,
        reward("chest-1", "2026-11-04T00:01:00.000Z"),
      ),
      secondReward = reward("chest-2", "2026-11-04T00:02:00.000Z"),
      second = claimChestReward(storage, secondReward),
      replay = claimChestReward(storage, secondReward),
      canonical = resolveCanonicalAlias("chest", "pho-bo")!
    expect(first).toMatchObject({ reward: "card", cardCopies: 1, tinhVi: 0 })
    expect(second).toMatchObject({
      reward: "tinh-vi",
      cardCopies: 0,
      tinhVi: 8,
    })
    expect(replay).toMatchObject({ reward: "already-synced", tinhVi: 0 })
    const progress = readTacticalProgress(storage)
    expect(progress.cardCopies[canonical]).toBe(1)
    expect(progress.tinhVi).toBe(8)
    expect(progress.claimedRewardReceiptIds).toEqual([
      "chest:chest-1",
      "chest:chest-2",
    ])
  })

  it("recovers only post-migration rewards after an interrupted reveal", () => {
    const storage = new MemoryStorage()
    migrateTacticalStorage(storage, "2026-11-04T00:00:00.000Z")
    const recovered = syncPendingChestRewards(storage, [
      reward("legacy", "2026-11-03T23:59:59.000Z"),
      reward("pending", "2026-11-04T00:00:01.000Z"),
    ])
    expect(recovered.map((grant) => grant.receiptId)).toEqual(["chest:pending"])
    expect(
      syncPendingChestRewards(storage, [
        reward("pending", "2026-11-04T00:00:01.000Z"),
      ]),
    ).toEqual([])
  })

  it("treats a migrated Chest collection copy as already owned", () => {
    const storage = new MemoryStorage()
    migrateTacticalStorage(storage, "2026-11-04T00:00:00.000Z")
    commitTacticalProgress(storage, { receiptId: "legacy-progress-write" })
    const profile = JSON.parse(storage.getItem(TACTICAL_PROFILE_KEY)!)
    profile.collection.ownedSpiritAliases = [
      resolveCanonicalAlias("chest", "pho-bo"),
    ]
    storage.setItem(TACTICAL_PROFILE_KEY, JSON.stringify(profile))
    expect(
      claimChestReward(storage, reward("owned", "2026-11-04T00:00:01.000Z")),
    ).toMatchObject({ reward: "tinh-vi", tinhVi: 8 })
  })
})
