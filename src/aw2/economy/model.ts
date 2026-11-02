import { z } from "zod"
import { QUEST_GRANTS } from "../world/ids"
import type { WorldProgress } from "../world/model"
import { zoneById } from "../world/maps"
import { INTERACT_RANGE } from "../world/rules"
import { experienceToReachLevel } from "../combat/progression"

export const ECONOMY_TUNING_ID = "aw2-economy-development-v1" as const
export const CHEST_RECEIPT = "aw2-grant-chest-pantry" as const
export const GRANT_IDS = [...QUEST_GRANTS, CHEST_RECEIPT] as const
export const ITEM_IDS = ["rice", "herbs", "broth", "warm-bowl"] as const
export const ITEM_NAMES: Record<typeof ITEM_IDS[number], string> = {
  rice: "Gạo thơm",
  herbs: "Rau vườn",
  broth: "Nước dùng",
  "warm-bowl": "Chén cơm ấm",
}
/** Shared authority for actual cooking and read-only planning. */
export const WARM_BOWL_RECIPE = {
  ingredients: { rice: 1, herbs: 1, broth: 1 },
} as const
export const CHEST_REWARD = { rice: 4, herbs: 3, broth: 2 } as const
export const SHARE_MEAL_EXPERIENCE = 45 as const
const count = z.number().int().min(0).max(9999)
export const economySchema = z
  .strictObject({
    tuningId: z.literal(ECONOMY_TUNING_ID),
    inventory: z.strictObject({
      rice: count,
      herbs: count,
      broth: count,
      "warm-bowl": count,
    }),
    teamExperience: z.number().int().min(0).max(experienceToReachLevel(20)),
    receipts: z.array(z.enum(GRANT_IDS)).max(GRANT_IDS.length),
    cooked: count,
    shared: count,
  })
  .superRefine((value, ctx) => {
    if (
      new Set(value.receipts).size !== value.receipts.length ||
      value.shared > value.cooked ||
      value.inventory["warm-bowl"] !== value.cooked - value.shared
    )
      ctx.addIssue({
        code: "custom",
        message: "Túi đồ/biên nhận nấu ăn không nhất quán.",
      })
  })
export type Economy = z.infer<typeof economySchema>
export type EconomyAction = "claim-quests" | "open-chest" | "cook" | "share-meal"
export function newEconomy(): Economy {
  return {
    tuningId: ECONOMY_TUNING_ID,
    inventory: { rice: 0, herbs: 0, broth: 0, "warm-bowl": 0 },
    teamExperience: 0,
    receipts: [],
    cooked: 0,
    shared: 0,
  }
}
export const QUEST_REWARDS = [
  { xp: 30, rice: 2, herbs: 1, broth: 0 },
  { xp: 50, rice: 1, herbs: 0, broth: 1 },
  { xp: 80, rice: 0, herbs: 2, broth: 1 },
  { xp: 140, rice: 2, herbs: 2, broth: 2 },
] as const

export function pendingQuestRewards(
  economy: Economy,
  progress: WorldProgress,
): number {
  return QUEST_GRANTS.slice(0, progress.questIndex).filter(
    (id) => !economy.receipts.includes(id),
  ).length
}
function addXp(economy: Economy, xp: number) {
  economy.teamExperience = Math.min(
    experienceToReachLevel(20),
    economy.teamExperience + xp,
  )
}
export function grantQuestRewards(
  economy: Economy,
  progress: WorldProgress,
): Economy {
  const next = structuredClone(economy)
  QUEST_GRANTS.slice(0, progress.questIndex).forEach((id, index) => {
    if (next.receipts.includes(id)) return
    const reward = QUEST_REWARDS[index]
    next.receipts.push(id)
    for (const item of ["rice", "herbs", "broth"] as const)
      next.inventory[item] += reward[item]
    addXp(next, reward.xp)
  })
  return economySchema.parse(next)
}
export function canUseKitchen(progress: WorldProgress): boolean {
  return (
    progress.questIndex >= 3 &&
    zoneById(progress.zoneId).objects.some(
      (object) =>
        (object.id === "aw2-npc-gac-bep" ||
          object.id === "aw2-object-steam-2") &&
        Math.hypot(progress.x - object.x, progress.y - object.y) <=
          INTERACT_RANGE,
    )
  )
}
export function applyEconomyAction(
  economy: Economy,
  progress: WorldProgress,
  action: EconomyAction,
): Economy {
  if (action === "claim-quests") {
    if (!pendingQuestRewards(economy, progress))
      throw Error("Đã nhận đủ quà nhiệm vụ.")
    return grantQuestRewards(economy, progress)
  }
  const next = structuredClone(economy)
  if (action === "open-chest") {
    const chest = zoneById(progress.zoneId).objects.find(
      (o) => o.id === "aw2-chest-pantry",
    )
    if (
      !chest ||
      Math.hypot(progress.x - chest.x, progress.y - chest.y) > INTERACT_RANGE
    )
      throw Error("Hãy đến gần rương trong Phòng Kho.")
    if (next.receipts.includes(CHEST_RECEIPT))
      throw Error("Rương này đã được nhận.")
    next.inventory.rice += CHEST_REWARD.rice
    next.inventory.herbs += CHEST_REWARD.herbs
    next.inventory.broth += CHEST_REWARD.broth
    next.receipts.push(CHEST_RECEIPT)
  } else {
    if (!canUseKitchen(progress))
      throw Error("Đến gần Dì Gác Bếp hoặc bếp đã mở để nấu/chia bữa.")
    if (action === "cook") {
      if (
        Object.entries(WARM_BOWL_RECIPE.ingredients).some(
          ([id, amount]) => next.inventory[(id as "rice")] < amount,
        )
      )
        throw Error("Cần 1 Gạo thơm, 1 Rau vườn và 1 Nước dùng.")
      for (const [id, amount] of Object.entries(WARM_BOWL_RECIPE.ingredients))
        next.inventory[(id as "rice")] -= amount
      next.inventory["warm-bowl"]++
      next.cooked++
    } else if (action === "share-meal") {
      if (!next.inventory["warm-bowl"])
        throw Error("Hãy nấu một Chén cơm ấm trước.")
      next.inventory["warm-bowl"]--
      next.shared++
      addXp(next, SHARE_MEAL_EXPERIENCE)
    } else throw Error("Thao tác túi đồ không hợp lệ.")
  }
  return economySchema.parse(next)
}
