import { describe, expect, it } from "vitest"
import { applyCheckIn, canCheckIn } from "./checkIn"
import { applyDailyQuest, getDailyQuests } from "./dailyQuest"
import {
  applyConvertDuplicate,
  applyOpenChest,
  applyShardExchange,
  buildPool,
  canClaimFreeChest,
  canOpenChest,
} from "./drawReward"
import { applyFuse, canFuse } from "./fuseRewards"
import { getDateKey } from "./dateKey"
import { RewardInstance, UserState } from "./models"
import { SEED_DISHES } from "../infrastructure/catalog/seedCatalog"
import { getVisibleRewards } from "./rewardPresentation"
import { getWeeklyEvent, getWeeklyEventProgress } from "./weeklyEvent"
import {
  getCollectionProgress,
  isCatalogComplete,
} from "./achievements"

function makeState(overrides: Partial<UserState> = {}): UserState {
  const now = new Date().toISOString()
  return {
    schemaVersion: 1,
    keys: 0,
    checkInStreak: 0,
    bestCheckInStreak: 0,
    shards: 0,
    pityCount: 0,
    rewards: [],
    fusions: [],
    keyTransactions: [],
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

  it("tracks a consecutive streak and awards a milestone bonus", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })
    const state = makeState({
      keys: 0,
      lastCheckInDate: yesterday,
      checkInStreak: 2,
      bestCheckInStreak: 2,
    })
    const result = applyCheckIn(state)
    expect(result.checkInStreak).toBe(3)
    expect(result.keys).toBe(12)
  })
})

describe("daily food quest", () => {
  it("awards three keys per quest and cannot claim the same quest twice", () => {
    const state = makeState({ keys: 1 })
    const quests = getDailyQuests(SEED_DISHES, new Date("2026-09-18T10:00:00"))
    const result = applyDailyQuest(state, quests[0], quests[0].targetOptionId)

    expect(result.correct).toBe(true)
    expect(result.state.keys).toBe(4)
    expect(result.state.completedDailyQuestIds).toEqual([quests[0].id])
    expect(result.state.keyTransactions.at(-1)?.reason).toBe("daily_quest")
    expect(
      applyDailyQuest(result.state, quests[0], quests[0].targetOptionId).correct,
    ).toBe(false)

    const second = applyDailyQuest(
      result.state,
      quests[1],
      quests[1].targetOptionId,
    )
    expect(second.correct).toBe(true)
    expect(second.state.keys).toBe(7)
  })

  it("does not award keys for a wrong answer", () => {
    const state = makeState({ keys: 1 })
    const quest = getDailyQuests(SEED_DISHES, new Date("2026-09-18T10:00:00"))[0]
    const wrongOption = quest.options.find(
      (option) => option.id !== quest.targetOptionId,
    )!

    expect(applyDailyQuest(state, quest, wrongOption.id)).toEqual({
      state,
      correct: false,
    })
  })

  it("starts a fresh set of quests every three-hour cycle", () => {
    const morning = getDailyQuests(SEED_DISHES, new Date("2026-09-18T08:59:00"))
    const nextCycle = getDailyQuests(SEED_DISHES, new Date("2026-09-18T09:00:00"))
    expect(morning[0].cycle).not.toBe(nextCycle[0].cycle)
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

  it("allows one free chest per local day without spending keys", () => {
    const state = makeState({ keys: 0 })
    expect(canClaimFreeChest(state)).toBe(true)
    const result = applyOpenChest(state, SEED_DISHES, "lunch", { free: true })
    expect(result.state.keys).toBe(0)
    expect(result.state.lastFreeChestDate).toBe(getDateKey())
    expect(result.reward.source).toBe("free_chest")
    expect(canClaimFreeChest(result.state)).toBe(false)
  })

  it("converts a duplicate reward into shards and exchanges shards for keys", () => {
    const first = makeReward("first")
    const duplicate = { ...first, id: "duplicate", rarity: "rare" as const }
    const converted = applyConvertDuplicate(
      makeState({ rewards: [first, duplicate] }),
      duplicate.id,
    )
    expect(converted.shards).toBe(5)
    expect(converted.rewards.find((reward) => reward.id === duplicate.id)?.convertedAt).toBeTruthy()

    const exchanged = applyShardExchange({ ...converted, shards: 10 }, 10)
    expect(exchanged.shards).toBe(0)
    expect(exchanged.keys).toBe(1)
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

describe("weekly events", () => {
  it("rotates by week and reports themed collection progress", () => {
    const first = getWeeklyEvent(new Date("2026-09-18T10:00:00"))
    const next = getWeeklyEvent(new Date("2026-09-25T10:00:00"))
    expect(first.id).not.toBe(next.id)
    const progress = getWeeklyEventProgress([], SEED_DISHES, new Date("2026-09-18T10:00:00"))
    expect(progress.opened).toBe(0)
    expect(progress.percentage).toBe(0)
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
