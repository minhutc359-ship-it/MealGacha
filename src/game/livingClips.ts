import type { CharacterMotion } from "./tcgCharacterMotion"
import type { Actor, AutoCombat } from "./autochess/types"
/** 24 authored raster poses, no gameplay/RNG access. */
export function livingClipFrame(
  motion: CharacterMotion,
  age: number,
  quiet = false,
) {
  if (quiet) return motion === "fall" ? 20 : 0
  const ms = Math.max(0, age)
  if (motion === "idle") return Math.floor(ms / 650) % 2
  if (motion === "victory") return 22 + (Math.floor(ms / 180) % 2)
  if (motion === "fall") return 18 + Math.min(3, Math.floor(ms / 200))
  if (motion === "hit")
    return ms < 260 ? 16 + Math.min(1, Math.floor(ms / 130)) : 0
  if (motion === "summon") return ms < 300 ? 1 : 0
  if (ms > 950) return 0
  const step = ms < 180 ? 0 : ms < 330 ? 1 : ms < 620 ? 2 : 3
  return (motion === "cast" ? 12 : 8) + step
}
export function livingActorFrame(
  actor: Actor,
  time: number,
  combat: AutoCombat | null,
  quiet: boolean,
  victory: boolean,
) {
  if (actor.hp <= 0)
    return livingClipFrame(
      "fall",
      Math.max(0, time - (actor.diedAt ?? time)) * 50,
      quiet,
    )
  if (victory) return livingClipFrame("victory", time * 50, quiet)
  if (quiet) return 0
  const action = actor.action
  if (!action)
    return combat?.events.some(
      (e) =>
        e.target === actor.uid &&
        e.kind === "hit" &&
        time - e.tick >= 0 &&
        time - e.tick < 3,
    )
      ? 16
      : Math.floor(time / 13) % 2
  const progress = Math.max(
    0,
    Math.min(
      0.999,
      (time - action.start) / Math.max(1, action.end - action.start),
    ),
  )
  if (action.kind === "move") return 2 + Math.floor(progress * 6)
  const step =
    time < action.hit
      ? Math.min(
          1,
          Math.floor(
            ((time - action.start) / Math.max(1, action.hit - action.start)) *
              2,
          ),
        )
      : 2 +
        Math.min(
          1,
          Math.floor(
            ((time - action.hit) / Math.max(1, action.end - action.hit)) * 2,
          ),
        )
  return (action.kind === "cast" ? 12 : 8) + step
}
