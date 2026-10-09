import { UNIT_MAP } from "./autochess/catalog"
import type { BattleFrame } from "./battle"
import type { GameCard, School } from "./types"
import { DISTINCT_MODELS, unitCharacter, type CharacterModel } from "../infrastructure/assets/characterSprites"

export type CharacterMotion = "idle" | "summon" | "attack" | "cast" | "hit" | "fall" | "victory"
export interface MotionCue {
  kind: CharacterMotion
  delay: number
  lead?: "attack"
}
const SCHOOL_MODELS: Record<School, string> = {
  ember: "banh-mi", tide: "pho-bo", grove: "goi-cuon",
  hearth: "com-tam", sugar: "banh-tet",
}
const CASTERS: Record<School, string> = {
  ember: "chef-nhien", tide: "chef-hai", grove: "chef-moc",
  hearth: "chef-bach", sugar: "chef-lien",
}
const COMPANIONS: Record<string, string> = {
  "caravan-ferryman": "ferry", "caravan-porter": "loc",
  "caravan-herbalist": "sen", "caravan-gardener": "sen",
  "caravan-letter": "tinh", "caravan-cartographer": "recorder",
}
const IDLE: MotionCue = { kind: "idle", delay: 0 }

function model(id: string): CharacterModel {
  return unitCharacter(id)
}
export function tcgCharacter(card: GameCard): CharacterModel | null {
  if (card.kind !== "unit") return null
  const exact = UNIT_MAP[card.id] || DISTINCT_MODELS[card.id] ? card.id : COMPANIONS[card.id]
  const food = card.art?.startsWith("/assets/food/")
  return model(exact ?? (food ? SCHOOL_MODELS[card.school] : CASTERS[card.school]))
}
export function tcgCaster(school: School) { return model(CASTERS[school]) }

// Derive motion only from completed, authoritative snapshots.
export function tcgUnitMotion(frame: BattleFrame | undefined, uid: string, side: "player" | "enemy"): MotionCue {
  if (!frame) return IDLE
  const before = frame.before[side].board.find(u => u.uid === uid)
  const after = frame.battle[side].board.find(u => u.uid === uid)
  const attacking = frame.event.kind === "attack" && frame.event.side === side && frame.event.source === uid
  const contact = frame.event.kind === "attack" ? 560 : 140
  if (before && !after) return { kind: "fall", delay: contact, lead: attacking ? "attack" : undefined }
  if (!before && after) return { kind: "summon", delay: 0 }
  if (attacking) return { kind: "attack", delay: 0 }
  if (before && after && (after.health < before.health || after.shield < before.shield))
    return { kind: "hit", delay: contact }
  return IDLE
}

export function characterPose(motion: CharacterMotion, age: number, fresh: boolean, quiet: boolean, distinct = false) {
  if (quiet) return motion === "fall" ? fresh ? 6 : 12 : 0
  const ms = Math.max(0, age)
  if (motion === "fall") return fresh ? ms < 180 ? 4 : 6 : ms < 180 ? 11 : 12
  if (motion === "hit") return ms < 260 ? fresh ? 4 : 11 : 0
  if (motion === "victory") return (distinct ? [5, 1, 5, 2] : fresh ? [0, 1, 2, 1] : [13, 1, 13, 3])[Math.floor(ms / 180) % 4]
  if (motion === "idle" || ms > 950) return 0
  if (motion === "summon") return ms < 250 ? fresh ? 1 : 13 : ms < 620 ? fresh ? 3 : 9 : 0
  if (ms < 180) return fresh ? 3 : motion === "cast" ? 8 : 5
  if (ms < 380) return fresh ? 3 : motion === "cast" ? 9 : 6
  if (ms < 680) return fresh ? 4 : motion === "cast" ? 10 : 7
  return 0
}
