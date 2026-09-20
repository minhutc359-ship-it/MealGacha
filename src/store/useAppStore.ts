import { create } from "zustand"
import { UserState, Dish, MealSlot, RewardInstance } from "../domain/models"
import { repository } from "../infrastructure/storage/repository"
import { applyCheckIn, canCheckIn } from "../domain/checkIn"
import { applyOpenChest, canOpenChest } from "../domain/drawReward"
import { applyFuse, canFuse } from "../domain/fuseRewards"
import { SEED_DISHES } from "../infrastructure/catalog/seedCatalog"
import { fetchCatalog } from "../infrastructure/catalog/csvAdapter"
import { answerDailyQuestion, getDailyQuestions } from "../domain/dailyQuiz"
import { getDateKey } from "../domain/dateKey"
import { syncTitles, TITLES } from "../domain/titles"
import type { TimelinePost } from "../domain/models"
import { deleteImage } from "../infrastructure/storage/imageRepository"
import { clearImages } from "../infrastructure/storage/imageRepository"
import { enrichDish } from "../infrastructure/catalog/enrichDish"
import { EVENT_DISHES } from "../infrastructure/catalog/eventCatalog"
import localDishes from "../infrastructure/catalog/localDishes.json"
import { applyDailyQuest, getDailyQuests } from "../domain/dailyQuest"

function withBuiltInDishes(dishes: Dish[]): Dish[] {
  const merged = new Map(dishes.map((dish) => [dish.id, dish]))
  for (const dish of EVENT_DISHES) if (!merged.has(dish.id)) merged.set(dish.id, dish)
  for (const dish of localDishes as Dish[]) merged.set(dish.id, enrichDish(dish))
  return [...merged.values()]
}

interface AppStore {
  user: UserState
  dishes: Dish[]
  catalogLoading: boolean
  catalogError: string | null
  toast: { message: string; type: "success" | "error" | "info" } | null
  pendingRevealRewardId: string | null

