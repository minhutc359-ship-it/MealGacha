import { useState } from "react"
import { TACTICAL_DECK_LIBRARY } from "../../game/tacticalTcg/deckLibrary"
import { DuelCulture } from "./DuelCulture"
export function TacticalBotLobby({
  deckName,
  onStart,
}: {
  deckName: string
  onStart: (level: "normal" | "hard" | "extreme", opponent: string) => void
}) {
  const [level, setLevel] = useState<"normal" | "hard" | "extreme">("normal"),
    [opponent, setOpponent] = useState("tide-letters")
  return (
    <section className="duel-bot-lobby">
      <header>
        <DuelCulture kind="drum" />
        <small>BÀN LUYỆN GIỮA HỘI LÀNG</small>
        <h1>Đấu tự do với bot</h1>
        <p>
          Thử bộ bài <b>{deckName}</b> trước đối thủ có phong cách bạn chọn. Đây
          là bot cục bộ, không phải người chơi online; không tiêu vé và không
          cấp thưởng chiến dịch.
        </p>
      </header>
      <div className="duel-bot-levels" aria-label="Độ khó bot">
        {([
          [
            "normal",
            "Normal",
            "Nhịp đấu thư thả",
            "Chọn nước hợp lệ đa dạng, phù hợp học luật và thử lá mới.",
          ],
          [
            "hard",
            "Hard",
            "Tính trao đổi quân",
            "Ưu tiên giữ bàn, hạ Hộ vệ và nhận ra đòn kết thúc.",
          ],
          [
            "extreme",
            "Extreme",
            "Đọc trước phản công",
            "Tính thêm phản công khả dĩ từ bàn công khai; không nhìn bài tay hay danh tính bẫy úp của bạn.",
          ],
        ] as const).map(([id, title, subtitle, text]) => (
          <button
            key={id}
            aria-pressed={level === id}
            onClick={() => setLevel(id)}
          >
            <small>{subtitle}</small>
            <strong>{title}</strong>
            <p>{text}</p>
          </button>
        ))}
      </div>
      <label className="duel-opponent-select">
        Bộ bài đối thủ
        <select value={opponent} onChange={(e) => setOpponent(e.target.value)}>
          {TACTICAL_DECK_LIBRARY.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} · {d.style}
            </option>
          ))}
        </select>
      </label>
      <p>
        Cả hai bắt đầu với 30 HP, 3 Lửa và luật rút bài giống nhau. Độ khó thay
        cách ra quyết định; không cấp thêm tài nguyên cho bot.
      </p>
      <button
        className="tcg-button primary"
        onClick={() => onStart(level, opponent)}
      >
        Vào bàn · {level.toUpperCase()} →
      </button>
    </section>
  )
}
