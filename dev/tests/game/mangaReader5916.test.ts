import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { MangaChronicle } from "@/components/game/MangaChronicle"
import {
  TCG_MANGA_CHAPTERS,
  ADVENTURE_MANGA_CHAPTERS,
  mangaPages,
  mangaEdition,
  mangaSpeaker,
  unlockedAdventureManga,
  type MangaBook,
  type MangaTrack,
} from "@/game/mangaChronicle"
import { CHAPTERS } from "@/game/story"
import { storyLines } from "@/game/storyPresentation"
import { LIVING_CHOICES } from "@/game/livingChoices"

const tracks = [
  ["tcg", TCG_MANGA_CHAPTERS],
  ["adventure", ADVENTURE_MANGA_CHAPTERS],
] as const
const book = (track: MangaTrack, id: string): MangaBook =>
  JSON.parse(
    readFileSync(`public/assets/manga5916/${track}/${id}.json`, "utf8"),
  )
const lines = (pages: readonly import("@/game/mangaChronicle").MangaPage[]) =>
  pages.flatMap((p) => p.lines)

describe("manga reader 5.9.16", () => {
  it("has at least eight real story pages and four new illustrated scenes for all 17 chapters", () => {
    for (const [track, chapters] of tracks)
      for (const chapter of chapters) {
        const extra = book(track, chapter.id),
          pages = mangaPages(track, chapter, extra)
        expect(pages.length).toBeGreaterThanOrEqual(8)
        expect(pages.filter((p) => p.supplemental)).toHaveLength(4)
        expect(new Set(extra.scenes.map((s) => s.title)).size).toBe(4)
        expect(extra.editions.base).toEqual(pages)
        expect(
          pages.every((p) => p.lines.length >= 1 && p.lines.length <= 3),
        ).toBe(true)
        expect(
          pages.every((p) => p.lines.every((l) => l.speaker && l.text)),
        ).toBe(true)
        expect(new Set(pages.map((p) => p.id)).size).toBe(pages.length)
        for (const page of pages) {
          const [x, y, w, h] = page.frame
          expect(x).toBeGreaterThanOrEqual(0)
          expect(y).toBeGreaterThanOrEqual(0)
          expect(w).toBeGreaterThan(0)
          expect(h).toBeGreaterThan(0)
          expect(x + w).toBeLessThanOrEqual(page.size[0])
          expect(y + h).toBeLessThanOrEqual(page.size[1])
        }
      }
  })
  it("preserves every canonical TCG line in its exact before/after order", () => {
    for (const chapter of TCG_MANGA_CHAPTERS) {
      const canonical = CHAPTERS.find(
        (c) => c.id === chapter.id,
      )!.stages.flatMap((stage) => [
        ...storyLines(stage.id, { storyEnding: null }, "before"),
        ...storyLines(stage.id, { storyEnding: null }, "after"),
      ])
      const actual = lines(
        mangaPages("tcg", chapter, book("tcg", chapter.id)).filter(
          (p) => !p.supplemental,
        ),
      )
      expect(actual).toEqual(
        canonical.map(({ speaker, text }) => ({
          speaker: mangaSpeaker(speaker),
          text,
        })),
      )
    }
  })
  it("keeps both Adventure choice results separate and converts technical speaker IDs", () => {
    for (const chapter of ADVENTURE_MANGA_CHAPTERS) {
      const extra = book("adventure", chapter.id)
      for (const choice of [0, 1] as const) {
        const pages = mangaPages("adventure", chapter, extra, { choice })
        const actual = lines(pages.filter((p) => !p.supplemental))
        const expected = [
          ...chapter.beats.flatMap((b) => b.lines),
          ...chapter.choices![choice].lines,
        ]
        expect(actual).toEqual(
          expected.map(({ speaker, text }) => ({
            speaker: mangaSpeaker(speaker),
            text,
          })),
        )
        expect(extra.editions[String(choice)]).toEqual(pages)
        expect(
          actual.some((l) => /^(bach|nhien|grandmother|echo)$/.test(l.speaker)),
        ).toBe(false)
      }
      expect(lines(extra.editions.base).map((l) => l.text)).not.toContain(
        chapter.choices![0].lines[0].text,
      )
    }
  })
  it("uses the saved TCG ending and all six post-story decisions, including their callbacks", () => {
    for (const ending of ["remember", "release"] as const) {
      const last = TCG_MANGA_CHAPTERS.find((c) => c.id === "last-table")!,
        extra = book("tcg", last.id)
      const pages = mangaPages("tcg", last, extra, { storyEnding: ending })
      expect(extra.editions[ending]).toEqual(pages)
      expect(pages.at(-1)!.title).toBe(
        ending === "remember"
          ? "Một chỗ trong câu chuyện"
          : "Công thức chưa có tên",
      )
      for (const chapter of LIVING_CHOICES)
        for (const option of chapter.options) {
          const context = {
            storyEnding: ending,
            story400: {
              version: 1 as const,
              giftClaimed: false,
              originEnding: ending,
              decisions: { [chapter.id]: option.id },
              choices: {},
              seenScenes: [],
              claimedRewards: [],
            },
          }
          const before = JSON.stringify(context)
          const source = TCG_MANGA_CHAPTERS.find((c) => c.id === chapter.id)!,
            extra = book("tcg", source.id)
          const pages = mangaPages("tcg", source, extra, context)
          expect(
            extra.editions[mangaEdition("tcg", chapter.id, context)],
          ).toEqual(pages)
          for (const line of option.lines)
            expect(lines(pages).map((l) => l.text)).toContain(line.text)
          expect(JSON.stringify(context)).toBe(before)
        }
    }
  })
  it("keeps Liên's rescue reveal after Bách's confession", () => {
    const chapter = TCG_MANGA_CHAPTERS.find((c) => c.id === "last-table")!
    const all = lines(mangaPages("tcg", chapter, book("tcg", chapter.id)))
    expect(all.findIndex((l) => l.text.startsWith("Đứa bé ấy"))).toBeLessThan(
      all.findIndex((l) => l.text.startsWith("Con muốn được biết sự thật")),
    )
  })
  it("renders only the cover for locked chapters and keeps original unlock requirements", () => {
    const html = renderToStaticMarkup(
      createElement(MangaChronicle, { track: "tcg" }),
    )
    expect((html.match(/<img /g) ?? []).length).toBe(1)
    expect(html).not.toContain("Phố Đèn Lồng")
    expect(html).not.toContain("manga5916")
    expect(
      unlockedAdventureManga({ "lantern-6-hard": 3, "lantern-6-extreme": 3 }),
    ).toEqual([])
  })
})
