/** A recoverable journal for progression keys. Asset caches never use this journal. */
export const USER_KEY = "foodchest.user.v1"
export const PROGRESSION_KEYS = ["foodchest.tcg.v1", USER_KEY] as const
const JOURNAL_KEY = "mealgacha.progress-journal.v4"
const WRITER_KEY = "mealgacha.progress-writer.v4"
export const checkpointKey = (key: string) => `${key}.checkpoint.v4`
type Parser<T> = (raw: unknown) => T | null
export interface StorageIssue {
  key: string
  reason: "invalid" | "unsupported" | "conflict" | "interrupted" | "unavailable"
  message: string
}
interface Checkpoint {
  version: 4
  revision: number
  raw: string
  previous: string | null
}
const expected = new Map<string, string | null>()
const issues = new Map<string, StorageIssue>()
const listeners = new Set<() => void>()
let snapshot: StorageIssue[] = []
const writer =
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `writer-${Date.now()}`
function emit() {
  snapshot = [...issues.values()]
  listeners.forEach((listener) => listener())
}
function block(key: string, reason: StorageIssue["reason"], message: string) {
  issues.set(key, { key, reason, message })
  emit()
}
function decode(raw: string | null): unknown {
  return raw === null ? null : JSON.parse(raw)
}
function readLease(): { owner: string; until: number } | null {
  try {
    const value = decode(localStorage.getItem(WRITER_KEY)) as {
      owner?: unknown
      until?: unknown
    } | null
    return value &&
      typeof value.owner === "string" &&
      typeof value.until === "number"
      ? { owner: value.owner, until: value.until }
      : null
  } catch {
    return null
  }
}
function checkpoint(key: string): Checkpoint | null {
  try {
    const value = decode(
      localStorage.getItem(checkpointKey(key)),
    ) as Checkpoint | null
    return value?.version === 4 &&
      typeof value.raw === "string" &&
      Number.isSafeInteger(value.revision)
      ? value
      : null
  } catch {
    return null
  }
}
export const subscribeStorageIssues = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export const getStorageIssues = () => snapshot
export function loadProtected<T>(
  key: string,
  parse: Parser<T>,
  fallback: () => T,
): T {
  if (typeof localStorage === "undefined") return fallback()
  try {
    const raw = localStorage.getItem(key)
    expected.set(key, raw)
    let interrupted = false
    try {
      const journal = decode(localStorage.getItem(JOURNAL_KEY)) as {
        entries?: { key: string }[]
      } | null
      interrupted = !!journal?.entries?.some((entry) => entry.key === key)
    } catch {
      interrupted = true
    }
    const saved = checkpoint(key)
    if (interrupted)
      block(
        key,
        "interrupted",
        "Một lần lưu chưa hoàn tất. Chọn bản muốn tiếp tục sau khi xuất bản phục hồi.",
      )
    else if (saved && raw !== saved.raw)
      block(
        key,
        "conflict",
        "Dữ liệu đã thay đổi ngoài phiên lưu mới. Bản checkpoint vẫn được giữ để phục hồi.",
      )
    else {
      issues.delete(key)
      emit()
    }
    if (raw === null) return fallback()
    let data: unknown
    try {
      data = decode(raw)
    } catch {
      block(
        key,
        "invalid",
        "Bản lưu không đọc được. Dữ liệu gốc được giữ nguyên; chưa tạo tiến trình thay thế.",
      )
      return fallback()
    }
    const value = parse(data)
    if (value !== null) return value
    const version =
      data as {
        version?: number
        schemaVersion?: number
        contentVersion?: number
      } ?? {}
    const future =
      (version.version ?? 1) > 1 ||
      (version.schemaVersion ?? 2) > 2 ||
      (version.contentVersion ?? 400) > 400
    block(
      key,
      future ? "unsupported" : "invalid",
      future
        ? "Bản lưu thuộc phiên bản mới hơn. Hãy giữ bản gốc và mở bằng bản game phù hợp."
        : "Bản lưu không hợp lệ. Dữ liệu gốc chưa bị thay đổi.",
    )
    return fallback()
  } catch {
    block(
      key,
      "unavailable",
      "Trình duyệt chưa cho phép đọc kho tiến trình. Hãy kiểm tra quyền lưu dữ liệu.",
    )
    return fallback()
  }
}
export class ProgressWriteError extends Error {}
/** Best-effort synchronous lease + raw comparison. An old binary ignores the lease;
 * the checkpoint detects its writes at the next read. Never merge battle states. */
