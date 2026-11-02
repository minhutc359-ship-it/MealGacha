import { describe, expect, it } from "vitest"
import { Aw2DevSaveStore } from "@/aw2/save/store"
import {
  AW2_DEV_SAVE_KEY,
  AW2_SAVE_BACKUP_KEY,
  AW2_SAVE_JOURNAL_KEY,
} from "@/aw2/save/schema"
import {
  AW2_BACKUP_MAX_BYTES,
  exportAw2Backup,
  inspectAw2Backup,
} from "@/aw2/save/transfer"

function fixture() {
  const memory = new Map<string, string>([
    ["foodchest.user.v1", "original-chest"],
  ])
  let denied = ""
  let seq = 0
  const store = new Aw2DevSaveStore({
    storage: () => ({
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => {
        if (key === denied) throw Error("Quota")
        memory.set(key, value)
      },
      removeItem: (key) => {
        memory.delete(key)
      },
    }),
    lock: async (action) => action(),
    now: () => "2026-11-02T05:00:00.000Z",
    newId: () => `00000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`,
  })
  return {
    store,
    memory,
    deny: (key: string) => {
      denied = key
    },
  }
}

describe("AW2 player backup transfer", () => {
  it("round-trips committed progress without reading any other storage", async () => {
    const f = fixture()
    const original = await f.store.save(null)
    const backup = await exportAw2Backup(original)
    const inspected = await inspectAw2Backup(backup)
    expect(inspected.raw).toBe(original.raw)
    expect(inspected.save).toEqual(original.save)
    expect(backup).not.toContain("original-chest")
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(original.raw)
  })

  it("detects changed bytes before restoration", async () => {
    const f = fixture()
    const original = await f.store.save(null)
    const backup = JSON.parse(await exportAw2Backup(original))
    backup.payload = backup.payload.replace('"questIndex":0', '"questIndex":4')
    await expect(inspectAw2Backup(JSON.stringify(backup))).rejects.toThrow(
      "đã thay đổi",
    )
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(original.raw)
  })

  it.each(["not-json", '{"format":"other-game"}', "{}", "null"])(
    "rejects invalid or unrelated backup %s",
    async (text) => {
      await expect(inspectAw2Backup(text)).rejects.toThrow()
    },
  )

  it("rejects oversized files before parsing or hashing", async () => {
    await expect(
      inspectAw2Backup("a".repeat(AW2_BACKUP_MAX_BYTES + 1)),
    ).rejects.toThrow("256 KB")
  })

  it("refuses to export a wrapper larger than the import limit", async () => {
    const f = fixture()
    const original = await f.store.save(null)
    const padding =
      AW2_BACKUP_MAX_BYTES - new TextEncoder().encode(original.raw).byteLength
    await expect(
      exportAw2Backup({ ...original, raw: original.raw + " ".repeat(padding) }),
    ).rejects.toThrow("256 KB")
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(original.raw)
  })

  it("requires confirmation and preserves original chest data", async () => {
    const f = fixture()
    const original = await f.store.save(null)
    await expect(
      f.store.restore(original.raw, original.raw, ""),
    ).rejects.toMatchObject({ code: "confirmation" })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(original.raw)
    expect(f.memory.get("foodchest.user.v1")).toBe("original-chest")
  })

  it("restores through backup/journal/read-back while preserving save identity and inventory", async () => {
    const f = fixture()
    const original = await f.store.save(null)
    const current = await f.store.save(original.raw, {
      ...original.save.progress,
      x: 112,
    })
    const restored = await f.store.restore(
      current.raw,
      original.raw,
      "RESTORE AW2",
    )
    expect(restored.save.progress).toEqual(original.save.progress)
    expect(restored.save.economy).toEqual(original.save.economy)
    expect(restored.save.collection).toEqual(original.save.collection)
    expect(restored.save.saveId).toBe(original.save.saveId)
    expect(restored.save.revision).toBe(current.save.revision + 1)
    expect(f.memory.get(AW2_SAVE_BACKUP_KEY)).toBe(current.raw)
    expect(f.memory.has(AW2_SAVE_JOURNAL_KEY)).toBe(false)
  })

  it("refuses a stale-tab restore instead of overwriting newer progress", async () => {
    const f = fixture()
    const first = await f.store.save(null)
    const second = await f.store.save(first.raw)
    await expect(
      f.store.restore(first.raw, first.raw, "RESTORE AW2"),
    ).rejects.toMatchObject({ code: "conflict" })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(second.raw)
  })

  it("preserves a future-schema save", async () => {
    const f = fixture()
    const original = await f.store.save(null)
    const future = JSON.stringify({ schemaVersion: 99 })
    f.memory.set(AW2_DEV_SAVE_KEY, future)
    await expect(
      f.store.restore(future, original.raw, "RESTORE AW2"),
    ).rejects.toMatchObject({ code: "invalid" })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(future)
  })

  it("keeps the current value and recovery journal when main writing fails", async () => {
    const f = fixture()
    const first = await f.store.save(null)
    const second = await f.store.save(first.raw)
    f.deny(AW2_DEV_SAVE_KEY)
    await expect(
      f.store.restore(second.raw, first.raw, "RESTORE AW2"),
    ).rejects.toMatchObject({ code: "write-failed" })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(second.raw)
    expect(f.memory.get(AW2_SAVE_JOURNAL_KEY)).toBeTruthy()
  })
})
