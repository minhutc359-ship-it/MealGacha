import type { AdventureAreaId } from "./adventureRegions"
export const ADVENTURE_ART_480 = {
  props: "/dev/archive/legacy-adventure-v490/assets/world-props-v480.webp",
  terrain: "/dev/archive/legacy-adventure-v490/assets/terrain-v480.webp",
} as const
/** Integer boundaries prevent atlas drift when generated dimensions are not divisible by four. */
export function atlasCellRect(index: number, width: number, height: number) {
  const col = index % 4, row = Math.floor(index / 4)
  const x = Math.round(col * width / 4), y = Math.round(row * height / 4)
  return { x, y, width: Math.round((col + 1) * width / 4) - x, height: Math.round((row + 1) * height / 4) - y }
}
export function propCellFor(id: string, area: AdventureAreaId = "lantern-quarter") {
  if (id === "tree") return area === "moon-table" ? 2 : area === "tide-pier" || area === "rain-harbor" ? 3 : area === "herb-garden" ? 1 : 0
  const cells: Record<string, number> = { "house-clinic":4,"house-shop":5,"house-home":6,stall:7,sign:8,storage:9,gift:9,fountain:10,gate:11,planter:12,bench:13,lantern:14,counter:15 }
  return cells[id]
}
export function terrainCellFor(cell: string, interior: boolean, area: AdventureAreaId) {
  if (interior) return cell === "#" ? 6 : cell === "c" || cell === "f" ? 15 : area === "moon-table" ? 11 : area === "herb-garden" ? 5 : 7
  if (cell === "w") return 4
  if (cell === "g") return area === "herb-garden" ? 13 : 12
  if ("pdes".includes(cell)) return area === "lantern-quarter" ? 3 : area === "herb-garden" ? 2 : 14
  return area === "moon-table" ? 10 : area === "tide-pier" ? 9 : area === "herb-garden" ? 8 : 0
}
