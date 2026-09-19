export type TagGroup = "cuisine" | "region" | "foodType" | "taste" | "ingredient" | "occasion" | "price" | "style"

export interface TagDefinition {
  id: string
  labelVi: string
  labelEn: string
  group: TagGroup
}

export const TAGS: TagDefinition[] = [
  ["vietnamese", "Việt Nam", "Vietnamese", "cuisine"], ["korean", "Hàn Quốc", "Korean", "cuisine"],
  ["japanese", "Nhật Bản", "Japanese", "cuisine"], ["chinese", "Trung Quốc", "Chinese", "cuisine"],
  ["thai", "Thái Lan", "Thai", "cuisine"], ["italian", "Ý", "Italian", "cuisine"],
  ["french", "Pháp", "French", "cuisine"], ["american", "Mỹ", "American", "cuisine"],
  ["western", "Âu Mỹ", "Western", "cuisine"], ["hanoi", "Hà Nội", "Hanoi", "region"],
  ["seoul", "Seoul", "Seoul", "region"], ["tokyo", "Tokyo", "Tokyo", "region"],
  ["noodle", "Món mì", "Noodles", "foodType"], ["bbq", "Đồ nướng", "BBQ", "foodType"],
  ["rice", "Cơm", "Rice", "foodType"], ["hotpot", "Lẩu", "Hotpot", "foodType"],
  ["fried", "Chiên rán", "Fried", "foodType"], ["dessert", "Tráng miệng", "Dessert", "foodType"],
  ["seafood", "Hải sản", "Seafood", "foodType"], ["bakery", "Bánh", "Bakery", "foodType"],
  ["dumpling", "Há cảo", "Dumpling", "foodType"], ["steak", "Bít tết", "Steak", "foodType"],
  ["grilled", "Nướng", "Grilled", "foodType"], ["baked", "Đút lò", "Baked", "foodType"],
  ["spicy", "Cay", "Spicy", "taste"], ["sweet", "Ngọt", "Sweet", "taste"],
  ["hot", "Nóng hổi", "Hot", "taste"], ["light", "Thanh nhẹ", "Light", "taste"],
  ["quick", "Nhanh gọn", "Quick", "style"], ["fast-food", "Ăn nhanh", "Fast food", "style"],
  ["breakfast", "Bữa sáng", "Breakfast", "style"], ["group", "Ăn cùng bạn", "Group", "occasion"],
  ["occasion", "Dịp đặc biệt", "Occasion", "occasion"], ["fine-dining", "Ẩm thực cao cấp", "Fine dining", "occasion"],
  ["premium", "Cao cấp", "Premium", "price"],
].map(([id, labelVi, labelEn, group]) => ({ id, labelVi, labelEn, group: group as TagGroup }))

export const TAG_IDS = new Set(TAGS.map((tag) => tag.id))
