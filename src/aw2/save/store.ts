import {
  applyCollectionAction,
  newCollection,
  type CollectionAction,
} from "../collection/model"
import {
  AW2_DEV_SAVE_KEY,
  AW2_RESET_CONFIRMATION,
  AW2_SAVE_BACKUP_KEY,
  AW2_SAVE_JOURNAL_KEY,
  AW2_SAVE_QUARANTINE_KEY,
  aw2DevSaveSchema,
  decodeAw2Save,
  type Aw2DevSave,
  type SaveSnapshot,
} from "./schema"
import {
  assertProgressContinuation,
  newWorldProgress,
  worldProgressSchema,
  type WorldProgress,
} from "../world/model"
import {
  bossCheckpoint,
  commitWorldBossEncounter,
  createWorldBossEncounter,
  type BossEncounterPurpose,
  type WorldBossEncounter,
} from "../world/encounter"
import { applyWorldAction } from "../world/rules"
import {
  applyEconomyAction,
  grantQuestRewards,
  newEconomy,
  type EconomyAction,
} from "../economy/model"

type SaveStorage = Pick<Storage, "getItem" | "setItem"> & Partial<Pick<Storage, "removeItem">>
type WriteLock = <T>(action: () => T) => Promise<T>
type ReadySave = Extract<SaveSnapshot, { status: "ready" }>
export type ResetRequest = Readonly<{ expectedRaw: string | null }>
export type RecoverySource = "journal" | "backup"
export type RecoveryCandidate = Readonly<{
  source: RecoverySource
  raw: string
  save: Aw2DevSave
}>
export type RecoveryInspection = Readonly<Record<"status", "none" | "unavailable">> | Readonly<Record<"status", "available"> & Record<"candidate", RecoveryCandidate>>

export class Aw2SaveError extends Error {
  constructor(
    readonly code: "unavailable" | "write-failed" | "conflict" | "invalid" | "confirmation" | "locking",
    message: string,
  ) {
    super(message)
    this.name = "Aw2SaveError"
  }
}

export function supportsAw2Writes(): boolean {
  return typeof navigator !== "undefined" && !!navigator.locks?.request
}

const browserWriteLock: WriteLock = async (action) => {
  if (!supportsAw2Writes()) {
    throw new Aw2SaveError(
      "locking",
      "Trình duyệt cần hỗ trợ Web Locks để lưu an toàn giữa các tab. Hãy mở bằng localhost hoặc HTTPS trên trình duyệt hỗ trợ.",
    )
  }
  return navigator.locks.request(
    AW2_DEV_SAVE_KEY,
    { mode: "exclusive" },
    action,
  )
}

/** Versioned main value plus AW2-scoped backup/journal/quarantine keys.
 * Web Locks serialize cooperating AW2 tabs; raw comparison rejects stale views,
 * and every browser write is read back before success is reported.
 */
export class Aw2DevSaveStore {
  private pendingReset: ResetRequest | null = null
  private readonly storage: () => SaveStorage
  private readonly lock: WriteLock
  private readonly now: () => string
  private readonly newId: () => string

  constructor(
    options: {
      storage?: () => SaveStorage
      lock?: WriteLock
      now?: () => string
      newId?: () => string
    } = {},
  ) {
    this.storage = options.storage ?? (() => window.localStorage)
    this.lock = options.lock ?? browserWriteLock
    this.now = options.now ?? (() => new Date().toISOString())
    this.newId = options.newId ?? (() => crypto.randomUUID())
  }

  load(): SaveSnapshot {
    try {
      return decodeAw2Save(this.storage().getItem(AW2_DEV_SAVE_KEY))
    } catch {
      return { status: "unavailable" }
    }
  }

  /** Read-only recovery discovery. A valid/future main save always wins. */
  inspectRecovery(): RecoveryInspection {
    try {
      const storage = this.storage()
      const main = decodeAw2Save(storage.getItem(AW2_DEV_SAVE_KEY))
      if (main.status === "ready" || main.status === "unsupported")
        return { status: "none" }
      const candidates = ([
        ["journal", AW2_SAVE_JOURNAL_KEY],
        ["backup", AW2_SAVE_BACKUP_KEY],
      ] as const).flatMap(([source, key]) => {
        const decoded = decodeAw2Save(storage.getItem(key))
        return decoded.status === "ready"
          ? [{ source, raw: decoded.raw, save: decoded.save }]
          : []
      })
      let candidate: RecoveryCandidate | undefined
      for (const item of candidates) {
        if (!candidate || this.preferRecovery(item, candidate)) candidate = item
      }
      return candidate
        ? { status: "available", candidate: Object.freeze(candidate) }
        : { status: "none" }
    } catch {
      return { status: "unavailable" }
    }
  }

