import { describe, expect, it, vi } from "vitest"
import {
  exportTacticalBackup,
  previewTacticalBackup,
  importTacticalBackup,
  undoTacticalImport,
  tacticalRestoreSnapshot,
  recoverTacticalRestore,
  TACTICAL_RESTORE_UNDO_KEY,
  TACTICAL_RESTORE_JOURNAL_KEY,
} from "@/game/tacticalTcg/progression/backup"
import {
  ensureTacticalAccount,
  readTacticalProgress,
  claimTacticalDaily,
  tacticalDailyDate,
  newTacticalRequestId,
  saveTacticalCheckpoint,
  TACTICAL_PROGRESS_KEY,
  TacticalCheckpointConflict,
} from "@/game/tacticalTcg/progression"
import {
  migrateTacticalStorage,
  TACTICAL_PROFILE_KEY,
  TACTICAL_MIGRATION_RECEIPT_KEY,
} from "@/game/tacticalTcg/migration"
import {
  createTacticalBattle,
  playAutomaticRound,
} from "@/game/tacticalTcg/engine"
import { TACTICAL_STARTER } from "@/game/tacticalTcg/cards"
import { validTacticalCheckpoint } from "@/game/tacticalTcg/progression/checkpoint"

class MemoryStorage {
  data = new Map<string, string>()
  failKey: string | null = null
  corruptKey: string | null = null
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    if (this.failKey === key) {
      this.failKey = null
      throw Error("quota")
    }
    this.data.set(key, this.corruptKey === key ? value + "broken" : value)
    if (this.corruptKey === key) this.corruptKey = null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
}
const prepare = () => {
  const storage = new MemoryStorage()
  migrateTacticalStorage(storage)
  ensureTacticalAccount(storage)
  return storage
}
const match = () =>
  createTacticalBattle({
    battleId: "practice:tactical-starter:v2",
    deck: TACTICAL_STARTER,
    seed: 101,
  })
const entries = (storage: MemoryStorage) =>
  [...storage.data.entries()].sort(([a], [b]) => a.localeCompare(b))

