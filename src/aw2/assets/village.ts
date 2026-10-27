import scene from "./covenant-village.environment-v2.json"
import type { WorldProgress } from "../world/model"
import { zoneById } from "../world/maps"
import { describeObject } from "../world/rules"
import type { SceneBounds } from "./tableRoom"
import { TEA_ROOM } from "../world/interiorLayout"

export const VILLAGE_SCENE = scene

/** Read-only descriptions; walking never accepts, inspects, grants or travels. */
export function villageWaypoints(progress: WorldProgress) {
  if (progress.zoneId !== scene.zoneId || progress.interior) return []
  return zoneById(progress.zoneId).objects.map((object) => {
    const actions = describeObject(progress, object).actions
    let state = "waiting",
      status = "Bà vẫn chờ bên bàn chung",
      short = "Bà Giữ Chỗ"
    if (object.kind === "room")
      return {
        id: object.id,
        name: object.name,
        x: object.x,
        y: object.y,
        walkX: TEA_ROOM.approach.x,
        walkY: TEA_ROOM.approach.y,
        short: "Tiệm trà",
        status: "Đến gần rồi chọn Vào tiệm trà",
        state: "ready",
        locked: false,
      }
    if (object.kind === "exit") {
      const locked = !actions.some((a) => a.id === "travel")
      return {
        id: object.id,
        name: object.name,
        x: object.x,
        y: object.y,
        walkX: object.x,
        walkY: object.y,
        short: "Ra Phố",
        status: locked
          ? "Lối đi chưa mở"
          : "Điểm đến Phố Đèn Lồng · đến gần rồi Đi qua",
        state: locked ? "unavailable" : "ready",
        locked,
      }
    }
    if (object.kind === "table") {
      short = "Mảnh khăn"
      state = progress.tableRead
        ? "read"
        : actions.some((a) => a.id === "inspect")
          ? "ready"
          : "unavailable"
      status =
        state === "read"
          ? "Đã đọc mảnh khăn"
          : state === "ready"
            ? "Đến gần rồi Đọc mảnh khăn"
            : "Nhận nhiệm vụ tại Bà trước"
    } else if (actions.some((a) => a.id === "accept")) {
      state = "ready"
      status = "Đến gần rồi Nhận nhiệm vụ nhập môn"
    } else if (actions.some((a) => a.id === "turn-in")) {
      state = "ready"
      status = "Trở lại Bà · Hoàn tất nhập môn"
    } else if (
      actions.some((a) => a.id === "seat-wait" || a.id === "seat-share")
    ) {
      state = "ready"
      status = "Trở lại Bà · chọn lời mời kết thúc"
    } else if (progress.questIndex === 4) {
      state = "completed"
      status =
        progress.endingChoice === "wait"
          ? "Đã để ghế trống chờ"
          : "Đã mời cả làng dùng bữa"
    } else if (progress.questIndex === 0 && progress.accepted) {
      status = "Đọc mảnh khăn trên bàn rồi trở lại Bà"
    }
    return {
      id: object.id,
      name: object.name,
      x: object.x,
      y: object.y,
      walkX: object.x,
      walkY: object.y + 32,
      short,
      status,
      state,
      locked: false,
    }
  })
}

export function villageProps(progress: WorldProgress) {
  const points = villageWaypoints(progress)
  if (!points.length) return []
  return scene.props.map((prop) => {
    const point = points.find((p) => p.id === prop.entityId)!
    return { ...prop, x: point.x, y: point.y, state: point.state, alpha: 1 }
  })
}

type VillageActorBounds = SceneBounds & { groundY: number }
export function villageWellAlpha(
  actors: readonly VillageActorBounds[],
): number {
  const prop = scene.obstacle,
    left = prop.x - prop.width * prop.anchorX,
    top = prop.y - prop.height * prop.anchorY
  return actors.some(
    (a) =>
      a.groundY < prop.sortY &&
      a.x < left + prop.width &&
      a.x + a.width > left &&
      a.y < top + prop.height &&
      a.y + a.height > top,
  )
    ? prop.occludedAlpha
    : 1
}
