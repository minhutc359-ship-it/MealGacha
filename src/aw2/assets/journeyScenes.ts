import pantry from "./kitchen-pantry.environment-v1.json"
import street from "./lantern-street.environment-v1.json"
import yard from "./forgotten-kitchen-yard.environment-v1.json"
import type village from "./covenant-village.environment-v2.json"
import type { WorldProgress } from "../world/model"
import type { Economy } from "../economy/model"
import { CHEST_RECEIPT } from "../economy/model"
import { MEMORY_IDS } from "../world/ids"
import { worldObjects, type NpcPatrolState } from "../world/npcPatrol"
import { describeObject } from "../world/rules"
import type { SceneBounds } from "./tableRoom"
import { roomForEntrance } from "../world/interiorLayout"
import { PANTRY_STOCK } from "../world/pantryLayout"
import { exitApproach } from "../world/maps"

export interface JourneyFrame {
  x: number
  y: number
  width: number
  height: number
}
type SceneAsset = typeof pantry.assets.floor & { frame?: JourneyFrame }
export type JourneyScene = Omit<typeof pantry, "assets" | "frames" | "foliage" | "foregroundFrames"> & {
  assets: Record<string, SceneAsset>
  frames: Record<string, JourneyFrame>
  foliage: typeof village.foliage
  foregroundFrames: Record<string, JourneyFrame>
}
export const JOURNEY_SCENES: readonly JourneyScene[] = [pantry, street, yard]
export const journeyScene = (zoneId: string) =>
  JOURNEY_SCENES.find((s) => s.zoneId === zoneId)

/** Read-only descriptions. Neither rendering nor arrival executes a world/economy action. */
export function journeyWaypoints(
  world: WorldProgress,
  economy: Readonly<Economy>,
  patrol?: Readonly<NpcPatrolState>,
) {
  if (!journeyScene(world.zoneId)) return []
  return worldObjects(world, patrol).map((object) => {
    const actions = describeObject(world, object).actions
    let short = object.name,
      status =
        actions.map((a) => a.label).join(" · ") || "Đến gần để trò chuyện",
      state = actions.length ? "ready" : "waiting",
      locked = false
    if (object.kind === "room") {
      short = roomForEntrance(object.id)!.name
      status = `Đến cửa rồi tự vào ${short}`
      state = "ready"
    } else if (object.kind === "exit") {
      locked = !actions.some((a) => a.id === "travel")
      state = locked ? "locked" : "ready"
      const shortcut = !!object.requiresCompleted
      short = shortcut
        ? "Lối tắt"
        : object.id.endsWith(":west")
          ? "Lối về"
          : "Lối tiếp"
      status = locked
        ? shortcut
          ? "Mở sau khi kết thúc câu chuyện"
          : "Nhận nhiệm vụ Mở lại bếp ở Dì trước"
        : shortcut
          ? "Đường tắt đã mở · đến gần rồi chọn Đi qua"
          : "Đến gần rồi chọn Đi qua"
    } else if (object.kind === "chest") {
      state = economy.receipts.includes(CHEST_RECEIPT) ? "claimed" : "ready"
      short = state === "claimed" ? "Rương · đã nhận" : "Rương"
      status =
        state === "claimed"
          ? "Đã nhận rương · mỗi hành trình một lần"
          : "4 Gạo · 3 Rau · 2 Nước dùng · tương tác để nhận"
    } else if (object.kind === "hint") {
      state = world.hintRead
        ? "read"
        : actions.some((a) => a.id === "inspect")
          ? "ready"
          : "unavailable"
      short = "Dấu hơi"
      status =
        state === "read"
          ? "Đã ghi gợi ý · lối thoát → nồi → lửa"
          : state === "ready"
            ? "Đến gần rồi Ghi lại gợi ý"
            : "Nhận nhiệm vụ Mở lại bếp ở Dì trước"
    } else if (object.kind === "memory") {
      state = world.memories.includes(MEMORY_IDS[object.memory!])
        ? "read"
        : actions.length
          ? "ready"
          : "unavailable"
      short = ["Bữa sáng", "Sửa ghế", "Đem nước"][object.memory!]
      status =
        state === "read"
          ? "Đã ghi nhớ câu chuyện"
          : state === "ready"
            ? "Đến gần rồi Ghi nhớ câu chuyện"
            : "Nhận nhiệm vụ ở An Vá Đèn trước"
    } else if (object.kind === "mode") {
      short = object.id === "aw2-npc-ban-bai" ? "TCG" : "Auto Chess"
      status = "Ghé bàn luyện tập · không tốn đồ, không nhận thưởng"
    } else if (object.id === "aw2-npc-gac-bep") {
      short = "Dì Gác Bếp"
      if (!actions.length && world.questIndex >= 3)
        status = "Đến gần Dì để nấu/chia bữa"
    } else if (object.kind === "stock") {
      short = "Kiểm kho"
      status = "Đến gần để kiểm nguyên liệu và công thức"
      state = "ready"
    } else short = "An Vá Đèn"
    const spec = journeyScene(world.zoneId)!.props.find(
      (p) => p.entityId === object.id,
    )
    return {
      id: object.id,
      name: object.name,
      x: object.x,
      y: object.y,
      walkX:
        object.kind === "room"
          ? roomForEntrance(object.id)!.approach.x
          : object.kind === "stock"
            ? PANTRY_STOCK.approach.x
            : object.kind === "exit"
              ? exitApproach(object).x
              : object.x,
      walkY:
        object.kind === "room"
          ? roomForEntrance(object.id)!.approach.y
          : object.kind === "stock"
            ? PANTRY_STOCK.approach.y
            : object.kind === "exit"
              ? exitApproach(object).y
              : object.y + (spec?.asset === "threshold" ? 0 : 32),
      short,
      status,
      state,
      locked,
    }
  })
}
export function journeyProps(
  world: WorldProgress,
  economy: Readonly<Economy>,
  patrol?: Readonly<NpcPatrolState>,
) {
  const scene = journeyScene(world.zoneId),
    points = journeyWaypoints(world, economy, patrol)
  if (!scene) return []
  return scene.props
    .filter((spec) => points.some((p) => p.id === spec.entityId))
    .map((spec) => {
      const point = points.find((p) => p.id === spec.entityId)!
      return {
        ...spec,
        x: point.x,
        y: point.y,
        state: point.state,
        alpha: point.locked
          ? 0.45
          : point.state === "claimed" || point.state === "read"
            ? 0.85
            : 1,
        depth: spec.asset === "threshold" ? 1 : point.y,
      }
    })
}
export function journeyObstacleAlpha(
  scene: JourneyScene,
  actor: SceneBounds & { groundY: number },
) {
  const o = scene.obstacle,
    left = o.x - o.width * o.anchorX,
    top = o.y - o.height * o.anchorY
  return actor.groundY < o.sortY &&
    actor.x < left + o.width &&
    actor.x + actor.width > left &&
    actor.y < top + o.height &&
    actor.y + actor.height > top
    ? o.occludedAlpha
    : 1
}
