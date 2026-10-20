import { z } from "zod"
import { MEMORY_IDS, SPIRIT_IDS, STARTER_TEAM, ZONE_IDS } from "./ids"
import { canStand } from "./maps"

export const worldProgressSchema = z.strictObject({
  zoneId: z.enum(ZONE_IDS),
  x: z.number().finite().min(16).max(624),
  y: z.number().finite().min(16).max(368),
  facing: z.enum(["up", "down", "left", "right"]),
  questIndex: z.number().int().min(0).max(3),
  accepted: z.boolean(),
  tableRead: z.boolean(),
  memories: z.array(z.enum(MEMORY_IDS)).max(3),
  threadChoice: z.enum(["wait", "return"]).nullable(),
  hintRead: z.boolean(),
  puzzleStep: z.number().int().min(0).max(3),
  partyIds: z.array(z.enum(SPIRIT_IDS)).max(5),
}).superRefine((value, context) => {
  const issue = () => context.addIssue({ code: "custom", message: "Tiến trình quest/đội AW2 không nhất quán." })
  if (!canStand(value.zoneId, value.x, value.y)) issue()
  if (ZONE_IDS.indexOf(value.zoneId) >= 3 && !(value.questIndex > 2 || value.questIndex === 2 && value.accepted)) issue()
  if (value.zoneId === ZONE_IDS[5] && value.puzzleStep !== 3) issue()
  if (new Set(value.memories).size !== value.memories.length || new Set(value.partyIds).size !== value.partyIds.length) issue()
  if (value.questIndex === 0 && (value.partyIds.length || value.memories.length || value.threadChoice || value.hintRead || value.puzzleStep)) issue()
  if (value.questIndex > 0 && (!value.tableRead || JSON.stringify(value.partyIds) !== JSON.stringify(STARTER_TEAM))) issue()
  if (value.questIndex < 2 && (value.hintRead || value.puzzleStep)) issue()
  if (value.questIndex > 1 && (value.memories.length !== 3 || !value.threadChoice)) issue()
  if (value.questIndex > 2 && (!value.hintRead || value.puzzleStep !== 3)) issue()
  if (value.puzzleStep && !value.hintRead) issue()
  if (value.questIndex === 0 && value.tableRead && !value.accepted) issue()
  if (value.questIndex === 1 && (value.memories.length || value.threadChoice) && !value.accepted) issue()
  if (value.questIndex === 2 && (value.hintRead || value.puzzleStep) && !value.accepted) issue()
})

export type WorldProgress = z.infer<typeof worldProgressSchema>
export function newWorldProgress(): WorldProgress {
  return { zoneId: ZONE_IDS[0], x: 96, y: 192, facing: "down", questIndex: 0, accepted: false,
    tableRead: false, memories: [], threadChoice: null, hintRead: false, puzzleStep: 0, partyIds: [] }
}

export function assertProgressContinuation(before: WorldProgress, after: WorldProgress): void {
  if (after.questIndex < before.questIndex || after.questIndex > before.questIndex + 1 ||
    (before.tableRead && !after.tableRead) || (before.hintRead && !after.hintRead) ||
    (before.puzzleStep === 3 && after.puzzleStep !== 3) ||
    before.memories.some(id => !after.memories.includes(id)) ||
    (before.threadChoice && before.threadChoice !== after.threadChoice) ||
    (before.accepted && before.questIndex === after.questIndex && !after.accepted)) {
    throw Error("Không thể đặt lại quest qua thao tác lưu. Dùng xác nhận reset AW2 nếu muốn bắt đầu lại.")
  }
}
