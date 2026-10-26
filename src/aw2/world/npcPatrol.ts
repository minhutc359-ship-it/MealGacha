import { MEMORY_IDS, ZONE_IDS, type ZoneId } from "./ids"
import { zoneById } from "./maps"
import type { WorldProgress } from "./model"
import type { Waypoint } from "./navigation"

export const PATROL_NPC_ID = "aw2-npc-dem-nuoc"
export const PATROL_ZONE = ZONE_IDS[1]
export const NPC_PATROL = {
  speed: 26,
  restMs: 650,
  route: [
    { x: 504, y: 128 },
    { x: 544, y: 128 },
    { x: 544, y: 160 },
    { x: 504, y: 160 },
  ],
} as const

export interface NpcPatrolState {
  zoneId: ZoneId
  x: number
  y: number
  facing: WorldProgress["facing"]
  nextPoint: number
  restMs: number
  walkMs: number
  moving: boolean
  held: boolean
}

export function newNpcPatrol(zoneId: ZoneId): NpcPatrolState {
  return {
    zoneId,
    ...NPC_PATROL.route[0],
    facing: "down",
    nextPoint: 1,
    restMs: NPC_PATROL.restMs,
    walkMs: 0,
    moving: false,
    held: false,
  }
}

/** Story availability has no timer: the write action still uses the canonical anchor. */
export function npcNeedsStoryAnchor(world: WorldProgress) {
  return (
    world.questIndex === 1 &&
    world.accepted &&
    !world.memories.includes(MEMORY_IDS[2])
  )
}

export function npcPatrolView(
  world: WorldProgress,
  patrol?: Readonly<NpcPatrolState>,
): NpcPatrolState {
  const pose =
    !patrol || patrol.zoneId !== world.zoneId
      ? newNpcPatrol(world.zoneId)
      : { ...patrol }
  return npcNeedsStoryAnchor(world)
    ? { ...pose, ...NPC_PATROL.route[0], moving: false }
    : pose
}

/** Detached read-only projection shared by interaction, labels, navigation and rendering. */
export function worldObjects(
  world: WorldProgress,
  patrol?: Readonly<NpcPatrolState>,
) {
  const pose = npcPatrolView(world, patrol)
  return zoneById(world.zoneId).objects.map((object) => ({
    ...object,
    ...(object.id === PATROL_NPC_ID ? { x: pose.x, y: pose.y } : {}),
  }))
}

function facingPlayer(
  world: WorldProgress,
  pose: NpcPatrolState,
): WorldProgress["facing"] {
  const dx = world.x - pose.x,
    dy = world.y - pose.y
  if (!dx && !dy) return pose.facing
  return Math.abs(dx) > Math.abs(dy)
    ? dx < 0
      ? "left"
      : "right"
    : dy < 0
      ? "up"
      : "down"
}

export function facePatrolNpc(
  world: WorldProgress,
  patrol: Readonly<NpcPatrolState>,
): NpcPatrolState {
  const pose = npcPatrolView(world, patrol)
  return { ...pose, facing: facingPlayer(world, pose), moving: false }
}

interface PatrolControls {
  paused?: boolean
  reduced?: boolean
}

/** Local bounded simulation only. Never reads real-world time or writes progress. */
export function advanceNpcPatrol(
  world: WorldProgress,
  patrol: Readonly<NpcPatrolState>,
  deltaMs: number,
  controls: PatrolControls = {},
): NpcPatrolState {
  if (!Number.isFinite(deltaMs) || deltaMs < 0)
    throw Error("Invalid NPC patrol delta")
  let pose = npcPatrolView(world, patrol)
  if (patrol.zoneId !== world.zoneId || world.zoneId !== PATROL_ZONE)
    return pose
  if (npcNeedsStoryAnchor(world))
    return {
      ...pose,
      nextPoint: 1,
      restMs: NPC_PATROL.restMs,
      walkMs: 0,
      moving: false,
    }
  if (controls.paused || controls.reduced) return { ...pose, moving: false }
  if (pose.held || Math.hypot(world.x - pose.x, world.y - pose.y) <= 48)
    return facePatrolNpc(world, pose)
  let remaining = Math.min(deltaMs, 100)
  if (!remaining) return pose
  if (pose.restMs > 0) {
    const resting = Math.min(pose.restMs, remaining)
    pose = { ...pose, restMs: pose.restMs - resting, moving: false }
    remaining -= resting
  }
  if (!remaining) return pose
  const target = NPC_PATROL.route[pose.nextPoint],
    dx = target.x - pose.x,
    dy = target.y - pose.y
  const distance = Math.hypot(dx, dy),
    step = Math.min(distance, (NPC_PATROL.speed * remaining) / 1000)
  if (!distance)
    return {
      ...pose,
      nextPoint: (pose.nextPoint + 1) % NPC_PATROL.route.length,
      restMs: NPC_PATROL.restMs,
      moving: false,
    }
  const arrived = step >= distance
  return {
    ...pose,
    x: arrived ? target.x : pose.x + (dx / distance) * step,
    y: arrived ? target.y : pose.y + (dy / distance) * step,
    facing:
      Math.abs(dx) > Math.abs(dy)
        ? dx < 0
          ? "left"
          : "right"
        : dy < 0
          ? "up"
          : "down",
    nextPoint: arrived
      ? (pose.nextPoint + 1) % NPC_PATROL.route.length
      : pose.nextPoint,
    restMs: arrived ? NPC_PATROL.restMs : 0,
    walkMs: pose.walkMs + (step / NPC_PATROL.speed) * 1000,
    moving: !arrived,
  }
}

/** Resolve entity at click time, including a native control rendered before this tick. */
export function pinNpcApproach(
  world: WorldProgress,
  patrol: Readonly<NpcPatrolState>,
  point: Waypoint,
) {
  const pose = npcPatrolView(world, patrol)
  const targetsNpc =
    world.zoneId === PATROL_ZONE &&
    (point.entityId === PATROL_NPC_ID ||
      (!point.entityId &&
        Math.abs(point.x - pose.x) < 0.01 &&
        Math.abs(point.y - pose.y - 32) < 0.01))
  return targetsNpc
    ? {
        patrol: { ...pose, held: true, moving: false },
        point: { x: pose.x, y: pose.y + 32, entityId: PATROL_NPC_ID },
      }
    : { patrol: releaseNpcApproach(pose), point }
}

export function releaseNpcApproach(
  patrol: Readonly<NpcPatrolState>,
): NpcPatrolState {
  return patrol.held ? { ...patrol, held: false } : patrol
}
