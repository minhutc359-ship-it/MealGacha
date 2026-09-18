import {
  Dish,
  MealSlot,
  RewardInstance,
  KeyTransaction,
  UserState,
  DishSnapshot,
  RewardRarity,
} from "./models"
import { getDateKey, isGoldenHour } from "./dateKey"
import { hasUnlimitedChestAccess, isCatalogComplete } from "./achievements"

const CHEST_COST = parseInt(import.meta.env.VITE_CHEST_COST || "1", 10)
const RECENT_EXCLUSION = 3
export const FREE_CHEST_COST = 0
export const DUPLICATE_SHARD_VALUES: Record<RewardRarity, number> = {
  common: 2,
  rare: 5,
  epic: 15,
  diamond: 40,
}

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

export function drawWeighted(items: Dish[]): Dish {
  const normalized = items.map((x) => ({
    ...x,
    weight: x.weight > 0 ? x.weight : 100,
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
): Dish[] {
  let pool = dishes.filter((d) => d.active && d.mealSlots.includes(slot))
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
): string | null {
  if (!hasUnlimitedChestAccess(state, dishes) && state.keys < CHEST_COST)
    return "Không đủ chìa khóa. Hãy điểm danh để nhận thêm."
  if (dishes.length === 0) return "Dữ liệu món ăn chưa sẵn sàng."
  const pool = buildPool(dishes, slot, state.recentDishIdsByMeal[slot] || [])
  if (pool.length === 0) return "Không có món nào cho bữa này."
  return null
}

export function canClaimFreeChest(state: UserState): boolean {
  return state.lastFreeChestDate !== getDateKey()
}

export function canConvertDuplicate(state: UserState, rewardId: string): boolean {
  const reward = state.rewards.find((item) => item.id === rewardId)
  return Boolean(reward && reward.status === "available" && !reward.convertedAt &&
    state.rewards.some((item) => item.id !== rewardId && item.dishId === reward.dishId))
}

export function applyConvertDuplicate(state: UserState, rewardId: string): UserState {
  if (!canConvertDuplicate(state, rewardId)) return state
  const reward = state.rewards.find((item) => item.id === rewardId)!
  const amount = DUPLICATE_SHARD_VALUES[reward.rarity ?? "common"]
  const now = new Date().toISOString()
  return {
    ...state,
    shards: state.shards + amount,
    rewards: state.rewards.map((item) => item.id === rewardId
      ? { ...item, status: "consumed", consumedAt: now, convertedAt: now }
      : item),
    updatedAt: now,
  }
}

export function applyShardExchange(state: UserState, shardCost: number): UserState {
  if (shardCost <= 0 || state.shards < shardCost) return state
  const now = new Date().toISOString()
  const keys = Math.floor(shardCost / 10)
  if (keys <= 0) return state
  const tx: KeyTransaction = {
    id: crypto.randomUUID(),
    amount: keys,
    balanceAfter: state.keys + keys,
    reason: "shard_exchange",
    createdAt: now,
  }
  return {
    ...state,
    shards: state.shards - keys * 10,
    keys: state.keys + keys,
    keyTransactions: [...state.keyTransactions, tx],
    updatedAt: now,
  }
}

export function applyOpenChest(
  state: UserState,
  dishes: Dish[],
  slot: MealSlot,
  options: { free?: boolean } = {},
): {
  state: UserState
  reward: RewardInstance
  unlockedUnlimited: boolean
} {
  const pool = buildPool(dishes, slot, state.recentDishIdsByMeal[slot] || [])
  const pityPool = state.pityCount >= 9
    ? pool.filter((item) => ["epic", "diamond"].includes(getDishRarity(item)))
    : state.pityCount >= 4
      ? pool.filter((item) => ["rare", "epic", "diamond"].includes(getDishRarity(item)))
      : []
  const goldenPool = pool.filter((item) => ["rare", "epic", "diamond"].includes(getDishRarity(item)))
  const boostedPool = isGoldenHour() && goldenPool.length > 0 && secureRandom() < 0.25
    ? goldenPool
    : pool
  const dish = drawWeighted(pityPool.length > 0 ? pityPool : boostedPool)
  const now = new Date().toISOString()
  const unlimitedBeforeDraw = hasUnlimitedChestAccess(state, dishes)
  const free = options.free === true
  const cost = unlimitedBeforeDraw || free ? 0 : CHEST_COST
  const rewardId = crypto.randomUUID()
  const snapshot: DishSnapshot = {
    id: dish.id,
    name: dish.name,
    searchQuery: dish.searchQuery,
    imageUrl: dish.imageUrl,
    category: dish.category,
    priceTier: dish.priceTier,
  }
  const reward: RewardInstance = {
    id: rewardId,
    dishId: dish.id,
    dish: snapshot,
    mealSlot: slot,
    source: free ? "free_chest" : "chest",
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
    reason: free ? "free_chest" : "chest_open",
    createdAt: now,
    referenceId: rewardId,
  }
  const recent = [dish.id, ...(state.recentDishIdsByMeal[slot] || [])].slice(
    0,
    5,
  )
  const rewards = [...state.rewards, reward]
  const completedNow = isCatalogComplete(rewards, dishes)
  const unlockedUnlimited = !unlimitedBeforeDraw && completedNow
  const newState: UserState = {
    ...state,
    keys: state.keys - cost,
    pityCount:
      getDishRarity(dish) === "common" || getDishRarity(dish) === "rare"
        ? state.pityCount + 1
        : 0,
    lastFreeChestDate: free ? getDateKey() : state.lastFreeChestDate,
    rewards,
    keyTransactions: cost > 0 ? [...state.keyTransactions, tx] : state.keyTransactions,
    recentDishIdsByMeal: { ...state.recentDishIdsByMeal, [slot]: recent },
    unlimitedChestUnlockedAt:
      state.unlimitedChestUnlockedAt ?? (completedNow ? now : undefined),
    updatedAt: now,
  }
  return { state: newState, reward, unlockedUnlimited }
}
