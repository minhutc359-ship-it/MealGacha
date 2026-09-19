import type { Dish, MealSlot, RewardRarity } from "../../domain/models"
import { enrichDish } from "./enrichDish"

// Each event-exclusive dish has its own generated illustration in /assets/food/full.
// Existing catalog dishes used by events retain their normal pool eligibility.
type Entry = [id: string, name: string, query: string, event: string, country: string, category: string, rarity: RewardRarity, slots: MealSlot[], tags: string[]]
const entries: Entry[] = [
  ["cha-ca-la-vong", "Chả cá Lã Vọng", "chả cá Lã Vọng", "hanoi-autumn", "VN", "seafood", "epic", ["lunch", "dinner"], ["vietnamese", "hanoi", "seafood", "hot"]],
  ["bun-thang", "Bún thang", "bún thang Hà Nội", "hanoi-autumn", "VN", "noodle", "epic", ["breakfast", "lunch"], ["vietnamese", "hanoi", "noodle"]],
  ["xoi-xeo", "Xôi xéo", "xôi xéo Hà Nội", "hanoi-autumn", "VN", "rice", "common", ["breakfast"], ["vietnamese", "hanoi", "rice", "breakfast"]],
  ["com-lang-vong", "Cốm Làng Vòng", "cốm Làng Vòng", "hanoi-autumn", "VN", "dessert", "rare", ["breakfast", "lunch", "dinner"], ["vietnamese", "hanoi", "dessert"]],
  ["ca-phe-trung", "Cà phê trứng", "cà phê trứng Hà Nội", "hanoi-autumn", "VN", "drink", "diamond", ["breakfast", "lunch", "dinner"], ["vietnamese", "hanoi", "occasion"]],
  ["korean-fried-chicken", "Gà rán Hàn Quốc", "Korean fried chicken gà rán Hàn Quốc", "seoul-midnight", "KR", "fried", "rare", ["lunch", "dinner"], ["korean", "seoul", "fried"]],
  ["jjajangmyeon", "Mì tương đen Jjajangmyeon", "jjajangmyeon mì tương đen", "seoul-midnight", "KR", "noodle", "rare", ["lunch", "dinner"], ["korean", "seoul", "noodle"]],
  ["kimchi-jjigae", "Canh kimchi Jjigae", "kimchi jjigae", "seoul-midnight", "KR", "soup", "rare", ["lunch", "dinner"], ["korean", "seoul", "spicy", "hot"]],
  ["hotteok", "Bánh Hotteok", "bánh hotteok Hàn Quốc", "seoul-midnight", "KR", "bakery", "common", ["breakfast", "lunch", "dinner"], ["korean", "seoul", "sweet", "bakery"]],
  ["bingsu", "Bingsu", "bingsu Hàn Quốc", "seoul-midnight", "KR", "dessert", "epic", ["lunch", "dinner"], ["korean", "seoul", "sweet", "dessert"]],
  ["tonkotsu-ramen", "Tonkotsu Ramen", "tonkotsu ramen", "tokyo-matsuri", "JP", "noodle", "rare", ["lunch", "dinner"], ["japanese", "tokyo", "noodle", "hot"]],
  ["takoyaki", "Takoyaki", "takoyaki Nhật Bản", "tokyo-matsuri", "JP", "seafood", "common", ["lunch", "dinner"], ["japanese", "tokyo", "seafood"]],
  ["okonomiyaki", "Okonomiyaki", "okonomiyaki Nhật Bản", "tokyo-matsuri", "JP", "grilled", "rare", ["lunch", "dinner"], ["japanese", "tokyo", "grilled"]],
  ["yakitori", "Yakitori", "yakitori Nhật Bản", "tokyo-matsuri", "JP", "grilled", "common", ["lunch", "dinner"], ["japanese", "tokyo", "grilled"]],
  ["tonkatsu", "Tonkatsu", "tonkatsu Nhật Bản", "tokyo-matsuri", "JP", "fried", "rare", ["lunch", "dinner"], ["japanese", "tokyo", "fried"]],
  ["matcha-parfait", "Matcha Parfait", "matcha parfait Nhật Bản", "tokyo-matsuri", "JP", "dessert", "epic", ["lunch", "dinner"], ["japanese", "tokyo", "dessert", "sweet"]],
  ["som-tam", "Gỏi đu đủ Som Tam", "som tam Thai", "bangkok-street-heat", "TH", "salad", "common", ["lunch", "dinner"], ["thai", "spicy", "light"]],
  ["pad-kra-pao", "Cơm húng quế Pad Kra Pao", "pad kra pao Thai", "bangkok-street-heat", "TH", "rice", "rare", ["lunch", "dinner"], ["thai", "spicy", "rice"]],
  ["boat-noodles", "Mì thuyền Boat Noodles", "Thai boat noodles", "bangkok-street-heat", "TH", "noodle", "rare", ["lunch", "dinner"], ["thai", "noodle", "hot"]],
  ["green-curry", "Cà ri xanh", "Thai green curry", "bangkok-street-heat", "TH", "curry", "epic", ["lunch", "dinner"], ["thai", "spicy", "hot"]],
  ["moo-ping", "Thịt xiên Moo Ping", "moo ping Thai grilled pork", "bangkok-street-heat", "TH", "grilled", "common", ["lunch", "dinner"], ["thai", "grilled"]],
  ["carbonara", "Carbonara", "spaghetti carbonara", "dolce-vita", "IT", "pasta", "rare", ["lunch", "dinner"], ["italian", "noodle"]],
  ["ossobuco", "Ossobuco", "ossobuco Italian", "dolce-vita", "IT", "meat", "diamond", ["dinner"], ["italian", "premium", "occasion"]],
  ["tiramisu", "Tiramisu", "tiramisu Italian", "dolce-vita", "IT", "dessert", "epic", ["lunch", "dinner"], ["italian", "dessert", "sweet"]],
  ["gelato", "Gelato", "gelato Italian", "dolce-vita", "IT", "dessert", "common", ["lunch", "dinner"], ["italian", "dessert", "sweet"]],
  ["roast-turkey", "Gà tây quay", "roast turkey Christmas", "christmas-feast", "US", "roast", "epic", ["lunch", "dinner"], ["western", "occasion", "baked"]],
  ["beef-wellington", "Beef Wellington", "beef Wellington restaurant", "christmas-feast", "FR", "meat", "diamond", ["dinner"], ["western", "fine-dining", "premium", "occasion"]],
  ["honey-glazed-ham", "Thịt nguội nướng mật ong", "honey glazed ham", "christmas-feast", "US", "roast", "epic", ["lunch", "dinner"], ["western", "occasion", "baked"]],
  ["mashed-potato", "Khoai tây nghiền", "mashed potato", "christmas-feast", "US", "side", "common", ["lunch", "dinner"], ["western", "occasion"]],
  ["gingerbread", "Bánh gừng", "gingerbread cookies", "christmas-feast", "US", "bakery", "rare", ["breakfast", "lunch", "dinner"], ["western", "occasion", "sweet", "bakery"]],
  ["christmas-pudding", "Christmas Pudding", "Christmas pudding", "christmas-feast", "US", "dessert", "epic", ["lunch", "dinner"], ["western", "occasion", "dessert"]],
  ["yule-log", "Bánh khúc cây Yule Log", "Yule log cake bûche de Noël", "christmas-feast", "FR", "dessert", "epic", ["lunch", "dinner"], ["french", "occasion", "dessert"]],
  ["hot-chocolate", "Sô cô la nóng", "hot chocolate Christmas", "christmas-feast", "US", "drink", "common", ["breakfast", "lunch", "dinner"], ["western", "occasion", "sweet", "hot"]],
]

const weightByRarity: Record<RewardRarity, number> = { common: 100, rare: 55, epic: 24, diamond: 7 }

export const EVENT_DISHES: Dish[] = entries.map(([id, name, searchQuery, limitedEventId, country, category, rarity, mealSlots, tags]) => enrichDish({
  id, name, nameEn: name, description: `${name} đặc trưng của banner sự kiện.`, searchQuery, mealSlots, category,
  tags, weight: weightByRarity[rarity], rarity, active: true, country, type: "limited", limitedEventId,
  imageUrl: `/assets/food/full/${id}.webp`,
}))
