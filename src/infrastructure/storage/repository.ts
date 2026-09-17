import { z } from 'zod';
import { UserState, CatalogCache, UserPreferences } from '../../domain/models';

const KEYS = {
  user: 'foodchest.user.v1',
  catalog: 'foodchest.catalog.v1',
  adminOverride: 'foodchest.admin-override.v1',
  wheel: 'foodchest.wheel.v1',
} as const;

const defaultPrefs: UserPreferences = {
  soundEnabled: false,
  reducedMotion: false,
  hiddenDishIds: [],
  searchRadiusMeters: 3000,
  minRating: 4.0,
  minReviews: 20,
};

function defaultUserState(): UserState {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1, keys: 0, rewards: [], fusions: [], keyTransactions: [],
    recentDishIdsByMeal: { breakfast: [], lunch: [], dinner: [] },
    preferences: defaultPrefs, createdAt: now, updatedAt: now,
  };
}

function safeGet<T>(key: string, fallback: T, parse: (raw: unknown) => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return parse(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

export const repository = {
  loadUser(): UserState {
    return safeGet(KEYS.user, defaultUserState(), (raw) => {
      if (typeof raw !== 'object' || raw === null) return defaultUserState();
      const state = raw as Partial<UserState>;
      if (state.schemaVersion !== 1) return defaultUserState();
      return { ...defaultUserState(), ...state };
    });
  },

  saveUser(state: UserState): void {
    safeSet(KEYS.user, state);
  },

  loadCatalog(): CatalogCache | null {
    return safeGet(KEYS.catalog, null, (raw) => {
      if (typeof raw !== 'object' || raw === null) return null;
      const c = raw as Partial<CatalogCache>;
      if (!Array.isArray(c.dishes) || c.dishes.length === 0) return null;
      return c as CatalogCache;
    });
  },

  saveCatalog(cache: CatalogCache): void {
    safeSet(KEYS.catalog, cache);
  },

  loadAdminOverrideUrl(): string | null {
    return safeGet(KEYS.adminOverride, null, (raw) =>
      typeof raw === 'string' ? raw : null
    );
  },

  saveAdminOverrideUrl(url: string | null): void {
    if (url === null) localStorage.removeItem(KEYS.adminOverride);
    else safeSet(KEYS.adminOverride, url);
  },

  loadWheelItems(): string[] {
    return safeGet(KEYS.wheel, [], (raw) => (Array.isArray(raw) ? raw : []));
  },

  saveWheelItems(items: string[]): void {
    safeSet(KEYS.wheel, items);
  },

  clearAll(): void {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },

  exportBackup(): string {
    return JSON.stringify({ user: this.loadUser(), catalog: this.loadCatalog() }, null, 2);
  },

  importBackup(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (data.user) this.saveUser(data.user);
      if (data.catalog) this.saveCatalog(data.catalog);
      return true;
    } catch { return false; }
  },
};
