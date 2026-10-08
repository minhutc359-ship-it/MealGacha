import { SPRITE_SHEETS } from "../../game/autochess/presentation"

export type CharacterSheet = keyof typeof SPRITE_SHEETS
export interface CharacterModel {
  sheet: CharacterSheet
  row: number
  id: string
  name: string
}

// Shared browser cache: changing game modes does not decode the atlases again.
const images = new Map<string, HTMLImageElement>()
export function characterImage(path: string) {
  let image = images.get(path)
  if (!image) {
    image = new Image()
    image.decoding = "async"
    image.src = path
    images.set(path, image)
  }
  return image
}

// One 30fps clock for every TCG sprite. No React state changes per frame.
const listeners = new Set<(now: number) => void>()
let handle = 0, last = 0
function tick(now: number) {
  if (now - last >= 1000 / 30 - 1) {
    last = now
    for (const draw of listeners) draw(now)
  }
  handle = listeners.size && !document.hidden ? requestAnimationFrame(tick) : 0
}
function visibility() {
  cancelAnimationFrame(handle)
  handle = 0
  if (!document.hidden && listeners.size) handle = requestAnimationFrame(tick)
}
export function subscribeCharacterClock(draw: (now: number) => void) {
  if (!listeners.size) document.addEventListener("visibilitychange", visibility)
  listeners.add(draw)
  if (!handle && !document.hidden) handle = requestAnimationFrame(tick)
  return () => {
    listeners.delete(draw)
    if (!listeners.size) {
      cancelAnimationFrame(handle)
      handle = 0
      document.removeEventListener("visibilitychange", visibility)
    }
  }
}

// Use the full set of measured poses, including wide attack frames, for fitting.
export function characterBounds(model: CharacterModel) {
  const row = SPRITE_SHEETS[model.sheet].rows[model.row]
  if (!row) return null
  return {
    left: Math.min(...row.frames.map(f => -f[4])),
    right: Math.max(...row.frames.map(f => f[2] - f[4])),
    top: Math.min(...row.frames.map(f => -f[5])),
    bottom: Math.max(...row.frames.map(f => f[3] - f[5])),
    row,
  }
}
