import { describe, expect, it } from "vitest"
import { CULTURAL_PAGES, discoveredCulture, cultureForStage } from "@/game/culture"
import { newGame, settleBattle } from "@/game/progression"
import { startBattle } from "@/game/battle"
import { STARTER_DECK } from "@/game/catalog"
import { parseGame } from "@/game/storage"
import { STAGES } from "@/game/story"

describe("Vietnamese cultural discoveries", () => {
  it("does not reveal discoveries from an empty, unknown or future stage", () => {
    expect(discoveredCulture([])).toEqual([])
    expect(discoveredCulture(["unknown", "lantern-1"])).toEqual([])
    expect(discoveredCulture(["moon-2"])).toEqual([])
    expect(cultureForStage("lantern-1")).toBeUndefined()
  })
  it("opens the matching page after a real victory, without granting extra resources on read or replay", () => {
    const initial = newGame()
    const battle = startBattle(STARTER_DECK, "lantern-2")
    battle.result = "win"
    const won = settleBattle({ ...initial, battle })
    expect(won.clearedStages).toContain("lantern-2")
    const snapshot = JSON.stringify(won)
    expect(discoveredCulture(won.clearedStages).map((page) => page.id)).toEqual(
      ["tet"],
    )
    expect(cultureForStage("lantern-2")?.id).toBe("tet")
    expect(JSON.stringify(won)).toBe(snapshot)
    const replay = settleBattle({
      ...won,
      battle: { ...battle, settled: false },
    })
    expect(discoveredCulture(replay.clearedStages)).toHaveLength(1)
  })
  it("retroactively discovers every page in an existing v1 save and preserves it byte for byte", () => {
    const oldSave = {
      ...newGame(),
      clearedStages: STAGES.map((stage) => stage.id),
      storyEnding: "remember" as const,
    }
    const parsed = parseGame(oldSave)!
    const before = JSON.stringify(parsed)
    expect(parsed.version).toBe(1)
    expect(discoveredCulture(parsed.clearedStages)).toHaveLength(6)
    expect(
      discoveredCulture([...parsed.clearedStages, ...parsed.clearedStages]),
    ).toHaveLength(6)
    expect(JSON.stringify(parsed)).toBe(before)
  })
  it("keeps discovery order, official HTTPS sources and localized introductions valid", () => {
    expect(new Set(CULTURAL_PAGES.map((page) => page.id)).size).toBe(6)
    expect(new Set(CULTURAL_PAGES.map((page) => page.unlockStageId)).size).toBe(
      6,
    )
    const positions = CULTURAL_PAGES.map((page) =>
      STAGES.findIndex((stage) => stage.id === page.unlockStageId),
    )
    expect(
      positions.every(
        (position, index) =>
          position >= 0 && (index === 0 || position > positions[index - 1]),
      ),
    ).toBe(true)
    for (const page of CULTURAL_PAGES) {
      expect(page.englishFact.length).toBeGreaterThan(80)
      expect(page.sources.length).toBeGreaterThan(0)
      for (const source of page.sources) {
        const url = new URL(source.url)
        expect(url.protocol).toBe("https:")
        expect([
          "ich.unesco.org",
          "www.unesco.org",
          "vietnam.travel",
          "www.vietnam.travel",
        ]).toContain(url.hostname)
      }
    }
  })
})
