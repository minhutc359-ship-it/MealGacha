import { unitCharacter } from "../../infrastructure/assets/characterSprites"
import { VillageWalker } from "./VillageWalker"
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
  directional = false,
  idleAction,
  onCompanion,
}: {
  compact?: boolean
  moving?: boolean
  direction?: "up" | "down" | "left" | "right"
  quiet?: boolean
  directional?: boolean
  idleAction?: string
  onCompanion?: (friend: number) => void
  stamp: string
}) {
  return (
    <span
      className={`village-party-sprites idle-${idleAction ?? "rest"} ${
        quiet ? "is-quiet" : ""
      } facing-${direction} ${compact ? "is-compact" : ""} ${
        moving ? "is-moving" : ""
      }`}
    >
      {PARTY.map(([id, className]) => (
        <span className={`village-party-actor ${className}`} key={id}>
          {directional && className === "leader" ? (
            <VillageWalker
              direction={direction}
              moving={moving}
              quiet={quiet}
            />
          ) : (
            <CharacterSprite
              model={unitCharacter(id)}
              motion={moving && !quiet ? "walk" : "idle"}
              stamp={`${stamp}:${id}:${moving ? "walk" : "idle"}`}
              flip={direction === "left"}
              quiet={quiet}
            />
          )}
          {onCompanion && className !== "leader" && (
            <button
              type="button"
              className="village-friend-hit"
              aria-label={`Trò chuyện với ${
                className === "companion-one" ? "Lửa Nhỏ" : "Lam Lam"
              }`}
              onClick={(e) => {
                e.stopPropagation()
                onCompanion(className === "companion-one" ? 0 : 1)
              }}
            />
          )}
        </span>
      ))}
    </span>
  )
}
