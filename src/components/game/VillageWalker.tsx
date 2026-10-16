import type { CSSProperties } from "react"
import type { VillageFacing } from "../../game/villageRpg"

export function VillageWalker({
  id = "hero",
  direction = "down",
  moving = false,
  quiet = false,
}: {
  id?: "hero" | "la" | "merchant" | "grandmother"
  direction?: VillageFacing
  moving?: boolean
  quiet?: boolean
}) {
  const rows = { down: 0, left: 1, right: 2, up: 3 }
  return (
    <span
      className={`village-walker ${moving && !quiet ? "is-walking" : ""}`}
      data-facing={direction}
      aria-hidden="true"
      style={
        {
          backgroundImage: `url(/assets/rpg/village583/${id}.webp)`,
          "--facing-row": `${(rows[direction] * 100) / 3}%`,
        } as CSSProperties
      }
    />
  )
}
