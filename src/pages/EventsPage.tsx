import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { EVENTS, getDevEventOverride, isEventActive, setDevEventOverride } from "../domain/events"
import { getDateKey } from "../domain/dateKey"
import { useAppStore } from "../store/useAppStore"
import { FoodImage } from "../components/food/FoodImage"

export function EventsPage() {
  const dishes = useAppStore((state) => state.dishes)
  const user = useAppStore((state) => state.user)
  const [override, setOverride] = useState(getDevEventOverride() || "auto")
  const navigate = useNavigate()
  return <div className="events-page"><header><small>LIMITED BANNERS</small><h1>Sự kiện vị giác</h1><p>Khám phá các banner theo mùa. Món đã mở vẫn ở trong bộ sưu tập sau khi event kết thúc.</p></header>
    {import.meta.env.DEV && <label className="event-dev">DEV event override <select value={override} onChange={(event) => { setOverride(event.target.value); setDevEventOverride(event.target.value) }}><option value="auto">Auto</option><option value="none">Không có sự kiện</option>{EVENTS.map((event) => <option value={event.id} key={event.id}>{event.name.vi}</option>)}</select></label>}
    <div className="event-grid">{EVENTS.map((event) => {
      const active = isEventActive(event, getDateKey(), override)
      const eventDishes = event.dishIds.map((id) => dishes.find((dish) => dish.id === id)).filter((dish) => Boolean(dish))
      const unlocked = eventDishes.filter((dish) => user.rewards.some((reward) => reward.dishId === dish?.id)).length
      return <article className={`event-card ${event.theme.className}`} key={event.id}>
        <div className="event-art" style={{ backgroundImage: `linear-gradient(90deg,rgba(2,9,20,.95),rgba(2,9,20,.2)),url(${event.bannerImage})` }}><span>{event.icon}</span><small>{active ? "ĐANG DIỄN RA" : "BANNER THEO MÙA"}</small><h2>{event.name.vi}</h2><p>{event.description.vi}</p></div>
        <div className="event-content"><strong>{unlocked}/{eventDishes.length} món đã mở</strong><div>{eventDishes.map((dish) => dish && <span key={dish.id} title={dish.name}><FoodImage dishId={dish.id} name={dish.name} variant="thumb" /></span>)}</div><button disabled={!active} onClick={() => navigate(`/?event=${event.id}`)}>{active ? "Mở banner sự kiện →" : `${event.startsAt?.split("-").reverse().join("/")} – ${event.endsAt?.split("-").reverse().join("/")}`}</button></div>
      </article>
    })}</div>
  </div>
}
