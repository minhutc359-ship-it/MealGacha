import type { School } from "./types"
import type { AdventureAreaId, AdventureDirection } from "./adventureRegions"

/** One environment set serves all three games; select a scene, never preload the set. */
export const ELEMENTAL_BOARDS: Record<School, string> = {
  ember: "/assets/tcg/boards/ember-v441.webp",
  tide: "/assets/tcg/boards/tide-v441.webp",
  grove: "/assets/tcg/boards/grove-v441.webp",
  hearth: "/assets/tcg/boards/hearth-v441.webp",
  sugar: "/assets/tcg/boards/sugar-v441.webp",
}
export const SCENE_WEATHER = {
  ember: "embers",
  tide: "rain",
  grove: "leaves",
  hearth: "motes",
  sugar: "motes",
} as const
export const ELEMENTAL_IMPACTS = "/assets/tcg/fx/elemental-impacts-v441.webp"
export const IMPACT_ROWS: Record<School, number> = {
  ember: 0,
  tide: 1,
  grove: 2,
  hearth: 3,
  sugar: 4,
}
export const ADVENTURE_SCENES: Record<AdventureAreaId, School> = {
  "lantern-quarter": "hearth",
  "rain-harbor": "tide",
  "herb-garden": "grove",
  "tide-pier": "ember",
  "moon-table": "sugar",
}
export function tcgSceneSchool(stage?: string | null, recipe?: string): School {
  if (recipe === "coast") return "tide"
  if (recipe === "garden") return "grove"
  if (recipe === "moon") return "sugar"
  const id = recipe ?? stage ?? ""
  if (/^(harbor|rain-harbor)/.test(id)) return "tide"
  if (/^(garden|steam-garden)/.test(id)) return "grove"
  if (/^(tide|hotpot|grill)/.test(id)) return "ember"
  if (/^(moon|tet)/.test(id)) return "sugar"
  return "hearth"
}
export function atlasPosition(direction: AdventureDirection, frame = 0) {
  return `${((((frame % 4) + 4) % 4) * 100) / 3}% ${({ down: 0, left: 1, right: 2, up: 3 }[direction] * 100) / 3}%`
}
export function faceToward(
  from: { x: number; y: number },
  to: { x: number; y: number },
): AdventureDirection {
  const dx = to.x - from.x,
    dy = to.y - from.y
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "left" : "right"
  return dy < 0 ? "up" : "down"
}
