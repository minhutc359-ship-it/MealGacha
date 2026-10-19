import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { ComicPage, MangaChronicle } from "@/components/game/MangaChronicle"
import {
  INTRO_MANGA_CHAPTERS,
  type MangaImagePage,
} from "@/game/mangaChronicle"
import { useModeIntroStore } from "@/game/modeIntroState"

describe("introductory manga", () => {
  it("displays a complete image with an accessible optional transcript", () => {
    const page: MangaImagePage = {
      id: "sample",
      title: "Ấn Vị",
      image: "/assets/intro-manga5918/origin-1.webp",
      size: [1024, 1536],
      fullPage: true,
      lines: [{ speaker: "Bách", text: "Một câu chuyện trong bữa cơm." }],
    }
    const markup = renderToStaticMarkup(
      createElement(ComicPage, { page, number: 1 }),
    )
    expect(markup).toContain('width="1024" height="1536"')
    expect(markup).toContain("manga-full-art")
    expect(markup).toContain("manga-sr-only")
    expect(markup).toContain("Một câu chuyện trong bữa cơm.")
    expect(markup).not.toMatch(/<svg|viewBox|<image /)
    const transcript = renderToStaticMarkup(
      createElement(ComicPage, { page, number: 1, transcript: true }),
    )
    expect(transcript).not.toContain("manga-sr-only")
  })
  it("can be opened before any story chapter is unlocked", () => {
    for (const track of ["tcg", "adventure"] as const) {
      const html = renderToStaticMarkup(
        createElement(MangaChronicle, { track }),
      )
      expect(html).toContain("12 trang")
      expect(html).toContain("Một lời mời, bốn hành trình")
      expect((html.match(/<img /g) ?? []).length).toBe(1)
      expect(html).not.toContain("intro-manga5918/origin-1.webp")
    }
    expect(INTRO_MANGA_CHAPTERS.map((c) => c.id)).toEqual([
      "origin",
      "cards",
      "formation",
      "journey",
    ])
  })
  it("uses transient introduction state, separate from live gameplay", () => {
    useModeIntroStore.getState().openComic()
    expect(useModeIntroStore.getState().comic).toBe(true)
    useModeIntroStore.getState().open("auto")
    expect(useModeIntroStore.getState().comic).toBe(false)
    useModeIntroStore.getState().close()
    expect(useModeIntroStore.getState().mode).toBeNull()
    expect(useModeIntroStore.getState().comicTrigger).toBeNull()
    const source = readFileSync("src/game/modeIntroState.ts", "utf8")
    expect(source).not.toMatch(
      /useGameStore|useAppStore|localStorage|\.persist\(/,
    )
  })
})
