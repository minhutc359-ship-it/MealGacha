import { CARDS } from "../../game/catalog"
import { getDateKey } from "../../domain/dateKey"
import { campaignProgress } from "../../game/storyPresentation"
import { STAGES } from "../../game/story"
import { activeRun } from "../../game/expedition"
import { useGameStore } from "../../game/useGameStore"
import { CharacterPortrait } from "./CharacterPortrait"
import type { GameSave } from "../../game/types"
import { Link } from "react-router-dom"

export function HomeLobby({
  save,
  name,
  claims,
  onTab,
  onStage,
  onHelp,
}: {
  save: GameSave
  name: string
  claims: number
  onTab: (tab: string) => void
  onStage: (id: string) => void
  onHelp: () => void
}) {
  const progress = campaignProgress(save.clearedStages)
  const next = STAGES.find((s) => !save.clearedStages.includes(s.id))
  const run = activeRun(save.expedition)
  const owned = Object.values(save.cards).filter((n) => n > 0).length
  return (
    <section className="tcg-lobby" aria-label="Sảnh hành trình">
      <div className="tcg-lobby-greeting">
        <div>
          <span className="tcg-kicker">
            NGƯỜI GIỮ VỊ · CẤP {Math.floor(save.xp / 100) + 1}
          </span>
          <h1>Chào {name}</h1>
        </div>
        <button
          className="tcg-button ghost"
          disabled={save.lastCheckIn === getDateKey()}
          onClick={() => useGameStore.getState().checkIn()}
        >
          {save.lastCheckIn === getDateKey()
            ? "✓ Đã điểm danh"
            : "+100 xu · Điểm danh"}
        </button>
      </div>
      {(!save.story400?.giftClaimed||!save.traps450?.giftClaimed)&&<div className="tcg-starter-gifts">
      {!save.story400?.giftClaimed && <div className="tcg-lobby-actions"><button className="tcg-button gold" onClick={() => useGameStore.getState().claimV4Gift()}>Nhận gói khởi hành 4.0 · 8 thẻ mới × 2</button><span>Nêm vị chọn một nhánh; Ủ vị giữ hiệu ứng sang lượt sau. Nhận quà rồi thêm thẻ vào bộ bài trong Bộ bài.</span></div>}
      {!save.traps450?.giftClaimed&&<div className="tcg-trap-gift"><span>◇ BẪY HƯƠNG</span><div><strong>Một ô kín, một nhịp phản công.</strong><p>8 bẫy + 2 đối sách × 2 bản. Nhận miễn phí rồi thêm vào bộ bài; dùng từ trận mới.</p></div><button className="tcg-button gold" onClick={()=>useGameStore.getState().claimTrapGift()}>Nhận bộ bẫy 4.5</button></div>}
      </div>}
      <div className="tcg-lobby-hero">
        <img
          className="tcg-lobby-background"
          src={next?.chapter.art ?? STAGES[17].chapter.art}
          alt=""
        />
        <div className="tcg-lobby-copy">
          <span className="tcg-kicker">
            {next
              ? `CHƯƠNG ${Math.floor(next.index / 3) + 1} · ${next.chapter.title}`
              : "BỮA TIỆC BÌNH MINH"}
          </span>
          <h2>{next?.title ?? "Một công thức mới đang chờ"}</h2>
          <p>
            {next
              ? "Một ký ức, một trận đấu. Giữ ngọn lửa của riêng bạn."
              : "Bạn đã hoàn thành câu chuyện. Thử bộ bài mới hoặc một chuyến thám hiểm."}
          </p>
          <div className="tcg-lobby-actions">
            <button
              className="tcg-button gold"
              onClick={() =>
                run
                  ? onTab("expedition")
                  : next
                    ? onStage(next.id)
                    : onTab("story")
              }
            >
              {run
                ? "Tiếp tục thám hiểm →"
                : save.clearedStages.length
                  ? "Tiếp tục hành trình →"
                  : "Bắt đầu hành trình →"}
            </button>
            <button className="tcg-button light" onClick={onHelp}>
              Cách chơi
            </button>
          </div>
          <span className="tcg-lobby-progress">
            {progress.cleared}/{progress.total} màn · {owned}/{CARDS.length} thẻ ·{" "}
            {save.stats.wins} trận thắng
          </span>
        </div>
        <CharacterPortrait
          id="hero"
          decorative
          className="tcg-lobby-character"
        />
      </div>
      <div className="tcg-lobby-modes">
        <Link className="tcg-lobby-mode-link" to="/adventure">
          <span>⌁</span>
          <strong>Phiêu lưu Vị Linh</strong>
          <small>Khám phá · thu phục · đấu giữ ấn</small>
          <b>→</b>
        </Link>
        <button
          onClick={() =>
            run ? onTab("expedition") : useGameStore.getState().start(null)
          }
        >
          <span>⚔</span>
          <strong>{run ? "Chuyến đi đang dở" : "Luyện đấu"}</strong>
          <small>{run ? "Trở lại thám hiểm" : "Thử bộ bài với AI"}</small>
          <b>→</b>
        </button>
        <button onClick={() => onTab("expedition")}>
          <span>◈</span>
          <strong>Thám hiểm</strong>
          <small>7 chặng · di vật · lựa chọn</small>
          <b>→</b>
        </button>
        <button onClick={() => onTab("companions")}>
          <span>♧</span>
          <strong>Bạn bên bếp</strong>
          <small>Trợ chiến & thử thách tuần</small>
          <b>→</b>
        </button>
      </div>
      <div className="tcg-lobby-shortcuts">
        <button onClick={() => onTab("decks")}>
          <strong>▱ Bộ bài</strong>
          <small>Ghép một công thức mới</small>
        </button>
        <button onClick={() => onTab("packs")}>
          <strong>✦ Gói thẻ</strong>
          <small>
            {save.packTickets
              ? `${save.packTickets} vé đang chờ`
              : "Khám phá hương vị mới"}
          </small>
        </button>
        <button onClick={() => onTab("quests")}>
          <strong>☀ Nhiệm vụ</strong>
          <small>
            {claims
              ? `${claims} phần thưởng chờ nhận`
              : "Mỗi ngày, một chút tiến bộ"}
          </small>
        </button>
      </div>
    </section>
  )
}
