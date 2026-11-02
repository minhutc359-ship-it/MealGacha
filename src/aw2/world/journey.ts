import {
  MEMORY_IDS,
  ZONE_IDS,
  KITCHEN_BOSS_ID,
  TABLE_NOTE_ID,
  type ZoneId,
} from "./ids"
import { zoneById, type WorldObject } from "./maps"
import type { WorldProgress } from "./model"
import { describeObject } from "./rules"
import type { Waypoint } from "./navigation"
import { worldObjects, type NpcPatrolState } from "./npcPatrol"
import { roomById, roomForEntrance, type RoomId } from "./interiorLayout"
import { entityLocation } from "./scene"

export interface JourneyDirection {
  targetId: string
  targetName: string
  targetZone: ZoneId
  targetRoomId: RoomId | null
  zones: ZoneId[]
  next: WorldObject
  approach: Waypoint
}

function targets(state: WorldProgress): string[] {
  if (state.questIndex === 0)
    return [
      state.accepted && !state.tableRead
        ? "aw2-object-village-table"
        : "aw2-npc-giu-cho",
    ]
  if (state.questIndex === 1) {
    if (!state.accepted || state.memories.length === 3)
      return ["aw2-npc-va-den"]
    return ["aw2-npc-nguoi-ban", "aw2-npc-sua-ghe", "aw2-npc-dem-nuoc"].filter(
      (_, memory) => !state.memories.includes(MEMORY_IDS[memory]),
    )
  }
  if (state.questIndex === 2) {
    if (!state.accepted || state.puzzleStep === 3) return ["aw2-npc-gac-bep"]
    if (!state.hintRead) return ["aw2-object-hearth-hint"]
    return [`aw2-object-steam-${state.puzzleStep}`]
  }
  if (state.questIndex === 3) {
    if (!state.accepted) return ["aw2-npc-gac-bep"]
    if (!state.bossDefeated) return [KITCHEN_BOSS_ID]
    return [state.tableNoteRead ? "aw2-npc-giu-cho" : TABLE_NOTE_ID]
  }
  return []
}

/** Read-only graph projection: command descriptions remain the only travel authority. */
export function journeyRoute(
  state: WorldProgress,
  destination: ZoneId,
): ZoneId[] | undefined {
  const queue: ZoneId[][] = [[state.zoneId]],
    seen = new Set<ZoneId>([state.zoneId])
  for (const path of queue) {
    const here = path[path.length - 1]
    if (here === destination) return path
    for (const exit of zoneById(here).objects) {
      if (exit.kind !== "exit" || !exit.to || seen.has(exit.to)) continue
      if (
        !describeObject({ ...state, zoneId: here }, exit).actions.some(
          (action) => action.id === "travel",
        )
      )
        continue
      seen.add(exit.to)
      queue.push([...path, exit.to])
    }
  }
  return undefined
}

/** Directions do not move, persist, grant, interact or cross a zone boundary. */
export function journeyDirections(
  state: WorldProgress,
  patrol?: Readonly<NpcPatrolState>,
): JourneyDirection[] {
  return targets(state).flatMap((id) => {
    const location = entityLocation(id)
    if (!location) throw Error(`Missing journey entity: ${id}`)
    const { zoneId: targetZone, roomId: targetRoomId } = location
    const zones = journeyRoute({ ...state, interior: null }, targetZone)
    if (!zones) return []
    let next: WorldObject
    if (state.interior && state.interior.roomId !== targetRoomId) {
      next = roomById(state.interior.roomId).objects.find(
        (o) => o.kind === "room-exit",
      )!
    } else if (zones.length > 1) {
      next = zoneById(state.zoneId).objects.find(
        (o) =>
          o.kind === "exit" &&
          o.to === zones[1] &&
          describeObject({ ...state, interior: null }, o).actions.some(
            (a) => a.id === "travel",
          ),
      )!
    } else if (targetRoomId && state.interior?.roomId !== targetRoomId) {
      next = roomById(targetRoomId).entrance
    } else {
      next =
        worldObjects({ ...state, zoneId: targetZone }, patrol).find(
          (o) => o.id === id,
        ) ?? location.object
    }
    const approach =
      next.kind === "room"
        ? { ...roomForEntrance(next.id)!.approach }
        : next.kind === "room-exit"
          ? { x: next.x + 24, y: next.y }
          : next.kind === "exit"
            ? { x: next.x + (next.x > 320 ? -24 : 24), y: next.y }
            : { x: next.x, y: next.y + 32 }
    return [
      {
        targetId: id,
        targetName: location.object.name,
        targetZone,
        targetRoomId,
        zones,
        next: { ...next },
        approach,
      },
    ]
  })
}
