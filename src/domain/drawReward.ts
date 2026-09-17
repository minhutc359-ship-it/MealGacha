import { Dish, MealSlot, RewardInstance, KeyTransaction, UserState, DishSnapshot } from './models';
import { getDateKey } from './dateKey';

const CHEST_COST = parseInt(import.meta.env.VITE_CHEST_COST || '1', 10);
const RECENT_EXCLUSION = 3;

function secureRandom(): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] / (0xffffffff + 1);
}

export function drawWeighted(items: Dish[]): Dish {
  const normalized = items.map((x) => ({ ...x, weight: x.weight > 0 ? x.weight : 100 }));
  const total = normalized.reduce((sum, x) => sum + x.weight, 0);
  if (total <= 0) return normalized[Math.floor(secureRandom() * normalized.length)];
  let cursor = secureRandom() * total;
  for (const item of normalized) {
    cursor -= item.weight;
    if (cursor < 0) return item;
  }
  return normalized[normalized.length - 1];
}

export function buildPool(dishes: Dish[], slot: MealSlot, recentIds: string[]): Dish[] {
  let pool = dishes.filter((d) => d.active && d.mealSlots.includes(slot));
  if (pool.length >= 5) {
    const excluded = recentIds.slice(0, RECENT_EXCLUSION);
    const filtered = pool.filter((d) => !excluded.includes(d.id));
    if (filtered.length > 0) pool = filtered;
  }
  return pool;
}

export function canOpenChest(state: UserState, dishes: Dish[], slot: MealSlot): string | null {
  if (state.keys < CHEST_COST) return 'Không đủ chìa khóa. Hãy điểm danh để nhận thêm.';
  if (dishes.length === 0) return 'Dữ liệu món ăn chưa sẵn sàng.';
  const pool = buildPool(dishes, slot, state.recentDishIdsByMeal[slot] || []);
  if (pool.length === 0) return 'Không có món nào cho bữa này.';
  return null;
}

export function applyOpenChest(state: UserState, dishes: Dish[], slot: MealSlot): { state: UserState; reward: RewardInstance } {
  const pool = buildPool(dishes, slot, state.recentDishIdsByMeal[slot] || []);
  const dish = drawWeighted(pool);
  const now = new Date().toISOString();
  const rewardId = crypto.randomUUID();
  const snapshot: DishSnapshot = { id: dish.id, name: dish.name, searchQuery: dish.searchQuery, imageUrl: dish.imageUrl, category: dish.category };
  const reward: RewardInstance = {
    id: rewardId, dishId: dish.id, dish: snapshot, mealSlot: slot,
    source: 'chest', status: 'available', acquiredAt: now,
    acquiredDate: getDateKey(), favorite: false,
  };
  const tx: KeyTransaction = {
    id: crypto.randomUUID(), amount: -CHEST_COST,
    balanceAfter: state.keys - CHEST_COST, reason: 'chest_open',
    createdAt: now, referenceId: rewardId,
  };
  const recent = [dish.id, ...(state.recentDishIdsByMeal[slot] || [])].slice(0, 5);
  const newState: UserState = {
    ...state,
    keys: state.keys - CHEST_COST,
    rewards: [...state.rewards, reward],
    keyTransactions: [...state.keyTransactions, tx],
    recentDishIdsByMeal: { ...state.recentDishIdsByMeal, [slot]: recent },
    updatedAt: now,
  };
  return { state: newState, reward };
}
