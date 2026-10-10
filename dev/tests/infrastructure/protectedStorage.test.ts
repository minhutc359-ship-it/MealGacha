import { beforeEach, describe, expect, it } from "vitest"
import { loadGame, saveGame, GAME_KEY, parseGame } from "@/game/storage"
import { newGame } from "@/game/progression"
import { checkpointKey, clearProtectedState, getStorageIssues, writeProtectedBatch, recoveryCandidates, exportRecovery, loadProtected, USER_KEY } from "@/infrastructure/storage/protectedStorage"
const memory = new Map<string, string>()
let failOnce = ""
beforeEach(() => {
  memory.clear(); failOnce = ""
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { if (key === failOnce) { failOnce = ""; throw new Error("Quota exceeded") }; memory.set(key, value) },
    removeItem: (key: string) => memory.delete(key),
  } })
  clearProtectedState()
})
const seed = () => { const save = { ...newGame(), coins: 9876, dust: 321, pity: 7, storyEnding: "release" as const, clearedStages: ["lantern-1"] }; memory.set(GAME_KEY, JSON.stringify(save)); return save }
describe("progression recovery across failures, old binaries and tabs", () => {
  it("does not replace malformed progression with the fallback profile", () => {
    memory.set(GAME_KEY, "{broken:original-save")
    loadGame()
    expect(() => saveGame(newGame())).toThrow(/phục hồi/)
    expect(memory.get(GAME_KEY)).toBe("{broken:original-save")
    expect(JSON.parse(exportRecovery()).entries[0].raw).toBe("{broken:original-save")
  })
  it("blocks future saves without stripping their unknown fields", () => {
    const raw = JSON.stringify({ ...newGame(), version: 2, futureInventory: ["v5-card"] })
    memory.set(GAME_KEY, raw); loadGame()
    expect(getStorageIssues()[0].reason).toBe("unsupported")
    expect(() => saveGame(newGame())).toThrow()
    expect(memory.get(GAME_KEY)).toBe(raw)
  })
  it("keeps collection, ending and resources through normal load and checkpoints", () => {
    const before = seed(), loaded = loadGame()
    expect(loaded).toEqual(before)
    saveGame({ ...loaded, coins: loaded.coins + 100 })
    const recovered = JSON.parse(memory.get(checkpointKey(GAME_KEY))!)
    expect(JSON.parse(recovered.previous)).toEqual(before)
    expect(loadGame().coins).toBe(9976)
    expect(loadGame().storyEnding).toBe("release")
    expect(loadGame().cards).toEqual(before.cards)
  })
  it("rejects a stale writer and keeps the other tab's exact value", () => {
    const before = seed(); loadGame()
    const other = JSON.stringify({ ...before, coins: 40000 })
    memory.set(GAME_KEY, other)
    expect(() => saveGame({ ...before, coins: 1 })).toThrow(/tab khác/)
    expect(memory.get(GAME_KEY)).toBe(other)
    expect(getStorageIssues()[0].reason).toBe("conflict")
  })
  it.each(["mealgacha.progress-journal.v4", GAME_KEY, checkpointKey(GAME_KEY)])("keeps the original when writing %s fails", key => {
    const before = seed(); loadGame(); failOnce = key
    expect(() => saveGame({ ...before, coins: 1 })).toThrow()
    expect(JSON.parse(memory.get(GAME_KEY)!)).toEqual(before)
    expect(memory.has("mealgacha.progress-journal.v4")).toBe(false)
  })
  it("retains v4 checkpoint when an old binary overwrites the v1 key", () => {
    const before = seed(); loadGame(); saveGame({ ...before, coins: 20000 })
    memory.set(GAME_KEY, JSON.stringify(before)); loadGame()
    expect(getStorageIssues()[0].reason).toBe("conflict")
    const candidates = recoveryCandidates(GAME_KEY, parseGame)
    const saved = candidates.find(candidate => candidate.value.coins === 20000)!
    expect(saved).toBeTruthy()
    writeProtectedBatch([{ key: GAME_KEY, value: saved.value }], true)
    expect(loadGame().coins).toBe(20000)
    expect(getStorageIssues()).toEqual([])
  })
  it("rolls back both progression keys if the second profile fails", () => {
    const before = seed(); const profile = { keys: 20 }
    memory.set(USER_KEY, JSON.stringify(profile)); loadGame(); loadProtected(USER_KEY, raw => raw, () => ({}))
    failOnce = checkpointKey(USER_KEY)
    expect(() => writeProtectedBatch([{ key: GAME_KEY, value: { ...before, coins: 1 } }, { key: USER_KEY, value: { keys: 1 } }])).toThrow()
    expect(JSON.parse(memory.get(GAME_KEY)!)).toEqual(before)
    expect(JSON.parse(memory.get(USER_KEY)!)).toEqual(profile)
  })
  it("offers the pre-interruption snapshot without auto-committing either branch", () => {
    const before = seed(), after = JSON.stringify({ ...before, coins: 2 })
    memory.set("mealgacha.progress-journal.v4", JSON.stringify({ entries: [{ key: GAME_KEY, before: JSON.stringify(before), after }] }))
    memory.set(GAME_KEY, after); loadGame()
    expect(getStorageIssues()[0].reason).toBe("interrupted")
    expect(() => saveGame(newGame())).toThrow()
    expect(recoveryCandidates(GAME_KEY, parseGame).map(candidate => candidate.value.coins)).toContain(9876)
    expect(memory.get(GAME_KEY)).toBe(after)
  })
})
