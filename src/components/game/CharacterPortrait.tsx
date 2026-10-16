import { AutoPortrait } from "../autochess/AutoArt"
import { characterVisual, chefPortrait, type ChefId, type ChefExpression } from "../../game/characterVisuals"
import {
  CHARACTER_ART,
  CHARACTER_NAMES,
  type CharacterId,
} from "../../game/characters"
export function CharacterPortrait({
  id,
  className = "",
  decorative = false,
  expression = "neutral",
}: {
  id: CharacterId
  className?: string
  decorative?: boolean
  expression?: ChefExpression
}) {
  if (id === "an" || id === "sen" || id === "tinh") return <AutoPortrait index={id === "an" ? 0 : id === "sen" ? 2 : 3} npc className={`tcg-portrait ${className}`} label={decorative ? "" : CHARACTER_NAMES[id]} />
  const chef = characterVisual(`chef-${id}`)
  const character = chef ? chefPortrait(chef.id as ChefId, expression) : CHARACTER_ART[id]
  return (
    <img
      className={`tcg-portrait ${className}`}
      data-chef-expression={chef ? expression : undefined}
      src={character}
      loading="lazy"
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
