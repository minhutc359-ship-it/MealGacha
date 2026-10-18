import { CHAPTERS } from "./story"
import { ENDINGS, SCENES } from "./narrative"
import { RPG_MAPS } from "./adventureRpg/content"
import { RPG_STORY_ARCS } from "./adventureRpg/story"
import { storyLines } from "./storyPresentation"
import { CHARACTER_NAMES, type CharacterId } from "./characters"
import type { GameSave } from "./types"

export type MangaTrack = "tcg" | "adventure"
export interface MangaBeat {
  title: string
  lines: readonly {
    speaker: string
    text: string
  }[]
}
export interface MangaChapter {
  id: string
  title: string
  hook: string
  image: string
  beats: readonly MangaBeat[]
  choices?: readonly [MangaBeat, MangaBeat]
}
export type MangaChapterInfo = Pick<MangaChapter, "id" | "title" | "image">

/** The shelf needs metadata only; complete scripts are fetched per chapter. */
export function mangaChapters(track: MangaTrack): MangaChapterInfo[] {
  return (track === "tcg" ? CHAPTERS : RPG_MAPS).map((chapter) => ({
    id: chapter.id,
    title:
      track === "tcg"
        ? (chapter as typeof CHAPTERS[number]).title
        : RPG_STORY_ARCS[chapter.id].title,
    image: `/assets/manga5915/${track}/${chapter.id}.webp`,
  }))
}

/** Pixel viewBox rectangles: panel gutters are measured at authoring time. */
export type MangaRect = readonly [number, number, number, number]
export interface MangaSupplement {
  scenes: readonly MangaBeat[]
  originalFrames: readonly MangaRect[]
  extraFrames: readonly MangaRect[]
  extraImage: string
  originalSize: readonly [number, number]
  extraSize: readonly [number, number]
}
export interface MangaPage extends MangaBeat {
  id: string
  image: string
  frame: MangaRect
  supplemental: boolean
  size: readonly [number, number]
}
export interface MangaContext {
  storyEnding?: GameSave["storyEnding"]
  story400?: GameSave["story400"]
  choice?: 0 | 1
}
export interface MangaBook extends MangaSupplement {
  editions: Record<string, readonly MangaPage[]>
}

export function mangaEdition(
  track: MangaTrack,
  chapterId: string,
  context: MangaContext,
) {
  if (track === "adventure") return String(context.choice ?? "base")
  if (chapterId === "last-table") return context.storyEnding ?? "base"
  return `${context.story400?.originEnding ?? context.storyEnding ?? "none"}:${context.story400?.decisions?.[chapterId] ?? "none"}`
}

export function mangaSpeaker(speaker: string) {
  return CHARACTER_NAMES[(speaker as CharacterId)] ?? speaker
}

/** Keep every canonical line in order, including saved decisions; never award progress. */
export function mangaPages(
  track: MangaTrack,
  chapter: MangaChapter,
  extra: MangaSupplement,
  context: MangaContext = {},
): MangaPage[] {
  const pages: MangaPage[] = []
  const add = (
    beat: MangaBeat,
    image: string,
    frame: MangaRect,
    supplemental = false,
  ) => {
    let lines: MangaBeat["lines"][number][] = []
    const flush = () => {
      if (!lines.length) return
      pages.push({
        ...beat,
        lines,
        image,
        frame,
        supplemental,
        size: supplemental ? extra.extraSize : extra.originalSize,
        id: `${chapter.id}-${pages.length}`,
      })
      lines = []
    }
    for (const line of beat.lines) {
      if (
        lines.length &&
        (lines.length >= 3 ||
          lines.reduce((n, l) => n + l.text.length, 0) + line.text.length > 430)
      )
        flush()
      lines.push({ speaker: mangaSpeaker(line.speaker), text: line.text })
    }
    flush()
  }
  const insert = (index: number) =>
    add(extra.scenes[index], extra.extraImage, extra.extraFrames[index], true)
  insert(0)
  if (track === "tcg") {
    const source = CHAPTERS.find((c) => c.id === chapter.id)!
    source.stages.forEach((stage, index) => {
      for (const phase of ["before", "after"] as const) {
        const frame = Math.min(
          4,
          Math.floor((index * 5) / 3) + (phase === "after" ? 1 : 0),
        )
        add(
          {
            title: `${stage.title} · ${
              phase === "before" ? "Đối mặt" : "Dư âm"
            }`,
            lines: storyLines(
              stage.id,
              { ...context, storyEnding: context.storyEnding ?? null },
              phase,
            ),
          },
          chapter.image,
          extra.originalFrames[frame],
        )
      }
      // Keep Liên's rescue reveal after Bách's confession in stage two.
      if (chapter.id === "last-table") {
        if (index === 1) {
          insert(1)
          insert(2)
        }
        if (index === 2) insert(3)
      } else insert(index + 1)
    })
    if (chapter.id === "last-table") {
      const ending = tcgEndingBeat(context.storyEnding)
      if (ending) add(ending, chapter.image, extra.originalFrames[4])
    }
  } else {
    chapter.beats.forEach((beat, index) => {
      add(beat, chapter.image, extra.originalFrames[index === 3 ? 4 : index])
      if (index < 2) insert(index + 1)
    })
    insert(3)
    if ((context.choice === 0 || context.choice === 1) && chapter.choices)
      add(
        chapter.choices[context.choice],
        chapter.image,
        extra.originalFrames[4],
      )
  }
  return pages
}

export const TCG_MANGA_CHAPTERS: readonly MangaChapter[] = CHAPTERS.map(
  (chapter) => ({
    id: chapter.id,
    title: chapter.title,
    hook: chapter.intro,
    image: `/assets/manga5915/tcg/${chapter.id}.webp`,
    beats: chapter.stages.map((stage) => ({
      title: stage.title,
      lines: [...SCENES[stage.id].before, ...SCENES[stage.id].after],
    })),
  }),
)

export const ADVENTURE_MANGA_CHAPTERS: readonly MangaChapter[] = RPG_MAPS.map(
  (map) => {
    const arc = RPG_STORY_ARCS[map.id]
    return {
      id: map.id,
      title: arc.title,
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

export function unlockedAdventureManga(
  stars: Readonly<Record<string, number>>,
) {
  return RPG_MAPS.filter((map) => !!stars[`${map.id}-6`]).map((map) => map.id)
}

export function tcgEndingBeat(
  ending: "remember" | "release" | null | undefined,
): MangaBeat | null {
  if (!ending) return null
  return {
    title: ENDINGS[ending].title,
    lines: [
      { speaker: "Người kể", text: ENDINGS[ending].text },
      { speaker: "Ngoại truyện", text: ENDINGS[ending].epilogue },
    ],
  }
}
