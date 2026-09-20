import type { Dish, MealSlot, RewardRarity } from "../../domain/models"
import { enrichDish } from "./enrichDish"

// null means a previously featured everyday dish now belongs to the regular meal pool.
// Event IDs are exclusive; every entry has its own food illustration.
type Entry = [id: string, name: string, query: string, event: string | null, country: string, category: string, rarity: RewardRarity, slots: MealSlot[], tags: string[]]
const entries: Entry[] = [
  ["cha-ca-la-vong", "Chả cá Lã Vọng", "chả cá Lã Vọng", "hanoi-autumn", "VN", "seafood", "epic", ["lunch", "dinner"], ["vietnamese", "hanoi", "seafood", "hot"]],
  ["bun-thang", "Bún thang", "bún thang Hà Nội", "hanoi-autumn", "VN", "noodle", "epic", ["breakfast", "lunch"], ["vietnamese", "hanoi", "noodle"]],
  ["xoi-xeo", "Xôi xéo", "xôi xéo Hà Nội", null, "VN", "rice", "common", ["breakfast"], ["vietnamese", "hanoi", "rice", "breakfast"]],
  ["com-lang-vong", "Cốm Làng Vòng", "cốm Làng Vòng", "hanoi-autumn", "VN", "dessert", "rare", ["breakfast", "lunch", "dinner"], ["vietnamese", "hanoi", "dessert"]],
  ["ca-phe-trung", "Cà phê trứng", "cà phê trứng Hà Nội", "hanoi-autumn", "VN", "drink", "diamond", ["breakfast", "lunch", "dinner"], ["vietnamese", "hanoi", "occasion"]],
  ["cha-ruoi", "Chả rươi", "chả rươi Hà Nội mùa thu", "hanoi-autumn", "VN", "grilled", "rare", ["lunch", "dinner"], ["vietnamese", "hanoi", "occasion"]],
  ["banh-com-hang-than", "Bánh cốm Hàng Than", "bánh cốm Hàng Than Hà Nội", "hanoi-autumn", "VN", "dessert", "rare", ["breakfast", "lunch", "dinner"], ["vietnamese", "hanoi", "dessert"]],
  ["korean-fried-chicken", "Gà rán Hàn Quốc", "Korean fried chicken gà rán Hàn Quốc", null, "KR", "fried", "rare", ["lunch", "dinner"], ["korean", "seoul", "fried"]],
  ["jjajangmyeon", "Mì tương đen Jjajangmyeon", "jjajangmyeon mì tương đen", "seoul-midnight", "KR", "noodle", "rare", ["lunch", "dinner"], ["korean", "seoul", "noodle"]],
  ["kimchi-jjigae", "Canh kimchi Jjigae", "kimchi jjigae", "seoul-midnight", "KR", "soup", "rare", ["lunch", "dinner"], ["korean", "seoul", "spicy", "hot"]],
  ["hotteok", "Bánh Hotteok", "bánh hotteok Hàn Quốc", "seoul-midnight", "KR", "bakery", "common", ["breakfast", "lunch", "dinner"], ["korean", "seoul", "sweet", "bakery"]],
  ["bingsu", "Bingsu", "bingsu Hàn Quốc", null, "KR", "dessert", "epic", ["lunch", "dinner"], ["korean", "seoul", "sweet", "dessert"]],
  ["ganjang-gejang", "Cua ngâm tương Ganjang Gejang", "ganjang gejang cua ngâm tương Hàn Quốc", "seoul-midnight", "KR", "seafood", "diamond", ["lunch", "dinner"], ["korean", "seoul", "seafood", "premium"]],
  ["gopchang-gui", "Lòng bò nướng Gopchang", "gopchang gui lòng bò nướng Hàn Quốc", "seoul-midnight", "KR", "grilled", "epic", ["dinner"], ["korean", "seoul", "grilled"]],
  ["sundae-guk", "Canh Sundae Guk", "sundae guk canh dồi Hàn Quốc", "seoul-midnight", "KR", "soup", "rare", ["breakfast", "lunch", "dinner"], ["korean", "seoul", "hot"]],
  ["tonkotsu-ramen", "Tonkotsu Ramen", "tonkotsu ramen", null, "JP", "noodle", "rare", ["lunch", "dinner"], ["japanese", "tokyo", "noodle", "hot"]],
  ["takoyaki", "Takoyaki", "takoyaki Nhật Bản", "tokyo-matsuri", "JP", "seafood", "common", ["lunch", "dinner"], ["japanese", "tokyo", "seafood"]],
  ["okonomiyaki", "Okonomiyaki", "okonomiyaki Nhật Bản", "tokyo-matsuri", "JP", "grilled", "rare", ["lunch", "dinner"], ["japanese", "tokyo", "grilled"]],
  ["yakitori", "Yakitori", "yakitori Nhật Bản", "tokyo-matsuri", "JP", "grilled", "common", ["lunch", "dinner"], ["japanese", "tokyo", "grilled"]],
  ["tonkatsu", "Tonkatsu", "tonkatsu Nhật Bản", "tokyo-matsuri", "JP", "fried", "rare", ["lunch", "dinner"], ["japanese", "tokyo", "fried"]],
  ["matcha-parfait", "Matcha Parfait", "matcha parfait Nhật Bản", "tokyo-matsuri", "JP", "dessert", "epic", ["lunch", "dinner"], ["japanese", "tokyo", "dessert", "sweet"]],
  ["taiyaki", "Bánh cá Taiyaki", "taiyaki bánh cá Nhật Bản", "tokyo-matsuri", "JP", "bakery", "rare", ["breakfast", "lunch", "dinner"], ["japanese", "tokyo", "bakery", "sweet"]],
  ["som-tam", "Gỏi đu đủ Som Tam", "som tam Thai", "bangkok-street-heat", "TH", "salad", "common", ["lunch", "dinner"], ["thai", "spicy", "light"]],
  ["pad-kra-pao", "Cơm húng quế Pad Kra Pao", "pad kra pao Thai", "bangkok-street-heat", "TH", "rice", "rare", ["lunch", "dinner"], ["thai", "spicy", "rice"]],
  ["boat-noodles", "Mì thuyền Boat Noodles", "Thai boat noodles", "bangkok-street-heat", "TH", "noodle", "rare", ["lunch", "dinner"], ["thai", "noodle", "hot"]],
  ["green-curry", "Cà ri xanh", "Thai green curry", "bangkok-street-heat", "TH", "curry", "epic", ["lunch", "dinner"], ["thai", "spicy", "hot"]],
  ["moo-ping", "Thịt xiên Moo Ping", "moo ping Thai grilled pork", "bangkok-street-heat", "TH", "grilled", "common", ["lunch", "dinner"], ["thai", "grilled"]],
  ["khao-soi", "Mì cà ri Khao Soi", "khao soi mì cà ri Thái Lan", "bangkok-street-heat", "TH", "noodle", "epic", ["lunch", "dinner"], ["thai", "noodle", "hot"]],
  ["carbonara", "Carbonara", "spaghetti carbonara", null, "IT", "pasta", "rare", ["lunch", "dinner"], ["italian", "noodle"]],
  ["ossobuco", "Ossobuco", "ossobuco Italian", "dolce-vita", "IT", "meat", "diamond", ["dinner"], ["italian", "premium", "occasion"]],
  ["tiramisu", "Tiramisu", "tiramisu Italian", "dolce-vita", "IT", "dessert", "epic", ["lunch", "dinner"], ["italian", "dessert", "sweet"]],
  ["gelato", "Gelato", "gelato Italian", null, "IT", "dessert", "common", ["lunch", "dinner"], ["italian", "dessert", "sweet"]],
  ["arancini", "Cơm viên Arancini", "arancini cơm viên chiên Ý", "dolce-vita", "IT", "rice", "rare", ["lunch", "dinner"], ["italian", "rice", "fried"]],
  ["saltimbocca", "Thịt bê Saltimbocca", "saltimbocca alla romana", "dolce-vita", "IT", "meat", "epic", ["dinner"], ["italian", "premium"]],
  ["pappardelle-cinghiale", "Pappardelle sốt lợn rừng", "pappardelle al cinghiale", "dolce-vita", "IT", "pasta", "epic", ["lunch", "dinner"], ["italian", "noodle", "premium"]],
  ["porchetta", "Heo quay Porchetta", "porchetta Ý", "dolce-vita", "IT", "roast", "rare", ["lunch", "dinner"], ["italian", "occasion"]],
  ["roast-turkey", "Gà tây quay", "roast turkey Christmas", "christmas-feast", "US", "roast", "epic", ["lunch", "dinner"], ["western", "occasion", "baked"]],
  ["beef-wellington", "Beef Wellington", "beef Wellington restaurant", "christmas-feast", "FR", "meat", "diamond", ["dinner"], ["western", "fine-dining", "premium", "occasion"]],
  ["honey-glazed-ham", "Thịt nguội nướng mật ong", "honey glazed ham", "christmas-feast", "US", "roast", "epic", ["lunch", "dinner"], ["western", "occasion", "baked"]],
  ["mashed-potato", "Khoai tây nghiền", "mashed potato", null, "US", "side", "common", ["lunch", "dinner"], ["western", "occasion"]],
  ["gingerbread", "Bánh gừng", "gingerbread cookies", "christmas-feast", "US", "bakery", "rare", ["breakfast", "lunch", "dinner"], ["western", "occasion", "sweet", "bakery"]],
  ["christmas-pudding", "Christmas Pudding", "Christmas pudding", "christmas-feast", "US", "dessert", "epic", ["lunch", "dinner"], ["western", "occasion", "dessert"]],
  ["yule-log", "Bánh khúc cây Yule Log", "Yule log cake bûche de Noël", "christmas-feast", "FR", "dessert", "epic", ["lunch", "dinner"], ["french", "occasion", "dessert"]],
  ["hot-chocolate", "Sô cô la nóng", "hot chocolate", null, "US", "drink", "common", ["breakfast", "lunch", "dinner"], ["western", "occasion", "sweet", "hot"]],
  ["banh-chung", "Bánh chưng", "bánh chưng Tết", "new-year-feast", "VN", "rice", "rare", ["breakfast", "lunch", "dinner"], ["vietnamese", "rice", "occasion"]],
  ["canh-mang-mien", "Canh măng miến", "canh măng miến Tết", "new-year-feast", "VN", "soup", "epic", ["lunch", "dinner"], ["vietnamese", "noodle", "occasion", "hot"]],
  ["gio-xao", "Giò xào", "giò xào giò thủ Tết", "new-year-feast", "VN", "meat", "rare", ["lunch", "dinner"], ["vietnamese", "occasion"]],
  ["thit-dong", "Thịt đông", "thịt đông ngày Tết miền Bắc", "new-year-feast", "VN", "meat", "epic", ["lunch", "dinner"], ["vietnamese", "occasion"]],
  ["thit-kho-trung", "Thịt kho trứng", "thịt kho trứng ngày Tết", "new-year-feast", "VN", "meat", "rare", ["lunch", "dinner"], ["vietnamese", "occasion"]],
  ["dua-hanh", "Dưa hành", "dưa hành muối Tết", "new-year-feast", "VN", "side", "common", ["lunch", "dinner"], ["vietnamese", "occasion"]],
  ["che-khuc-bach", "Chè khúc bạch", "chè khúc bạch", "cooling-summer", "VN", "dessert", "rare", ["breakfast", "lunch", "dinner"], ["vietnamese", "dessert", "light"]],
  ["che-buoi", "Chè bưởi", "chè bưởi", "cooling-summer", "VN", "dessert", "common", ["breakfast", "lunch", "dinner"], ["vietnamese", "dessert", "light"]],
  ["sua-chua-mit", "Sữa chua mít", "sữa chua mít", "cooling-summer", "VN", "dessert", "common", ["breakfast", "lunch", "dinner"], ["vietnamese", "dessert", "light"]],
  ["kem-bo-da-lat", "Kem bơ Đà Lạt", "kem bơ Đà Lạt", "cooling-summer", "VN", "dessert", "rare", ["lunch", "dinner"], ["vietnamese", "dessert", "light"]],
  ["nom-sua-xoai", "Nộm sứa xoài xanh", "nộm sứa xoài xanh", "cooling-summer", "VN", "salad", "epic", ["lunch", "dinner"], ["vietnamese", "seafood", "light"]],
  ["goi-cuon-tom-thit", "Gỏi cuốn tôm thịt", "gỏi cuốn tôm thịt", "cooling-summer", "VN", "rice-roll", "rare", ["lunch", "dinner"], ["vietnamese", "light"]],
]

const weightByRarity: Record<RewardRarity, number> = { common: 100, rare: 55, epic: 24, diamond: 7 }

const mapped = entries.map(([id, name, searchQuery, limitedEventId, country, category, rarity, mealSlots, tags]) => enrichDish({
  id, name, nameEn: name, description: limitedEventId ? `${name} đặc trưng của banner sự kiện.` : `${name} dành cho bữa ăn thường ngày.`, searchQuery, mealSlots, category,
  tags, weight: weightByRarity[rarity], rarity, active: true, country, type: limitedEventId ? "limited" : "normal", limitedEventId: limitedEventId ?? undefined,
  imageUrl: `/assets/food/full/${id}.webp`,
}))

export const EVENT_DISHES: Dish[] = mapped.filter((dish) => dish.type === "limited")
export const CURATED_NORMAL_DISHES: Dish[] = mapped.filter((dish) => dish.type === "normal")
