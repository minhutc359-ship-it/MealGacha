import { startBattle } from "./battle"
import { challengeStat } from "./difficulty"
import { prepareEncounter } from "./encounters"
import { NPC_NAMES } from "./characters"
import { suggestDeck } from "./deckStrategy"
import { CARDS } from "./catalog"
import { getDateKey } from "../domain/dateKey"
import type { Battle, GameSave, NpcId, WeeklyRecord } from "./types"
import type { StoryLine } from "./narrative"
import type { StoryArtId } from "./storyArt"
export interface SideQuest {
  id: NpcId
  title: string
  unlock: string
  art: StoryArtId
  intro: StoryLine[]
  share: {
    label: string
    detail: string
    ending: string
  }
  listen: {
    label: string
    detail: string
    ending: string
  }
}
export const SIDE_QUESTS: SideQuest[] = [
  {
    id: "bach",
    title: "Chiếc bát sứ mẻ",
    unlock: "lantern-1",
    art: "tet-kitchen",
    intro: [
      {
        speaker: "Bách",
        text: "Ta đã giữ chiếc bát này vì người để lại nó. Nhưng con trai người ấy ghé bếp hôm qua, mà ta chỉ nhớ chuyện cái bát bị mẻ.",
      },
      {
        speaker: "Bạn",
        text: "Ông vẫn có thể giữ chiếc bát, rồi hỏi thăm người con đã ghé bếp. Ngoài sân, một linh ảnh đang lặp lại tiếng bát vỡ.",
      },
    ],
    share: {
      label: "Nấu thêm một phần cho người khách",
      detail:
        "34 ý chí, 4 lá; đồng minh đầu tiên +1 chắn. Bách về sau: +2 chắn cho toàn sân ở lượt 3.",
      ending:
        "Bách đặt chiếc bát xuống, bày một bát mới cho người khách. Ông không cần bỏ kỷ vật để học cách đón một người đang sống.",
    },
    listen: {
      label: "Ngồi nghe tên người đã làm chiếc bát",
      detail: "32 ý chí, 5 lá mở đầu. Bách về sau: hồi 3 ý chí ở lượt 3.",
      ending:
        "Câu chuyện cuối cùng có tên người làm bát. Bách ghi tên ấy vào sổ, rồi hỏi người khách muốn ăn món gì hôm nay.",
    },
  },
  {
    id: "nhien",
    title: "Câu hô còn thiếu người đáp",
    unlock: "harbor-1",
    art: "bai-choi",
    intro: [
      {
        speaker: "Nhiên",
        text: "Bà Hiệu nhớ nhịp, tôi nhớ một nửa câu. Chúng tôi cứ chờ người kia hát đúng trước, thành ra cả sân chòi im lặng.",
      },
      {
        speaker: "Bạn",
        text: "Một cuộc chơi cần người đáp lời. Có lẽ không ai phải nhớ hết một mình. Linh ảnh giữ tiếng đáp đang ở sau ba Vị Linh trên bàn.",
      },
    ],
    share: {
      label: "Nhận phần đáp để bà Hiệu dẫn nhịp",
      detail:
        "34 ý chí, 4 lá; đồng minh đầu tiên +1 chắn. Nhiên về sau: gây 2 sát thương chủ tướng địch ở lượt 3.",
      ending:
        "Nhiên đáp hụt một nhịp rồi cười. Bà Hiệu gõ nhịp lại; người ở chòi bên cũng bắt đầu đáp. Tiếng chơi trở về vì có người cùng tham gia.",
    },
    listen: {
      label: "Học từng câu rồi mời người ở chòi bên",
      detail:
        "32 ý chí, 5 lá mở đầu. Nhiên về sau: rút 1 lá, toàn sân +1 chắn ở lượt 3.",
      ending:
        "Câu hô đổi một chút trong giọng người mới. Nhiên ghi người đã dạy mình, rồi chừa dòng trống cho người sẽ học tiếp.",
    },
  },
  {
    id: "moc",
    title: "Chén trà không cần giống hệt",
    unlock: "garden-1",
    art: "garden",
    intro: [
      {
        speaker: "Mộc",
        text: "Tôi pha trà thật giống mẹ, mà người khách cứ bảo vị hôm nay khác. Tôi đã định đổ cả ấm đi.",
      },
      {
        speaker: "Bạn",
        text: "Có lẽ mẹ bạn muốn khách thấy được đón tiếp. Mình có thể hỏi người khách hôm nay thích uống trà thế nào. Sương đang buộc những rễ cây quanh một ngày không được phép thay đổi.",
      },
    ],
    share: {
      label: "Pha ấm mới theo vị người khách thích",
      detail:
        "34 ý chí, 4 lá; đồng minh đầu tiên +1 chắn. Mộc về sau: hồi 4 ý chí ở lượt 3.",
      ending:
        "Mộc giữ công thức của mẹ, thêm một ghi chú về người khách hôm nay. Ký ức được trao truyền vì vẫn còn người tự tay pha trà.",
    },
    listen: {
      label: "Nghe câu hát giã bạn còn dang dở",
      detail:
        "32 ý chí, 5 lá mở đầu. Mộc về sau: hồi 2 ý chí, toàn sân +1 chắn ở lượt 3.",
      ending:
        "Mộc không hát thay giọng mẹ. Cô học câu còn thiếu với một người trong làng, rồi mời khách trở lại một ngày khác.",
    },
  },
  {
    id: "hai",
    title: "Người mới ở bến cũ",
    unlock: "tide-1",
    art: "tide",
    intro: [
      {
        speaker: "Hải",
        text: "Có người khách chỉ biết nấu món quê họ. Dân bến nói mùi ấy lạ, tôi cũng chưa biết đặt nồi ở đâu.",
      },
      {
        speaker: "Bạn",
        text: "Ta có thể chừa một chỗ nấu món của họ, thay vì bắt họ đổi sang món ở bến này. Linh ảnh đang kéo mọi chiếc ghế về đúng chỗ cũ.",
      },
    ],
    share: {
      label: "Chừa một bếp để cùng nấu hai món",
      detail:
        "34 ý chí, 4 lá; đồng minh đầu tiên +1 chắn. Hải về sau: rút 2 lá ở lượt 3.",
      ending:
        "Hai nồi đặt cạnh nhau. Hải ghi quê người khách vào sổ bến, rồi để họ tự kể món ăn của mình cho mọi người.",
    },
    listen: {
      label: "Hỏi câu chuyện của món ăn trước",
      detail:
        "32 ý chí, 5 lá mở đầu. Hải về sau: rút 1 lá, hồi 2 ý chí ở lượt 3.",
      ending:
        "Người khách kể mùi bếp ở nơi mình lớn lên. Hải nhận ra một bến quen không phải bến chỉ có người quen.",
    },
  },
  {
    id: "lien",
    title: "Chiếc đèn vá giấy",
    unlock: "moon-1",
    art: "moon",
    intro: [
      {
        speaker: "Liên",
        text: "Tôi hứa làm chiếc đèn đẹp nhất. Nhưng một góc bị rách, đứa trẻ lại muốn giữ mảnh giấy nó tự tô.",
      },
      {
        speaker: "Bạn",
        text: "Em ấy muốn mang đi rước chiếc đèn có phần mình tự tô. Mình thử vá lại mà giữ phần ấy nhé. Linh ảnh đang xóa những mảng màu khác nhau.",
      },
    ],
    share: {
      label: "Cùng vá bằng những mảnh giấy đã tô",
      detail:
        "34 ý chí, 4 lá; đồng minh đầu tiên +1 chắn. Liên về sau: toàn sân +1 chắn, gây 1 sát thương ở lượt 3.",
      ending:
        "Chiếc đèn có ba màu giấy và một đường vá. Liên để đứa trẻ tự buộc dây; khi rước đèn, em luôn chỉ cho bạn chỗ mình đã tô.",
    },
    listen: {
      label: "Để đứa trẻ chọn cách hoàn thiện",
      detail:
        "32 ý chí, 5 lá mở đầu. Liên về sau: rút 1 lá, hồi 2 ý chí ở lượt 3.",
      ending:
        "Liên học cách hỏi trước khi sửa. Chiếc đèn còn một nếp nhăn; mỗi khi nhìn thấy, cô nhớ ai đã cùng mình làm nó.",
    },
  },
]
export const SIDE_QUEST_MAP = Object.fromEntries(
  SIDE_QUESTS.map((q) => [q.id, q]),
) as Record<NpcId, SideQuest>
export function sideQuestUnlocked(save: GameSave, id: NpcId) {
  return save.clearedStages.includes(SIDE_QUEST_MAP[id].unlock)
}
export function startSideQuest(
  deck: string[],
  id: NpcId,
  choice: "share" | "listen",
): Battle {
  const quest = SIDE_QUEST_MAP[id],
    b = startBattle(
      deck,
      null,
      choice === "listen" ? "wisdom" : "courage",
      Math.random,
      true,
    )
  b.sideQuest = id
  b.opponent = `Linh ảnh · ${quest.title}`
  b.enemy.health = b.enemy.maxHealth = challengeStat(24, b.enemyChallenge)
  if (id === "bach") b.bossRuleId = "lantern-3"
  if (id === "nhien") b.bossRuleId = "harbor-3"
  prepareEncounter(b)
  b.companion = { id, choice, used: false }
  return b
}
export function weeklyId(day = getDateKey()) {
  const date = new Date(`${day}T12:00:00Z`),
    offset = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - offset)
  return date.toISOString().slice(0, 10)
}
function seedOf(text: string) {
  return [...text].reduce(
    (n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0,
    731,
  )
}
export function seeded(seed: number) {
  let value = seed
  return {
    next: () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0
      return value / 4294967296
    },
    state: () => value,
  }
}
export function weeklyChallenge(day = getDateKey()) {
  const week = weeklyId(day),
    seed = seedOf(week),
    variant = seed % 3
  const styles = ["sustain", "rush", "guard"] as const
  const owned = Object.fromEntries(
    CARDS.filter((c) => c.rarity !== "legendary" && c.cost <= 4).map((c) => [
      c.id,
      2,
    ]),
  )
  const names = ["Bữa cơm bên hiên", "Nhịp phố sau mưa", "Giữ lửa đêm Tết"]
  return {
    week,
    seed,
    title: names[variant],
    deck: suggestDeck(owned, styles[variant]),
    stages: [
      "Mùi quen trong sương",
      "Một chỗ cho người khách",
      "Ngọn lửa được trao",
    ],
  }
}
export function emptyWeekly(): WeeklyRecord {
  return { stage: 0, score: 0, best: 0, claimed: false, completions: 0 }
}
export function startWeekly(index: number, day = getDateKey()): Battle {
  const challenge = weeklyChallenge(day),
    random = seeded((challenge.seed + index * 7919) >>> 0)
  const b = startBattle(
    challenge.deck,
    ["lantern-2", "harbor-2", "garden-2"][index],
    "courage",
    random.next,
    true,
  )
  b.stageId = null
  b.opponent = challenge.stages[index]
  b.weekly = { week: challenge.week, index, seed: challenge.seed }
  b.rngState = random.state()
  b.enemy.health = b.enemy.maxHealth = challengeStat(
    24 + index * 4,
    b.enemyChallenge,
  )
  if (index === 2)
    b.bossRuleId = challenge.seed % 2 === 0 ? "lantern-3" : "harbor-3"
  prepareEncounter(b)
  return b
}
export function attachCompanion(save: GameSave, b: Battle) {
  const id = save.companion,
    bond = id ? save.bonds?.[id] : undefined
  if (id && bond?.completed)
    b.companion = { id, choice: bond.choice, used: false }
  return b
}
export function weeklyPoints(b: Battle) {
  return Math.max(
    10,
    100 +
      b.player.health * 3 -
      b.round * 4 +
      Object.values(b.comboCounts ?? {}).reduce((sum, n) => sum + (n ?? 0), 0) *
        15,
  )
}
export function settleJourney(save: GameSave): GameSave {
  const b = save.battle!
  if (!b.result || b.settled) return save
  const win = b.result === "win",
    bonds = { ...save.bonds },
    records = { ...save.weeklyRecords }
  let first = false,
    completedWeekly = false
  let weeklyResult = b.weekly
  if (b.sideQuest) {
    first = win && !bonds[b.sideQuest]?.completed
    if (win)
      bonds[b.sideQuest] = {
        choice: b.companion?.choice ?? "share",
        completed: true,
      }
  }
  if (b.weekly) {
    const old = records[b.weekly.week] ?? emptyWeekly()
    // Only the expected leg can advance; replay/import of a settled result cannot claim twice.
    if (old.stage === b.weekly.index) {
      const points = win ? weeklyPoints(b) : 0
      weeklyResult = {
        ...b.weekly,
        score: win ? old.score + points : old.score,
      }
      completedWeekly = win && old.stage === 2
      first = completedWeekly && !old.claimed
      records[b.weekly.week] = {
        ...old,
        stage: win ? (completedWeekly ? 0 : old.stage + 1) : 0,
        score: win && !completedWeekly ? old.score + points : 0,
        best: completedWeekly
          ? Math.max(old.best, old.score + points)
          : old.best,
        claimed: old.claimed || first,
        completions: old.completions + (completedWeekly ? 1 : 0),
      }
    }
  }
  const loot = {
    coins: first ? (b.weekly ? 150 : 80) : 0,
    xp: first ? 40 : 0,
    tickets: first && b.weekly ? 1 : 0,
    dust: first ? (b.weekly ? 30 : 15) : 0,
  }
  return {
    ...save,
    bonds,
    weeklyRecords: Object.fromEntries(
      Object.entries(records)
        .sort(([a], [z]) => z.localeCompare(a))
        .slice(0, 12),
    ),
    companion: save.companion ?? (first && b.sideQuest ? b.sideQuest : null),
    battle: {
      ...b,
      ...(weeklyResult ? { weekly: weeklyResult } : {}),
      settled: true,
      loot,
    },
    coins: save.coins + loot.coins,
    dust: save.dust + loot.dust,
    xp: save.xp + loot.xp,
    packTickets: save.packTickets + loot.tickets,
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
    history: [
      {
        id: b.id,
        mode: b.weekly ? "weekly" as const : "sidequest" as const,
        opponent: b.opponent,
        result: b.result,
        rounds: b.round,
        date: new Date().toISOString(),
        stageId: null,
        loot,
      },
      ...save.history,
    ].slice(0, 20),
  }
}
