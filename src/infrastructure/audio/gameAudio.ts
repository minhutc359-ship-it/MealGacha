import {
  MUSIC_TRACKS,
  type MusicTrack,
  type GameSound,
} from "../../game/audioScore"

export interface AudioOptions {
  soundEnabled: boolean
  musicEnabled?: boolean
  musicVolume?: number
  effectsVolume?: number
}
interface Request {
  track: MusicTrack
  priority: number
  order: number
}
interface MusicVoice {
  track: MusicTrack
  source: AudioBufferSourceNode
  gain: GainNode
  started: number
  offset: number
}
interface Dependencies {
  context: () => AudioContext
  load: (url: string) => Promise<ArrayBuffer>
  visible: () => boolean
}
export interface AudioStatus {
  phase: "waiting" | "playing" | "muted" | "ready" | "error"
  track: MusicTrack | null
}

const clamp = (value: number | undefined, fallback: number) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value!)) : fallback

/** A single mixer for TCG music and SFX. It never writes game state. */
export class GameAudioEngine {
  private options: Required<AudioOptions> = {
    soundEnabled: true,
    musicEnabled: true,
    musicVolume: 0.38,
    effectsVolume: 0.7,
  }
  private context: AudioContext | null = null
  private musicBus: GainNode | null = null
  private effectsBus: GainNode | null = null
  private requests = new Map<symbol, Request>()
  private buffers = new Map<MusicTrack, AudioBuffer>()
  private offsets = new Map<MusicTrack, number>()
  private musicVoices = new Set<MusicVoice>()
  private current: MusicVoice | null = null
  private effects = new Set<AudioScheduledSourceNode>()
  private noise: AudioBuffer | null = null
  private mounted = false
  private unlocked = false
  private serial = 0
  private epoch = 0
  private loading: MusicTrack | null = null
  private duckTimer: ReturnType<typeof setTimeout> | null = null
  private status: AudioStatus = { phase: "waiting", track: null }
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
    },
  ) {}

  getSnapshot = () => this.status
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  private notify(phase: AudioStatus["phase"]) {
    const track = this.desired()?.track ?? null
    if (this.status.phase === phase && this.status.track === track) return
    this.status = { phase, track }
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
      musicVolume: clamp(options.musicVolume, 0.38),
      effectsVolume: clamp(options.effectsVolume, 0.7),
    }
    if (!this.options.soundEnabled) this.stopEffects()
    this.updateVolumes()
    this.syncMusic()
  }
  acquire(track: MusicTrack, priority = 5) {
    const id = Symbol(track)
    this.requests.set(id, { track, priority, order: ++this.serial })
    this.syncMusic()
    return () => {
      this.requests.delete(id)
      this.syncMusic()
    }
  }
  async unlock() {
    if (!this.mounted || !this.options.soundEnabled || !this.deps.visible())
      return
    try {
      if (!this.context) {
        this.context = this.deps.context()
        this.musicBus = this.context.createGain()
        this.effectsBus = this.context.createGain()
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
          voice.source.buffer.duration,
      )
  }
  private stopMusic() {
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
  }
  private syncMusic() {
    const desired = this.desired()?.track
    if (
      !this.mounted ||
      !this.options.soundEnabled ||
      !this.options.musicEnabled ||
      !this.deps.visible() ||
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
    if (this.current?.track === desired) {
      if (this.loading && this.loading !== desired) {
        ++this.epoch
        this.loading = null
      }
      this.notify("playing")
      return
    }
    if (this.loading === desired) return
    const epoch = ++this.epoch
    const context = this.context
    this.loading = desired
    void this.loadMusic(desired, context)
      .then((buffer) => {
        if (
          epoch !== this.epoch ||
          context !== this.context ||
          this.desired()?.track !== desired ||
          !this.deps.visible() ||
          !this.options.soundEnabled ||
          !this.options.musicEnabled
        )
          return
        this.loading = null
        const source = context.createBufferSource()
        const gain = context.createGain()
        source.buffer = buffer
        source.loop = true
        source.connect(gain)
        gain.connect(this.musicBus!)
        const now = context.currentTime
        const offset = (this.offsets.get(desired) ?? 0) % buffer.duration
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(1, now + 0.45)
        const voice = { track: desired, source, gain, offset, started: now }
        this.musicVoices.add(voice)
        source.onended = () => {
          source.disconnect()
          gain.disconnect()
          this.musicVoices.delete(voice)
        }
        if (this.current) {
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
        source.start(now, offset)
        this.notify("playing")
      })
      .catch(() => {
        if (epoch === this.epoch) {
          this.loading = null
          this.notify("error")
        }
      })
  }
  private async loadMusic(track: MusicTrack, context: AudioContext) {
    const cached = this.buffers.get(track)
    if (cached) return cached
    const data = await this.deps.load(
      `${import.meta.env.BASE_URL}${MUSIC_TRACKS[track]}`,
    )
    const buffer = await context.decodeAudioData(data)
    if (context === this.context && this.mounted) {
      if (this.buffers.size >= 2)
        this.buffers.delete(this.buffers.keys().next().value!)
      this.buffers.set(track, buffer)
    }
    return buffer
  }
  visibilityChanged() {
    if (!this.deps.visible()) {
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
    if (this.duckTimer) clearTimeout(this.duckTimer)
    this.duckTimer = null
    this.updateVolumes()
  }
  play(cue: GameSound, delay = 0) {
    const context = this.context
    if (
      !context ||
      !this.unlocked ||
      !this.mounted ||
      !this.options.soundEnabled ||
      this.options.effectsVolume <= 0 ||
      !this.deps.visible() ||
      context.state !== "running" ||
      this.effects.size > 48
    )
      return
    const now = context.currentTime + Math.max(0, delay) / 1000
    const tone = (
      frequency: number,
      duration: number,
      volume: number,
      type: OscillatorType = "sine",
      end?: number,
      at = now,
    ) => {
      const source = context.createOscillator(),
        gain = context.createGain()
      source.type = type
      source.frequency.setValueAtTime(frequency, at)
      if (end) source.frequency.exponentialRampToValueAtTime(end, at + duration)
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.linearRampToValueAtTime(volume, at + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
      source.connect(gain)
      gain.connect(this.effectsBus!)
      this.effects.add(source)
      source.onended = () => {
        source.disconnect()
        gain.disconnect()
        this.effects.delete(source)
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
      gain.connect(this.effectsBus!)
      this.effects.add(source)
      source.onended = () => {
        source.disconnect()
        filter.disconnect()
        gain.disconnect()
        this.effects.delete(source)
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
    this.offsets.clear()
    const context = this.context
    this.context = null
    this.musicBus = this.effectsBus = null
    this.noise = null
    void context?.close().catch(() => {})
    this.notify("waiting")
  }
}

export const gameAudio = new GameAudioEngine()
