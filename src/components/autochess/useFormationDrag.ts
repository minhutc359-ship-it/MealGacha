import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"

export interface FormationDrop { cell: number | null; benchSlot?: number }
type Options = { enabled: boolean; onDrop: (uid: string, target: FormationDrop) => void; onSelect: (uid: string) => void }
type Gesture = { uid: string; pointer: number; x: number; y: number; active: boolean; source: HTMLElement }

// Pointer capture supports mouse, pen and iOS touch. Tap/keyboard selection still works.
export function useFormationDrag(options: Options) {
  const latest = useRef(options), gesture = useRef<Gesture | null>(null)
  const ghostRef = useRef<HTMLDivElement>(null), lastPoint = useRef({ x: 0, y: 0 })
  const hovered = useRef<HTMLElement | null>(null), ignoreUntil = useRef(0)
  const [dragging, setDragging] = useState<string | null>(null)
  useEffect(() => { latest.current = options })
  const positionGhost = () => {
    if (ghostRef.current) ghostRef.current.style.transform = `translate3d(${lastPoint.current.x - 32}px,${lastPoint.current.y - 48}px,0)`
  }
  useEffect(positionGhost, [dragging])
  useEffect(() => {
    const clear = (notify = true) => {
      hovered.current?.removeAttribute("data-drag-over"); hovered.current = null
      const old = gesture.current; gesture.current = null
      if (old?.source.hasPointerCapture(old.pointer)) old.source.releasePointerCapture(old.pointer)
      if (notify) setDragging(null)
    }
    if (!options.enabled) { clear(); return }
    const targetAt = (x: number, y: number): { element: HTMLElement; target: FormationDrop } | null => {
      const element = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-cell], [data-bench-slot]")
      if (!element?.closest(".ac-game")) return null
      if (element.dataset.cell !== undefined) {
        const cell = Number(element.dataset.cell)
        return cell >= 18 && cell <= 35 ? { element, target: { cell } } : null
      }
      const slot = Number(element.dataset.benchSlot)
      return slot >= 0 && slot <= 5 ? { element, target: { cell: null, benchSlot: slot } } : null
    }
    const move = (event: PointerEvent) => {
      const current = gesture.current
      if (!current || current.pointer !== event.pointerId) return
      if (!current.active && Math.hypot(event.clientX-current.x,event.clientY-current.y) < 7) return
      event.preventDefault()
      if (!current.active) {
        current.active = true; setDragging(current.uid); latest.current.onSelect(current.uid)
      }
      lastPoint.current = { x: event.clientX, y: event.clientY }; positionGhost()
      const found = targetAt(event.clientX, event.clientY)
      if (hovered.current !== found?.element) {
        hovered.current?.removeAttribute("data-drag-over")
        hovered.current = found?.element ?? null
        hovered.current?.setAttribute("data-drag-over", "true")
      }
      if (ghostRef.current) ghostRef.current.dataset.valid = String(!!found)
    }
    const up = (event: PointerEvent) => {
      const current = gesture.current
      if (!current || current.pointer !== event.pointerId) return
      const found = current.active ? targetAt(event.clientX, event.clientY) : null
      if (current.active) { event.preventDefault(); ignoreUntil.current = performance.now()+350 }
      clear()
      if (found && latest.current.enabled) latest.current.onDrop(current.uid, found.target)
    }
    const cancel = () => clear()
    const visibility = () => { if (document.hidden) clear() }
    document.addEventListener("pointermove", move, { passive: false })
    document.addEventListener("pointerup", up, { passive: false })
    document.addEventListener("pointercancel", cancel)
    document.addEventListener("visibilitychange", visibility)
    window.addEventListener("blur", cancel)
    return () => {
      clear(false)
      document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up)
      document.removeEventListener("pointercancel", cancel); document.removeEventListener("visibilitychange", visibility)
      window.removeEventListener("blur", cancel)
    }
  }, [options.enabled])
  const start = (uid: string, event: ReactPointerEvent<HTMLElement>) => {
    if (!latest.current.enabled || event.button !== 0 || !event.isPrimary || gesture.current) return
    gesture.current = { uid, pointer: event.pointerId, x:event.clientX, y:event.clientY, active:false, source:event.currentTarget }
    lastPoint.current = { x:event.clientX, y:event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  return { dragging, ghostRef, start, ignoreClick: () => performance.now() < ignoreUntil.current }
}
