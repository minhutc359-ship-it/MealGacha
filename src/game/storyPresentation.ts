import { SCENES } from "./narrative"
import { STAGE_MAP, STAGES } from "./story"
import { livingChoiceLines } from "./livingChoices"
import { livingOpening } from "./livingStory"
import type { GameSave } from "./types"

/** Presentation only: replay uses the player's saved branch, without rewards. */
export function storyLines(stage: string, save: GameSave, phase: "before" | "after") {
  const scene = SCENES[stage]
  if (!scene) return []
  if (phase === "after") return [...scene.after, ...livingChoiceLines(stage, save, true)]
  return STAGE_MAP[stage]?.index >= 18
    ? [livingOpening(save.story400?.originEnding ?? save.storyEnding), ...livingChoiceLines(stage, save), ...scene.before]
    : [...scene.before]
}
export function campaignProgress(cleared: readonly string[]) {
  const ids = new Set(cleared)
  return { cleared: STAGES.filter(s => ids.has(s.id)).length, total: STAGES.length }
}
