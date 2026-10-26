import { describe, expect, it } from "vitest"
import { questJournal, pageSlice, textPages } from "@/aw2/world/questJournal"
import { newWorldProgress } from "@/aw2/world/model"
import { newEconomy, QUEST_REWARDS } from "@/aw2/economy/model"
import { QUEST_IDS, QUEST_GRANTS } from "@/aw2/world/ids"

describe("UI-V11 journal projection", () => {
  it("shows the four immutable main quests, actual XP/items and only one current quest", () => {
    const world = newWorldProgress(),
      economy = newEconomy(),
      journal = questJournal(world, economy)
    expect(journal.map((q) => q.id)).toEqual(QUEST_IDS)
    expect(journal.map((q) => q.reward)).toEqual([...QUEST_REWARDS])
    expect(journal.map((q) => q.status)).toEqual([
      "available",
      "locked",
      "locked",
      "locked",
    ])
    expect(journal.filter((q) => q.current)).toHaveLength(1)
    expect(journal[0].objective).toMatch(/Bà Giữ Chỗ/)
  })
  it.each([0, 1, 2, 3])(
    "quest%d separates current active/ready from actual reward receipt",
    (questIndex) => {
      const world = { ...newWorldProgress(), questIndex, accepted: true },
        economy = newEconomy()
      expect(questJournal(world, economy)[questIndex].status).toBe("active")
      const ready = {
        ...world,
        tableRead: true,
        memories: [
          "aw2-event-memory-vendor",
          "aw2-event-memory-chair",
          "aw2-event-memory-bowl",
        ] as typeof world.memories,
        puzzleStep: 3,
        bossDefeated: true,
        tableNoteRead: true,
      }
      const projected = questJournal(ready, economy)[questIndex]
      expect(projected.status).toBe("ready_to_claim")
      expect(projected.complete).toBe(false)
      expect(projected.rewardClaimed).toBe(false)
      expect(economy).toEqual(newEconomy())
    },
  )
  it.each(["wait", "share"] as const)(
    "completed%s uses receipts without inventing an active objective",
    (endingChoice) => {
      const world = { ...newWorldProgress(), questIndex: 4, endingChoice },
        economy = { ...newEconomy(), receipts: [...QUEST_GRANTS] }
      expect(
        questJournal(world, economy).every(
          (q) => q.complete && q.status === "claimed" && !q.current,
        ),
      ).toBe(true)
    },
  )
  it("migration-style missing receipts stay pending without silently granting or claiming", () => {
    const world = { ...newWorldProgress(), questIndex: 2 },
      economy = newEconomy(),
      before = JSON.stringify({ world, economy })
    const journal = questJournal(world, economy)
    expect(
      journal.slice(0, 2).map((q) => [q.status, q.complete, q.rewardClaimed]),
    ).toEqual([
      ["ready_to_claim", true, false],
      ["ready_to_claim", true, false],
    ])
    expect(JSON.stringify({ world, economy })).toBe(before)
  })
  it("returned rewards cannot mutate canonical tuning or source saves", () => {
    const world = newWorldProgress(),
      economy = newEconomy(),
      before = JSON.stringify({ world, economy }),
      journal = questJournal(world, economy)
    journal[0].reward.xp = (999 as typeof journal[0]["reward"]["xp"])
    expect(QUEST_REWARDS[0].xp).toBe(30)
    expect(questJournal(world, economy)[0].reward.xp).toBe(30)
    expect(JSON.stringify({ world, economy })).toBe(before)
  })
})
describe("UI-V11 bounded pages", () => {
  it.each([0, 1, 4, 30, 100])(
    "%ditems are reachable once, without omission or duplicates",
    (count) => {
      const items = Array.from({ length: count }, (_, i) => i),
        before = [...items],
        pages = Math.max(1, Math.ceil(count / 3)),
        seen: number[] = []
      for (let i = 0; i < pages; i++) {
        const p = pageSlice(items, i, 3)
        expect(p.items.length).toBeLessThanOrEqual(3)
        expect(p.page).toBe(i)
        expect(p.pages).toBe(pages)
        seen.push(...p.items)
      }
      expect(seen).toEqual(items)
      expect(items).toEqual(before)
      expect(pageSlice(items, -8, 3).page).toBe(0)
      expect(pageSlice(items, 999, 3).page).toBe(pages - 1)
    },
  )
  it.each([
    [NaN, 1],
    [1.1, 1],
    [0, 0],
    [0, -1],
    [0, 1.5],
    [Infinity, 2],
  ])("rejects invalid page request%s/size%s", (page, size) => {
    expect(() => pageSlice([], page, size)).toThrow()
  })
  it.each([
    "",
    "Bà Giữ Chỗ nhờ đọc mảnh khăn.",
    "Một lời mời bên bếp. ".repeat(100),
    "Ớ".repeat(1000),
    "🍚".repeat(200),
    "  giữ  khoảng\ntrắng  ",
  ])("long/Unicodecopy is exact after paging", (text) => {
    const pages = textPages(text, 90)
    expect(pages.join("")).toBe(text)
    expect(pages.every((p) => Array.from(p).length <= 90)).toBe(true)
    expect(pages.length).toBeGreaterThan(0)
  })
  it.each([0, -1, NaN, 1.1, Infinity])(
    "rejects invalid text size%s",
    (limit) => {
      expect(() => textPages("text", limit)).toThrow()
    },
  )
})
