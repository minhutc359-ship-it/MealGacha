import { UserState, RewardInstance, MealSlot, FusionTransaction, DishSnapshot } from './models';
import { Dish } from './models';
import { drawWeighted, buildPool } from './drawReward';
import { getDateKey } from './dateKey';

export function canFuse(rewards: RewardInstance[], ids: string[]): string | null {
  if (ids.length !== 3) return 'Chọn đúng 3 phần thưởng.';
  const selected = ids.map((id) => rewards.find((r) => r.id === id)).filter(Boolean) as RewardInstance[];
  if (selected.length !== 3) return 'Không tìm thấy phần thưởng.';
  if (selected.some((r) => r.status !== 'available')) return 'Chỉ ghép được phần thưởng chưa dùng.';
  const dates = new Set(selected.map((r) => r.acquiredDate));
  if (dates.size > 1) return 'Ba phần thưởng phải cùng ngày nhận.';
  return null;
}

export function applyFuse(
  state: UserState, dishes: Dish[], inputIds: [string, string, string], targetSlot: MealSlot
): { state: UserState; reward: RewardInstance } {
  const now = new Date().toISOString();
  const inputDishIds = inputIds.map((id) => state.rewards.find((r) => r.id === id)!.dishId);
  let pool = buildPool(dishes, targetSlot, []);
  const alternatives = pool.filter((d) => !inputDishIds.includes(d.id));
  const drawPool = alternatives.length > 0 ? alternatives : pool;
  const dish = drawWeighted(drawPool);
  const outId = crypto.randomUUID();
  const fusionId = crypto.randomUUID();
  const snapshot: DishSnapshot = { id: dish.id, name: dish.name, searchQuery: dish.searchQuery, imageUrl: dish.imageUrl, category: dish.category };
  const reward: RewardInstance = {
    id: outId, dishId: dish.id, dish: snapshot, mealSlot: targetSlot,
    source: 'fusion', status: 'available', acquiredAt: now,
    acquiredDate: getDateKey(), fusionId, favorite: false,
  };
  const fusion: FusionTransaction = {
    id: fusionId, inputRewardIds: inputIds, outputRewardId: outId,
    targetMealSlot: targetSlot, createdAt: now, createdDate: getDateKey(),
  };
  const newRewards = state.rewards.map((r) =>
    inputIds.includes(r.id) ? { ...r, status: 'consumed' as const, consumedAt: now, fusionId } : r
  );
  return {
    state: { ...state, rewards: [...newRewards, reward], fusions: [...state.fusions, fusion], updatedAt: now },
    reward,
  };
}
