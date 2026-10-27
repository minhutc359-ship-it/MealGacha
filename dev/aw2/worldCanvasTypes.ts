import type { Ref } from "react"
import type { WorldProgress } from "../../src/aw2/world/model"
import type { Waypoint } from "../../src/aw2/world/navigation"
import type { Economy } from "../../src/aw2/economy/model"
import type { NpcPatrolState } from "../../src/aw2/world/npcPatrol"
import type { SceneReadiness } from "../../src/aw2/assets/scenePreflight"
import {
  sceneId as worldSceneId,
  type SceneId,
} from "../../src/aw2/world/scene"

export interface WorldMapReadiness extends SceneReadiness {
  sceneId: SceneId
  zoneId: WorldProgress["zoneId"]
  leaderId: string
}
export function mapReadyFor(
  state: WorldMapReadiness | null,
  world: WorldProgress,
) {
  return (
    !!state?.ready &&
    state.zoneId === world.zoneId &&
    state.sceneId === worldSceneId(world) &&
    state.leaderId === (world.partyIds[0] ?? "aw2-than")
  )
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
