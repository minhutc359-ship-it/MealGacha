import { parseGame } from "../../storage"
import { migrateUserState } from "../../../infrastructure/storage/repository"
import {
  LEGACY_TCG_KEY,
  LEGACY_USER_KEY,
  TACTICAL_PROFILE_KEY,
  TACTICAL_LEGACY_BACKUP_KEY,
  TACTICAL_MIGRATION_RECEIPT_KEY,
  TACTICAL_MIGRATION_JOURNAL_KEY,
  type StorageLike,
} from "../migration/schema"
import { tacticalDeckErrors, ownedTacticalCards } from "../cards"
import { parseTacticalProgress } from "./storage"
import { TACTICAL_PROGRESS_KEY, TACTICAL_PROGRESS_JOURNAL_KEY } from "./schema"

export const TACTICAL_BACKUP_FORMAT = "soul-of-meal-tactical-backup-v1"
export const TACTICAL_RESTORE_UNDO_KEY =
  "soul-of-meal.tactical-tcg.restore-undo.v1"
export const TACTICAL_RESTORE_JOURNAL_KEY =
  "soul-of-meal.tactical-tcg.restore-journal.v1"
export const TACTICAL_BACKUP_MAX_BYTES = 10 * 1024 * 1024
export const TACTICAL_BACKUP_KEYS = [
  LEGACY_TCG_KEY,
  LEGACY_USER_KEY,
  TACTICAL_PROFILE_KEY,
  TACTICAL_PROGRESS_KEY,
  TACTICAL_LEGACY_BACKUP_KEY,
  TACTICAL_MIGRATION_RECEIPT_KEY,
] as const
const DATA_KEYS = [
  ...TACTICAL_BACKUP_KEYS,
  TACTICAL_PROGRESS_JOURNAL_KEY,
  TACTICAL_MIGRATION_JOURNAL_KEY,
]
type Snapshot = Record<string, string | null>
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v)
const rawValue = (v: unknown): v is string | null =>
  v === null || typeof v === "string"
const natural = (v: unknown) =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0
const snapshot = (
  storage: StorageLike,
  keys: readonly string[] = DATA_KEYS,
): Snapshot =>
  Object.fromEntries(keys.map((key) => [key, storage.getItem(key)]))
const same = (storage: StorageLike, expected: Snapshot) =>
  Object.entries(expected).every(
    ([key, value]) => storage.getItem(key) === value,
  )
const cardCount = (copies: Record<string, number>) =>
  Object.values(ownedTacticalCards(copies)).filter((n) => n > 0).length

export interface TacticalBackupPreview {
  text: string
  expected: Snapshot
  exportedAt: string
  cards: number
  decks: number
  nodes: number
  tinhVi: number
  tickets: number
  checkpointRound: number | null
  currentCards: number
  currentNodes: number
}

/** Raw export preserves legacy bytes and does not mutate the save. */
export function exportTacticalBackup(
  storage: StorageLike,
  now = new Date().toISOString(),
) {
  return JSON.stringify(
    {
      format: TACTICAL_BACKUP_FORMAT,
      exportedAt: now,
      storage: snapshot(storage, TACTICAL_BACKUP_KEYS),
    },
    null,
    2,
  )
}

