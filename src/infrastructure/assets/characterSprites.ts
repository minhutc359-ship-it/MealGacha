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
  "chef-nhien": ["living-chef-nhien", 0],
  "chef-hai": ["living-chef-hai", 0],
  "chef-moc": ["living-chef-moc", 0],
  "chef-bach": ["living-chef-bach", 0],
  "chef-lien": ["living-chef-lien", 0],
  ferry: ["living-ferry", 0],
  "bun-cha": ["living-bun-cha", 0],
  "bun-rieu": ["living-bun-rieu", 0],
  "banh-xeo": ["living-banh-xeo", 0],
  "banh-cuon": ["living-banh-cuon", 0],
  xoi: ["living-xoi", 0],
  "com-ga": ["living-com-ga", 0],
  "banh-chung": ["rosterD", 0],
  "banh-tet": ["rosterD", 1],
  "caravan-herbalist": ["rosterD", 2],
  "caravan-gardener": ["rosterD", 3],
  "xoi-xeo": ["rosterE", 0],
  "dua-hanh": ["rosterE", 1],
  "bun-bo-hue": ["rosterE", 2],
  "che-buoi": ["rosterE", 3],
  "bun-ca": ["rosterF", 0],
  "cha-ruoi": ["rosterF", 1],
  "cha-ca-la-vong": ["rosterF", 2],
  "thit-kho-trung": ["rosterF", 3],
  "bun-thang": ["rosterG", 0],
  "com-lang-vong": ["rosterG", 1],
  "banh-com-hang-than": ["rosterG", 2],
  "ca-phe-trung": ["rosterG", 3],
}
const ENEMY_MODELS: Record<string, [CharacterSheet, number]> = {
  "v4-tide-lock": ["living-bosses", 0],
  "v4-last-page": ["living-bosses", 1],
  "ink-crab": ["nightA", 0],
  "char-hound": ["nightA", 1],
  "silk-moth": ["nightA", 2],
  "bamboo-wraith": ["nightA", 3],
  "rival-ladle": ["nightB", 0],
  "rival-flute": ["nightB", 1],
  "boss-drum": ["nightB", 2],
  "boss-lotus": ["nightB", 3],
}
export function monsterCharacter(id: string): CharacterModel {
  const def = MONSTER_MAP[id]
  const [sheet, row] = ENEMY_MODELS[id] ?? ["enemy", def.sprite]
  return { sheet, row, id, name: def.name }
}
export function unitCharacter(id: string): CharacterModel {
  const unit = UNIT_MAP[id],
    custom = DISTINCT_MODELS[id]
  const [sheet, row] =
    custom ??
    (unit.portrait >= 18
      ? ["fresh", unit.portrait - 18]
      : ["base", unit.sprite])
  return {
    sheet,
    row,
    id,
    name:
      unit?.spirit ??
      (id === "caravan-herbalist" ? "Người hái thuốc" : "Người gieo vườn"),
    showcase: sheet === "base" ? FLAVOR_SPIRITS[unit.school].art : undefined,
  }
}

// Fit around the measured feet and account for mirrored, asymmetric poses.
export function fitCharacter(
  model: CharacterModel,
  width: number,
  height: number,
  flip = false,
) {
  const bounds = characterBounds(model)!
  const scale = Math.min(
    width / (bounds.right - bounds.left),
    height / (bounds.bottom - bounds.top),
  )
  return {
    scale,
    offsetX: (-(flip ? -1 : 1) * (bounds.left + bounds.right) * scale) / 2,
    offsetY: -bounds.bottom * scale,
    bounds,
  }
}

// Leases retain visible atlases; unused entries are evicted by actual decoded bytes.
const IMAGE_BUDGET = 64 * 1024 * 1024
interface ImageEntry {
  image: HTMLImageElement
  leases: number
  used: number
}
const images = new Map<string, ImageEntry>()
let serial = 0
const decodedBytes = (entry: ImageEntry) =>
  entry.image.naturalWidth * entry.image.naturalHeight * 4
function evictImages() {
  let bytes = [...images.values()].reduce(
    (sum, entry) => sum + decodedBytes(entry),
    0,
  )
  for (const [path, entry] of [...images].sort(
    (a, b) => a[1].used - b[1].used,
  )) {
    if (bytes <= IMAGE_BUDGET && images.size <= 16) break
    if (entry.leases || !entry.image.complete) continue
    bytes -= decodedBytes(entry)
    images.delete(path)
  }
}
function imageEntry(path: string) {
  let entry = images.get(path)
  if (!entry) {
    const image = new Image()
    image.decoding = "async"
    entry = { image, leases: 0, used: ++serial }
    images.set(path, entry)
    image.addEventListener("load", evictImages)
    image.addEventListener("error", () => {
      if (!entry!.leases) images.delete(path)
    })
    image.src = path
  }
  entry.used = ++serial
  return entry
}
export function characterImage(path: string) {
  const entry = imageEntry(path)
  evictImages()
  return entry.image
}
export function acquireCharacterImage(path: string) {
  const entry = imageEntry(path)
  entry.leases++
  evictImages()
  let active = true
  return {
    image: entry.image,
    release: () => {
      if (!active) return
      active = false
      entry.leases--
      evictImages()
    },
  }
}
export function characterCacheStats() {
  return {
    count: images.size,
    bytes: [...images.values()].reduce((sum, e) => sum + decodedBytes(e), 0),
    leased: [...images.values()].filter((e) => e.leases).length,
    budget: IMAGE_BUDGET,
  }
}

// One 30fps clock for every TCG sprite. No React state changes per frame.
const listeners = new Set<(now: number) => void>()
let handle = 0,
  last = 0
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
    left: Math.min(...row.frames.map((f) => -f[4])),
    right: Math.max(...row.frames.map((f) => f[2] - f[4])),
    top: Math.min(...row.frames.map((f) => -f[5])),
    bottom: Math.max(...row.frames.map((f) => f[3] - f[5])),
    row,
  }
}
