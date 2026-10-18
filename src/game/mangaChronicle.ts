import { CHAPTERS } from "./story"
import { ENDINGS, SCENES } from "./narrative"
import { RPG_MAPS } from "./adventureRpg/content"
import { RPG_STORY_ARCS } from "./adventureRpg/story"

export type MangaTrack = "tcg" | "adventure"
export interface MangaBeat {
  title: string
  lines: readonly { speaker: string; text: string }[]
}
export interface MangaChapter {
  id: string
  title: string
  hook: string
  image: string
  beats: readonly MangaBeat[]
  choices?: readonly [MangaBeat, MangaBeat]
}

export const TCG_MANGA_CHAPTERS: readonly MangaChapter[] = CHAPTERS.map(
  (chapter) => ({
    id: chapter.id,
    title: chapter.title,
    hook: chapter.intro,
    image: `/assets/manga5915/tcg/${chapter.id}.webp`,
    beats: chapter.stages.map((stage) => ({
      title: stage.title,
      lines: [
        ...SCENES[stage.id].before,
        ...SCENES[stage.id].after,
      ],
    })),
  }),
)

export const ADVENTURE_MANGA_CHAPTERS: readonly MangaChapter[] = RPG_MAPS.map(
  (map) => {
    const arc = RPG_STORY_ARCS[map.id]
    return {
      id: map.id,
      title: map.name,
      hook: arc.hook,
      image: `/assets/manga5915/adventure/${map.id}.webp`,
      beats: [
        { title: "Mở chương", lines: arc.opening },
        { title: "Bước ngoặt", lines: arc.turningPoint },
        { title: "Đối mặt", lines: arc.finale },
        { title: "Dư âm", lines: arc.aftermath },
      ],
      choices: [
        { title: map.choices[0], lines: arc.consequences[0] },
        { title: map.choices[1], lines: arc.consequences[1] },
      ],
    }
  },
)

export function unlockedTcgManga(clearedStages: readonly string[]) {
  const cleared = new Set(clearedStages)
  return CHAPTERS.filter((chapter) =>
    chapter.stages.every((stage) => cleared.has(stage.id)),
  ).map((chapter) => chapter.id)
}

export function unlockedAdventureManga(stars: Readonly<Record<string, number>>) {
  return RPG_MAPS.filter((map) => !!stars[`${map.id}-6`]).map((map) => map.id)
}

export function tcgEndingBeat(ending: "remember" | "release" | null | undefined): MangaBeat | null {
  if (!ending) return null
  return {
    title: ENDINGS[ending].title,
    lines: [
      { speaker: "Người kể", text: ENDINGS[ending].text },
      { speaker: "Ngoại truyện", text: ENDINGS[ending].epilogue },
    ],
  }
}
