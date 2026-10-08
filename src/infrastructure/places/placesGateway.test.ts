import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clearPlacesCache, directionsUrl, embeddedMapUrl, findNearbyRestaurants, geocodeOpenStreetMapAreas, haversine, mapsSearchUrl, matchDish, normalizePlaceText, OVERPASS_URL, phoneHref, safeWebsite } from "./placesGateway"

const options = { query: "bún chả", lat: 21.03, lng: 105.8, radiusMeters: 5000 }
const response = (data: unknown, status = 200, headers?: HeadersInit) => new Response(JSON.stringify(data), { status, headers })
const element = (id: number, name = "Bún Chả Hương", lat = 21.031, lng = 105.801, tags: Record<string,string> = {}) => ({ type: "node", id, lat, lon: lng, tags: { name, amenity: "restaurant", ...tags } })
const feature = (id: number, name = "Bún Chả Hà Nội", lat = 21.031, lng = 105.801) => ({ geometry: { coordinates: [lng, lat] }, properties: { name, osm_type: "N", osm_id: id, osm_key: "amenity", osm_value: "restaurant", countrycode: "VN" } })
beforeEach(() => clearPlacesCache())
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers() })

describe("keyless restaurant discovery", () => {
  it("lets the player choose Vietnamese areas, omits unsupported vi, rejects invalid/foreign entries and duplicates", async () => {
    const fetch = vi.fn(async (_url: string) => response({ features: [feature(1,"Cầu Giấy"), feature(2,"Cầu Giấy"), feature(3,"Hà Nội",21.02), {...feature(4),geometry:{coordinates:[105.8,999]}}, {...feature(5),properties:{name:"Paris",countrycode:"FR"}}] }))
    vi.stubGlobal("fetch", fetch)
    const areas = await geocodeOpenStreetMapAreas("Cầu Giấy, Hà Nội")
    expect(areas.map(a => a.name)).toEqual(["Cầu Giấy","Hà Nội"])
    const url = new URL(fetch.mock.calls[0][0] as string)
    expect(url.searchParams.get("countrycode")).toBe("VN")
    expect(url.searchParams.has("lang")).toBe(false)
    expect(url.searchParams.get("limit")).toBe("5")
    await geocodeOpenStreetMapAreas("Cầu Giấy, Hà Nội")
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it("ranks real name matches before generic nearby venues and never invents reviews or open-now", async () => {
    const fetch = vi.fn(async (url: string) => url === OVERPASS_URL ? response({ elements: [element(1,"Quán cơm",21.03001), element(2), element(3,"Bún Chả Đắc Kim",21.034), element(4,"Bun Cha Hanoi",21.033), element(5,"Xa",22),element(6,"Riêng",21.031,105.8,{access:"private"}),element(7,"Đóng",21.03,105.8,{disused:"yes"})] }) : response({ features: [] }))
    vi.stubGlobal("fetch",fetch)
    const result = await findNearbyRestaurants(options)
    expect(result.places).toHaveLength(4)
    expect(result.places.at(-1)?.match).toBe("nearby")
    expect(result.places.every(p => !("rating" in p) && !("isOpen" in p))).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it("reuses the same area across dishes/radii but recalculates relevance and exact distance", async () => {
    const fetch = vi.fn(async (url:string) => url === OVERPASS_URL ? response({elements:[element(1),element(2,"Phở bò",21.055),element(3,"Cơm tấm",21.058)]}) : response({features:[]}))
    vi.stubGlobal("fetch",fetch)
    const first = await findNearbyRestaurants(options)
    const second = await findNearbyRestaurants({...options,query:"phở bò",radiusMeters:1000})
    expect(first.places).toHaveLength(3)
    expect(second.places.map(p=>p.id)).toEqual(["node/1"])
    expect(fetch.mock.calls.filter(c=>c[0]===OVERPASS_URL)).toHaveLength(1)
  })
  it("keeps close venues when more than a hundred distant matches exist before narrowing radius", async () => {
    const elements = Array.from({length:160},(_,i)=>element(i+1,`Bún Chả ${i+1}`,21.052,105.8)).concat([element(999,"Quán gần",21.0301,105.8001)])
    vi.stubGlobal("fetch",vi.fn(async()=>response({elements})))
    const found = await findNearbyRestaurants(options)
    expect(found.places).toHaveLength(161)
    expect(found.places.filter(p=>p.distanceKm<=1).map(p=>p.id)).toContain("node/999")
  })
  it("expires cached venue data after ten minutes", async () => {
    let now=1000;vi.spyOn(Date,"now").mockImplementation(()=>now)
    const fetch=vi.fn(async(url:string)=>url===OVERPASS_URL?response({elements:[element(1),element(2,"Bún Chả B"),element(3,"Bún Chả C")]}):response({features:[]}));vi.stubGlobal("fetch",fetch)
    await findNearbyRestaurants(options);now+=600_001;await findNearbyRestaurants(options)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
  it("deduplicates OSM identities and nearby copies of the same name across providers", async()=>{
    vi.stubGlobal("fetch",vi.fn(async(url:string)=>url===OVERPASS_URL?response({elements:[element(1),element(2,"Quán cơm")]}):response({features:[feature(1,"Bún Chả Hương"),feature(3,"Bún Chả Hương",21.03101,105.80101)]})))
    expect((await findNearbyRestaurants(options)).places).toHaveLength(2)
  })
  it("keeps Photon venues and warns when Overpass fails; filters non-food/out-of-range features", async()=>{
    vi.stubGlobal("fetch",vi.fn(async(url:string)=>url===OVERPASS_URL?response({},503):response({features:[feature(1),feature(2,"Xa",25),{...feature(3),properties:{...feature(3).properties,osm_key:"shop",osm_value:"clothes"}}]})))
    const found=await findNearbyRestaurants(options)
    expect(found.places).toHaveLength(1);expect(found.partial).toBe(true);expect(found.warning).toBeTruthy()
  })
  it("keeps nearby venues if text service fails", async()=>{
    vi.stubGlobal("fetch",vi.fn(async(url:string)=>url===OVERPASS_URL?response({elements:[element(1,"Quán cơm")]}):response({},503)))
    const found=await findNearbyRestaurants(options);expect(found.places[0].match).toBe("nearby");expect(found.partial).toBe(true)
  })
  it("reports total outage instead of claiming no restaurants exist", async()=>{
    vi.stubGlobal("fetch",vi.fn(async()=>response({},503)))
    await expect(findNearbyRestaurants(options)).rejects.toMatchObject({code:"network"})
  })
  it("rejects malformed/partial query responses and does not cache them as success", async()=>{
    const fetch=vi.fn(async(url:string)=>url===OVERPASS_URL?response({elements:[],remark:"runtime error"}):response({oops:[]}));vi.stubGlobal("fetch",fetch)
    await expect(findNearbyRestaurants(options)).rejects.toMatchObject({code:"network"})
    await expect(findNearbyRestaurants(options)).rejects.toMatchObject({code:"network"})
    expect(fetch).toHaveBeenCalledTimes(4)
  })
  it("obeys 429 cooldown rather than hammering either provider", async()=>{
    const fetch=vi.fn(async()=>response({},429,{'Retry-After':'60'}));vi.stubGlobal("fetch",fetch)
    await expect(findNearbyRestaurants(options)).rejects.toMatchObject({code:"rate"})
    await expect(findNearbyRestaurants({...options,query:"phở"})).rejects.toMatchObject({code:"rate"})
    expect(fetch).toHaveBeenCalledTimes(2)
  })
  it("aborts without launching the text fallback when the modal closes", async()=>{
    const fetch=vi.fn((_url:string,init:RequestInit)=>new Promise<Response>((_resolve,reject)=>init.signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')))));vi.stubGlobal("fetch",fetch)
    const controller=new AbortController(),pending=findNearbyRestaurants({...options,signal:controller.signal});controller.abort()
    await expect(pending).rejects.toMatchObject({name:'AbortError'});expect(fetch).toHaveBeenCalledTimes(1)
  })
  it("times out stalled providers and removes timers", async()=>{
    vi.useFakeTimers()
    vi.stubGlobal("fetch",vi.fn((_url:string,init:RequestInit)=>new Promise<Response>((_resolve,reject)=>init.signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))))))
    const pending=findNearbyRestaurants(options),assertion=expect(pending).rejects.toMatchObject({code:'timeout'})
    await vi.advanceTimersByTimeAsync(30_100);await assertion;expect(vi.getTimerCount()).toBe(0)
  })
  it("validates coordinates and radius before any network request", async()=>{
    const fetch=vi.fn();vi.stubGlobal("fetch",fetch)
    for(const change of [{lat:NaN},{lng:190},{radiusMeters:10_000},{radiusMeters:0}])await expect(findNearbyRestaurants({...options,...change})).rejects.toMatchObject({code:'invalid'})
    expect(fetch).not.toHaveBeenCalled()
  })
})
describe("honest matching and map links",()=>{
  it("normalizes accents and đ, uses phrase boundaries, and does not equate broad cuisine with a dish",()=>{
    expect(normalizePlaceText('Đặc sản BÚN CHẢ')).toBe('dac san bun cha')
    expect(matchDish('Bun Cha Đắc Kim',{},options).match).toBe('name')
    expect(matchDish('Champagne',{}, {...options,query:'chả'}).match).toBe('nearby')
    expect(matchDish('Bếp nhà',{cuisine:'vietnamese'}, {...options,cuisineTags:['vietnamese']}).match).toBe('nearby')
    expect(matchDish('Bếp nhà',{cuisine:'bun_cha'},options).match).toBe('cuisine')
    expect(matchDish('Cơm Sườn',{}, {...options,query:'cơm tấm',aliases:['cơm sườn']}).match).toBe('name')
  })
  it("pins directions to coordinates even when the address is unknown",()=>{
    const url=new URL(directionsUrl({lat:21.031,lng:105.801},'walking'))
    expect(url.searchParams.get('destination')).toBe('21.031,105.801');expect(url.searchParams.get('travelmode')).toBe('walking');expect(url.searchParams.has('origin')).toBe(false);expect(url.searchParams.get('api')).toBe('1')
    const map=new URL(embeddedMapUrl({lat:21.031,lng:105.801}));expect(map.searchParams.get('marker')).toBe('21.031,105.801')
  })
  it("encodes Maps searches and rejects unsafe website/phone tags",()=>{
    const url=new URL(mapsSearchUrl('Bún chả & phở','Cầu Giấy, Hà Nội'))
    expect(url.searchParams.get('query')).toBe('Bún chả & phở Cầu Giấy, Hà Nội');expect(url.searchParams.has('key')).toBe(false)
    expect(new URL(mapsSearchUrl('phở','ignored',{lat:21,lng:105})).searchParams.get('query')).toBe('phở near 21,105')
    expect(safeWebsite('javascript:alert(1)')).toBeUndefined();expect(safeWebsite('www.example.com')).toBe('https://www.example.com/')
    expect(phoneHref('+84 (24) 1234-5678')).toBe('tel:+842412345678');expect(phoneHref('x')).toBeUndefined();expect(haversine(21,105,21,105)).toBe(0)
  })
})
