import { decodeAw2Save, type SaveSnapshot } from "../save/schema"
import { Aw2SaveError, type Aw2DevSaveStore } from "../save/store"
import { worldProgressSchema, type WorldProgress } from "../world/model"
import { zoneById } from "../world/maps"
import { INTERACT_RANGE } from "../world/rules"
import { AW2_MODES, type Aw2ModeId, type ModeEntry } from "./catalog"
import { TEA_ROOM_ID } from "../world/interiorLayout"
import { canUseRoomPractice } from "./roomPractice"

export interface ModeVisit {
  modeId: Aw2ModeId
  entry: ModeEntry
  returnZoneId: WorldProgress["zoneId"]
  returnRoomId?: typeof TEA_ROOM_ID
}

type ReadySave = Extract<SaveSnapshot, { status: "ready" }>

interface ActiveModeVisit {
  raw: string
  view: ModeVisit
}

export interface ModeCheckpoint {
  checkpoint: ReadySave
  visit: ModeVisit
}

/** Transition foundation only. No game engine, prizes or persistent mode state. */
export class Aw2ModeAdapter {
  private pending = false
  private visit: ActiveModeVisit | null = null

  constructor(
    private readonly store: Aw2DevSaveStore,
    private readonly canEnter: () => boolean = () => true,
  ) {}

  async enter(
    expectedRaw: string,
    progress: WorldProgress,
    modeId: Aw2ModeId,
    entry: ModeEntry,
  ): Promise<ModeCheckpoint> {
    if (this.pending || this.visit || !this.canEnter())
      throw new Aw2SaveError(
        "invalid",
        "Hãy trở về hành trình trước khi ghé bàn khác.",
      )
    const mode = AW2_MODES.find((candidate) => candidate.id === modeId)
    if (!mode || !["portal", "quick-entry", "room-service"].includes(entry))
      throw new Aw2SaveError("invalid", "Bàn chơi hoặc cách vào chưa hợp lệ.")
    if (
      typeof expectedRaw !== "string" ||
      decodeAw2Save(expectedRaw).status !== "ready"
    )
      throw new Aw2SaveError(
        "invalid",
        "Cần bản lưu AW2 hợp lệ trước khi ghé bàn.",
      )
    const valid = worldProgressSchema.parse(progress)
    if (entry === "room-service" && !canUseRoomPractice(valid))
      throw new Aw2SaveError(
        "invalid",
        "Hãy đến gần góc nhật ký trong tiệm trà.",
      )
    if (entry === "portal") {
      const portal = zoneById(valid.zoneId).objects.find(
        (object) => object.id === mode.portalId && object.kind === "mode",
      )
      if (
        !portal ||
        Math.hypot(valid.x - portal.x, valid.y - portal.y) > INTERACT_RANGE
      )
        throw new Aw2SaveError(
          "invalid",
          "Hãy đến gần đúng bàn ở Phố Đèn Lồng.",
        )
    }
    this.pending = true
    try {
      const checkpoint = await this.store.save(expectedRaw, valid)
      if (!this.canEnter())
        throw new Aw2SaveError(
          "conflict",
          "Hành trình đã đổi. Đọc lại trước khi ghé bàn.",
        )
      const view: ModeVisit = {
        modeId: mode.id,
        entry,
        returnZoneId: checkpoint.save.progress.zoneId,
        ...(checkpoint.save.progress.interior
          ? { returnRoomId: checkpoint.save.progress.interior.roomId }
          : {}),
      }
      this.visit = { raw: checkpoint.raw, view }
      return { checkpoint, visit: structuredClone(view) }
    } finally {
      this.pending = false
    }
  }

  returnToWorld(): ReadySave {
    if (this.pending || !this.visit)
      throw new Aw2SaveError("invalid", "Không có lượt ghé bàn để trở về.")
    const current = this.store.load()
    if (current.status !== "ready" || current.raw !== this.visit.raw)
      throw new Aw2SaveError(
        "conflict",
        "Bản lưu đã thay đổi. Đọc lại hành trình để tiếp tục.",
      )
    this.visit = null
    return current
  }

  abandon(): void {
    if (this.pending)
      throw new Aw2SaveError("invalid", "Đợi lưu điểm trở về hoàn tất.")
    this.visit = null
  }
}
