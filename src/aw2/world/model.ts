import { z } from "zod"
import { MEMORY_IDS, SPIRIT_IDS, STARTER_TEAM, ZONE_IDS } from "./ids"
import { canStand } from "./maps"
import {
  TEA_ROOM,
  TEA_ROOM_ID,
  canStandInTeaRoom,
  ROOM_IDS,
  V7_ROOM_IDS,
  roomById,
  canStandInRoom,
} from "./interiorLayout"

const baseProgressSchema = z.strictObject({
  zoneId: z.enum(ZONE_IDS),
  x: z.number().finite().min(16).max(624),
  y: z.number().finite().min(16).max(368),
  facing: z.enum(["up", "down", "left", "right"]),
  questIndex: z.number().int().min(0).max(4),
  accepted: z.boolean(),
  tableRead: z.boolean(),
  memories: z.array(z.enum(MEMORY_IDS)).max(3),
  threadChoice: z.enum(["wait", "return"]).nullable(),
  hintRead: z.boolean(),
  puzzleStep: z.number().int().min(0).max(3),
  partyIds: z.array(z.enum(SPIRIT_IDS)).max(5),
})

function validateBase(
  value: z.infer<typeof baseProgressSchema>,
  context: z.RefinementCtx,
  startersOnly = true,
) {
  const issue = () =>
    context.addIssue({
      code: "custom",
      message: "Tiến trình quest/đội AW2 không nhất quán.",
    })
  if (!canStand(value.zoneId, value.x, value.y)) issue()
  if (
    ZONE_IDS.indexOf(value.zoneId) >= 3 &&
    !(value.questIndex > 2 || (value.questIndex === 2 && value.accepted))
  )
    issue()
  if (value.zoneId === ZONE_IDS[5] && value.puzzleStep !== 3) issue()
  if (
    new Set(value.memories).size !== value.memories.length ||
    new Set(value.partyIds).size !== value.partyIds.length
  )
    issue()
  if (
    value.questIndex === 0 &&
    (value.partyIds.length ||
      value.memories.length ||
      value.threadChoice ||
      value.hintRead ||
      value.puzzleStep)
  )
    issue()
  if (
    value.questIndex > 0 &&
    (!value.tableRead ||
      value.partyIds.length !== 5 ||
      (startersOnly &&
        JSON.stringify(value.partyIds) !== JSON.stringify(STARTER_TEAM)))
  )
    issue()
  if (value.questIndex < 2 && (value.hintRead || value.puzzleStep)) issue()
  if (
    value.questIndex > 1 &&
    (value.memories.length !== 3 || !value.threadChoice)
  )
    issue()
  if (value.questIndex > 2 && (!value.hintRead || value.puzzleStep !== 3))
    issue()
  if (value.puzzleStep && !value.hintRead) issue()
  if (value.questIndex === 0 && value.tableRead && !value.accepted) issue()
  if (
    value.questIndex === 1 &&
    (value.memories.length || value.threadChoice) &&
    !value.accepted
  )
    issue()
  if (
    value.questIndex === 2 &&
    (value.hintRead || value.puzzleStep) &&
    !value.accepted
  )
    issue()
}

export const worldProgressV2Schema = baseProgressSchema
  .extend({
    questIndex: z.number().int().min(0).max(3),
  })
  .superRefine(validateBase)

const progressWithBoss = baseProgressSchema.extend({
  bossDefeated: z.boolean(),
  tableNoteRead: z.boolean(),
  endingChoice: z.enum(["wait", "share"]).nullable(),
})

function validateBoss(
  value: z.infer<typeof progressWithBoss>,
  context: z.RefinementCtx,
) {
  const issue = () =>
    context.addIssue({
      code: "custom",
      message: "Kết quả boss/ghi chép/kết truyện AW2 không nhất quán.",
    })
  if (
    value.questIndex < 3 &&
    (value.bossDefeated || value.tableNoteRead || value.endingChoice)
  )
    issue()
  if (value.questIndex === 3 && value.bossDefeated && !value.accepted) issue()
  if (value.tableNoteRead && !value.bossDefeated) issue()
  if (value.questIndex < 4 && value.endingChoice !== null) issue()
  if (
    value.questIndex === 4 &&
    (!value.bossDefeated ||
      !value.tableNoteRead ||
      !value.endingChoice ||
      value.accepted)
  )
    issue()
}

