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
    f.engine.acquire("lobby")
    expect(media).not.toHaveBeenCalled()
    await f.engine.unlock();await settle()
    expect(elements[0].src).toBe("/assets/v4/audio/web410/original-lobby.mp3")
    expect(decode).not.toHaveBeenCalled();expect(f.load).not.toHaveBeenCalled()
    expect(f.engine.resourceStats().streamingVoices).toBe(1)
    expect(f.engine.getSnapshot().phase).toBe("playing")
    elements[0].currentTime=7
    f.hide();expect(elements[0].paused).toBe(true);expect(f.engine.resourceStats().streamingVoices).toBe(0)
    f.show();await settle();expect(elements[1].currentTime).toBe(7)
  })
  it("bounds stream voices while changing styles and releases all of them on mute",async()=>{
    const elements:Media[]=[],f=fixture(undefined,()=>{const element=new Media();elements.push(element);return element as unknown as HTMLAudioElement})
    f.engine.acquire("lobby");await f.engine.unlock();await settle()
    f.engine.configure({soundEnabled:true,musicStyle:"8bit"});await settle()
    expect(elements.at(-1)!.src).toContain("8bit-lobby")
    f.engine.configure({soundEnabled:true,musicStyle:"original"});await settle()
    expect(f.engine.resourceStats().streamingVoices).toBeLessThanOrEqual(2)
    f.engine.configure({soundEnabled:false})
    expect(f.engine.resourceStats().streamingVoices).toBe(0);expect(elements.every(e=>e.paused)).toBe(true)
  })
  it("falls back to the existing compact score if the media stream fails",async()=>{
    const element=new Media(),f=fixture(undefined,()=>element as unknown as HTMLAudioElement)
    f.engine.acquire("lobby");await f.engine.unlock();await settle()
    element.dispatchEvent(new Event("error"));await settle()
    expect(f.load).toHaveBeenCalledWith("/assets/tcg/audio/story-warm.mp3")
    expect(f.engine.resourceStats().streamingVoices).toBe(0)
    expect(f.engine.getSnapshot().phase).toBe("playing")
  })
})
describe("game soundtrack lifecycle", () => {
  it("switches styles during a priority cutscene and resumes each arrangement's own cursor", async () => {
    const { engine, context, load } = fixture()
    engine.acquire("battle", 5)
    await engine.unlock()
    await settle()
    context.currentTime = 7
    const release = engine.acquire("story-mystery", 30)
    await settle()
    engine.configure({ soundEnabled: true, musicStyle: "8bit" })
    await settle()
    expect(load).toHaveBeenLastCalledWith(
      "/assets/tcg/audio/8bit-story-mystery.mp3",
    )
    expect(engine.getSnapshot()).toMatchObject({
      track: "story-mystery",
      style: "8bit",
      phase: "playing",
    })
    release()
    await settle()
    expect(load).toHaveBeenLastCalledWith("/assets/tcg/audio/8bit-battle.mp3")
    expect(context.voices.at(-1)?.starts[0][1]).toBe(0)
    context.currentTime = 12
    engine.configure({ soundEnabled: true, musicStyle: "original" })
    await settle()
    expect(context.voices.at(-1)?.starts[0][1]).toBe(7)
  })
  it("ignores an old style download that finishes after a switch and honors mute", async () => {
    const resolvers = new Map<string, (data: ArrayBuffer) => void>()
    const load = vi.fn(
      (url: string) =>
        new Promise<ArrayBuffer>((resolve) => resolvers.set(url, resolve)),
    )
    const { engine, context } = fixture(load)
    engine.acquire("boss")
    await engine.unlock()
    engine.configure({ soundEnabled: true, musicStyle: "8bit" })
    resolvers.get("/assets/tcg/audio/8bit-boss.mp3")!(new ArrayBuffer(8))
    await settle()
    expect(context.voices).toHaveLength(1)
    resolvers.get("/assets/tcg/audio/boss.mp3")!(new ArrayBuffer(8))
    await settle()
    expect(context.voices).toHaveLength(1)
    engine.configure({ soundEnabled: false, musicStyle: "8bit" })
    expect(context.voices.every((v) => v.stopped)).toBe(true)
    expect(engine.getSnapshot().phase).toBe("muted")
  })
  it("waits for a gesture and honors an existing muted preference", async () => {
    const { engine, create, load } = fixture()
    engine.configure({ soundEnabled: false })
    engine.acquire("battle")
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
      track: "battle",
      style: "original",
    })
  })
  it("gives cutscenes priority and restores the paused battle cursor", async () => {
    const { engine, context } = fixture()
    engine.acquire("battle", 5)
    await engine.unlock()
    await settle()
    context.currentTime = 9
    const story = engine.acquire("story-mystery", 30)
    await settle()
    expect(engine.getSnapshot().track).toBe("story-mystery")
    const journal = engine.acquire("story-warm", 10)
    await settle()
    expect(engine.getSnapshot().track).toBe("story-mystery")
    journal()
    story()
    await settle()
    expect(engine.getSnapshot().track).toBe("battle")
    expect(context.voices[context.voices.length - 1]?.starts[0][1]).toBe(9)
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
    const release = engine.acquire("story-warm")
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
    engine.acquire("battle")
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
    expect(context.voices[context.voices.length - 1]?.starts[0][1]).toBe(6)
    expect(context.oscillators).toHaveLength(12)
  })
  it("separates music and SFX volume, clamps values and cancels everything on mute", async () => {
    const { engine, context } = fixture()
    engine.acquire("battle")
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

it("starts three matching stems together, dedupes loads and stops every voice on native background",async()=>{
 const {engine,context,load}=fixture()
 engine.acquire("v4-market-tension",5,.8)
 await engine.unlock();await settle();await settle()
 const stems=context.voices.filter(v=>v.loop && v.buffer)
 expect(stems).toHaveLength(4) // three music stems plus procedural ambience
 expect(stems.slice(0,3).map(v=>v.starts[0])).toEqual([[.02,0],[.02,0],[.02,0]])
 expect(load).toHaveBeenCalledTimes(3)
 engine.updatePressure(.1,"v4-market-tension")
 expect(context.gains.slice(-3).map(g=>g.gain.value)).toContain(0)
 engine.setNativeVisible(false)
 expect(stems.every(v=>v.stopped)).toBe(true)
 engine.setNativeVisible(true);await settle();await settle()
 expect(load).toHaveBeenCalledTimes(3)
})
