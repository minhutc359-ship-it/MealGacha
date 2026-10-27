import { useState, type RefObject } from "react"
import type { WorldProgress } from "../../src/aw2/world/model"
import type { ZoneId } from "../../src/aw2/world/ids"
import type { Waypoint } from "../../src/aw2/world/navigation"
import { journeyApproach, journeyOverview } from "../../src/aw2/world/registry"
import { journeyDirections } from "../../src/aw2/world/journey"
import { TEA_ROOM } from "../../src/aw2/world/interiorLayout"
import { teaRoomDirection } from "../../src/aw2/world/placeGuidance"
import { sceneName } from "../../src/aw2/world/scene"
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
  const objectives = new Set(
    journeyDirections({ ...world, interior: null }).map((d) => d.targetZone),
  )
  const tea = teaRoomDirection(world)
  const village = selected === TEA_ROOM.zoneId
  const viewTab = tab === "tea" && !village ? "route" : tab
  return (
    <div
      className="aw2-panel-stack aw2-journey-overview"
      data-testid="journey-overview"
    >
      <p className="note" data-testid="overview-current-scene">
        Đang ở: {sceneName(world)}
      </p>
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
          aria-pressed={viewTab === "route"}
          onClick={() => setTab("route")}
        >
          Đường đi
        </button>
        <button
          type="button"
          aria-pressed={viewTab === "doors"}
          onClick={() => setTab("doors")}
        >
          Cửa nối
        </button>
        {village && (
          <button
            type="button"
            aria-pressed={viewTab === "tea"}
            onClick={() => setTab("tea")}
          >
            Tiệm trà
          </button>
        )}
      </div>
      <div className="aw2-panel-body">
        {viewTab === "tea" ? (
          <>
            <PagedCopy limit={55} compact text={tea.text} />
            <button
              type="button"
              disabled={!canWalk || !tea.approach}
              data-testid="overview-tea-walk"
              onClick={() => tea.approach && onWalk(tea.approach)}
            >
              {tea.label}
            </button>
          </>
        ) : viewTab === "route" ? (
          <>
            <PagedCopy
              limit={55}
              compact
              text={
                world.interior
                  ? `Bạn đang trong tiệm trà. Ra hiên trước; sau đó ${
                      map.current
                        ? "tiếp tục ở Làng Giao Ước."
                        : map.route
                          ? map.route.map((id) => zoneById(id).name).join(" → ")
                          : "tiếp tục nhiệm vụ để mở đường."
                    }`
                  : map.current
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
              {world.interior ? "Đi tới cửa ra hiên" : "Đi tới cửa kế tiếp"}
            </button>
          </>
        ) : (
          <>
            <p data-testid="overview-door-state">
              <strong>{zoneById(door.destination).name}</strong> ·{" "}
              {door.open ? "Đang mở" : "Chưa mở"}
            </p>
            <PagedCopy limit={55} compact text={door.reason} />
            <PageControls
              page={view.page}
              pages={view.pages}
              onPage={setConnection}
              label="Cửa"
              compact
            />
          </>
        )}
      </div>
    </div>
  )
}
