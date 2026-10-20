import { z } from "zod"
import {
  newWorldProgress,
  worldProgressSchema,
  worldProgressV2Schema,
} from "../world/model"

export const AW2_DEV_SAVE_KEY = "aw2.development.save"
export const AW2_RESET_CONFIRMATION = "RESET AW2"

// Version stays in the envelope so a newer save at the same key is detected.
// No draft spirit, zone, economy or reward contract is implied by this schema.
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

export const aw2DevSaveSchema = z
  .strictObject({
    ...aw2DevSaveV1Schema.shape,
    schemaVersion: z.literal(3),
    progress: worldProgressSchema,
  })
  .refine((save) => Date.parse(save.updatedAt) >= Date.parse(save.createdAt), {
    message: "Thời điểm lưu không được trước thời điểm tạo.",
  })

export type Aw2DevSave = z.infer<typeof aw2DevSaveSchema>

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
    value.schemaVersion > 3
  ) {
    return { status: "unsupported", raw }
  }
  const legacy = aw2DevSaveV1Schema.safeParse(value)
  const previous = aw2DevSaveV2Schema.safeParse(value)
  const parsed = aw2DevSaveSchema.safeParse(
    legacy.success
      ? {
          ...legacy.data,
          schemaVersion: 3,
          progress: newWorldProgress(),
        }
      : previous.success
        ? {
            ...previous.data,
            schemaVersion: 3,
            progress: {
              ...previous.data.progress,
              bossDefeated: false,
              tableNoteRead: false,
              endingChoice: null,
            },
          }
        : value,
  )
  return parsed.success
    ? { status: "ready", raw, save: parsed.data }
    : { status: "invalid", raw }
}