export function writeProtectedBatch(
  values: { key: string; value: unknown }[],
  recovery = false,
) {
  const entries = values.map(({ key, value }) => ({
    key,
    after: JSON.stringify(value),
    before: localStorage.getItem(key),
    previousCheckpoint: localStorage.getItem(checkpointKey(key)),
  }))
  for (const entry of entries) {
    if (!recovery && issues.has(entry.key))
      throw new ProgressWriteError(
        "Tiến trình đang chờ phục hồi; chưa thể ghi đè.",
      )
    if (
      !recovery &&
      expected.has(entry.key) &&
      entry.before !== expected.get(entry.key)
    ) {
      block(
        entry.key,
        "conflict",
        "Tab khác vừa thay đổi tiến trình. Tải lại hoặc chọn bản phục hồi trước khi tiếp tục.",
      )
      throw new ProgressWriteError("Có thay đổi từ một tab khác.")
    }
  }
  const lease = readLease()
  if (lease && lease.owner !== writer && lease.until > Date.now())
    throw new ProgressWriteError("Một tab khác đang lưu. Vui lòng thử lại.")
  localStorage.setItem(
    WRITER_KEY,
    JSON.stringify({ owner: writer, until: Date.now() + 5000 }),
  )
  const touched: typeof entries = []
  let journalWritten = false
  try {
    const owned = () => readLease()?.owner === writer
    if (!owned()) throw new ProgressWriteError("Tab khác đang lưu tiến trình.")
    localStorage.setItem(
      JOURNAL_KEY,
      JSON.stringify({ version: 4, writer, entries }),
    )
    journalWritten = true
    for (const entry of entries) {
      if (!owned() || localStorage.getItem(entry.key) !== entry.before)
        throw new ProgressWriteError(
          "Tiến trình đổi trong lúc lưu. Bản cũ được giữ.",
        )
      const previous = checkpoint(entry.key)
      touched.push(entry)
      localStorage.setItem(entry.key, entry.after)
      localStorage.setItem(
        checkpointKey(entry.key),
        JSON.stringify({
          version: 4,
          revision: (previous?.revision ?? 0) + 1,
          raw: entry.after,
          previous: entry.before,
        } satisfies Checkpoint),
      )
    }
    localStorage.removeItem(JOURNAL_KEY)
    for (const entry of entries) {
      expected.set(entry.key, entry.after)
      issues.delete(entry.key)
    }
    emit()
    if (typeof window !== "undefined")
      window.dispatchEvent(
        new CustomEvent("meal:progress-committed", {
          detail: entries.map(({ key, after }) => ({ key, raw: after })),
        }),
      )
  } catch (error) {
    let rolledBack = true
    for (const entry of touched.reverse()) {
      try {
        // Do not undo an unrelated writer's state.
        if (localStorage.getItem(entry.key) === entry.before) continue
        if (localStorage.getItem(entry.key) !== entry.after) {
          rolledBack = false
          continue
        }
        if (entry.before === null) localStorage.removeItem(entry.key)
        else localStorage.setItem(entry.key, entry.before)
        if (entry.previousCheckpoint === null)
          localStorage.removeItem(checkpointKey(entry.key))
        else
          localStorage.setItem(
            checkpointKey(entry.key),
            entry.previousCheckpoint,
          )
      } catch {
        rolledBack = false
      }
    }
    if (journalWritten && rolledBack) localStorage.removeItem(JOURNAL_KEY)
    if (!rolledBack)
      for (const entry of entries)
        block(
          entry.key,
          "interrupted",
          "Lần lưu bị gián đoạn. Xuất bản phục hồi rồi chọn checkpoint trước khi tiếp tục.",
        )
    throw new ProgressWriteError(
      error instanceof Error ? error.message : "Không thể lưu tiến trình.",
    )
  } finally {
    try {
      if (readLease()?.owner === writer) localStorage.removeItem(WRITER_KEY)
    } catch {
      /* Journal remains available for recovery. */
    }
  }
}
export function recoveryCandidates<T>(
  key: string,
  parse: Parser<T>,
): { label: string; value: T }[] {
  try {
    const saved = checkpoint(key)
    let interrupted: { before?: string; after?: string } | undefined
    try {
      interrupted = (decode(localStorage.getItem(JOURNAL_KEY)) as {
        entries?: { key: string; before?: string; after?: string }[]
      } | null)?.entries?.find((entry) => entry.key === key)
    } catch {
      /* Keep main/checkpoint candidates available. */
    }
    const raws = [
      ["Bản đang có trên thiết bị", localStorage.getItem(key)],
      ["Bản dự phòng mới nhất", saved?.raw],
      ["Bản trước lần lưu gần nhất", saved?.previous],
      ["Bản trước khi gián đoạn", interrupted?.before],
      ["Bản trong lần lưu gián đoạn", interrupted?.after],
    ] as const
    const seen = new Set<string>()
    return raws.flatMap(([label, raw]) => {
      if (!raw || seen.has(raw)) return []
      seen.add(raw)
      try {
        const value = parse(decode(raw))
        return value ? [{ label, value }] : []
      } catch {
        return []
      }
    })
  } catch {
    return []
  }
}
export function exportRecovery() {
  return JSON.stringify(
    {
      format: "SoulOfMeal-Recovery-v4",
      date: new Date().toISOString(),
      entries: PROGRESSION_KEYS.map((key) => ({
        key,
        raw: localStorage.getItem(key),
        checkpoint: localStorage.getItem(checkpointKey(key)),
      })),
      journal: localStorage.getItem(JOURNAL_KEY),
    },
    null,
    2,
  )
}
export function clearProtectedState() {
  for (const key of PROGRESSION_KEYS)
    localStorage.removeItem(checkpointKey(key))
  localStorage.removeItem(JOURNAL_KEY)
  localStorage.removeItem(WRITER_KEY)
  expected.clear()
  issues.clear()
  emit()
}
