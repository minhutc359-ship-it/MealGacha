import scene from "./kitchen-table.environment-v1.json"
import { KITCHEN_BOSS_ID, TABLE_NOTE_ID, ZONE_IDS } from "../world/ids"
import { zoneById } from "../world/maps"
import type { WorldProgress } from "../world/model"
import { FORGOTTEN_HOST_WORLD } from "./bossWorld"

// Preserve the original006B asset package; current boss metadata follows its own world registry.
export const TABLE_ROOM_SCENE = {
  ...scene,
  bossMarker: {
    entityId: FORGOTTEN_HOST_WORLD.entityId,
    manifest: "forgotten-host.world-v1",
    frame: FORGOTTEN_HOST_WORLD.directions.down,
    height: FORGOTTEN_HOST_WORLD.display.maxSilhouetteHeight,
    status: FORGOTTEN_HOST_WORLD.status,
  },
}
export function tableRoomWaypoints(progress: WorldProgress) {
  if (progress.zoneId !== ZONE_IDS[5]) return []
  const zone = zoneById(progress.zoneId)
  const completed = progress.questIndex === 4
  const descriptions = [
    {
      id: KITCHEN_BOSS_ID,
      short: completed
        ? "Đấu lại"
        : progress.bossDefeated
          ? "Đã vượt"
          : "Thử thách",
      status: completed
        ? "Đấu lại không nhận thưởng"
        : progress.bossDefeated
          ? "Đã vượt thử thách"
          : progress.questIndex === 3 && progress.accepted
            ? "Có thể bắt đầu thử thách"
            : "Nhận nhiệm vụ Thêm một chén trước",
      locked: false,
    },
    {
      id: TABLE_NOTE_ID,
      short: progress.tableNoteRead ? "Đã đọc" : "Ghi chép",
      status: progress.tableNoteRead
        ? "Đã đọc ghi chép"
        : progress.bossDefeated
          ? "Có thể đọc sau khi đến gần"
          : "Vượt thử thách để đọc",
      locked: false,
    },
    {
      id: `${ZONE_IDS[5]}:exit:west`,
      short: "Phòng Lửa",
      status: "Đường trở về luôn mở",
      locked: false,
    },
    {
      id: "aw2-shortcut-table-yard",
      short: completed ? "Về Sân" : "Lối tắt khóa",
      status: completed ? "Lối tắt về Sân đã mở" : "Hoàn tất câu chuyện để mở",
      locked: !completed,
    },
  ]
  return descriptions.map((description) => {
    const object = zone.objects.find((object) => object.id === description.id)!
    return { ...description, name: object.name, x: object.x, y: object.y }
  })
}

export interface SceneBounds {
  x: number
  y: number
  width: number
  height: number
}
/** Render visibility only; never modifies collision, position or interaction gates. */
export function tableRoomPropAlpha(
  actors: readonly (SceneBounds & { groundY: number })[],
): number {
  const prop = scene.prop
  const left = prop.x - prop.width * prop.anchorX
  const top = prop.y - prop.height * prop.anchorY
  return actors.some(
    (actor) =>
      actor.groundY < prop.sortY &&
      actor.x < left + prop.width &&
      actor.x + actor.width > left &&
      actor.y < top + prop.height &&
      actor.y + actor.height > top,
  )
    ? prop.occludedAlpha
    : 1
}
