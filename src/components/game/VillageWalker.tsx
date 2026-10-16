import type { CSSProperties } from "react"
import type { VillageFacing } from "../../game/villageRpg"
import { CHEF_ASSET_ROOT, CHEF_IDS, type ChefId } from "../../game/characterVisuals"

export function VillageWalker({
  id = "hero",
  direction = "down",
  moving = false,
  quiet = false,
}: {
  id?: "hero" | "la" | "merchant" | "grandmother" | "bach" | "flame" | "dragon" | ChefId
  direction?: VillageFacing
  moving?: boolean
  quiet?: boolean
}) {
  const column = { down: 0, left: 3, right: 6, up: 9 }[direction]
  const chef = CHEF_IDS.indexOf((id === "bach" ? "chef-bach" : id) as ChefId)
  const row = chef >= 0 ? chef : {hero:0,la:1,merchant:2,grandmother:3,bach:4,flame:5,dragon:6}[id as "hero"]
  return (
    <span
      className={`village-walker ${moving && !quiet ? "is-walking" : ""}`}
      data-facing={direction}
      data-pixel-character={id}
      aria-hidden="true"
      style={
        {
          backgroundImage: `url(${chef >= 0 ? `${CHEF_ASSET_ROOT}/exploration.webp` : "/assets/characters/starters590/village-pixel.webp"})`,
          backgroundPositionY: `${row * 100 / (chef >= 0 ? 4 : 6)}%`,
          backgroundSize: `1200% ${chef >= 0 ? 500 : 700}%`,
          "--step-a": `${column*100/11}%`,
          "--step-b": `${(column+1)*100/11}%`,
          "--step-c": `${(column+2)*100/11}%`,
        } as CSSProperties
      }
    />
  )
}
