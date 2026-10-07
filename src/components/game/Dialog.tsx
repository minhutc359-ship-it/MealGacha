import { useEffect, useRef, useId, type ReactNode } from "react"

export function Dialog({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  const titleId = useId()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    const previous = document.activeElement as HTMLElement | null
    el?.showModal()
    return () => {
      el?.close()
      if (previous?.isConnected && !previous.classList.contains("tcg-skip"))
        previous.focus({ preventScroll: true })
      else document.getElementById("tcg-main")?.focus({ preventScroll: true })
    }
  }, [])
  return (
    <dialog
      className={`tcg-dialog ${wide ? "is-wide" : ""}`}
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-labelledby={titleId}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button className="tcg-icon-button" onClick={onClose} aria-label="Đóng">
          ×
        </button>
      </header>
      {children}
    </dialog>
  )
}
