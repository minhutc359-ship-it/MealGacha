import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { DishSnapshot } from "../../domain/models"
import { useAppStore } from "../../store/useAppStore"
import { FoodImage } from "../food/FoodImage"
import { directionsUrl, embeddedMapUrl, findNearbyRestaurants, geocodeOpenStreetMapAreas, mapsSearchUrl, normalizePlaceText, phoneHref, type AreaResult, type PlaceResult, type PlaceSearchResult } from "../../infrastructure/places/placesGateway"
import "./places.css"

interface Props { dish: DishSnapshot; onClose(): void }
type Center = { lat: number; lng: number; label: string }
type Phase = "idle" | "locating" | "area" | "searching"
const PRESETS: Center[] = [
  { label: "Trung tâm Hà Nội", lat: 21.02833, lng: 105.85404 },
  { label: "Trung tâm TP.HCM", lat: 10.77689, lng: 106.70081 },
  { label: "Trung tâm Đà Nẵng", lat: 16.06778, lng: 108.22083 },
]
function errorText(error: unknown): string { return error instanceof Error ? error.message : "Không thể tải quán lúc này. Hãy thử lại hoặc mở Google Maps." }

export function PlacesModal({ dish, onClose }: Props) {
  const radiusPreference = useAppStore(s => s.user.preferences.searchRadiusMeters)
  const [radius, setRadius] = useState<1 | 3 | 5>(radiusPreference <= 1000 ? 1 : radiusPreference >= 5000 ? 5 : 3)
  const [phase, setPhase] = useState<Phase>("idle")
  const [editingArea, setEditingArea] = useState(true)
  const [input, setInput] = useState("")
  const [center, setCenter] = useState<Center | null>(null)
  const [areas, setAreas] = useState<AreaResult[]>([])
  const [results, setResults] = useState<PlaceSearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<"matches" | "all">("matches")
  const [sort, setSort] = useState<"relevance" | "distance">("relevance")
  const [filter, setFilter] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(40)
  const [copied, setCopied] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const controller = useRef<AbortController | null>(null)
  const sequence = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const busy = phase !== "idle"
  const fullDish = useAppStore.getState().dishes.find(d => d.id === dish.id)
  const query = fullDish?.restaurantSearch?.queries[0] || dish.searchQuery || dish.name

  useEffect(() => {
    const focus = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    dialog.current?.showModal()
    return () => {
      sequence.current++; controller.current?.abort()
      if (timer.current) clearTimeout(timer.current)
      document.body.style.overflow = overflow
      focus?.focus()
    }
  }, [])
  function begin(next: Phase) {
    controller.current?.abort()
    const abort = new AbortController(); controller.current = abort
    const id = ++sequence.current
    setPhase(next); setError(null); setAreas([]); setExpanded(null)
    return { id, signal: abort.signal }
  }
  function current(id: number) { return id === sequence.current && !controller.current?.signal.aborted }
  function cancel() { sequence.current++; controller.current?.abort(); setPhase("idle") }
  async function search(position: Center) {
    const request = begin("searching")
    setCenter(position); setResults(null); setFilter(""); setVisibleCount(40); setEditingArea(false)
    try {
      const data = await findNearbyRestaurants({ query, aliases: [dish.name, ...(fullDish?.restaurantSearch?.queries ?? [])], cuisineTags: fullDish?.restaurantSearch?.cuisineTags, ...position, radiusMeters: 5000, signal: request.signal })
      if (!current(request.id)) return
      setResults(data); setScope(data.places.some(p => p.match !== "nearby" && p.distanceKm <= radius) ? "matches" : "all")
    } catch (e) { if (current(request.id)) setError(errorText(e)) }
    finally { if (current(request.id)) setPhase("idle") }
  }
  async function locate() {
    const request = begin("locating")
    setResults(null); setCenter(null)
    if (!navigator.geolocation) { setError("Thiết bị không hỗ trợ vị trí. Nhập khu vực hoặc chọn trung tâm thành phố."); setPhase("idle"); return }
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10_000, maximumAge: 60_000, enableHighAccuracy: false }))
      if (current(request.id)) await search({ lat: position.coords.latitude, lng: position.coords.longitude, label: "vị trí hiện tại của bạn" })
    } catch (e) {
      if (current(request.id)) { setError((e as GeolocationPositionError).code === 1 ? "Bạn chưa cho phép vị trí. Hãy nhập khu vực hoặc chọn thành phố bên dưới." : "Chưa lấy được vị trí. Bạn có thể nhập khu vực để tiếp tục."); setPhase("idle") }
    }
  }
  async function geocode(event: React.FormEvent) {
    event.preventDefault()
    const request = begin("area")
    setCenter(null); setResults(null)
    try {
      const found = await geocodeOpenStreetMapAreas(input, request.signal)
      if (!current(request.id)) return
      setAreas(found)
      if (!found.length) setError("Chưa tìm thấy khu vực tại Việt Nam. Thử thêm tên thành phố hoặc chọn trung tâm thành phố.")
    } catch (e) { if (current(request.id)) setError(errorText(e)) }
    finally { if (current(request.id)) setPhase("idle") }
  }
  async function copy(place: PlaceResult) {
    const id = sequence.current
    try {
      await navigator.clipboard.writeText(`${place.name}\n${place.address}\n${place.lat},${place.lng}\n${place.mapsUrl}`)
      if (id !== sequence.current) return
      setCopied(place.id)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(null), 2200)
    } catch { if (id !== sequence.current) return; setError("Trình duyệt chưa cho phép sao chép. Bạn vẫn có thể mở bản đồ hoặc chỉ đường.") }
  }
  const withinRadius = results?.places.filter(p => p.distanceKm <= radius) ?? []
  const matched = withinRadius.filter(p => p.match !== "nearby")
  const places = (scope === "matches" ? matched : withinRadius)
    .filter(p => normalizePlaceText(`${p.name} ${p.address}`).includes(normalizePlaceText(filter)))
    .sort((a,b) => sort === "distance" ? a.distanceKm-b.distanceKm : b._score-a._score || a.distanceKm-b.distanceKm)
  const mapsUrl = mapsSearchUrl(query, input, center ?? undefined)
  return createPortal(
    <dialog ref={dialog} className="places-dialog" aria-labelledby="places-title" onCancel={e => { e.preventDefault(); onClose() }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="places-shell">
        <header className="places-heading">
          <FoodImage className="places-dish-art" dishId={dish.id} name={dish.name} variant="full" />
          <div><small>TỪ VỊ LINH ĐẾN BÀN ĂN</small><h2 id="places-title">Tìm quán {dish.name}</h2><p>Chọn nơi để thưởng thức món ngoài đời.</p></div>
          <button type="button" className="places-close" aria-label="Đóng danh sách quán" onClick={onClose}>×</button>
        </header>
        <div className="places-scroll">
          {(!center || editingArea) && <section className="places-location" aria-label="Chọn khu vực tìm quán">
            <button className="places-primary" disabled={busy} onClick={() => void locate()}>◎ Dùng vị trí hiện tại</button>
            <form onSubmit={e => void geocode(e)}><label htmlFor="places-area">Hoặc tìm khu vực tại Việt Nam</label><div><input id="places-area" maxLength={160} value={input} onChange={e => { setInput(e.target.value); setAreas([]) }} placeholder="VD: Cầu Giấy, Hà Nội" /><button type="submit" disabled={busy || input.trim().length < 2}>Tìm khu vực</button></div></form>
            <div className="places-presets" aria-label="Chọn nhanh thành phố">{PRESETS.map(p => <button key={p.label} disabled={busy} onClick={() => void search(p)}>{p.label.replace("Trung tâm ", "")}</button>)}</div>
            {!!areas.length && <div className="places-areas"><p>Chọn đúng khu vực của bạn:</p>{areas.map(area => <button key={area.id} onClick={() => void search({ ...area, label: area.label })}><span>→</span><span>{area.label}<small>Chọn khu vực này →</small></span></button>)}</div>}
            <p className="places-privacy">Chỉ xin vị trí khi bạn bấm nút. Tọa độ được gửi tới nguồn bản đồ để tìm quán, không lưu vào tiến trình.</p>
          </section>}
          {busy && <div className="places-loading" role="status"><span className="places-spinner" /><p>{phase === "locating" ? "Đang lấy vị trí…" : phase === "area" ? "Đang tìm khu vực…" : "Đang tìm quán quanh khu vực…"}</p><button onClick={cancel}>Dừng tìm</button></div>}
          {error && <div className="places-message is-error" role="alert"><p>{error}</p>{center && !busy && <button onClick={() => void search(center)}>Thử lại tìm quán</button>}</div>}
          {center && <div className="places-center"><div className="places-center-copy"><span>Quanh <strong>{center.label}</strong></span><button aria-expanded={editingArea} onClick={() => { setEditingArea(v => !v); dialog.current?.querySelector(".places-scroll")?.scrollTo({ top: 0 }) }}>{editingArea ? "Ẩn chọn khu vực" : "Đổi khu vực"}</button></div><label>Bán kính<select aria-label="Bán kính tìm quán" value={radius} onChange={e => { setRadius(Number(e.target.value) as 1 | 3 | 5); setVisibleCount(40) }}><option value={1}>1 km</option><option value={3}>3 km</option><option value={5}>5 km</option></select></label></div>}
          {results && !busy && <>
            {results.warning && <p className="places-message" role="status">{results.warning}</p>}
            <div className="places-filters"><div className="places-scopes"><button aria-pressed={scope === "matches"} onClick={() => { setScope("matches"); setVisibleCount(40) }}>Khớp món <b>{matched.length}</b></button><button aria-pressed={scope === "all"} onClick={() => { setScope("all"); setVisibleCount(40) }}>Tất cả quán <b>{withinRadius.length}</b></button></div><select aria-label="Sắp xếp quán" value={sort} onChange={e => setSort(e.target.value as typeof sort)}><option value="relevance">Liên quan đến món</option><option value="distance">Gần nhất</option></select></div>
            {!!withinRadius.length && <input className="places-name-filter" aria-label="Lọc tên quán hoặc địa chỉ" placeholder="Lọc tên quán hoặc địa chỉ…" value={filter} onChange={e => { setFilter(e.target.value); setVisibleCount(40) }} />}
            <p className="places-data-note">Tên/thông tin khớp chỉ là gợi ý, chưa xác nhận thực đơn. Nguồn này không có sao đánh giá hay trạng thái mở cửa trực tiếp.</p>
            {!places.length && <div className="places-empty"><span>→</span><h3>{filter ? "Chưa có quán khớp bộ lọc" : scope === "matches" ? "Chưa có quán khớp từ khóa món" : "Chưa có quán trong bán kính này"}</h3><p>{scope === "matches" && withinRadius.length ? "Bạn có thể xem quán lân cận hoặc tìm thêm trên Google Maps." : "Dữ liệu cộng đồng có thể còn thiếu. Thử bán kính 5 km hoặc tìm thêm trên Google Maps."}</p>{(scope === "matches" && withinRadius.length > 0 || filter) && <button onClick={() => { setScope("all"); setFilter("") }}>Xem tất cả quán</button>}</div>}
            <div className="places-results" aria-label="Danh sách quán">{places.slice(0,visibleCount).map(place => <article className="places-card" key={place.id}>
              <div className="places-card-title"><h3>{place.name}</h3><strong>{place.distanceKm < 1 ? `${Math.round(place.distanceKm*1000)} m` : `${place.distanceKm.toFixed(1)} km`}</strong></div>
              <span className={`places-match is-${place.match}`}>{place.matchLabel}</span><p>{place.address}</p>
              {place.openingHours && <p className="places-hours">Giờ ghi trên OSM: {place.openingHours}</p>}
              <div className="places-card-actions"><button aria-expanded={expanded === place.id} onClick={() => setExpanded(expanded === place.id ? null : place.id)}>{expanded === place.id ? "Ẩn bản đồ" : "Xem bản đồ"}</button><a href={directionsUrl(place)} target="_blank" rel="noopener noreferrer">Chỉ đường ↗</a><button onClick={() => void copy(place)}>{copied === place.id ? "Đã sao chép ✓" : "Sao chép"}</button></div>
              <div className="places-contacts">{phoneHref(place.phone) && <a href={phoneHref(place.phone)}>Gọi quán</a>}{place.website && <a href={place.website} target="_blank" rel="noopener noreferrer">Website ↗</a>}<a href={place.mapsUrl} target="_blank" rel="noopener noreferrer">Thông tin OSM ↗</a><a href={directionsUrl(place,"walking")} target="_blank" rel="noopener noreferrer">Đi bộ ↗</a></div>
              {expanded === place.id && <iframe className="places-map" src={embeddedMapUrl(place)} loading="lazy" title={`Bản đồ ${place.name}`} referrerPolicy="strict-origin-when-cross-origin" />}
            </article>)}</div>
            {places.length > visibleCount && <button className="places-more" onClick={() => setVisibleCount(v => v + 40)}>Xem thêm quán · đang hiện {visibleCount}/{places.length}</button>}
            <p className="places-attribution">Dữ liệu © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> · Photon / Private.coffee<br />Khoảng cách đường chim bay · dữ liệu tạm lưu 10 phút.</p>
          </>}
        </div>
        <footer className="places-footer"><span>Muốn xem thêm quán và đánh giá?</span><a href={mapsUrl} target="_blank" rel="noopener noreferrer">Tìm trên Google Maps ↗</a></footer>
      </div>
    </dialog>, document.body,
  )
}
