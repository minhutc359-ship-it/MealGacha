import { newWorldProgress } from "@/aw2/world/model"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  AW2_DEV_SAVE_KEY,
  AW2_RESET_CONFIRMATION,
  decodeAw2Save,
} from "@/aw2/save/schema"
import { Aw2DevSaveStore } from "@/aw2/save/store"
import { ZONE_IDS } from "@/aw2/world/ids"

const legacyEntries = [
  ["foodchest.tcg.v1", '{"coins":9876,"cards":{"owned":7}}'],
  ["foodchest.user.v1", '{"keys":42}'],
  ["foodchest.tcg.v1.checkpoint.v4", "original checkpoint"],
  ["mealgacha.progress-journal.v4", "original journal"],
  ["mealgacha.progress-writer.v4", "original writer"],
] as const

function fixture() {
  const memory = new Map<string, string>(legacyEntries)
  const getItem = vi.fn((key: string) => {
    if (key !== AW2_DEV_SAVE_KEY) throw Error("Access to legacy storage")
    return memory.get(key) ?? null
  })
  const setItem = vi.fn((key: string, value: string) => {
    if (key !== AW2_DEV_SAVE_KEY) throw Error("Access to legacy storage")
    memory.set(key, value)
  })
  let queue = Promise.resolve()
  const lock = <T>(action: () => T): Promise<T> => {
    const result = queue.then(action)
    queue = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }
  let sequence = 0
  const now = vi.fn(() => "2026-10-20T08:00:00.000Z")
  const options = {
    storage: () => ({ getItem, setItem }),
    lock,
    now,
    newId: () =>
      `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`,
  }
  const store = new Aw2DevSaveStore(options)
  function expectLegacyPreserved() {
    expect(
      [...memory.entries()].filter(([key]) => key !== AW2_DEV_SAVE_KEY),
    ).toEqual(legacyEntries)
    expect(getItem.mock.calls.every(([key]) => key === AW2_DEV_SAVE_KEY)).toBe(
      true,
    )
    expect(setItem.mock.calls.every(([key]) => key === AW2_DEV_SAVE_KEY)).toBe(
      true,
    )
  }
  return {
    memory,
    getItem,
    setItem,
    store,
    now,
    options,
    expectLegacyPreserved,
  }
}

afterEach(() => vi.unstubAllGlobals())

describe("SAVE-016D: destination validity inside the write lock", () => {
  const exit = `${ZONE_IDS[0]}:exit:east`
  it("validates a prepared scene exactly once and preserves all other save data", async () => {
    const f = fixture(),
      before = await f.store.save(null),
      ready = vi.fn()
    const source = { ...before.save.progress, x: 616, y: 192 }
    const next = await f.store.act(before.raw, source, exit, "travel", ready)
    expect(ready).toHaveBeenCalledTimes(1)
    expect(next.save.revision).toBe(before.save.revision + 1)
    expect(next.save.progress).toMatchObject({
      zoneId: ZONE_IDS[1],
      x: 64,
      y: 192,
    })
    expect(next.save.economy).toEqual(before.save.economy)
    expect(next.save.collection).toEqual(before.save.collection)
    f.expectLegacyPreserved()
  })
  it("writes nothing if the scene becomes invalid during an actual lock wait", async () => {
    const f = fixture(),
      before = await f.store.save(null)
    let release: () => void = () => {
      throw Error("Lock gate not initialized")
    }
    const blocked = new Promise<void>((resolve) => {
      release = resolve
    })
    const store = new Aw2DevSaveStore({
      ...f.options,
      lock: async (action) => {
        await blocked
        return action()
      },
    })
    let valid = true
    const ready = vi.fn(() => {
      if (!valid) throw Error("candidate disposed")
    })
    const pending = store.act(
      before.raw,
      { ...before.save.progress, x: 616 },
      exit,
      "travel",
      ready,
    )
    expect(ready).not.toHaveBeenCalled()
    valid = false
    release()
    await expect(pending).rejects.toThrow("candidate disposed")
    expect(f.setItem).toHaveBeenCalledTimes(1)
    expect(f.store.load()).toEqual(before)
    f.expectLegacyPreserved()
  })
  it("rejects stale raw before consulting readiness", async () => {
    const f = fixture(),
      before = await f.store.save(null),
      ready = vi.fn()
    const changed = await f.store.save(before.raw)
    await expect(
      f.store.act(
        before.raw,
        { ...before.save.progress, x: 616 },
        exit,
        "travel",
        ready,
      ),
    ).rejects.toMatchObject({ code: "conflict" })
    expect(ready).not.toHaveBeenCalled()
    expect(f.store.load()).toEqual(changed)
  })
  it("cannot use a renderer guard to bypass proximity or locked rules", async () => {
    const f = fixture(),
      before = await f.store.save(null),
      ready = vi.fn()
    await expect(
      f.store.act(before.raw, before.save.progress, exit, "travel", ready),
    ).rejects.toThrow()
    expect(ready).not.toHaveBeenCalled()
    expect(f.store.load()).toEqual(before)
  })
  it("does not permit a readiness hook on a nontravel action", async () => {
    const f = fixture(),
      before = await f.store.save(null),
      ready = vi.fn()
    await expect(
      f.store.act(
        before.raw,
        { ...before.save.progress, x: 160, y: 240 },
        "aw2-npc-giu-cho",
        "accept",
        ready,
      ),
    ).rejects.toMatchObject({ code: "invalid" })
    expect(ready).not.toHaveBeenCalled()
    expect(f.store.load()).toEqual(before)
  })
  it("keeps the original save on storage failure after successful readiness", async () => {
    const f = fixture(),
      before = await f.store.save(null),
      ready = vi.fn()
    f.setItem.mockImplementationOnce(() => {
      throw Error("quota")
    })
    await expect(
      f.store.act(
        before.raw,
        { ...before.save.progress, x: 616 },
        exit,
        "travel",
        ready,
      ),
    ).rejects.toMatchObject({ code: "write-failed" })
    expect(ready).toHaveBeenCalledTimes(1)
    expect(f.store.load()).toEqual(before)
  })
})

