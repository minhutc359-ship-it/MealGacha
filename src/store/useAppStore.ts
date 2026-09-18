import { create } from "zustand"
import { UserState, Dish, MealSlot, RewardInstance } from "../domain/models"
import { repository } from "../infrastructure/storage/repository"
import { applyCheckIn, canCheckIn } from "../domain/checkIn"
import {
  applyConvertDuplicate,
  applyOpenChest,
  applyShardExchange,
  canClaimFreeChest,
  canOpenChest,
} from "../domain/drawReward"
import { applyFuse, canFuse } from "../domain/fuseRewards"
import { SEED_DISHES } from "../infrastructure/catalog/seedCatalog"
import localDishes from "../infrastructure/catalog/localDishes.json"
import limitedEvents from "../infrastructure/events/limitedEvents.json"
import { fetchCatalog } from "../infrastructure/catalog/csvAdapter"
import { LimitedEvent } from "../domain/models"
import { isDishAvailable } from "../domain/limitedEvents"
import {
  applyDailyQuest,
  canClaimDailyQuest,
  getDailyQuests,
} from "../domain/dailyQuest"

interface AppStore {
  user: UserState
  dishes: Dish[]
  limitedEvents: LimitedEvent[]
  catalogLoading: boolean
  catalogError: string | null
  toast: { message: string; type: "success" | "error" | "info" } | null
  pendingRevealRewardId: string | null

  init(): void
  checkIn(): boolean
  addLocalDish(dish: Dish): { success: boolean; error?: string }
  updateDish(dishId: string, patch: Pick<Dish, "name" | "rarity"> & { imageData?: string }): Promise<{ success: boolean; error?: string }>
  deleteDish(dishId: string): Promise<{ success: boolean; error?: string }>
  claimDailyQuest(questId: string, optionId: string): { correct: boolean; error?: string }
  openFreeChest(slot: MealSlot): { reward: RewardInstance | null; error?: string }
  convertDuplicate(rewardId: string): boolean
  exchangeShards(): boolean
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
  dishes: [...SEED_DISHES, ...(localDishes as Dish[])],
  limitedEvents: limitedEvents as LimitedEvent[],
  catalogLoading: false,
  catalogError: null,
  toast: null,
  pendingRevealRewardId: null,

