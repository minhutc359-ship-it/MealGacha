import { create } from "zustand"
import { UserState, Dish, MealSlot, RewardInstance } from "../domain/models"
import { repository } from "../infrastructure/storage/repository"
import { applyCheckIn, canCheckIn } from "../domain/checkIn"
import { applyOpenChest, canOpenChest } from "../domain/drawReward"
import { applyFuse, canFuse } from "../domain/fuseRewards"
import { SEED_DISHES } from "../infrastructure/catalog/seedCatalog"
import { fetchCatalog } from "../infrastructure/catalog/csvAdapter"

interface AppStore {
  user: UserState
  dishes: Dish[]
  catalogLoading: boolean
  catalogError: string | null
  toast: { message: string; type: "success" | "error" | "info" } | null
  pendingRevealRewardId: string | null

  init(): void
  checkIn(): boolean
  openChest(slot: MealSlot): {
    reward: RewardInstance
    error: null
    unlockedUnlimited: boolean
  } | {
    reward: null
    error: string
    unlockedUnlimited: false
  }
  fuse(inputIds: [string, string, string], targetSlot: MealSlot): {
    reward: RewardInstance
    error: null
    unlockedUnlimited: boolean
  } | { reward: null; error: string; unlockedUnlimited: false }
  toggleFavorite(rewardId: string): void
  showToast(message: string, type?: "success" | "error" | "info"): void
  dismissToast(): void
  completeRewardReveal(): void
  updatePreference<K extends keyof UserState["preferences"]>(
    key: K,
    value: UserState["preferences"][K],
  ): void
  loadRemoteCatalog(url?: string): Promise<void>
  resetData(): void
}

export const useAppStore = create<AppStore>((set, get) => ({
  user: repository.loadUser(),
  dishes: SEED_DISHES,
  catalogLoading: false,
  catalogError: null,
  toast: null,
  pendingRevealRewardId: null,

  init() {
    const user = repository.loadUser()
    set({ user })
    const cached = repository.loadCatalog()
    if (cached?.dishes?.length) set({ dishes: cached.dishes })
    const overrideUrl = repository.loadAdminOverrideUrl()
    const catalogUrl = overrideUrl || import.meta.env.VITE_CATALOG_URL
    if (catalogUrl) get().loadRemoteCatalog(catalogUrl)
  },

  checkIn() {
    const { user } = get()
    if (!canCheckIn(user)) return false
    const newUser = applyCheckIn(user)
    repository.saveUser(newUser)
    set({ user: newUser })
    get().showToast(`+10 chìa khóa! Mở rương thôi nào 🔑`, "success")
    return true
  },

  openChest(slot) {
    const { user, dishes } = get()
    const err = canOpenChest(user, dishes, slot)
    if (err) return { reward: null, error: err, unlockedUnlimited: false }
    const { state: newUser, reward, unlockedUnlimited } = applyOpenChest(user, dishes, slot)
    repository.saveUser(newUser)
    set({ user: newUser, pendingRevealRewardId: reward.id })
    if (unlockedUnlimited) {
      get().showToast("◆ Hoàn thành toàn bộ món — đã mở khóa rương vô hạn!", "success")
    }
    return { reward, error: null, unlockedUnlimited }
  },

  fuse(inputIds, targetSlot) {
    const { user, dishes } = get()
    const err = canFuse(user.rewards, inputIds)
    if (err) return { reward: null, error: err, unlockedUnlimited: false }
    const pool = dishes.filter(
      (d) => d.active && d.mealSlots.includes(targetSlot),
    )
    if (pool.length === 0)
      return { reward: null, error: "Không có món nào cho banner đích.", unlockedUnlimited: false }
    const { state: newUser, reward, unlockedUnlimited } = applyFuse(
      user,
      dishes,
      inputIds,
      targetSlot,
    )
    repository.saveUser(newUser)
    set({ user: newUser })
    if (unlockedUnlimited) {
      get().showToast("◆ Hoàn thành toàn bộ món — đã mở khóa rương vô hạn!", "success")
    }
    return { reward, error: null, unlockedUnlimited }
  },

  toggleFavorite(rewardId) {
    const { user } = get()
    const newRewards = user.rewards.map((r) =>
      r.id === rewardId ? { ...r, favorite: !r.favorite } : r,
    )
    const newUser = {
      ...user,
      rewards: newRewards,
      updatedAt: new Date().toISOString(),
    }
    repository.saveUser(newUser)
    set({ user: newUser })
  },

  showToast(message, type = "info") {
    set({ toast: { message, type } })
    setTimeout(() => set({ toast: null }), 3500)
  },

  dismissToast() {
    set({ toast: null })
  },

  completeRewardReveal() {
    set({ pendingRevealRewardId: null })
  },

  updatePreference(key, value) {
    const { user } = get()
    const newUser = {
      ...user,
      preferences: { ...user.preferences, [key]: value },
      updatedAt: new Date().toISOString(),
    }
    repository.saveUser(newUser)
    set({ user: newUser })
  },

  async loadRemoteCatalog(url) {
    set({ catalogLoading: true, catalogError: null })
    try {
      const result = await fetchCatalog(url!)
      if (result.errors.some((e) => e.includes("Banner"))) {
        set({ catalogError: result.errors.join("; "), catalogLoading: false })
        return
      }
      if (result.dishes.length > 0) {
        const cache = {
          schemaVersion: 1 as const,
          sourceUrl: url,
          fetchedAt: new Date().toISOString(),
          hash: "",
          dishes: result.dishes,
        }
        repository.saveCatalog(cache)
        set({ dishes: result.dishes })
      }
    } catch (e) {
      set({ catalogError: `Không thể tải catalog: ${(e as Error).message}` })
    } finally {
      set({ catalogLoading: false })
    }
  },

  resetData() {
    repository.clearAll()
    window.location.reload()
  },
}))
