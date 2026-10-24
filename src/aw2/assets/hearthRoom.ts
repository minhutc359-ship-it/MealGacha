import scene from "./kitchen-hearth.environment-v1.json"
import type { WorldProgress } from "../world/model"
import { zoneById } from "../world/maps"
import { describeObject } from "../world/rules"

export const HEARTH_ROOM_SCENE = scene

/** Read-only presentation. Rule descriptions own permission; arrival grants no action. */
export function hearthRoomWaypoints(progress: WorldProgress) {
  if (progress.zoneId !== scene.zoneId) return []
  return zoneById(progress.zoneId).objects.map((object) => {
    const actions = describeObject(progress, object).actions
    if (object.kind === "exit") {
      const locked = !actions.some((action) => action.id === "travel")
      return {
        id: object.id,
        name: object.name,
        x: object.x,
        y: object.y,
        short: object.id.endsWith(":west")
          ? "Phòng Kho"
          : locked
            ? "Bàn · khóa"
            : "Phòng Bàn",
        status: locked
          ? "Giải đủ ba bước để mở"
          : object.id.endsWith(":west")
            ? "Đường trở về luôn mở"
            : "Đường đến Phòng Bàn đã mở",
        state: locked ? "unavailable" : "ready",
        locked,
      }
    }
    const step = object.step!
    const state =
      progress.puzzleStep === 3
        ? "solved"
        : step < progress.puzzleStep
          ? "done"
          : !actions.some((action) => action.id === "puzzle")
            ? "unavailable"
            : step === progress.puzzleStep
              ? "ready"
              : "waiting"
    const status =
      state === "solved"
        ? "Bếp đã sáng · đã giải"
        : state === "done"
          ? "Bước này đã đúng"
          : state === "ready"
            ? "Bước tiếp theo · đến gần rồi tương tác"
            : state === "waiting"
              ? "Chưa tới bước này · sai thứ tự sẽ thử lại"
              : progress.questIndex === 2 && progress.accepted
                ? "Đọc Bảng dấu hơi trong Kho trước"
                : "Nhận nhiệm vụ Mở lại bếp tại Dì trước"
    return {
      id: object.id,
      name: object.name,
      x: object.x,
      y: object.y,
      short: ["Lối thoát", "Nồi", "Lửa"][step],
      status,
      state,
      locked: false,
    }
  })
}

export function hearthRoomProps(progress: WorldProgress) {
  const points = hearthRoomWaypoints(progress)
  if (!points.length) return []
  return scene.props.map((prop) => {
    const point = points.find((point) => point.id === prop.entityId)!
    const alpha =
      point.state === "ready"
        ? scene.states.readyAlpha
        : point.state === "done" || point.state === "solved"
          ? scene.states.doneAlpha
          : point.state === "waiting"
            ? scene.states.waitingAlpha
            : scene.states.unavailableAlpha
    return { ...prop, x: point.x, y: point.y, state: point.state, alpha }
  })
}