  init(): void
  checkIn(): boolean
  answerQuiz(questionId: string, answerId: string): { correct: boolean; error?: string }
  claimDailyQuest(questId: string, optionId: string): { correct: boolean; error?: string }
  saveTasteProfile(tags: string[]): void
  resetTasteProfile(): void
  saveTimelinePost(post: TimelinePost): void
  deleteTimelinePost(id: string): Promise<void>
  equipTitle(id: string): void
  setDisplayName(name: string): void
  openChest(slot: MealSlot, eventId?: string): {
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
  resetData(): Promise<void>
}

export const useAppStore = create<AppStore>((set, get) => ({
  user: repository.loadUser(),
  dishes: withBuiltInDishes(SEED_DISHES),
  catalogLoading: false,
  catalogError: null,
  toast: null,
  pendingRevealRewardId: null,

  init() {
    const user = repository.loadUser()
    const cached = repository.loadCatalog()
    const dishes = cached?.dishes?.length && cached.sourceUrl !== "local://catalog"
      ? withBuiltInDishes(cached.dishes.map(enrichDish)) : withBuiltInDishes(SEED_DISHES)
    const titled = syncTitles(user, dishes)
    if (titled !== user) repository.saveUser(titled)
    set({ user: titled, dishes })
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
    get().showToast(`+${newUser.keys - user.keys} chìa khóa! Mở rương thôi nào 🔑`, "success")
    return true
  },

  answerQuiz(questionId, answerId) {
    const { user, dishes } = get()
    const question = getDailyQuestions(dishes).find((item) => item.id === questionId)
    if (!question) return { correct: false, error: "Câu hỏi không còn hiệu lực." }
    const result = answerDailyQuestion(user, question, answerId)
    if (result.error) return { correct: false, error: result.error }
    repository.saveUser(result.state)
    set({ user: result.state })
    get().showToast(result.correct ? "Đúng rồi! +1 chìa khóa 🔑" : "Chưa đúng! Thử câu tiếp theo nhé.", result.correct ? "success" : "info")
    return { correct: result.correct }
  },

  claimDailyQuest(questId, optionId) {
    const { user, dishes } = get()
    const quest = getDailyQuests(dishes).find((item) => item.id === questId)
    if (!quest) return { correct: false, error: "Nhiệm vụ không còn hiệu lực." }
    const result = applyDailyQuest(user, quest, optionId)
    if (!result.correct) return { correct: false }
    repository.saveUser(result.state)
    set({ user: result.state })
    get().showToast("Hoàn thành nhiệm vụ! +3 chìa khóa 🔑", "success")
    return { correct: true }
  },

  saveTasteProfile(tags) {
    const user = get().user
    const date = getDateKey()
    const bonus = user.tasteSwipeRewardDate === date ? 0 : 2
    const now = new Date().toISOString()
    const next = {
      ...user,
      keys: user.keys + bonus,
      favoriteTasteTags: [...new Set(tags)],
      tasteProfileUpdatedAt: now,
      tasteSwipeRewardDate: date,
      keyTransactions: bonus ? [...user.keyTransactions, { id: crypto.randomUUID(), amount: bonus, balanceAfter: user.keys + bonus, reason: "taste_swipe" as const, createdAt: now }] : user.keyTransactions,
      updatedAt: now,
    }
    repository.saveUser(next)
    set({ user: next })
    get().showToast(bonus ? "Đã lưu khẩu vị! +2 chìa khóa hôm nay." : "Đã cập nhật khẩu vị.", "success")
  },

  resetTasteProfile() {
    const user = get().user
    const next = { ...user, favoriteTasteTags: [], updatedAt: new Date().toISOString() }
    repository.saveUser(next)
    set({ user: next })
  },

  saveTimelinePost(post) {
    const { user, dishes } = get()
    const posts = [...user.timelinePosts.filter((item) => item.id !== post.id), post]
    const next = syncTitles({ ...user, timelinePosts: posts, updatedAt: new Date().toISOString() }, dishes)
    repository.saveUser(next)
    set({ user: next })
    if (next.unlockedTitleIds.length > user.unlockedTitleIds.length) get().showToast("Danh hiệu mới đã mở khóa!", "success")
  },

  async deleteTimelinePost(id) {
    const { user, dishes } = get()
    const post = user.timelinePosts.find((item) => item.id === id)
    if (!post) return
    const next = syncTitles({ ...user, timelinePosts: user.timelinePosts.filter((item) => item.id !== id), updatedAt: new Date().toISOString() }, dishes)
    repository.saveUser(next)
    set({ user: next })
    if (post.imageId && !next.timelinePosts.some((item) => item.imageId === post.imageId)) await deleteImage(post.imageId).catch(() => undefined)
  },

  equipTitle(id) {
    const user = get().user
    if (!user.unlockedTitleIds.includes(id) || !TITLES.some((title) => title.id === id)) return
    const next = { ...user, equippedTitleId: id, updatedAt: new Date().toISOString() }
    repository.saveUser(next)
    set({ user: next })
  },

  setDisplayName(name) {
    const user = get().user
    const next = { ...user, displayName: name.slice(0, 32), updatedAt: new Date().toISOString() }
    repository.saveUser(next)
    set({ user: next })
  },

  openChest(slot, eventId) {
    const { user, dishes } = get()
    const err = canOpenChest(user, dishes, slot, eventId)
    if (err) return { reward: null, error: err, unlockedUnlimited: false }
    const { state: newUser, reward, unlockedUnlimited } = applyOpenChest(user, dishes, slot, eventId)
    const titled = syncTitles(newUser, dishes)
    repository.saveUser(titled)
    set({ user: titled, pendingRevealRewardId: reward.id })
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
    const titled = syncTitles(newUser, dishes)
    repository.saveUser(titled)
    set({ user: titled })
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
        set({ dishes: withBuiltInDishes(result.dishes.map(enrichDish)) })
      }
    } catch (e) {
      set({ catalogError: `Không thể tải catalog: ${(e as Error).message}` })
    } finally {
      set({ catalogLoading: false })
    }
  },

  async resetData() {
    await clearImages().catch(() => undefined)
    repository.clearAll()
    localStorage.removeItem("mealgacha.profile.name")
    window.location.reload()
  },
}))
