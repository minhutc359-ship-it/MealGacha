export type SoundCue =
  | "key"
  | "lock"
  | "charge"
  | "pulse"
  | "impact"
  | "reveal"
  | "fusion"
  | "tick"

export type ClickSound = "normal" | "choose" | "function"

const cueConfig: Record<SoundCue, {
  frequency: number
  endFrequency?: number
  duration: number
  type: OscillatorType
  gain: number
}> = {
  key: { frequency: 780, endFrequency: 1080, duration: 0.12, type: "sine", gain: 0.055 },
  lock: { frequency: 132, endFrequency: 92, duration: 0.2, type: "square", gain: 0.026 },
  charge: { frequency: 180, endFrequency: 520, duration: 0.42, type: "sawtooth", gain: 0.025 },
  pulse: { frequency: 310, endFrequency: 620, duration: 0.18, type: "triangle", gain: 0.038 },
  impact: { frequency: 74, endFrequency: 42, duration: 0.28, type: "square", gain: 0.05 },
  reveal: { frequency: 1040, endFrequency: 1380, duration: 0.5, type: "sine", gain: 0.045 },
  fusion: { frequency: 620, endFrequency: 960, duration: 0.55, type: "triangle", gain: 0.04 },
  tick: { frequency: 420, duration: 0.035, type: "square", gain: 0.018 },
}

let context: AudioContext | null = null
let preloadedTrack: HTMLAudioElement | null = null
let activeTrack: HTMLAudioElement | null = null
let preloadedSpinTrack: HTMLAudioElement | null = null
let activeSpinTrack: HTMLAudioElement | null = null
let preloadedSpinResultTrack: HTMLAudioElement | null = null
let activeSpinResultTrack: HTMLAudioElement | null = null
const preloadedClickTracks: Partial<Record<ClickSound, HTMLAudioElement>> = {}
let activeClickTrack: HTMLAudioElement | null = null

const clickSoundUrls: Record<ClickSound, string> = {
  normal: "assets/audio/clicks/normal_click.mp3",
  choose: "assets/audio/clicks/choose_click.mp3",
  function: "assets/audio/clicks/function_click.mp3",
}

function getPublicAssetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`
}

function getChestTrackUrl(): string {
  return import.meta.env.VITE_CHEST_OPENING_AUDIO_URL?.trim()
    || getPublicAssetUrl("assets/audio/chest-opening.mp3")
}

function getSpinTrackUrl(): string {
  return getPublicAssetUrl("assets/audio/spin.mp3")
}

function getSpinResultTrackUrl(): string {
  return getPublicAssetUrl("assets/audio/reward-received.mp3")
}

export function preloadRewardReceivedTrack(): void {
  if (typeof window === "undefined" || preloadedSpinResultTrack) return
  const resultAudio = new Audio(getSpinResultTrackUrl())
  resultAudio.preload = "auto"
  resultAudio.load()
  preloadedSpinResultTrack = resultAudio
}

export function preloadClickSounds(): void {
  if (typeof window === "undefined") return
  for (const sound of Object.keys(clickSoundUrls) as ClickSound[]) {
    if (preloadedClickTracks[sound]) continue
    const audio = new Audio(getPublicAssetUrl(clickSoundUrls[sound]))
    audio.preload = "auto"
    audio.load()
    preloadedClickTracks[sound] = audio
  }
}

export function preloadChestOpeningTrack(): void {
  if (typeof window === "undefined" || preloadedTrack) return
  const url = getChestTrackUrl()
  if (!url) return
  preloadedTrack = new Audio(url)
  preloadedTrack.preload = "auto"
  preloadedTrack.load()
}

export function preloadSpinTrack(): void {
  if (typeof window === "undefined" || preloadedSpinTrack) return
  const audio = new Audio(getSpinTrackUrl())
  audio.preload = "auto"
  audio.load()
  preloadedSpinTrack = audio

  preloadRewardReceivedTrack()
}

export function startSpinTrack(enabled: boolean): boolean {
  if (typeof window === "undefined") return false

  stopSpinTrack()
  if (!enabled) return false
  const audio = preloadedSpinTrack ?? new Audio(getSpinTrackUrl())
  preloadedSpinTrack = null
  audio.currentTime = 0
  audio.volume = 0.72
  activeSpinTrack = audio
  void audio.play().catch(() => {
    if (activeSpinTrack === audio) activeSpinTrack = null
  })
  return true
}

export function stopSpinTrack(): void {
  if (!activeSpinTrack) return
  activeSpinTrack.pause()
  activeSpinTrack.currentTime = 0
  activeSpinTrack = null
}

export function startSpinResultTrack(enabled: boolean): boolean {
  if (typeof window === "undefined") return false

  stopSpinResultTrack()
  if (!enabled) return false
  const audio = preloadedSpinResultTrack ?? new Audio(getSpinResultTrackUrl())
  preloadedSpinResultTrack = null
  audio.currentTime = 0
  audio.volume = 0.72
  activeSpinResultTrack = audio
  audio.addEventListener("ended", () => {
    if (activeSpinResultTrack === audio) activeSpinResultTrack = null
  }, { once: true })
  void audio.play().catch(() => {
    if (activeSpinResultTrack === audio) activeSpinResultTrack = null
  })
  return true
}

export function stopSpinResultTrack(): void {
  if (!activeSpinResultTrack) return
  activeSpinResultTrack.pause()
  activeSpinResultTrack.currentTime = 0
  activeSpinResultTrack = null
}

export function startChestOpeningTrack(enabled: boolean): boolean {
  if (!enabled || typeof window === "undefined") return false
  const url = getChestTrackUrl()
  if (!url) return false

  stopChestOpeningTrack()
  const audio = preloadedTrack ?? new Audio(url)
  preloadedTrack = null
  audio.currentTime = 0
  audio.volume = 0.72
  activeTrack = audio
  audio.addEventListener("ended", () => {
    if (activeTrack === audio) activeTrack = null
  }, { once: true })
  void audio.play().catch(() => {
    if (activeTrack === audio) activeTrack = null
  })
  return true
}

export function stopChestOpeningTrack(): void {
  if (!activeTrack) return
  activeTrack.pause()
  activeTrack.currentTime = 0
  activeTrack = null
}

export function playClickSound(sound: ClickSound, enabled: boolean): void {
  if (!enabled || typeof window === "undefined") return
  const audio = preloadedClickTracks[sound] ?? new Audio(getPublicAssetUrl(clickSoundUrls[sound]))
  preloadedClickTracks[sound] = audio
  if (activeClickTrack && activeClickTrack !== audio) {
    activeClickTrack.pause()
    activeClickTrack.currentTime = 0
  }
  audio.currentTime = 0
  audio.volume = 0.55
  activeClickTrack = audio
  void audio.play().catch(() => {
    if (activeClickTrack === audio) activeClickTrack = null
  })
}

export function playSound(
  cue: SoundCue,
  enabled: boolean,
  gainScale = 1,
): void {
  if (!enabled || typeof window === "undefined") return
  try {
    context ??= new AudioContext()
    const cfg = cueConfig[cue]
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime
    oscillator.type = cfg.type
    oscillator.frequency.setValueAtTime(cfg.frequency, now)
    if (cfg.endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(
        cfg.endFrequency,
        now + cfg.duration,
      )
    }
    gain.gain.setValueAtTime(cfg.gain * gainScale, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + cfg.duration)
  } catch {
    // Audio feedback is progressive enhancement only.
  }
}
