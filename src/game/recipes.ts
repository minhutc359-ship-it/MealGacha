import { CARD_MAP, CARDS } from "./catalog"
import type { Combatant, GameCard, RecipeId } from "./types"

export interface Recipe {
  id: RecipeId
  name: string
  subtitle: string
  color: string
  symbol: string
  foodIds: string[]
  finish: "heal" | "damage" | "buff" | "ward"
  reward: string
  flavor: string
}
export const RECIPES: Recipe[] = [
  {
    id: "home",
    name: "Bữa cơm nhà",
    subtitle: "Ấm bàn · giữ người",
    color: "#9bcea6",
    symbol: "❧",
    foodIds: [
      "pho-bo",
      "com-tam",
      "com-rang",
      "xoi-man",
      "banh-cuon",
      "bun-rieu",
      "bun-cha",
      "com-ga",
    ],
    finish: "heal",
    reward: "Hồi 3 ý chí; mọi đồng minh nhận 1 chắn.",
    flavor: "Một chén canh nóng là lời mời người đi xa ngồi lại.",
  },
  {
    id: "street",
    name: "Quà phố",
    subtitle: "Nhịp phố · mở đường",
    color: "#6ec7de",
    symbol: "◈",
    foodIds: [
      "banh-mi",
      "pho-bo",
      "bun-cha",
      "banh-xeo",
      "banh-khot",
      "goi-cuon",
      "banh-cuon",
      "bun-bo-hue",
    ],
    finish: "damage",
    reward: "Gây 1 sát thương chủ tướng địch; rút 1 lá.",
    flavor: "Tiếng rao nối quán nhỏ với bước chân của cả thành phố.",
  },
  {
    id: "tet",
    name: "Bếp Tết sum vầy",
    subtitle: "Nêm bếp · dựng bàn",
    color: "#e6ba72",
    symbol: "⬡",
    foodIds: [
      "banh-chung",
      "banh-tet",
      "xoi-gac",
      "dua-hanh",
      "thit-kho",
      "gio-lua",
      "com-tam",
      "xoi-man",
      "banh-mi",
    ],
    finish: "buff",
    reward: "Mọi đồng minh +1 công và 1 chắn.",
    flavor: "Mỗi nhà một công thức; ai đến cũng có một chỗ bên bếp.",
  },
]
export const RECIPE_MAP = Object.fromEntries(
  RECIPES.map((r) => [r.id, r]),
) as Record<RecipeId, Recipe>
export function recipeAnchors(recipe: Recipe) {
  return recipe.foodIds.filter((id) => CARD_MAP[id]?.kind === "unit")
}
export function finishesRecipe(card: GameCard, recipe: Recipe) {
  return (
    card.kind === "spell" &&
    (card.effect === recipe.finish ||
      (recipe.id === "tet" && card.effect === "ward"))
  )
}
export function recipesForCard(card: GameCard) {
  return RECIPES.filter(
    (r) => r.foodIds.includes(card.id) || finishesRecipe(card, r),
  )
}
export function recipeReady(p: Combatant, card: GameCard) {
  const previous = p.recipeTrail?.[p.recipeTrail.length - 1]
  return RECIPES.find(
    (r) =>
      !(p.recipesUsed ?? []).includes(r.id) &&
      r.foodIds.includes(previous ?? "") &&
      finishesRecipe(card, r),
  )
}
export function recipeCoverage(ids: string[]) {
  return RECIPES.map((recipe) => ({
    recipe,
    anchors: ids.filter((id) => recipe.foodIds.includes(id)),
    finishers: ids.filter(
      (id) => CARD_MAP[id] && finishesRecipe(CARD_MAP[id], recipe),
    ),
  }))
}
export function recipeFinishers(recipe: Recipe) {
  return CARDS.filter((c) => finishesRecipe(c, recipe))
}
