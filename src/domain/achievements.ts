import type { Dish, MealSlot, RewardInstance, UserState } from "./models"

export function getUnlockedDishIds(
  rewards: RewardInstance[],
): Set<string> {
  return new Set(rewards.map((reward) => reward.dishId))
}

export function getActiveUniqueDishes(dishes: Dish[]): Dish[] {
  const unique = new Map<string, Dish>()
  dishes.filter((dish) => dish.active).forEach((dish) => unique.set(dish.id, dish))
  return [...unique.values()]
}

export function getBannerDishes(dishes: Dish[], slot: MealSlot): Dish[] {
  return getActiveUniqueDishes(dishes).filter((dish) => dish.type !== "limited" && dish.mealSlots.includes(slot))
}

export function getCollectionProgress(
  rewards: RewardInstance[],
  dishes: Dish[],
  slot?: MealSlot,
): { unlocked: number; total: number; percentage: number } {
  const pool = slot ? getBannerDishes(dishes, slot) : getActiveUniqueDishes(dishes)
  const unlockedIds = getUnlockedDishIds(rewards)
  const unlocked = pool.filter((dish) => unlockedIds.has(dish.id)).length
  const total = pool.length
  return {
    unlocked,
    total,
    percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
  }
}

export function isCatalogComplete(
  rewards: RewardInstance[],
  dishes: Dish[],
): boolean {
  const progress = getCollectionProgress(rewards, dishes)
  return progress.total > 0 && progress.unlocked === progress.total
}

export function hasUnlimitedChestAccess(
  state: UserState,
  dishes: Dish[],
): boolean {
  return Boolean(state.unlimitedChestUnlockedAt) || isCatalogComplete(state.rewards, dishes)
}

export interface ThemeProgress {
  id: string
  label: string
  unlocked: number
  total: number
  percentage: number
}

export function getThemeProgress(rewards: RewardInstance[], dishes: Dish[]): ThemeProgress[] {
  const unlockedIds = getUnlockedDishIds(rewards)
  const themes = new Map<string, Dish[]>()
  getActiveUniqueDishes(dishes).forEach((dish) => {
    const theme = dish.category || dish.tags[0] || "khac"
    themes.set(theme, [...(themes.get(theme) ?? []), dish])
  })
  return [...themes.entries()]
    .map(([id, pool]) => {
      const unlocked = pool.filter((dish) => unlockedIds.has(dish.id)).length
      return { id, label: id.replace(/[-_]/g, " "), unlocked, total: pool.length, percentage: Math.round((unlocked / pool.length) * 100) }
    })
    .sort((left, right) => right.percentage - left.percentage)
}

export function getAchievementProgress(state: UserState, _dishes: Dish[]): {
  opened: number
  fused: number
  streak: number
  quests: number
} {
  return {
    opened: getUnlockedDishIds(state.rewards).size,
    fused: state.fusions.length,
    streak: state.bestCheckInStreak,
    quests: state.keyTransactions.filter((tx) => tx.reason === "daily_quest").length,
  }
}
