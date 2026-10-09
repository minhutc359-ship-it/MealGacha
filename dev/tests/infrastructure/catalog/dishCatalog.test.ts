import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { BUILT_IN_DISHES, mergeDishCatalog } from "@/infrastructure/catalog/dishCatalog"
import { CARD_MAP, CARDS } from "@/game/catalog"
import { buildPool, applyOpenChest } from "@/domain/drawReward"
import {
  getCollectionProgress,
  hasUnlimitedChestAccess,
} from "@/domain/achievements"
import { getFeaturedEvents } from "@/domain/events"
import { repository } from "@/infrastructure/storage/repository"
import { newGame } from "@/game/progression"
import { GAME_KEY } from "@/game/storage"
import * as csv from "@/infrastructure/catalog/csvAdapter"
import type { Dish, MealSlot, RewardInstance } from "@/domain/models"
const slots: MealSlot[] = ["breakfast", "lunch", "dinner"]
const custom: Dish = {
  id: "custom-menu",
  name: "Món trong CSV riêng",
  searchQuery: "món riêng",
  mealSlots: ["lunch"],
  tags: [],
  weight: 100,
  active: true,
}
beforeEach(() => {
  const storage = new Map<string, string>()
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    key: (index: number) => [...storage.keys()][index] ?? null,
    get length() {
      return storage.size
    },
  })
  vi.stubEnv("VITE_CATALOG_URL", "")
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
describe("shared culinary catalog", () => {
  it("keeps every illustrated TCG food in the chest catalog with the same ID, name and art, excluding spells and characters", () => {
    const ids = new Set(BUILT_IN_DISHES.map((d) => d.id))
    expect(ids.size).toBe(BUILT_IN_DISHES.length)
    expect(
      CARDS.filter((c) => c.art?.startsWith("/assets/food/"))
        .map((c) => c.id)
        .sort(),
    ).toEqual([...ids].sort())
    for (const dish of BUILT_IN_DISHES) {
      expect(CARD_MAP[dish.id].name).toBe(dish.name)
      expect(CARD_MAP[dish.id].art).toBe(dish.imageUrl)
      expect(CARD_MAP[dish.id].rarity).toBe(
        dish.rarity === "diamond" ? "legendary" : dish.rarity,
      )
    }
    expect(ids.has("spark")).toBe(false)
    expect(ids.has("chef-bach")).toBe(false)
  })
  it("fills missing foods in an old or partial CSV, keeps custom entries and honors regular recipe overrides", () => {
    const pho = BUILT_IN_DISHES.find((d) => d.id === "pho-bo")!
    const override = {
      ...pho,
      name: "Phở trong thực đơn riêng",
      weight: 71,
      active: false,
    }
    const source = [custom, override]
    const before = JSON.stringify(source),
      result = mergeDishCatalog(source)
    expect(result).toHaveLength(BUILT_IN_DISHES.length + 1)
    expect(result.find((d) => d.id === custom.id)?.name).toBe(custom.name)
    expect(result.find((d) => d.id === pho.id)?.active).toBe(false)
    expect(result.find((d) => d.id === pho.id)?.name).toBe(override.name)
    expect(result.some((d) => d.id === "banh-mi")).toBe(true)
    expect(JSON.stringify(source)).toBe(before)
  })
  it("repairs stale event assignments and images without duplicates", () => {
    const stale = BUILT_IN_DISHES.filter((d) =>
      ["xoi-xeo", "takoyaki", "banner-tay-bac-com-lam"].includes(d.id),
    ).map((d) => ({
      ...d,
      type: "normal" as const,
      limitedEventId: undefined,
      imageUrl: "https://example.invalid/stale.png",
    }))
    const result = mergeDishCatalog([...stale, ...stale])
    expect(result).toHaveLength(BUILT_IN_DISHES.length)
    for (const dish of stale)
      expect(result.find((d) => d.id === dish.id)).toEqual(
        BUILT_IN_DISHES.find((d) => d.id === dish.id),
      )
  })
  it("makes every food reachable through normal meals or its own active event, and blocks expired event pools", () => {
    const dishes = mergeDishCatalog([custom]),
      reachable = new Set<string>()
    for (const slot of slots)
      for (const dish of buildPool(dishes, slot, [])) {
        expect(dish.type).not.toBe("limited")
        reachable.add(dish.id)
      }
    for (const event of getFeaturedEvents(dishes)) {
      const active = new Date(event.startsAt!),
        expired = new Date(new Date(event.endsAt!).getTime() + 2 * 86400000)
      const pool = slots.flatMap((slot) =>
        buildPool(dishes, slot, [], event.id, active),
      )
      expect(new Set(pool.map((d) => d.id))).toEqual(new Set(event.dishIds))
      expect(pool.every((d) => d.limitedEventId === event.id)).toBe(true)
      for (const dish of pool) reachable.add(dish.id)
      expect(
        slots.flatMap((slot) => buildPool(dishes, slot, [], event.id, expired)),
      ).toHaveLength(0)
    }
    expect([...reachable].sort()).toEqual(dishes.map((d) => d.id).sort())
  })
  it("initializes from a partial cache without losing keys, rewards, unlocked unlimited access or the TCG save", async () => {
    const user = repository.loadUser(),
      dish = BUILT_IN_DISHES[0]
    const reward: RewardInstance = {
      id: "old-reward",
      dishId: dish.id,
      dish: { id: dish.id, name: dish.name, searchQuery: dish.searchQuery },
      mealSlot: "breakfast",
      source: "chest",
      status: "available",
      acquiredAt: user.createdAt,
      acquiredDate: user.createdAt.slice(0, 10),
      favorite: true,
    }
    user.keys = 17
    user.rewards = [reward]
    user.unlimitedChestUnlockedAt = "2026-09-01T00:00:00Z"
    repository.saveUser(user)
    repository.saveCatalog({
      schemaVersion: 1,
      sourceUrl: "https://example.invalid/menu.csv",
      fetchedAt: user.createdAt,
      hash: "old",
      dishes: [custom],
    })
    const tcg = JSON.stringify(newGame())
    localStorage.setItem(GAME_KEY, tcg)
    const { useAppStore } = await import("@/store/useAppStore")
    useAppStore.getState().init()
    const result = useAppStore.getState()
    expect(result.dishes).toHaveLength(BUILT_IN_DISHES.length + 1)
    expect(result.user.keys).toBe(17)
    expect(result.user.rewards).toEqual([reward])
    expect(hasUnlimitedChestAccess(result.user, result.dishes)).toBe(true)
    expect(
      getCollectionProgress(result.user.rewards, result.dishes).unlocked,
    ).toBe(1)
    expect(localStorage.getItem(GAME_KEY)).toBe(tcg)
    const opened = applyOpenChest(result.user, result.dishes, "lunch")
    expect(opened.state.keys).toBe(17)
    expect(opened.state.rewards).toHaveLength(2)
    useAppStore.getState().init()
    expect(useAppStore.getState().user.rewards).toEqual([reward])
  })
  it("also merges an incoming remote CSV and retains a failed fetch's current catalog", async () => {
    const { useAppStore } = await import("@/store/useAppStore")
    const fetch = vi
      .spyOn(csv, "fetchCatalog")
      .mockResolvedValue({ dishes: [custom], errors: [] })
    await useAppStore
      .getState()
      .loadRemoteCatalog("https://example.invalid/menu.csv")
    expect(useAppStore.getState().dishes).toHaveLength(
      BUILT_IN_DISHES.length + 1,
    )
    const dishes = useAppStore.getState().dishes
    fetch.mockRejectedValue(new Error("offline"))
    await useAppStore
      .getState()
      .loadRemoteCatalog("https://example.invalid/menu.csv")
    expect(useAppStore.getState().dishes).toBe(dishes)
    expect(useAppStore.getState().catalogError).toContain("offline")
    expect(useAppStore.getState().catalogLoading).toBe(false)
  })
})
