import { create } from "zustand"
import { CARD_MAP, deckErrors, RARITIES } from "./catalog"
import { actBattle, startBattle, type BattleAction } from "./battle"
import {
  DAILY_QUESTS,
  QUESTS,
  dailyTrades,
  tradeError,
  grantCard,
  openPack,
  rotateDay,
  settleBattle,
} from "./progression"
import {
  activeRun,
  createExpedition,
  enterRunNode,
  startRunBattle,
  resolveRunEvent,
  pickRunRelic,
  pickRunCard,
} from "./expedition"
import { loadGame, saveGame, parseGame } from "./storage"
import { isStageUnlocked } from "./story"
import { getDateKey } from "../domain/dateKey"
import type { GameSave } from "./types"

interface Store {
  save: GameSave
  notice: string | null
  dismiss(): void
  sync(): void
  importLegacy(ids: string[]): void
  checkIn(): void
  openPack(id: string): string[]
  craft(id: string): void
  foil(id: string): void
  salvage(id: string): void
  trade(id: string): void
  claimQuest(id: string, daily?: boolean): void
  saveDeck(id: string, name: string, cards: string[]): boolean
  deleteDeck(id: string): void
  useDeck(id: string): void
  start(stageId: string | null, choice?: "courage" | "wisdom"): boolean
  act(action: BattleAction): void
  leaveBattle(): void
  beginExpedition(): boolean
  enterExpedition(id: string): void
  chooseEvent(id: string): void
  chooseRelic(id: string | null): void
  chooseRunCard(id: string | null, removeIndex?: number): void
  abandonExpedition(): void
  importSave(raw: unknown): boolean
}

