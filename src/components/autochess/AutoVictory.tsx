import { useCallback, useEffect, useState } from "react"
import { QUIET_VICTORY_DURATION, VICTORY_DURATION, victoryKey } from "../../game/autochess/presentation"
import type { AutoRun } from "../../game/autochess/types"

export function useAutoVictory(run: AutoRun | null, visible: boolean, reducedMotion: boolean) {
  const key = victoryKey(run)
  const [completed, setCompleted] = useState<string | null>(null)
  const pending = !!key && key !== completed
  const celebrating = pending && visible
  const finish = useCallback(() => { if (key) setCompleted(key) }, [key])
  useEffect(() => {
    if (!celebrating) return
    let frame = 0, previous = performance.now(), elapsed = 0
    const duration = reducedMotion ? QUIET_VICTORY_DURATION : VICTORY_DURATION
    const advance = (now: number) => {
      if (!document.hidden) elapsed += Math.min(100, now - previous)
      previous = now
      if (elapsed >= duration) finish()
      else frame = requestAnimationFrame(advance)
    }
    frame = requestAnimationFrame(advance)
    return () => cancelAnimationFrame(frame)
  }, [celebrating, reducedMotion, finish])
  return { pending, celebrating, finish }
}

export function AutoVictory({ wave, onFinish }: { wave: number; onFinish: () => void }) {
  return (
    <div className="ac-victory" role="status" aria-live="polite">
      <div className="ac-victory-banner">
        <span aria-hidden="true">✦</span>
        <strong>THẮNG ĐỢT {wave}</strong>
        <small>Vị Linh cùng nhảy mừng chiến thắng!</small>
      </div>
      <button className="ac-button" onClick={onFinish}>Xem kết quả →</button>
    </div>
  )
}
