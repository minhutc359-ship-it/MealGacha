import { ZONE_IDS, type ZoneId } from "../world/ids"
import { zoneById, type WorldWall } from "../world/maps"
import { npcLifeClock, type NpcLifePhase } from "../world/npcLife"

export const WORLD_PLAY_BOUNDS = {
  x: 16,
  y: 16,
  width: 608,
  height: 352,
} as const

export type WorldEdge = "north" | "east" | "south" | "west"
export type WorldEdgeStyle = "garden" | "lantern" | "kitchen" | "pantry" | "hearth" | "table"

export interface WorldPolishColor {
  color: number
  alpha: number
}

export interface WorldLightPool {
  id: string
  x: number
  y: number
  radius: number
  color: number
  alpha: number
}

export interface WorldPolishProfile {
  zoneId: ZoneId
  edgeStyle: WorldEdgeStyle
  edgeColor: number
  edgeAccent: number
  shadowColor: number
  ambient: Record<NpcLifePhase, WorldPolishColor>
  lights: readonly WorldLightPool[]
}

const ambient = (
  morning: number,
  day: number,
  evening: number,
  night: number,
): Record<NpcLifePhase, WorldPolishColor> => ({
  morning: { color: morning, alpha: 0.075 },
  day: { color: day, alpha: 0.035 },
  evening: { color: evening, alpha: 0.12 },
  night: { color: night, alpha: 0.18 },
})

export const WORLD_POLISH_PROFILES = [
  {
    zoneId: ZONE_IDS[0],
    edgeStyle: "garden",
    edgeColor: 0x244b35,
    edgeAccent: 0x82a15f,
    shadowColor: 0x14271d,
    ambient: ambient(0xffe5ae, 0xe8f3d7, 0xe7a36d, 0x233d52),
    lights: [
      { id: "table", x: 160, y: 144, radius: 72, color: 0xffd78e, alpha: 0.16 },
      { id: "well", x: 272, y: 328, radius: 54, color: 0xaeddd1, alpha: 0.11 },
    ],
  },
  {
    zoneId: ZONE_IDS[1],
    edgeStyle: "lantern",
    edgeColor: 0x25364c,
    edgeAccent: 0xe0a958,
    shadowColor: 0x101923,
    ambient: ambient(0xffdab2, 0xe7edf4, 0xd6815c, 0x172840),
    lights: [
      {
        id: "lantern-west",
        x: 160,
        y: 112,
        radius: 78,
        color: 0xffc765,
        alpha: 0.2,
      },
      {
        id: "lantern-east",
        x: 504,
        y: 128,
        radius: 68,
        color: 0xffb85c,
        alpha: 0.17,
      },
    ],
  },
  {
    zoneId: ZONE_IDS[2],
    edgeStyle: "kitchen",
    edgeColor: 0x4a3529,
    edgeAccent: 0xbb7550,
    shadowColor: 0x241914,
    ambient: ambient(0xffdfb0, 0xf3e5cf, 0xd97b53, 0x29313b),
    lights: [
      {
        id: "keeper",
        x: 320,
        y: 128,
        radius: 78,
        color: 0xffc36a,
        alpha: 0.18,
      },
      { id: "wash", x: 272, y: 328, radius: 52, color: 0x9bd6d5, alpha: 0.1 },
    ],
  },
  {
    zoneId: ZONE_IDS[3],
    edgeStyle: "pantry",
    edgeColor: 0x394934,
    edgeAccent: 0xb39a62,
    shadowColor: 0x1b2419,
    ambient: ambient(0xf4d8a0, 0xe7e0c6, 0xc98a59, 0x26342e),
    lights: [
      { id: "hint", x: 240, y: 128, radius: 62, color: 0xffd889, alpha: 0.14 },
      { id: "chest", x: 432, y: 272, radius: 58, color: 0xe6b66d, alpha: 0.13 },
    ],
  },
  {
    zoneId: ZONE_IDS[4],
    edgeStyle: "hearth",
    edgeColor: 0x4c3027,
    edgeAccent: 0xd66f45,
    shadowColor: 0x251510,
    ambient: ambient(0xffd5a4, 0xf0d4bd, 0xd56845, 0x34242b),
    lights: [
      {
        id: "steam-west",
        x: 208,
        y: 144,
        radius: 58,
        color: 0xffbd64,
        alpha: 0.16,
      },
      {
        id: "steam-east",
        x: 432,
        y: 144,
        radius: 64,
        color: 0xff8958,
        alpha: 0.18,
      },
    ],
  },
  {
    zoneId: ZONE_IDS[5],
    edgeStyle: "table",
    edgeColor: 0x44343e,
    edgeAccent: 0xc49a78,
    shadowColor: 0x241b22,
    ambient: ambient(0xf7d8b4, 0xe9ded8, 0xbd7a65, 0x292438),
    lights: [
      { id: "host", x: 320, y: 128, radius: 78, color: 0xf5b76c, alpha: 0.15 },
      { id: "note", x: 448, y: 144, radius: 52, color: 0xffdc96, alpha: 0.14 },
    ],
  },
] as const satisfies readonly WorldPolishProfile[]

export interface WorldEdgeSegment {
  edge: WorldEdge
  x: number
  y: number
  width: number
  height: number
}

export interface WorldColliderShadow {
  footprint: WorldWall
  x: number
  y: number
  width: number
  height: number
}

export interface WorldPolishFrame {
  zoneId: ZoneId
  phase: NpcLifePhase
  edgeStyle: WorldEdgeStyle
  edgeColor: number
  edgeAccent: number
  shadowColor: number
  ambient: WorldPolishColor
  pulse: number
  edges: readonly WorldEdgeSegment[]
  colliders: readonly WorldColliderShadow[]
  lights: ReadonlyArray<WorldLightPool & { intensity: number }>
}

