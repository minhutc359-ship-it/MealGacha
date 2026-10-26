import { useState, type RefObject } from "react"
import type { WorldProgress } from "../../src/aw2/world/model"
import type { ZoneId } from "../../src/aw2/world/ids"
import type { Waypoint } from "../../src/aw2/world/navigation"
import { journeyApproach, journeyOverview } from "../../src/aw2/world/registry"
import { journeyDirections } from "../../src/aw2/world/journey"
import { zoneById } from "../../src/aw2/world/maps"
import { PageControls, PagedCopy } from "./GamePanels"
import { pageSlice } from "../../src/aw2/world/questJournal"

export function JourneyOverview({
  world,
  canWalk,
  memory,
  onWalk,
}: {
  world: WorldProgress
  canWalk: boolean
  memory: RefObject<ZoneId>
  onWalk: (point: Waypoint) => void
}) {
  const [selected, setSelected] = useState(memory.current)
  const [tab, setTab] = useState("route")
  const [connection, setConnection] = useState(0)
  const maps = journeyOverview(world),
    map = maps.find((m) => m.id === selected)!
  const view = pageSlice(map.connections, connection, 1),
    door = view.items[0]
  const approach = journeyApproach(world, selected)
  const objectives = new Set(journeyDirections(world).map((d) => d.targetZone))
  return (
    <div className="aw2-panel-stack" data-testid="journey-overview">
      <select
        aria-label="Vùng trên bản đồ hành trình"
        value={selected}
        onChange={(e) => {
          const id = e.target.value as ZoneId
          setSelected(id)
          memory.current = id
          setConnection(0)
        }}
      >
        {maps.map((m) => (
          <option key={m.id} value={m.id}>
            {m.current ? "● " : ""}
            {objectives.has(m.id) ? "★ " : ""}
            {m.name}
          </option>
        ))}
      </select>
      <div className="aw2-panel-tabs" role="group" aria-label="Chi tiết vùng">
        <button
          type="button"
          aria-pressed={tab === "route"}
          onClick={() => setTab("route")}
        >
          Đường đi
        </button>
        <button
          type="button"
          aria-pressed={tab === "doors"}
          onClick={() => setTab("doors")}
        >
          Cửa nối
        </button>
      </div>
      <div className="aw2-panel-body">
        {tab === "route" ? (
          <>
            <PagedCopy
              limit={85}
              text={
                map.current
                  ? `Bạn đang ở ${map.name}. Chọn vùng khác để tìm cửa tiếp theo.`
                  : map.route
                    ? map.route.map((id) => zoneById(id).name).join(" → ")
                    : "Chưa có đường đang mở tới vùng này. Tiếp tục nhiệm vụ để mở cửa."
              }
            />
            <button
              type="button"
              disabled={!canWalk || !approach}
              onClick={() => approach && onWalk(approach)}
              data-testid="overview-walk"
            >
              Đi tới cửa kế tiếp
            </button>
          </>
        ) : (
          <>
            <p data-testid="overview-door-state">
              <strong>{zoneById(door.destination).name}</strong> ·{" "}
              {door.open ? "Đang mở" : "Chưa mở"}
            </p>
            <PagedCopy limit={70} text={door.reason} />
            <PageControls
              page={view.page}
              pages={view.pages}
              onPage={setConnection}
              label="Cửa"
            />
          </>
        )}
      </div>
    </div>
  )
}
