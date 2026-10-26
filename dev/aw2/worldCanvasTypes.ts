import type { Ref } from "react"
import type { WorldProgress } from "../../src/aw2/world/model"
import type { Waypoint } from "../../src/aw2/world/navigation"
import type { Economy } from "../../src/aw2/economy/model"
import type { NpcPatrolState } from "../../src/aw2/world/npcPatrol"

export interface WorldMapReadiness {
  zoneId: WorldProgress["zoneId"]
  leaderId: string
  ready: boolean
}

export interface WorldCanvasProps {
  world: WorldProgress
  patrol?: Readonly<NpcPatrolState>
  economy: Readonly<Economy>
  onNavigate: (point: Waypoint) => void
  paused: boolean
  focusRef?: Ref<HTMLDivElement>
  onReadyChange?: (state: WorldMapReadiness) => void
}
