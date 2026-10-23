import type { WorldProgress } from "../../src/aw2/world/model"
import type { Waypoint } from "../../src/aw2/world/navigation"
import { tableRoomWaypoints } from "../../src/aw2/assets/tableRoom"

export function RoomWaypoints({
  world,
  disabled,
  onChoose,
}: {
  world: WorldProgress
  disabled: boolean
  onChoose: (point: Waypoint) => void
}) {
  const points = tableRoomWaypoints(world)
  if (!points.length) return null
  return (
    <nav
      className="aw2-room-waypoints"
      aria-label="Điểm đến trong Phòng Bàn"
      data-testid="table-room-waypoints"
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
            onClick={() => onChoose({ x: point.x, y: point.y })}
          >
            <strong>{point.name}</strong>
            <small>{point.status}</small>
          </button>
        ))}
      </div>
    </nav>
  )
}
