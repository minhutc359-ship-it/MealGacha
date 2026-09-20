import { useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { CollectionPage } from "./CollectionPage"
import { Timeline } from "../components/profile/Timeline"
import { TITLES } from "../domain/titles"
import { getDishRarity } from "../domain/drawReward"
import { useAppStore } from "../store/useAppStore"

type Tab = "overview" | "timeline" | "collection"

export function ProfilePage() {
  const user = useAppStore((state) => state.user)
  const dishes = useAppStore((state) => state.dishes)
  const equip = useAppStore((state) => state.equipTitle)
  const [params, setParams] = useSearchParams()
  const setDisplayName = useAppStore((state) => state.setDisplayName)
  const navigate = useNavigate()
  const tab = (["overview", "timeline", "collection"].includes(params.get("tab") || "") ? params.get("tab") : "overview") as Tab
  const title = TITLES.find((item) => item.id === user.equippedTitleId) || TITLES[0]
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState("")
  const nameInput = useRef<HTMLInputElement>(null)
  const cancelNameEdit = useRef(false)
  const saveName = () => {
    if (!editingName) return
    if (!cancelNameEdit.current) setDisplayName(nameDraft.trim())
    cancelNameEdit.current = false
    setEditingName(false)
  }
  const uniqueOpened = new Set(user.rewards.map((item) => item.dishId)).size
  const uniqueCheckin = new Set(user.timelinePosts.map((item) => item.dishId)).size
  const diamondCount = new Set(user.rewards.filter((item) => getDishRarity(dishes.find((dish) => dish.id === item.dishId) || { id: item.dishId, name: item.dish.name, searchQuery: item.dish.searchQuery, mealSlots: [item.mealSlot], tags: [], weight: 100, active: false }) === "diamond").map((item) => item.dishId)).size
  const selectTab = (value: Tab) => setParams(value === "overview" ? {} : { tab: value })
  return <div className="profile-page">
    <header className={`profile-hero theme-${title.reward.background}`}>
      <small>HỒ SƠ VỊ GIÁC</small>
      <h1>{editingName ? <input ref={nameInput} autoFocus aria-label="Sửa tên hiển thị" className="profile-inline-name" maxLength={32} value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} onBlur={saveName} onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur()
        if (event.key === "Escape") { cancelNameEdit.current = true; event.currentTarget.blur() }
      }} /> : <button className="profile-edit-name" title="Chạm để sửa tên" onClick={() => { cancelNameEdit.current = false; setNameDraft(user.displayName); setEditingName(true); requestAnimationFrame(() => nameInput.current?.focus()) }}>{user.displayName || "Nhà thám hiểm"}<span aria-hidden="true">✎</span></button>}</h1>
      <div className="profile-title-picker">
        <select aria-label="Đổi danh hiệu và giao diện" title="Chạm để đổi danh hiệu và giao diện" value={title.id} onChange={(event) => equip(event.target.value)}>{TITLES.filter((item) => user.unlockedTitleIds.includes(item.id) || item.id === title.id).map((item) => <option value={item.id} key={item.id}>{item.icon} {item.name}</option>)}</select>
        <span aria-hidden="true">⌄</span>
      </div>
    </header>
    <nav className="profile-tabs" aria-label="Hồ sơ vị giác">
      {(["overview", "timeline", "collection"] as Tab[]).map((item) => <button key={item} className={tab === item ? "is-active" : ""} onClick={() => selectTab(item)}>{item === "overview" ? "Tổng quan" : item === "timeline" ? "Dòng thời gian" : "Bộ sưu tập"}</button>)}
    </nav>
    {tab === "overview" && <div className="profile-overview">
      <div className="profile-stats">{[
        [uniqueOpened, "Món đã mở"], [uniqueCheckin, "Món đã check-in"], [user.fusions.length, "Dung hợp"], [diamondCount, "Kim cương"], [user.rewards.filter((item) => item.source === "chest").length, "Rương đã mở"],
      ].map(([value, label]) => <div key={label}><strong>{value}</strong><small>{label}</small></div>)}</div>
      <button className="profile-swipe-cta" onClick={() => navigate("/taste-swipe")}><span>💘</span><div><strong>Khám phá khẩu vị</strong><small>Vuốt vài món để MealGacha hiểu bạn thích gì. Hoàn tất hôm nay nhận thêm 2 chìa.</small></div><b>→</b></button>
      <section className="profile-ledger"><h2>Lịch sử chìa khóa</h2>{[...user.keyTransactions].reverse().slice(0, 30).map((tx) => <div key={tx.id}><span>{tx.reason === "daily_checkin" ? "Điểm danh" : tx.reason === "chest_open" ? "Mở rương" : tx.reason === "daily_quiz" ? "Đoán món" : tx.reason === "taste_swipe" ? "Taste Swipe" : "Điều chỉnh"}</span><b className={tx.amount > 0 ? "is-credit" : ""}>{tx.amount > 0 ? "+" : ""}{tx.amount}</b><small>{new Date(tx.createdAt).toLocaleDateString("vi-VN")}</small></div>)}{user.keyTransactions.length === 0 && <p>Chưa có giao dịch.</p>}</section>
    </div>}
    {tab === "timeline" && <Timeline initialDishId={params.get("dish") || undefined} />}
    {tab === "collection" && <div className="profile-collection"><CollectionPage /></div>}
  </div>
}
