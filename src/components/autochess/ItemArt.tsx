import type { CSSProperties } from "react"
import { ITEM_MAP } from "../../game/autochess/items"

const INDEX: Record<string, number> = { lantern: 0, ladle: 1, herbs: 2, bell: 3, basket: 4, book: 5, spark: 6, dew: 7, fiber: 8 }
export function ItemArt({ id, decorative = false }: { id: string; decorative?: boolean }) {
  const index = INDEX[id]
  if (index === undefined) return null
  return <span className="ac-item-art" role={decorative ? undefined : "img"} aria-hidden={decorative || undefined}
    aria-label={decorative ? undefined : ITEM_MAP[id]?.name}
    style={{ "--item-x": `${index % 3 * 50}%`, "--item-y": `${Math.floor(index / 3) * 50}%` } as CSSProperties} />
}
