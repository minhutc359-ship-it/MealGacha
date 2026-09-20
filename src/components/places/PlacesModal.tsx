import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { DishSnapshot } from "../../domain/models"
import { useAppStore } from "../../store/useAppStore"
import {
  PlaceResult,
  geocodeOpenStreetMapArea,
  searchNearbyPlaces,
  searchOpenStreetMapPlaces,
} from "../../infrastructure/places/placesGateway"

interface Props {
  dish: DishSnapshot
  onClose(): void
}

type LocationState = "idle" | "requesting" | "granted" | "denied" | "error"

function getPriceDots(level?: number) {
  if (!level) return null
  return "💰".repeat(Math.min(level, 4))
}

export function PlacesModal({ dish, onClose }: Props) {
  const prefs = useAppStore((s) => s.user.preferences)
  const [locState, setLocState] = useState<LocationState>("idle")
  const [manualInput, setManualInput] = useState("")
  const [allPlaces, setAllPlaces] = useState<PlaceResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterNear, setFilterNear] = useState(false)
  const [sortBy, setSortBy] = useState<"recommended" | "distance" | "rating">("recommended")
  const [radiusKm, setRadiusKm] = useState<1 | 3 | 5>(prefs.searchRadiusMeters >= 5000 ? 5 : prefs.searchRadiusMeters <= 1000 ? 1 : 3)
  const [dataSource, setDataSource] = useState<"google" | "osm" | null>(null)
  const [expandedPlace, setExpandedPlace] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const locationRef = useRef<{ lat: number; lng: number } | null>(null)
  const manualRef = useRef<HTMLInputElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    closeRef.current?.focus()
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocState("denied")
      return
    }
    setLocState("requesting")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locationRef.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }
        setLocState("granted")
        searchPlaces(pos.coords.latitude, pos.coords.longitude)
      },
      (err) => {
        setLocState(err.code === 1 ? "denied" : "error")
        setTimeout(() => manualRef.current?.focus(), 100)
      },
      { timeout: 10000, maximumAge: 60000 },
    )
  }

  const searchPlaces = async (lat: number, lng: number) => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)
    setExpandedPlace(null)
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      const fullDish = useAppStore.getState().dishes.find((item) => item.id === dish.id)
      const query = fullDish?.restaurantSearch?.queries?.[0] || dish.searchQuery
      if (apiKey) {
        try {
          const places = await searchNearbyPlaces({ query, lat, lng, radiusMeters: 5000,
            minRating: prefs.minRating, minReviews: prefs.minReviews, apiKey })
          if (requestId !== requestIdRef.current) return
          setAllPlaces(places)
          setDataSource("google")
          return
        } catch { /* A valid OSM lookup remains available if Google is unavailable. */ }
      }
      const places = await searchOpenStreetMapPlaces({ query, lat, lng, radiusMeters: 5000 })
      if (requestId !== requestIdRef.current) return
      setAllPlaces(places)
      setDataSource("osm")
    } catch {
      if (requestId === requestIdRef.current) {
        setAllPlaces([])
        setError("Không thể tải dữ liệu quán lúc này. Thử lại hoặc mở bản đồ.")
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }

  const searchManualArea = async () => {
    const area = manualInput.trim()
    if (!area) { manualRef.current?.focus(); return }
    setLoading(true)
    setError(null)
    try {
      const position = await geocodeOpenStreetMapArea(area)
      if (!position) { setError("Không tìm được khu vực này. Hãy thử ghi thêm tên thành phố."); return }
      locationRef.current = position
      setLocState("granted")
      await searchPlaces(position.lat, position.lng)
    } catch {
      setError("Không thể tìm khu vực lúc này. Hãy thử lại hoặc mở bản đồ.")
    } finally {
      setLoading(false)
    }
  }

  const openMapsSearch = () => {
    const q = encodeURIComponent(
      `${dish.searchQuery}${manualInput ? " " + manualInput : ""}`,
    )
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${q}`,
      "_blank",
      "noopener",
    )
  }

  // Apply filter chips on top of scored results
  const displayed = allPlaces
    .filter((p) => !filterOpen || p.isOpen === true)
    .filter((p) => p.distanceKm <= (filterNear ? 1 : radiusKm))
    .sort((a, b) => sortBy === "distance" ? a.distanceKm - b.distanceKm : sortBy === "rating" ? (b.rating ?? 0) - (a.rating ?? 0) : (b._score ?? 0) - (a._score ?? 0))

  return createPortal(
    <div
      className="places-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(8,12,24,0.92)", backdropFilter: "blur(14px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="places-panel w-full max-w-sm rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: "#0e1628",
          border: "1.5px solid rgba(0,212,255,0.2)",
          maxHeight: "88dvh",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: "rgba(0,212,255,0.1)" }}
        >
          <div>
            <h3
              className="font-extrabold text-base leading-tight"
              style={{ fontFamily: "Exo 2, sans-serif" }}
            >
              Quán {dish.name}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "#6b7f99" }}>
              Gần vị trí của bạn
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Đóng danh sách quán"
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg transition-colors"
            style={{ background: "rgba(107,127,153,0.1)", color: "#6b7f99" }}
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-3">
          {/* Location prompt */}
          {locState === "idle" && (
            <button
              onClick={requestLocation}
              className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all"
              style={{
                background: "linear-gradient(135deg, #00d4ff, #0088cc)",
                color: "#080c18",
                boxShadow: "0 4px 16px rgba(0,212,255,0.3)",
              }}
            >
              📍 Dùng vị trí hiện tại của tôi
            </button>
          )}
          {locState === "idle" && <div className="flex gap-2"><input ref={manualRef} value={manualInput} onChange={(event) => setManualInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void searchManualArea() }} placeholder="Hoặc nhập khu vực: Cầu Giấy, Hà Nội" className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm bg-[#162b3c] text-white" /><button onClick={() => void searchManualArea()} className="px-3 text-[#00d4ff]">Tìm</button></div>}

          {locState === "requesting" && (
            <div
              className="flex items-center justify-center gap-3 py-4 rounded-2xl"
              style={{
                background: "rgba(0,212,255,0.06)",
                border: "1px solid rgba(0,212,255,0.15)",
              }}
            >
              <span className="w-5 h-5 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm" style={{ color: "#00d4ff" }}>
                Đang lấy vị trí...
              </span>
            </div>
          )}
          {locState === "granted" && <div className="flex items-center justify-between gap-2 text-xs text-[#8da2b4]"><span>📍 Đang tìm quanh {manualInput.trim() || "vị trí của bạn"}</span><button type="button" className="text-[#00d4ff]" onClick={() => { setLocState("idle"); setAllPlaces([]); setDataSource(null); setManualInput(""); requestIdRef.current++ }}>Đổi khu vực</button></div>}

          {(locState === "denied" || locState === "error") && (
            <>
              <div
                className="p-3 rounded-xl text-xs flex items-start justify-between gap-2"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#f87171",
                }}
              >
                <span>
                  {locState === "denied"
                    ? "🚫 Quyền vị trí bị từ chối."
                    : "⚠️ Không lấy được vị trí."}{" "}
                  Nhập khu vực để tìm kiếm:
                </span>
                {locState === "error" && (
                  <button
                    onClick={requestLocation}
                    className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-lg"
                    style={{
                      background: "rgba(239,68,68,0.15)",
                      color: "#f87171",
                    }}
                  >
                    Thử lại
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  ref={manualRef}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void searchManualArea()
                  }}
                  placeholder="Quận 1, TP.HCM..."
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: "rgba(22,32,64,0.8)",
                    border: "1px solid rgba(0,212,255,0.2)",
                    color: "#e8edf5",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(0,212,255,0.5)"
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(0,212,255,0.2)"
                  }}
                />
                <button
                  onClick={() => void searchManualArea()}
                  className="px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0"
                  style={{
                    background: "rgba(0,212,255,0.15)",
                    color: "#00d4ff",
                    border: "1px solid rgba(0,212,255,0.3)",
                  }}
                >
                  Tìm
                </button>
              </div>
            </>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-10 h-10 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm" style={{ color: "#6b7f99" }}>
                Đang tìm quán ngon gần bạn...
              </p>
            </div>
          )}

          {error && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#f87171",
              }}
            >
              {error}
              <button onClick={openMapsSearch} className="underline ml-2">
                Mở Maps thay thế
              </button>
            </div>
          )}

          {/* Filter chips */}
          {allPlaces.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                {dataSource === "google" && <FilterChip active={filterOpen} onClick={() => setFilterOpen(!filterOpen)} label="Đang mở" />}
                <FilterChip
                  active={filterNear}
                  onClick={() => setFilterNear(!filterNear)}
                  label="≤ 1 km"
                />
                <select aria-label="Sắp xếp quán" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="min-w-0 text-xs bg-[#10293b] text-[#b4d3de] p-2 rounded-xl"><option value="recommended">Gợi ý</option><option value="distance">Gần nhất</option>{dataSource === "google" && <option value="rating">Rating cao</option>}</select>
                <select aria-label="Bán kính" value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value) as 1 | 3 | 5)} className="text-xs bg-[#10293b] text-[#b4d3de] p-2 rounded-xl"><option value={1}>1 km</option><option value={3}>3 km</option><option value={5}>5 km</option></select>
                <button
                  onClick={openMapsSearch}
                  className="ml-auto text-xs flex-shrink-0"
                  style={{ color: "#00d4ff" }}
                >
                  Mở Maps →
                </button>
              </div>
            </>
          )}

          {/* Place cards */}
          {displayed.length > 0 && (
            <>
              {displayed.map((place) => (
                <PlaceCard key={`${place.name}:${place.lat}:${place.lng}`} place={place} expanded={expandedPlace === `${place.name}:${place.lat}:${place.lng}`} onToggle={() => setExpandedPlace(expandedPlace === `${place.name}:${place.lat}:${place.lng}` ? null : `${place.name}:${place.lat}:${place.lng}`)} />
              ))}

              {/* Attribution — required by Google Maps Platform TOS */}
              {dataSource === "google" && (
                <div className="flex items-center justify-center gap-2 pt-1 pb-2">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-3 h-3 fill-current"
                    style={{ color: "#6b7f99" }}
                  >
                    <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5S13.4 11.5 12 11.5z" />
                  </svg>
                  <span className="text-xs" style={{ color: "#6b7f99" }}>
                    Dữ liệu từ{" "}
                    <strong style={{ color: "#a8b8d0" }}>Google Maps</strong>
                  </span>
                </div>
              )}
              {dataSource === "osm" && <p className="text-xs text-center text-[#8da2b4] py-2">Dữ liệu © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap contributors</a>. Chưa có điểm đánh giá; hãy kiểm tra thực đơn trước khi đến.</p>}
            </>
          )}

          {allPlaces.length > 0 && displayed.length === 0 && !loading && (
            <div className="text-center py-4">
              <p className="text-sm mb-2" style={{ color: "#6b7f99" }}>
                Không có quán khớp bộ lọc.
              </p>
              <button
                onClick={() => {
                  setFilterOpen(false)
                  setFilterNear(false)
                }}
                className="text-sm"
                style={{ color: "#00d4ff" }}
              >
                Bỏ bộ lọc
              </button>
            </div>
          )}

          {locState === "granted" &&
            allPlaces.length === 0 &&
            !loading &&
            !error && (
              <div className="text-center py-6">
                <p className="text-sm mb-1" style={{ color: "#6b7f99" }}>
                  Không tìm thấy quán đủ tiêu chí.
                </p>
                <button
                  onClick={openMapsSearch}
                  className="text-sm"
                  style={{ color: "#00d4ff" }}
                >
                  Tìm trên Google Maps →
                </button>
              </div>
            )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick(): void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0"
      style={
        active
          ? {
              background: "rgba(0,212,255,0.15)",
              color: "#00d4ff",
              border: "1px solid rgba(0,212,255,0.4)",
            }
          : {
              background: "rgba(14,22,40,0.6)",
              color: "#6b7f99",
              border: "1px solid rgba(107,127,153,0.2)",
            }
      }
    >
      {label}
    </button>
  )
}

function PlaceCard({ place, expanded, onToggle }: { place: PlaceResult; expanded: boolean; onToggle(): void }) {
  const box = [place.lng - 0.004, place.lat - 0.003, place.lng + 0.004, place.lat + 0.003].join(",")
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?${new URLSearchParams({ bbox: box, layer: "mapnik", marker: `${place.lat},${place.lng}` })}`
  return (
    <div
      className="p-3.5 rounded-2xl transition-all"
      onClick={(event) => { if (!(event.target as Element).closest("a, button, iframe")) onToggle() }}
      style={{
        background: "rgba(22,32,64,0.5)",
        border: "1px solid rgba(0,212,255,0.08)",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <button type="button" onClick={onToggle} aria-expanded={expanded} className="text-sm font-bold leading-tight flex-1 text-left">{place.name}</button>
        {place.isOpen !== undefined && (
          <span
            className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
            style={
              place.isOpen
                ? { background: "rgba(34,197,94,0.12)", color: "#4ade80" }
                : { background: "rgba(239,68,68,0.1)", color: "#f87171" }
            }
          >
            {place.isOpen ? "Mở" : "Đóng"}
          </span>
        )}
      </div>
      <p className="text-xs mb-2 leading-relaxed" style={{ color: "#6b7f99" }}>
        {place.address}
      </p>
      <div className="flex items-center gap-3 text-xs mb-3">
        {place.rating !== undefined && place.rating > 0 ? (
          <>
            <span className="font-bold" style={{ color: "#f5a623" }}>
              ★ {place.rating.toFixed(1)}
            </span>
            <span style={{ color: "#6b7f99" }}>
              ({(place.userRatingCount ?? 0).toLocaleString()})
            </span>
          </>
        ) : <span style={{ color: "#6b7f99" }}>Chưa có đánh giá</span>}
        <span style={{ color: "#6b7f99" }}>
          📍 {place.distanceKm.toFixed(1)} km
        </span>
        {place.priceLevel && (
          <span style={{ color: "#6b7f99" }}>
            {getPriceDots(place.priceLevel)}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" aria-expanded={expanded} onClick={onToggle} className="px-3 py-2 rounded-xl text-xs font-bold transition-all" style={{ background:"rgba(0,212,255,0.12)", color:"#00d4ff", border:"1px solid rgba(0,212,255,0.2)" }}>{expanded ? "Ẩn bản đồ ↑" : "Xem bản đồ ↓"}</button>
        <a
          href={place.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 block text-center py-2 rounded-xl text-xs font-bold transition-all"
          style={{
            background: "rgba(0,212,255,0.12)",
            color: "#00d4ff",
            border: "1px solid rgba(0,212,255,0.2)",
          }}
        >
          Xem trên Maps
        </a>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0"
          style={{
            background: "rgba(245,166,35,0.12)",
            color: "#f5a623",
            border: "1px solid rgba(245,166,35,0.2)",
          }}
        >
          Chỉ đường
        </a>
      </div>
      {expanded && <div className="mt-3"><iframe className="places-map" src={mapUrl} loading="lazy" title={`Bản đồ quán ${place.name}`} referrerPolicy="no-referrer" /><p className="text-[11px] mt-1 text-[#8da2b4]">Bản đồ © OpenStreetMap contributors</p></div>}
    </div>
  )
}
