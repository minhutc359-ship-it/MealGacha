import type { WorldObject, WorldWall } from "./maps"

export const TEA_ROOM_ID = "aw2-room-village-tea" as const
export const TEA_DOOR_ID = "aw2-object-village-tea-door"
export const TEA_EXIT_ID = "aw2-object-tea-exit"
export const TEA_PARTY_ID = "aw2-object-tea-party-desk"
export const TEA_JOURNAL_ID = "aw2-object-tea-journal-desk"
export const TEA_ROOM = {
  id: TEA_ROOM_ID,
  name: "Tiệm trà · Làng Giao Ước",
  zoneId: "aw2-zone-covenant-village" as const,
  entrance: {
    id: TEA_DOOR_ID,
    name: "Cửa tiệm trà",
    x: 300,
    y: 48,
    kind: "room",
  } satisfies WorldObject,
  approach: { x: 300, y: 80, entityId: TEA_DOOR_ID },
  spawn: { roomId: TEA_ROOM_ID, x: 64, y: 192, facing: "right" as const },
  walls: [
    { x: 208, y: 80, width: 64, height: 32 },
    { x: 400, y: 80, width: 64, height: 32 },
  ] satisfies WorldWall[],
  objects: [
    {
      id: TEA_EXIT_ID,
      name: "Ra hiên tiệm trà",
      x: 24,
      y: 192,
      kind: "room-exit",
    },
    {
      id: TEA_PARTY_ID,
      name: "Bàn đội đồng hành",
      x: 240,
      y: 128,
      kind: "room-service",
    },
    {
      id: TEA_JOURNAL_ID,
      name: "Góc nhật ký và công thức",
      x: 432,
      y: 128,
      kind: "room-service",
    },
  ] satisfies WorldObject[],
}
export function canStandInTeaRoom(x: number, y: number) {
  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 16 &&
    x <= 624 &&
    y >= 16 &&
    y <= 368 &&
    !TEA_ROOM.walls.some(
      (w) =>
        x + 10 > w.x &&
        x - 10 < w.x + w.width &&
        y + 10 > w.y &&
        y - 10 < w.y + w.height,
    )
  )
}
