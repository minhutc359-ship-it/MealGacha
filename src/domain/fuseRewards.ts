import {
  UserState,
  RewardInstance,
  MealSlot,
  FusionTransaction,
  DishSnapshot,
} from "./models"
import { Dish } from "./models"
import { drawWeighted, buildPool, getDishRarity } from "./drawReward"
import { getDateKey } from "./dateKey"
import { hasUnlimitedChestAccess, isCatalogComplete } from "./achievements"

export function canFuse(
  rewards: RewardInstance[],
  ids: string[],
): string | null {
  if (ids.length !== 3) return "Chọn đúng 3 phần thưởng."
  if (new Set(ids).size !== 3) return "Cần chọn 3 phần thưởng khác nhau."
  const selected = ids
    .map((id) => rewards.find((r) => r.id === id))
    .filter(Boolean) as RewardInstance[]
  if (selected.length !== 3) return "Không tìm thấy phần thưởng."
  if (selected.some((r) => r.status !== "available"))
    return "Chỉ ghép được phần thưởng chưa dùng."
  const dates = new Set(selected.map((r) => r.acquiredDate))
  if (dates.size > 1) return "Ba phần thưởng phải cùng ngày nhận."
  return null
}

export function applyFuse(
  state: UserState,
  dishes: Dish[],
  inputIds: [string, string, string],
  targetSlot: MealSlot,
): { state: UserState; reward: RewardInstance; unlockedUnlimited: boolean } {
  const now = new Date().toISOString()
  const inputDishIds = inputIds.map(
    (id) => state.rewards.find((r) => r.id === id)!.dishId,
  )
  let pool = buildPool(dishes, targetSlot, [])
  const alternatives = pool.filter((d) => !inputDishIds.includes(d.id))
  const preferredPool = alternatives.filter(
    (dish) => getDishRarity(dish) !== "common",
  )
  const drawPool = preferredPool.length > 0
    ? preferredPool
    : alternatives.length > 0
      ? alternatives
      : pool
  const dish = drawWeighted(drawPool, state.favoriteTasteTags)
  const outId = crypto.randomUUID()
  const fusionId = crypto.randomUUID()
  const snapshot: DishSnapshot = {
    id: dish.id,
    name: dish.name,
    searchQuery: dish.searchQuery,
    imageUrl: dish.imageUrl,
    category: dish.category,
  }
  const reward: RewardInstance = {
    id: outId,
    dishId: dish.id,
    dish: snapshot,
    mealSlot: targetSlot,
    source: "fusion",
    status: "available",
    acquiredAt: now,
    acquiredDate: getDateKey(),
    fusionId,
    favorite: false,
    rarity: getDishRarity(dish),
  }
  const fusion: FusionTransaction = {
    id: fusionId,
    inputRewardIds: inputIds,
    outputRewardId: outId,
    targetMealSlot: targetSlot,
    createdAt: now,
    createdDate: getDateKey(),
  }
  const newRewards = state.rewards.map((r) =>
    inputIds.includes(r.id)
      ? { ...r, status: "consumed" as const, consumedAt: now, fusionId }
      : r,
  )
  const rewards = [...newRewards, reward]
  const duplicate = state.rewards.some((item) => item.dishId === dish.id)
  const unlimitedBeforeFuse = hasUnlimitedChestAccess(state, dishes)
  const completedNow = isCatalogComplete(rewards, dishes)
  return {
    state: {
      ...state,
      rewards,
      fragments: duplicate ? { ...state.fragments, [dish.id]: (state.fragments[dish.id] || 0) + 1 } : state.fragments,
      fusions: [...state.fusions, fusion],
      unlimitedChestUnlockedAt:
        state.unlimitedChestUnlockedAt ?? (completedNow ? now : undefined),
      updatedAt: now,
    },
    reward,
    unlockedUnlimited: !unlimitedBeforeFuse && completedNow,
  }
}
