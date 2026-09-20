import { z } from "zod"
import { UserState, CatalogCache, UserPreferences } from "../../domain/models"
import type { BannerConfig } from "../banner/bannerConfig"

const KEYS = {
  user: "foodchest.user.v1",
  catalog: "foodchest.catalog.v1",
  adminOverride: "foodchest.admin-override.v1",
  wheel: "foodchest.wheel.v1",
  bannerOverride: "foodchest.banner-override.v1",
  legacyBannerOverride: "foodchest.banner.local.v1",
} as const

const defaultPrefs: UserPreferences = {
  language: "vi",
  soundEnabled: true,
  reducedMotion: false,
  hiddenDishIds: [],
  searchRadiusMeters: 3000,
  minRating: 4.0,
  minReviews: 20,
}

const StoredUserSchema = z
  .object({
    schemaVersion: z.union([z.literal(1), z.literal(2)]),
    displayName: z.string().max(32).optional(),
    keys: z.number().int().nonnegative(),
    checkInStreak: z.number().int().nonnegative().optional(),
    bestCheckInStreak: z.number().int().nonnegative().optional(),
    dailyQuestCycle: z.string().optional(),
    completedDailyQuestIds: z.array(z.string()).optional(),
    rewards: z.array(z.unknown()),
    fusions: z.array(z.unknown()),
    keyTransactions: z.array(z.unknown()),
    recentDishIdsByMeal: z.object({
      breakfast: z.array(z.string()),
      lunch: z.array(z.string()),
      dinner: z.array(z.string()),
    }),
    unlimitedChestUnlockedAt: z.string().optional(),
    timelinePosts: z.array(z.object({ id: z.string(), dishId: z.string(), note: z.string().optional(), imageId: z.string().optional(), createdAt: z.string(), updatedAt: z.string().optional() })).optional(),
    fragments: z.record(z.string(), z.number().int().nonnegative()).optional(),
    equippedTitleId: z.string().optional(),
    unlockedTitleIds: z.array(z.string()).optional(),
    favoriteTasteTags: z.array(z.string()).optional(),
    tasteProfileUpdatedAt: z.string().optional(),
    dailyQuiz: z.object({ date: z.string(), answers: z.record(z.string(), z.string()) }).optional(),
    tasteSwipeRewardDate: z.string().optional(),
    preferences: z.object({
      language: z.enum(["vi", "en"]).optional(),
      soundEnabled: z.boolean().optional(),
      reducedMotion: z.boolean().optional(),
      hiddenDishIds: z.array(z.string()).optional(),
      searchRadiusMeters: z.number().optional(),
      minRating: z.number().optional(),
      minReviews: z.number().optional(),
      catalogUrl: z.string().optional(),
    }),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough()

const StoredCatalogSchema = z
  .object({
    schemaVersion: z.literal(1),
    sourceUrl: z.string().optional(),
    fetchedAt: z.string(),
    hash: z.string(),
    dishes: z.array(z.unknown()).min(1),
  })
  .passthrough()

const BackupSchema = z.object({
  user: StoredUserSchema.optional(),
  catalog: StoredCatalogSchema.nullable().optional(),
})

function defaultUserState(): UserState {
  const now = new Date().toISOString()
  return {
    schemaVersion: 2,
    displayName: "Nhà thám hiểm",
    keys: 0,
    checkInStreak: 0,
    bestCheckInStreak: 0,
    completedDailyQuestIds: [],
    rewards: [],
    fusions: [],
    keyTransactions: [],
    timelinePosts: [],
    fragments: {},
    equippedTitleId: "newbie",
    unlockedTitleIds: ["newbie"],
    favoriteTasteTags: [],
    recentDishIdsByMeal: { breakfast: [], lunch: [], dinner: [] },
    preferences: defaultPrefs,
    createdAt: now,
    updatedAt: now,
  }
}

export function migrateUserState(raw: unknown): UserState | null {
  const parsed = StoredUserSchema.safeParse(raw)
  if (!parsed.success) return null
  const state = parsed.data
  const defaults = defaultUserState()
  return {
    ...defaults,
    ...state,
    schemaVersion: 2,
    displayName: state.displayName ?? (typeof localStorage !== "undefined" ? localStorage.getItem("mealgacha.profile.name") : null) ?? defaults.displayName,
    checkInStreak: state.checkInStreak ?? 0,
    bestCheckInStreak: state.bestCheckInStreak ?? 0,
    completedDailyQuestIds: state.completedDailyQuestIds ?? [],
    timelinePosts: state.timelinePosts ?? [],
    fragments: state.fragments ?? {},
    unlockedTitleIds: Array.from(new Set(["newbie", ...(state.unlockedTitleIds ?? [])])),
    equippedTitleId: state.equippedTitleId ?? "newbie",
    favoriteTasteTags: state.favoriteTasteTags ?? [],
    preferences: { ...defaultPrefs, ...state.preferences },
  } as UserState
}

function safeGet<T>(key: string, fallback: T, parse: (raw: unknown) => T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return parse(JSON.parse(raw))
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota */
  }
}

export const repository = {
  loadUser(): UserState {
    return safeGet(KEYS.user, defaultUserState(), (raw) => {
      const state = migrateUserState(raw)
      if (!state) return defaultUserState()
      if ((raw as { schemaVersion?: number }).schemaVersion !== 2) safeSet(KEYS.user, state)
      return state
    })
  },

  saveUser(state: UserState): void {
    safeSet(KEYS.user, state)
  },

  loadCatalog(): CatalogCache | null {
    return safeGet(KEYS.catalog, null, (raw) => {
      const parsed = StoredCatalogSchema.safeParse(raw)
      return parsed.success ? parsed.data as unknown as CatalogCache : null
    })
  },

  saveCatalog(cache: CatalogCache): void {
    safeSet(KEYS.catalog, cache)
  },

  loadAdminOverrideUrl(): string | null {
    return safeGet(KEYS.adminOverride, null, (raw) =>
      typeof raw === "string" ? raw : null,
    )
  },

  saveAdminOverrideUrl(url: string | null): void {
    if (url === null) localStorage.removeItem(KEYS.adminOverride)
    else safeSet(KEYS.adminOverride, url)
  },

  loadWheelItems(): string[] {
    return safeGet(KEYS.wheel, [], (raw) => (Array.isArray(raw) ? raw : []))
  },

  saveWheelItems(items: string[]): void {
    safeSet(KEYS.wheel, items)
  },

  loadBannerOverride(): BannerConfig | null {
    const parseBanner = (raw: unknown): BannerConfig | null => {
      const parsed = z.object({
        id: z.string(),
        imageUrl: z.string(),
        enabled: z.boolean(),
        eventId: z.string().optional(),
        startsAt: z.string().optional(),
        endsAt: z.string().optional(),
      }).safeParse(raw)
      return parsed.success ? parsed.data : null
    }
    return safeGet(KEYS.bannerOverride, null, parseBanner) ?? safeGet(KEYS.legacyBannerOverride, null, parseBanner)
  },

  saveBannerOverride(config: BannerConfig): void {
    safeSet(KEYS.bannerOverride, config)
    localStorage.removeItem(KEYS.legacyBannerOverride)
  },

  clearBannerOverride(): void {
    localStorage.removeItem(KEYS.bannerOverride)
    localStorage.removeItem(KEYS.legacyBannerOverride)
  },

  clearAll(): void {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
    localStorage.removeItem("mealgacha.profile.name")
  },

  exportBackup(): string {
    return JSON.stringify(
      { user: this.loadUser(), catalog: this.loadCatalog() },
      null,
      2,
    )
  },

  importBackup(json: string): boolean {
    try {
      const parsed = BackupSchema.safeParse(JSON.parse(json))
      if (!parsed.success || (!parsed.data.user && !parsed.data.catalog))
        return false
      if (parsed.data.user) {
        const migrated = migrateUserState(parsed.data.user)
        if (!migrated) return false
        this.saveUser(migrated)
      }
      if (parsed.data.catalog)
        this.saveCatalog(parsed.data.catalog as unknown as CatalogCache)
      return true
    } catch {
      return false
    }
  },
}
