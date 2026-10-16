import type { CSSProperties } from "react"
import type { VillageFacing } from "../../game/villageRpg"

export function VillageWalker({
  id = "hero",
  direction = "down",
  moving = false,
  quiet = false,
}: {
  id?: "hero" | "la" | "merchant" | "grandmother" | "bach" | "flame" | "dragon"
  direction?: VillageFacing
  moving?: boolean
  quiet?: boolean
}) {
  const column = { down: 0, left: 3, right: 6, up: 9 }[direction]
  const row = {hero:0,la:1,merchant:2,grandmother:3,bach:4,flame:5,dragon:6}[id]
  return (
    <span
      className={`village-walker ${moving && !quiet ? "is-walking" : ""}`}
      data-facing={direction}
      data-pixel-character={id}
      aria-hidden="true"
      style={
        {
          backgroundImage: "url(/assets/characters/starters590/village-pixel.webp)",
          backgroundPositionY: `${row * 100 / 6}%`,
          "--step-a": `${column*100/11}%`,
          "--step-b": `${(column+1)*100/11}%`,
          "--step-c": `${(column+2)*100/11}%`,
        } as CSSProperties
      }
    />
  )
}
