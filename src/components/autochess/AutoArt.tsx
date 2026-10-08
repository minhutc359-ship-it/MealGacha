import type { CSSProperties } from "react"
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
