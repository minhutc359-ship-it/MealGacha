export interface PlaceResult {
  name: string
  address: string
  lat: number
  lng: number
  rating?: number
  userRatingCount?: number
  distanceKm: number
  mapsUrl: string
  isOpen?: boolean
  priceLevel?: number
  _score?: number
}

interface SearchOptions {
  query: string
  lat: number
  lng: number
  radiusMeters: number
  minRating: number
  minReviews: number
  apiKey: string
}

interface GooglePlace {
  displayName?: { text?: string }
  formattedAddress?: string
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
  currentOpeningHours?: { openNow?: boolean }
  priceLevel?: string
  businessStatus?: string
  location?: { latitude?: number; longitude?: number }
}

const PRICE_LEVEL: Record<string, number> = {
  PRICE_LEVEL_FREE: 1,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
}

export function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const radiusKm = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function scoreAndSort(
  places: PlaceResult[],
  radiusKm: number,
  limit = 5,
): PlaceResult[] {
  return places
    .map((place) => {
      const ratingScore = Math.min(Math.max(((place.rating ?? 3) - 3) / 2, 0), 1)
      const volumeScore = Math.min(Math.log10((place.userRatingCount ?? 0) + 1) / 3, 1)
      const distanceScore = Math.max(1 - place.distanceKm / radiusKm, 0)
      return {
        ...place,
        _score: (place._score ?? 0.55 * ratingScore + 0.3 * volumeScore) + 0.15 * distanceScore,
      }
    })
    .sort((a, b) => (b._score ?? 0) - (a._score ?? 0))
    .slice(0, limit)
}

export async function searchNearbyPlaces(
  options: SearchOptions,
): Promise<PlaceResult[]> {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": options.apiKey,
        "X-Goog-FieldMask": [
          "places.displayName",
          "places.formattedAddress",
          "places.rating",
          "places.userRatingCount",
          "places.googleMapsUri",
          "places.currentOpeningHours.openNow",
          "places.priceLevel",
          "places.businessStatus",
          "places.location",
        ].join(","),
      },
      body: JSON.stringify({
        textQuery: options.query,
        languageCode: "vi",
        maxResultCount: 20,
        locationBias: {
          circle: {
            center: { latitude: options.lat, longitude: options.lng },
            radius: options.radiusMeters,
          },
        },
      }),
    },
  )

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(
      `Places API ${response.status}${
        detail ? `: ${detail.slice(0, 160)}` : ""
      }`,
    )
  }

  const payload = (await response.json()) as { places?: GooglePlace[] }
  const radiusKm = options.radiusMeters / 1000
  const mapped = (payload.places ?? [])
    .map((place): PlaceResult | null => {
      if (place.businessStatus === "CLOSED_PERMANENTLY") return null
      const latitude = place.location?.latitude
      const longitude = place.location?.longitude
      if (typeof latitude !== "number" || typeof longitude !== "number")
        return null
      const name = place.displayName?.text?.trim()
      if (!name) return null
      return {
        name,
        lat: latitude,
        lng: longitude,
        address: place.formattedAddress ?? "",
        rating: place.rating ?? 0,
        userRatingCount: place.userRatingCount ?? 0,
        distanceKm: haversine(options.lat, options.lng, latitude, longitude),
        mapsUrl:
          place.googleMapsUri ??
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
        isOpen: place.currentOpeningHours?.openNow,
        priceLevel: place.priceLevel
          ? PRICE_LEVEL[place.priceLevel]
          : undefined,
      }
    })
    .filter((place): place is PlaceResult => place !== null)
    .filter(
      (place) =>
        place.distanceKm <= radiusKm &&
        (place.rating ?? 0) >= options.minRating &&
        (place.userRatingCount ?? 0) >= options.minReviews,
    )

  return scoreAndSort(mapped, radiusKm)
}

export interface OpenStreetMapSearchOptions {
  query: string
  lat: number
  lng: number
  radiusMeters: number
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] }
  properties?: {
    name?: string
    street?: string
    housenumber?: string
    district?: string
    city?: string
    postcode?: string
    osm_type?: "N" | "W" | "R"
    osm_id?: number
    osm_value?: string
  }
}

const PHOTON_URL = "https://photon.komoot.io/api/"
const OVERPASS_URL = "https://overpass-api.de/api/interpreter"
const osmCache = new Map<string, PlaceResult[]>()

