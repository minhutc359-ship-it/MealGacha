import type { StoryArtId } from "./storyArt"
import type { GameSave } from "./types"

export interface CulturalPage {
  id: string
  unlockStageId: string
  title: string
  art: StoryArtId
  mapId: string
  questTitle: string
  englishTitle: string
  region: string
  englishRegion: string
  memory: string
  fact: string
  englishFact: string
  sources: {
    label: string
    url: string
  }[]
  teacher: string
  dish: string
  opening: string
  ending: string
  steps: {
    prompt: string
    choices: {
      label: string
      reply: string
      advance: boolean
    }[]
  }[]
}
export type CultureSummary = Pick<CulturalPage, "id" | "unlockStageId" | "title" | "art" | "mapId" | "questTitle">
// Long bilingual notes and encounters load on demand; stage notices need only metadata.
export const CULTURAL_PAGES: CultureSummary[] = [
  {
    id: "tet",
    unlockStageId: "lantern-2",
    title: "Tết · Mỗi nhà một vị",
    art: "tet-kitchen",
    mapId: "lantern",
    questTitle: "Nút lạt đầu tiên",
  },
  {
    id: "bai-choi",
    unlockStageId: "harbor-1",
    title: "Bài Chòi · Một tiếng hô, nhiều người đáp",
    art: "bai-choi",
    mapId: "harbor",
    questTitle: "Sân hội có người đáp",
  },
  {
    id: "quan-ho",
    unlockStageId: "garden-1",
    title: "Quan họ · Đừng để lời mời mất câu đáp",
    art: "garden",
    mapId: "garden",
    questTitle: "Chén trà chờ câu đáp",
  },
  {
    id: "don-ca-tai-tu",
    unlockStageId: "tide-1",
    title: "Đờn ca tài tử · Có chỗ cho một câu mới",
    art: "tide",
    mapId: "tide",
    questTitle: "Câu đờn còn chỗ viết",
  },
  {
    id: "trung-thu",
    unlockStageId: "moon-1",
    title: "Trung Thu · Chia bánh, nối lại đèn",
    art: "moon",
    mapId: "sugartower",
    questTitle: "Nối lại chiếc đèn sao",
  },
  {
    id: "xoe-thai",
    unlockStageId: "last-table-3",
    title: "Xòe Thái · Vòng tay còn chỗ cho bạn",
    art: "last-table",
    mapId: "mistwood",
    questTitle: "Vòng tay còn chỗ",
  },
  {
    id: "family-recipes",
    unlockStageId: "living-market-1",
    title: "Một món · Nhiều cách nấu",
    art: "living-market",
    mapId: "ashalley",
    questTitle: "Hai trang công thức",
  },
  {
    id: "shared-table",
    unlockStageId: "rain-harbor-1",
    title: "Bữa cơm · Chừa phần cho khách",
    art: "rain-harbor",
    mapId: "lasttable",
    questTitle: "Chừa phần cho khách",
  },
  {
    id: "passing-on",
    unlockStageId: "tomorrow-table-1",
    title: "Truyền nghề · Trang sổ có tên người",
    art: "tomorrow-table",
    mapId: "lasttable",
    questTitle: "Trang sổ có tên người",
  },
]

export function discoveredCulture(
  clearedStages: readonly string[],
  progress: Record<string, number> = {},
) {
  const cleared = new Set(clearedStages)
  return CULTURAL_PAGES.filter(
    (page) => cleared.has(page.unlockStageId) || progress[page.id] === 3,
  )
}
export function cultureForStage(stageId: string) {
  return CULTURAL_PAGES.find((page) => page.unlockStageId === stageId)
}
export function cultureOpen(save: GameSave, page: CultureSummary) {
  return (
    page.id === "tet" ||
    !!save.cultureJourney?.[page.id] ||
    save.clearedStages.includes(page.unlockStageId) ||
    !!save.adventureRpg?.stars[`${page.mapId}-1`]
  )
}
export function advanceCulture(
  save: GameSave,
  id: string,
  step: number,
): GameSave {
  const page = CULTURAL_PAGES.find((page) => page.id === id)
  if (
    !page ||
    !cultureOpen(save, page) ||
    !Number.isInteger(step) ||
    step < 0 ||
    step >= 3 ||
    (save.cultureJourney?.[id] ?? 0) !== step
  )
    return save
  return { ...save, cultureJourney: { ...save.cultureJourney, [id]: step + 1 } }
}
