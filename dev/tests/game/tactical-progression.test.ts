import { describe, expect, it } from "vitest"
import {
  claimBattleReward,
  commitTacticalProgress,
  readTacticalProgress,
  TACTICAL_PROGRESS_JOURNAL_KEY,
  TACTICAL_PROGRESS_KEY,
} from "@/game/tacticalTcg/progression"
class MemoryStorage {
  data = new Map<string, string>()
  failOn: string | null = null
  beforeRead: (key: string) => void = () => {}
  getItem(key: string) {
    this.beforeRead(key)
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    if (this.failOn === key) throw Error("write failed")
    this.data.set(key, value)
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
}
describe("durable Tactical progress", () => {
  it("claims a reward exactly once across reload and duplicate submit", () => {
    const storage = new MemoryStorage(),
      reward = {
        id: "reward:b1",
        battleId: "b1",
        nodeId: "act-1-hearth",
        tinhVi: 30,
        cardCopies: { "card:chef-nhien": 1 },
      }
    expect(claimBattleReward(storage, reward, "manga:act-2").status).toBe(
      "committed",
    )
    expect(claimBattleReward(storage, reward, "manga:act-2").status).toBe(
      "duplicate",
    )
    const loaded = readTacticalProgress(storage)
    expect(loaded.tinhVi).toBe(30)
    expect(loaded.cardCopies["card:chef-nhien"]).toBe(1)
    expect(loaded.completedCampaignNodes).toContain("act-1-hearth")
    expect(loaded.unlockedMangaChapters).toContain("manga:act-2")
  })
  it("rolls back the journal and progress when write fails", () => {
    const storage = new MemoryStorage()
    storage.failOn = TACTICAL_PROGRESS_KEY
    expect(() =>
      commitTacticalProgress(storage, { receiptId: "r1", tinhVi: 10 }),
    ).toThrow("write failed")
    expect(storage.getItem(TACTICAL_PROGRESS_KEY)).toBeNull()
    expect(storage.getItem(TACTICAL_PROGRESS_JOURNAL_KEY)).toBeNull()
  })
  it("detects another tab changing the base before commit", () => {
    const storage = new MemoryStorage()
    let reads = 0
    storage.beforeRead = (key) => {
      if (key === TACTICAL_PROGRESS_KEY && ++reads === 2)
        storage.data.set(
          key,
          JSON.stringify({
            ...readTacticalProgress(new MemoryStorage()),
            revision: 9,
          }),
        )
    }
    expect(() =>
      commitTacticalProgress(storage, { receiptId: "race" }),
    ).toThrow("another tab")
  })
})
