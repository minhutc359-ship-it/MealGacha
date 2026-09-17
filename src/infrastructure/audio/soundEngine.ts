export type SoundCue = "key" | "charge" | "impact" | "reveal" | "fusion" | "tick"

const cueConfig: Record<SoundCue, {
  frequency: number
  duration: number
  type: OscillatorType
  gain: number
}> = {
  key: { frequency: 780, duration: 0.12, type: "sine", gain: 0.055 },
  charge: { frequency: 180, duration: 0.42, type: "sawtooth", gain: 0.025 },
  impact: { frequency: 74, duration: 0.28, type: "square", gain: 0.05 },
  reveal: { frequency: 1040, duration: 0.5, type: "sine", gain: 0.045 },
  fusion: { frequency: 620, duration: 0.55, type: "triangle", gain: 0.04 },
  tick: { frequency: 420, duration: 0.035, type: "square", gain: 0.018 },
}

let context: AudioContext | null = null

export function playSound(cue: SoundCue, enabled: boolean): void {
  if (!enabled || typeof window === "undefined") return
  try {
    context ??= new AudioContext()
    const cfg = cueConfig[cue]
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime
    oscillator.type = cfg.type
    oscillator.frequency.setValueAtTime(cfg.frequency, now)
    if (cue === "charge")
      oscillator.frequency.exponentialRampToValueAtTime(520, now + cfg.duration)
    gain.gain.setValueAtTime(cfg.gain, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + cfg.duration)
  } catch {
    // Audio feedback is progressive enhancement only.
  }
}
