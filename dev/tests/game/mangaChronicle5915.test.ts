import { describe, expect, it } from "vitest"
import {
  ADVENTURE_MANGA_CHAPTERS,
  TCG_MANGA_CHAPTERS,
  tcgEndingBeat,
  unlockedAdventureManga,
  unlockedTcgManga,
} from "@/game/mangaChronicle"
import { CHAPTERS } from "@/game/story"
import { RPG_MAPS } from "@/game/adventureRpg/content"

describe("manga chronicle 5.9.15", () => {
  it("derives every page and script from the canonical chapter sources", () => {
    expect(TCG_MANGA_CHAPTERS.map((c) => c.id)).toEqual(CHAPTERS.map((c) => c.id))
    expect(ADVENTURE_MANGA_CHAPTERS.map((c) => c.id)).toEqual(RPG_MAPS.map((c) => c.id))
    for (const page of [...TCG_MANGA_CHAPTERS, ...ADVENTURE_MANGA_CHAPTERS]) {
      expect(page.image).toMatch(/^\/assets\/manga5915\/(tcg|adventure)\/[a-z-]+\.webp$/)
      expect(page.hook.length).toBeGreaterThan(40)
      expect(page.beats.length).toBeGreaterThanOrEqual(3)
      expect(page.beats.flatMap((b) => b.lines).every((line) => line.speaker && line.text)).toBe(true)
    }
  })
  it("unlocks a TCG page only after all three stages in its chapter", () => {
    expect(unlockedTcgManga([])).toEqual([])
    expect(unlockedTcgManga(["lantern-1", "lantern-2"])).toEqual([])
    expect(unlockedTcgManga(["lantern-1", "lantern-2", "lantern-3"])).toEqual(["lantern"])
  })
  it("unlocks Adventure pages from the normal boss-clear star only", () => {
    expect(unlockedAdventureManga({"lantern-5":3})).toEqual([])
    expect(unlockedAdventureManga({"lantern-6":1,"harbor-6":3})).toEqual(["lantern","harbor"])
  })
  it("shows only the ending actually chosen by the player", () => {
    expect(tcgEndingBeat(null)).toBeNull()
    expect(tcgEndingBeat("remember")?.title).toBe("Một chỗ trong câu chuyện")
    expect(tcgEndingBeat("release")?.title).toBe("Công thức chưa có tên")
  })
})
