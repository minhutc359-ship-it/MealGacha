import { SPRITE_SHEETS } from "../../game/autochess/presentation"
import { UNIT_MAP, MONSTER_MAP } from "../../game/autochess/catalog"
import { FLAVOR_SPIRITS } from "../../game/flavorSpirits"

export type CharacterSheet = keyof typeof SPRITE_SHEETS
export interface CharacterModel {
  sheet: CharacterSheet
  row: number
  id: string
  name: string
  showcase?: string
}

export const DISTINCT_MODELS: Record<string, [CharacterSheet, number]> = {
  "chef-nhien": ["rosterA", 0], "chef-hai": ["rosterA", 1],
  "chef-moc": ["rosterA", 2], "chef-bach": ["rosterA", 3],
  "chef-lien": ["rosterB", 0], ferry: ["rosterB", 1],
  "bun-cha": ["rosterB", 2], "bun-rieu": ["rosterB", 3],
  "banh-xeo": ["rosterC", 0], "banh-cuon": ["rosterC", 1],
  xoi: ["rosterC", 2], "com-ga": ["rosterC", 3],
  "banh-chung": ["rosterD", 0], "banh-tet": ["rosterD", 1],
  "caravan-herbalist": ["rosterD", 2], "caravan-gardener": ["rosterD", 3],
  "xoi-xeo": ["rosterE", 0], "dua-hanh": ["rosterE", 1],
  "bun-bo-hue": ["rosterE", 2], "che-buoi": ["rosterE", 3],
  "bun-ca": ["rosterF", 0], "cha-ruoi": ["rosterF", 1],
  "cha-ca-la-vong": ["rosterF", 2], "thit-kho-trung": ["rosterF", 3],
  "bun-thang": ["rosterG", 0], "com-lang-vong": ["rosterG", 1],
  "banh-com-hang-than": ["rosterG", 2], "ca-phe-trung": ["rosterG", 3],
}
const ENEMY_MODELS: Record<string, [CharacterSheet, number]> = {
  "ink-crab": ["nightA", 0], "char-hound": ["nightA", 1],
  "silk-moth": ["nightA", 2], "bamboo-wraith": ["nightA", 3],
  "rival-ladle": ["nightB", 0], "rival-flute": ["nightB", 1],
  "boss-drum": ["nightB", 2], "boss-lotus": ["nightB", 3],
}
export function monsterCharacter(id: string): CharacterModel {
  const def = MONSTER_MAP[id]
  const [sheet, row] = ENEMY_MODELS[id] ?? ["enemy", def.sprite]
  return { sheet, row, id, name: def.name }
}
export function unitCharacter(id: string): CharacterModel {
  const unit = UNIT_MAP[id], custom = DISTINCT_MODELS[id]
  const [sheet, row] = custom ?? (unit.portrait >= 18
    ? ["fresh", unit.portrait - 18] : ["base", unit.sprite])
  return { sheet, row, id, name: unit?.spirit ?? (id === "caravan-herbalist" ? "Người hái thuốc" : "Người gieo vườn"),
    showcase: sheet === "base" ? FLAVOR_SPIRITS[unit.school].art : undefined }
}

// Fit around the measured feet and account for mirrored, asymmetric poses.
export function fitCharacter(model: CharacterModel, width: number, height: number, flip = false) {
  const bounds = characterBounds(model)!
  const scale = Math.min(width / (bounds.right - bounds.left), height / (bounds.bottom - bounds.top))
  return { scale, offsetX: -(flip ? -1 : 1) * (bounds.left + bounds.right) * scale / 2,
    offsetY: -bounds.bottom * scale, bounds }
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
  // Soft decoded-cache budget. Mounted canvases keep their own live references.
  images.delete(path); images.set(path, image)
  let bytes = [...images.values()].reduce((sum, item) => sum + item.naturalWidth * item.naturalHeight * 4, 0)
  for (const [key, item] of images) {
    if (images.size <= 16 && bytes <= 64 * 1024 * 1024) break
    if (key === path) continue
    bytes -= item.naturalWidth * item.naturalHeight * 4; images.delete(key)
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
