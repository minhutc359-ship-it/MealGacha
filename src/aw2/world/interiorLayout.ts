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

export const V7_ROOM_IDS = [
  TEA_ROOM_ID,
  "aw2-room-village-home",
  "aw2-room-village-guild",
] as const
export const ROOM_IDS = [
  ...V7_ROOM_IDS,
  "aw2-room-street-breakfast",
  "aw2-room-street-workshop",
  "aw2-room-street-play",
] as const
export type RoomId = typeof ROOM_IDS[number]
function additionalRoom<Id extends RoomId>(
  id: Id,
  name: string,
  x: number,
  guild: boolean,
) {
  const prefix = guild ? "guild" : "home"
  return {
    id,
    name,
    zoneId: TEA_ROOM.zoneId,
    entrance: {
      id: `aw2-object-${prefix}-door`,
      name: `Cửa ${name}`,
      x,
      y: 48,
      kind: "room" as const,
    },
    approach: { x, y: 80, entityId: `aw2-object-${prefix}-door` },
    spawn: { roomId: id, x: 64, y: 192, facing: "right" as const },
    walls: [
      { x: 176, y: 80, width: 64, height: 32 },
      { x: 400, y: 176, width: 64, height: 32 },
    ],
    objects: [
      {
        id: `aw2-object-${prefix}-exit`,
        name: `Ra cửa ${name}`,
        x: 24,
        y: 192,
        kind: "room-exit",
      },
      guild
        ? {
            id: "aw2-object-guild-tcg",
            name: "Bàn TCG",
            x: 208,
            y: 128,
            kind: "mode",
          }
        : {
            id: "aw2-object-home-party",
            name: "Bàn đội đồng hành",
            x: 208,
            y: 128,
            kind: "room-service",
            service: "party",
          },
      guild
        ? {
            id: "aw2-object-guild-chess",
            name: "Bàn Auto Chess",
            x: 432,
            y: 224,
            kind: "mode",
          }
        : {
            id: "aw2-object-home-journal",
            name: "Sổ hành trình",
            x: 432,
            y: 224,
            kind: "room-service",
            service: "journal",
          },
    ] as WorldObject[],
  }
}
export const HOME_ROOM = additionalRoom(
  V7_ROOM_IDS[1],
  "Nhà đồng hành",
  72,
  false,
)
export const GUILD_ROOM = additionalRoom(
  V7_ROOM_IDS[2],
  "Hội quán bàn chơi",
  528,
  true,
)
export const VILLAGE_ROOMS = [HOME_ROOM, TEA_ROOM, GUILD_ROOM] as const
function streetRoom<Id extends RoomId>(
  id: Id,
  name: string,
  x: number,
  residents: WorldObject[],
) {
  return {
    id,
    name,
    zoneId: "aw2-zone-lantern-street" as const,
    entrance: {
      id: `aw2-object-${id.slice(9)}-door`,
      name: `Cửa ${name}`,
      x,
      y: 48,
      kind: "room" as const,
    },
    approach: { x, y: 80, entityId: `aw2-object-${id.slice(9)}-door` },
    spawn: { roomId: id, x: 64, y: 192, facing: "right" as const },
    walls: [
      { x: 208, y: 80, width: 64, height: 32 },
      ...(residents.length > 1
        ? [{ x: 400, y: 176, width: 64, height: 32 }]
        : []),
    ],
    objects: [
      {
        id: `aw2-object-${id.slice(9)}-exit`,
        name: `Ra cửa ${name}`,
        x: 24,
        y: 192,
        kind: "room-exit" as const,
      },
      ...residents,
    ],
  }
}
export const BREAKFAST_ROOM = streetRoom(ROOM_IDS[3], "Quầy bữa sáng", 72, [
  {
    id: "aw2-npc-nguoi-ban",
    name: "Người Bán Bữa Sáng",
    x: 240,
    y: 128,
    kind: "memory",
    memory: 0,
  },
  {
    id: "aw2-object-breakfast-recipes",
    name: "Sổ công thức",
    x: 432,
    y: 224,
    kind: "room-service",
    service: "journal",
  },
])
export const WORKSHOP_ROOM = streetRoom(ROOM_IDS[4], "Xưởng sửa ghế", 300, [
  {
    id: "aw2-npc-sua-ghe",
    name: "Thợ Sửa Ghế",
    x: 240,
    y: 128,
    kind: "memory",
    memory: 1,
  },
])
export const STREET_PLAY_ROOM = streetRoom(ROOM_IDS[5], "Nhà bàn chơi", 528, [
  {
    id: "aw2-npc-ban-bai",
    name: "Chủ Bàn Bài · TCG",
    x: 240,
    y: 128,
    kind: "mode",
  },
  {
    id: "aw2-npc-ban-co",
    name: "Chủ Bàn Cờ · Auto Chess",
    x: 432,
    y: 224,
    kind: "mode",
  },
])
export const STREET_ROOMS = [
  BREAKFAST_ROOM,
  WORKSHOP_ROOM,
  STREET_PLAY_ROOM,
] as const
export const ROOMS = [...VILLAGE_ROOMS, ...STREET_ROOMS] as const
export const roomForEntrance = (id: string) =>
  ROOMS.find((room) => room.entrance.id === id)
export function roomById(id: string) {
  const room = ROOMS.find((room) => room.id === id)
  if (!room) throw Error("Không tìm thấy phòng.")
  return room
}
export function canStandInRoom(id: string, x: number, y: number) {
  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 16 &&
    x <= 624 &&
    y >= 16 &&
    y <= 368 &&
    !roomById(id).walls.some(
      (w) =>
        x + 10 > w.x &&
        x - 10 < w.x + w.width &&
        y + 10 > w.y &&
        y - 10 < w.y + w.height,
    )
  )
}
