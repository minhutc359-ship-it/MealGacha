import { afterEach, describe, expect, it, vi } from "vitest"
import { GameAudioEngine } from "@/infrastructure/audio/gameAudio"

class Param {
  value = 0
  cancelScheduledValues() {}
  setTargetAtTime(value: number) {
    this.value = value
  }
  setValueAtTime(value: number) {
    this.value = value
  }
  linearRampToValueAtTime(value: number) {
    this.value = value
  }
  exponentialRampToValueAtTime(value: number) {
    this.value = value
  }
}
class Node {
  pan = new Param()
  disconnections = 0
  gain = new Param()
  frequency = new Param()
  buffer: AudioBuffer | null = null
  loop = false
  type = "sine"
  onended: (() => void) | null = null
  starts: number[][] = []
  stopped = false
  connect() {}
  disconnect() { this.disconnections++ }
  start(...args: number[]) {
    this.starts.push(args)
  }
  stop(at = 0) {
    if (!at) this.stopped = true
  }
}
class Context {
  currentTime = 0
  sampleRate = 100
  state = "suspended"
  destination = new Node()
  voices: Node[] = []
  gains: Node[] = []
  oscillators: Node[] = []
  panners: Node[] = []
  createMediaElementSource() { return new Node() }
  createStereoPanner() { const node = new Node(); this.panners.push(node); return node }
  createGain() {
    const node = new Node()
    this.gains.push(node)
    return node
  }
  createBufferSource() {
    const node = new Node()
    this.voices.push(node)
    return node
  }
  createOscillator() {
    const node = new Node()
    this.oscillators.push(node)
    return node
  }
  createBiquadFilter() {
    return new Node()
  }
  createBuffer() {
    return { getChannelData: () => new Float32Array(100) }
  }
  async decodeAudioData() {
    return { duration: 32 }
  }
  async resume() {
    this.state = "running"
  }
  async suspend() {
    this.state = "suspended"
  }
  async close() {
    this.state = "closed"
  }
}
const settle = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve()
}
const disposers: Array<() => void> = []
function fixture(
  load: (url: string) => Promise<ArrayBuffer> = vi.fn(
    async () => new ArrayBuffer(8),
  ),
  media?: () => HTMLAudioElement,
) {
  vi.stubGlobal("window", new EventTarget())
  vi.stubGlobal("document", new EventTarget())
  let visible = true
  const context = new Context(),
    create = vi.fn(() => context as unknown as AudioContext)
  const engine = new GameAudioEngine({
    context: create,
    load,
    visible: () => visible,
    media,
  })
  disposers.push(engine.mount())
  return {
    engine,
    context,
    create,
    load,
    hide: () => {
      visible = false
      engine.visibilityChanged()
    },
    show: () => {
      visible = true
      engine.visibilityChanged()
    },
  }
}
afterEach(() => {
  disposers.splice(0).forEach((fn) => fn())
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

class Media extends EventTarget {
  src="";loop=false;preload="";currentTime=0;paused=true
  async play() {this.paused=false}
  pause() {this.paused=true}
  load() {}
  removeAttribute(name:string) {if(name==="src")this.src=""}
}
describe("web long-score streaming",()=>{
  it("waits for a gesture and streams a long score without decoding it into the buffer cache",async()=>{
    const elements:Media[]=[],media=vi.fn(()=>{const element=new Media();elements.push(element);return element as unknown as HTMLAudioElement})
    const f=fixture(undefined,media),decode=vi.spyOn(f.context,"decodeAudioData")
    f.engine.acquire("mode-tcg")
    expect(media).not.toHaveBeenCalled()
    await f.engine.unlock();await settle()
    expect(elements[0].src).toBe("/assets/music580/mode-tcg.mp3")
    expect(decode).not.toHaveBeenCalled();expect(f.load).not.toHaveBeenCalled()
    expect(f.engine.resourceStats().streamingVoices).toBe(1)
    expect(f.engine.getSnapshot().phase).toBe("playing")
    elements[0].currentTime=7
    f.hide();expect(elements[0].paused).toBe(true);expect(f.engine.resourceStats().streamingVoices).toBe(0)
    f.show();await settle();expect(elements[1].currentTime).toBe(7)
  })
  it("normalizes a legacy style without replacing the stream and releases it on mute",async()=>{
    const elements:Media[]=[],f=fixture(undefined,()=>{const element=new Media();elements.push(element);return element as unknown as HTMLAudioElement})
    f.engine.acquire("mode-tcg");await f.engine.unlock();await settle()
    f.engine.configure({soundEnabled:true,musicStyle:"8bit"} as never);await settle()
    expect(elements.at(-1)!.src).toContain("mode-tcg")
    f.engine.configure({soundEnabled:true,musicStyle:"original"});await settle()
    expect(f.engine.resourceStats().streamingVoices).toBeLessThanOrEqual(2)
    f.engine.configure({soundEnabled:false})
    expect(f.engine.resourceStats().streamingVoices).toBe(0);expect(elements.every(e=>e.paused)).toBe(true)
  })
  it("falls back to the existing compact score if the media stream fails",async()=>{
    const element=new Media(),f=fixture(undefined,()=>element as unknown as HTMLAudioElement)
    f.engine.acquire("mode-tcg");await f.engine.unlock();await settle()
    element.dispatchEvent(new Event("error"));await settle()
    expect(f.load).toHaveBeenCalledWith("/assets/music580/mode-tcg.mp3")
    expect(f.engine.resourceStats().streamingVoices).toBe(0)
    expect(f.engine.getSnapshot().phase).toBe("playing")
  })
})
describe("game soundtrack lifecycle", () => {
  it("switches priority tracks and resumes each track's own cursor", async () => {
    const { engine, context, load } = fixture()
    engine.acquire("mode-tcg", 5)
    await engine.unlock()
    await settle()
    context.currentTime = 7
    const release = engine.acquire("map-tide", 30)
    await settle()
    expect(load).toHaveBeenLastCalledWith(
      "/assets/music580/map-tide.mp3",
    )
    expect(engine.getSnapshot()).toMatchObject({
      track: "map-tide",
      style: "original",
      phase: "playing",
    })
    release()
    await settle()
    expect(load).toHaveBeenCalledTimes(2)
    const resumed = context.voices.filter(voice => voice.starts[0]?.length === 2).at(-1)
    expect(resumed?.starts[0][1]).toBe(7)
  })
  it("ignores an old track download that finishes after a priority switch and honors mute", async () => {
    const resolvers = new Map<string, (data: ArrayBuffer) => void>()
    const load = vi.fn(
      (url: string) =>
        new Promise<ArrayBuffer>((resolve) => resolvers.set(url, resolve)),
    )
    const { engine, context } = fixture(load)
    engine.acquire("mode-tcg")
    await engine.unlock()
    const release = engine.acquire("boss", 30)
    resolvers.get("/assets/music580/boss.mp3")!(new ArrayBuffer(8))
    await settle()
    expect(context.voices).toHaveLength(1)
    resolvers.get("/assets/music580/mode-tcg.mp3")!(new ArrayBuffer(8))
    await settle()
    expect(context.voices).toHaveLength(1)
    release()
    engine.configure({ soundEnabled: false })
    expect(context.voices.every((v) => v.stopped)).toBe(true)
    expect(engine.getSnapshot().phase).toBe("muted")
  })
  it("waits for a gesture and honors an existing muted preference", async () => {
    const { engine, create, load } = fixture()
    engine.configure({ soundEnabled: false })
    engine.acquire("mode-tcg")
    await engine.unlock()
    engine.play("fire")
    await settle()
    expect(create).not.toHaveBeenCalled()
    expect(load).not.toHaveBeenCalled()
    engine.configure({ soundEnabled: true })
    await settle()
    expect(create).not.toHaveBeenCalled()
    await engine.unlock()
    await settle()
    expect(create).toHaveBeenCalledOnce()
    expect(load).toHaveBeenCalledOnce()
    expect(engine.getSnapshot()).toEqual({
      phase: "playing",
      track: "mode-tcg",
      style: "original",
    })
  })
  it("gives cutscenes priority and restores the paused battle cursor", async () => {
    const { engine, context } = fixture()
    engine.acquire("mode-tcg", 5)
    await engine.unlock()
    await settle()
    context.currentTime = 9
    const story = engine.acquire("map-tide", 30)
    await settle()
    expect(engine.getSnapshot().track).toBe("map-tide")
    const journal = engine.acquire("map-garden", 10)
    await settle()
    expect(engine.getSnapshot().track).toBe("map-tide")
    journal()
    story()
    await settle()
    expect(engine.getSnapshot().track).toBe("mode-tcg")
    const resumed = context.voices.filter(voice => voice.starts[0]?.length === 2).at(-1)
    expect(resumed?.starts[0][1]).toBe(9)
  })
  it("rejects late music after a reader closes or the route unmounts", async () => {
    let finish: (data: ArrayBuffer) => void = () => {
      throw new Error("No pending download")
    }
    const load = vi.fn(
      () =>
        new Promise<ArrayBuffer>((resolve) => {
          finish = resolve
        }),
    )
    const { engine, context } = fixture(load)
    const release = engine.acquire("map-garden")
    await engine.unlock()
    release()
    finish(new ArrayBuffer(8))
    await settle()
    expect(context.voices).toHaveLength(0)
    engine.acquire("boss")
    await settle()
    engine.dispose()
    finish(new ArrayBuffer(8))
    await settle()
    expect(context.voices).toHaveLength(0)
    expect(context.state).toBe("closed")
  })
  it("pauses background tabs, cancels delayed SFX and resumes the loop cursor", async () => {
    const { engine, context, hide, show } = fixture()
    engine.acquire("mode-tcg")
    await engine.unlock()
    await settle()
    context.currentTime = 6
    engine.play("victory", 500)
    hide()
    await settle()
    expect(context.voices.every((v) => v.stopped)).toBe(true)
    expect(context.oscillators.every((v) => v.stopped)).toBe(true)
    expect(context.state).toBe("suspended")
    context.currentTime = 8
    show()
    await settle()
    const resumed = context.voices.filter(voice => voice.starts[0]?.length === 2).at(-1)
    expect(resumed?.starts[0][1]).toBe(6)
    expect(context.oscillators).toHaveLength(12)
  })
  it("separates music and SFX volume, clamps values and cancels everything on mute", async () => {
    const { engine, context } = fixture()
    engine.acquire("mode-tcg")
    await engine.unlock()
    await settle()
    engine.configure({
      soundEnabled: true,
      musicEnabled: false,
      musicVolume: 99,
      effectsVolume: -1,
    })
    expect(context.gains[0].gain.value).toBe(0)
    expect(context.gains[1].gain.value).toBe(0)
    engine.play("fire")
    expect(context.oscillators).toHaveLength(0)
    engine.configure({
      soundEnabled: true,
      musicEnabled: false,
      effectsVolume: 0.6,
    })
    engine.play("shield", 400)
    expect(context.oscillators.length).toBeGreaterThan(0)
    engine.configure({ soundEnabled: false })
    expect(context.oscillators.every((v) => v.stopped)).toBe(true)
    expect(context.gains[1].gain.value).toBe(0)
  })
  it("survives a failed download and retries on the next user gesture", async () => {
    const load = vi
      .fn(async () => new ArrayBuffer(8))
      .mockRejectedValueOnce(new Error("offline"))
    const { engine } = fixture(load)
    engine.acquire("boss")
    await engine.unlock()
    await settle()
    expect(engine.getSnapshot().phase).toBe("error")
    await engine.unlock()
    await settle()
    expect(engine.getSnapshot().phase).toBe("playing")
    expect(load).toHaveBeenCalledTimes(2)
  })
})

it("auto-chess pans combat sounds and cleans panners on completion and mute", async () => {
  const { engine, context } = fixture()
  await engine.unlock()
  engine.play("auto-shot", 0, .7)
  expect(context.panners[0].pan.value).toBe(.7)
  context.oscillators.at(-1)!.onended!()
  context.voices.at(-1)!.onended!()
  expect(context.panners[0].disconnections).toBe(1)
  engine.play("auto-channel", 0, -.7)
  engine.configure({ soundEnabled: false })
  expect(context.panners[1].disconnections).toBe(1)
})
it("dense auto-chess audio respects the 48-voice cap", async () => {
  const { engine, context } = fixture()
  await engine.unlock()
  for (let n = 0; n < 50; n++) engine.play("auto-boss", 0, .3)
  expect(context.voices.length + context.oscillators.length).toBeLessThanOrEqual(48)
})

it("loads one complete score and stops every voice on native background",async()=>{
 const {engine,context,load}=fixture()
 engine.acquire("map-lantern",5,.8)
 await engine.unlock();await settle();await settle()
 const voices=context.voices.filter(v=>v.loop && v.buffer)
 expect(voices).toHaveLength(2) // complete score plus procedural ambience
 expect(load).toHaveBeenCalledTimes(1)
 engine.updatePressure(.1,"map-lantern")
 engine.setNativeVisible(false)
 expect(voices.every(v=>v.stopped)).toBe(true)
 engine.setNativeVisible(true);await settle();await settle()
 expect(load).toHaveBeenCalledTimes(1)
})

it("closing an introduction does not dispose the live game's shared mixer",async()=>{
 const {engine,context}=fixture()
 engine.acquire("map-garden");await engine.unlock();await settle()
 const closeDemo=engine.mount()
 engine.acquire("boss",50);await settle();closeDemo()
 expect(context.state).toBe("running")
 engine.play("confirm");expect(engine.resourceStats().effects).toBeGreaterThan(0)
})
it("ambience remains independently controllable with music off and mute stops it",async()=>{
 const {engine,context}=fixture()
 engine.configure({soundEnabled:true,musicEnabled:false,ambienceVolume:.3})
 engine.acquire("map-garden");await engine.unlock();await settle()
 expect(context.voices.some(v=>v.loop)).toBe(true)
 engine.configure({soundEnabled:false,musicEnabled:false})
 expect(context.voices.filter(v=>v.loop).every(v=>v.stopped)).toBe(true)
})
it("coalesces duplicate footstep/click bursts without silencing later steps",async()=>{
 const {engine,context}=fixture();await engine.unlock()
 engine.play("footstep");const count=context.voices.length+context.oscillators.length
 engine.play("footstep");expect(context.voices.length+context.oscillators.length).toBe(count)
 context.currentTime=.16;engine.play("footstep")
 expect(context.voices.length+context.oscillators.length).toBeGreaterThan(count)
})

describe("5.3 cinematic sound mixer",()=>{
  it("starts a decoded clip at the movie's current offset and cancels it on pause",async()=>{
    const f=fixture();f.engine.configure({soundEnabled:true,musicEnabled:false,ambienceVolume:0});await f.engine.unlock()
    const clip=f.engine.playClip("/assets/rpg/awakening530/sounds/com-tam.mp3",()=>.8);await settle()
    expect(f.context.voices.at(-1)!.starts[0]).toEqual([0,.8]);expect(f.engine.resourceStats().effects).toBe(1)
    clip.stop();expect(f.context.voices.at(-1)!.stopped).toBe(true);expect(f.engine.resourceStats().effects).toBe(0)
  })
  it("never plays a late decode after the movie closes or the user mutes",async()=>{
    let resolve!:(b:ArrayBuffer)=>void
    const f=fixture(()=>new Promise(r=>resolve=r));await f.engine.unlock()
    const clip=f.engine.playClip("/assets/rpg/awakening530/sounds/pho-bo.mp3",()=>0);clip.stop()
    resolve(new ArrayBuffer(8));await settle();expect(f.engine.resourceStats().effects).toBe(0)
    f.engine.configure({soundEnabled:false});f.engine.playClip("/assets/rpg/awakening530/sounds/com-tam.mp3",()=>0);await settle()
    expect(f.engine.resourceStats().effects).toBe(0)
  })
})
