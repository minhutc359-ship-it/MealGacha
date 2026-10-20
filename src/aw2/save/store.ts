import {
  AW2_DEV_SAVE_KEY,
  AW2_RESET_CONFIRMATION,
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
  type WorldBossEncounter,
} from "../world/encounter"
import { applyWorldAction } from "../world/rules"
import {
  applyEconomyAction,
  grantQuestRewards,
  newEconomy,
  type EconomyAction,
} from "../economy/model"

type SaveStorage = Pick<Storage, "getItem" | "setItem">
type WriteLock = <T>(action: () => T) => Promise<T>
type ReadySave = Extract<SaveSnapshot, { status: "ready" }>
export type ResetRequest = Readonly<{ expectedRaw: string | null }>

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

/** One atomic localStorage value, independent of legacy journals/native bridges.
 * Web Locks serialize cooperating AW2 tabs; raw comparison rejects stale views.
 * Uncooperative scripts clearing storage remain outside this pre-release contract.
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
        return this.revise(current, progress ?? current.save.progress)
      }
      return this.freshSave()
    })
  }

  async beginBoss(expectedRaw: string, progress: WorldProgress): Promise<{
    snapshot: ReadySave
    encounter: WorldBossEncounter
  }> {
    const snapshot = await this.write(expectedRaw, (current) => {
      if (current.status !== "ready")
        throw new Aw2SaveError(
          "invalid",
          "Cần bản lưu AW2 hợp lệ trước khi vào trận.",
        )
      return this.revise(current, bossCheckpoint(progress))
    })
    const encounter = createWorldBossEncounter(snapshot.raw)
    return { snapshot, encounter }
  }

  /** Resolve actions inside the lock; renderer never supplies items, XP or receipts. */
  act(
    expectedRaw: string,
    progress: WorldProgress,
    objectId: string,
    actionId: string,
  ): Promise<ReadySave> {
    return this.write(expectedRaw, (current) => {
      if (current.status !== "ready")
        throw new Aw2SaveError("invalid", "Cần đọc lại bản lưu AW2.")
      this.assertPositionOnly(current.save.progress, progress)
      const result = applyWorldAction(progress, objectId, actionId)
      const next = this.revise(current, result.state)
      if (result.state.questIndex > current.save.progress.questIndex)
        next.economy = grantQuestRewards(current.save.economy, result.state)
      return aw2DevSaveSchema.parse(next)
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

  private assertPositionOnly(
    before: WorldProgress,
    candidate: WorldProgress,
  ): void {
    const valid = worldProgressSchema.parse(candidate)
    if (
      (Object.keys(before) as Array<keyof WorldProgress>).some(
        (key) =>
          !["x", "y", "facing"].includes(key) &&
          JSON.stringify(valid[key]) !== JSON.stringify(before[key]),
      )
    )
      throw new Aw2SaveError(
        "invalid",
        "Tiến trình đã đổi. Đọc lại trước khi tương tác.",
      )
  }

  finishBoss(
    expectedRaw: string,
    encounter: WorldBossEncounter,
  ): Promise<ReadySave> {
    return commitWorldBossEncounter(encounter, expectedRaw, (progress) =>
      this.write(expectedRaw, (current) => {
        if (current.status !== "ready")
          throw new Aw2SaveError("invalid", "Cần đọc lại bản lưu AW2.")
        return this.revise(current, progress, true)
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
    return this.write(request.expectedRaw, () => this.freshSave())
  }

  private timestamp(previous?: string): string {
    const now = this.now()
    // Clock adjustments must not invalidate an otherwise readable save.
    return previous && Date.parse(now) < Date.parse(previous) ? previous : now
  }

  private freshSave(): Aw2DevSave {
    const now = this.timestamp()
    return aw2DevSaveSchema.parse({
      gameId: "adventure-world-2",
      environment: "development",
      schemaVersion: 4,
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
  ): Promise<ReadySave> {
    return this.lock(() => {
      let storage: SaveStorage
      let raw: string | null
      try {
        storage = this.storage()
        raw = storage.getItem(AW2_DEV_SAVE_KEY)
      } catch {
        throw new Aw2SaveError(
          "unavailable",
          "Chưa đọc được kho AW2. Kiểm tra quyền lưu của trình duyệt rồi thử lại.",
        )
      }
      if (raw !== expectedRaw) {
        throw new Aw2SaveError(
          "conflict",
          "Dữ liệu AW2 đã thay đổi ở tab khác. Đọc lại trước khi lưu hoặc mở xác nhận reset mới.",
        )
      }
      const save = next(decodeAw2Save(raw))
      const encoded = JSON.stringify(save)
      try {
        storage.setItem(AW2_DEV_SAVE_KEY, encoded)
      } catch {
        throw new Aw2SaveError(
          "write-failed",
          "Chưa lưu được AW2. Kho có thể đã đầy hoặc bị chặn; bản lưu trước vẫn được giữ.",
        )
      }
      return { status: "ready", raw: encoded, save }
    })
  }
}
