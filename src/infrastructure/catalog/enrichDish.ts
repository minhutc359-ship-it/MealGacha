import type { Dish } from "../../domain/models"
import { getFoodAssetUrl } from "../assets/foodAssets"
import { getDishRarity } from "../../domain/drawReward"

const COUNTRY: Record<string, string> = {
  vietnamese: "VN", korean: "KR", japanese: "JP", chinese: "CN",
  thai: "TH", italian: "IT", french: "FR", american: "US", western: "US",
}
const HANOI_IDS = new Set(["pho-bo", "bun-cha", "banh-cuon", "xoi", "bun-rieu", "bun-moc", "chao-suon", "mien-ga"])

export function enrichDish(dish: Dish): Dish {
  const countryTag = dish.tags.find((tag) => COUNTRY[tag])
  const tags = [...dish.tags]
  if (HANOI_IDS.has(dish.id) && !tags.includes("hanoi")) tags.push("hanoi")
  const rarity = getDishRarity(dish)
  return {
    ...dish,
    tags,
    rarity,
    nameEn: dish.nameEn || dish.name,
    descriptionEn: dish.descriptionEn || dish.description || dish.name,
    country: dish.country || (countryTag ? COUNTRY[countryTag] : "VN"),
    region: dish.region || (HANOI_IDS.has(dish.id) ? "Hà Nội" : undefined),
    categories: dish.categories || [dish.category || "other"],
    baseWeight: dish.baseWeight ?? dish.weight,
    priceTier: dish.priceTier ?? (rarity === "diamond" ? 4 : rarity === "epic" ? 3 : rarity === "rare" ? 2 : 1),
    type: dish.type || "normal",
    imageUrl: dish.imageUrl || getFoodAssetUrl(dish.id, "full") || undefined,
    restaurantSearch: dish.restaurantSearch || { queries: [dish.searchQuery, dish.name] },
    fusion: dish.fusion || { enabled: true },
  }
}
