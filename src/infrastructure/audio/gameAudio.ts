import {
  usesStems,
  stemPaths,
  pressureGains,
  nextBar,
  STEM_LOOP,
} from "../../game/adaptiveScore"
import {
  musicAsset,
  musicPath,
  type MusicAsset,
  type MusicStyle,
  type MusicTrack,
  type GameSound,
} from "../../game/audioScore"
import { Capacitor } from "@capacitor/core"
import { streamingMusicPath } from "../../game/webSoundtrack"

export interface AudioOptions {
  soundEnabled: boolean
  musicEnabled?: boolean
  musicStyle?: MusicStyle
  musicVolume?: number
  effectsVolume?: number
  ambienceVolume?: number
}
interface Request {
  track: MusicTrack
  priority: number
  order: number
  pressure: number
}
interface MusicVoice {
  track: MusicAsset
  source: AudioBufferSourceNode
  gain: GainNode
  started: number
  offset: number
  layers?: MusicVoice[]
  pressure?: number
}
interface Dependencies {
  context: () => AudioContext
  load: (url: string) => Promise<ArrayBuffer>
  visible: () => boolean
  media?: () => HTMLAudioElement
}
interface StreamVoice {
  track: MusicAsset
  element: HTMLAudioElement
  source: MediaElementAudioSourceNode
  gain: GainNode
  retire?: ReturnType<typeof setTimeout>
  error: () => void
}
export interface AudioStatus {
  phase: "waiting" | "playing" | "muted" | "ready" | "error"
  track: MusicTrack | null
  style: MusicStyle
}

const clamp = (value: number | undefined, fallback: number) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value!)) : fallback

/** A single mixer for TCG music and SFX. It never writes game state. */
export class GameAudioEngine {
  private options: Required<AudioOptions> = {
    soundEnabled: true,
    musicEnabled: true,
    musicStyle: "original",
    musicVolume: 0.38,
    effectsVolume: 0.7,
    ambienceVolume: 0.18,
  }
  private context: AudioContext | null = null
  private musicBus: GainNode | null = null
  private effectsBus: GainNode | null = null
  private ambienceBus: GainNode | null = null
  private ambience: AudioBufferSourceNode | null = null
  private nativeVisible = true
  private requests = new Map<symbol, Request>()
  private buffers = new Map<string, AudioBuffer>()
  private inFlight = new Map<string, Promise<AudioBuffer>>()
  private offsets = new Map<MusicAsset, number>()
  private musicVoices = new Set<MusicVoice>()
  private current: MusicVoice | null = null
  private stream: StreamVoice | null = null
  private streams = new Set<StreamVoice>()
  private failedStreams = new Set<MusicAsset>()
  private effects = new Set<AudioScheduledSourceNode>()
  private effectPanners = new Set<StereoPannerNode>()
  private noise: AudioBuffer | null = null
  private mounted = false
  private unlocked = false
  private serial = 0
  private epoch = 0
  private loading: MusicAsset | null = null
  private duckTimer: ReturnType<typeof setTimeout> | null = null
  private status: AudioStatus = {
    phase: "waiting",
    track: null,
    style: "original",
  }
  private listeners = new Set<() => void>()

  constructor(
    private deps: Dependencies = {
      context: () => new AudioContext(),
      load: async (url) => {
        const response = await fetch(url)
        if (!response.ok) throw new Error("Music could not load")
        return response.arrayBuffer()
      },
      visible: () => typeof document !== "undefined" && !document.hidden,
      media: () => new Audio(),
    },
  ) {}

