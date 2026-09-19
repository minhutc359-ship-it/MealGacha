import { describe, expect, it } from "vitest"
import { applyCheckIn, canCheckIn } from "./checkIn"
import { buildPool, canOpenChest, applyOpenChest } from "./drawReward"
import { applyFuse, canFuse } from "./fuseRewards"
import { getDateKey } from "./dateKey"
import { RewardInstance, UserState } from "./models"
import { SEED_DISHES } from "../infrastructure/catalog/seedCatalog"
import { getVisibleRewards } from "./rewardPresentation"
import {
  getCollectionProgress,
  isCatalogComplete,
} from "./achievements"

function makeState(overrides: Partial<UserState> = {}): UserState {
  const now = new Date().toISOString()
  return {
    schemaVersion: 2,
    displayName: "Nhà thám hiểm",
    keys: 0,
    rewards: [],
    fusions: [],
    keyTransactions: [],
    timelinePosts: [],
    fragments: {},
    equippedTitleId: "newbie",
    unlockedTitleIds: ["newbie"],
    favoriteTasteTags: [],
    recentDishIdsByMeal: { breakfast: [], lunch: [], dinner: [] },
    preferences: {
      soundEnabled: false,
      reducedMotion: false,
      hiddenDishIds: [],
      searchRadiusMeters: 3000,
      minRating: 4,
      minReviews: 20,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function makeReward(id: string, date = getDateKey()): RewardInstance {
  const dish = SEED_DISHES.find((item) => item.mealSlots.includes("lunch"))!
  return {
    id,
    dishId: dish.id,
    dish: {
      id: dish.id,
      name: dish.name,
      searchQuery: dish.searchQuery,
      category: dish.category,
    },
    mealSlot: "lunch",
    source: "chest",
    status: "available",
    acquiredAt: new Date().toISOString(),
    acquiredDate: date,
    favorite: false,
    rarity: "common",
  }
}

describe("daily check-in", () => {
  it("awards exactly ten keys once per local day", () => {
    const first = applyCheckIn(makeState({ keys: 2 }))
    expect(first.keys).toBe(12)
    expect(first.keyTransactions.at(-1)?.amount).toBe(10)
    expect(canCheckIn(first)).toBe(false)
    expect(applyCheckIn(first)).toBe(first)
  })
})

describe("chest draw", () => {
  it("requires a key and consumes exactly one key", () => {
    expect(canOpenChest(makeState(), SEED_DISHES, "lunch")).toContain(
      "Không đủ",
    )

    const result = applyOpenChest(makeState({ keys: 3 }), SEED_DISHES, "lunch")
    expect(result.state.keys).toBe(2)
    expect(result.reward.mealSlot).toBe("lunch")
    expect(result.state.rewards).toHaveLength(1)
    expect(["common", "rare", "epic", "diamond"]).toContain(result.reward.rarity)
  })

  it("does not consume keys after unlimited chest access is unlocked", () => {
    const state = makeState({
      keys: 0,
      unlimitedChestUnlockedAt: new Date().toISOString(),
    })
    expect(canOpenChest(state, SEED_DISHES, "dinner")).toBeNull()

    const result = applyOpenChest(state, SEED_DISHES, "dinner")
    expect(result.state.keys).toBe(0)
    expect(result.state.keyTransactions).toHaveLength(0)
  })

  it("excludes the last three dishes when the banner has enough choices", () => {
    const lunch = SEED_DISHES.filter(
      (dish) => dish.active && dish.mealSlots.includes("lunch"),
    )
    const recent = lunch.slice(0, 3).map((dish) => dish.id)
    const pool = buildPool(SEED_DISHES, "lunch", recent)
    expect(pool.some((dish) => recent.includes(dish.id))).toBe(false)
  })
})

describe("fusion", () => {
  it("rejects rewards acquired on different days", () => {
    const rewards = [
      makeReward("a"),
      makeReward("b"),
      makeReward("c", "2020-01-01"),
    ]
    expect(canFuse(rewards, ["a", "b", "c"])).toContain("cùng ngày")
  })

  it("consumes three inputs and creates one rare-or-better output", () => {
    const rewards = [makeReward("a"), makeReward("b"), makeReward("c")]
    const result = applyFuse(
      makeState({ rewards }),
      SEED_DISHES,
      ["a", "b", "c"],
      "dinner",
    )
    const consumed = result.state.rewards.filter(
      (reward) => reward.status === "consumed",
    )

    expect(consumed).toHaveLength(3)
    expect(result.state.rewards).toHaveLength(4)
    expect(result.state.fusions).toHaveLength(1)
    expect(result.reward.source).toBe("fusion")
    expect(["rare", "epic", "diamond"]).toContain(result.reward.rarity)
  })
})

describe("achievements", () => {
  it("tracks unique dishes and completes the catalog only once every dish is opened", () => {
    const rewards = SEED_DISHES.map((dish, index) => ({
      ...makeReward(`achievement-${index}`),
      dishId: dish.id,
      dish: {
        id: dish.id,
        name: dish.name,
        searchQuery: dish.searchQuery,
        category: dish.category,
      },
    }))

    const progress = getCollectionProgress(rewards, SEED_DISHES)
    expect(progress.unlocked).toBe(SEED_DISHES.length)
    expect(progress.percentage).toBe(100)
    expect(isCatalogComplete(rewards, SEED_DISHES)).toBe(true)
    expect(isCatalogComplete(rewards.slice(1), SEED_DISHES)).toBe(false)
  })
})

describe("reward presentation", () => {
  it("keeps the persisted chest reward hidden until reveal completes", () => {
    const existing = makeReward("existing")
    const pending = makeReward("pending")

    expect(getVisibleRewards([existing, pending], pending.id).map((reward) => reward.id)).toEqual([
      "existing",
    ])
    expect(getVisibleRewards([existing, pending], null)).toHaveLength(2)
  })
})
