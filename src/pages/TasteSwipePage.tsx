import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FoodImage } from "../components/food/FoodImage"
import { useAppStore } from "../store/useAppStore"

const CARDS = [
  { id: "vn", label: "Món Việt", dishId: "pho-bo", tags: ["vietnamese"] },
  { id: "kr", label: "Món Hàn", dishId: "bibimbap", tags: ["korean"] },
  { id: "jp", label: "Món Nhật", dishId: "sushi", tags: ["japanese"] },
  { id: "cn", label: "Món Trung", dishId: "xiaolongbao", tags: ["chinese"] },
  { id: "th", label: "Món Thái", dishId: "pad-thai", tags: ["thai"] },
  { id: "bbq", label: "Đồ nướng", dishId: "samgyeopsal", tags: ["bbq", "grilled"] },
  { id: "noodle", label: "Mì và bún", dishId: "shoyu-ramen", tags: ["noodle"] },
  { id: "hotpot", label: "Lẩu nóng hổi", dishId: "haidilao-hotpot", tags: ["hotpot"] },
  { id: "seafood", label: "Hải sản", dishId: "sushi", tags: ["seafood", "japanese"] },
  { id: "fried", label: "Đồ chiên", dishId: "ga-ran", tags: ["fried"] },
  { id: "spicy", label: "Vị cay", dishId: "tom-yum-goong", tags: ["spicy"] },
  { id: "dessert", label: "Tráng miệng", dishId: "mango-sticky-rice", tags: ["dessert"] },
  { id: "light", label: "Thanh nhẹ", dishId: "pho-ga", tags: ["light"] },
  { id: "fast", label: "Ăn nhanh", dishId: "classic-burger", tags: ["fast-food", "quick"] },
  { id: "sweet", label: "Cà phê và bánh", dishId: "croissant", tags: ["bakery", "sweet"] },
]

export function TasteSwipePage() {
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [liked, setLiked] = useState<string[]>([])
  const [offset, setOffset] = useState(0)
  const [exiting, setExiting] = useState<"left" | "right" | null>(null)
  const startX = useRef<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveTasteProfile = useAppStore((state) => state.saveTasteProfile)
  const resetTasteProfile = useAppStore((state) => state.resetTasteProfile)
  const reduceMotion = useAppStore((state) => state.user.preferences.reducedMotion)
  const navigate = useNavigate()

  const choose = (yes: boolean) => {
    if (exiting || index >= CARDS.length) return
    const nextLiked = yes ? [...liked, ...CARDS[index].tags] : liked
    setLiked(nextLiked)
    setExiting(yes ? "right" : "left")
    timer.current = setTimeout(() => { setIndex(index + 1); setOffset(0); setExiting(null); if (index + 1 === CARDS.length) saveTasteProfile(nextLiked) }, reduceMotion ? 80 : 280)
  }
  const reset = () => { if (timer.current) clearTimeout(timer.current); resetTasteProfile(); setIndex(0); setLiked([]); setStarted(true); setOffset(0); setExiting(null) }
  const card = CARDS[index]
  return <div className="swipe-page">
    {!started ? <section className="swipe-intro"><span>💘</span><small>KHÁM PHÁ KHẨU VỊ</small><h1>Ăn gì hợp gu bạn?</h1><p>Vuốt phải ❤️ nếu thích, vuốt trái 👎 nếu không. MealGacha sẽ tăng nhẹ cơ hội xuất hiện của món hợp khẩu vị. Hoàn tất lần đầu mỗi ngày nhận 2 chìa khóa.</p><button onClick={reset}>Bắt đầu khám phá</button></section>
      : card ? <><header><small>TASTE SWIPE · {index + 1}/{CARDS.length}</small><h1>Chọn theo cảm giác</h1><div className="swipe-progress"><i style={{ width: `${(index / CARDS.length) * 100}%` }} /></div></header>
        <div className="swipe-stage"><div className={`swipe-card ${exiting ? `exit-${exiting}` : ""}`} style={{ transform: exiting ? undefined : `translateX(${offset}px) rotate(${offset / 16}deg)` }} onPointerDown={(event) => { startX.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId) }} onPointerMove={(event) => { if (startX.current !== null) setOffset(event.clientX - startX.current) }} onPointerUp={(event) => { if (startX.current === null) return; const distance = event.clientX - startX.current; startX.current = null; if (Math.abs(distance) > 85) choose(distance > 0); else setOffset(0) }}>
          <FoodImage dishId={card.dishId} name={card.label} variant="full" eager /><div className="swipe-card-overlay"><small>MEALGACHA · GU ĂN UỐNG</small><h2>{card.label}</h2></div>{offset > 35 && <b className="swipe-stamp love">❤️ LOVE IT</b>}{offset < -35 && <b className="swipe-stamp nope">👎 NOPE</b>}
        </div></div>
        <div className="swipe-controls"><button onClick={() => choose(false)} aria-label="Không thích">👎</button><span>Vuốt hoặc chạm để chọn</span><button onClick={() => choose(true)} aria-label="Thích">❤️</button></div>
      </> : <section className="swipe-intro"><span>✨</span><small>HOÀN THÀNH</small><h1>Gu ăn đã được ghi nhớ</h1><p>Các món hợp khẩu vị sẽ được tăng nhẹ xác suất xuất hiện, tối đa 5% trọng số mỗi món. Bạn có thể chơi lại để cập nhật gu bất kỳ lúc nào.</p><button onClick={() => navigate("/")}>Mở rương thử ngay</button><button className="swipe-secondary" onClick={reset}>Chơi lại</button><button className="swipe-secondary" onClick={() => navigate("/collection")}>Về Hồ sơ</button></section>}
    </div>
}
