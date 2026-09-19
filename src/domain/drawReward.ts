import {
  Dish,
  MealSlot,
  RewardInstance,
  KeyTransaction,
  UserState,
  DishSnapshot,
  RewardRarity,
} from "./models"
import { getDateKey } from "./dateKey"
import { hasUnlimitedChestAccess, isCatalogComplete } from "./achievements"
import { EVENTS, isEventActive } from "./events"

const CHEST_COST = parseInt(import.meta.env.VITE_CHEST_COST || "1", 10)
const RECENT_EXCLUSION = 3

function secureRandom(): number {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return arr[0] / (0xffffffff + 1)
}

export function drawRarity(fusion = false): RewardRarity {
  const roll = secureRandom()
  if (fusion) {
    if (roll < 0.03) return "diamond"
    return roll < 0.25 ? "epic" : "rare"
  }
  if (roll < 0.01) return "diamond"
  if (roll < 0.07) return "epic"
  if (roll < 0.29) return "rare"
  return "common"
}

export function getDishRarity(dish: Dish): RewardRarity {
  if (dish.rarity) return dish.rarity
  if (dish.weight <= 12) return "diamond"
  if (dish.weight <= 35) return "epic"
  if (dish.weight <= 70) return "rare"
  return "common"
}

export function getEffectiveWeight(dish: Dish, favoriteTags: string[] = []): number {
  const matches = new Set([...dish.tags, ...(dish.categories ?? [])]).size > 0
    ? [...new Set([...dish.tags, ...(dish.categories ?? [])])].filter((tag) => favoriteTags.includes(tag)).length
    : 0
  return (dish.baseWeight ?? dish.weight) * (1 + Math.min(matches * 0.005, 0.05))
}

export function drawWeighted(items: Dish[], favoriteTags: string[] = []): Dish {
  const normalized = items.map((x) => ({
    ...x,
    weight: getEffectiveWeight(x, favoriteTags) > 0 ? getEffectiveWeight(x, favoriteTags) : 100,
  }))
  const total = normalized.reduce((sum, x) => sum + x.weight, 0)
  if (total <= 0)
    return normalized[Math.floor(secureRandom() * normalized.length)]
  let cursor = secureRandom() * total
  for (const item of normalized) {
    cursor -= item.weight
    if (cursor < 0) return item
  }
  return normalized[normalized.length - 1]
}

export function buildPool(
  dishes: Dish[],
  slot: MealSlot,
  recentIds: string[],
  eventId?: string,
): Dish[] {
  let pool = dishes.filter((d) => d.active && d.mealSlots.includes(slot))
  if (eventId) {
    const event = EVENTS.find((item) => item.id === eventId)
    if (!event || !isEventActive(event, getDateKey())) return []
    pool = pool.filter((dish) => event.dishIds.includes(dish.id))
  } else pool = pool.filter((dish) => dish.type !== "limited")
  if (pool.length >= 5) {
    const excluded = recentIds.slice(0, RECENT_EXCLUSION)
    const filtered = pool.filter((d) => !excluded.includes(d.id))
    if (filtered.length > 0) pool = filtered
  }
  return pool
}

export function canOpenChest(
  state: UserState,
  dishes: Dish[],
  slot: MealSlot,
  eventId?: string,
): string | null {
  if (!hasUnlimitedChestAccess(state, dishes) && state.keys < CHEST_COST)
    return "Không đủ chìa khóa. Hãy điểm danh để nhận thêm."
  if (dishes.length === 0) return "Dữ liệu món ăn chưa sẵn sàng."
  const pool = buildPool(dishes, slot, state.recentDishIdsByMeal[slot] || [], eventId)
  if (pool.length === 0) return "Không có món nào cho bữa này."
  return null
}

export function applyOpenChest(
  state: UserState,
  dishes: Dish[],
  slot: MealSlot,
  eventId?: string,
): {
  state: UserState
  reward: RewardInstance
  unlockedUnlimited: boolean
} {
  const pool = buildPool(dishes, slot, state.recentDishIdsByMeal[slot] || [], eventId)
  const dish = drawWeighted(pool, state.favoriteTasteTags)
  const now = new Date().toISOString()
  const unlimitedBeforeDraw = hasUnlimitedChestAccess(state, dishes)
  const cost = unlimitedBeforeDraw ? 0 : CHEST_COST
  const rewardId = crypto.randomUUID()
  const snapshot: DishSnapshot = {
    id: dish.id,
    name: dish.name,
    searchQuery: dish.searchQuery,
    imageUrl: dish.imageUrl,
    category: dish.category,
  }
  const reward: RewardInstance = {
    id: rewardId,
    dishId: dish.id,
    dish: snapshot,
    mealSlot: slot,
    source: "chest",
    status: "available",
    acquiredAt: now,
    acquiredDate: getDateKey(),
    favorite: false,
    rarity: getDishRarity(dish),
  }
  const tx: KeyTransaction = {
    id: crypto.randomUUID(),
    amount: -cost,
    balanceAfter: state.keys - cost,
    reason: "chest_open",
    createdAt: now,
    referenceId: rewardId,
  }
  const recent = [dish.id, ...(state.recentDishIdsByMeal[slot] || [])].slice(
    0,
    5,
  )
  const rewards = [...state.rewards, reward]
  const duplicate = state.rewards.some((item) => item.dishId === dish.id)
  const completedNow = isCatalogComplete(rewards, dishes)
  const unlockedUnlimited = !unlimitedBeforeDraw && completedNow
  const newState: UserState = {
    ...state,
    keys: state.keys - cost,
    rewards,
    fragments: duplicate ? { ...state.fragments, [dish.id]: (state.fragments[dish.id] || 0) + 1 } : state.fragments,
    keyTransactions: cost > 0 ? [...state.keyTransactions, tx] : state.keyTransactions,
    recentDishIdsByMeal: { ...state.recentDishIdsByMeal, [slot]: recent },
    unlimitedChestUnlockedAt:
      state.unlimitedChestUnlockedAt ?? (completedNow ? now : undefined),
    updatedAt: now,
  }
  return { state: newState, reward, unlockedUnlimited }
}
