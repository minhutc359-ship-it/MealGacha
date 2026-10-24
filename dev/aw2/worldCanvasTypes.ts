import type { Ref } from "react"
import type { WorldProgress } from "../../src/aw2/world/model"
import type { Waypoint } from "../../src/aw2/world/navigation"
import type { Economy } from "../../src/aw2/economy/model"

export interface WorldCanvasProps {
  world: WorldProgress
  economy: Readonly<Economy>
  onNavigate: (point: Waypoint) => void
  paused: boolean
  focusRef?: Ref<HTMLDivElement>
}
