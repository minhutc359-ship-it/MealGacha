import { useEffect, useRef } from "react"
import { acceptsShortcut, shortcutAction } from "../../game/autochess/shortcuts"
import type { AutoRun } from "../../game/autochess/types"
import type { AutoAction } from "../../game/autochess/reducer"

type Options = { enabled: boolean; run: AutoRun | null; onAction: (action: AutoAction) => void }
export function useAutoShortcuts(options: Options) {
  const latest = useRef(options)
  useEffect(() => { latest.current = options })
  useEffect(() => {
    let point: { x: number; y: number } | null = null
    const track = (event: PointerEvent) => {
      if (event.pointerType === "mouse") point = { x: event.clientX, y: event.clientY }
    }
    const clear = () => { point = null }
    const keydown = (event: KeyboardEvent) => {
      const { enabled, run, onAction } = latest.current
      const target = event.target instanceof Element ? event.target : null
      const editable = !!target?.closest("input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='textbox']")
      if (!enabled || !run || event.defaultPrevented || !acceptsShortcut(event, editable)) return
      // Resolve at keydown: a sold/moved unit must not remain a stale hover target.
      const element = point ? document.elementFromPoint(point.x, point.y)?.closest<HTMLElement>("[data-piece]") : null
      const uid = element?.closest(".ac-game") ? element.dataset.piece ?? null : null
      const action = shortcutAction(run, event.key.toLowerCase(), uid)
      if (!action) return
      event.preventDefault()
      onAction(action)
    }
    document.addEventListener("pointermove", track, { passive: true })
    document.addEventListener("pointerleave", clear)
    document.addEventListener("keydown", keydown)
    window.addEventListener("blur", clear)
    return () => {
      document.removeEventListener("pointermove", track)
      document.removeEventListener("pointerleave", clear)
      document.removeEventListener("keydown", keydown)
      window.removeEventListener("blur", clear)
    }
  }, [])
}
