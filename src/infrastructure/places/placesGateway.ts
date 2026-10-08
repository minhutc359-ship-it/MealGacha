/** Keyless OSM discovery. Coordinates and caches stay in memory, never in saved progress. */
export interface PlaceResult {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  distanceKm: number
  mapsUrl: string
  match: "name" | "cuisine" | "nearby"
  matchLabel: string
  openingHours?: string
  phone?: string
  website?: string
  cuisine?: string
  _score: number
}
export interface AreaResult { id: string; name: string; label: string; lat: number; lng: number }
export interface OpenStreetMapSearchOptions {
  query: string
  aliases?: string[]
  cuisineTags?: string[]
  lat: number
  lng: number
  radiusMeters: number
  signal?: AbortSignal
}
export interface PlaceSearchResult {
  places: PlaceResult[]
  partial: boolean
  warning?: string
  fetchedAt: number
}
interface PhotonFeature {
  geometry?: { coordinates?: number[] }
  properties?: Record<string, unknown>
}
interface OsmElement {
  type: "node" | "way" | "relation"
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}
export class PlacesError extends Error {
  constructor(public code: "network" | "timeout" | "rate" | "invalid", message: string) { super(message); this.name = "PlacesError" }
}
export const PHOTON_URL = "https://photon.komoot.io/api/"
// Public instance permits small projects without keys. No automatic retry loop or endpoint rotation.
export const OVERPASS_URL = "https://overpass.private.coffee/api/interpreter"
const TTL = 10 * 60_000
const nearbyCache = new Map<string, { at: number; data: OsmElement[] }>()
const textCache = new Map<string, { at: number; data: PhotonFeature[] }>()
const areaCache = new Map<string, { at: number; data: AreaResult[] }>()
const cooldown = new Map<string, number>()

