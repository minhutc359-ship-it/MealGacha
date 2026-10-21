import type { Aw2DevSave } from "../../src/aw2/save/schema"
import type { Aw2ModeId } from "../../src/aw2/modes/catalog"

interface Props {
  save: Aw2DevSave
  busy: boolean
  onPractice: (mode: Aw2ModeId) => void
}

/** The committed save is the only source of completion; no grants or writes. */
export function DemoCompletion({ save, busy, onPractice }: Props) {
  const progress = save.progress
  if (progress.questIndex !== 4 || !progress.endingChoice) return null
  const ending =
    progress.endingChoice === "wait"
      ? "Để ghế trống chờ"
      : "Mời cả làng dùng bữa"
  return (
    <section
      className="aw2-demo-complete"
      aria-labelledby="demo-complete-title"
      data-testid="demo-complete"
    >
      <p className="eyebrow">MỘT CHỖ BÊN BẾP</p>
      <h2 id="demo-complete-title">Bạn đã hoàn tất hành trình demo</h2>
      <p data-testid="demo-ending">
        Lời mời của bạn: <strong>{ending}</strong>.
      </p>
      <p>
        Bốn nhiệm vụ đã hoàn thành, thử thách đã vượt qua và ghi chép bên chén
        đã được đọc. Cả đội đang có{" "}
        <strong>{save.economy.teamExperience} EXP</strong>. Kết thúc này đã được
        lưu; tải lại trang sẽ tiếp tục từ bản lưu đó.
      </p>
      <p>
        Bạn vẫn có thể khám phá, nấu và chia bữa, hoặc đi lối tắt giữa Sân Bếp
        và Phòng Bàn. Hai bàn luyện tập luôn mở để thử một ván mới.
      </p>
      <div className="actions" aria-label="Chơi tiếp sau hành trình">
        <button disabled={busy} onClick={() => onPractice("tcg")}>
          Luyện TCG
        </button>
        <button disabled={busy} onClick={() => onPractice("auto-chess")}>
          Luyện Auto Chess
        </button>
      </div>
      <p className="aw2-demo-note">
        Ván luyện tập dùng tài nguyên mượn và không nhận quà hành trình. Đây là
        kết thúc phần demo hiện tại; nội dung tiếp theo đang được phát triển.
      </p>
    </section>
  )
}
