import { CARD_MAP, CARDS } from "./catalog"
import type { Combatant, GameCard, RecipeId } from "./types"

export interface Recipe {
  id: RecipeId
  name: string
  subtitle: string
  color: string
  symbol: string
  foodIds: string[]
  finish: "heal" | "damage" | "buff" | "ward" | "draw"
  board?: "home" | "street" | "tet"
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
      "goi-cuon-tom-thit",
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
  {
    id: "coast", name: "Bến nước ký ức", subtitle: "Giữ nhịp · khóa đòn", color: "#83d8ed", symbol: "≈", board: "street",
    foodIds: ["pho-bo", "bun-rieu", "bun-ca", "bun-thang", "mi-van-than", "banh-da-cua"], finish: "draw",
    reward: "Đóng băng quân địch có công cao nhất, bỏ đòn đánh lượt kế tiếp. Nếu không có địch, rút 1 lá.",
    flavor: "Con đò chờ người chậm bước, để mọi người cùng về một bến.",
  },
  {
    id: "garden", name: "Vườn sau cơn mưa", subtitle: "Nuôi quân · phản công", color: "#a7e591", symbol: "❧", board: "home",
    foodIds: ["goi-cuon-tom-thit", "nom-sua-xoai", "dua-hanh", "som-tam", "banner-tay-bac-goi-rau-don"], finish: "heal",
    reward: "Hồi 2 máu cho mọi đồng minh; quân ít máu nhất nhận +1 công.",
    flavor: "Gánh rau từ vườn nhỏ nuôi cả một bàn người xa lạ.",
  },
  {
    id: "moon", name: "Đêm rước đèn", subtitle: "Dệt khiên · giữ bài", color: "#ddb0ee", symbol: "☾", board: "tet",
    foodIds: ["xoi", "che-lam", "che-buoi", "che-khuc-bach", "banh-com-hang-than", "banh-it-la-gai"], finish: "ward",
    reward: "Mọi đồng minh nhận 1 chắn, rút 1 lá.",
    flavor: "Ánh đèn của người đi trước giúp những bước chân nhỏ tìm đường.",
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
