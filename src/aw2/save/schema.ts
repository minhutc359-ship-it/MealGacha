import { z } from "zod"
import { economySchema, newEconomy } from "../economy/model"
import {
  collectionSchema,
  newCollection,
  validCollectionProgress,
} from "../collection/model"
import { QUEST_GRANTS } from "../world/ids"
import {
  newWorldProgress,
  worldProgressSchema,
  worldProgressV6Schema,
  worldProgressV7Schema,
  worldProgressV2Schema,
  worldProgressV4Schema,
  worldProgressV5Schema,
} from "../world/model"

export const AW2_DEV_SAVE_KEY = "aw2.development.save"
export const AW2_RESET_CONFIRMATION = "RESET AW2"

// Version stays in the envelope so a newer save at the same key is detected.
// Historical versions stay strict; v6 adds a room position, leaving the outside checkpoint intact.
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
    progress: worldProgressV4Schema,
  })
  .refine((save) => Date.parse(save.updatedAt) >= Date.parse(save.createdAt), {
    message: "Thời điểm lưu không được trước thời điểm tạo.",
  })

export type Aw2DevSave = z.infer<typeof aw2DevSaveSchema>

export const aw2DevSaveV4Schema = z
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

export const aw2DevSaveV5Schema = z
  .strictObject({
    ...aw2DevSaveV4Schema.shape,
    schemaVersion: z.literal(5),
    progress: worldProgressV5Schema,
    collection: collectionSchema,
  })
  .superRefine((save, ctx) => {
    if (
      Date.parse(save.updatedAt) < Date.parse(save.createdAt) ||
      save.economy.receipts.some(
        (id) =>
          QUEST_GRANTS.includes(id as typeof QUEST_GRANTS[number]) &&
          QUEST_GRANTS.indexOf(id as typeof QUEST_GRANTS[number]) >=
            save.progress.questIndex,
      ) ||
      !validCollectionProgress(
        { ...save.progress, interior: null },
        save.collection,
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Bộ sưu tập/đội/biên nhận AW2 không hợp lệ.",
      })
  })

export const aw2DevSaveV6Schema = z
  .strictObject({
    ...aw2DevSaveV5Schema.shape,
    schemaVersion: z.literal(6),
    progress: worldProgressV6Schema,
  })
  .superRefine((save, ctx) => {
    if (
      Date.parse(save.updatedAt) < Date.parse(save.createdAt) ||
      save.economy.receipts.some(
        (id) =>
          QUEST_GRANTS.includes(id as typeof QUEST_GRANTS[number]) &&
          QUEST_GRANTS.indexOf(id as typeof QUEST_GRANTS[number]) >=
            save.progress.questIndex,
      ) ||
      !validCollectionProgress(save.progress, save.collection)
    )
      ctx.addIssue({
        code: "custom",
        message: "Bộ sưu tập/đội/biên nhận AW2 không hợp lệ.",
      })
  })

export const aw2DevSaveV7Schema = z
  .strictObject({
    ...aw2DevSaveV6Schema.shape,
    schemaVersion: z.literal(7),
    progress: worldProgressV7Schema,
  })
  .superRefine((save, ctx) => {
    if (
      Date.parse(save.updatedAt) < Date.parse(save.createdAt) ||
      save.economy.receipts.some(
        (id) =>
          QUEST_GRANTS.includes(id as typeof QUEST_GRANTS[number]) &&
          QUEST_GRANTS.indexOf(id as typeof QUEST_GRANTS[number]) >=
            save.progress.questIndex,
      ) ||
      !validCollectionProgress(save.progress, save.collection)
    )
      ctx.addIssue({
        code: "custom",
        message: "Bộ sưu tập/đội/biên nhận AW2 không hợp lệ.",
      })
  })

export const aw2DevSaveSchema = z
  .strictObject({
    ...aw2DevSaveV7Schema.shape,
    schemaVersion: z.literal(8),
    progress: worldProgressSchema,
  })
  .superRefine((save, ctx) => {
    if (
      Date.parse(save.updatedAt) < Date.parse(save.createdAt) ||
      save.economy.receipts.some(
        (id) =>
          QUEST_GRANTS.includes(id as typeof QUEST_GRANTS[number]) &&
          QUEST_GRANTS.indexOf(id as typeof QUEST_GRANTS[number]) >=
            save.progress.questIndex,
      ) ||
      !validCollectionProgress(save.progress, save.collection)
    )
      ctx.addIssue({
        code: "custom",
        message: "Bộ sưu tập/đội/biên nhận AW2 không hợp lệ.",
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
    value.schemaVersion > 8
  ) {
    return { status: "unsupported", raw }
  }
  const legacy = aw2DevSaveV1Schema.safeParse(value)
  const previous = aw2DevSaveV2Schema.safeParse(value)
  const third = aw2DevSaveV3Schema.safeParse(value)
  const fourth = aw2DevSaveV4Schema.safeParse(value)
  const seventh = aw2DevSaveV7Schema.safeParse(value)
  const sixth = aw2DevSaveV6Schema.safeParse(value)
  const fifth = aw2DevSaveV5Schema.safeParse(value)
  const historical = legacy.success
    ? { ...legacy.data, progress: newWorldProgress(), economy: newEconomy() }
    : previous.success
      ? {
          ...previous.data,
          economy: newEconomy(),
          progress: {
            ...previous.data.progress,
            bossDefeated: false,
            tableNoteRead: false,
            endingChoice: null,
          },
        }
      : third.success
        ? { ...third.data, economy: newEconomy() }
        : fourth.success
          ? fourth.data
          : null
  const parsed = aw2DevSaveSchema.safeParse(
    historical
      ? {
          ...historical,
          progress: { ...historical.progress, interior: null },
          schemaVersion: 8,
          collection: newCollection(),
        }
      : fifth.success
        ? {
            ...fifth.data,
            schemaVersion: 8,
            progress: { ...fifth.data.progress, interior: null },
          }
        : sixth.success
          ? { ...sixth.data, schemaVersion: 8 }
          : seventh.success
            ? { ...seventh.data, schemaVersion: 8 }
            : value,
  )

  return parsed.success
    ? { status: "ready", raw, save: parsed.data }
    : { status: "invalid", raw }
}
