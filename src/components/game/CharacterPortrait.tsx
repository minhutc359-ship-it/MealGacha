import { AutoPortrait } from "../autochess/AutoArt"
import {
  CHARACTER_ART,
  CHARACTER_NAMES,
  type CharacterId,
} from "../../game/characters"
export function CharacterPortrait({
  id,
  className = "",
  decorative = false,
}: {
  id: CharacterId
  className?: string
  decorative?: boolean
}) {
  if (id === "an" || id === "sen" || id === "tinh") return <AutoPortrait index={id === "an" ? 0 : id === "sen" ? 2 : 3} npc className={`tcg-portrait ${className}`} label={decorative ? "" : CHARACTER_NAMES[id]} />
  const character = CHARACTER_ART[id]
  return (
    <img
      className={`tcg-portrait ${className}`}
      src={character}
      alt={
        decorative
          ? ""
          : id === "hero"
            ? "Người giữ vị · nhân vật chính"
            : id === "grandmother"
              ? "Người bà bên bếp"
              : id === "mist"
                ? "Người giữ bếp trong sương"
                : CHARACTER_NAMES[id]
      }
      width="512"
      height="512"
      decoding="async"
    />
  )
}
