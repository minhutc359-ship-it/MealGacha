import { useEffect, useRef, useState } from "react"
import { AW2_MODES, type Aw2ModeId } from "../../src/aw2/modes/catalog"
import { PagedCopy } from "./GamePanels"

/** Read-only menu until the player explicitly requests the validated room service. */
export function RoomPracticePanel({
  busy,
  canEnter,
  error,
  onEnter,
  onReread,
}: {
  busy: boolean
  canEnter: boolean
  error: string
  onEnter: (id: Aw2ModeId) => void
  onReread: () => void
}) {
  const [selected, setSelected] = useState<Aw2ModeId>("tcg")
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (error) heading.current?.focus({ preventScroll: true })
  }, [error])
  const mode = AW2_MODES.find((mode) => mode.id === selected)!
  return (
    <div
      className="aw2-panel-stack"
      data-testid="room-practice"
      data-mode-id={selected}
      role={error ? "alert" : undefined}
    >
      <div
        className="aw2-panel-tabs"
        role="group"
        aria-label="Chọn bàn luyện tập"
      >
        {AW2_MODES.map((mode) => (
          <button
            type="button"
            key={mode.id}
            disabled={busy}
            aria-pressed={selected === mode.id}
            onClick={() => setSelected(mode.id)}
          >
            {mode.name}
          </button>
        ))}
      </div>
      <h3 ref={heading} tabIndex={-1}>
        {mode.name} · Luyện tập
      </h3>
      <PagedCopy
        key={selected}
        text={
          error ||
          (selected === "tcg"
            ? "Mượn bộ 20 lá để đấu với Chủ bàn. Không tốn vật phẩm, không nhận thưởng. Vào bàn sẽ lưu điểm trở về tại đây."
            : "Mượn quân và vàng để xếp đội, đấu 5 vòng. Không dùng tài nguyên hành trình. Vào bàn sẽ lưu điểm trở về tại đây.")
        }
      />
      <button
        type="button"
        disabled={busy || !canEnter}
        onClick={() => onEnter(selected)}
      >
        Ghé bàn {mode.name}
      </button>
      {error && (
        <button type="button" disabled={busy} onClick={onReread}>
          Đọc lại hành trình
        </button>
      )}
    </div>
  )
}
