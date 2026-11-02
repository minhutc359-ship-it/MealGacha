import { z } from "zod"
import type { Aw2ModeId } from "./catalog"

export const MODE_PROGRESS_PROFILE = "aw2-free-tables-v1" as const
export const MODE_STAGES = 3
const outcomeSchema = z.enum(["player-win", "opponent-win", "draw"])
const trackSchema = z
  .strictObject({
    played: z.number().int().min(0).max(1_000_000),
    wins: z.number().int().min(0).max(1_000_000),
    draws: z.number().int().min(0).max(1_000_000),
    bestStage: z.number().int().min(0).max(MODE_STAGES),
    last: z
      .strictObject({
        stage: z.number().int().min(1).max(MODE_STAGES),
        outcome: outcomeSchema,
      })
      .nullable(),
  })
  .refine(
    (v) =>
      v.wins + v.draws <= v.played &&
      v.bestStage <= v.wins &&
      (v.played === 0
        ? v.last === null && v.bestStage === 0
        : v.last !== null) &&
      (!v.last ||
        (v.last.outcome === "player-win"
          ? v.wins > 0 && v.last.stage === v.bestStage
          : v.last.stage === Math.min(MODE_STAGES, v.bestStage + 1) &&
            (v.last.outcome === "draw"
              ? v.draws > 0
              : v.played > v.wins + v.draws))),
  )
export const modeProgressSchema = z.strictObject({
  profile: z.literal(MODE_PROGRESS_PROFILE),
  tcg: trackSchema,
  "auto-chess": trackSchema,
})
export type ModeProgress = z.infer<typeof modeProgressSchema>
export type ModeOutcome = z.infer<typeof outcomeSchema>
export function newModeProgress(): ModeProgress {
  const track = () => ({
    played: 0,
    wins: 0,
    draws: 0,
    bestStage: 0,
    last: null,
  })
  return { profile: MODE_PROGRESS_PROFILE, tcg: track(), "auto-chess": track() }
}
export function modeStage(progress: ModeProgress, mode: Aw2ModeId): number {
  return Math.min(MODE_STAGES, progress[mode].bestStage + 1)
}
export function recordModeResult(
  progress: ModeProgress,
  mode: Aw2ModeId,
  stage: number,
  outcome: ModeOutcome,
): ModeProgress {
  if (stage !== modeStage(progress, mode))
    throw Error("Bậc bàn chơi đã thay đổi. Hãy đọc lại.")
  const next = structuredClone(progress),
    track = next[mode]
  track.played++
  if (outcome === "player-win") {
    track.wins++
    track.bestStage = Math.max(track.bestStage, stage)
  }
  if (outcome === "draw") track.draws++
  track.last = { stage, outcome }
  return modeProgressSchema.parse(next)
}
