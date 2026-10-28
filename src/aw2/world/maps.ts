import { KITCHEN_BOSS_ID, TABLE_NOTE_ID, ZONE_IDS, type ZoneId } from "./ids"
import { PANTRY_STOCK } from "./pantryLayout"
import { ROOMS } from "./interiorLayout"

export interface WorldObject {
  id: string
  name: string
  x: number
  y: number
  kind: "npc" | "table" | "memory" | "hint" | "puzzle" | "boss" | "note" | "chest" | "exit" | "mode" | "stock" | "room" | "room-exit" | "room-service" | "field"
  service?: "party" | "journal"
  to?: ZoneId
  memory?: 0 | 1 | 2
  step?: 0 | 1 | 2
  spawnX?: number
  spawnY?: number
  approachX?: number
  approachY?: number
  activation?: "interact" | "step"
  field?: "well" | "repair-crate" | "wash-basin"
  requiresCompleted?: boolean
}
export interface WorldWall {
  x: number
  y: number
  width: number
  height: number
}
export interface WorldZone {
  id: ZoneId
  name: string
  objects: WorldObject[]
  walls: WorldWall[]
}
const names = [
  "Làng Giao Ước",
  "Phố Đèn Lồng",
  "Sân Bếp Bỏ Quên",
  "Phòng Kho",
  "Phòng Lửa",
  "Phòng Bàn",
]
const objects: WorldObject[][] = [
  [
    ...ROOMS.filter((room) => room.zoneId === ZONE_IDS[0]).map((room) => ({
      ...room.entrance,
    })),
    { id: "aw2-npc-giu-cho", name: "Bà Giữ Chỗ", x: 160, y: 240, kind: "npc" },
    {
      id: "aw2-object-village-table",
      name: "Bàn chung · mảnh khăn",
      x: 160,
      y: 144,
      kind: "table",
    },
    {
      id: "aw2-object-village-well",
      name: "Giếng sân chung",
      x: 272,
      y: 328,
      kind: "field",
      field: "well",
    },
  ],
  [
    { id: "aw2-npc-va-den", name: "An Vá Đèn", x: 160, y: 112, kind: "npc" },
    ...ROOMS.filter((room) => room.zoneId === ZONE_IDS[1]).map((room) => ({
      ...room.entrance,
    })),
    {
      id: "aw2-npc-dem-nuoc",
      name: "Em Đem Nước",
      memory: 2,
      x: 504,
      y: 128,
      kind: "memory",
    },
    {
      id: "aw2-object-street-repair-crate",
      name: "Thùng đồ sửa đèn",
      x: 272,
      y: 328,
      kind: "field",
      field: "repair-crate",
    },
  ],
  [
    { id: "aw2-npc-gac-bep", name: "Dì Gác Bếp", x: 320, y: 128, kind: "npc" },
    {
      id: "aw2-shortcut-yard-table",
      name: "Phòng Bàn",
      x: 480,
      y: 16,
      kind: "exit",
      to: ZONE_IDS[5],
      spawnX: 96,
      spawnY: 192,
      approachX: 480,
      approachY: 48,
      requiresCompleted: true,
    },
    {
      id: "aw2-object-yard-wash-basin",
      name: "Bồn rửa cạnh bếp",
      x: 272,
      y: 328,
      kind: "field",
      field: "wash-basin",
    },
  ],
  [
    {
      id: PANTRY_STOCK.id,
      name: PANTRY_STOCK.name,
      kind: PANTRY_STOCK.kind,
      x: PANTRY_STOCK.x,
      y: PANTRY_STOCK.y,
    },
    {
      id: "aw2-object-hearth-hint",
      name: "Bảng dấu hơi",
      x: 240,
      y: 128,
      kind: "hint",
    },
    {
      id: "aw2-chest-pantry",
      name: "Rương nguyên liệu",
      x: 432,
      y: 272,
      kind: "chest",
    },
  ],
  ["Mở lối thoát", "Đặt nồi", "Nhóm lửa"].map((name, step) => ({
    id: `aw2-object-steam-${step}`,
    name,
    step: step as 0 | 1 | 2,
    x: 208 + step * 112,
    y: 144,
    kind: "puzzle" as const,
  })),
  [
    {
      id: KITCHEN_BOSS_ID,
      name: "Người Giữ Bàn Quên",
      x: 320,
      y: 128,
      kind: "boss",
    },
    {
      id: TABLE_NOTE_ID,
      name: "Ghi chép bên chén",
      x: 448,
      y: 144,
      kind: "note",
    },
    {
      id: "aw2-shortcut-table-yard",
      name: "Lối tắt về Sân",
      x: 520,
      y: 240,
      kind: "exit",
      to: ZONE_IDS[2],
      spawnX: 480,
      spawnY: 48,
      requiresCompleted: true,
    },
  ],
]

export const ZONES: WorldZone[] = ZONE_IDS.map((id, index) => ({
  id,
  name: names[index],
  walls: [{ x: 288, y: 304, width: 64, height: 48 }],
  objects: [
    ...objects[index],
    ...(index > 0
      ? [
          {
            id: `${id}:exit:west`,
            name: `Về ${names[index - 1]}`,
            x: 24,
            y: 192,
            kind: "exit" as const,
            to: ZONE_IDS[index - 1],
            spawnX: index === 3 ? 208 : 576,
            spawnY: index === 3 ? 48 : 192,
            activation: (index === 3
              ? "interact"
              : "step") as Exclude<WorldObject["activation"], undefined>,
          },
        ]
      : []),
    ...(index < 5
      ? [
          {
            id: `${id}:exit:east`,
            name: index === 2 ? "Kho nguyên liệu" : `Đến ${names[index + 1]}`,
            x: index === 2 ? 208 : 616,
            y: index === 2 ? 16 : 192,
            kind: "exit" as const,
            to: ZONE_IDS[index + 1],
            spawnX: 64,
            spawnY: 192,
            activation: (index === 2
              ? "interact"
              : "step") as Exclude<WorldObject["activation"], undefined>,
            ...(index === 2 ? { approachX: 208, approachY: 48 } : {}),
          },
        ]
      : []),
  ],
}))
export const zoneById = (id: ZoneId) => ZONES.find((zone) => zone.id === id)!
/** One shared local destination for guides, clicks and keyboard walking. */
export function exitApproach(object: Readonly<WorldObject>) {
  return {
    x: object.approachX ?? object.x + (object.x > 320 ? -24 : 24),
    y: object.approachY ?? object.y,
    entityId: object.id,
  }
}
export function canStand(id: ZoneId, x: number, y: number): boolean {
  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 16 &&
    x <= 624 &&
    y >= 16 &&
    y <= 368 &&
    !zoneById(id).walls.some(
      (wall) =>
        x + 10 > wall.x &&
        x - 10 < wall.x + wall.width &&
        y + 10 > wall.y &&
        y - 10 < wall.y + wall.height,
    )
  )
}
