import { useEffect, useRef, useState } from "react"
import { AW2_MODES } from "../../src/aw2/modes/catalog"
import type { ModeVisit } from "../../src/aw2/modes/session"
import { zoneById } from "../../src/aw2/world/maps"
import { TEA_ROOM } from "../../src/aw2/world/interiorLayout"
import { TcgPractice } from "./TcgPractice"
import { ChessPractice } from "./ChessPractice"
import { ActivityFrame, ActivityCopy } from "./ActivityFrame"

export function ModeLobby({
  visit,
  error,
  onReturn,
  onReread,
  compact = false,
}: {
  compact?: boolean
  visit: ModeVisit
  error: string
  onReturn: () => void
  onReread: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  const [playing, setPlaying] = useState(false)
  const [page, setPage] = useState("welcome")
  useEffect(() => {
    if (error && compact) setPage("notice")
  }, [error, compact])
  useEffect(() => {
    heading.current?.focus()
  }, [])
  const mode = AW2_MODES.find((candidate) => candidate.id === visit.modeId)!
  if (playing && visit.modeId === "tcg")
    return (
      <TcgPractice
        compact={compact}
        error={error}
        onReturn={onReturn}
        onReread={onReread}
      />
    )
  if (playing && visit.modeId === "auto-chess")
    return (
      <ChessPractice
        compact={compact}
        error={error}
        onReturn={onReturn}
        onReread={onReread}
      />
    )
  if (compact)
    return (
      <ActivityFrame
        title={`${mode.name} · Sảnh chờ`}
        status={`Trở về: ${(visit.returnRoomId ? TEA_ROOM.name : zoneById(visit.returnZoneId).name)}`}
        page={page}
        onPage={setPage}
        pages={[
          ["welcome", "Bàn chơi"],
          ["notice", "Thông báo / đọc lại"],
        ]}
        data-testid="mode-lobby"
        data-mode-id={visit.modeId}
        data-entry={visit.entry}
        footer={<button onClick={onReturn}>Trở về hành trình</button>}
      >
        <ActivityCopy
          text={
            page === "notice"
              ? error || "Đọc lại sẽ trở về tiến trình hành trình mới nhất."
              : visit.modeId === "tcg"
                ? "Mượn bộ 20 lá để đấu với Chủ bàn. Không tốn vật phẩm, không nhận thưởng; tải lại hoặc rời bàn sẽ bỏ ván."
                : "Mượn đội và vàng tại bàn để tuyển quân, xếp đội và đấu 5 vòng. Không tốn vật phẩm, không nhận thưởng hành trình; tải lại hoặc rời bàn sẽ bỏ ván."
          }
        />
        {page === "welcome" ? (
          <button onClick={() => setPlaying(true)}>
            {visit.modeId === "tcg" ? "Chơi TCG thử" : "Chơi Auto Chess thử"}
          </button>
        ) : (
          <button onClick={onReread}>Đọc lại hành trình</button>
        )}
      </ActivityFrame>
    )
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
            <h2>Bàn cờ luyện tập đã sẵn sàng</h2>
            <p>
              Mượn đội và vàng tại bàn để tuyển quân, xếp đội và đấu 5 vòng.
              Không tốn vật phẩm, không nhận thưởng hành trình; tải lại hoặc rời
              bàn sẽ bỏ ván.
            </p>
            <button onClick={() => setPlaying(true)}>
              Chơi Auto Chess thử
            </button>
          </>
        )}
        <p>
          Trở về: <strong>{(visit.returnRoomId ? TEA_ROOM.name : zoneById(visit.returnZoneId).name)}</strong>.
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
