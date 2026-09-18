import { getDateKey } from "./dateKey"
import { Dish, RewardInstance } from "./models"

const EVENT_THEMES = [
  { id: "noodle-week", label: "Tuần Hội Mì", filter: (dish: Dish) => dish.category === "noodle" },
  { id: "street-food-week", label: "Tuần Đường Phố", filter: (dish: Dish) => dish.tags.includes("vietnamese") },
  { id: "spicy-week", label: "Tuần Cay Nồng", filter: (dish: Dish) => dish.tags.includes("spicy") },
]

function weekIndex(date: Date): number {
  const day = new Date(`${getDateKey(date)}T00:00:00`).getTime()
  return Math.floor(day / (7 * 24 * 60 * 60 * 1000))
}

export function getWeeklyEvent(date: Date = new Date()) {
  return EVENT_THEMES[weekIndex(date) % EVENT_THEMES.length]
}

export function getWeeklyEventProgress(
  rewards: RewardInstance[],
  dishes: Dish[],
  date: Date = new Date(),
) {
  const event = getWeeklyEvent(date)
  const pool = dishes.filter((dish) => dish.active && event.filter(dish))
  const unlocked = new Set(rewards.map((reward) => reward.dishId))
  const opened = pool.filter((dish) => unlocked.has(dish.id)).length
  return {
    event,
    opened,
    total: pool.length,
    percentage: pool.length ? Math.round((opened / pool.length) * 100) : 0,
  }
}
