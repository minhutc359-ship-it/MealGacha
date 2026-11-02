import { useEffect, useRef, useState } from "react"
import type { Aw2DevSave } from "../../src/aw2/save/schema"
import {
  earnedSummonMilestones,
  type SummonAction,
} from "../../src/aw2/gacha/runtime"
import {
  GACHA_BASE_RATES,
  TIERS,
  DUPLICATE_SHARDS,
} from "../../src/aw2/gacha/proposal"
import { ROSTER } from "../../src/aw2/world/ids"
import { PageControls, PagedCopy } from "./GamePanels"

interface Props {
  save: Aw2DevSave
  busy: boolean
  onAction: (action: SummonAction) => void
}
export function SummonPanel({ save, busy, onAction }: Props) {
  const [page, setPage] = useState("draw"),
    [index, setIndex] = useState(0)
  const s = save.summons,
    pending = earnedSummonMilestones(save.economy, save.modes).filter(
      (id) => !s.claimed.includes(id),
    ).length
  const lastTotal = useRef(s.totalDraws)
  useEffect(() => {
    if (s.totalDraws > lastTotal.current) {
      setPage("results")
      setIndex(0)
    }
    lastTotal.current = s.totalDraws
  }, [s.totalDraws])
  const result =
    s.lastDraws[Math.min(index, Math.max(0, s.lastDraws.length - 1))]
  return (
    <section
      className="aw2-panel-stack"
      aria-label="Triệu hồi miễn phí"
      data-testid="summon-panel"
    >
      <div
        className="aw2-panel-tabs"
        role="group"
        aria-label="Nội dung triệu hồi"
      >
        {[
          ["draw", "Gặp Vị Linh"],
          ["rates", "Tỷ lệ / bảo hiểm"],
          ["results", "Kết quả đã lưu"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={page === id}
            onClick={() => setPage(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {page === "draw" && (
        <>
          <p>
            <strong>{s.tickets} vé</strong> · Đã gặp {s.totalDraws} lần
          </p>
          <p className="note">
            100 vé miễn phí qua nhiệm vụ và bậc bàn chơi. Không mua vé; cốt
            truyện vẫn mời đủ 12 Vị Linh.
          </p>
          <button
            disabled={busy || pending === 0}
            onClick={() => onAction({ type: "claim" })}
          >
            Nhận {pending * 10} vé từ mốc đã hoàn tất
          </button>
          <div className="aw2-panel-tabs">
            <button
              disabled={busy || s.tickets < 1}
              onClick={() => onAction({ type: "draw", count: 1 })}
            >
              Gặp 1 lần · 1 vé
            </button>
            <button
              disabled={busy || s.tickets < 10}
              onClick={() => onAction({ type: "draw", count: 10 })}
            >
              Gặp 10 lần · 10 vé
            </button>
          </div>
        </>
      )}
      {page === "rates" && (
        <PagedCopy
          text={`Tỷ lệ gốc: ${TIERS.map((tier) => `${tier} ${GACHA_BASE_RATES[tier]}%`).join(" · ")}. Trong cùng bậc, mỗi Vị Linh có cơ hội bằng nhau. Sau tối đa 10 lần có SR+, 80 lần có SSR+, 200 lần có UR; bậc cao hơn đặt lại bộ đếm bậc thấp. Chạm bảo hiểm: chia lại trọng số các bậc đủ điều kiện, ưu tiên UR trước SSR rồi SR. Còn tối đa SR+ ${10 - s.pity.sr}, SSR+ ${80 - s.pity.ssr}, UR ${200 - s.pity.ur} lần. Có 100 vé từ các mốc hiện có; không hứa nhận UR ngẫu nhiên trong số vé này. Vân vẫn được mời qua cốt truyện. Mỗi nhiệm vụ và lần đầu thắng mỗi bậc TCG/Auto Chess cho 10 vé. Bản trùng ghi dấu kỷ niệm theo bậc ${DUPLICATE_SHARDS.join(" / ")}. Dấu không tăng sức mạnh, không phải tiền và không đổi vật phẩm. Không có nhân vật giới hạn thời gian. Vé và bộ đếm lưu trên trình duyệt này, hãy xuất bản sao lưu. Kết quả chỉ hiện sau khi ghi và đọc lại bản lưu thành công.`}
        />
      )}
      {page === "results" &&
        (result ? (
          <>
            <h3>
              {ROSTER.find((u) => u.spiritId === result.spiritId)!.displayName}{" "}
              · {ROSTER.find((u) => u.spiritId === result.spiritId)!.rarity}
            </h3>
            <p>
              {result.duplicate
                ? "Bản trùng · đã ghi dấu kỷ niệm."
                : "Người bạn mới · có thể chọn vào đội."}
            </p>
            <p>
              Dấu kỷ niệm của Vị Linh này: {s.fragments[result.spiritId]}. Kết
              quả thuộc lần lưu gần nhất, không phát thưởng lại khi xem.
            </p>
            <PageControls
              page={Math.min(index, s.lastDraws.length - 1)}
              pages={s.lastDraws.length}
              onPage={setIndex}
              label="Kết quả"
            />
          </>
        ) : (
          <p>Chưa có lượt triệu hồi nào được lưu.</p>
        ))}
    </section>
  )
}
