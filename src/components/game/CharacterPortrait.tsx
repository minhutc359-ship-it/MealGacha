import {
  CHARACTER_ART,
  NPC_NAMES,
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
                : NPC_NAMES[id]
      }
      width="512"
      height="512"
      decoding="async"
    />
  )
}
