import { useEffect, useRef } from "react"

interface Props {
  onClose(): void
}

const CHEST_ODDS = [
  { label: "Thường", value: 72, className: "common", note: "Món phù hợp banner đã chọn" },
  { label: "Hiếm", value: 22, className: "rare", note: "Khung cyan và hiệu ứng tăng cường" },
  { label: "Sử thi", value: 6, className: "epic", note: "Khung vàng tím và đại cảnh đặc biệt" },
]

export function ChestOddsModal({ onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    closeRef.current?.focus()
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  return (
    <div
      className="odds-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="odds-title"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="odds-panel">
        <header>
          <div>
            <small>XÁC SUẤT TRIỆU HỒI</small>
            <h2 id="odds-title">Tỉ lệ phần thưởng</h2>
          </div>
          <button ref={closeRef} onClick={onClose} aria-label="Đóng bảng tỉ lệ">×</button>
        </header>

        <div className="odds-list">
          {CHEST_ODDS.map((item) => (
            <div className={`odds-row rarity-${item.className}`} key={item.label}>
              <span className="odds-gem" aria-hidden="true">◇</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.note}</small>
                <span className="odds-track"><i style={{ width: `${item.value}%` }} /></span>
              </div>
              <b>{item.value}%</b>
            </div>
          ))}
        </div>

        <div className="fusion-odds">
          <span>✦</span>
          <p><strong>Ghép món được bảo chứng</strong><small>82% Hiếm · 18% Sử thi</small></p>
        </div>
        <p className="odds-note">Món được chọn ngẫu nhiên có trọng số và giảm lặp 3 kết quả gần nhất khi pool đủ lớn.</p>
      </section>
    </div>
  )
}