  getSnapshot = () => this.status
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  private notify(phase: AudioStatus["phase"]) {
    const track = this.desired()?.track ?? null
    const style = this.options.musicStyle
    if (
      this.status.phase === phase &&
      this.status.track === track &&
      this.status.style === style
    )
      return
    this.status = { phase, track, style }
    this.listeners.forEach((listener) => listener())
  }
  private desired() {
    return [...this.requests.values()].sort(
      (a, b) => b.priority - a.priority || b.order - a.order,
    )[0]
  }
  mount() {
    this.mounted = true
    const gesture = () => void this.unlock()
    const visibility = () => this.visibilityChanged()
    window.addEventListener("pointerdown", gesture, true)
    window.addEventListener("keydown", gesture, true)
    document.addEventListener("visibilitychange", visibility)
    return () => {
      window.removeEventListener("pointerdown", gesture, true)
      window.removeEventListener("keydown", gesture, true)
      document.removeEventListener("visibilitychange", visibility)
      this.dispose()
    }
  }
  configure(options: AudioOptions) {
    this.options = {
      soundEnabled: options.soundEnabled,
      musicEnabled: options.musicEnabled ?? true,
      musicStyle: options.musicStyle === "8bit" ? "8bit" : "original",
      musicVolume: clamp(options.musicVolume, 0.38),
      effectsVolume: clamp(options.effectsVolume, 0.7),
      ambienceVolume: clamp(options.ambienceVolume, 0.18),
    }
    if (!this.options.soundEnabled) this.stopEffects()
    this.updateVolumes()
    this.syncMusic()
  }
  acquire(track: MusicTrack, priority = 5, pressure = 0) {
    const id = Symbol(track)
    this.requests.set(id, { track, priority, order: ++this.serial, pressure })
    this.syncMusic()
    return () => {
      this.requests.delete(id)
      this.syncMusic()
    }
  }
  updatePressure(pressure: number, track?: MusicTrack | null) {
    for (const request of this.requests.values())
      if (!track || request.track === track)
        request.pressure = Math.max(0, Math.min(1, pressure))
    this.schedulePressure()
  }
  setNativeVisible(visible: boolean) {
    this.nativeVisible = visible
    this.visibilityChanged()
  }
  private visible() {
    return this.nativeVisible && this.deps.visible()
  }
  async unlock() {
    if (!this.mounted || !this.options.soundEnabled || !this.visible()) return
    try {
      if (!this.context) {
        this.context = this.deps.context()
        this.musicBus = this.context.createGain()
        this.effectsBus = this.context.createGain()
        this.ambienceBus = this.context.createGain()
        this.ambienceBus.connect(this.context.destination)
        this.musicBus.connect(this.context.destination)
        this.effectsBus.connect(this.context.destination)
        this.updateVolumes()
      }
      const context = this.context
      if (context.state !== "running") await context.resume()
      if (context !== this.context || !this.mounted) return
      this.unlocked = context.state === "running"
      this.syncMusic()
    } catch {
      this.notify("waiting")
    }
  }
  private updateVolumes(duck = 1) {
    if (!this.context) return
    for (const [bus, value] of [
      [
        this.musicBus,
        this.options.soundEnabled && this.options.musicEnabled
          ? this.options.musicVolume * duck
          : 0,
      ],
      [
        this.ambienceBus,
        this.options.soundEnabled ? this.options.ambienceVolume * 0.1 : 0,
      ],
      [
        this.effectsBus,
        this.options.soundEnabled ? this.options.effectsVolume : 0,
      ],
    ] as const) {
      if (!bus) continue
      bus.gain.cancelScheduledValues(this.context.currentTime)
      bus.gain.setTargetAtTime(value, this.context.currentTime, 0.035)
    }
  }
  private remember(voice: MusicVoice) {
    if (this.context && voice.source.buffer)
      this.offsets.set(
        voice.track,
        (voice.offset + this.context.currentTime - voice.started) %
          (usesStems(voice.track) ? STEM_LOOP : voice.source.buffer.duration),
      )
  }
  private trimBuffers() {
    const leased = new Set([...this.musicVoices].map((v) => v.source.buffer))
    for (const [key, buffer] of this.buffers) {
      if (this.resourceStats().bytes <= 48 * 1024 * 1024) break
      if (!leased.has(buffer)) this.buffers.delete(key)
    }
  }
  private schedulePressure() {
    const voice = this.current,
      context = this.context
    if (!voice?.layers || !context) return
    const level = this.desired()?.pressure ?? 0
    const gains = pressureGains(level),
      previous = voice.pressure
    // Discrete levels prevent noisy HP changes from continually cancelling an audio bar.
    const key = gains[1] + gains[2]
    if (previous === key) return
    voice.pressure = key
    const at = nextBar(context.currentTime, voice.started)
    voice.layers.forEach((layer, i) => {
      layer.gain.gain.cancelScheduledValues(context.currentTime)
      layer.gain.gain.setValueAtTime(layer.gain.gain.value, context.currentTime)
      layer.gain.gain.setValueAtTime(layer.gain.gain.value, at)
      layer.gain.gain.linearRampToValueAtTime(gains[i + 1], at + 0.15)
    })
  }
  private syncAmbience() {
    const track = this.desired()?.track ?? ""
    if (
      !track.startsWith("v4-") ||
      !this.visible() ||
      !this.options.soundEnabled
    ) {
      if (this.ambience) {
        try {
          this.ambience.stop()
        } catch {}
        this.ambience.disconnect()
        this.ambience = null
      }
      return
    }
    if (this.ambience || !this.context || !this.unlocked) return
    const context = this.context,
      source = context.createBufferSource()
    const buffer = context.createBuffer(
        1,
        context.sampleRate * 4,
        context.sampleRate,
      ),
      data = buffer.getChannelData(0)
    let seed = 397,
      smooth = 0
    for (let i = 0; i < data.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      smooth = 0.995 * smooth + 0.005 * (seed / 2147483648 - 1)
      data[i] = smooth * Math.sin((Math.PI * i) / data.length) ** 2
    }
    source.buffer = buffer
    source.loop = true
    source.connect(this.ambienceBus!)
    source.start()
    this.ambience = source
  }
  resourceStats() {
    const unique = new Set(this.buffers.values())
    for (const voice of this.musicVoices)
      if (voice.source.buffer) unique.add(voice.source.buffer)
    if (this.noise) unique.add(this.noise)
    if (this.ambience?.buffer) unique.add(this.ambience.buffer)
    return {
      bytes: [...unique].reduce(
        (sum, b) => sum + (b.length || 0) * (b.numberOfChannels || 1) * 4,
        0,
      ),
      buffers: unique.size,
      musicVoices: this.musicVoices.size,
      streamingVoices: this.streams.size,
      effects: this.effects.size,
      budget: 48 * 1024 * 1024,
    }
  }
  private stopMusic() {
    for (const stream of [...this.streams]) this.stopStream(stream)
    if (this.current) this.remember(this.current)
    for (const voice of this.musicVoices) {
      try {
        voice.source.stop()
      } catch {
        /* already stopped */
      }
      voice.source.disconnect()
      voice.gain.disconnect()
    }
    this.musicVoices.clear()
    this.current = null
    this.trimBuffers()
    if (this.ambience) {
      try {
        this.ambience.stop()
      } catch {}
      this.ambience.disconnect()
      this.ambience = null
    }
  }
  private stopStream(voice: StreamVoice) {
    if (!this.streams.has(voice)) return
    if (Number.isFinite(voice.element.currentTime)) this.offsets.set(voice.track, voice.element.currentTime)
    clearTimeout(voice.retire)
    voice.element.removeEventListener("error", voice.error)
    voice.element.pause()
    voice.element.removeAttribute("src")
    voice.element.load()
    voice.source.disconnect(); voice.gain.disconnect()
    this.streams.delete(voice)
    if (this.stream === voice) this.stream = null
  }
  private fadeStream(voice: StreamVoice) {
    if (!this.context) return this.stopStream(voice)
    voice.gain.gain.cancelScheduledValues(this.context.currentTime)
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, this.context.currentTime)
    voice.gain.gain.linearRampToValueAtTime(0, this.context.currentTime + .4)
    voice.retire = setTimeout(() => this.stopStream(voice), 450)
    if (this.stream === voice) this.stream = null
  }
  private startStream(track: MusicAsset, path: string, epoch: number, context: AudioContext) {
    const element = this.deps.media!(), gain = context.createGain()
    element.loop = true; element.preload = "auto"
    element.src = `${import.meta.env.BASE_URL}${path}`
    const source = context.createMediaElementSource(element)
    source.connect(gain); gain.connect(this.musicBus!)
    gain.gain.setValueAtTime(0, context.currentTime)
    const valid = () => this.mounted && epoch === this.epoch && context === this.context && this.visible() && this.options.soundEnabled && this.options.musicEnabled
    const error = () => {
      const wasCurrent = this.stream === voice
      this.stopStream(voice)
      if (!valid() && !(wasCurrent && this.mounted && this.visible() && this.options.soundEnabled && this.options.musicEnabled)) return
      this.failedStreams.add(track); this.loading = null
      this.syncMusic() // Existing compact score remains a fallback.
    }
    const voice: StreamVoice = { track, element, source, gain, error }
    this.streams.add(voice)
    element.addEventListener("error", error)
    const offset = this.offsets.get(track) ?? 0
    if (offset > 0) element.currentTime = offset
    void element.play().then(() => {
      if (!valid()) { this.stopStream(voice); return }
      this.loading = null
      // Commit the new voice before retiring old ones. Never decode long scores.
      for (const old of [...this.streams]) if (old !== voice) this.fadeStream(old)
      if (this.current) {
        this.remember(this.current)
        for (const old of [this.current, ...(this.current.layers ?? [])]) {
          old.gain.gain.cancelScheduledValues(context.currentTime)
          old.gain.gain.setValueAtTime(old.gain.gain.value, context.currentTime)
          old.gain.gain.linearRampToValueAtTime(0, context.currentTime + .4)
          old.source.stop(context.currentTime + .45)
        }
        this.current = null
      }
      this.stream = voice
      gain.gain.linearRampToValueAtTime(1, context.currentTime + .45)
      this.syncAmbience(); this.notify("playing")
    }).catch(error)
  }
  private syncMusic() {
    const request = this.desired()?.track
    const desired = request
      ? musicAsset(request, this.options.musicStyle)
      : undefined
    if (
      !this.mounted ||
      !this.options.soundEnabled ||
      !this.options.musicEnabled ||
      !this.visible() ||
      !this.unlocked ||
      this.context?.state !== "running"
    ) {
      ++this.epoch
      this.loading = null
      this.stopMusic()
      this.notify(
        !this.options.soundEnabled || !this.options.musicEnabled
          ? "muted"
          : "waiting",
      )
      return
    }
    if (!desired) {
      ++this.epoch
      this.loading = null
      this.stopMusic()
      this.notify("ready")
      return
    }
    if (this.stream?.track === desired) {
      if (this.loading && this.loading !== desired) { ++this.epoch; this.loading = null }
      this.notify("playing"); return
    }
    if (this.current?.track === desired) {
      if (this.loading && this.loading !== desired) {
        ++this.epoch
        this.loading = null
      }
      this.schedulePressure()
      this.syncAmbience()
      this.notify("playing")
      return
    }
    if (this.loading === desired) return
    const epoch = ++this.epoch
    for (const stream of [...this.streams]) if (stream !== this.stream) this.stopStream(stream)
    const context = this.context
    this.loading = desired
    const adaptive = usesStems(desired)
    const streamPath = streamingMusicPath(desired)
    if (!adaptive && streamPath && this.deps.media && !Capacitor.isNativePlatform() && !this.failedStreams.has(desired)) {
      this.startStream(desired, streamPath, epoch, context)
      return
    }
    const paths = adaptive
      ? stemPaths(this.options.musicStyle, this.deps.media && !Capacitor.isNativePlatform() ? desired : undefined)
      : [musicPath(desired)]
    void Promise.all(paths.map((path) => this.loadMusic(path, context)))
      .then(([buffer, ...stems]) => {
        if (
          epoch !== this.epoch ||
          context !== this.context ||
          !this.desired() ||
          musicAsset(this.desired()!.track, this.options.musicStyle) !==
            desired ||
          !this.visible() ||
          !this.options.soundEnabled ||
          !this.options.musicEnabled
        )
          return
        this.loading = null
        for (const stream of [...this.streams]) this.fadeStream(stream)
        const source = context.createBufferSource()
        const gain = context.createGain()
        source.buffer = buffer
        source.loop = true
        if (adaptive) {
          source.loopStart = 0
          source.loopEnd = STEM_LOOP
        }
        source.connect(gain)
        gain.connect(this.musicBus!)
        const now = context.currentTime + (adaptive ? 0.02 : 0)
        const offset = (this.offsets.get(desired) ?? 0) % buffer.duration
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(1, now + 0.45)
        const voice: MusicVoice = {
          track: desired,
          source,
          gain,
          offset,
          started: now,
        }
        this.musicVoices.add(voice)
        source.onended = () => {
          source.disconnect()
          gain.disconnect()
          this.musicVoices.delete(voice)
          this.trimBuffers()
        }
        if (stems.length) {
          const levels = pressureGains(this.desired()?.pressure ?? 0)
          voice.pressure = levels[1] + levels[2]
          voice.layers = stems.map((stem, i) => {
            const source = context.createBufferSource(),
              gain = context.createGain()
            source.buffer = stem
            source.loop = true
            source.loopStart = 0
            source.loopEnd = STEM_LOOP
            source.connect(gain)
            gain.connect(this.musicBus!)
            gain.gain.setValueAtTime(0, now)
            gain.gain.linearRampToValueAtTime(levels[i + 1], now + 0.45)
            const layer: MusicVoice = {
              track: desired,
              source,
              gain,
              offset,
              started: now,
            }
            this.musicVoices.add(layer)
            source.onended = () => {
              source.disconnect()
              gain.disconnect()
              this.musicVoices.delete(layer)
              this.trimBuffers()
            }
            source.start(now, offset % STEM_LOOP)
            return layer
          })
        }
        if (this.current) {
          for (const layer of this.current.layers ?? []) {
            layer.gain.gain.cancelScheduledValues(now)
            layer.gain.gain.setValueAtTime(layer.gain.gain.value, now)
            layer.gain.gain.linearRampToValueAtTime(0, now + 0.4)
            layer.source.stop(now + 0.45)
          }
          this.remember(this.current)
          this.current.gain.gain.cancelScheduledValues(now)
          this.current.gain.gain.setValueAtTime(
            this.current.gain.gain.value,
            now,
          )
          this.current.gain.gain.linearRampToValueAtTime(0, now + 0.4)
          this.current.source.stop(now + 0.45)
        }
        this.current = voice
        source.start(now, adaptive ? offset % STEM_LOOP : offset)
        this.syncAmbience()
        this.notify("playing")
      })
      .catch(() => {
        if (epoch === this.epoch) {
          this.loading = null
          this.notify("error")
        }
      })
  }
  private loadMusic(path: string, context: AudioContext): Promise<AudioBuffer> {
    const cached = this.buffers.get(path)
    if (cached) {
      this.buffers.delete(path)
      this.buffers.set(path, cached)
      return Promise.resolve(cached)
    }
    const pending = this.inFlight.get(path)
    if (pending) return pending
    const load = (async () => {
      const data = await this.deps.load(`${import.meta.env.BASE_URL}${path}`)
      const buffer = await context.decodeAudioData(data)
      if (context === this.context && this.mounted) {
        const bytes = (b: AudioBuffer) =>
          (b.length || 0) * (b.numberOfChannels || 1) * 4
        const leased = new Set(
          [...this.musicVoices].map((v) => v.source.buffer),
        )
        for (const [key, item] of this.buffers) {
          if (this.resourceStats().bytes + bytes(buffer) <= 48 * 1024 * 1024)
            break
          if (!leased.has(item)) this.buffers.delete(key)
        }
        if (this.resourceStats().bytes + bytes(buffer) > 64 * 1024 * 1024)
          throw new Error("Audio memory budget exceeded")
        this.buffers.set(path, buffer)
      }
      return buffer
    })().finally(() => {
      if (this.inFlight.get(path) === load) this.inFlight.delete(path)
    })
    this.inFlight.set(path, load)
    return load
  }
  visibilityChanged() {
    if (!this.visible()) {
      this.stopEffects()
      this.syncMusic()
      void this.context?.suspend().catch(() => {})
    } else if (this.unlocked) void this.unlock()
  }
  private stopEffects() {
    for (const source of this.effects) {
      try {
        source.stop()
      } catch {
        /* already stopped */
      }
      source.disconnect()
    }
    this.effects.clear()
    for (const panner of this.effectPanners) panner.disconnect()
    this.effectPanners.clear()
    if (this.duckTimer) clearTimeout(this.duckTimer)
    this.duckTimer = null
    this.updateVolumes()
  }
  play(cue: GameSound, delay = 0, pan = 0) {
    const context = this.context
    if (
      !context ||
      !this.unlocked ||
      !this.mounted ||
      !this.options.soundEnabled ||
      this.options.effectsVolume <= 0 ||
      !this.visible() ||
      context.state !== "running" ||
      this.effects.size >= 48
    )
      return
    const now = context.currentTime + Math.max(0, delay) / 1000
    const variation = [0.98, 1, 1.02][++this.serial % 3]
    const panner =
      pan && typeof context.createStereoPanner === "function"
        ? context.createStereoPanner()
        : null
    if (panner) {
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now)
      panner.connect(this.effectsBus!)
      this.effectPanners.add(panner)
    }
    const output = panner ?? this.effectsBus!
    let voices = 0
    const release = () => {
      if (--voices <= 0 && panner) {
        panner.disconnect()
        this.effectPanners.delete(panner)
      }
    }
    const tone = (
      frequency: number,
      duration: number,
      volume: number,
      type: OscillatorType = "sine",
      end?: number,
      at = now,
    ) => {
      if (this.effects.size >= 48) return
      const source = context.createOscillator(),
        gain = context.createGain()
      source.type = type
      source.frequency.setValueAtTime(frequency * variation, at)
      if (end)
        source.frequency.exponentialRampToValueAtTime(
          end * variation,
          at + duration,
        )
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.linearRampToValueAtTime(volume, at + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
      source.connect(gain)
      gain.connect(output)
      this.effects.add(source)
      voices++
      source.onended = () => {
        source.disconnect()
        gain.disconnect()
        this.effects.delete(source)
        release()
      }
      source.start(at)
      source.stop(at + duration + 0.02)
    }
    const noise = (
      duration: number,
      volume: number,
      cutoff: number,
      end: number,
    ) => {
      if (this.effects.size >= 48) return
      if (!this.noise) {
        this.noise = context.createBuffer(
          1,
          context.sampleRate,
          context.sampleRate,
        )
        const values = this.noise.getChannelData(0)
        let seed = 731
        for (let i = 0; i < values.length; i++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
          values[i] = seed / 2147483648 - 1
        }
      }
      const source = context.createBufferSource(),
        gain = context.createGain(),
        filter = context.createBiquadFilter()
      source.buffer = this.noise
      filter.type = "lowpass"
      filter.frequency.setValueAtTime(cutoff, now)
      filter.frequency.exponentialRampToValueAtTime(end, now + duration)
      gain.gain.setValueAtTime(volume, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
      source.connect(filter)
      filter.connect(gain)
      gain.connect(output)
      this.effects.add(source)
      voices++
      source.onended = () => {
        source.disconnect()
        filter.disconnect()
        gain.disconnect()
        this.effects.delete(source)
        release()
      }
      source.start(now)
      source.stop(now + duration)
    }
    const chime = (
      notes: number[],
      duration = 0.3,
      step = 0.08,
      volume = 0.055,
    ) =>
      notes.forEach((frequency, index) => {
        tone(frequency, duration, volume, "sine", undefined, now + index * step)
        tone(
          frequency * 2,
          duration * 0.5,
          volume * 0.2,
          "sine",
          undefined,
          now + index * step,
        )
      })
    switch (cue) {
      case "auto-slash":
        noise(0.11, 0.045, 6800, 850)
        tone(310, 0.1, 0.025, "triangle", 120)
        break
      case "auto-shot":
        tone(820, 0.12, 0.033, "triangle", 310)
        noise(0.07, 0.025, 4000, 1600)
        break
      case "auto-contact":
        tone(115, 0.16, 0.065, "sine", 48)
        noise(0.095, 0.052, 2000, 350)
        break
      case "auto-channel":
        tone(220, 0.28, 0.033, "triangle", 660)
        tone(330, 0.32, 0.025, "sine", 990)
        break
      case "auto-fall":
        noise(0.27, 0.035, 3400, 300)
        tone(520, 0.3, 0.025, "sine", 130)
        break
      case "auto-boss":
        tone(65, 0.7, 0.075, "triangle", 42)
        noise(0.48, 0.07, 900, 280)
        chime([196, 233, 294], 0.48, 0.12, 0.035)
        break
      case "auto-overtime":
        chime([294, 392, 587], 0.25, 0.12, 0.045)
        tone(82, 0.3, 0.055, "sine", 52)
        break
      case "auto-victory":
      case "auto-defeat": {
        this.updateVolumes(0.35)
        if (this.duckTimer) clearTimeout(this.duckTimer)
        this.duckTimer = setTimeout(() => {
          this.duckTimer = null
          this.updateVolumes()
        }, 1800)
        chime(
          cue === "auto-victory"
            ? [294, 392, 440, 587, 784]
            : [392, 330, 294, 220],
          0.65,
          0.17,
          0.055,
        )
        tone(82, 0.35, 0.045, "sine", 52)
        break
      }
      case "combo":
        chime([294, 392, 494, 587, 784], 0.6, 0.075, 0.06)
        tone(98, 0.45, 0.035, "sine", 196)
        break
      case "select":
        tone(600, 0.12, 0.055, "triangle", 900)
        break
      case "deselect":
        tone(570, 0.1, 0.035, "sine", 420)
        break
      case "confirm":
        chime([392, 587], 0.16, 0.055)
        break
      case "cast":
        tone(180, 0.22, 0.055, "triangle", 880)
        noise(0.16, 0.05, 2500, 6000)
        break
      case "impact":
        tone(105, 0.22, 0.11, "sine", 42)
        noise(0.13, 0.08, 1700, 220)
        break
      case "fire":
        noise(0.42, 0.14, 5300, 650)
        tone(90, 0.3, 0.065, "triangle", 45)
        break
      case "water":
        noise(0.36, 0.1, 2600, 450)
        tone(680, 0.26, 0.05, "sine", 170)
        tone(980, 0.32, 0.035, "sine", 300)
        break
      case "leaves":
        noise(0.3, 0.065, 6400, 2300)
        chime([660, 880], 0.22)
        break
      case "sparkle":
        chime([880, 1175, 1568], 0.35, 0.045, 0.045)
        break
      case "heal":
        chime([392, 494, 587, 784], 0.42, 0.065, 0.05)
        break
      case "buff":
        chime([330, 440, 660], 0.32, 0.07)
        break
      case "shield":
        tone(370, 0.46, 0.07, "triangle")
        tone(740, 0.32, 0.025, "sine", 800)
        break
      case "break":
        noise(0.24, 0.105, 8200, 1300)
        chime([1245, 830, 622], 0.13, 0.035, 0.04)
        break
      case "summon":
        tone(140, 0.38, 0.055, "triangle", 420)
        chime([294, 440, 587], 0.28, 0.07)
        break
      case "draw":
        noise(0.09, 0.045, 3500, 900)
        tone(840, 0.07, 0.035, "triangle", 1100)
        break
      case "resonance":
        chime([440, 587, 880], 0.48, 0.065, 0.065)
        break
      case "turn":
        chime([330, 440], 0.22, 0.1, 0.045)
        break
      case "awaken":
        tone(110, 0.6, 0.09, "triangle", 55)
        chime([220, 311, 440], 0.55, 0.14, 0.06)
        break
      case "vanish":
        noise(0.25, 0.04, 2200, 350)
        tone(370, 0.24, 0.03, "sine", 160)
        break
      case "story-next":
        tone(660, 0.065, 0.025, "sine", 740)
        break
      case "victory":
      case "defeat": {
        this.updateVolumes(0.3)
        if (this.duckTimer) clearTimeout(this.duckTimer)
        this.duckTimer = setTimeout(() => {
          this.duckTimer = null
          this.updateVolumes()
        }, 2300)
        chime(
          cue === "victory"
            ? [392, 494, 587, 784, 988, 1175]
            : [440, 392, 330, 294, 220],
          0.85,
          0.18,
          0.07,
        )
        break
      }
    }
    if (!voices && panner) {
      panner.disconnect()
      this.effectPanners.delete(panner)
    }
  }
  dispose() {
    this.mounted = false
    this.unlocked = false
    ++this.epoch
    this.loading = null
    this.stopMusic()
    this.stopEffects()
    this.requests.clear()
    this.buffers.clear()
    this.inFlight.clear()
    this.offsets.clear()
    this.failedStreams.clear()
    const context = this.context
    this.context = null
    this.musicBus = this.effectsBus = this.ambienceBus = null
    this.noise = null
    void context?.close().catch(() => {})
    this.notify("waiting")
  }
}

export const gameAudio = new GameAudioEngine()
