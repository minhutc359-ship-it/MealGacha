import { canStand } from "./maps"
import type { ZoneId } from "./ids"
export interface Waypoint {
  x: number
  y: number
  entityId?: string
}

export function clearPath(zone: ZoneId, from: Waypoint, to: Waypoint): boolean {
  if (![from.x, from.y, to.x, to.y].every(Number.isFinite)) return false
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 4),
  )
  for (let i = 0; i <= steps; i++)
    if (
      !canStand(
        zone,
        from.x + ((to.x - from.x) * i) / steps,
        from.y + ((to.y - from.y) * i) / steps,
      )
    )
      return false
  return true
}

/** Bounded four-neighbour search; no corner-cutting or teleport through walls. */
export function findWorldPath(
  zone: ZoneId,
  from: Waypoint,
  to: Waypoint,
): Waypoint[] {
  if (!canStand(zone, from.x, from.y) || !canStand(zone, to.x, to.y)) return []
  if (clearPath(zone, from, to)) return [to]
  const nodes: Waypoint[] = []
  for (let y = 16; y <= 368; y += 16)
    for (let x = 16; x <= 624; x += 16)
      if (canStand(zone, x, y)) nodes.push({ x, y })
  const key = (p: Waypoint) => `${p.x},${p.y}`
  const byKey = new Map(nodes.map((p) => [key(p), p]))
  const start = nodes
    .filter((p) => clearPath(zone, from, p))
    .sort(
      (a, b) =>
        Math.hypot(a.x - from.x, a.y - from.y) -
        Math.hypot(b.x - from.x, b.y - from.y),
    )[0]
  if (!start) return []
  const parents = new Map<string, Waypoint | null>([[key(start), null]])
  const queue = [start]
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]
    if (clearPath(zone, current, to)) {
      const path = [to, current]
      let previous = parents.get(key(current))
      while (previous) {
        path.push(previous)
        previous = parents.get(key(previous))
      }
      return path.reverse()
    }
    for (const [dx, dy] of [
      [16, 0],
      [-16, 0],
      [0, 16],
      [0, -16],
    ]) {
      const next = byKey.get(`${current.x + dx},${current.y + dy}`)
      if (next && !parents.has(key(next)) && clearPath(zone, current, next)) {
        parents.set(key(next), current)
        queue.push(next)
      }
    }
  }
  return []
}
