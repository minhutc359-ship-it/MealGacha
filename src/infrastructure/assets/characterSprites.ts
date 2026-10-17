import { enemyVisual } from "../../game/enemyVisuals"
import { characterVisual } from "../../game/characterVisuals"
import { spiritArt } from "../../game/adventureRpg/spiritArt"
import { renderIsLight, sampleRenderFrame, resetRenderSampling } from "../presentation/renderQuality"
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
  "village-hero": ["villageParty", 0],
  "village-flame": ["villageParty", 1],
  "village-dragon": ["villageParty", 2],
  ferry: ["living-ferry", 0],

  "banh-tet": ["rosterD", 1],
  "caravan-herbalist": ["rosterD", 2],
  "caravan-gardener": ["rosterD", 3],
  "xoi-xeo": ["rosterE", 0],
  "dua-hanh": ["rosterE", 1],
  "bun-bo-hue": ["rosterE", 2],
  "che-buoi": ["rosterE", 3],
  "bun-ca": ["rosterF", 0],
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
  "tea-moth": ["campaignA", 0],
  "jade-sentinel": ["campaignA", 1],
  "tea-oracle": ["campaignA", 2],
  "cloud-teapot": ["campaignA", 3],
  "salt-scarab": ["campaignA", 4],
  "kiln-knight": ["campaignA", 5],
  "salt-alchemist": ["campaignA", 6],
  "salt-colossus": ["campaignA", 7],
  "moon-jelly": ["campaignB", 0],
  "lotus-mantis": ["campaignB", 1],
  "moon-priestess": ["campaignB", 2],
  "moon-heron": ["campaignB", 3],
  "spice-kite": ["campaignB", 4],
  "bronze-warden": ["campaignB", 5],
  "aroma-conductor": ["campaignB", 6],
  "aroma-regent": ["campaignB", 7],
}
export function monsterCharacter(id: string): CharacterModel {
  const def = MONSTER_MAP[id]
  const visual = enemyVisual(id)
  if (visual) return {sheet:visual.sheet,row:0,id,name:def.name}
  const [sheet, row] = ENEMY_MODELS[id] ?? ["enemy", def.sprite]
  return { sheet, row, id, name: def.name }
}
/** A character without an authored model keeps its own artwork, never a different hero. */
export function spiritCharacter(id: string, name = id): CharacterModel | null {
  const visual = characterVisual(id)
  if (visual) return {sheet: visual.sheet, row: 0, id, name}
  const art=spiritArt(id)
  if(!art)return null
  const sheet=`portrait-${art.path.match(/portraits-(\d+)/)![1]}` as CharacterSheet
  return {sheet,row:art.cell,id,name}
}
export function unitCharacter(id: string): CharacterModel {
  const unit = UNIT_MAP[id],
    visual = characterVisual(id),
    custom = visual ? [visual.sheet, 0] as [CharacterSheet, number] : DISTINCT_MODELS[id]
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
      visual?.species ??
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
      if (!entry!.leases && images.get(path) === entry) images.delete(path)
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
      if (!entry.leases && entry.image.complete && !entry.image.naturalWidth)
        images.delete(path)
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

// One adaptive 30/60fps clock for all shared sprites. No React state changes per frame.
const listeners = new Map<(now: number) => void, boolean | (() => boolean)>()
let handle = 0,
  last = 0,
  previousFrame = 0
function tick(now: number) {
  const gap = previousFrame ? now - previousFrame : 16.7
  previousFrame = now
  const active = [...listeners.values()].some(a => typeof a === "function" ? a() : a)
  const fps = !renderIsLight() && active ? 60 : 30
  if (now - last >= 1000 / fps - 1) {
    last = now
    const start = performance.now()
    for (const draw of listeners.keys()) draw(now)
    sampleRenderFrame(gap, performance.now() - start)
  }
  handle = listeners.size && !document.hidden ? requestAnimationFrame(tick) : 0
}
function visibility() {
  previousFrame = last = 0; resetRenderSampling()
  cancelAnimationFrame(handle)
  handle = 0
  if (!document.hidden && listeners.size) handle = requestAnimationFrame(tick)
}
export function subscribeCharacterClock(draw: (now: number) => void, active: boolean | (() => boolean) = false) {
  if (!listeners.size) document.addEventListener("visibilitychange", visibility)
  listeners.set(draw, active)
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
const boundsCache = new Map<string, {left: number; right: number; top: number; bottom: number; row: typeof SPRITE_SHEETS[keyof typeof SPRITE_SHEETS]["rows"][number]}>()
export function characterBounds(model: CharacterModel) {
  const key = `${model.sheet}:${model.row}`, cached = boundsCache.get(key)
  if (cached) return cached
  const row = SPRITE_SHEETS[model.sheet].rows[model.row]
  if (!row) return null
  const bounds = {
    left: Math.min(...row.frames.map((f) => -f[4])),
    right: Math.max(...row.frames.map((f) => f[2] - f[4])),
    top: Math.min(...row.frames.map((f) => -f[5])),
    bottom: Math.max(...row.frames.map((f) => f[3] - f[5])),
    row,
  }
  boundsCache.set(key, bounds)
  return bounds
}
