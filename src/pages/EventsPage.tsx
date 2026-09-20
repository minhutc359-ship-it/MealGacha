import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { EVENTS, LOCAL_EVENTS, getDevEventOverride, getFeaturedEvents, setDevEventOverride } from "../domain/events"
import { useAppStore } from "../store/useAppStore"
import { FoodImage } from "../components/food/FoodImage"

function dateLabel(date?: string): string {
  return date?.slice(0, 10).split("-").reverse().join("/") ?? ""
}

export function EventsPage() {
  const dishes = useAppStore((state) => state.dishes)
  const user = useAppStore((state) => state.user)
  const [override, setOverride] = useState(getDevEventOverride() || "auto")
  const navigate = useNavigate()
  const events = getFeaturedEvents(dishes)

  return <div className="events-page">
    <header><small>LIMITED BANNERS</small><h1>Sự kiện vị giác</h1><p>Mỗi banner có món đặc trưng chỉ mở hoặc ghép được khi sự kiện diễn ra. Món đã nhận vẫn ở trong bộ sưu tập sau khi kết thúc.</p></header>
    {import.meta.env.DEV && <label className="event-dev">Xem thử sự kiện <select value={override} onChange={(event) => { setOverride(event.target.value); setDevEventOverride(event.target.value) }}><option value="auto">Theo thời gian</option><option value="none">Không có sự kiện</option>{[...LOCAL_EVENTS.map((event) => ({ id: event.id, title: event.title })), ...EVENTS.map((event) => ({ id: event.id, title: event.name.vi }))].map((event) => <option value={event.id} key={event.id}>{event.title}</option>)}</select></label>}
    <div className="event-grid">{events.map((event) => {
      const eventDishes = event.dishIds.map((id) => dishes.find((dish) => dish.id === id)).filter((dish) => Boolean(dish))
      const unlocked = eventDishes.filter((dish) => user.rewards.some((reward) => reward.dishId === dish?.id)).length
      const past = event.endsAt ? new Date(event.endsAt).getTime() < Date.now() : false
      return <article className={`event-card ${event.themeClass}`} key={event.id}>
        <div className="event-art" style={{ backgroundImage: `linear-gradient(90deg,rgba(2,9,20,.94),rgba(2,9,20,.27)),${event.bannerImage ? `url(${event.bannerImage})` : "linear-gradient(125deg,#243e54,#11162f)"}` }}><span>{event.icon}</span><small>{event.active ? "ĐANG DIỄN RA" : past ? "ĐÃ KẾT THÚC" : "SẮP DIỄN RA"}</small><h2>{event.title}</h2><p>{event.description}</p></div>
        <div className="event-content"><strong>{unlocked}/{eventDishes.length} món đã mở</strong><div>{eventDishes.map((dish) => dish && <span key={dish.id} title={dish.name}><FoodImage dishId={dish.id} name={dish.name} imageUrl={dish.imageUrl} variant="thumb" /></span>)}</div><button disabled={!event.active || eventDishes.length === 0} onClick={() => navigate(`/?event=${event.id}`)}>{event.active ? "Mở banner sự kiện →" : `${dateLabel(event.startsAt)} – ${dateLabel(event.endsAt)}`}</button></div>
      </article>
    })}</div>
    <Link className="event-collection-link" to="/achievements?tab=collection&banner=events">Xem thành tựu sự kiện →</Link>
  </div>
}
