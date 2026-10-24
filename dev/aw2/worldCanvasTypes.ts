import type { Ref } from "react"
import type { WorldProgress } from "../../src/aw2/world/model"
import type { Waypoint } from "../../src/aw2/world/navigation"

export interface WorldCanvasProps {
  world: WorldProgress
  onNavigate: (point: Waypoint) => void
  paused: boolean
  focusRef?: Ref<HTMLDivElement>
}
