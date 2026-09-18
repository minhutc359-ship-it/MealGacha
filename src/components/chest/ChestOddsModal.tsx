import { useEffect, useRef } from "react"
import type { Dish, MealSlot, RewardRarity } from "../../domain/models"
import { RARITY_ODDS } from "../../domain/drawReward"

interface Props {
  dishes: Dish[]
  slot: MealSlot
  onClose(): void
}

const RARITY_META: Array<{
  rarity: RewardRarity
  label: string
  note: string
}> = [
  { rarity: "common", label: "Thường", note: "Món phổ biến, dễ tiếp cận" },
  { rarity: "rare", label: "Hiếm", note: "Món có mức giá nhỉnh hơn" },
  { rarity: "epic", label: "Sử thi", note: "Trải nghiệm ẩm thực cao cấp" },
  { rarity: "diamond", label: "Kim cương", note: "Fine dining và dịp siêu đặc biệt" },
]

export function ChestOddsModal({ dishes, slot, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const pool = dishes.filter((dish) => dish.active && dish.mealSlots.includes(slot))
  const odds = RARITY_META.map((meta) => {
    return { ...meta, value: pool.length > 0 ? RARITY_ODDS[meta.rarity] : 0 }
  })

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
          {odds.map((item) => (
            <div className={`odds-row rarity-${item.rarity}`} key={item.label}>
              <span className="odds-gem" aria-hidden="true">◇</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.note}</small>
                <span className="odds-track"><i style={{ width: `${Math.max(item.value, item.value > 0 ? 2 : 0)}%` }} /></span>
              </div>
              <b>{item.value < 1 && item.value > 0 ? "<1" : item.value.toFixed(1)}%</b>
            </div>
          ))}
        </div>

        <div className="fusion-odds">
          <span>✦</span>
          <p><strong>Giá trị càng cao, tỉ lệ càng thấp</strong><small>Khung Kim Cương dành cho món và dịp siêu hiếm</small></p>
        </div>
        <p className="odds-note">Món được chọn ngẫu nhiên có trọng số và giảm lặp 3 kết quả gần nhất khi pool đủ lớn.</p>
      </section>
    </div>
  )
}