describe("SAVE-01: AW2 namespace, round-trip and explicit reset", () => {
  it("does not create a save or touch legacy storage on load", () => {
    const f = fixture()
    expect(f.store.load()).toEqual({ status: "empty", raw: null })
    expect(f.setItem).not.toHaveBeenCalled()
    f.expectLegacyPreserved()
  })

  it("creates and reloads a versioned envelope, preserving identity and incrementing revision", async () => {
    const f = fixture()
    const first = await f.store.save(null)
    expect(first.save).toMatchObject({
      gameId: "adventure-world-2",
      environment: "development",
      schemaVersion: 6,
      revision: 0,
      progress: newWorldProgress(),
    })
    expect(new Aw2DevSaveStore(f.options).load()).toEqual(first)
    f.now.mockReturnValue("2026-10-20T08:01:00.000Z")
    const second = await f.store.save(first.raw)
    expect(second.save).toMatchObject({
      saveId: first.save.saveId,
      createdAt: first.save.createdAt,
      revision: 1,
      updatedAt: "2026-10-20T08:01:00.000Z",
    })
    expect(f.store.load()).toEqual(second)
    f.expectLegacyPreserved()
  })

  it("preserves original bytes when reset is cancelled and invalidates its confirmation", async () => {
    const f = fixture()
    const before = await f.store.save(null)
    const reset = f.store.beginReset(before.raw)
    f.store.cancelReset()
    await expect(
      f.store.confirmReset(reset, AW2_RESET_CONFIRMATION),
    ).rejects.toMatchObject({ code: "confirmation" })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(before.raw)
    f.expectLegacyPreserved()
  })

  it.each(["", "reset aw2", "RESET AW2 ", "RESET SOUL OF MEAL"])(
    "rejects missing or incorrect confirmation: %j",
    async (phrase) => {
      const f = fixture()
      const before = await f.store.save(null)
      await expect(
        f.store.confirmReset(f.store.beginReset(before.raw), phrase),
      ).rejects.toMatchObject({ code: "confirmation" })
      expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(before.raw)
    },
  )

  it("resets only AW2 with new identity and consumes each confirmation once", async () => {
    const f = fixture()
    const before = await f.store.save(null)
    f.now.mockReturnValue("2026-10-20T09:00:00.000Z")
    const reset = f.store.beginReset(before.raw)
    const result = await f.store.confirmReset(reset, AW2_RESET_CONFIRMATION)
    expect(result.save.saveId).not.toBe(before.save.saveId)
    expect(result.save).toMatchObject({
      revision: 0,
      createdAt: "2026-10-20T09:00:00.000Z",
      progress: newWorldProgress(),
    })
    await expect(
      f.store.confirmReset(reset, AW2_RESET_CONFIRMATION),
    ).rejects.toMatchObject({ code: "confirmation" })
    expect(f.store.load()).toEqual(result)
    f.expectLegacyPreserved()
  })

  it("requires the exact current request, rather than a replayed or reconstructed request", async () => {
    const f = fixture()
    const before = await f.store.save(null)
    const old = f.store.beginReset(before.raw)
    const current = f.store.beginReset(before.raw)
    for (const request of [old, { ...current }]) {
      await expect(
        f.store.confirmReset(request, AW2_RESET_CONFIRMATION),
      ).rejects.toMatchObject({ code: "confirmation" })
    }
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(before.raw)
  })
})

