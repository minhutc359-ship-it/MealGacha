import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { Dish, MealSlot, RewardRarity } from "../../domain/models"
import {
  buildPool,
  getDishRarity,
  getEffectiveWeight,
} from "../../domain/drawReward"
import { useAppStore } from "../../store/useAppStore"
import { FoodImage } from "../food/FoodImage"
import { MEAL_SLOT_LABELS } from "../../domain/models"

interface Props {
  dishes: Dish[]
  slot: MealSlot
  eventId?: string
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
  {
    rarity: "diamond",
    label: "Kim cương",
    note: "Fine dining và dịp siêu đặc biệt",
  },
]

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi")
}

export function ChestOddsModal({ dishes, slot, eventId, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState("")
  const user = useAppStore((state) => state.user)
  const pool = buildPool(dishes, slot, user.recentDishIdsByMeal[slot], eventId)
  const search = normalize(query.trim())
  const visibleDishes = pool.filter((dish) =>
    normalize(dish.name).includes(search),
  )
  const totalWeight = pool.reduce(
    (sum, dish) =>
      sum + Math.max(getEffectiveWeight(dish, user.favoriteTasteTags), 1),
    0,
  )
  const odds = RARITY_META.map((meta) => {
    const weight = pool
      .filter((dish) => getDishRarity(dish) === meta.rarity)
      .reduce(
        (sum, dish) =>
          sum + Math.max(getEffectiveWeight(dish, user.favoriteTasteTags), 1),
        0,
      )
    return {
      ...meta,
      value: totalWeight > 0 ? (weight / totalWeight) * 100 : 0,
    }
  })

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (event.key === "Tab") {
        const controls = modalRef.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),[tabindex='0']",
        )
        const first = controls?.[0],
          last = controls?.[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener("keydown", handleKey)
    closeRef.current?.focus()
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = overflow
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [onClose])

  return createPortal(
    <div
      className="odds-backdrop"
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="odds-title"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="odds-panel">
        <header>
          <div>
            <small>XÁC SUẤT TRIỆU HỒI</small>
            <h2 id="odds-title">Món & tỉ lệ phần thưởng</h2>
          </div>
          <button ref={closeRef} onClick={onClose} aria-label="Đóng bảng tỉ lệ">
            ×
          </button>
        </header>

        <div className="odds-list">
          {odds.map((item) => (
            <div className={`odds-row rarity-${item.rarity}`} key={item.label}>
              <span className="odds-gem" aria-hidden="true">
                ◇
              </span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.note}</small>
                <span className="odds-track">
                  <i
                    style={{
                      width: `${Math.max(item.value, item.value > 0 ? 2 : 0)}%`,
                    }}
                  />
                </span>
              </div>
              <b>
                {item.value < 1 && item.value > 0
                  ? "<1"
                  : item.value.toFixed(1)}
                %
              </b>
            </div>
          ))}
        </div>

        <div className="fusion-odds">
          <span>✦</span>
          <p>
            <strong>Giá trị càng cao, tỉ lệ càng thấp</strong>
            <small>Khung Kim Cương dành cho món và dịp siêu hiếm</small>
          </p>
        </div>
        <p className="odds-note">
          Món được chọn ngẫu nhiên có trọng số. Tạm tránh 3 món vừa nhận
          khi có đủ món khác để lựa chọn.
        </p>
        <section
          className="odds-food-library"
          aria-label="Món đang có trong rương"
        >
          <h3>
            {MEAL_SLOT_LABELS[slot]} · {pool.length} món có thể nhận
          </h3>
          <p>
            {eventId
              ? "Chỉ gồm món của banner sự kiện đang chọn."
              : "Món quanh năm. Món giới hạn nằm trong banner sự kiện tương ứng."}
          </p>
          <label className="odds-food-search">
            <span>Tìm tên món</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ví dụ: ramen, xôi, bingsu…"
            />
          </label>
          <ul className="odds-food-grid">
            {visibleDishes.map((dish) => (
              <li key={dish.id}>
                <FoodImage
                  dishId={dish.id}
                  name={dish.name}
                  imageUrl={dish.imageUrl}
                  variant="thumb"
                />
                <strong>{dish.name}</strong>
                <small>
                  {
                    RARITY_META.find(
                      (meta) => meta.rarity === getDishRarity(dish),
                    )?.label
                  }
                </small>
              </li>
            ))}
          </ul>
          {!visibleDishes.length && (
            <p role="status">Không có món phù hợp trong rương này.</p>
          )}
        </section>
      </section>
    </div>,
    document.body,
  )
}
