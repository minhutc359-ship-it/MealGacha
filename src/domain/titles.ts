import type { Dish, RewardRarity, UserState } from "./models"
import { EVENTS } from "./events"

export type RequirementType = "UNLOCK_DISH" | "UNLOCK_DISH_COUNT" | "UNLOCK_DISH_PERCENT" | "CHECKIN_DISH" | "CHECKIN_UNIQUE_COUNT" | "CHECKIN_PERCENT" | "FUSION_COUNT" | "RARITY_UNLOCK_COUNT" | "TAG_UNLOCK_COUNT" | "TAG_CHECKIN_COUNT" | "EVENT_COMPLETE"
export interface TitleRequirement {
  type: RequirementType
  target: number
  dishId?: string
  eventId?: string
  rarity?: RewardRarity
  tag?: string
  label: string
}
export interface TitleDefinition {
  id: string
  name: string
  description: string
  icon: string
  eligibleDishIds: string[]
  requirements: TitleRequirement[]
  reward: { background: string; effect: string }
}

export const TITLES: TitleDefinition[] = [
  { id: "newbie", name: "Người khám phá", description: "Hành trình vị giác bắt đầu từ một chiếc rương.", icon: "✦", eligibleDishIds: [], requirements: [], reward: { background: "starter", effect: "soft" } },
  { id: "hanoi", name: "Ăn sập Hà Nội", description: "Một chiếc bụng chưa đủ lớn để chứa cả Hà Nội.", icon: "🏯", eligibleDishIds: ["pho-bo", "bun-cha", "cha-ca-la-vong", "bun-thang", "banh-cuon", "xoi-xeo", "com-lang-vong", "ca-phe-trung"], requirements: [
    { type: "UNLOCK_DISH_PERCENT", target: 0.8, label: "Mở 80% món Hà Nội" },
    { type: "CHECKIN_PERCENT", target: 0.6, label: "Check-in 60% món Hà Nội" },
    { type: "FUSION_COUNT", target: 5, tag: "vietnamese", label: "Ghép 5 món Việt Nam" },
  ], reward: { background: "hanoi", effect: "gold" } },
  { id: "seoul", name: "Seoul Food Hunter", description: "Săn vị ngon trong đêm Seoul.", icon: "🌃", eligibleDishIds: ["tokbokki", "korean-fried-chicken", "samgyeopsal", "bibimbap", "jjajangmyeon", "kimchi-jjigae", "hotteok", "bingsu"], requirements: [
    { type: "UNLOCK_DISH_PERCENT", target: 0.8, label: "Mở 80% món Hàn" },
    { type: "TAG_CHECKIN_COUNT", target: 3, tag: "korean", label: "Check-in 3 món Hàn" },
  ], reward: { background: "seoul", effect: "neon" } },
  { id: "tokyo", name: "Tokyo Gourmet", description: "Từ ramen đến omakase, mọi chuyến đi đều có vị.", icon: "🏮", eligibleDishIds: ["sushi", "tonkotsu-ramen", "takoyaki", "okonomiyaki", "yakitori", "unagi-don", "tonkatsu", "matcha-parfait"], requirements: [
    { type: "UNLOCK_DISH_PERCENT", target: 0.8, label: "Mở 80% món Nhật" },
    { type: "TAG_CHECKIN_COUNT", target: 3, tag: "japanese", label: "Check-in 3 món Nhật" },
  ], reward: { background: "tokyo", effect: "lantern" } },
  { id: "diamond", name: "Thợ săn Kim cương", description: "Những món hiếm nhất cũng có ngày xuất hiện.", icon: "💎", eligibleDishIds: ["hanwoo-bbq", "omakase", "bistecca-fiorentina", "french-tasting", "haidilao-hotpot"], requirements: [
    { type: "RARITY_UNLOCK_COUNT", target: 5, rarity: "diamond", label: "Mở 5 món Kim cương khác nhau" },
  ], reward: { background: "diamond", effect: "prism" } },
  { id: "fusion", name: "Bậc thầy Dung hợp", description: "Ba món cũ mở ra một phép màu mới.", icon: "⚡", eligibleDishIds: [], requirements: [
    { type: "FUSION_COUNT", target: 20, label: "Dung hợp 20 lần" },
    { type: "UNLOCK_DISH_COUNT", target: 10, tag: "fusion-output", label: "Khám phá 10 món mới qua dung hợp" },
  ], reward: { background: "fusion", effect: "vortex" } },
]

