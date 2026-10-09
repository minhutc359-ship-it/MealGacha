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

// Original procedural cues: no third-party recordings or network downloads.
let context: AudioContext | null = null
type Lane = { timers: Set<ReturnType<typeof setTimeout>>; voices: Set<OscillatorNode> }
const lanes: Record<"spin" | "reward" | "chest", Lane> = {
  spin: { timers: new Set(), voices: new Set() },
  reward: { timers: new Set(), voices: new Set() },
  chest: { timers: new Set(), voices: new Set() },
}

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    const Audio = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Audio) return null
    context ??= new Audio()
    if (context.state === "suspended") void context.resume().catch(() => {})
    return context
  } catch { return null }
}

function tone(cue: SoundCue, gainScale: number, lane?: Lane, pitch = 1): void {
  const ctx = audioContext()
  if (!ctx || (typeof document !== "undefined" && document.hidden)) return
  const cfg = cueConfig[cue]
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  const now = ctx.currentTime
  oscillator.type = cfg.type
  oscillator.frequency.setValueAtTime(cfg.frequency * pitch, now)
  if (cfg.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(cfg.endFrequency * pitch, now + cfg.duration)
  gain.gain.setValueAtTime(cfg.gain * Math.max(0, Math.min(1.5, gainScale)), now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.duration)
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  lane?.voices.add(oscillator)
  oscillator.onended = () => {
    oscillator.disconnect()
    gain.disconnect()
    lane?.voices.delete(oscillator)
  }
  oscillator.start(now)
  oscillator.stop(now + cfg.duration)
}

function stop(lane: Lane): void {
  for (const timer of lane.timers) clearTimeout(timer)
  lane.timers.clear()
  for (const voice of lane.voices) {
    try { voice.stop() } catch { /* Already ended. */ }
  }
  lane.voices.clear()
}

function later(lane: Lane, callback: () => void, delay: number): void {
  const timer = setTimeout(() => { lane.timers.delete(timer); callback() }, delay)
  lane.timers.add(timer)
}

// Kept for callers; synthesis needs no preload and starts only after interaction.
export function preloadRewardReceivedTrack(): void {}
export function preloadClickSounds(): void {}
export function preloadChestOpeningTrack(): void {}
export function preloadSpinTrack(): void {}

export function startSpinTrack(enabled: boolean): boolean {
  stopSpinTrack()
  if (!enabled || !audioContext()) return false
  let beat = 0
  const phrase = () => {
    tone("tick", 0.65, lanes.spin, 1 + (beat++ % 8) * 0.075)
    later(lanes.spin, phrase, 135)
  }
  phrase()
  return true
}
export function stopSpinTrack(): void { stop(lanes.spin) }

export function startSpinResultTrack(enabled: boolean): boolean {
  stopSpinResultTrack()
  if (!enabled || !audioContext()) return false
  const lane = lanes.reward
  tone("fusion", 0.7, lane)
  later(lane, () => tone("reveal", 0.65, lane, 1.125), 180)
  later(lane, () => tone("reveal", 0.5, lane, 1.5), 360)
  return true
}
export function stopSpinResultTrack(): void { stop(lanes.reward) }

export function startChestOpeningTrack(enabled: boolean): boolean {
  stopChestOpeningTrack()
  if (!enabled || !audioContext()) return false
  const lane = lanes.chest
  tone("lock", 0.65, lane)
  for (let step = 0; step < 6; step++) {
    later(lane, () => tone(step % 2 ? "pulse" : "charge", 0.5, lane, 1 + step * 0.05), 220 + step * 260)
  }
  return true
}
export function stopChestOpeningTrack(): void { stop(lanes.chest) }

export function playClickSound(sound: ClickSound, enabled: boolean): void {
  playSound(sound === "normal" ? "tick" : sound === "choose" ? "key" : "lock", enabled, 0.6)
}

export function playSound(cue: SoundCue, enabled: boolean, gainScale = 1): void {
  if (!enabled) return
  try { tone(cue, gainScale) } catch { /* Audio is progressive enhancement. */ }
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    stopSpinTrack()
    stopSpinResultTrack()
    stopChestOpeningTrack()
  })
}