export async function geocodeOpenStreetMapArea(query: string): Promise<{ lat: number; lng: number } | null> {
  const params = new URLSearchParams({ q: query.trim(), limit: "1", lang: "vi" })
  const response = await fetch(`${PHOTON_URL}?${params}`)
  if (!response.ok) throw new Error(`Photon ${response.status}`)
  const payload = await response.json() as { features?: PhotonFeature[] }
  const [lng, lat] = payload.features?.[0]?.geometry?.coordinates ?? []
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

interface OsmElement {
  type: "node" | "way" | "relation"
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

function osmAddress(tags: Record<string, string>): string {
  return [tags["addr:housenumber"], tags["addr:street"], tags["addr:district"], tags["addr:city"]]
    .filter(Boolean).join(" ") || "Địa chỉ chưa được cập nhật trên OpenStreetMap"
}

function queryWords(query: string): string[] {
  return query.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/[^\p{L}\p{N}]+/u).filter((part) => part.length > 2 && !["quan", "nha", "hang", "restaurant", "mon"].includes(part))
}

async function searchNearbyOsmAmenities(options: OpenStreetMapSearchOptions): Promise<PlaceResult[]> {
  const radius = Math.min(5000, Math.max(500, options.radiusMeters))
  const query = `[out:json][timeout:15];nwr(around:${radius},${options.lat},${options.lng})["amenity"~"^(restaurant|fast_food|cafe|food_court)$"]["name"];out center 700;`
  const response = await fetch(OVERPASS_URL, { method: "POST", body: new URLSearchParams({ data: query }) })
  if (!response.ok) throw new Error(`Overpass ${response.status}`)
  const payload = await response.json() as { elements?: OsmElement[] }
  const words = queryWords(options.query)
  return (payload.elements ?? []).flatMap((element): PlaceResult[] => {
    const lat = element.lat ?? element.center?.lat
    const lng = element.lon ?? element.center?.lon
    const name = element.tags?.name?.trim()
    if (!name || lat === undefined || lng === undefined) return []
    const distanceKm = haversine(options.lat, options.lng, lat, lng)
    if (distanceKm > radius / 1000) return []
    const haystack = `${name} ${element.tags?.cuisine ?? ""} ${element.tags?.description ?? ""}`
      .toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const relevance = words.length ? words.filter((word) => haystack.includes(word)).length / words.length : 0
    return [{ name, address: osmAddress(element.tags ?? {}), lat, lng, distanceKm,
      mapsUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
      _score: relevance * 0.45 }]
  })
}

export async function searchOpenStreetMapPlaces(
  options: OpenStreetMapSearchOptions,
): Promise<PlaceResult[]> {
  const cacheKey = `${options.query}:${options.lat.toFixed(3)}:${options.lng.toFixed(3)}:${options.radiusMeters}`
  const cached = osmCache.get(cacheKey)
  if (cached) return cached
  const radiusKm = options.radiusMeters / 1000
  const params = new URLSearchParams({
    q: options.query,
    lat: String(options.lat),
    lon: String(options.lng),
    limit: "30",
    lang: "vi",
  })
  params.append("osm_tag", "amenity:restaurant")
  params.append("osm_tag", "amenity:fast_food")
  params.append("osm_tag", "amenity:cafe")
  let features: PhotonFeature[] = []
  let photonAvailable = false
  try {
    const response = await fetch(`${PHOTON_URL}?${params}`)
    if (!response.ok) throw new Error(`Photon ${response.status}`)
    photonAvailable = true
    features = ((await response.json()) as { features?: PhotonFeature[] }).features ?? []
  } catch { /* Overpass still returns nearby venues when text search is unavailable. */ }
  const seen = new Set<string>()
  const places = features
    .map((element): PlaceResult | null => {
      const [longitude, latitude] = element.geometry?.coordinates ?? []
      const properties = element.properties ?? {}
      const name = properties.name?.trim()
      if (!name || typeof latitude !== "number" || typeof longitude !== "number") return null
      const key = `${name}:${latitude.toFixed(5)}:${longitude.toFixed(5)}`
      if (seen.has(key)) return null
      seen.add(key)
      const address = [properties.housenumber, properties.street, properties.district, properties.city, properties.postcode]
        .filter(Boolean)
        .join(" ") || "Địa chỉ chưa được cập nhật trên OpenStreetMap"
      const osmType = properties.osm_type === "N" ? "node" : properties.osm_type === "W" ? "way" : "relation"
      return {
        name,
        lat: latitude,
        lng: longitude,
        address,
        distanceKm: haversine(options.lat, options.lng, latitude, longitude),
        mapsUrl: properties.osm_id
          ? `https://www.openstreetmap.org/${osmType}/${properties.osm_id}`
          : `https://www.openstreetmap.org/search?query=${encodeURIComponent(name)}`,
        _score: 0.45,
      }
    })
    .filter((place): place is PlaceResult => place !== null)
    .filter((place) => place.distanceKm <= radiusKm)
  // Photon matches names and categories; nearby OSM amenities fill sparse dish queries.
  let nearby: PlaceResult[] = []
  let overpassAvailable = false
  if (places.length < 10) {
    try { nearby = await searchNearbyOsmAmenities(options); overpassAvailable = true } catch { /* Photon results still usable. */ }
  }
  for (const place of nearby) {
    const key = `${place.name}:${place.lat.toFixed(5)}:${place.lng.toFixed(5)}`
    if (!seen.has(key)) { places.push(place); seen.add(key) }
  }
  if (!photonAvailable && !overpassAvailable) throw new Error("Không kết nối được dữ liệu quán OpenStreetMap.")
  const results = scoreAndSort(places, radiusKm, 20)
  osmCache.set(cacheKey, results)
  return results
}