export function evaluateRequirement(req: TitleRequirement, title: TitleDefinition, state: UserState, catalog: Dish[]): { current: number; target: number; complete: boolean } {
  const eligible = new Set(title.eligibleDishIds)
  const catalogMap = new Map(catalog.map((dish) => [dish.id, dish]))
  const unlocked = new Set(state.rewards.map((reward) => reward.dishId))
  const checkedIn = new Set(state.timelinePosts.map((post) => post.dishId))
  const within = (id: string) => eligible.size === 0 || eligible.has(id)
  const tagMatch = (id: string) => !req.tag || catalogMap.get(id)?.tags.includes(req.tag)
  let current = 0
  let target = req.target
  switch (req.type) {
    case "UNLOCK_DISH": current = unlocked.has(req.dishId || "") ? 1 : 0; break
    case "CHECKIN_DISH": current = checkedIn.has(req.dishId || "") ? 1 : 0; break
    case "UNLOCK_DISH_COUNT": current = new Set(state.rewards.filter((r) => within(r.dishId) && (req.tag === "fusion-output" ? r.source === "fusion" : tagMatch(r.dishId))).map((r) => r.dishId)).size; break
    case "CHECKIN_UNIQUE_COUNT": case "TAG_CHECKIN_COUNT": current = [...checkedIn].filter((id) => within(id) && tagMatch(id)).length; break
    case "TAG_UNLOCK_COUNT": current = [...unlocked].filter((id) => within(id) && tagMatch(id)).length; break
    case "RARITY_UNLOCK_COUNT": current = new Set(state.rewards.filter((r) => within(r.dishId) && (catalogMap.get(r.dishId)?.rarity ?? r.rarity) === req.rarity).map((r) => r.dishId)).size; break
    case "UNLOCK_DISH_PERCENT": target = Math.ceil(eligible.size * req.target); current = [...eligible].filter((id) => unlocked.has(id)).length; break
    case "CHECKIN_PERCENT": target = Math.ceil(eligible.size * req.target); current = [...eligible].filter((id) => checkedIn.has(id)).length; break
    case "FUSION_COUNT": current = state.fusions.filter((fusion) => !req.tag || tagMatch(state.rewards.find((r) => r.id === fusion.outputRewardId)?.dishId ?? "")).length; break
    case "EVENT_COMPLETE": {
      const event = EVENTS.find((item) => item.id === req.eventId)
      current = event && event.dishIds.every((id) => unlocked.has(id)) ? 1 : 0
      target = 1
      break
    }
  }
  return { current, target, complete: current >= target }
}

export function titleProgress(title: TitleDefinition, state: UserState, catalog: Dish[]) {
  const tasks = title.requirements.map((req) => ({ ...req, ...evaluateRequirement(req, title, state, catalog) }))
  return { tasks, complete: tasks.every((task) => task.complete), percentage: tasks.length ? Math.round(tasks.reduce((total, task) => total + Math.min(task.current / Math.max(task.target, 1), 1), 0) / tasks.length * 100) : 100 }
}

export function syncTitles(state: UserState, catalog: Dish[]): UserState {
  const earned = TITLES.filter((title) => titleProgress(title, state, catalog).complete).map((title) => title.id)
  const unlocked = [...new Set([...state.unlockedTitleIds, ...earned])]
  return unlocked.length === state.unlockedTitleIds.length ? state : { ...state, unlockedTitleIds: unlocked }
}
