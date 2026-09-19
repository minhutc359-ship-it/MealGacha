import { describe, expect, it } from "vitest"
import { migrateUserState } from "../infrastructure/storage/repository"
import { getDailyQuestions, answerDailyQuestion } from "./dailyQuiz"
import { getEffectiveWeight, getDishRarity, buildPool } from "./drawReward"
import { SEED_DISHES } from "../infrastructure/catalog/seedCatalog"
import { TITLES, titleProgress, syncTitles } from "./titles"
import { getDateKey } from "./dateKey"
import { EVENTS } from "./events"
import { isCatalogComplete } from "./achievements"

function legacyState() {
  return {
    schemaVersion: 1,
    keys: 17,
    lastCheckInDate: "2026-01-01",
    rewards: [],
    fusions: [],
    keyTransactions: [],
    recentDishIdsByMeal: { breakfast: [], lunch: [], dinner: [] },
    preferences: { soundEnabled: false },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }
}

describe("UserState v2", () => {
  it("migrates a legacy profile without losing keys or history and is idempotent", () => {
    const old = legacyState()
    const state = migrateUserState(old)!
    expect(state.schemaVersion).toBe(2)
    expect(state.keys).toBe(17)
    expect(state.lastCheckInDate).toBe(old.lastCheckInDate)
    expect(state.timelinePosts).toEqual([])
    expect(state.unlockedTitleIds).toContain("newbie")
    expect(migrateUserState(state)).toEqual(state)
  })
  it("rejects invalid profiles", () => expect(migrateUserState({ schemaVersion: 1, keys: -1 })).toBeNull())
})

describe("daily quiz", () => {
  it("allows each question once per day and records only correct answers", () => {
    const date = getDateKey()
    const state = migrateUserState(legacyState())!
    const questions = getDailyQuestions(SEED_DISHES, date)
    expect(questions).toHaveLength(3)
    const first = answerDailyQuestion(state, questions[0], questions[0].answerId, date)
    expect(first.correct).toBe(true)
    expect(first.state.keys).toBe(18)
    expect(first.state.keyTransactions.at(-1)?.reason).toBe("daily_quiz")
    expect(answerDailyQuestion(first.state, questions[0], questions[0].answerId, date).error).toContain("đã trả lời")
    const wrong = questions[1].options.find((item) => item.id !== questions[1].answerId)!
    const second = answerDailyQuestion(first.state, questions[1], wrong.id, date)
    expect(second.state.keys).toBe(18)
  })
})

describe("title engine and taste weights", () => {
  it("counts distinct check-ins against a fixed title dataset and keeps an unlocked title", () => {
    const base = migrateUserState(legacyState())!
    const title = TITLES.find((item) => item.id === "hanoi")!
    const dish = title.eligibleDishIds[0]
    const state = { ...base, timelinePosts: [
      { id: "p1", dishId: dish, createdAt: new Date().toISOString() },
      { id: "p2", dishId: dish, createdAt: new Date().toISOString() },
    ] }
    const progress = titleProgress(title, state, SEED_DISHES)
    expect(progress.tasks[1].current).toBe(1)
    const retained = syncTitles({ ...base, unlockedTitleIds: ["newbie", "hanoi"] }, SEED_DISHES)
    expect(retained.unlockedTitleIds).toContain("hanoi")
    expect(title.eligibleDishIds).toHaveLength(8)
  })
  it("boosts weight by 0.5% per unique tag capped at 5%, preserving rarity", () => {
    const dish = SEED_DISHES.find((item) => item.id === "samgyeopsal")!
    const baseline = getEffectiveWeight(dish)
    const favorite = [...dish.tags, ...(dish.categories || [])]
    expect(getEffectiveWeight(dish, favorite)).toBeCloseTo(baseline * (1 + Math.min(new Set(favorite).size * .005, .05)))
    expect(getDishRarity(dish)).toBe("rare")
  })
})

describe("event catalog", () => {
  it("contains precisely the featured dishes without allowing limited dishes in normal chests", () => {
    const ids = new Set(SEED_DISHES.map((dish) => dish.id))
    expect(ids.size).toBe(SEED_DISHES.length)
    expect(EVENTS).toHaveLength(6)
    for (const event of EVENTS) {
      expect(event.dishIds).toHaveLength(event.id === "dolce-vita" ? 7 : 8)
      expect(event.dishIds.every((id) => ids.has(id))).toBe(true)
    }
    const normal = buildPool(SEED_DISHES, "dinner", [])
    expect(normal.every((dish) => dish.type !== "limited")).toBe(true)
  })
  it("keeps the unlimited chest milestone reachable without waiting for future events", () => {
    const base = migrateUserState(legacyState())!
    const normalRewards = SEED_DISHES.filter((dish) => dish.type !== "limited").map((dish) => ({
      id: dish.id, dishId: dish.id, dish: { id: dish.id, name: dish.name, searchQuery: dish.searchQuery },
      mealSlot: dish.mealSlots[0], source: "chest" as const, status: "available" as const,
      acquiredAt: base.createdAt, acquiredDate: base.createdAt.slice(0, 10), favorite: false,
    }))
    expect(isCatalogComplete(normalRewards, SEED_DISHES)).toBe(true)
  })
})
