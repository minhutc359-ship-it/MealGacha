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
import { roomById, TEA_ROOM, TEA_EXIT_ID } from "./interiorLayout"

export interface JourneyDirection {
  targetId: string
  targetName: string
  targetZone: ZoneId
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
    return zoneById(ZONE_IDS[1])
      .objects.filter(
        (object) =>
          object.kind === "memory" &&
          !state.memories.includes(MEMORY_IDS[object.memory!]),
      )
      .map((object) => object.id)
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
  if (state.interior) {
    const exit = roomById(state.interior.roomId).objects.find(
      (object) => object.kind === "room-exit",
    )!
    return [
      {
        targetId: exit.id,
        targetName: "Ra hiên để tiếp tục hành trình",
        targetZone: state.zoneId,
        zones: [state.zoneId],
        next: { ...exit },
        approach: { x: 48, y: 192 },
      },
    ]
  }
  return targets(state).flatMap((id) => {
    const targetZone = ZONE_IDS.find((zone) =>
      zoneById(zone).objects.some((object) => object.id === id),
    )!
    const target = worldObjects({ ...state, zoneId: targetZone }, patrol).find(
      (object) => object.id === id,
    )!
    const zones = journeyRoute(state, targetZone)
    if (!zones) return []
    const next =
      zones.length === 1
        ? target
        : zoneById(state.zoneId).objects.find(
            (object) =>
              object.kind === "exit" &&
              object.to === zones[1] &&
              describeObject(state, object).actions.some(
                (action) => action.id === "travel",
              ),
          )!
    return [
      {
        targetId: target.id,
        targetName: target.name,
        targetZone,
        zones,
        next: { ...next },
        approach:
          next.kind === "exit"
            ? { x: next.x + (next.x > 320 ? -24 : 24), y: next.y }
            : { x: next.x, y: next.y + 32 },
      },
    ]
  })
}
