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
  return getActiveUniqueDishes(dishes).filter((dish) => dish.mealSlots.includes(slot))
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
