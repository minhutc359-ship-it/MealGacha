import { ADVENTURE_AREAS, type AdventureAreaId } from "./adventureRegions"
import type { CharacterId } from "./characters"

export type AdventureMapId = string
export type HouseKind = "clinic" | "shop" | "home"
export interface MapNpc {
  id: string
  character: CharacterId
  name: string
  x: number
  y: number
  role: "guide" | "trainer" | "resident" | "healer" | "merchant" | "quest" | "keeper"
  text: string
  roster?: { cardId: string; level: number }[]
}
export interface MapExit {
  x: number
  y: number
  to: string
  toX: number
  toY: number
  requires?: string
}
export interface MapHouse {
  id: string
  kind: HouseKind
  name: string
  x: number
  y: number
  width: number
  height: number
}
export interface AdventureMap {
  id: AdventureMapId
  areaId: AdventureAreaId
  name: string
  interior: boolean
  grid: string[]
  spawn: { x: number; y: number }
  npcs: MapNpc[]
  exits: MapExit[]
  houses: MapHouse[]
  finds: { id: string; x: number; y: number; seals: number; coins: number }[]
  signs: { x: number; y: number; text: string }[]
}
const HOUSE_NAMES: Record<HouseKind, string> = {
  clinic: "Bếp Nghỉ",
  shop: "Tiệm Hương",
  home: "Nhà Ký Ức",
}
export const ADVENTURE_MAPS: AdventureMap[] = ADVENTURE_AREAS.flatMap(
  (area, index) => {
    const tiles: string[][] = Array.from({ length: 18 }, (_, y) =>
      Array.from({ length: 24 }, (_, x) =>
        x === 0 || y === 0 || x === 23 || y === 17 ? "t" : ".",
      ),
    )
    for (let y = 8; y <= 12; y++) for (let x = 2; x <= 8; x++) tiles[y][x] = "g"
    for (let y = 9; y <= 13; y++)
      for (let x = 16; x <= 22; x++) tiles[y][x] = "g"
    for (let x = 1; x <= 22; x++) tiles[14][x] = "p"
    for (const x of [4, 11, 18]) for (let y = 6; y <= 14; y++) tiles[y][x] = "p"
    for (let x = 2; x < 22; x++) tiles[7][x] = "p"
    if (index === 1 || index === 3)
      for (let y = 15; y <= 16; y++)
        for (let x = 12; x <= 22; x++) tiles[y][x] = "w"
    if (index === 2)
      for (const [x, y] of [
        [9, 9],
        [9, 10],
        [12, 11],
        [13, 11],
        [14, 11],
      ])
        tiles[y][x] = "t"
    const houses: MapHouse[] = (["clinic", "shop", "home"] as const).map(
      (kind, i) => ({
        id: `${area.id}:${kind}`,
        kind,
        name: HOUSE_NAMES[kind],
        x: 3 + i * 7,
        y: 3,
        width: 4,
        height: 3,
      }),
    )
    const exits: MapExit[] = []
    for (const house of houses) {
      for (let y = house.y; y < house.y + house.height; y++)
        for (let x = house.x; x < house.x + house.width; x++) tiles[y][x] = "#"
      tiles[6][house.x + 1] = "d"
      exits.push({ x: house.x + 1, y: 6, to: house.id, toX: 5, toY: 7 })
    }
    if (index > 0) {
      tiles[14][1] = "e"
      exits.push({
        x: 1,
        y: 14,
        to: ADVENTURE_AREAS[index - 1].id,
        toX: 21,
        toY: 14,
      })
    }
    if (index < 4) {
      tiles[14][22] = "e"
      exits.push({
        x: 22,
        y: 14,
        to: ADVENTURE_AREAS[index + 1].id,
        toX: 2,
        toY: 14,
        requires: area.keeper.badge,
      })
    }
    const npcs: MapNpc[] = [
      {
        id: `guide:${area.id}`,
        character: area.npc.id,
        name:
          area.npc.id === "bach"
            ? "Bách"
            : area.npc.id === "hai"
              ? "Hải"
              : area.npc.id === "moc"
                ? "Mộc"
                : area.npc.id === "nhien"
                  ? "Nhiên"
                  : "Liên",
        x: 3,
        y: 13,
        role: "guide",
        text: area.npc.before,
      },
      {
        id: `trainer:${area.id}`,
        character: "la",
        name: `Lả · thử thách ${index + 1}`,
        x: 8,
        y: 12,
        role: "trainer",
        text: "Một đội mạnh biết đổi Vị Linh đúng lúc. Cùng thử hai lượt hương nhé!",
        roster: area.encounters
          .slice(0, 2)
          .map((cardId, i) => ({ cardId, level: 4 + index * 3 + i })),
      },
      {
        id: `resident:${area.id}`,
        character: "child",
        name: "Em bé cầm đèn",
        x: 13,
        y: 8,
        role: "resident",
        text: "Bạn có thấy Vị Linh đi theo mình không? Đứng cạnh nó rồi bấm E để nghe. Bấm Shift khi đi để chạy nhanh.",
      },
      {
        id: `keeper:${area.id}`,
        character: area.npc.id,
        name: area.keeper.title,
        x: 20,
        y: 7,
        role: "keeper",
        text: `Tôi giữ ${area.keeper.badgeName}. Hãy chứng minh đội của bạn biết nương tựa nhau.`,
        roster: [
          { cardId: area.encounters[1], level: area.keeper.level - 2 },
          { cardId: area.keeper.cardId, level: area.keeper.level },
        ],
      },
    ]
    for (const npc of npcs) tiles[npc.y][npc.x] = "n"
    tiles[12][18] = "i"
    tiles[8][11] = "s"
    const outdoor: AdventureMap = {
      id: area.id,
      areaId: area.id,
      name: area.name,
      interior: false,
      grid: tiles.map((row) => row.join("")),
      spawn: { x: 2, y: 14 },
      npcs,
      exits,
      houses,
      finds: [
        {
          id: area.finds[0].id,
          x: 18,
          y: 12,
          seals: area.finds[0].seals,
          coins: 35 + index * 15,
        },
      ],
      signs: [
        {
          x: 11,
          y: 8,
          text: `${area.name} · Bếp Nghỉ bên trái, Tiệm Hương giữa phố, Nhà Ký Ức bên phải. Bãi hương ở phía nam. Đấu Lả để nhận xu; Người Giữ Ấn mở đường sang vùng tiếp theo.`,
        },
      ],
    }
    const interiors: AdventureMap[] = houses.map((house) => {
      const grid = [
        "############",
        "#..........#",
        "#.ff....ff.#",
        "#....n.....#",
        "#.ccc.ccc..#",
        "#.......r..#",
        "#..........#",
        "#..........#",
        "#####e######",
        "############",
      ]
      const role =
        house.kind === "clinic"
          ? "healer"
          : house.kind === "shop"
            ? "merchant"
            : "quest"
      const character =
        house.kind === "clinic"
          ? "grandmother"
          : house.kind === "shop"
            ? "merchant"
            : area.npc.id
      const npc: MapNpc = {
        id: `${role}:${area.id}`,
        character,
        name:
          house.kind === "clinic"
            ? "Bà giữ bếp"
            : house.kind === "shop"
              ? "Chủ Tiệm Hương"
              : "Người giữ ký ức",
        x: 5,
        y: 3,
        role,
        text:
          house.kind === "clinic"
            ? "Nghỉ một chút nhé. Bà sẽ hồi sinh lực, PP và gỡ trạng thái cho cả đội."
            : house.kind === "shop"
              ? "Hương Ấn để kết bạn; Canh Ấm hồi HP; Lá Tỉnh đánh thức Vị Linh kiệt sức."
              : `Hãy gặp ${index + 3} loài Vị Linh, rồi kể lại cho tôi nghe. Một món quà đang chờ bạn.`,
      }
      return {
        id: house.id,
        areaId: area.id,
        name: `${house.name} · ${area.name}`,
        interior: true,
        grid,
        spawn: { x: 5, y: 7 },
        npcs: [npc],
        exits: [{ x: 5, y: 8, to: area.id, toX: house.x + 1, toY: 7 }],
        houses: [],
        finds: [],
        signs: [],
      }
    })
    return [outdoor, ...interiors]
  },
)
export const ADVENTURE_MAP_BY_ID = Object.fromEntries(
  ADVENTURE_MAPS.map((map) => [map.id, map]),
) as Record<string, AdventureMap>
export const WALKABLE_TILES = new Set([".", "p", "g", "d", "e", "i", "r"])
export function canWalk(map: AdventureMap, x: number, y: number) {
  return WALKABLE_TILES.has(map.grid[y]?.[x])
}
/** BFS stops at the nearest reachable tile next to an interactable object. */
export function pathTo(
  map: AdventureMap,
  from: { x: number; y: number },
  target: { x: number; y: number },
) {
  const queue = [{ ...from, path: [] as { x: number; y: number }[] }],
    visited = new Set([`${from.x},${from.y}`])
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i]
    if (
      canWalk(map, target.x, target.y)
        ? node.x === target.x && node.y === target.y
        : Math.abs(node.x - target.x) + Math.abs(node.y - target.y) === 1
    )
      return node.path
    for (const [dx, dy] of [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ]) {
      const x = node.x + dx,
        y = node.y + dy,
        key = `${x},${y}`
      if (!canWalk(map, x, y) || visited.has(key)) continue
      visited.add(key)
      queue.push({ x, y, path: [...node.path, { x, y }] })
    }
  }
  return []
}
