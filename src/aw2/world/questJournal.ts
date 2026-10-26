import type { WorldProgress } from "./model"
import { QUEST_IDS, QUEST_GRANTS } from "./ids"
import { currentObjective, questLabel } from "./rules"
import { QUEST_REWARDS, type Economy } from "../economy/model"

export type JournalStatus = "locked" | "available" | "active" | "ready_to_claim" | "claimed"
const summaries = [
  "Giữ một chỗ bên bàn: gặp Bà, đọc mảnh khăn và đón năm người bạn.",
  "Nghe ba câu chuyện ở Phố rồi trở lại An chọn nét chỉ.",
  "Đọc Bảng dấu hơi, mở lối thoát, đặt nồi, nhóm lửa rồi báo Dì.",
  "Vượt thử thách, đọc ghi chép bên chén rồi trở về Bà giữ lời mời.",
]

/** Read-only projection; receipts and world rules remain the only reward/progress authority. */
export function questJournal(world: WorldProgress, economy: Readonly<Economy>) {
  const ready = [
    world.tableRead,
    world.memories.length === 3,
    world.puzzleStep === 3,
    world.bossDefeated && world.tableNoteRead,
  ]
  return QUEST_IDS.map((id, index) => {
    const complete = world.questIndex > index,
      current = world.questIndex === index
    const claimed = economy.receipts.includes(QUEST_GRANTS[index])
    const status: JournalStatus = complete
      ? claimed
        ? "claimed"
        : "ready_to_claim"
      : !current
        ? "locked"
        : !world.accepted
          ? "available"
          : ready[index]
            ? "ready_to_claim"
            : "active"
    return {
      id,
      index,
      title: questLabel({ ...world, questIndex: index }),
      status,
      complete,
      current,
      rewardClaimed: claimed,
      objective: current ? currentObjective(world) : summaries[index],
      reward: { ...QUEST_REWARDS[index] },
    }
  })
}

export function pageSlice<T>(
  items: readonly T[],
  requested: number,
  pageSize: number,
) {
  if (
    !Number.isSafeInteger(requested) ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1
  )
    throw Error("Invalid journal page")
  const pages = Math.max(1, Math.ceil(items.length / pageSize)),
    page = Math.min(pages - 1, Math.max(0, requested))
  return {
    page,
    pages,
    items: items.slice(page * pageSize, (page + 1) * pageSize),
  }
}

/** Break long copy at word boundaries; long individual words are bounded too. No content is dropped. */
export function textPages(text: string, limit = 160): string[] {
  if (!Number.isSafeInteger(limit) || limit < 1)
    throw Error("Invalid text page size")
  const pages: string[] = [],
    words = text.match(/\S+\s*|\s+/gu) ?? [""]
  let page = ""
  for (const word of words) {
    const letters = Array.from(word)
    if (page && Array.from(page).length + letters.length > limit) {
      pages.push(page)
      page = ""
    }
    while (letters.length > limit) pages.push(letters.splice(0, limit).join(""))
    page += letters.join("")
  }
  if (page || !pages.length) pages.push(page)
  return pages
}
