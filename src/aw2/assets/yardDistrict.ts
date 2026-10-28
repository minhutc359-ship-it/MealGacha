import { ZONE_IDS } from "../world/ids"
import { exitApproach, zoneById } from "../world/maps"
import type { Waypoint } from "../world/navigation"
import { VILLAGE_DISTRICT } from "./villageDistrict"

const yard = zoneById(ZONE_IDS[2])
const portal = (id: string) => yard.objects.find((object) => object.id === id)!

/** The two visible yard facades are both backed by real, authored portals. */
export const YARD_PORTALS = [
  {
    portalId: `${ZONE_IDS[2]}:exit:east`,
    frame: "grocery" as const,
  },
  {
    portalId: "aw2-shortcut-yard-table",
    frame: "home" as const,
  },
].map((binding) => ({ ...binding, object: portal(binding.portalId) }))

export const YARD_DISTRICT = {
  ...VILLAGE_DISTRICT,
  paths: [
    { x: 16, y: 160, width: 608, height: 64 },
    { x: 176, y: 48, width: 336, height: 64 },
    ...YARD_PORTALS.map(({ object }) => ({
      x: exitApproach(object).x - 24,
      y: 4,
      width: 48,
      height: 188,
    })),
    { x: 288, y: 80, width: 64, height: 144 },
    { x: 264, y: 224, width: 112, height: 80 },
    { x: 232, y: 352, width: 176, height: 24 },
  ],
} as const

/** A roof click resolves to the portal approach; traversal still requires E. */
export function yardFacadeTarget(point: Waypoint): Waypoint {
  const binding = YARD_PORTALS.find(
    ({ object }) =>
      Math.abs(point.x - object.x) <= 92 && point.y >= -172 && point.y <= 16,
  )
  return binding ? exitApproach(binding.object) : point
}
