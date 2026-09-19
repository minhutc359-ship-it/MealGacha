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
  nameEn?: string
  descriptionEn?: string
  country?: string
  region?: string
  categories?: string[]
  baseWeight?: number
  type?: "normal" | "limited"
  limitedEventId?: string
  restaurantSearch?: { queries: string[]; cuisineTags?: string[] }
  fusion?: { enabled: boolean }
}

/** Legacy announcement events, kept separate from the seasonal banner catalog. */
export interface LimitedEvent {
  id: string
  startsAt: string
  endsAt: string
  title?: string
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
  reason: "daily_checkin" | "chest_open" | "daily_quiz" | "daily_quest" | "taste_swipe" | "migration" | "admin_adjustment"
  createdAt: string
  referenceId?: string
}

export interface UserPreferences {
  language?: "vi" | "en"
  soundEnabled: boolean
  reducedMotion: boolean
  hiddenDishIds: string[]
  searchRadiusMeters: number
  minRating: number
  minReviews: number
  catalogUrl?: string
}

export interface UserState {
  schemaVersion: 2
  displayName: string
  keys: number
  lastCheckInDate?: string
  checkInStreak?: number
  bestCheckInStreak?: number
  dailyQuestCycle?: string
  completedDailyQuestIds?: string[]
  rewards: RewardInstance[]
  fusions: FusionTransaction[]
  keyTransactions: KeyTransaction[]
  recentDishIdsByMeal: Record<MealSlot, string[]>
  unlimitedChestUnlockedAt?: string
  timelinePosts: TimelinePost[]
  fragments: Record<string, number>
  equippedTitleId: string
  unlockedTitleIds: string[]
  favoriteTasteTags: string[]
  tasteProfileUpdatedAt?: string
  dailyQuiz?: { date: string; answers: Record<string, string> }
  tasteSwipeRewardDate?: string
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
}

export interface TimelinePost {
  id: string
  dishId: string
  note?: string
  imageId?: string
  createdAt: string
  updatedAt?: string
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
