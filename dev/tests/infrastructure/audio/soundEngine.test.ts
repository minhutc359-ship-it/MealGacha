import { afterEach, describe, expect, it, vi } from "vitest"

describe("original chest synthesis", () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.resetModules() })
  it("preloads without network/audio activation, respects mute, and cancels queued phrases and voices", async () => {
    vi.useFakeTimers()
    const voices: { stop: ReturnType<typeof vi.fn> }[] = []
    const AudioContext = vi.fn(function(this: Record<string, unknown>) {
      Object.assign(this, { state: "running", currentTime: 0, destination: {}, createGain: () => ({ gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }), createOscillator: () => {
        const voice = { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {}, start() {}, stop: vi.fn(), onended: null }
        voices.push(voice); return voice
      } })
    })
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    vi.stubGlobal("window", { AudioContext, addEventListener() {} })
    vi.stubGlobal("document", { hidden: false })
    const sound = await import("@/infrastructure/audio/soundEngine")
    sound.preloadClickSounds(); sound.preloadSpinTrack(); sound.preloadChestOpeningTrack(); sound.preloadRewardReceivedTrack()
    expect(AudioContext).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled()
    expect(sound.startChestOpeningTrack(false)).toBe(false)
    expect(sound.startSpinTrack(false)).toBe(false)
    expect(sound.startSpinResultTrack(false)).toBe(false)
    expect(voices).toHaveLength(0)
    sound.startSpinTrack(true); vi.advanceTimersByTime(140)
    sound.startChestOpeningTrack(true); sound.startSpinResultTrack(true)
    const count = voices.length
    sound.stopSpinTrack(); sound.stopChestOpeningTrack(); sound.stopSpinResultTrack()
    expect(voices.every(v => v.stop.mock.calls.length >= 2)).toBe(true)
    vi.advanceTimersByTime(10000)
    expect(voices).toHaveLength(count); expect(vi.getTimerCount()).toBe(0)
    expect(fetch).not.toHaveBeenCalled()
  })
})
