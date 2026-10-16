import type { AdventureHomeTab } from "./adventureV560"

export type VillagePoint = {
  x: number
  y: number
}
export type VillageFacing = "up" | "down" | "left" | "right"
export const VILLAGE_START = { x: 50, y: 84 }
export const VILLAGE_NPCS: {
  id: Exclude<AdventureHomeTab, "village">
  name: string
  job: string
  art: "la" | "merchant" | "grandmother" | "bach"
  x: number
  y: number
  stop: VillagePoint
  greeting: string
  action: string
}[] = [
  {
    id: "campaign",
    name: "Lả",
    job: "Người dẫn đường",
    art: "la",
    x: 30,
    y: 39,
    stop: { x: 35, y: 43 },
    greeting:
      "Cổng Ký Ức vừa sáng lên. Hai bạn nhỏ đã sẵn sàng đi cùng cậu chưa?",
    action: "Mở Cổng Ký Ức",
  },
  {
    id: "dungeon",
    name: "Chú Tâm",
    job: "Người giữ kho",
    art: "merchant",
    x: 70,
    y: 39,
    stop: { x: 65, y: 43 },
    greeting:
      "Trong Kho Sương có sách, quặng và những nồi canh ấm. Chuẩn bị đội trước khi xuống nhé!",
    action: "Vào Kho Sương",
  },
  {
    id: "heroes",
    name: "Bà Sen",
    job: "Người giữ giao ước",
    art: "grandmother",
    x: 29,
    y: 72,
    stop: { x: 35, y: 72 },
    greeting:
      "Lửa Nhỏ muốn được chơi cùng Lam Lam đấy. Đừng chỉ lo đánh trận, nhớ chăm các bạn nữa nhé.",
    action: "Vào Nhà Giao Ước",
  },
  {
    id: "help",
    name: "Bách",
    job: "Người kể chuyện",
    art: "bach",
    x: 71,
    y: 72,
    stop: { x: 65, y: 72 },
    greeting:
      "Một đội mạnh cần hiểu nhịp của nhau. Ta sẽ chỉ cậu cách nối kỹ năng và che chắn đúng lúc.",
    action: "Ghé Đình Đèn",
  },
]
const nodes: VillagePoint[] = [
  { x: 50, y: 86 },
  { x: 50, y: 72 },
  { x: 50, y: 45 },
  { x: 50, y: 24 },
  { x: 35, y: 43 },
  { x: 65, y: 43 },
  { x: 35, y: 72 },
  { x: 65, y: 72 },
]
const edges = [
  [0, 1],
  [1, 2],
  [2, 3],
  [2, 4],
  [2, 5],
  [1, 6],
  [1, 7],
]
const distance = (a: VillagePoint, b: VillagePoint) =>
  Math.hypot((a.x - b.x) * 1.5, a.y - b.y)
export function villageFacing(a: VillagePoint, b: VillagePoint): VillageFacing {
  return Math.abs(b.x - a.x) * 1.5 > Math.abs(b.y - a.y)
    ? b.x < a.x
      ? "left"
      : "right"
    : b.y < a.y
      ? "up"
      : "down"
}
function roadPoint(p: VillagePoint) {
  return edges
    .map(([a, b], edge) => {
      const u = nodes[a],
        v = nodes[b],
        dx = (v.x - u.x) * 1.5,
        dy = v.y - u.y
      const t = Math.max(
        0,
        Math.min(
          1,
          ((p.x - u.x) * 1.5 * dx + (p.y - u.y) * dy) / (dx * dx + dy * dy),
        ),
      )
      const point = { x: u.x + (v.x - u.x) * t, y: u.y + (v.y - u.y) * t }
      return { point, edge, distance: distance(p, point) }
    })
    .sort((a, b) => a.distance - b.distance)[0]
}
/** Project clicks onto paths, then solve the small walking graph. */
export function villagePath(
  from: VillagePoint,
  requested: VillagePoint,
): VillagePoint[] {
  const start = roadPoint(from),
    goal = roadPoint(requested),
    points = [...nodes, start.point, goal.point]
  const links = edges.map((e) => [...e])
  const si = nodes.length,
    gi = si + 1
  for (const [index, projected] of [
    [si, start],
    [gi, goal],
  ] as const)
    for (const endpoint of edges[projected.edge]) links.push([index, endpoint])
  if (start.edge === goal.edge) links.push([si, gi])
  const costs = points.map(() => Infinity),
    previous = points.map(() => -1),
    todo = new Set(points.map((_, i) => i))
  costs[si] = 0
  while (todo.size) {
    const current = [...todo].sort((a, b) => costs[a] - costs[b])[0]
    todo.delete(current)
    if (current === gi) break
    for (const [a, b] of links) {
      const next = a === current ? b : b === current ? a : -1
      if (next < 0 || !todo.has(next)) continue
      const cost = costs[current] + distance(points[current], points[next])
      if (cost < costs[next]) {
        costs[next] = cost
        previous[next] = current
      }
    }
  }
  const path: VillagePoint[] = []
  for (let i = gi; i >= 0; i = previous[i]) {
    path.unshift(points[i])
    if (i === si) break
  }
  return [from, ...path].filter(
    (p, i, all) => i === 0 || distance(p, all[i - 1]) > 0.05,
  )
}
export function villageTrip(path: VillagePoint[], quiet = false) {
  const lengths = path.slice(1).map((p, i) => distance(path[i], p)),
    total = lengths.reduce((a, b) => a + b, 0)
  let sum = 0
  const offsets = [0, ...lengths.map((n) => (sum += n) / Math.max(0.01, total))]
  return { duration: quiet ? 120 : Math.max(180, total * 38), offsets }
}
export function villagePointAt(
  path: VillagePoint[],
  offsets: number[],
  progress: number,
) {
  const t = Math.max(0, Math.min(1, progress))
  const i = offsets.findIndex((v, i) => i > 0 && v >= t)
  if (i < 1) return path.at(-1)!
  const mix =
    (t - offsets[i - 1]) / Math.max(0.0001, offsets[i] - offsets[i - 1])
  return {
    x: path[i - 1].x + (path[i].x - path[i - 1].x) * mix,
    y: path[i - 1].y + (path[i].y - path[i - 1].y) * mix,
  }
}