  /** Restore only the exact candidate the player inspected. Never downgrade a future save. */
  recover(
    expectedRaw: string | null,
    candidate: RecoveryCandidate,
  ): Promise<ReadySave> {
    return this.lock(() => {
      const storage = this.readStorage()
      if (!storage.removeItem)
        throw new Aw2SaveError(
          "write-failed",
          "Kho hiện tại không hỗ trợ dọn journal; chưa thể phục hồi an toàn.",
        )
      const raw = this.readMain(storage)
      if (raw !== expectedRaw) this.throwConflict()
      const current = decodeAw2Save(raw)
      if (current.status === "ready" || current.status === "unsupported")
        throw new Aw2SaveError(
          "invalid",
          current.status === "unsupported"
            ? "Không hạ cấp bản lưu thuộc schema mới hơn. Hãy dùng bản game mới hơn hoặc reset có xác nhận riêng."
            : "Bản lưu chính đang hợp lệ; không cần phục hồi từ bản cũ.",
        )
      const key =
        candidate.source === "journal"
          ? AW2_SAVE_JOURNAL_KEY
          : AW2_SAVE_BACKUP_KEY
      const candidateRaw = this.readExact(storage, key)
      if (candidateRaw !== candidate.raw) this.throwConflict()
      const decoded = decodeAw2Save(candidateRaw)
      if (decoded.status !== "ready")
        throw new Aw2SaveError(
          "invalid",
          "Bản phục hồi không còn hợp lệ. Đọc lại kho trước khi thử tiếp.",
        )
      if (raw !== null) this.writeExact(storage, AW2_SAVE_QUARANTINE_KEY, raw)
      if (candidate.source !== "journal")
        this.writeExact(storage, AW2_SAVE_JOURNAL_KEY, candidateRaw)
      this.writeExact(storage, AW2_DEV_SAVE_KEY, candidateRaw)
      this.removeVerified(storage, AW2_SAVE_JOURNAL_KEY)
      return { status: "ready", raw: candidateRaw, save: decoded.save }
    })
  }

  save(
    expectedRaw: string | null,
    progress?: WorldProgress,
  ): Promise<ReadySave> {
    return this.write(expectedRaw, (current) => {
      if (current.status === "invalid" || current.status === "unsupported") {
        throw new Aw2SaveError(
          "invalid",
          "Bản lưu chưa đọc được. Hãy giữ dữ liệu gốc hoặc dùng xác nhận reset AW2 riêng.",
        )
      }
      if (current.status === "ready") {
        const next = this.revise(current, progress ?? current.save.progress)
        this.assertPositionOnly(current.save.progress, next.progress, true)
        return next
      }
      return this.freshSave()
    })
  }

  async beginBoss(
    expectedRaw: string,
    progress: WorldProgress,
    purpose: BossEncounterPurpose = "quest",
  ): Promise<{
    snapshot: ReadySave
    encounter: WorldBossEncounter
  }> {
    const snapshot = await this.write(expectedRaw, (current) => {
      if (current.status !== "ready")
        throw new Aw2SaveError(
          "invalid",
          "Cần bản lưu AW2 hợp lệ trước khi vào trận.",
        )
      this.assertPositionOnly(current.save.progress, progress)
      return this.revise(current, bossCheckpoint(progress, purpose))
    })
    const encounter = createWorldBossEncounter(snapshot.raw, purpose)
    return { snapshot, encounter }
  }

  /** Resolve actions inside the lock; renderer never supplies items, XP or receipts. */
  act(
    expectedRaw: string,
    progress: WorldProgress,
    objectId: string,
    actionId: string,
    assertDestinationReady?: () => void,
  ): Promise<ReadySave> {
    return this.write(expectedRaw, (current) => {
      if (current.status !== "ready")
        throw new Aw2SaveError("invalid", "Cần đọc lại bản lưu AW2.")
      this.assertPositionOnly(current.save.progress, progress)
      const result = applyWorldAction(progress, objectId, actionId)
      const next = this.revise(current, result.state)
      if (result.state.questIndex > current.save.progress.questIndex)
        next.economy = grantQuestRewards(current.save.economy, result.state)
      const valid = aw2DevSaveSchema.parse(next)
      if (
        ["enter-room", "leave-room"].includes(actionId) &&
        !assertDestinationReady
      )
        throw new Aw2SaveError(
          "invalid",
          "Cần chuẩn bị cảnh trước khi vào/ra phòng.",
        )
      if (assertDestinationReady) {
        if (!["travel", "enter-room", "leave-room"].includes(actionId))
          throw new Aw2SaveError(
            "invalid",
            "Chỉ kiểm tra cảnh đích khi chuyển vùng.",
          )
        // No await between this guard and setItem in write(). Rules/raw remain authoritative.
        assertDestinationReady()
      }
      return valid
    })
  }

