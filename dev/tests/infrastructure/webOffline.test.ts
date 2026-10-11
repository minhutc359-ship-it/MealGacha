import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"

const origin="https://meal.example"
class Cache {
  values=new Map<string,Response>()
  key(request: Request|string) {return new URL(typeof request==="string"?request:request.url,origin).href}
  async addAll(urls:string[]) {for(const url of urls) await this.put(url,new Response(url.endsWith("index.html")?"shell-v1":"core"))}
  async match(request:Request|string) {return this.values.get(this.key(request))?.clone()}
  async delete(request:Request|string) {return this.values.delete(this.key(request))}
  async put(request:Request|string,response:Response) {this.values.delete(this.key(request));this.values.set(this.key(request),response.clone())}
  async keys() {return [...this.values.keys()].map(url=>new Request(url))}
}
function fixture() {
  const callbacks:Record<string,(event:any)=>void>={},stores=new Map<string,Cache>()
  let offline=false,activated=0
  const caches={
    async open(name:string) {if(!stores.has(name))stores.set(name,new Cache());return stores.get(name)!},
    async keys(){return [...stores.keys()]},async delete(name:string){return stores.delete(name)},
  }
  const self={location:{origin},clients:{claim:async()=>{}},skipWaiting:async()=>{activated++},addEventListener:(name:string,fn:(event:any)=>void)=>{callbacks[name]=fn}}
  const fetch=async(request:Request)=>{if(offline)throw Error("offline");return new Response("0123456789",{headers:{"Content-Type":"audio/mpeg"}})}
  const source=readFileSync("web-service-worker.js","utf8").replace("__VERSION__",'"v1"').replace("__CORE__",'["/index.html","/assets/app.js"]')
  runInNewContext(source,{self,caches,fetch,URL,Request,Response,Headers,Promise,Set})
  async function event(name:string,props:Record<string,unknown>) {
    const waiting:Promise<unknown>[]=[],state:{response?:Promise<Response>}={}
    callbacks[name]({...props,waitUntil:(promise:Promise<unknown>)=>waiting.push(promise),respondWith:(promise:Promise<Response>)=>{state.response=promise}})
    const response=await state.response
    await Promise.all(waiting)
    return response
  }
  return {event,stores,caches,setOffline:()=>{offline=true},activated:()=>activated}
}
describe("web offline boundaries",()=>{
  it("keeps the current shell offline and does not activate an update without a user message",async()=>{
    const f=fixture();await f.event("install",{})
    expect(f.activated()).toBe(0);f.setOffline()
    const response=await f.event("fetch",{request:{url:origin+"/autochess",method:"GET",mode:"navigate",headers:new Headers()}})
    expect(await response!.text()).toBe("shell-v1")
    await f.event("message",{data:{type:"APPLY_WEB_UPDATE"}});expect(f.activated()).toBe(1)
  })
  it("caches a full audio file and serves valid partial ranges when offline",async()=>{
    const f=fixture(),url=origin+"/assets/test.mp3"
    const full=await f.event("fetch",{request:new Request(url)})
    expect(await full!.text()).toBe("0123456789")
    f.setOffline()
    const partial=await f.event("fetch",{request:new Request(url,{headers:{Range:"bytes=2-5"}})})
    expect(partial!.status).toBe(206);expect(partial!.headers.get("Content-Range")).toBe("bytes 2-5/10")
    expect(await partial!.text()).toBe("2345")
    const suffix=await f.event("fetch",{request:new Request(url,{headers:{Range:"bytes=-3"}})})
    expect(await suffix!.text()).toBe("789")
    const invalid=await f.event("fetch",{request:new Request(url,{headers:{Range:"bytes=99-100"}})})
    expect(invalid!.status).toBe(416)
  })
  it("ignores cross-origin services and non-GET requests",async()=>{
    const f=fixture()
    expect(await f.event("fetch",{request:new Request("https://maps.example/assets/map.png")})).toBeUndefined()
    expect(await f.event("fetch",{request:new Request(origin+"/assets/upload",{method:"POST"})})).toBeUndefined()
    expect(await f.event("fetch",{request:new Request(origin+"/sw.js")})).toBeUndefined()
  })
  it("bounds media entries and preserves unrelated caches and the previous shell",async()=>{
    const f=fixture()
    await f.caches.open("another-app");await f.caches.open("som-web-core-oldest");await f.caches.open("som-web-core-previous")
    await f.event("install",{});await f.event("activate",{})
    expect(f.stores.has("another-app")).toBe(true);expect(f.stores.has("som-web-core-previous")).toBe(true);expect(f.stores.has("som-web-core-oldest")).toBe(false)
    for(let i=0;i<122;i++) await f.event("fetch",{request:new Request(origin+`/assets/${i}.webp`)})
    const media=f.stores.get("som-web-media-v1")!
    expect(media.values.size).toBe(120)
    expect(await media.match(origin+"/assets/0.webp")).toBeUndefined()
    expect(await media.match(origin+"/assets/121.webp")).toBeDefined()
    const previous=f.stores.get("som-web-core-previous")!
    await previous.put("/assets/old-hashed-chunk.js",new Response("previous-code"))
    f.setOffline()
    const oldChunk=await f.event("fetch",{request:new Request(origin+"/assets/old-hashed-chunk.js")})
    expect(await oldChunk!.text()).toBe("previous-code")
  })
})
