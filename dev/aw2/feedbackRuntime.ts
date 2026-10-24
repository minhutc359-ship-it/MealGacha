import { frameCadence, type FrameCadence } from "../../src/aw2/review/feedback"

/** Bounded, opt-in observation; cancels on hidden page and never writes or uploads. */
export function measurePageCadence(
  done: (result: FrameCadence | null) => void,
): () => void {
  let id = 0,
    frames = 0,
    finished = false
  const start = performance.now()
  const finish = (result: FrameCadence | null) => {
    if (finished) return
    finished = true
    cancelAnimationFrame(id)
    clearTimeout(timeout)
    document.removeEventListener("visibilitychange", hidden)
    done(result)
  }
  const hidden = () => {
    if (document.visibilityState !== "visible") finish(null)
  }
  const tick = (now: number) => {
    if (document.visibilityState !== "visible") return finish(null)
    frames++
    if (now - start >= 3000) finish(frameCadence(frames, now - start))
    else id = requestAnimationFrame(tick)
  }
  const timeout = setTimeout(() => finish(null), 5000)
  document.addEventListener("visibilitychange", hidden)
  id = requestAnimationFrame(tick)
  return () => finish(null)
}