describe("SAVE-03: validation, conflicts and failures", () => {
  it.each([
    ["{broken", "invalid"],
    ["null", "invalid"],
    ["[]", "invalid"],
    [
      JSON.stringify({ schemaVersion: 7, futureData: ["retain"] }),
      "unsupported",
    ],
    [JSON.stringify({ version: 1, gameId: "soul-of-meal" }), "invalid"],
  ])(
    "preserves unreadable or future data %s and blocks normal writes",
    async (raw, status) => {
      const f = fixture()
      f.memory.set(AW2_DEV_SAVE_KEY, raw)
      expect(f.store.load()).toEqual({ status, raw })
      await expect(f.store.save(raw)).rejects.toMatchObject({ code: "invalid" })
      expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(raw)
      expect(f.setItem).not.toHaveBeenCalled()
      f.expectLegacyPreserved()
    },
  )

  it("rejects unknown fields, invalid identity/times/revisions and draft progress", async () => {
    const f = fixture()
    const { save } = await f.store.save(null)
    const invalid = [
      { ...save, gameId: "soul-of-meal" },
      { ...save, environment: "production" },
      { ...save, schemaVersion: 0 },
      { ...save, unknown: 1 },
      { ...save, saveId: "" },
      { ...save, revision: -1 },
      { ...save, revision: 0.5 },
      { ...save, revision: 2 ** 53 },
      { ...save, createdAt: "2026-10-20" },
      { ...save, updatedAt: "invalid" },
      { ...save, updatedAt: "2026-10-19T00:00:00.000Z" },
      { ...save, progress: { spirits: ["aw2-unapproved"] } },
    ]
    for (const value of invalid)
      expect(decodeAw2Save(JSON.stringify(value)).status).toBe("invalid")
    expect(
      decodeAw2Save(
        JSON.stringify({
          ...save,
          createdAt: "2026-10-20T08:00:00Z",
          updatedAt: "2026-10-20T08:00:00.001Z",
        }),
      ).status,
    ).toBe("ready")
  })

  it.each([
    "{broken",
    JSON.stringify({ schemaVersion: 7, futureData: ["retain"] }),
  ])("allows an explicitly confirmed dev reset of %s", async (raw) => {
    const f = fixture()
    f.memory.set(AW2_DEV_SAVE_KEY, raw)
    await f.store.confirmReset(f.store.beginReset(raw), AW2_RESET_CONFIRMATION)
    expect(f.store.load().status).toBe("ready")
    f.expectLegacyPreserved()
  })

  it("rejects stale save and stale reset after another tab writes", async () => {
    const f = fixture()
    const first = await f.store.save(null)
    const reset = f.store.beginReset(first.raw)
    const other = await new Aw2DevSaveStore(f.options).save(first.raw)
    await expect(f.store.save(first.raw)).rejects.toMatchObject({
      code: "conflict",
    })
    await expect(
      f.store.confirmReset(reset, AW2_RESET_CONFIRMATION),
    ).rejects.toMatchObject({ code: "conflict" })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(other.raw)
    f.expectLegacyPreserved()
  })

  it("serializes two writers and permits only the first write from the same snapshot", async () => {
    const f = fixture()
    const first = await f.store.save(null)
    const results = await Promise.allSettled([
      f.store.save(first.raw),
      new Aw2DevSaveStore(f.options).save(first.raw),
    ])
    expect(results.map((result) => result.status)).toEqual([
      "fulfilled",
      "rejected",
    ])
    expect(results[1]).toMatchObject({ reason: { code: "conflict" } })
    expect(f.store.load()).toMatchObject({ save: { revision: 1 } })
  })

  it("rejects a duplicate confirm before the first lock resolves", async () => {
    const f = fixture()
    const first = await f.store.save(null)
    const request = f.store.beginReset(first.raw)
    const results = await Promise.allSettled([
      f.store.confirmReset(request, AW2_RESET_CONFIRMATION),
      f.store.confirmReset(request, AW2_RESET_CONFIRMATION),
    ])
    expect(results.map((result) => result.status)).toEqual([
      "fulfilled",
      "rejected",
    ])
    expect(f.setItem).toHaveBeenCalledTimes(2)
  })

  it("does not recreate a save deleted by another tab without rereading it", async () => {
    const f = fixture()
    const before = await f.store.save(null)
    f.memory.delete(AW2_DEV_SAVE_KEY)
    await expect(f.store.save(before.raw)).rejects.toMatchObject({
      code: "conflict",
    })
    expect(f.memory.has(AW2_DEV_SAVE_KEY)).toBe(false)
  })

  it("reports storage read denial and preserves data", async () => {
    const f = fixture()
    const before = await f.store.save(null)
    f.getItem.mockImplementation(() => {
      throw Error("SecurityError")
    })
    expect(f.store.load()).toEqual({ status: "unavailable" })
    await expect(f.store.save(before.raw)).rejects.toMatchObject({
      code: "unavailable",
    })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(before.raw)
  })

  it("handles a denied localStorage getter without initializing an in-memory replacement", async () => {
    const store = new Aw2DevSaveStore({
      storage: () => {
        throw Error("SecurityError")
      },
      lock: async (action) => action(),
    })
    expect(store.load().status).toBe("unavailable")
    await expect(store.save(null)).rejects.toMatchObject({
      code: "unavailable",
    })
  })

  it("keeps original bytes on quota/write failure and requires a new reset confirmation after failure", async () => {
    const f = fixture()
    const before = await f.store.save(null)
    const reset = f.store.beginReset(before.raw)
    f.setItem.mockImplementation(() => {
      throw Error("QuotaExceededError")
    })
    await expect(f.store.save(before.raw)).rejects.toMatchObject({
      code: "write-failed",
    })
    await expect(
      f.store.confirmReset(reset, AW2_RESET_CONFIRMATION),
    ).rejects.toMatchObject({ code: "write-failed" })
    await expect(
      f.store.confirmReset(reset, AW2_RESET_CONFIRMATION),
    ).rejects.toMatchObject({ code: "confirmation" })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(before.raw)
    f.expectLegacyPreserved()
  })

  it("does not fabricate success when initial save cannot be written", async () => {
    const f = fixture()
    f.setItem.mockImplementation(() => {
      throw Error("QuotaExceededError")
    })
    await expect(f.store.save(null)).rejects.toMatchObject({
      code: "write-failed",
    })
    expect(f.memory.has(AW2_DEV_SAVE_KEY)).toBe(false)
  })

  it("blocks mutation when the browser cannot serialize writers", async () => {
    const f = fixture()
    vi.stubGlobal("navigator", {})
    const store = new Aw2DevSaveStore({ storage: f.options.storage })
    expect(store.load().status).toBe("empty")
    await expect(store.save(null)).rejects.toMatchObject({ code: "locking" })
    expect(f.setItem).not.toHaveBeenCalled()
  })

  it("keeps timestamps valid when the local clock moves backward", async () => {
    const f = fixture()
    const first = await f.store.save(null)
    f.now.mockReturnValue("2026-10-19T00:00:00.000Z")
    const next = await f.store.save(first.raw)
    expect(next.save.updatedAt).toBe(first.save.updatedAt)
    expect(decodeAw2Save(next.raw).status).toBe("ready")
  })

  it("rejects exhausted revisions without replacing the existing save", async () => {
    const f = fixture()
    const first = await f.store.save(null)
    const raw = JSON.stringify({
      ...first.save,
      revision: Number.MAX_SAFE_INTEGER,
    })
    f.memory.set(AW2_DEV_SAVE_KEY, raw)
    await expect(f.store.save(raw)).rejects.toThrow()
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(raw)
  })
})
