import { describe, expect, it, vi } from "vitest"
import { applyCheckIn, canCheckIn } from "./checkIn"
import { buildPool, canOpenChest, applyOpenChest } from "./drawReward"
import { applyFuse, canFuse } from "./fuseRewards"
import { getDateKey } from "./dateKey"
import { RewardInstance, UserState } from "./models"
import { SEED_DISHES } from "../infrastructure/catalog/seedCatalog"
import localDishes from "../infrastructure/catalog/localDishes.json"
import { getAnnouncementEvent, getFeaturedEvents } from "./events"
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
  it("restores a missing streak and awards the third-day bonus", () => {
    const first = applyCheckIn(makeState({ checkInStreak: undefined, bestCheckInStreak: undefined }))
    expect(first.checkInStreak).toBe(1)
    expect(first.bestCheckInStreak).toBe(1)

    const yesterday = getDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000))
    const third = applyCheckIn(makeState({ lastCheckInDate: yesterday, checkInStreak: 2, bestCheckInStreak: 2 }))
    expect(third.checkInStreak).toBe(3)
    expect(third.keyTransactions.at(-1)?.amount).toBe(12)
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

describe("seasonal event announcements", () => {
  const catalog = SEED_DISHES

  it("prefers the event that started most recently when seasons overlap", () => {
    expect(getAnnouncementEvent(catalog, new Date("2027-01-04T05:00:00Z"))?.id).toBe("seoul-midnight")
    expect(getAnnouncementEvent(catalog, new Date("2027-02-07T05:00:00Z"))?.id).toBe("new-year-feast")
    expect(getAnnouncementEvent(catalog, new Date("2027-06-14T05:00:00Z"))?.id).toBe("cooling-summer")
    expect(getAnnouncementEvent(catalog, new Date("2027-08-14T05:00:00Z"))?.id).toBe("dolce-vita")
  })

  it("opens the Vietnamese Tết banner only from February 4 through February 16 in Vietnam", () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date("2027-02-03T16:59:59Z"))
      expect(buildPool(catalog, "dinner", [], "new-year-feast")).toHaveLength(0)
      vi.setSystemTime(new Date("2027-02-03T17:00:00Z"))
      expect(buildPool(catalog, "dinner", [], "new-year-feast").length).toBeGreaterThan(0)
      vi.setSystemTime(new Date("2027-02-16T16:59:59Z"))
      expect(buildPool(catalog, "dinner", [], "new-year-feast").length).toBeGreaterThan(0)
      vi.setSystemTime(new Date("2027-02-16T17:00:00Z"))
      expect(buildPool(catalog, "dinner", [], "new-year-feast")).toHaveLength(0)
      expect(canOpenChest(makeState({ keys: 1 }), catalog, "dinner", "new-year-feast")).toContain("Không có món")
    } finally {
      vi.useRealTimers()
    }
  })

  it("never mixes everyday dishes or another active event into a seasonal chest", () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date("2027-06-14T05:00:00Z"))
      const summer = buildPool(catalog, "lunch", [], "cooling-summer")
      const bangkok = buildPool(catalog, "lunch", [], "bangkok-street-heat")
      const normal = buildPool(catalog, "lunch", [])
      expect(summer.length).toBeGreaterThan(0)
      expect(bangkok.length).toBeGreaterThan(0)
      expect(summer.every((dish) => dish.limitedEventId === "cooling-summer" && dish.type === "limited")).toBe(true)
      expect(bangkok.every((dish) => dish.limitedEventId === "bangkok-street-heat" && dish.type === "limited")).toBe(true)
      expect(normal.every((dish) => dish.type === "normal")).toBe(true)
      expect(normal).toContainEqual(expect.objectContaining({ id: "bingsu" }))
      expect(normal.some((dish) => summer.some((eventDish) => eventDish.id === dish.id))).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe("fusion", () => {
  it("can produce an event-only dish during its season but refuses after expiry without consuming materials", () => {
    const state = makeState({ rewards: [makeReward("a"), makeReward("b"), makeReward("c")] })
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date("2027-02-07T05:00:00Z"))
      const result = applyFuse(state, SEED_DISHES, ["a", "b", "c"], "dinner", "new-year-feast")
      expect(result.reward.dishId).toBeDefined()
      expect(SEED_DISHES.find((dish) => dish.id === result.reward.dishId)?.limitedEventId).toBe("new-year-feast")
      vi.setSystemTime(new Date("2027-02-17T05:00:00Z"))
      expect(() => applyFuse(state, SEED_DISHES, ["a", "b", "c"], "dinner", "new-year-feast")).toThrow("Sự kiện đã kết thúc")
      expect(state.rewards.every((reward) => reward.status === "available")).toBe(true)
      expect(applyFuse(state, SEED_DISHES, ["a", "b", "c"], "dinner").reward.dishId).not.toBe(result.reward.dishId)
    } finally { vi.useRealTimers() }
  })
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
    expect(progress.unlocked).toBe(SEED_DISHES.filter((dish) => dish.type !== "limited").length)
    expect(progress.total).toBe(progress.unlocked)
    expect(progress.percentage).toBe(100)
    expect(isCatalogComplete(rewards, SEED_DISHES)).toBe(true)
    expect(isCatalogComplete(rewards.slice(1), SEED_DISHES)).toBe(false)
  })
  it("keeps the local Tây Bắc dishes out of normal chests and unlocks their event pool only in its date range", () => {
    const catalog = [...SEED_DISHES, ...localDishes] as typeof SEED_DISHES
    const event = getFeaturedEvents(catalog, new Date("2026-09-18T10:00:00+07:00")).find((item) => item.id === "taybac-festival")
    expect(event?.dishIds).toHaveLength(6)
    expect(event?.active).toBe(true)
    expect(buildPool(catalog, "lunch", []).every((dish) => dish.type !== "limited")).toBe(true)
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date("2026-09-18T10:00:00+07:00"))
      expect(buildPool(catalog, "lunch", [], "taybac-festival").some((dish) => dish.limitedEventId === "taybac-festival")).toBe(true)
      vi.setSystemTime(new Date("2026-09-20T10:00:00+07:00"))
      expect(buildPool(catalog, "lunch", [], "taybac-festival")).toHaveLength(0)
    } finally { vi.useRealTimers() }
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
