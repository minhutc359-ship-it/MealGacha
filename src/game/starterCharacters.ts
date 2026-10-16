/** Stable gameplay IDs. Presentation variants never create a second character. */
export const STARTER_CHARACTER_IDS = [
  "com-tam",
  "banh-mi",
  "pho-bo",
  "banh-cuon",
  "goi-cuon-tom-thit",
] as const
export type StarterId = typeof STARTER_CHARACTER_IDS[number]
import { characterVisual, ULTIMATE_TIMELINE } from "./characterVisuals"
export { CHARACTER_VISUALS as STARTER_CHARACTERS, characterVisual as starterCharacter, STARTER_ASSET_ROOT, ULTIMATE_TIMELINE } from "./characterVisuals"
export type UltimatePhase = Exclude<keyof typeof ULTIMATE_TIMELINE, "end">
export function ultimatePhase(ms: number): UltimatePhase {
  return ms < ULTIMATE_TIMELINE.casting
    ? "preparation"
    : ms < ULTIMATE_TIMELINE.impact
      ? "casting"
      : ms < ULTIMATE_TIMELINE.finisher
        ? "impact"
        : ms < ULTIMATE_TIMELINE.recovery
          ? "finisher"
          : "recovery"
}
export const STARTER_STATES = [
  "idle",
  "walk",
  "attack",
  "cast",
  "ultimate",
  "hit",
  "fall",
  "victory",
] as const

/** Four authored poses per action. No cross-fade or simultaneous silhouettes. */
export function starterPose(
  id: string,
  motion: string,
  age: number,
  quiet = false,
  contact?: number,
) {
  const row = STARTER_STATES.indexOf(motion as typeof STARTER_STATES[number])
  // Extra presentation states reuse authored gestures, without claiming new artwork.
  if (motion === "summon") return quiet ? 0 : age < 260 ? 0 : age < 620 ? 17 : age < 900 ? 19 : 0
  if (motion === "guard") return 12 + (quiet ? 2 : Math.min(2, Math.floor(Math.max(0,age)/150)))
  if (motion === "stun") return 20
  if (row < 0) return 0
  if (quiet) return row === 6 ? 27 : row * 4
  const kit = characterVisual(id)!
  const loop = ["idle", "walk", "victory"].includes(motion)
  const base =
    motion === "ultimate"
      ? ULTIMATE_TIMELINE.end
      : motion === "fall"
        ? 900
        : motion === "hit"
          ? 360
          : motion === "victory"
            ? 1100
            : kit[(motion as "idle" | "walk" | "attack" | "cast")]
  const duration =
    contact === undefined || !["attack", "cast"].includes(motion)
      ? base
      : Math.max(base, contact + 260)
  const t = Math.max(0, age)
  if (!loop && t >= duration) return motion === "fall" ? 27 : 0
  const phase = (loop ? t % duration : t) / duration
  if (motion === "ultimate")
    return 16 + (t < ULTIMATE_TIMELINE.casting ? 0 : t < ULTIMATE_TIMELINE.impact ? 1 : t < ULTIMATE_TIMELINE.recovery ? 2 : 3)
  if (contact !== undefined && ["attack", "cast"].includes(motion))
    return (
      row * 4 +
      (t < contact * 0.45
        ? 0
        : t < contact
          ? 1
          : t < contact + (duration - contact) * 0.55
            ? 2
            : 3)
    )
  return row * 4 + Math.min(3, Math.floor(phase * 4))
}
