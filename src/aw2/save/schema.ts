import { z } from "zod"
import { economySchema, newEconomy } from "../economy/model"
import { QUEST_GRANTS } from "../world/ids"
import {
  newWorldProgress,
  worldProgressSchema,
  worldProgressV2Schema,
} from "../world/model"

export const AW2_DEV_SAVE_KEY = "aw2.development.save"
export const AW2_RESET_CONFIRMATION = "RESET AW2"

// Version stays in the envelope so a newer save at the same key is detected.
// Historical versions remain strict; schema v4 adds the development economy.
export const aw2DevSaveV1Schema = z
  .strictObject({
    gameId: z.literal("adventure-world-2"),
    environment: z.literal("development"),
    schemaVersion: z.literal(1),
    saveId: z.uuid(),
    revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    progress: z.strictObject({}),
  })
  .refine((save) => Date.parse(save.updatedAt) >= Date.parse(save.createdAt), {
    message: "Thời điểm lưu không được trước thời điểm tạo.",
  })

export const aw2DevSaveV2Schema = z
  .strictObject({
    ...aw2DevSaveV1Schema.shape,
    schemaVersion: z.literal(2),
    progress: worldProgressV2Schema,
  })
  .refine((save) => Date.parse(save.updatedAt) >= Date.parse(save.createdAt), {
    message: "Thời điểm lưu không được trước thời điểm tạo.",
  })

export const aw2DevSaveV3Schema = z
  .strictObject({
    ...aw2DevSaveV1Schema.shape,
    schemaVersion: z.literal(3),
    progress: worldProgressSchema,
  })
  .refine((save) => Date.parse(save.updatedAt) >= Date.parse(save.createdAt), {
    message: "Thời điểm lưu không được trước thời điểm tạo.",
  })

export type Aw2DevSave = z.infer<typeof aw2DevSaveSchema>

export const aw2DevSaveSchema = z
  .strictObject({
    ...aw2DevSaveV3Schema.shape,
    schemaVersion: z.literal(4),
    economy: economySchema,
  })
  .superRefine((save, ctx) => {
    if (
      Date.parse(save.updatedAt) < Date.parse(save.createdAt) ||
      save.economy.receipts.some(
        (id) =>
          QUEST_GRANTS.includes(id as typeof QUEST_GRANTS[number]) &&
          QUEST_GRANTS.indexOf(id as typeof QUEST_GRANTS[number]) >=
            save.progress.questIndex,
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Biên nhận/thời điểm AW2 không hợp lệ.",
      })
  })

export type ReadableSave = {
  status: "empty"
  raw: null
} | {
  status: "ready"
  raw: string
  save: Aw2DevSave
} | {
  status: "invalid" | "unsupported"
  raw: string
}

export type SaveSnapshot = ReadableSave | { status: "unavailable" }

export function decodeAw2Save(raw: string | null): ReadableSave {
  if (raw === null) return { status: "empty", raw }
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return { status: "invalid", raw }
  }
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    typeof value.schemaVersion === "number" &&
    value.schemaVersion > 4
  ) {
    return { status: "unsupported", raw }
  }
  const legacy = aw2DevSaveV1Schema.safeParse(value)
  const previous = aw2DevSaveV2Schema.safeParse(value)
  const third = aw2DevSaveV3Schema.safeParse(value)
  const parsed = aw2DevSaveSchema.safeParse(
    legacy.success
      ? {
          ...legacy.data,
          schemaVersion: 4,
          progress: newWorldProgress(),
          economy: newEconomy(),
        }
      : previous.success
        ? {
            ...previous.data,
            schemaVersion: 4,
            economy: newEconomy(),
            progress: {
              ...previous.data.progress,
              bossDefeated: false,
              tableNoteRead: false,
              endingChoice: null,
            },
          }
        : third.success
          ? { ...third.data, schemaVersion: 4, economy: newEconomy() }
          : value,
  )
  return parsed.success
    ? { status: "ready", raw, save: parsed.data }
    : { status: "invalid", raw }
}