  economyAction(
    expectedRaw: string,
    progress: WorldProgress,
    action: EconomyAction,
  ): Promise<ReadySave> {
    return this.write(expectedRaw, (current) => {
      if (current.status !== "ready")
        throw new Aw2SaveError("invalid", "Cần đọc lại bản lưu AW2.")
      this.assertPositionOnly(current.save.progress, progress)
      const next = this.revise(current, progress)
      next.economy = applyEconomyAction(
        current.save.economy,
        next.progress,
        action,
      )
      return aw2DevSaveSchema.parse(next)
    })
  }

  collectionAction(
    expectedRaw: string,
    progress: WorldProgress,
    action: CollectionAction,
  ): Promise<ReadySave> {
    return this.write(expectedRaw, (current) => {
      if (current.status !== "ready")
        throw new Aw2SaveError("invalid", "Cần đọc lại bản lưu AW2.")
      this.assertPositionOnly(current.save.progress, progress)
      const result = applyCollectionAction(
        current.save.collection,
        progress,
        action,
      )
      return aw2DevSaveSchema.parse({
        ...this.revise(current, progress),
        progress: result.progress,
        collection: result.collection,
      })
    })
  }

  private assertPositionOnly(
    before: WorldProgress,
    candidate: WorldProgress,
    allowZoneChange = false,
  ): void {
    const valid = worldProgressSchema.parse(candidate)
    if ((before.interior?.roomId ?? null) !== (valid.interior?.roomId ?? null))
      throw new Aw2SaveError(
        "invalid",
        "Vào/ra phòng bằng cửa; không đổi phòng qua lưu vị trí.",
      )
    const spatial = before.interior
      ? ["interior"]
      : ["x", "y", "facing", ...(allowZoneChange ? ["zoneId"] : [])]
    if (
      (Object.keys(before) as Array<keyof WorldProgress>).some(
        (key) =>
          !spatial.includes(key) &&
          JSON.stringify(valid[key]) !== JSON.stringify(before[key]),
      )
    )
      throw new Aw2SaveError(
        "invalid",
        "Không thể đổi hoặc đặt lại quest qua lưu vị trí. Hãy dùng hành động tương tác hoặc đọc lại tiến trình.",
      )
  }

  finishBoss(
    expectedRaw: string,
    encounter: WorldBossEncounter,
  ): Promise<ReadySave> {
    return commitWorldBossEncounter(
      encounter,
      expectedRaw,
      (progress, purpose) =>
        this.write(expectedRaw, (current) => {
          if (current.status !== "ready")
            throw new Aw2SaveError("invalid", "Cần đọc lại bản lưu AW2.")
          return this.revise(current, progress, purpose === "quest")
        }),
    )
  }

  private revise(
    current: ReadySave,
    progress: WorldProgress,
    allowBossWin = false,
  ): Aw2DevSave {
    assertProgressContinuation(current.save.progress, progress, allowBossWin)
    return aw2DevSaveSchema.parse({
      ...current.save,
      revision: current.save.revision + 1,
      updatedAt: this.timestamp(current.save.updatedAt),
      progress,
    })
  }

  beginReset(expectedRaw: string | null): ResetRequest {
    const request = Object.freeze({ expectedRaw })
    this.pendingReset = request
    return request
  }

  cancelReset(): void {
    this.pendingReset = null
  }

  confirmReset(
    request: ResetRequest,
    confirmation: string,
  ): Promise<ReadySave> {
    if (
      request !== this.pendingReset ||
      confirmation !== AW2_RESET_CONFIRMATION
    ) {
      return Promise.reject(
        new Aw2SaveError(
          "confirmation",
          "Mở xác nhận mới và nhập chính xác RESET AW2 để bắt đầu lại.",
        ),
      )
    }
    // Consume before awaiting the lock: repeated clicks cannot reset twice.
    this.pendingReset = null
    return this.write(request.expectedRaw, () => this.freshSave(), true)
  }

  private timestamp(previous?: string): string {
    const now = this.now()
    // Clock adjustments must not invalidate an otherwise readable save.
    return previous && Date.parse(now) < Date.parse(previous) ? previous : now
  }

