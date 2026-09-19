export type FoodImageVariant = "full" | "card" | "thumb"

export const FOOD_ASSET_IDS = [
  "pho-bo",
  "pho-ga",
  "bun-rieu",
  "bun-bo-hue",
  "banh-mi",
  "xoi",
  "banh-cuon",
  "chao-suon",
  "mien-ga",
  "bun-moc",
  "bun-cha",
  "bun-dau",
  "com-tam",
  "com-ga",
  "com-rang-dua-bo",
  "com-nieu",
  "banh-da-cua",
  "bun-ca",
  "mi-van-than",
  "mi-cay",
  "ga-ran",
  "pizza",
  "pasta",
  "sushi",
  "tokbokki",
  "lau-thai",
  "lau-rieu-cua",
  "nuong-bbq",
  "vit-quay",
  "banh-xeo",
  "bibimbap",
  "samgyeopsal",
  "hanwoo-bbq",
  "shoyu-ramen",
  "unagi-don",
  "omakase",
  "lasagna",
  "truffle-risotto",
  "bistecca-fiorentina",
  "croissant",
  "duck-confit",
  "french-tasting",
  "classic-burger",
  "smoked-brisket",
  "xiaolongbao",
  "peking-duck",
  "haidilao-hotpot",
  "pad-thai",
  "tom-yum-goong",
  "mango-sticky-rice",
  "cha-ca-la-vong", "bun-thang", "xoi-xeo", "com-lang-vong", "ca-phe-trung",
  "korean-fried-chicken", "jjajangmyeon", "kimchi-jjigae", "hotteok", "bingsu",
  "tonkotsu-ramen", "takoyaki", "okonomiyaki", "yakitori", "tonkatsu", "matcha-parfait",
  "som-tam", "pad-kra-pao", "boat-noodles", "green-curry", "moo-ping",
  "carbonara", "ossobuco", "tiramisu", "gelato",
  "roast-turkey", "beef-wellington", "honey-glazed-ham", "mashed-potato", "gingerbread", "christmas-pudding", "yule-log", "hot-chocolate",
] as const

const assetIds = new Set<string>(FOOD_ASSET_IDS)
const preloadedFoodAssets = new Map<string, HTMLImageElement>()

export function cacheFoodAsset(src: string, image?: HTMLImageElement): void {
  if (!src || preloadedFoodAssets.has(src)) return
  if (image) {
    preloadedFoodAssets.set(src, image)
    return
  }
  if (typeof Image === "undefined") return
  const preloader = new Image()
  preloadedFoodAssets.set(src, preloader)
  preloader.addEventListener("error", () => preloadedFoodAssets.delete(src), { once: true })
  preloader.src = src
}

export function hasFoodAsset(dishId: string): boolean {
  return assetIds.has(dishId)
}

export function getFoodAssetUrl(
  dishId: string,
  variant: FoodImageVariant = "card",
): string | null {
  if (!hasFoodAsset(dishId)) return null
  void variant
  return `/assets/food/full/${dishId}.webp`
}

export function preloadFoodAsset(
  dishId: string,
  variant: FoodImageVariant = "full",
): void {
  const src = getFoodAssetUrl(dishId, variant)
  if (!src || typeof Image === "undefined") return
  const image = new Image()
  image.decoding = "async"
  if (preloadedFoodAssets.has(src)) return
  preloadedFoodAssets.set(src, image)
  image.addEventListener("error", () => preloadedFoodAssets.delete(src), { once: true })
  image.src = src
}