export function clearPlacesCache() { nearbyCache.clear(); textCache.clear(); areaCache.clear(); cooldown.clear() }
function put<T>(map: Map<string, T>, key: string, data: T) {
  if (map.size >= 24) map.delete(map.keys().next().value!)
  map.set(key, data)
}
function aborted(signal?: AbortSignal) { if (signal?.aborted) throw new DOMException("Cancelled", "AbortError") }
async function fetchJson<T>(url: string, init: RequestInit, signal?: AbortSignal, timeout = 12_000): Promise<T> {
  aborted(signal)
  const host = new URL(url).host
  if ((cooldown.get(host) ?? 0) > Date.now()) throw new PlacesError("rate", "Nguồn bản đồ đang giới hạn lượt tìm. Chờ ít nhất 30 giây hoặc mở Google Maps.")
  const controller = new AbortController()
  const cancel = () => controller.abort()
  signal?.addEventListener("abort", cancel, { once: true })
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, timeout)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, referrerPolicy: "strict-origin-when-cross-origin" })
    if (response.status === 429 || response.status === 406) {
      const retry = Number(response.headers.get("Retry-After"))
      cooldown.set(host, Date.now() + Math.max(30, Number.isFinite(retry) ? retry : 30) * 1000)
      throw new PlacesError("rate", "Nguồn bản đồ đang giới hạn lượt tìm. Chờ ít nhất 30 giây hoặc mở Google Maps.")
    }
    if (!response.ok) throw new PlacesError("network", "Nguồn dữ liệu quán đang bận. Bạn có thể thử lại hoặc mở Google Maps.")
    return await response.json() as T
  } catch (error) {
    aborted(signal)
    if (timedOut) throw new PlacesError("timeout", "Tìm quán mất nhiều thời gian. Thử lại hoặc mở Google Maps để xem thêm.")
    if (error instanceof PlacesError) throw error
    throw new PlacesError("network", "Không kết nối được dữ liệu quán. Kiểm tra mạng hoặc mở Google Maps.")
  } finally { clearTimeout(timer); signal?.removeEventListener("abort", cancel) }
}
function coordinates(lat: unknown, lng: unknown): lat is number {
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}
function string(value: unknown): string { return typeof value === "string" ? value.trim() : "" }
export function normalizePlaceText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ")
}
const generic = new Set(["quan", "nha", "hang", "mon", "ngon", "restaurant", "restaurants", "near", "me", "gan", "day", "vietnamese", "vietnam", "asian"])
function phrase(text: string): string { return normalizePlaceText(text).split(" ").filter(w => !generic.has(w)).join(" ") }
function contains(text: string, part: string): boolean { return !!part && (` ${text} `).includes(` ${part} `) }
export function matchDish(name: string, tags: Record<string, string>, options: Pick<OpenStreetMapSearchOptions, "query" | "aliases" | "cuisineTags">): Pick<PlaceResult, "match" | "matchLabel" | "_score"> {
  const aliases = [...new Set([options.query, ...(options.aliases ?? [])].map(phrase).filter(Boolean))]
  const title = normalizePlaceText(name)
  if (aliases.some(a => contains(title, a))) return { match: "name", matchLabel: "Tên quán khớp từ khóa món", _score: 2 }
  const description = normalizePlaceText(`${tags.cuisine ?? ""} ${tags.description ?? ""} ${tags.menu ?? ""}`)
  const cuisineAliases = [...aliases, ...(options.cuisineTags ?? []).map(phrase).filter(Boolean)]
  // Broad Vietnamese/Asian cuisine alone never implies a venue serves a selected dish.
  if (cuisineAliases.some(a => contains(description, a))) return { match: "cuisine", matchLabel: "Thông tin ẩm thực liên quan", _score: 1 }
  return { match: "nearby", matchLabel: "Quán lân cận · chưa xác nhận món", _score: 0 }
}
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)))
}
function address(tags: Record<string, string>): string {
  return [tags["addr:full"] || [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "), tags["addr:suburb"] || tags["addr:district"], tags["addr:city"]].filter(Boolean).join(", ") || "OSM chưa có địa chỉ · dùng ghim tọa độ để chỉ đường"
}
export function safeWebsite(value?: string): string | undefined {
  if (!value) return undefined
  try { const url = new URL(value.startsWith("www.") ? `https://${value}` : value); return ["http:", "https:"].includes(url.protocol) ? url.href : undefined } catch { return undefined }
}
export function phoneHref(value?: string): string | undefined {
  const number = value?.split(";")[0]?.replace(/[^+0-9]/g, "")
  return number && /^\+?\d{6,16}$/.test(number) ? `tel:${number}` : undefined
}
export function directionsUrl(place: Pick<PlaceResult, "lat" | "lng">, mode: "walking" | "driving" = "driving"): string {
  return `https://www.google.com/maps/dir/?${new URLSearchParams({ api: "1", destination: `${place.lat},${place.lng}`, travelmode: mode })}`
}
export function mapsSearchUrl(query: string, area?: string, location?: { lat: number; lng: number }): string {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: `${query.trim()} ${location ? `near ${location.lat},${location.lng}` : area?.trim() ?? ""}`.trim() })}`
}
export function embeddedMapUrl(place: Pick<PlaceResult, "lat" | "lng">): string {
  const latPad = .003, lngPad = latPad / Math.max(.2, Math.cos(place.lat * Math.PI / 180))
  return `https://www.openstreetmap.org/export/embed.html?${new URLSearchParams({ bbox: [place.lng-lngPad,place.lat-latPad,place.lng+lngPad,place.lat+latPad].join(","), layer: "mapnik", marker: `${place.lat},${place.lng}` })}`
}
export async function geocodeOpenStreetMapAreas(query: string, signal?: AbortSignal): Promise<AreaResult[]> {
  const q = query.trim().slice(0, 160)
  if (q.length < 2) throw new PlacesError("invalid", "Nhập tên phường/quận và thành phố để tìm khu vực.")
  aborted(signal)
  const key = normalizePlaceText(q), cached = areaCache.get(key)
  if (cached && Date.now() - cached.at < TTL) return cached.data
  // Omit unsupported forced language; Photon falls back to local OSM names.
  const params = new URLSearchParams({ q, limit: "5", countrycode: "VN" })
  const payload = await fetchJson<{ features?: PhotonFeature[] }>(`${PHOTON_URL}?${params}`, {}, signal)
  if (!Array.isArray(payload.features)) throw new PlacesError("network", "Nguồn khu vực trả dữ liệu không hợp lệ.")
  const seen = new Set<string>()
  const data = payload.features.flatMap((f): AreaResult[] => {
    const [lng, lat] = f.geometry?.coordinates ?? [], p = f.properties ?? {}
    if (!coordinates(lat, lng) || (string(p.countrycode) && string(p.countrycode).toUpperCase() !== "VN")) return []
    const name = string(p.name) || string(p.street) || string(p.city)
    if (!name) return []
    const id = `${lat.toFixed(5)},${lng.toFixed(5)}`
    if (seen.has(id)) return []; seen.add(id)
    const label = [...new Set([name, string(p.district), string(p.city), string(p.state)].filter(Boolean))].join(", ")
    return [{ id, name, label, lat, lng: lng as number }]
  })
  put(areaCache, key, { at: Date.now(), data }); return data
}
export async function geocodeOpenStreetMapArea(query: string): Promise<{ lat: number; lng: number } | null> {
  const first = (await geocodeOpenStreetMapAreas(query))[0]
  return first ? { lat: first.lat, lng: first.lng } : null
}
function osmPlace(element: OsmElement, options: OpenStreetMapSearchOptions): PlaceResult | null {
  const tags = element.tags ?? {}, lat = element.lat ?? element.center?.lat, lng = element.lon ?? element.center?.lon
  const name = tags.name?.trim()
  if (!name || !coordinates(lat, lng) || !["node", "way", "relation"].includes(element.type) || !Number.isSafeInteger(element.id)) return null
  if (!["restaurant", "fast_food", "cafe", "food_court", "ice_cream"].includes(tags.amenity) || tags.access === "private" || tags.disused === "yes" || tags["disused:amenity"]) return null
  const distanceKm = haversine(options.lat, options.lng, lat, lng as number)
  if (distanceKm > options.radiusMeters / 1000) return null
  return { id: `${element.type}/${element.id}`, name, address: address(tags), lat, lng: lng as number, distanceKm,
    mapsUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`, ...matchDish(name, tags, options),
    openingHours: tags.opening_hours, phone: tags["contact:phone"] || tags.phone,
    website: safeWebsite(tags["contact:website"] || tags.website), cuisine: tags.cuisine }
}
function photonPlace(feature: PhotonFeature, options: OpenStreetMapSearchOptions): PlaceResult | null {
  const [lng, lat] = feature.geometry?.coordinates ?? [], p = feature.properties ?? {}
  const type = ({ N: "node", W: "way", R: "relation" } as Record<string, "node" | "way" | "relation">)[string(p.osm_type)]
  const id = p.osm_id
  if (!coordinates(lat, lng) || !type || typeof id !== "number" || p.osm_key !== "amenity") return null
  return osmPlace({ type, id, lat, lon: lng as number, tags: {
    name: string(p.name), amenity: string(p.osm_value), "addr:street": string(p.street), "addr:housenumber": string(p.housenumber),
    "addr:district": string(p.district), "addr:city": string(p.city),
  } }, options)
}
export async function findNearbyRestaurants(options: OpenStreetMapSearchOptions): Promise<PlaceSearchResult> {
  aborted(options.signal)
  if (!coordinates(options.lat, options.lng) || !Number.isFinite(options.radiusMeters) || options.radiusMeters < 500 || options.radiusMeters > 5000) throw new PlacesError("invalid", "Vị trí hoặc bán kính không hợp lệ.")
  const center = `${options.lat.toFixed(5)},${options.lng.toFixed(5)}`
  const places: PlaceResult[] = [], errors: Error[] = []
  let available = false, fetchedAt = Date.now()
  const cached = nearbyCache.get(center)
  try {
    let data: OsmElement[]
    if (cached && Date.now() - cached.at < TTL) { data = cached.data; fetchedAt = cached.at }
    else {
      // Same area is fetched once for every dish and radius; final distance uses the exact chosen center.
      const query = `[out:json][timeout:15][maxsize:8388608];nwr(around:5010,${options.lat},${options.lng})["amenity"~"^(restaurant|fast_food|cafe|food_court|ice_cream)$"]["name"];out center 700;`
      const payload = await fetchJson<{ elements?: OsmElement[]; remark?: string }>(OVERPASS_URL, { method: "POST", body: new URLSearchParams({ data: query }) }, options.signal, 18_000)
      if (!Array.isArray(payload.elements) || payload.remark) throw new PlacesError("network", "Nguồn quán lân cận chưa trả đủ dữ liệu.")
      data = payload.elements.slice(0, 700); put(nearbyCache, center, { at: fetchedAt, data })
    }
    available = true
    for (const element of data) { const place = osmPlace(element, options); if (place) places.push(place) }
  } catch (error) { aborted(options.signal); errors.push(error as Error) }
  // A single bounded text lookup supplements sparse name matches; no lookup on typing/filter changes.
  if (places.filter(p => p.match !== "nearby").length < 3) {
    const q = options.query.trim().slice(0, 100), textKey = `${center}:${normalizePlaceText(q)}`
    try {
      const textHit = textCache.get(textKey)
      let features: PhotonFeature[]
      if (textHit && Date.now() - textHit.at < TTL) features = textHit.data
      else {
        const pad = .046, lngPad = pad / Math.max(.2, Math.cos(options.lat * Math.PI / 180))
        const params = new URLSearchParams({ q, lat: String(options.lat), lon: String(options.lng), zoom: "14", limit: "30", bbox: [options.lng-lngPad,options.lat-pad,options.lng+lngPad,options.lat+pad].join(",") })
        for (const type of ["restaurant", "fast_food", "cafe", "food_court", "ice_cream"]) params.append("osm_tag", `amenity:${type}`)
        const payload = await fetchJson<{ features?: PhotonFeature[] }>(`${PHOTON_URL}?${params}`, {}, options.signal)
        if (!Array.isArray(payload.features)) throw new PlacesError("network", "Nguồn tìm tên quán trả dữ liệu không hợp lệ.")
        features = payload.features; put(textCache, textKey, { at: Date.now(), data: features })
      }
      available = true
      for (const f of features) { const p = photonPlace(f, options); if (p) places.push(p) }
    } catch (error) { aborted(options.signal); errors.push(error as Error) }
  }
  if (!available) throw errors.find(e => e instanceof PlacesError && e.code === "rate") ?? errors[0]
  const unique: PlaceResult[] = [], seen = new Set<string>(), byName = new Map<string, PlaceResult[]>()
  for (const p of places.sort((a,b) => b._score-a._score || a.distanceKm-b.distanceKm)) {
    const name = normalizePlaceText(p.name), copies = byName.get(name) ?? []
    if (seen.has(p.id) || copies.some(other => haversine(other.lat, other.lng, p.lat, p.lng) < .04)) continue
    unique.push(p); seen.add(p.id); copies.push(p); byName.set(name, copies)
  }
  // Keep the full bounded dataset so a narrow radius is never filtered after a top-N cut.
  const limited = (nearbyCache.get(center)?.data.length ?? 0) >= 700
  return { places: unique, partial: errors.length > 0 || limited, warning: errors.length ? "Một nguồn dữ liệu đang bận; danh sách có thể chưa đầy đủ. Google Maps có thể có thêm quán." : limited ? "Khu vực có nhiều quán; nguồn dữ liệu giới hạn 700 địa điểm. Google Maps có thể có thêm kết quả." : undefined, fetchedAt }
}
export async function searchOpenStreetMapPlaces(options: OpenStreetMapSearchOptions): Promise<PlaceResult[]> {
  return (await findNearbyRestaurants(options)).places
}
