export type MealSlot = "breakfast" | "lunch" | "dinner"
export type RewardSource = "chest" | "fusion"
export type RewardStatus = "available" | "consumed"
export type RewardRarity = "common" | "rare" | "epic" | "diamond"

export interface Dish {
  id: string
  name: string
  searchQuery: string
  mealSlots: MealSlot[]
  category?: string
  description?: string
  imageUrl?: string
  tags: string[]
  weight: number
  rarity?: RewardRarity
  priceTier?: 1 | 2 | 3 | 4
  active: boolean
  minRating?: number
  minReviews?: number
}

export interface DishSnapshot {
  id: string
  name: string
  searchQuery: string
  imageUrl?: string
  category?: string
}

export interface RewardInstance {
  id: string
  dishId: string
  dish: DishSnapshot
  mealSlot: MealSlot
  source: RewardSource
  status: RewardStatus
  acquiredAt: string
  acquiredDate: string
  consumedAt?: string
  fusionId?: string
  favorite: boolean
  rarity?: RewardRarity
}

export interface FusionTransaction {
  id: string
  inputRewardIds: [string, string, string]
  outputRewardId: string
  targetMealSlot: MealSlot
  createdAt: string
  createdDate: string
}

export interface KeyTransaction {
  id: string
  amount: number
  balanceAfter: number
  reason: "daily_checkin" | "chest_open" | "migration" | "admin_adjustment"
  createdAt: string
  referenceId?: string
}

export interface UserPreferences {
  soundEnabled: boolean
  reducedMotion: boolean
  hiddenDishIds: string[]
  searchRadiusMeters: number
  minRating: number
  minReviews: number
  catalogUrl?: string
}

export interface UserState {
  schemaVersion: 1
  keys: number
  lastCheckInDate?: string
  rewards: RewardInstance[]
  fusions: FusionTransaction[]
  keyTransactions: KeyTransaction[]
  recentDishIdsByMeal: Record<MealSlot, string[]>
  unlimitedChestUnlockedAt?: string
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
}

export interface CatalogCache {
  schemaVersion: 1
  sourceUrl?: string
  fetchedAt: string
  hash: string
  dishes: Dish[]
}

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Bữa sáng",
  lunch: "Bữa trưa",
  dinner: "Bữa tối",
}

export const MEAL_SLOT_ICONS: Record<MealSlot, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
}
