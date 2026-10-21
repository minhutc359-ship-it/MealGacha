import { useEffect, useRef, useState } from "react"
import { AW2_MODES } from "../../src/aw2/modes/catalog"
import type { ModeVisit } from "../../src/aw2/modes/session"
import { zoneById } from "../../src/aw2/world/maps"
import { TcgPractice } from "./TcgPractice"

export function ModeLobby({
  visit,
  error,
  onReturn,
  onReread,
}: {
  visit: ModeVisit
  error: string
  onReturn: () => void
  onReread: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  const mode = AW2_MODES.find((candidate) => candidate.id === visit.modeId)!
  if (playing && visit.modeId === "tcg")
    return <TcgPractice error={error} onReturn={onReturn} onReread={onReread} />
  return (
    <main
      className="aw2-save aw2-mode-lobby"
      data-testid="mode-lobby"
      data-mode-id={visit.modeId}
      data-entry={visit.entry}
    >
      <p className="eyebrow">MỘT CHỖ BÊN BẾP · GHÉ BÀN</p>
      <h1 ref={heading} tabIndex={-1}>
        {mode.name} · Sảnh chờ
      </h1>
      <section aria-label="Tình trạng bàn chơi">
        {visit.modeId === "tcg" ? (
          <>
            <h2>Bộ bài luyện tập đã sẵn sàng</h2>
            <p>
              Mượn bộ 20 lá để đấu với Chủ bàn. Không tốn vật phẩm, không nhận
              thưởng; tải lại hoặc rời bàn sẽ bỏ ván.
            </p>
            <button onClick={() => setPlaying(true)}>Chơi TCG thử</button>
          </>
        ) : (
          <>
            <h2>Ván chơi đang được chuẩn bị</h2>
            <p>
              Hiện chưa có ván đấu hoặc phần thưởng tại bàn này. Điểm khám phá
              đã được lưu; bạn có thể quay về hành trình ngay.
            </p>
          </>
        )}
        <p>
          Trở về: <strong>{zoneById(visit.returnZoneId).name}</strong>.
        </p>
        <div className="actions">
          <button onClick={onReturn}>Trở về hành trình</button>
          <button onClick={onReread}>Đọc lại hành trình</button>
        </div>
      </section>
      {error && <p role="alert">{error}</p>}
    </main>
  )
}
