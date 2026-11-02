import { z } from "zod"
import { SPIRIT_IDS, QUEST_GRANTS, ROSTER } from "../world/ids"
import type { Economy } from "../economy/model"
import type { ModeProgress } from "../modes/progress"
import { DUPLICATE_SHARDS, TIERS } from "./proposal"
import { drawTier } from "./rules"

export const FREE_SUMMON_PROFILE = "aw2-free-summon-v1" as const
export const FREE_SUMMON_CAPABILITIES = {
  draw: true,
  earnedTicketSpend: true,
  purchase: false,
  savePity: true,
  storyGate: false,
} as const
export const TICKETS_PER_MILESTONE = 10
export const SUMMON_MILESTONES = [
  ...QUEST_GRANTS,
  "tcg:1",
  "tcg:2",
  "tcg:3",
  "auto-chess:1",
  "auto-chess:2",
  "auto-chess:3",
] as const
const unique = <T>(ids: T[]) => new Set(ids).size === ids.length
export const summonSchema = z
  .strictObject({
    profile: z.literal(FREE_SUMMON_PROFILE),
    tickets: z.number().int().min(0).max(100),
    claimed: z.array(z.enum(SUMMON_MILESTONES)).max(10).refine(unique),
    totalDraws: z.number().int().min(0).max(100),
    pity: z.strictObject({
      sr: z.number().int().min(0).max(9),
      ssr: z.number().int().min(0).max(79),
      ur: z.number().int().min(0).max(199),
    }),
    obtainedIds: z.array(z.enum(SPIRIT_IDS)).max(12).refine(unique),
    fragments: z.record(z.enum(SPIRIT_IDS), z.number().int().min(0).max(5000)),
    lastDraws: z
      .array(
        z.strictObject({
          spiritId: z.enum(SPIRIT_IDS),
          duplicate: z.boolean(),
        }),
      )
      .max(10),
  })
  .refine(
    (s) =>
      s.tickets + s.totalDraws === s.claimed.length * TICKETS_PER_MILESTONE &&
      s.obtainedIds.length <= s.totalDraws &&
      s.lastDraws.length <= s.totalDraws &&
      (s.totalDraws === 0
        ? s.lastDraws.length === 0
        : [1, 10].includes(s.lastDraws.length)) &&
      s.lastDraws.every((r) => s.obtainedIds.includes(r.spiritId)) &&
      Object.values(s.pity).every((n) => n <= s.totalDraws) &&
      Object.values(s.fragments).reduce((a, b) => a + b, 0) <=
        s.totalDraws * 50,
  )
export type SummonState = z.infer<typeof summonSchema>
export interface SummonDrawAction {
  type: "draw"
  count: 1 | 10
}
export type SummonAction = { type: "claim" } | SummonDrawAction
export function newSummonState(): SummonState {
  return {
    profile: FREE_SUMMON_PROFILE,
    tickets: 0,
    claimed: [],
    totalDraws: 0,
    pity: { sr: 0, ssr: 0, ur: 0 },
    obtainedIds: [],
    fragments: Object.fromEntries(
      SPIRIT_IDS.map((id) => [id, 0]),
    ) as SummonState["fragments"],
    lastDraws: [],
  }
}
export function earnedSummonMilestones(
  economy: Economy,
  modes: ModeProgress,
): typeof SUMMON_MILESTONES[number][] {
  return SUMMON_MILESTONES.filter((id) => {
    if (QUEST_GRANTS.includes(id as typeof QUEST_GRANTS[number]))
      return economy.receipts.includes(id as typeof QUEST_GRANTS[number])
    const mode = id.startsWith("tcg:") ? "tcg" : "auto-chess"
    return Number(id.at(-1)) <= modes[mode].bestStage
  })
}
export function validSummonEntitlements(
  s: SummonState,
  economy: Economy,
  modes: ModeProgress,
) {
  const earned = earnedSummonMilestones(economy, modes)
  return s.claimed.every((id) => earned.includes(id))
}
export function applySummonAction(
  before: SummonState,
  economy: Economy,
  modes: ModeProgress,
  owned: readonly string[],
  action: SummonAction,
  random: () => number,
): SummonState {
  const next = structuredClone(before)
  if (action.type === "claim") {
    const pending = earnedSummonMilestones(economy, modes).filter(
      (id) => !next.claimed.includes(id),
    )
    if (!pending.length) throw Error("Chưa có mốc mới để nhận vé.")
    next.claimed.push(...pending)
    next.tickets += pending.length * TICKETS_PER_MILESTONE
  } else if (action.type === "draw" && [1, 10].includes(action.count)) {
    if (next.tickets < action.count)
      throw Error(
        "Chưa đủ vé; hoàn thành nhiệm vụ hoặc thắng bậc bàn chơi mới.",
      )
    next.lastDraws = []
    for (let i = 0; i < action.count; i++) {
      const result = drawTier(next.pity, random()),
        pool = ROSTER.filter((u) => u.rarity === result.tier),
        sample = random()
      if (!Number.isFinite(sample) || sample < 0 || sample >= 1)
        throw Error("Invalid character sample")
      const spiritId = pool[Math.floor(sample * pool.length)].spiritId
      const duplicate =
        owned.includes(spiritId) || next.obtainedIds.includes(spiritId)
      if (duplicate)
        next.fragments[spiritId] += DUPLICATE_SHARDS[TIERS.indexOf(result.tier)]
      if (!next.obtainedIds.includes(spiritId)) next.obtainedIds.push(spiritId)
      next.lastDraws.push({ spiritId, duplicate })
      next.pity = result.pity
      next.tickets--
      next.totalDraws++
    }
    // A bounded, latest-batch history; its length is validated independently of lifetime draws.
  } else throw Error("Lệnh triệu hồi không hợp lệ.")
  return summonSchema.parse(next)
}
export function secureSummonRandom(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296
}