function decode(text: string) {
  if (new TextEncoder().encode(text).byteLength > TACTICAL_BACKUP_MAX_BYTES)
    throw Error("Bản sao vượt quá 10 MB.")
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw Error("Tệp không phải JSON hợp lệ.")
  }
  if (
    !object(value) ||
    value.format !== TACTICAL_BACKUP_FORMAT ||
    typeof value.exportedAt !== "string" ||
    !Number.isFinite(Date.parse(value.exportedAt)) ||
    !object(value.storage)
  )
    throw Error("Định dạng bản sao không được hỗ trợ.")
  const raw = value.storage
  if (
    Object.keys(raw).some(
      (key) => !(TACTICAL_BACKUP_KEYS as readonly string[]).includes(key),
    ) ||
    TACTICAL_BACKUP_KEYS.slice(0, 5).some((key) => !rawValue(raw[key])) ||
    (TACTICAL_MIGRATION_RECEIPT_KEY in raw &&
      !rawValue(raw[TACTICAL_MIGRATION_RECEIPT_KEY]))
  )
    throw Error("Bản sao thiếu dữ liệu hoặc có khóa không được hỗ trợ.")
  const parsed: Record<string, unknown> = {}
  for (const [key, data] of Object.entries(raw)) {
    if (!rawValue(data)) throw Error("Giá trị trong bản sao không hợp lệ.")
    if (data !== null) {
      try {
        parsed[key] = JSON.parse(data)
      } catch {
        throw Error(`Dữ liệu ${key} không phải JSON hợp lệ.`)
      }
    }
  }
  const source = parsed[TACTICAL_PROGRESS_KEY]
  if (
    object(source) &&
    source.accountReady !== undefined &&
    typeof source.accountReady !== "boolean"
  )
    throw Error("Trạng thái tài khoản trong bản sao không hợp lệ.")
  const progress =
    typeof raw[TACTICAL_PROGRESS_KEY] === "string"
      ? parseTacticalProgress(raw[TACTICAL_PROGRESS_KEY])
      : null
  if (
    !progress ||
    !object(source) ||
    !natural(source.revision) ||
    typeof source.tinhVi !== "number" ||
    source.tinhVi < 0 ||
    !object(source.cardCopies) ||
    !Object.values(source.cardCopies).every(natural) ||
    [source.packTickets, source.packsOpened, source.packPity].some(
      (v) => v !== undefined && !natural(v),
    )
  )
    throw Error("Tiến trình Tactical hỏng hoặc thuộc phiên bản chưa hỗ trợ.")
  for (const key of [
    "claimedRewardReceiptIds",
    "completedCampaignNodes",
    "unlockedMangaChapters",
  ]) {
    const entries = source[key]
    if (
      !Array.isArray(entries) ||
      !entries.every((v: unknown) => typeof v === "string")
    )
      throw Error("Danh sách tiến trình trong bản sao không hợp lệ.")
  }
  if (
    source.decks !== undefined &&
    (!Array.isArray(source.decks) ||
      source.decks.length !== progress.decks.length ||
      new Set(progress.decks.map((d) => d.id)).size !== progress.decks.length)
  )
    throw Error("Danh sách bộ bài trong bản sao không hợp lệ.")
  if (progress.accountReady) {
    const active = progress.decks.find((d) => d.id === progress.activeDeckId)
    if (
      !active ||
      tacticalDeckErrors(active.cards, ownedTacticalCards(progress.cardCopies))
        .length
    )
      throw Error("Bộ bài đang trang bị trong bản sao chưa hợp lệ.")
  }
  const profile = parsed[TACTICAL_PROFILE_KEY]
  if (
    !object(profile) ||
    profile.schemaVersion !== 1 ||
    !object(profile.collection) ||
    !object(profile.collection.cardCopies) ||
    !Object.values(profile.collection.cardCopies).every(natural) ||
    !Array.isArray(profile.collection.ownedSpiritAliases) ||
    !profile.collection.ownedSpiritAliases.every(
      (id: unknown) => typeof id === "string",
    ) ||
    typeof profile.collection.tinhVi !== "number" ||
    !Number.isFinite(profile.collection.tinhVi) ||
    profile.collection.tinhVi < 0 ||
    (profile.tcg !== null && !parseGame(profile.tcg)) ||
    (profile.chest !== null && !migrateUserState(profile.chest))
  )
    throw Error("Hồ sơ chuyển đổi trong bản sao không hợp lệ.")
  for (const key of [LEGACY_TCG_KEY, LEGACY_USER_KEY]) {
    const legacy = parsed[key]
    if (legacy === undefined) continue
    if (
      !(key === LEGACY_TCG_KEY
        ? parseGame(object(legacy) && "save" in legacy ? legacy.save : legacy)
        : migrateUserState(legacy))
    )
      throw Error("Dữ liệu TCG/Rương cũ trong bản sao không hợp lệ.")
  }
  const legacy = parsed[TACTICAL_LEGACY_BACKUP_KEY]
  if (
    legacy !== undefined &&
    (!object(legacy) ||
      legacy.schemaVersion !== 1 ||
      !object(legacy.raw) ||
      ![legacy.raw.tcg, legacy.raw.user, legacy.raw.aw2].every(rawValue))
  )
    throw Error("Bản lưu gốc trong tệp không hợp lệ.")
  const receipt = parsed[TACTICAL_MIGRATION_RECEIPT_KEY]
  if (
    receipt !== undefined &&
    (!object(receipt) ||
      receipt.schemaVersion !== 1 ||
      typeof receipt.migrationId !== "string")
  )
    throw Error("Biên nhận chuyển đổi không hợp lệ.")
  const writes = Object.fromEntries(
    TACTICAL_BACKUP_KEYS.map((key) => [key, raw[key] ?? null]),
  ) as Snapshot
  // Old five-key exports omitted this receipt; retain their imported profile on boot.
  if (!writes[TACTICAL_MIGRATION_RECEIPT_KEY])
    writes[TACTICAL_MIGRATION_RECEIPT_KEY] = JSON.stringify({
      schemaVersion: 1,
      migrationId: `backup:${value.exportedAt}`,
      completedAt: value.exportedAt,
    })
  writes[TACTICAL_PROGRESS_JOURNAL_KEY] = null
  writes[TACTICAL_MIGRATION_JOURNAL_KEY] = null
  return { progress, writes, exportedAt: value.exportedAt }
}