describe("Tactical backup and session continuity", () => {
  it("creates distinct pack and deck IDs when randomUUID is unavailable", () => {
    try {
      vi.stubGlobal("crypto", {
        getRandomValues: (bytes: Uint8Array) => bytes.fill(7),
      })
      expect(
        new Set(Array.from({ length: 50 }, () => newTacticalRequestId())).size,
      ).toBe(50)
      vi.stubGlobal("crypto", undefined)
      expect(
        new Set(Array.from({ length: 50 }, () => newTacticalRequestId())).size,
      ).toBe(50)
    } finally {
      vi.unstubAllGlobals()
    }
  })
  it("previews without writes, imports raw progress, supports undo and never repeats starter grants", () => {
    const storage = prepare(),
      exported = exportTacticalBackup(storage),
      exportedProgress = storage.getItem(TACTICAL_PROGRESS_KEY)
    claimTacticalDaily(storage, new Date("2026-11-04T09:00:00Z"))
    const before = entries(storage),
      preview = previewTacticalBackup(storage, exported)
    expect(preview).toMatchObject({ decks: 1, cards: 12, tickets: 2, nodes: 0 })
    expect(entries(storage)).toEqual(before)
    importTacticalBackup(storage, preview)
    expect(storage.getItem(TACTICAL_PROGRESS_KEY)).toBe(exportedProgress)
    expect(storage.getItem(TACTICAL_RESTORE_UNDO_KEY)).not.toBeNull()
    expect(migrateTacticalStorage(storage).status).toBe("existing")
    expect(ensureTacticalAccount(storage).packTickets).toBe(2)
    expect(() => importTacticalBackup(storage, preview)).toThrow(/thay đổi/)
    undoTacticalImport(storage, tacticalRestoreSnapshot(storage))
    expect(entries(storage)).toEqual(before)
    expect(readTacticalProgress(storage).packTickets).toBe(3)
  })
  it("supports the old five-key export without overwriting its profile on boot", () => {
    const source = prepare(),
      destination = new MemoryStorage(),
      data = JSON.parse(exportTacticalBackup(source))
    delete data.storage[TACTICAL_MIGRATION_RECEIPT_KEY]
    importTacticalBackup(
      destination,
      previewTacticalBackup(destination, JSON.stringify(data)),
    )
    expect(migrateTacticalStorage(destination).status).toBe("existing")
    expect(ensureTacticalAccount(destination).packTickets).toBe(2)
    expect(destination.getItem(TACTICAL_PROFILE_KEY)).toBe(
      source.getItem(TACTICAL_PROFILE_KEY),
    )
  })
  it("rejects malformed, future and incomplete backups without changing any byte", () => {
    const storage = prepare(),
      before = entries(storage),
      base = JSON.parse(exportTacticalBackup(storage))
    const variants = [
      "no json",
      "{}",
      JSON.stringify({ ...base, format: "v9" }),
    ]
    for (const change of [
      (p: any) => {
        p.schemaVersion = 99
      },
      (p: any) => {
        p.packTickets = -1
      },
      (p: any) => {
        p.decks = [null]
      },
      (p: any) => {
        p.accountReady = "true"
      },
      (p: any) => {
        p.cardCopies["card:banh-mi"] = "two"
      },
      (p: any) => {
        p.lastPack = { cards: ["banh-mi"] }
      },
      (p: any) => {
        p.campaignChoices = { "act-4-vow": { bad: true } }
      },
    ]) {
      const copy = structuredClone(base),
        progress = JSON.parse(copy.storage[TACTICAL_PROGRESS_KEY])
      change(progress)
      copy.storage[TACTICAL_PROGRESS_KEY] = JSON.stringify(progress)
      variants.push(JSON.stringify(copy))
    }
    for (const text of variants)
      expect(() => previewTacticalBackup(storage, text)).toThrow()
    expect(entries(storage)).toEqual(before)
  })
  it("rejects a preview after another tab changes progress", () => {
    const storage = prepare(),
      preview = previewTacticalBackup(storage, exportTacticalBackup(storage))
    claimTacticalDaily(storage, new Date("2026-11-05T09:00:00Z"))
    const before = entries(storage)
    expect(() => importTacticalBackup(storage, preview)).toThrow(/thay đổi/)
    expect(entries(storage)).toEqual(before)
  })
  it("rolls back every affected value after quota errors or failed readback", () => {
    for (const key of [
      TACTICAL_PROGRESS_KEY,
      TACTICAL_PROFILE_KEY,
      TACTICAL_MIGRATION_RECEIPT_KEY,
      TACTICAL_RESTORE_UNDO_KEY,
    ])
      for (const failure of ["failKey", "corruptKey"] as const) {
        const storage = prepare(),
          exported = exportTacticalBackup(storage)
        claimTacticalDaily(storage, new Date("2026-11-04T09:00:00Z"))
        const before = entries(storage),
          preview = previewTacticalBackup(storage, exported)
        storage[failure] = key
        expect(() => importTacticalBackup(storage, preview)).toThrow()
        expect(entries(storage)).toEqual(before)
      }
  })
  it("restores interrupted transactions before migration and preserves an invalid journal", () => {
    const storage = prepare(),
      before = entries(storage)
    storage.setItem(
      TACTICAL_RESTORE_JOURNAL_KEY,
      JSON.stringify({
        schemaVersion: 1,
        previous: tacticalRestoreSnapshot(storage),
      }),
    )
    storage.setItem(TACTICAL_PROGRESS_KEY, "interrupted")
    recoverTacticalRestore(storage)
    expect(entries(storage)).toEqual(before)
    storage.setItem(TACTICAL_RESTORE_JOURNAL_KEY, "{broken")
    expect(() => recoverTacticalRestore(storage)).toThrow(/Nhật ký/)
    expect(storage.getItem(TACTICAL_RESTORE_JOURNAL_KEY)).toBe("{broken")
    expect(storage.getItem(TACTICAL_PROGRESS_KEY)).toBe(
      before.find(([key]) => key === TACTICAL_PROGRESS_KEY)?.[1],
    )
  })
  it("blocks stale battle writes while permitting unrelated wallet writes", () => {
    const storage = prepare(),
      first = match()
    saveTacticalCheckpoint(storage, first, null)
    const tabB = readTacticalProgress(storage).checkpoint!
    claimTacticalDaily(storage, new Date("2026-11-04T09:00:00Z"))
    const next = playAutomaticRound(first)
    saveTacticalCheckpoint(storage, next, first)
    const before = entries(storage)
    expect(() =>
      saveTacticalCheckpoint(storage, playAutomaticRound(tabB), tabB),
    ).toThrow(TacticalCheckpointConflict)
    expect(entries(storage)).toEqual(before)
    expect(readTacticalProgress(storage).packTickets).toBe(3)
    expect(readTacticalProgress(storage).checkpoint).toEqual(next)
  })
  it("rejects corrupt runtime fields before rendering a checkpoint", () => {
    const state = playAutomaticRound(match())
    expect(validTacticalCheckpoint(state)).toBe(true)
    expect(state.units.length).toBeGreaterThan(0)
    for (const change of [
      (s: any) => {
        s.units[0].role = "broken"
      },
      (s: any) => {
        s.units[0].traits = null
      },
      (s: any) => {
        s.traps = [{ armed: true }]
      },
      (s: any) => {
        s.cardGame.sides.player.mulliganUsed = "yes"
      },
      (s: any) => {
        s.cardGame.rewardCardId = "missing"
      },
      (s: any) => {
        s.reward = { tinhVi: "many" }
      },
    ]) {
      const copy = structuredClone(state)
      change(copy)
      expect(validTacticalCheckpoint(copy)).toBe(false)
    }
  })
  it("uses Vietnam midnight for daily gift availability", () => {
    expect(tacticalDailyDate(new Date("2026-11-04T16:59:59Z"))).toBe(
      "2026-11-04",
    )
    expect(tacticalDailyDate(new Date("2026-11-04T17:00:00Z"))).toBe(
      "2026-11-05",
    )
  })
})