export const useGameStore = create<Store>((set, get) => {
  const commit = (save: GameSave, notice?: string): boolean => {
    try {
      const next = { ...save, updatedAt: new Date().toISOString() }
      saveGame(next)
      set({ save: next, ...(notice ? { notice } : {}) })
      return true
    } catch {
      set({
        notice:
          "Không thể lưu tiến trình. Hãy xuất bản sao lưu và kiểm tra dung lượng trình duyệt.",
      })
      return false
    }
  }
  const current = () => rotateDay(get().save)
  return {
    save: loadGame(),
    notice: null,
    dismiss: () => set({ notice: null }),
    sync: () => set({ save: loadGame() }),
    importLegacy(ids) {
      let save = current()
      let count = 0
      for (const id of new Set(ids)) {
        if (!CARD_MAP[id] || save.legacyImported.includes(id)) continue
        save = grantCard(save, id)
        save = { ...save, legacyImported: [...save.legacyImported, id] }
        count++
      }
      if (count)
        commit(
          save,
          `Đã chuyển ${count} món trong bộ sưu tập cũ thành thẻ TCG.`,
        )
    },
    checkIn() {
      const save = current(),
        day = getDateKey()
      if (save.lastCheckIn === day) return
      commit(
        {
          ...save,
          lastCheckIn: day,
          coins: save.coins + 100,
          dust: save.dust + 10,
        },
        "Điểm danh thành công · +100 xu, +10 tinh chất.",
      )
    },
    openPack(id) {
      const result = openPack(current(), id)
      if (result.error) {
        set({ notice: result.error })
        return []
      }
      return commit(result.save) ? result.cards : []
    },
    craft(id) {
      const save = current(),
        card = CARD_MAP[id]
      if (!card) return
      const cost = RARITIES[card.rarity].dust
      if ((save.cards[id] ?? 0) >= 2 || save.dust < cost) {
        set({ notice: "Đã đủ 2 bản hoặc chưa đủ tinh chất." })
        return
      }
      const next = grantCard({ ...save, dust: save.dust - cost }, id)
      commit(
        {
          ...next,
          daily: { ...next.daily, crafted: next.daily.crafted + 1 },
          stats: { ...next.stats, crafted: next.stats.crafted + 1 },
        },
        `Đã chế tạo ${card.name}.`,
      )
    },
    foil(id) {
      const save = current()
      if (
        !CARD_MAP[id] ||
        !save.cards[id] ||
        save.foils.includes(id) ||
        save.dust < 60
      )
        return
      commit(
        { ...save, dust: save.dust - 60, foils: [...save.foils, id] },
        "Đã mở viền ánh kim vĩnh viễn cho thẻ. Chỉ thay đổi diện mạo.",
      )
    },
    salvage(id) {
      const save = current(),
        card = CARD_MAP[id]
      if (!card || !save.cards[id]) return
      const required = Math.max(
        0,
        ...save.decks.map((d) => d.cards.filter((c) => c === id).length),
      )
      if (save.cards[id] <= required) {
        set({
          notice:
            "Thẻ đang được dùng trong bộ bài. Bỏ khỏi các bộ bài trước khi phân rã.",
        })
        return
      }
      commit(
        {
          ...save,
          cards: { ...save.cards, [id]: save.cards[id] - 1 },
          dust: save.dust + RARITIES[card.rarity].salvage,
        },
        `+${RARITIES[card.rarity].salvage} tinh chất.`,
      )
    },
    trade(id) {
      const save = current(),
        offer = dailyTrades(save.day).find((o) => o.id === id)
      if (!offer) return
      const error = tradeError(save, offer)
      if (error) {
        set({ notice: error })
        return
      }
      const next = grantCard(
        {
          ...save,
          coins: save.coins - offer.coins,
          dust: save.dust - offer.dust,
          cards: {
            ...save.cards,
            [offer.inputId]: save.cards[offer.inputId] - 1,
          },
          claimedDailyQuests: [...save.claimedDailyQuests, `trade:${id}`],
        },
        offer.outputId,
      )
      commit(
        next,
        `Đã đổi với Lữ khách · Nhận ${CARD_MAP[offer.outputId].name}.`,
      )
    },
    claimQuest(id, daily = false) {
      const save = current(),
        quest = (daily ? DAILY_QUESTS : QUESTS).find((q) => q.id === id)
      const key = daily ? "claimedDailyQuests" : "claimedQuests"
      if (
        !quest ||
        save[key].includes(id) ||
        quest.progress(save) < quest.target
      )
        return
      commit(
        {
          ...save,
          [key]: [...save[key], id],
          coins: save.coins + quest.coins,
          dust: save.dust + quest.dust,
        },
        `Nhận thưởng · +${quest.coins} xu, +${quest.dust} tinh chất.`,
      )
    },
    saveDeck(id, name, cards) {
      const save = current(),
        errors = deckErrors(cards, save.cards)
      if (errors.length) {
        set({ notice: errors[0] })
        return false
      }
      if (!save.decks.some((d) => d.id === id) && save.decks.length >= 3) {
        set({ notice: "Tối đa 3 bộ bài. Hãy sửa một bộ bài hiện có." })
        return false
      }
      const decks = [
        ...save.decks.filter((d) => d.id !== id),
        {
          id,
          name: name.trim().slice(0, 40) || "Bộ bài mới",
          cards: [...cards],
        },
      ]
      return commit(
        { ...save, decks, activeDeckId: id },
        "Đã lưu và trang bị bộ bài.",
      )
    },
    deleteDeck(id) {
      const save = current()
      if (save.decks.length <= 1) return
      const decks = save.decks.filter((d) => d.id !== id)
      commit({
        ...save,
        decks,
        activeDeckId:
          save.activeDeckId === id ? decks[0].id : save.activeDeckId,
      })
    },
    useDeck(id) {
      const save = current()
      if (
        save.decks.some(
          (d) => d.id === id && !deckErrors(d.cards, save.cards).length,
        )
      )
        commit({ ...save, activeDeckId: id })
    },
    start(stageId, choice = "courage") {
      const save = current()
      if (save.battle && !save.battle.result) {
        set({ notice: "Hãy hoàn thành hoặc đầu hàng trận đang chơi trước." })
        return false
      }
      if (activeRun(save.expedition)) {
        set({
          notice:
            "Chuyến thám hiểm đang diễn ra. Hoàn thành hoặc kết thúc hành trình trước.",
        })
        return false
      }
      if (stageId && !isStageUnlocked(stageId, save.clearedStages)) return false
      const deck = save.decks.find((d) => d.id === save.activeDeckId)
      const error = deckErrors(deck?.cards ?? [], save.cards)[0]
      if (error) {
        set({ notice: error })
        return false
      }
      return commit({
        ...save,
        choices: stageId
          ? { ...save.choices, [stageId]: choice }
          : save.choices,
        battle: startBattle(deck!.cards, stageId, choice),
      })
    },
    act(action) {
      const save = current()
      if (!save.battle) return
      const result = actBattle(save.battle, action)
      if (result.error) {
        set({ notice: result.error })
        return
      }
      commit(settleBattle({ ...save, battle: result.battle }))
    },
    leaveBattle() {
      const save = current()
      if (!save.battle) return
      const settled = save.battle.result
        ? settleBattle(save)
        : settleBattle({ ...save, battle: { ...save.battle, result: "loss" } })
      commit({ ...settled, battle: null })
    },
    beginExpedition() {
      const save = current()
      if (activeRun(save.expedition) || (save.battle && !save.battle.result))
        return false
      const deck = save.decks.find((d) => d.id === save.activeDeckId)
      const error = deckErrors(deck?.cards ?? [], save.cards)[0]
      if (error) {
        set({ notice: error })
        return false
      }
      return commit(
        {
          ...save,
          battle: null,
          expedition: createExpedition(deck!.cards),
          expeditionStats: {
            ...save.expeditionStats,
            runs: save.expeditionStats.runs + 1,
          },
        },
        "Chuyến thám hiểm bắt đầu. Máu được giữ giữa các trận.",
      )
    },
    enterExpedition(id) {
      const save = current()
      if (!save.expedition || save.battle) return
      const run = enterRunNode(save.expedition, id)
      if (run === save.expedition) return
      commit({
        ...save,
        expedition: run,
        expeditionStats: {
          ...save.expeditionStats,
          best: Math.max(save.expeditionStats.best, run.route.length),
        },
        battle: run.status === "battle" ? startRunBattle(run) : null,
      })
    },
    chooseEvent(id) {
      const save = current()
      if (!save.expedition || save.battle) return
      const run = resolveRunEvent(save.expedition, id)
      if (run !== save.expedition) commit({ ...save, expedition: run })
    },
    chooseRelic(id) {
      const save = current()
      if (!save.expedition || save.battle) return
      const run = pickRunRelic(save.expedition, id)
      if (run !== save.expedition) commit({ ...save, expedition: run })
    },
    chooseRunCard(id, removeIndex) {
      const save = current()
      if (!save.expedition || save.battle) return
      const run = pickRunCard(save.expedition, id, removeIndex)
      if (run !== save.expedition) commit({ ...save, expedition: run })
    },
    abandonExpedition() {
      const save = current()
      if (!activeRun(save.expedition) || save.battle) return
      commit(
        {
          ...save,
          expedition: { ...save.expedition!, status: "abandoned", paid: true },
        },
        "Đã trở về Phố Đèn Lồng. Bộ sưu tập được giữ nguyên.",
      )
    },
    importSave(raw) {
      const save = parseGame(raw)
      if (!save) {
        set({
          notice: "Bản lưu không hợp lệ. Tiến trình hiện tại vẫn được giữ.",
        })
        return false
      }
      return commit(save, "Đã khôi phục tiến trình TCG.")
    },
  }
})
