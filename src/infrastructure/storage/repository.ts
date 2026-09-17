import { z } from "zod"
import { UserState, CatalogCache, UserPreferences } from "../../domain/models"

const KEYS = {
  user: "foodchest.user.v1",
  catalog: "foodchest.catalog.v1",
  adminOverride: "foodchest.admin-override.v1",
  wheel: "foodchest.wheel.v1",
} as const

const defaultPrefs: UserPreferences = {
  soundEnabled: false,
  reducedMotion: false,
  hiddenDishIds: [],
  searchRadiusMeters: 3000,
  minRating: 4.0,
  minReviews: 20,
}

const StoredUserSchema = z
  .object({
    schemaVersion: z.literal(1),
    keys: z.number().int().nonnegative(),
    rewards: z.array(z.unknown()),
    fusions: z.array(z.unknown()),
    keyTransactions: z.array(z.unknown()),
    recentDishIdsByMeal: z.object({
      breakfast: z.array(z.string()),
      lunch: z.array(z.string()),
      dinner: z.array(z.string()),
    }),
    preferences: z.object({
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
    schemaVersion: 1,
    keys: 0,
    rewards: [],
    fusions: [],
    keyTransactions: [],
    recentDishIdsByMeal: { breakfast: [], lunch: [], dinner: [] },
    preferences: defaultPrefs,
    createdAt: now,
    updatedAt: now,
  }
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
      const parsed = StoredUserSchema.safeParse(raw)
      if (!parsed.success) return defaultUserState()
      const state = parsed.data as unknown as UserState
      return {
        ...defaultUserState(),
        ...state,
        preferences: { ...defaultPrefs, ...state.preferences },
      }
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

  clearAll(): void {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
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
      if (parsed.data.user)
        this.saveUser(parsed.data.user as unknown as UserState)
      if (parsed.data.catalog)
        this.saveCatalog(parsed.data.catalog as unknown as CatalogCache)
      return true
    } catch {
      return false
    }
  },
}
