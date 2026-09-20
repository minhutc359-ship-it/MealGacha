import { afterEach, describe, expect, it, vi } from "vitest"
import { geocodeOpenStreetMapArea, searchOpenStreetMapPlaces } from "./placesGateway"

afterEach(() => vi.unstubAllGlobals())

describe("keyless venue search", () => {
  it("geocodes a typed area and finds nearby venues without invented ratings", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("limit=1")) return new Response(JSON.stringify({ features: [{ geometry: { coordinates: [105.8, 21.03] } }] }))
      if (url.includes("photon.komoot.io")) return new Response(JSON.stringify({ features: [{ geometry: { coordinates: [105.8005, 21.0305] }, properties: { name: "Phở Việt", osm_type: "N", osm_id: 12, street: "Xuân Thủy" } }] }))
      return new Response(JSON.stringify({ elements: [] }))
    })
    vi.stubGlobal("fetch", fetchMock)
    expect(await geocodeOpenStreetMapArea("Cầu Giấy")).toEqual({ lat: 21.03, lng: 105.8 })
    const found = await searchOpenStreetMapPlaces({ query: "phở", lat: 21.03, lng: 105.8, radiusMeters: 3000 })
    expect(found[0]).toMatchObject({ name: "Phở Việt", lat: 21.0305, lng: 105.8005, mapsUrl: "https://www.openstreetmap.org/node/12" })
    expect(found[0].rating).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it("returns nearby amenities if the text search provider fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("photon.komoot.io")) throw new Error("Photon unavailable")
      return new Response(JSON.stringify({ elements: [{ type: "node", id: 5, lat: 21.0401, lon: 105.8101, tags: { name: "Quán bún chả", amenity: "restaurant" } }] }))
    }))
    const found = await searchOpenStreetMapPlaces({ query: "bún chả", lat: 21.04, lng: 105.81, radiusMeters: 3000 })
    expect(found).toHaveLength(1)
    expect(found[0].name).toBe("Quán bún chả")
    expect(found[0].rating).toBeUndefined()
  })
})
