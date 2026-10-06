import { CARD_MAP, CARDS, STARTER_DECK, STARTER_IDS, RARITIES } from "./catalog"
import { settleRunCombat, expeditionRewardAvailable } from "./expedition"
import { STAGES } from "./story"
import { getDateKey } from "../domain/dateKey"
import type { GameSave, GameStats, School } from "./types"

export const emptyStats = (): GameStats => ({
  wins: 0,
  battles: 0,
  packs: 0,
  crafted: 0,
})
export function newGame(): GameSave {
  return {
    version: 1,
    coins: 300,
    dust: 50,
    xp: 0,
    packTickets: 2,
    cards: Object.fromEntries(STARTER_IDS.map((id) => [id, 2])),
    foils: [],
    decks: [
      { id: "starter", name: "Bếp nhà · Khởi đầu", cards: [...STARTER_DECK] },
    ],
    activeDeckId: "starter",
    clearedStages: [],
    choices: {},
    claimedQuests: [],
    claimedDailyQuests: [],
    day: getDateKey(),
    lastCheckIn: null,
    daily: emptyStats(),
    stats: emptyStats(),
    pity: 0,
    battle: null,
    legacyImported: [],
    updatedAt: new Date().toISOString(),
    expedition: null,
    expeditionStats: { runs: 0, wins: 0, best: 0 },
    history: [],
  }
}
export function rotateDay(save: GameSave, today = getDateKey()): GameSave {
  return save.day === today
    ? save
    : { ...save, day: today, daily: emptyStats(), claimedDailyQuests: [] }
}
export function grantCard(save: GameSave, id: string): GameSave {
  const card = CARD_MAP[id]
  if (!card) return save
  const count = save.cards[id] ?? 0
  return count < 2
    ? { ...save, cards: { ...save.cards, [id]: count + 1 } }
    : { ...save, dust: save.dust + RARITIES[card.rarity].salvage }
}
export const PACKS: {
  id: string
  name: string
  school?: School
  description: string
  symbol: string
}[] = [
  {
    id: "origin",
    name: "Khởi nguyên",
    description: "Mọi hệ · Món ăn và bí thuật",
    symbol: "⬡",
  },
  {
    id: "ember",
    name: "Than hồng",
    school: "ember",
    description: "Hỏa vị · Tấn công và xung phong",
    symbol: "✹",
  },
  {
    id: "tide",
    name: "Sóng ký ức",
    school: "tide",
    description: "Hải vị · Rút bài và kiểm soát",
    symbol: "◈",
  },
  {
    id: "grove",
    name: "Mùa xanh",
    school: "grove",
    description: "Thanh vị · Bảo vệ và hồi phục",
    symbol: "❧",
  },
  {
    id: "hearth",
    name: "Bếp nhà",
    school: "hearth",
    description: "Gia vị · Hộ vệ và cường hóa",
    symbol: "⬡",
  },
  {
    id: "sugar",
    name: "Đường sao",
    school: "sugar",
    description: "Ngọt vị · Lá chắn và phép thuật",
    symbol: "✧",
  },
]
interface PackResult {
  save: GameSave
  cards: string[]
  error?: string
}
export function openPack(
  save: GameSave,
  packId: string,
  rng = Math.random,
): PackResult {
  const pack = PACKS.find((p) => p.id === packId)
  if (!pack) return { save, cards: [], error: "Gói thẻ không tồn tại." }
  if (!save.packTickets && save.coins < 100)
    return { save, cards: [], error: "Cần 100 xu hoặc 1 vé gói thẻ." }
  let next = {
    ...save,
    packTickets: Math.max(0, save.packTickets - 1),
    coins: save.packTickets ? save.coins : save.coins - 100,
    pity: save.pity + 1,
  }
  const pool = CARDS.filter((c) => !pack.school || c.school === pack.school)
  const ids: string[] = []
  let hasEpic = false
  for (let i = 0; i < 5; i++) {
    const roll = rng()
    let rarity =
      roll < 0.02
        ? "legendary"
        : roll < 0.12
          ? "epic"
          : roll < 0.37
            ? "rare"
            : "common"
    if (
      i === 4 &&
      !ids.some((id) => CARD_MAP[id].rarity !== "common") &&
      rarity === "common"
    )
      rarity = "rare"
    if (i === 4 && next.pity >= 8 && !hasEpic && rarity !== "legendary")
      rarity = "epic"
    const candidates = pool.filter((c) => c.rarity === rarity)
    const available = candidates.length ? candidates : pool
    const card =
      available[
        Math.min(available.length - 1, Math.floor(rng() * available.length))
      ]
    ids.push(card.id)
    if (card.rarity === "epic" || card.rarity === "legendary") hasEpic = true
    next = grantCard(next, card.id)
  }
  next = {
    ...next,
    pity: hasEpic ? 0 : next.pity,
    daily: { ...next.daily, packs: next.daily.packs + 1 },
    stats: { ...next.stats, packs: next.stats.packs + 1 },
  }
  return { save: next, cards: ids }
}
export function settleBattle(save: GameSave): GameSave {
  const battle = save.battle
  if (!battle?.result || battle.settled) return save
  const win = battle.result === "win"
  const firstClear =
    win &&
    !battle.expedition &&
    battle.stageId &&
    !save.clearedStages.includes(battle.stageId)
  const stage = STAGES.find((s) => s.id === battle.stageId)
  const paidPractice =
    !battle.expedition && !battle.stageId && win && save.daily.wins < 5
  const run =
    battle.expedition && save.expedition
      ? settleRunCombat(save.expedition, battle)
      : save.expedition
  const finishedRun = !!battle.expedition && run?.status === "won" && !run.paid
  const payRun = finishedRun && expeditionRewardAvailable(save)
  const loot = {
    coins: payRun
      ? 200
      : firstClear
        ? stage?.boss
          ? 180
          : 100
        : paidPractice
          ? 25
          : 0,
    xp: payRun ? 100 : firstClear ? 50 : paidPractice ? 10 : 0,
    tickets: payRun || (firstClear && stage?.boss) ? 1 : 0,
    dust: payRun ? 40 : 0,
    cardId: firstClear ? stage?.rewardCard : undefined,
  }
  let next: GameSave = {
    ...save,
    battle: { ...battle, settled: true, loot },
    xp: save.xp + loot.xp,
    coins: save.coins + loot.coins,
    dust: save.dust + loot.dust,
    expedition: finishedRun ? { ...run!, paid: true } : run,
    expeditionStats: {
      ...save.expeditionStats,
      wins: save.expeditionStats.wins + (finishedRun ? 1 : 0),
      best: Math.max(save.expeditionStats.best, run?.route.length ?? 0),
    },
    claimedDailyQuests: payRun
      ? [...save.claimedDailyQuests, `expedition:reward:${battle.id}`]
      : save.claimedDailyQuests,
    history: [
      {
        id: battle.id,
        mode: battle.expedition
          ? "expedition" as const
          : battle.stageId
            ? "story" as const
            : "practice" as const,
        opponent: battle.opponent,
        result: battle.result!,
        rounds: battle.round,
        date: new Date().toISOString(),
        stageId: battle.stageId,
        loot,
      },
      ...save.history,
    ].slice(0, 20),
    packTickets: save.packTickets + loot.tickets,
    clearedStages: firstClear
      ? [...save.clearedStages, battle.stageId!]
      : save.clearedStages,
    daily: {
      ...save.daily,
      battles: save.daily.battles + 1,
      wins: save.daily.wins + (win ? 1 : 0),
    },
    stats: {
      ...save.stats,
      battles: save.stats.battles + 1,
      wins: save.stats.wins + (win ? 1 : 0),
    },
  }
  if (firstClear && stage) next = grantCard(next, stage.rewardCard)
  return next
}
export const QUESTS = [
  {
    id: "first-win",
    name: "Ngọn lửa đầu tiên",
    description: "Thắng 1 trận",
    target: 1,
    coins: 100,
    dust: 20,
    progress: (s: GameSave) => s.stats.wins,
  },
  {
    id: "chapter-one",
    name: "Người giữ bếp",
    description: "Vượt 3 màn cốt truyện",
    target: 3,
    coins: 150,
    dust: 30,
    progress: (s: GameSave) => s.clearedStages.length,
  },
  {
    id: "collector",
    name: "Cuốn sách hương vị",
    description: "Sở hữu 30 thẻ khác nhau",
    target: 30,
    coins: 200,
    dust: 50,
    progress: (s: GameSave) =>
      Object.values(s.cards).filter((n) => n > 0).length,
  },
  {
    id: "five-packs",
    name: "Hương vị bất ngờ",
    description: "Mở 5 gói thẻ",
    target: 5,
    coins: 100,
    dust: 50,
    progress: (s: GameSave) => s.stats.packs,
  },
  {
    id: "artisan",
    name: "Nghệ nhân vị giác",
    description: "Chế tạo 1 thẻ",
    target: 1,
    coins: 100,
    dust: 25,
    progress: (s: GameSave) => s.stats.crafted,
  },
  {
    id: "dawn",
    name: "Bữa tiệc bình minh",
    description: "Hoàn thành cả 18 màn",
    target: 18,
    coins: 500,
    dust: 400,
    progress: (s: GameSave) => s.clearedStages.length,
  },
  {
    id: "caravan-first",
    name: "Chiếc ghế cho người lạc đường",
    description: "Hoàn thành 1 chuyến thám hiểm",
    target: 1,
    coins: 150,
    dust: 50,
    progress: (s: GameSave) => s.expeditionStats.wins,
  },
  {
    id: "caravan-three",
    name: "Người thuộc mọi đường về",
    description: "Hoàn thành 3 chuyến thám hiểm",
    target: 3,
    coins: 300,
    dust: 100,
    progress: (s: GameSave) => s.expeditionStats.wins,
  },
  {
    id: "caravan-collection",
    name: "Bạn đồng hành đường xa",
    description: "Sở hữu 5 thẻ khác nhau thuộc Đoàn lữ hành",
    target: 5,
    coins: 150,
    dust: 40,
    progress: (s: GameSave) =>
      CARDS.filter((c) => c.set === "Đoàn lữ hành" && s.cards[c.id] > 0).length,
  },
]
export const DAILY_QUESTS = [
  {
    id: "daily-win",
    name: "Bếp luôn đỏ lửa",
    description: "Thắng 2 trận hôm nay",
    target: 2,
    coins: 70,
    dust: 15,
    progress: (s: GameSave) => s.daily.wins,
  },
  {
    id: "daily-pack",
    name: "Công thức mới",
    description: "Mở 1 gói hôm nay",
    target: 1,
    coins: 35,
    dust: 10,
    progress: (s: GameSave) => s.daily.packs,
  },
  {
    id: "daily-play",
    name: "Luyện tay nghề",
    description: "Hoàn tất 3 trận hôm nay",
    target: 3,
    coins: 60,
    dust: 15,
    progress: (s: GameSave) => s.daily.battles,
  },
]

