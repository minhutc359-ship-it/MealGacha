import type { CSSProperties } from "react"
import { SPRITE_SHEETS } from "../../game/autochess/presentation"
import { AUTO_UNITS } from "../../game/autochess/catalog"
import { unitCharacter, monsterCharacter } from "../../infrastructure/assets/characterSprites"
export function AutoMonsterPortrait({ id, label }: { id: string; label: string }) {
  const model = monsterCharacter(id)
  const sheet = SPRITE_SHEETS[model.sheet], row = model.row
  const [x, y, width, height] = sheet.rows[row].frames[0]
  const fit = 100 / Math.max(width, height)
  return <span className="ac-portrait ac-sprite-portrait" role="img" aria-label={label}>
    <span className="ac-sprite-crop" style={{ width: `${width * fit}%`, height: `${height * fit}%` }}>
      <img alt="" loading="lazy" src={sheet.path} style={{ width: `${sheet.width / width * 100}%`, height: `${sheet.height / height * 100}%`, left: `${-x / width * 100}%`, top: `${-y / height * 100}%` }} />
    </span>
  </span>
}
export function AutoPortrait({
  index,
  npc = false,
  className = "",
  label = "",
}: {
  index: number
  npc?: boolean
  className?: string
  label?: string
}) {
  const model = !npc && AUTO_UNITS[index] ? unitCharacter(AUTO_UNITS[index].id) : null
  if (model?.sheet.startsWith("roster")) {
    const sheet = SPRITE_SHEETS[model.sheet]
    const [x,y,width,height] = sheet.rows[model.row].frames[0]
    const fit = 100 / Math.max(width, height)
    return <span className={`ac-portrait ac-sprite-portrait ${className}`} role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true}>
      <span className="ac-sprite-crop" style={{ width: `${width * fit}%`, height: `${height * fit}%` }}>
        <img alt="" draggable={false} loading="lazy" src={sheet.path} style={{ width: `${sheet.width/width*100}%`, height: `${sheet.height/height*100}%`, left: `${-x/width*100}%`, top: `${-y/height*100}%` }} />
      </span>
    </span>
  }
  const cols = npc ? 3 : 8,
    rows = npc ? 2 : 4
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={`ac-portrait ${className}`}
      style={
        {
          backgroundImage: `url(/assets/autochess/${
            npc ? "portraits" : "roster"
          }.webp)`,
          backgroundSize: `${cols * 100}% ${rows * 100}%`,
          backgroundPosition: `${((index % cols) / (cols - 1)) * 100}% ${(Math.floor(index / cols) / (rows - 1)) * 100}%`,
        } as CSSProperties
      }
    />
  )
}
export function WorldArt({
  scene,
  className = "",
}: {
  scene: number
  className?: string
}) {
  return (
    <div
      className={`ac-world-art ${className}`}
      aria-hidden="true"
      style={{
        backgroundPosition: `${(scene % 2) * 100}% ${Math.floor(scene / 2) * 100}%`,
      }}
    />
  )
}
