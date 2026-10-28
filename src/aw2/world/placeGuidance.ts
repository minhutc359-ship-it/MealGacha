import type { WorldProgress } from "./model"
import type { WorldObject } from "./maps"
import type { Waypoint } from "./navigation"
import { worldObjects, type NpcPatrolState } from "./npcPatrol"
import { describeObject, INTERACT_RANGE, nearestObject } from "./rules"
import { scenePosition } from "./scene"
import { PANTRY_STOCK } from "./pantryLayout"
import {
  TEA_ROOM,
  TEA_EXIT_ID,
  roomById,
  roomForEntrance,
} from "./interiorLayout"
import { journeyApproach } from "./registry"

/** A local approach only. No route, inspection or projection writes a save or runs an action. */
export function placeApproach(object: Readonly<WorldObject>): Waypoint {
  if (object.kind === "room") return { ...roomForEntrance(object.id)!.approach }
  if (object.kind === "room-exit")
    return { x: object.x + 24, y: object.y, entityId: object.id }
  if (object.kind === "stock") return { ...PANTRY_STOCK.approach }
  if (object.kind === "exit")
    return {
      x: object.x + (object.x > 320 ? -24 : 24),
      y: object.y,
      entityId: object.id,
    }
  return { x: object.x, y: object.y + 32, entityId: object.id }
}
export function placeKind(object: Readonly<WorldObject>) {
  switch (object.kind) {
    case "room":
      return "Cửa vào"
    case "room-exit":
      return "Cửa ra"
    case "exit":
      return "Cửa nối vùng"
    case "room-service":
      return "Bàn trong tiệm"
    case "stock":
      return "Kiểm nguyên liệu"
    case "mode":
      return "Bàn luyện tập"
    case "npc":
    case "memory":
      return "Người trong vùng"
    default:
      return "Điểm tương tác"
  }
}
export function placeGuidance(
  world: WorldProgress,
  object: Readonly<WorldObject>,
) {
  const position = scenePosition(world)
  const distance = Math.hypot(position.x - object.x, position.y - object.y)
  const locked =
    object.kind === "exit" &&
    !describeObject(world, object).actions.some((a) => a.id === "travel")
  return {
    near: distance <= INTERACT_RANGE,
    locked,
    kind: placeKind(object),
    approach: placeApproach(object),
  }
}
/** Resolve a selected target again against the active scene and actual patrol snapshot. */
export function interactionTarget(
  world: WorldProgress,
  id?: string,
  patrol?: Readonly<NpcPatrolState>,
): WorldObject | undefined {
  if (id === undefined) return nearestObject(world, patrol)
  const object = worldObjects(world, patrol).find(
    (candidate) => candidate.id === id,
  )
  return object && placeGuidance(world, object).near ? object : undefined
}
export function teaRoomDirection(world: WorldProgress) {
  if (world.interior)
    return {
      label: "Đi tới cửa ra hiên",
      text: `Bạn đang trong ${roomById(world.interior.roomId).name}. Ra cửa trước khi đi sang vùng khác.`,
      approach: placeApproach(
        roomById(world.interior.roomId).objects.find(
          (object) => object.kind === "room-exit",
        )!,
      ),
    }
  if (world.zoneId === TEA_ROOM.zoneId)
    return {
      label: "Đi tới cửa tiệm trà",
      text: "Tiệm trà có bàn đội đồng hành, nhật ký và công thức. Tới cửa rồi tự chọn Vào tiệm trà.",
      approach: { ...TEA_ROOM.approach },
    }
  return {
    label: "Đi tới cửa về Làng",
    text: "Tiệm trà ở Làng Giao Ước. Qua từng cửa để về Làng, rồi chọn điểm đến tiệm trà.",
    approach: journeyApproach(world, TEA_ROOM.zoneId),
  }
}