interface PolishControls {
  paused?: boolean
  reduced?: boolean
}

export function worldPolishProfile(zoneId: ZoneId): WorldPolishProfile {
  const profile = WORLD_POLISH_PROFILES.find((item) => item.zoneId === zoneId)
  if (!profile) throw Error(`Missing world polish profile: ${zoneId}`)
  return profile
}

type Interval = readonly [number, number]

function visibleIntervals(
  start: number,
  end: number,
  gaps: readonly Interval[],
) {
  const merged: [number, number][] = []
  for (const [rawStart, rawEnd] of [...gaps].sort((a, b) => a[0] - b[0])) {
    const from = Math.max(start, Math.min(end, rawStart))
    const to = Math.max(start, Math.min(end, rawEnd))
    if (to <= from) continue
    const prior = merged.at(-1)
    if (prior && from <= prior[1]) prior[1] = Math.max(prior[1], to)
    else merged.push([from, to])
  }
  const visible: [number, number][] = []
  let cursor = start
  for (const [from, to] of merged) {
    if (from > cursor) visible.push([cursor, from])
    cursor = Math.max(cursor, to)
  }
  if (cursor < end) visible.push([cursor, end])
  return visible
}

/** Presentation border follows canonical stand bounds and opens around boundary exits. */
export function worldEdgeSegments(zoneId: ZoneId): readonly WorldEdgeSegment[] {
  const zone = zoneById(zoneId)
  const gaps: Record<WorldEdge, Interval[]> = {
    north: [],
    east: [],
    south: [],
    west: [],
  }
  for (const object of zone.objects.filter((item) => item.kind === "exit")) {
    if (object.y <= WORLD_PLAY_BOUNDS.y)
      gaps.north.push([object.x - 32, object.x + 32])
    if (object.y >= WORLD_PLAY_BOUNDS.y + WORLD_PLAY_BOUNDS.height)
      gaps.south.push([object.x - 32, object.x + 32])
    // Side exits use 24/616 anchors so their 20px interaction marker remains
    // inside the 16..624 stand bounds.
    if (object.x <= WORLD_PLAY_BOUNDS.x + 8)
      gaps.west.push([object.y - 32, object.y + 32])
    if (object.x >= WORLD_PLAY_BOUNDS.x + WORLD_PLAY_BOUNDS.width - 8)
      gaps.east.push([object.y - 32, object.y + 32])
  }
  const horizontal = (edge: "north" | "south", y: number) =>
    visibleIntervals(
      WORLD_PLAY_BOUNDS.x,
      WORLD_PLAY_BOUNDS.x + WORLD_PLAY_BOUNDS.width,
      gaps[edge],
    ).map(([from, to]) => ({
      edge,
      x: from,
      y,
      width: to - from,
      height: 16,
    }))
  const vertical = (edge: "east" | "west", x: number) =>
    visibleIntervals(
      WORLD_PLAY_BOUNDS.y,
      WORLD_PLAY_BOUNDS.y + WORLD_PLAY_BOUNDS.height,
      gaps[edge],
    ).map(([from, to]) => ({
      edge,
      x,
      y: from,
      width: 16,
      height: to - from,
    }))
  return [
    ...horizontal("north", 0),
    ...vertical("east", 624),
    ...horizontal("south", 368),
    ...vertical("west", 0),
  ]
}

/** Visual shadow is derived from, and reports, the exact canonical collider. */
export function worldColliderShadows(
  zoneId: ZoneId,
): readonly WorldColliderShadow[] {
  return zoneById(zoneId).walls.map((wall) => ({
    footprint: { ...wall },
    x: wall.x - 6,
    y: wall.y + wall.height - 10,
    width: wall.width + 12,
    height: 18,
  }))
}

export function worldPolishFrame(
  zoneId: ZoneId,
  lifeMs: number,
  animationMs: number,
  controls: PolishControls = {},
): WorldPolishFrame {
  if (!Number.isFinite(lifeMs) || lifeMs < 0)
    throw Error("Invalid polish life time")
  if (!Number.isFinite(animationMs) || animationMs < 0)
    throw Error("Invalid polish animation time")
  const profile = worldPolishProfile(zoneId)
  const phase = npcLifeClock(lifeMs).phase
  const pulse =
    controls.paused || controls.reduced
      ? 0.5
      : 0.5 + Math.sin((animationMs / 2400) * Math.PI * 2) * 0.5
  return {
    zoneId,
    phase,
    edgeStyle: profile.edgeStyle,
    edgeColor: profile.edgeColor,
    edgeAccent: profile.edgeAccent,
    shadowColor: profile.shadowColor,
    ambient: { ...profile.ambient[phase] },
    pulse,
    edges: worldEdgeSegments(zoneId),
    colliders: worldColliderShadows(zoneId),
    lights: profile.lights.map((light) => ({
      ...light,
      intensity: light.alpha * (0.9 + pulse * 0.1),
    })),
  }
}

export function worldPolishTelemetry(frame: WorldPolishFrame) {
  return {
    zoneId: frame.zoneId,
    phase: frame.phase,
    edgeStyle: frame.edgeStyle,
    ambient: frame.ambient,
    pulse: frame.pulse,
    edgeSegments: frame.edges.length,
    colliderFootprints: frame.colliders.map((item) => item.footprint),
    lights: frame.lights.map(({ id, x, y, radius, intensity }) => ({
      id,
      x,
      y,
      radius,
      intensity,
    })),
  }
}
