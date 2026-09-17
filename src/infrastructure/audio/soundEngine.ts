export type SoundCue =
  | "key"
  | "lock"
  | "charge"
  | "pulse"
  | "impact"
  | "reveal"
  | "fusion"
  | "tick"

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

function getChestTrackUrl(): string {
  return import.meta.env.VITE_CHEST_OPENING_AUDIO_URL?.trim() ?? ""
}

export function preloadChestOpeningTrack(): void {
  if (typeof window === "undefined" || preloadedTrack) return
  const url = getChestTrackUrl()
  if (!url) return
  preloadedTrack = new Audio(url)
  preloadedTrack.preload = "auto"
  preloadedTrack.load()
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
