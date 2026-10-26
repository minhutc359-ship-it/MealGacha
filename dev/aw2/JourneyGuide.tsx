import type { WorldProgress } from "../../src/aw2/world/model"
import type { Waypoint } from "../../src/aw2/world/navigation"
import { journeyDirections } from "../../src/aw2/world/journey"
import { zoneById } from "../../src/aw2/world/maps"
import { INTERACT_RANGE } from "../../src/aw2/world/rules"

interface Props {
  objective: string
  world: WorldProgress
  disabled: boolean
  onNavigate: (point: Waypoint) => void
}

export function JourneyGuide({
  objective,
  world,
  disabled,
  onNavigate,
}: Props) {
  const directions = journeyDirections(world)
  return (
    <section className="aw2-journey-guide" aria-label="Mục tiêu hành trình">
      <h2>Mục tiêu trước mắt</h2>
      <p className="aw2-objective" data-testid="quest-objective">
        {objective}
      </p>
      {directions.length > 0 && (
        <nav aria-label="Đường tới mục tiêu" data-testid="journey-directions">
          <p className="note">
            Chọn để đi bộ tới người, đồ vật hoặc cửa kế tiếp trên đường. Đến
            nơi, dùng E / Tương tác để tự chọn thao tác hoặc đi qua cửa.
          </p>
          <div className="aw2-journey-destinations">
            {directions.map((direction) => {
              const nearby =
                Math.hypot(
                  world.x - direction.next.x,
                  world.y - direction.next.y,
                ) <= INTERACT_RANGE
              return (
                <article
                  key={direction.targetId}
                  data-journey-target={direction.targetId}
                  data-journey-step={direction.next.id}
                  data-journey-zones={direction.zones.join(",")}
                  data-journey-arrived={nearby}
                >
                  <h3>{direction.targetName}</h3>
                  <p className="note" data-testid="journey-zone-route">
                    {direction.zones.map((id) => zoneById(id).name).join(" → ")}
                  </p>
                  <p data-testid="journey-next-step">
                    {nearby
                      ? `Đã tới gần ${direction.next.name}. Nhấn E / Tương tác.`
                      : direction.zones.length > 1
                        ? `Đi tới cửa: ${direction.next.name}.`
                        : `Đi tới ${direction.next.name}.`}
                  </p>
                  <button
                    type="button"
                    aria-label={`Theo mục tiêu: ${direction.targetName}`}
                    data-testid={`journey-walk-${direction.targetId}`}
                    disabled={disabled || nearby}
                    onClick={() => onNavigate(direction.approach)}
                  >
                    {nearby ? "Đã tới gần" : "Đi theo mục tiêu"}
                  </button>
                </article>
              )
            })}
          </div>
        </nav>
      )}
      <details>
        <summary>Hướng dẫn di chuyển, lưu và ghé bàn</summary>
        <ul>
          <li>
            Chạm lối đi để đến nơi, hoặc dùng WASD/mũi tên khi đang chọn bản đồ.
            Đến gần người, đồ vật hoặc cửa rồi nhấn E / Tương tác. Tab chọn nút;
            Enter hoặc Space kích hoạt nút. Escape đóng hội thoại.
          </li>
          <li>
            Hành trình nối Làng → Phố → Sân → Kho → Lửa → Bàn. Đến gần cửa rồi
            tương tác để đi qua; đi ngược lại để trở về.
          </li>
          <li>
            Đi bộ chưa lưu vị trí. Chọn Lưu vị trí trước khi rời trang; nhận
            nhiệm vụ, mở rương hoặc ghé bàn cũng lưu tiến trình. Đọc lại đưa bạn
            về lần lưu gần nhất.
          </li>
          <li>
            Mở Đội và túi đồ để xem nguyên liệu. Khi bếp đã sáng, đến gần Dì Gác
            Bếp hoặc ngọn lửa để nấu rồi chia một bữa ấm.
          </li>
          <li>
            Ghé nhanh TCG / Auto Chess hoặc hai bàn ở Phố để luyện tập bằng tài
            nguyên mượn. Các ván không tiêu túi đồ hoặc nhận quà hành trình; rời
            bàn hay tải lại sẽ bỏ ván.
          </li>
          <li>
            Sau thử thách ở Phòng Bàn, chọn Lưu kết quả và trở về. Khi thắng,
            đọc ghi chép bên chén rồi về Bà Giữ Chỗ để hoàn tất lời mời.
          </li>
        </ul>
      </details>
    </section>
  )
}
