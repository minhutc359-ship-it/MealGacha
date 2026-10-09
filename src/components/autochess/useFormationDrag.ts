import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { BENCH_SLOTS } from "../../game/autochess/config"
import type { ItemPreview, ItemTarget } from "../../game/autochess/items"

export interface FormationDrop { cell: number | null; benchSlot?: number }
export interface PeekTarget { id: string; uid?: string; shop?: number }
type Payload = { kind: "piece"; uid: string } | { kind: "item"; index: number }
type Target = { kind: "formation"; placement: FormationDrop } | { kind: "sell" } | ItemTarget
type Options = {
  enabled: boolean
  peekEnabled: boolean
  onDrop: (uid: string, target: FormationDrop) => void
  onSelect: (uid: string | null) => void
  onSell: (uid: string) => void
  onItemDrop: (index: number, target: ItemTarget) => void
  previewItem: (index: number, target: ItemTarget) => ItemPreview
  inspectPiece: (uid: string) => PeekTarget | null
}
type Gesture = { payload: Payload | null; subject: PeekTarget | null; pointer: number; type: string; x: number; y: number; active: boolean; peeked: boolean; cancelled: boolean; source: HTMLElement }

// One gesture owns its pointer: taps, a 300ms quick look, and dragging never overlap.
export function useFormationDrag(options: Options) {
  const latest = useRef(options), gesture = useRef<Gesture | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ghostRef = useRef<HTMLDivElement>(null), lastPoint = useRef({ x: 0, y: 0 })
  const hovered = useRef<HTMLElement | null>(null), hoverKey = useRef("")
  const ignoreUntil = useRef(0)
  const pointerType = useRef("mouse")
  const [dragging, setDragging] = useState<string | null>(null)
  const [itemIndex, setItemIndex] = useState<number | null>(null)
  const [peek, setPeek] = useState<PeekTarget | null>(null)
  const [preview, setPreview] = useState<ItemPreview | null>(null)
  useEffect(() => { latest.current = options })
  const positionGhost = () => {
    if (ghostRef.current) ghostRef.current.style.transform = `translate3d(${lastPoint.current.x - 32}px,${lastPoint.current.y - 48}px,0)`
  }
  useEffect(positionGhost, [dragging, itemIndex])
  const cancelHold = () => { if (timer.current !== null) clearTimeout(timer.current); timer.current = null }
  useEffect(() => {
    const clear = (notify = true) => {
      cancelHold()
      hovered.current?.removeAttribute("data-drag-over"); hovered.current = null; hoverKey.current = ""
      const old = gesture.current; gesture.current = null
      if (old?.source.hasPointerCapture(old.pointer)) old.source.releasePointerCapture(old.pointer)
      if (notify) { setDragging(null); setItemIndex(null); setPeek(null); setPreview(null) }
    }
    clear()
    if (!options.enabled && !options.peekEnabled) return
    const targetAt = (x: number, y: number, payload: Payload): { element: HTMLElement; target: Target } | null => {
      const selector = payload.kind === "piece" ? "[data-sell-zone], [data-cell], [data-bench-slot]" : "[data-piece], [data-item-index]"
      const element = document.elementFromPoint(x, y)?.closest<HTMLElement>(selector)
      if (!element?.closest(".ac-game")) return null
      if (payload.kind === "item") {
        if (element.dataset.piece) return { element, target: { kind: "equip", uid: element.dataset.piece } }
        const index = Number(element.dataset.itemIndex)
        return Number.isInteger(index) && index >= 0 && index !== payload.index ? { element, target: { kind: "craft", index } } : null
      }
      if (element.dataset.sellZone !== undefined) return { element, target: { kind: "sell" } }
      if (element.dataset.cell !== undefined) {
        const cell = Number(element.dataset.cell)
        return cell >= 18 && cell <= 35 ? { element, target: { kind: "formation", placement: { cell } } } : null
      }
      const slot = Number(element.dataset.benchSlot)
      return slot >= 0 && slot < BENCH_SLOTS ? { element, target: { kind: "formation", placement: { cell: null, benchSlot: slot } } } : null
    }
    const move = (event: PointerEvent) => {
      const current = gesture.current
      if (!current || current.pointer !== event.pointerId) return
      const distance = Math.hypot(event.clientX - current.x, event.clientY - current.y)
      if (!current.active && distance < 7) return
      cancelHold()
      if (current.peeked) { setPeek(null); return }
      if (!current.payload || !latest.current.enabled) { current.cancelled = true; return }
      event.preventDefault()
      if (!current.active) {
        current.active = true
        if (current.payload.kind === "piece") { setDragging(current.payload.uid); latest.current.onSelect(current.payload.uid) }
        else { setItemIndex(current.payload.index); latest.current.onSelect(null) }
      }
      lastPoint.current = { x: event.clientX, y: event.clientY }; positionGhost()
      const found = targetAt(event.clientX, event.clientY, current.payload)
      const key = found ? JSON.stringify(found.target) : ""
      if (hoverKey.current !== key) {
        hovered.current?.removeAttribute("data-drag-over")
        hovered.current = found?.element ?? null; hoverKey.current = key
        hovered.current?.setAttribute("data-drag-over", "true")
        setPreview(current.payload.kind === "item" && found && (found.target.kind === "craft" || found.target.kind === "equip")
          ? latest.current.previewItem(current.payload.index, found.target) : null)
      }
      if (ghostRef.current) ghostRef.current.dataset.valid = String(!!found)
    }
    const up = (event: PointerEvent) => {
      const current = gesture.current
      if (!current || current.pointer !== event.pointerId) return
      const found = current.active && current.payload ? targetAt(event.clientX, event.clientY, current.payload) : null
      if (current.active || current.peeked || current.cancelled || (current.type !== "mouse" && current.payload?.kind === "piece")) {
        event.preventDefault(); ignoreUntil.current = performance.now() + 450
      }
      clear()
      if (!found || !current.payload || !latest.current.enabled) return
      if (current.payload.kind === "piece") {
        if (found.target.kind === "formation") latest.current.onDrop(current.payload.uid, found.target.placement)
        else if (found.target.kind === "sell") latest.current.onSell(current.payload.uid)
      } else if (found.target.kind === "equip" || found.target.kind === "craft") latest.current.onItemDrop(current.payload.index, found.target)
    }
    const cancel = () => { if (gesture.current) ignoreUntil.current = performance.now() + 450; clear() }
    const lostCapture = (event: PointerEvent) => { if (gesture.current?.pointer === event.pointerId) cancel() }
    const trackInput = (event: PointerEvent) => { pointerType.current = event.pointerType }
    const visibility = () => { if (document.hidden) cancel() }
    document.addEventListener("pointermove", move, { passive: false })
    document.addEventListener("pointerdown", trackInput, { capture: true, passive: true })
    document.addEventListener("pointerup", up, { passive: false })
    document.addEventListener("pointercancel", cancel)
    document.addEventListener("lostpointercapture", lostCapture)
    document.addEventListener("visibilitychange", visibility)
    window.addEventListener("blur", cancel)
    return () => {
      clear(false)
      document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up)
      document.removeEventListener("pointerdown", trackInput, true)
      document.removeEventListener("pointercancel", cancel); document.removeEventListener("lostpointercapture", lostCapture)
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("blur", cancel)
    }
  }, [options.enabled, options.peekEnabled])
  const begin = (payload: Payload | null, subject: PeekTarget | null, event: ReactPointerEvent<HTMLElement>) => {
    if ((!latest.current.enabled && !subject) || !latest.current.peekEnabled && !latest.current.enabled || event.button !== 0 || !event.isPrimary || gesture.current) return
    const current: Gesture = { payload: latest.current.enabled ? payload : null, subject, pointer: event.pointerId, type: event.pointerType,
      x: event.clientX, y: event.clientY, active: false, peeked: false, cancelled: false, source: event.currentTarget }
    gesture.current = current
    lastPoint.current = { x: event.clientX, y: event.clientY }
    if (event.pointerType !== "mouse") latest.current.onSelect(null)
    event.currentTarget.setPointerCapture(event.pointerId)
    if (subject && latest.current.peekEnabled) timer.current = setTimeout(() => {
      if (gesture.current !== current || current.active) return
      current.peeked = true; setPeek(subject)
    }, 300)
  }
  return { dragging, itemIndex, ghostRef, peek, preview,
    start: (uid: string, event: ReactPointerEvent<HTMLElement>) => begin({ kind: "piece", uid }, latest.current.inspectPiece(uid), event),
    startItem: (index: number, event: ReactPointerEvent<HTMLElement>) => begin({ kind: "item", index }, null, event),
    startPeek: (subject: PeekTarget, event: ReactPointerEvent<HTMLElement>) => begin(null, subject, event),
    ignoreClick: () => performance.now() < ignoreUntil.current, touchTap: () => pointerType.current !== "mouse" }
}
