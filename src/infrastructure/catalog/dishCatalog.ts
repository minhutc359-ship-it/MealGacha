import type { Dish } from "../../domain/models"
import { SEED_DISHES } from "./seedCatalog"
import { CURATED_NORMAL_DISHES, EVENT_DISHES } from "./eventCatalog"
import localDishes from "./localDishes.json"
import { enrichDish } from "./enrichDish"

// Both games consume the same food IDs, illustrations and event ownership.
const managedDishes = [
  ...CURATED_NORMAL_DISHES,
  ...EVENT_DISHES,
  ...(localDishes as Dish[]).map(enrichDish),
]
export const BUILT_IN_DISHES: Dish[] = [
  ...new Map(
    [...SEED_DISHES, ...managedDishes].map((dish) => [dish.id, dish]),
  ).values(),
]

export function mergeDishCatalog(source: Dish[] = []): Dish[] {
  // Old caches and partial CSVs must not hide foods added by an app update.
  const merged = new Map(BUILT_IN_DISHES.map((dish) => [dish.id, dish]))
  for (const dish of source) merged.set(dish.id, enrichDish(dish))
  // Preserve curated availability even if an old CSV assigns a different event.
  for (const dish of managedDishes) merged.set(dish.id, dish)
  return [...merged.values()]
}
