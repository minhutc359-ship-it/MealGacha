import type { WorldProgress } from "../../src/aw2/world/model"
import type { Waypoint } from "../../src/aw2/world/navigation"
import { interiorWaypoints } from "../../src/aw2/assets/interiorLandscapes"
import { HEARTH_ROOM_SCENE } from "../../src/aw2/assets/hearthRoom"
import { VILLAGE_SCENE, villageWaypoints } from "../../src/aw2/assets/village"
import {
  journeyScene,
  journeyWaypoints,
} from "../../src/aw2/assets/journeyScenes"
import type { Economy } from "../../src/aw2/economy/model"
import {
  worldObjects,
  type NpcPatrolState,
} from "../../src/aw2/world/npcPatrol"
import { sceneName } from "../../src/aw2/world/scene"
import { placeApproach } from "../../src/aw2/world/placeGuidance"

export function RoomWaypoints({
  world,
  patrol,
  economy,
  disabled,
  onChoose,
}: {
  world: WorldProgress
  patrol?: Readonly<NpcPatrolState>
  economy?: Readonly<Economy>
  disabled: boolean
  onChoose: (point: Waypoint) => void
}) {
  const hearth = world.zoneId === HEARTH_ROOM_SCENE.zoneId
  const village = world.zoneId === VILLAGE_SCENE.zoneId
  const journey = journeyScene(world.zoneId)
  const points = world.interior
    ? worldObjects(world, patrol).map((object) => ({
        id: object.id,
        name: object.name,
        short: object.name,
        ...placeApproach(object),
        status: "Đến gần rồi tự E / Tương tác",
        locked: false,
        activity: object.activity,
      }))
    : journey
      ? economy
        ? journeyWaypoints(world, economy, patrol).map(
            ({ walkX, walkY, ...p }) => ({
              ...p,
              x: walkX,
              y: walkY,
            }),
          )
        : []
      : village
        ? villageWaypoints(world, patrol).map(({ walkX, walkY, ...point }) => ({
            ...point,
            x: walkX,
            y: walkY,
          }))
        : interiorWaypoints(world).map(({ walkX, walkY, ...p }) => ({
            ...p,
            x: walkX,
            y: walkY,
          }))
  if (!points.length) return null
  return (
    <nav
      className="aw2-room-waypoints"
      aria-label={`Điểm đến trong ${sceneName(world)}`}
      data-testid={
        world.interior
          ? "tea-room-waypoints"
          : journey
            ? `${world.zoneId.replace("aw2-zone-", "")}-waypoints`
            : village
              ? "village-waypoints"
              : hearth
                ? "hearth-room-waypoints"
                : "table-room-waypoints"
      }
    >
      <p>
        Chọn điểm đến để đi bộ. Khi đến gần, dùng E hoặc Tương tác để xem và
        chọn thao tác.
      </p>
      <div className="aw2-room-waypoint-grid">
        {points.map((point) => (
          <button
            key={point.id}
            type="button"
            data-testid={`room-waypoint-${point.id}`}
            disabled={disabled || point.locked}
            aria-label={`Đi tới ${point.name}`}
            onClick={() =>
              onChoose({ x: point.x, y: point.y, entityId: point.id })
            }
          >
            <strong>{point.name}</strong>
            <small>{point.status}</small>
            {"activity" in point && typeof point.activity === "string" ? (
              <small>Nhịp sống · {point.activity}</small>
            ) : null}
          </button>
        ))}
      </div>
    </nav>
  )
}