export function tacticalRestoreSnapshot(storage: StorageLike) {
  return snapshot(storage, [...DATA_KEYS, TACTICAL_RESTORE_UNDO_KEY])
}
export function previewTacticalBackup(
  storage: StorageLike,
  text: string,
): TacticalBackupPreview {
  const { progress, exportedAt } = decode(text)
  const current = parseTacticalProgress(storage.getItem(TACTICAL_PROGRESS_KEY))
  return {
    text,
    expected: tacticalRestoreSnapshot(storage),
    exportedAt,
    cards: cardCount(progress.cardCopies),
    decks: progress.decks.length,
    nodes: progress.completedCampaignNodes.length,
    tinhVi: progress.tinhVi,
    tickets: progress.packTickets,
    checkpointRound: progress.checkpoint?.round ?? null,
    currentCards: current ? cardCount(current.cardCopies) : 0,
    currentNodes: current?.completedCampaignNodes.length ?? 0,
  }
}
function write(storage: StorageLike, values: Snapshot) {
  for (const [key, value] of Object.entries(values))
    value === null ? storage.removeItem(key) : storage.setItem(key, value)
  if (!same(storage, values)) throw Error("Không đọc lại được dữ liệu vừa lưu.")
}
function clearJournal(storage: StorageLike) {
  storage.removeItem(TACTICAL_RESTORE_JOURNAL_KEY)
  if (storage.getItem(TACTICAL_RESTORE_JOURNAL_KEY) !== null)
    throw Error("Chưa đóng được nhật ký khôi phục.")
}
function previousFrom(value: unknown, keys: readonly string[]): Snapshot {
  const previous =
    object(value) && object(value.previous) ? value.previous : null
  if (
    !object(value) ||
    value.schemaVersion !== 1 ||
    !previous ||
    Object.keys(previous).length !== keys.length ||
    keys.some((key) => !rawValue(previous[key]))
  )
    throw Error("Nhật ký/bản hoàn tác không hợp lệ.")
  return previous as Snapshot
}
/** Recover before migration/account writes following an interrupted restore. */
export function recoverTacticalRestore(storage: StorageLike) {
  const raw = storage.getItem(TACTICAL_RESTORE_JOURNAL_KEY)
  if (!raw) return
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw Error("Nhật ký khôi phục hỏng. Dữ liệu gốc vẫn được giữ để kiểm tra.")
  }
  write(storage, previousFrom(value, [...DATA_KEYS, TACTICAL_RESTORE_UNDO_KEY]))
  clearJournal(storage)
}
function transact(storage: StorageLike, expected: Snapshot, writes: Snapshot) {
  if (!same(storage, expected))
    throw Error(
      "Tiến trình đã thay đổi sau khi xem trước. Chọn lại tệp để kiểm tra bản mới nhất.",
    )
  if (storage.getItem(TACTICAL_RESTORE_JOURNAL_KEY))
    throw Error("Có lần khôi phục chưa hoàn tất. Tải lại trước khi tiếp tục.")
  const previous = tacticalRestoreSnapshot(storage)
  const journal = JSON.stringify({ schemaVersion: 1, previous })
  storage.setItem(TACTICAL_RESTORE_JOURNAL_KEY, journal)
  if (storage.getItem(TACTICAL_RESTORE_JOURNAL_KEY) !== journal)
    throw Error("Chưa lưu được nhật ký khôi phục.")
  try {
    write(storage, writes)
    clearJournal(storage)
  } catch (error) {
    try {
      write(storage, previous)
      clearJournal(storage)
    } catch {
      throw Error(
        "Chưa khôi phục được dữ liệu gốc. Giữ tệp sao lưu và tải lại để phục hồi từ nhật ký.",
      )
    }
    throw error
  }
}
export function importTacticalBackup(
  storage: StorageLike,
  preview: TacticalBackupPreview,
) {
  const { writes, progress } = decode(preview.text)
  transact(storage, preview.expected, {
    ...writes,
    [TACTICAL_RESTORE_UNDO_KEY]: JSON.stringify({
      schemaVersion: 1,
      previous: snapshot(storage),
      importedAt: new Date().toISOString(),
    }),
  })
  return progress
}
export function undoTacticalImport(storage: StorageLike, expected: Snapshot) {
  const raw = storage.getItem(TACTICAL_RESTORE_UNDO_KEY)
  if (!raw) throw Error("Không có lần nhập để hoàn tác.")
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw Error("Bản hoàn tác không hợp lệ.")
  }
  transact(storage, expected, {
    ...previousFrom(value, DATA_KEYS),
    [TACTICAL_RESTORE_UNDO_KEY]: null,
  })
}