/** Strict historical v3/v4 party contract. */
export const worldProgressV4Schema = progressWithBoss.superRefine(
  (value, ctx) => {
    validateBase(value, ctx)
    validateBoss(value, ctx)
  },
)
export const worldProgressV5Schema = progressWithBoss.superRefine(
  (value, ctx) => {
    validateBase(value, ctx, false)
    validateBoss(value, ctx)
  },
)

const interiorSchema = z.strictObject({
  roomId: z.literal(TEA_ROOM_ID),
  x: z.number().finite(),
  y: z.number().finite(),
  facing: z.enum(["up", "down", "left", "right"]),
})
export const worldProgressV6Schema = progressWithBoss
  .extend({ interior: interiorSchema.nullable() })
  .superRefine((value, ctx) => {
    validateBase(value, ctx, false)
    validateBoss(value, ctx)
    if (
      value.interior &&
      (value.zoneId !== TEA_ROOM.zoneId ||
        Math.hypot(
          value.x - TEA_ROOM.entrance.x,
          value.y - TEA_ROOM.entrance.y,
        ) > 48 ||
        !canStandInTeaRoom(value.interior.x, value.interior.y))
    )
      ctx.addIssue({
        code: "custom",
        message: "Vị trí tiệm trà/điểm quay về không hợp lệ.",
      })
  })

export const worldProgressV7Schema = progressWithBoss
  .extend({
    interior: interiorSchema.extend({ roomId: z.enum(V7_ROOM_IDS) }).nullable(),
  })
  .superRefine((value, ctx) => {
    validateBase(value, ctx, false)
    validateBoss(value, ctx)
    if (value.interior) {
      const room = roomById(value.interior.roomId)
      if (
        value.zoneId !== room.zoneId ||
        Math.hypot(value.x - room.entrance.x, value.y - room.entrance.y) > 48 ||
        !canStandInRoom(room.id, value.interior.x, value.interior.y)
      )
        ctx.addIssue({
          code: "custom",
          message: "Vị trí phòng/điểm quay về không hợp lệ.",
        })
    }
  })

export const worldProgressSchema = progressWithBoss
  .extend({
    interior: interiorSchema.extend({ roomId: z.enum(ROOM_IDS) }).nullable(),
  })
  .superRefine((value, ctx) => {
    validateBase(value, ctx, false)
    validateBoss(value, ctx)
    if (value.interior) {
      const room = roomById(value.interior.roomId)
      if (
        value.zoneId !== room.zoneId ||
        Math.hypot(value.x - room.entrance.x, value.y - room.entrance.y) > 48 ||
        !canStandInRoom(room.id, value.interior.x, value.interior.y)
      )
        ctx.addIssue({
          code: "custom",
          message: "Vị trí phòng/điểm quay về không hợp lệ.",
        })
    }
  })

export type WorldProgress = z.infer<typeof worldProgressSchema>
export function newWorldProgress(): WorldProgress {
  return {
    zoneId: ZONE_IDS[0],
    x: 96,
    y: 192,
    facing: "down",
    questIndex: 0,
    accepted: false,
    tableRead: false,
    memories: [],
    threadChoice: null,
    hintRead: false,
    puzzleStep: 0,
    partyIds: [],
    bossDefeated: false,
    tableNoteRead: false,
    endingChoice: null,
    interior: null,
  }
}

export function assertProgressContinuation(
  before: WorldProgress,
  after: WorldProgress,
  allowBossWin = false,
): void {
  if (!allowBossWin && !before.bossDefeated && after.bossDefeated) {
    throw Error("Kết quả boss phải đến từ trận đấu AW2 đã được xác thực.")
  }
  if (
    after.questIndex < before.questIndex ||
    after.questIndex > before.questIndex + 1 ||
    (before.tableRead && !after.tableRead) ||
    (before.hintRead && !after.hintRead) ||
    (before.puzzleStep === 3 && after.puzzleStep !== 3) ||
    before.memories.some((id) => !after.memories.includes(id)) ||
    (before.threadChoice && before.threadChoice !== after.threadChoice) ||
    (before.accepted &&
      before.questIndex === after.questIndex &&
      !after.accepted) ||
    (before.bossDefeated && !after.bossDefeated) ||
    (before.tableNoteRead && !after.tableNoteRead) ||
    (before.endingChoice && before.endingChoice !== after.endingChoice)
  ) {
    throw Error(
      "Không thể đặt lại quest qua thao tác lưu. Dùng xác nhận reset AW2 nếu muốn bắt đầu lại.",
    )
  }
}