  private preferRecovery(
    candidate: RecoveryCandidate,
    current: RecoveryCandidate,
  ): boolean {
    const candidateTime = Date.parse(candidate.save.updatedAt)
    const currentTime = Date.parse(current.save.updatedAt)
    if (candidateTime !== currentTime) return candidateTime > currentTime
    if (
      candidate.save.saveId === current.save.saveId &&
      candidate.save.revision !== current.save.revision
    )
      return candidate.save.revision > current.save.revision
    return candidate.source === "journal" && current.source === "backup"
  }

  private freshSave(): Aw2DevSave {
    const now = this.timestamp()
    return aw2DevSaveSchema.parse({
      gameId: "adventure-world-2",
      environment: "development",
      schemaVersion: 8,
      collection: newCollection(),
      saveId: this.newId(),
      revision: 0,
      createdAt: now,
      updatedAt: now,
      progress: newWorldProgress(),
      economy: newEconomy(),
    })
  }

  private write(
    expectedRaw: string | null,
    next: (
      snapshot: Exclude<SaveSnapshot, { status: "unavailable" }>,
    ) => Aw2DevSave,
    discardRecovery = false,
  ): Promise<ReadySave> {
    return this.lock(() => {
      const storage = this.readStorage()
      const raw = this.readMain(storage)
      if (raw !== expectedRaw) this.throwConflict()
      const current = decodeAw2Save(raw)
      if (
        !discardRecovery &&
        current.status === "empty" &&
        storage.removeItem &&
        [AW2_SAVE_JOURNAL_KEY, AW2_SAVE_BACKUP_KEY].some(
          (key) =>
            decodeAw2Save(this.readExact(storage, key)).status === "ready",
        )
      )
        throw new Aw2SaveError(
          "invalid",
          "Đã tìm thấy bản AW2 có thể phục hồi. Hãy phục hồi hoặc reset có xác nhận trước khi tạo bản mới.",
        )
      const save = next(current)
      const encoded = JSON.stringify(save)
      // Test adapters and older embedders may expose only the original two-method
      // contract. Browser localStorage has removeItem and takes the durable path.
      if (!storage.removeItem) {
        this.writeExact(storage, AW2_DEV_SAVE_KEY, encoded)
        return { status: "ready", raw: encoded, save }
      }
      if (current.status === "ready")
        this.writeExact(storage, AW2_SAVE_BACKUP_KEY, current.raw)
      else if (raw !== null)
        this.writeExact(storage, AW2_SAVE_QUARANTINE_KEY, raw)
      this.writeExact(storage, AW2_SAVE_JOURNAL_KEY, encoded)
      this.writeExact(storage, AW2_DEV_SAVE_KEY, encoded)
      this.removeVerified(storage, AW2_SAVE_JOURNAL_KEY)
      return { status: "ready", raw: encoded, save }
    })
  }

  private readStorage(): SaveStorage {
    try {
      return this.storage()
    } catch {
      throw new Aw2SaveError(
        "unavailable",
        "Chưa đọc được kho AW2. Kiểm tra quyền lưu của trình duyệt rồi thử lại.",
      )
    }
  }

  private readMain(storage: SaveStorage): string | null {
    try {
      return storage.getItem(AW2_DEV_SAVE_KEY)
    } catch {
      throw new Aw2SaveError(
        "unavailable",
        "Chưa đọc được kho AW2. Kiểm tra quyền lưu của trình duyệt rồi thử lại.",
      )
    }
  }

  private readExact(storage: SaveStorage, key: string): string | null {
    try {
      return storage.getItem(key)
    } catch {
      throw new Aw2SaveError(
        "write-failed",
        "Kho AW2 chưa cho phép xác minh dữ liệu vừa ghi. Hãy đọc lại trước khi thao tác tiếp.",
      )
    }
  }

  private writeExact(storage: SaveStorage, key: string, value: string): void {
    try {
      storage.setItem(key, value)
      if (storage.getItem(key) !== value) throw new Error("read-back mismatch")
    } catch {
      throw new Aw2SaveError(
        "write-failed",
        "Chưa xác minh được lần ghi AW2. Không reset dữ liệu; hãy đọc lại kho trước khi thử tiếp.",
      )
    }
  }

  private removeVerified(storage: SaveStorage, key: string): void {
    try {
      storage.removeItem?.(key)
      if (storage.getItem(key) !== null) throw new Error("remove mismatch")
    } catch {
      // Main was already read back successfully. A same-save journal is harmless
      // and remains available for deterministic inspection after a later fault.
    }
  }

  private throwConflict(): never {
    throw new Aw2SaveError(
      "conflict",
      "Dữ liệu AW2 đã thay đổi ở tab khác. Đọc lại trước khi lưu, phục hồi hoặc mở xác nhận reset mới.",
    )
  }
}
