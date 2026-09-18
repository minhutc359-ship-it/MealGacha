export interface PlaceResult {
  name: string
  address: string
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
): PlaceResult[] {
  return places
    .map((place) => {
      const ratingScore = Math.min(Math.max(((place.rating ?? 3) - 3) / 2, 0), 1)
      const volumeScore = Math.min(Math.log10((place.userRatingCount ?? 0) + 1) / 3, 1)
      const distanceScore = Math.max(1 - place.distanceKm / radiusKm, 0)
      return {
        ...place,
        _score: 0.55 * ratingScore + 0.3 * volumeScore + 0.15 * distanceScore,
      }
    })
    .sort((a, b) => (b._score ?? 0) - (a._score ?? 0))
    .slice(0, 5)
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

export async function searchOpenStreetMapPlaces(
  options: OpenStreetMapSearchOptions,
): Promise<PlaceResult[]> {
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
  const response = await fetch(`https://photon.komoot.io/api/?${params}`)
  if (!response.ok) throw new Error(`Photon ${response.status}`)

  const payload = (await response.json()) as { features?: PhotonFeature[] }
  const seen = new Set<string>()
  const places = (payload.features ?? [])
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
        address,
        distanceKm: haversine(options.lat, options.lng, latitude, longitude),
        mapsUrl: properties.osm_id
          ? `https://www.openstreetmap.org/${osmType}/${properties.osm_id}`
          : `https://www.openstreetmap.org/search?query=${encodeURIComponent(name)}`,
      }
    })
    .filter((place): place is PlaceResult => place !== null)
    .filter((place) => place.distanceKm <= radiusKm)
  return scoreAndSort(places, radiusKm)
}