  init() {
    const user = repository.loadUser()
    set({ user, dishes: [...SEED_DISHES, ...(localDishes as Dish[])], limitedEvents: limitedEvents as LimitedEvent[] })
    const cached = import.meta.env.DEV
      ? repository.loadCatalog()
      : repository.loadPublishedCatalog()
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

  addLocalDish(dish) {
    if (!import.meta.env.DEV) {
      return { success: false, error: "Chức năng này chỉ khả dụng trong môi trường dev." }
    }
    const { dishes } = get()
    if (dishes.some((item) => item.id === dish.id)) {
      return { success: false, error: `ID món "${dish.id}" đã tồn tại.` }
    }
    const nextDishes = [...dishes, dish]
    repository.saveLocalCatalog(nextDishes)
    set({ dishes: nextDishes })
    get().showToast(`Đã thêm món ${dish.name} vào catalog local.`, "success")
    return { success: true }
  },

  async updateDish(dishId, patch) {
    if (!import.meta.env.DEV) {
      return { success: false, error: "Chức năng này chỉ khả dụng trong môi trường dev." }
    }
    const { dishes } = get()
    const current = dishes.find((dish) => dish.id === dishId)
    if (!current) return { success: false, error: "Không tìm thấy món cần sửa." }
    const nextDish = {
      ...current,
      name: patch.name.trim(),
      rarity: patch.rarity,
      ...(patch.imageData ? { imageUrl: `/assets/food/full/${dishId}.webp` } : {}),
    }
    if (!nextDish.name) return { success: false, error: "Label không được để trống." }
    try {
      const response = await fetch("/__meal-gacha/dev/dish", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nextDish, ...(patch.imageData ? { imageData: patch.imageData } : {}) }),
      })
      if (!response.ok) throw new Error("Không thể ghi thay đổi món vào source.")
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
    const nextDishes = dishes.map((dish) => dish.id === dishId ? nextDish : dish)
    repository.saveLocalCatalog(nextDishes)
    set({ dishes: nextDishes })
    get().showToast(`Đã cập nhật ${nextDish.name}.`, "success")
    return { success: true }
  },

  async deleteDish(dishId) {
    if (!import.meta.env.DEV) {
      return { success: false, error: "Chức năng này chỉ khả dụng trong môi trường dev." }
    }
    const { dishes } = get()
    if (!dishes.some((dish) => dish.id === dishId)) return { success: false, error: "Không tìm thấy món cần xóa." }
    try {
      const response = await fetch("/__meal-gacha/dev/dish", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dishId }),
      })
      if (!response.ok) throw new Error("Không thể xóa món khỏi source.")
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
    const nextDishes = dishes.filter((dish) => dish.id !== dishId)
    repository.saveLocalCatalog(nextDishes)
    set({ dishes: nextDishes })
    get().showToast("Đã xóa món khỏi catalog local.", "success")
    return { success: true }
  },

  claimDailyQuest(questId, optionId) {
    const { user, dishes } = get()
    const quest = getDailyQuests(dishes).find((item) => item.id === questId)
    if (!quest) {
      return { correct: false, error: "Chưa đủ dữ liệu món ăn cho nhiệm vụ hôm nay." }
    }
    if (!canClaimDailyQuest(user, quest)) {
      return { correct: false, error: "Bạn đã nhận thưởng nhiệm vụ hôm nay rồi." }
    }
    const result = applyDailyQuest(user, quest, optionId)
    if (!result.correct) return { correct: false }
    repository.saveUser(result.state)
    set({ user: result.state })
    get().showToast(`+3 chìa khóa! ${quest.title} đã được giải 🔑`, "success")
    return { correct: true }
  },

  openFreeChest(slot) {
    const { user, dishes } = get()
    if (!canClaimFreeChest(user)) return { reward: null, error: "Bạn đã dùng rương miễn phí hôm nay." }
    const err = canOpenChest({ ...user, keys: 1 }, dishes, slot, get().limitedEvents)
    if (err) return { reward: null, error: err }
    const result = applyOpenChest(user, dishes, slot, { free: true }, get().limitedEvents)
    repository.saveUser(result.state)
    set({ user: result.state, pendingRevealRewardId: result.reward.id })
    get().showToast("Rương miễn phí đã mở! 🎁", "success")
    return { reward: result.reward }
  },

  convertDuplicate(rewardId) {
    const { user } = get()
    const newUser = applyConvertDuplicate(user, rewardId)
    if (newUser === user) return false
    repository.saveUser(newUser)
    set({ user: newUser })
    get().showToast("Đã đổi món trùng thành mảnh vị giác.", "success")
    return true
  },

  exchangeShards() {
    const { user } = get()
    const newUser = applyShardExchange(user, 10)
    if (newUser === user) return false
    repository.saveUser(newUser)
    set({ user: newUser })
    get().showToast("Đã đổi 10 mảnh thành 1 chìa khóa.", "success")
    return true
  },

  openChest(slot) {
    const { user, dishes } = get()
    const err = canOpenChest(user, dishes, slot, get().limitedEvents)
    if (err) return { reward: null, error: err, unlockedUnlimited: false }
    const { state: newUser, reward, unlockedUnlimited } = applyOpenChest(user, dishes, slot, {}, get().limitedEvents)
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
    const pool = dishes.filter((d) => isDishAvailable(d, get().limitedEvents) && d.mealSlots.includes(targetSlot))
    if (pool.length === 0)
      return { reward: null, error: "Không có món nào cho banner đích.", unlockedUnlimited: false }
    const { state: newUser, reward, unlockedUnlimited } = applyFuse(
      user,
      dishes,
      inputIds,
      targetSlot,
      get().limitedEvents,
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
