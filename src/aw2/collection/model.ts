import { z } from "zod"
import { SPIRIT_IDS, STARTER_TEAM } from "../world/ids"
import type { WorldProgress } from "../world/model"

export const COLLECTION_TUNING_ID = "aw2-collection-development-v1"
export const RECRUIT_IDS = [
  "aw2-muoi",
  "aw2-nhien",
  "aw2-hai",
  "aw2-lien",
  "aw2-moc",
  "aw2-bach",
  "aw2-van",
] as const
export const RECRUIT_QUESTS: Record<(typeof RECRUIT_IDS)[number], number> = {
  "aw2-muoi": 1,
  "aw2-nhien": 2,
  "aw2-hai": 2,
  "aw2-lien": 2,
  "aw2-moc": 3,
  "aw2-bach": 3,
  "aw2-van": 3,
}
export const collectionSchema = z.strictObject({
  recruitedIds: z
    .array(z.enum(RECRUIT_IDS))
    .max(7)
    .refine((ids) => new Set(ids).size === ids.length),
  vanEmphasis: z.enum(["protection", "attack"]),
})
export type Collection = z.infer<typeof collectionSchema>
export const collectionActionSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("recruit"), spiritId: z.enum(RECRUIT_IDS) }),
  z.strictObject({
    type: z.literal("team"),
    partyIds: z
      .array(z.enum(SPIRIT_IDS))
      .length(5)
      .refine((ids) => new Set(ids).size === 5),
    vanEmphasis: z.enum(["protection", "attack"]),
  }),
])
export type CollectionAction = z.infer<typeof collectionActionSchema>
export function newCollection(): Collection {
  return { recruitedIds: [], vanEmphasis: "protection" }
}
export function ownedSpirits(
  progress: WorldProgress,
  collection: Collection,
): (typeof SPIRIT_IDS)[number][] {
  return [
    ...(progress.questIndex > 0 ? STARTER_TEAM : []),
    ...collection.recruitedIds,
  ]
}
export function validCollectionProgress(
  progress: WorldProgress,
  collection: Collection,
) {
  const owned = ownedSpirits(progress, collection)
  return (
    collection.recruitedIds.every(
      (id) => progress.questIndex >= RECRUIT_QUESTS[id],
    ) &&
    (progress.questIndex === 0
      ? progress.partyIds.length === 0
      : progress.partyIds.length === 5 &&
        progress.partyIds.every((id) => owned.includes(id))) &&
    (collection.vanEmphasis === "protection" || owned.includes("aw2-van"))
  )
}
/** Explicit actions only: rendering, migration and quest completion never recruit. */
export function applyCollectionAction(
  collection: Collection,
  progress: WorldProgress,
  command: CollectionAction,
) {
  const action = collectionActionSchema.parse(command)
  const next = structuredClone(collection),
    world = structuredClone(progress)
  if (action.type === "recruit") {
    if (progress.questIndex < RECRUIT_QUESTS[action.spiritId])
      throw Error("Chưa hoàn tất mốc nhiệm vụ để mời Vị Linh này.")
    if (next.recruitedIds.includes(action.spiritId))
      throw Error("Vị Linh đã được mời; không nhận lại.")
    next.recruitedIds.push(action.spiritId)
  } else {
    if (
      progress.questIndex < 1 ||
      action.partyIds.some(
        (id) => !ownedSpirits(progress, collection).includes(id),
      )
    )
      throw Error("Đội cần đúng năm Vị Linh đã sở hữu.")
    if (
      JSON.stringify(progress.partyIds) === JSON.stringify(action.partyIds) &&
      collection.vanEmphasis === action.vanEmphasis
    )
      throw Error("Đội và nhấn tuyệt kỹ đã được lưu.")
    world.partyIds = [...action.partyIds]
    next.vanEmphasis = action.vanEmphasis
  }
  if (!validCollectionProgress(world, next))
    throw Error("Bộ sưu tập/đội AW2 không hợp lệ.")
  return { collection: next, progress: world }
}
