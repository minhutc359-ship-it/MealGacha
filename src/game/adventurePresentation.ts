import type { AdventureDirection, AdventureSave } from "./adventure"
import type { AdventureMap } from "./adventureWorld"
import type { CharacterId } from "./characters"
export const WALK_ATLASES: Partial<Record<CharacterId, string>> = {
  hero: "/dev/archive/legacy-adventure-v490/assets/hero-v440.webp",
  la: "/dev/archive/legacy-adventure-v490/assets/la-v441.webp",
  merchant: "/dev/archive/legacy-adventure-v490/assets/merchant-v441.webp",
  grandmother: "/dev/archive/legacy-adventure-v490/assets/grandmother-v441.webp",
}
export const WALK_STEP_MS = 170
export const RUN_STEP_MS = 100
export interface Point {
  x: number
  y: number
}
export interface WorldView {
  width: number
  height: number
  tile: number
  x: number
  y: number
}
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n))
export function worldView(
  map: AdventureMap,
  point: Point,
  width: number,
  height: number,
): WorldView {
  const tile = Math.min(
    64,
    Math.max(28, width / (width < 600 ? 11 : 17), height / 15),
  )
  const w = map.grid[0].length * tile,
    h = map.grid.length * tile
  return {
    width,
    height,
    tile,
    x:
      w <= width
        ? (width - w) / 2
        : -clamp((point.x + 0.5) * tile - width / 2, 0, w - width),
    y:
      h <= height
        ? (height - h) / 2
        : -clamp((point.y + 0.5) * tile - height / 2, 0, h - height),
  }
}
export function tileAt(view: WorldView, x: number, y: number): Point {
  return {
    x: Math.floor((x - view.x) / view.tile),
    y: Math.floor((y - view.y) / view.tile),
  }
}
export class WorldMotion {
  private from: Point
  private to: Point
  private followerFrom: Point | null
  private followerTo: Point | null
  private start = -Infinity
  private duration = WALK_STEP_MS
  private mapId: string
  constructor(save: AdventureSave) {
    this.from = this.to = { x: save.x, y: save.y }
    this.followerFrom = this.followerTo = save.follower
    this.mapId = save.mapId
  }
  update(save: AdventureSave, now: number, duration = WALK_STEP_MS) {
    const next = { x: save.x, y: save.y }
    if (
      save.mapId !== this.mapId ||
      Math.abs(next.x - this.to.x) + Math.abs(next.y - this.to.y) > 1
    ) {
      this.from = this.to = next
      this.followerFrom = this.followerTo = save.follower
      this.start = -Infinity
    } else if (next.x !== this.to.x || next.y !== this.to.y) {
      const prior = this.at(now)
      this.from = prior.player
      this.to = next
      this.followerFrom = prior.follower ?? save.follower
      this.followerTo = save.follower
      this.start = now
      this.duration = duration
    } else if (!save.follower) {
      this.followerFrom = this.followerTo = null
    }
    this.mapId = save.mapId
  }
  at(now: number, quiet = false) {
    const phase = quiet ? 1 : clamp((now - this.start) / this.duration, 0, 1)
    const lerp = (from: Point, to: Point) => ({
      x: from.x + (to.x - from.x) * phase,
      y: from.y + (to.y - from.y) * phase,
    })
    return {
      player: lerp(this.from, this.to),
      follower: this.followerTo
        ? lerp(this.followerFrom ?? this.followerTo, this.followerTo)
        : null,
      moving: phase < 1,
      phase,
    }
  }
}
/** Latest held direction wins; slow frames never replay a backlog of movement. */
export class AdventureStepper {
  private held = new Map<string, AdventureDirection>()
  private due = -Infinity
  press(
    source: string,
    direction: AdventureDirection,
    now: number,
    interval: number,
  ) {
    if (this.held.has(source)) return null
    this.held.set(source, direction)
    return this.tick(now, interval)
  }
  release(source: string) {
    this.held.delete(source)
  }
  clear() {
    this.held.clear()
    this.due = -Infinity
  }
  get active() {
    return this.held.size > 0
  }
  delay(now: number) {
    return Math.max(0, this.due - now)
  }
  tick(now: number, interval: number) {
    if (!this.active || now < this.due) return null
    this.due = now + interval
    return [...this.held.values()].at(-1)!
  }
}
export const DIRECTION_KEYS: Record<string, AdventureDirection> = {
  ArrowUp: "up",
  w: "up",
  ArrowDown: "down",
  s: "down",
  ArrowLeft: "left",
  a: "left",
  ArrowRight: "right",
  d: "right",
}
