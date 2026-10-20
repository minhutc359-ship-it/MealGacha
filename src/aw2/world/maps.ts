import { ZONE_IDS, type ZoneId } from "./ids"

export interface WorldObject {
  id: string
  name: string
  x: number
  y: number
  kind: "npc" | "table" | "memory" | "hint" | "puzzle" | "boss" | "chest" | "exit" | "mode"
  to?: ZoneId
  memory?: 0 | 1 | 2
  step?: 0 | 1 | 2
  spawnX?: number
}
export interface WorldZone {
  id: ZoneId
  name: string
  objects: WorldObject[]
  walls: { x: number; y: number; width: number; height: number }[]
}
const names = ["Làng Giao Ước", "Phố Đèn Lồng", "Sân Bếp Bỏ Quên", "Phòng Kho", "Phòng Lửa", "Phòng Bàn"]
const objects: WorldObject[][] = [
  [{ id: "aw2-npc-giu-cho", name: "Bà Giữ Chỗ", x: 160, y: 240, kind: "npc" },
    { id: "aw2-object-village-table", name: "Bàn chung · mảnh khăn", x: 160, y: 144, kind: "table" }],
  [{ id: "aw2-npc-va-den", name: "An Vá Đèn", x: 160, y: 112, kind: "npc" },
    ...["Người Bán Bữa Sáng", "Thợ Sửa Ghế", "Em Đem Nước"].map((name, memory) => ({ id: ["aw2-npc-nguoi-ban", "aw2-npc-sua-ghe", "aw2-npc-dem-nuoc"][memory], name, memory: memory as 0 | 1 | 2, x: 280 + memory * 112, y: 128, kind: "memory" as const })),
    { id: "aw2-npc-ban-bai", name: "Bàn TCG · chưa triển khai", x: 240, y: 272, kind: "mode" },
    { id: "aw2-npc-ban-co", name: "Bàn Auto Chess · chưa triển khai", x: 432, y: 272, kind: "mode" }],
  [{ id: "aw2-npc-gac-bep", name: "Dì Gác Bếp", x: 320, y: 128, kind: "npc" }],
  [{ id: "aw2-object-hearth-hint", name: "Bảng dấu hơi", x: 240, y: 128, kind: "hint" },
    { id: "aw2-chest-pantry", name: "Rương · chờ economy", x: 432, y: 272, kind: "chest" }],
  ["Mở lối thoát", "Đặt nồi", "Nhóm lửa"].map((name, step) => ({ id: `aw2-object-steam-${step}`, name, step: step as 0 | 1 | 2, x: 208 + step * 112, y: 144, kind: "puzzle" as const })),
  [{ id: "aw2-enemy-forgotten-host", name: "Người Giữ Bàn Quên · chờ combat", x: 320, y: 128, kind: "boss" }],
]

export const ZONES: WorldZone[] = ZONE_IDS.map((id, index) => ({
  id, name: names[index],
  walls: [{ x: 288, y: 304, width: 64, height: 48 }],
  objects: [...objects[index],
    ...(index > 0 ? [{ id: `${id}:exit:west`, name: `Về ${names[index - 1]}`, x: 24, y: 192, kind: "exit" as const, to: ZONE_IDS[index - 1], spawnX: 576 }] : []),
    ...(index < 5 ? [{ id: `${id}:exit:east`, name: `Đến ${names[index + 1]}`, x: 616, y: 192, kind: "exit" as const, to: ZONE_IDS[index + 1], spawnX: 64 }] : []),
  ],
}))
export const zoneById = (id: ZoneId) => ZONES.find(zone => zone.id === id)!
export function canStand(id: ZoneId, x: number, y: number): boolean {
  return Number.isFinite(x) && Number.isFinite(y) && x >= 16 && x <= 624 && y >= 16 && y <= 368 &&
    !zoneById(id).walls.some(wall => x + 10 > wall.x && x - 10 < wall.x + wall.width && y + 10 > wall.y && y - 10 < wall.y + wall.height)
}
