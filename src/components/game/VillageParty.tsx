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
  flip = false,
  quiet = false,
  stamp,
}: {
  compact?: boolean
  moving?: boolean
  flip?: boolean
  quiet?: boolean
  stamp: string
}) {
  return (
    <span className={`village-party-sprites ${compact ? "is-compact" : ""}`}>
      {PARTY.map(([id, className]) => (
        <span className={`village-party-actor ${className}`} key={id}>
          <CharacterSprite
            model={unitCharacter(id)}
            motion={moving && !quiet ? "victory" : "idle"}
            stamp={`${stamp}:${id}:${moving ? "walk" : "idle"}`}
            flip={flip}
            quiet={quiet}
          />
        </span>
      ))}
    </span>
  )
}