export interface TradeOffer {
  id: string
  inputId: string
  outputId: string
  coins: number
  dust: number
}
export function dailyTrades(day: string): TradeOffer[] {
  const seed =
    [...day].reduce((sum, char) => sum * 17 + char.charCodeAt(0), 0) >>> 0
  return [
    { id: "recipe", from: "common", to: "rare", coins: 20, dust: 0 },
    { id: "memory", from: "rare", to: "epic", coins: 50, dust: 0 },
    { id: "legacy", from: "epic", to: "legendary", coins: 0, dust: 150 },
  ].map((offer, index) => {
    const input = CARDS.filter((c) => c.rarity === offer.from)
    const output = CARDS.filter((c) => c.rarity === offer.to)
    return {
      id: offer.id,
      inputId: input[(seed + index * 7) % input.length].id,
      outputId: output[(seed + index * 13) % output.length].id,
      coins: offer.coins,
      dust: offer.dust,
    }
  })
}
export function tradeError(save: GameSave, offer: TradeOffer): string | null {
  if (save.claimedDailyQuests.includes(`trade:${offer.id}`))
    return "Hôm nay đã đổi giao dịch này."
  const neededInDeck = Math.max(
    1,
    ...save.decks.map(
      (d) => d.cards.filter((id) => id === offer.inputId).length,
    ),
  )
  if ((save.cards[offer.inputId] ?? 0) <= neededInDeck)
    return "Cần một bản thẻ dư, ngoài các bản đang dùng trong bộ bài."
  if (save.coins < offer.coins || save.dust < offer.dust)
    return "Chưa đủ tài nguyên trao đổi."
  return null
}
