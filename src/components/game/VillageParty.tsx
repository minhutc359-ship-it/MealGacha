import { unitCharacter } from "../../infrastructure/assets/characterSprites"
import { CharacterSprite } from "./CharacterSprite"

const PARTY = [
  ["village-flame", "companion-one"],
  ["village-hero", "leader"],
  ["village-dragon", "companion-two"],
] as const

export function VillageParty({
  compact = false,
  moving = false,
  direction = "right",
  quiet = false,
  stamp,
}: {
  compact?: boolean
  moving?: boolean
  direction?: "up" | "down" | "left" | "right"
  quiet?: boolean
  stamp: string
}) {
  return (
    <span
      className={`village-party-sprites facing-${direction} ${compact ? "is-compact" : ""} ${moving ? "is-moving" : ""}`}
    >
      {PARTY.map(([id, className]) => (
        <span className={`village-party-actor ${className}`} key={id}>
          <CharacterSprite
            model={unitCharacter(id)}
            motion={moving && !quiet ? "walk" : "idle"}
            stamp={`${stamp}:${id}:${moving ? "walk" : "idle"}`}
            flip={direction === "left"}
            quiet={quiet}
          />
        </span>
      ))}
    </span>
  )
}
