import { useEffect, useRef, useId, type ReactNode } from "react"

export function Dialog({
  title,
  onClose,
  children,
  wide = false,
  dismissible = true,
  className = "",
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
  dismissible?: boolean
  className?: string
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
      className={`tcg-dialog ${wide ? "is-wide" : ""} ${className}`}
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (dismissible) onClose()
      }}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose()
      }}
      aria-labelledby={titleId}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        {dismissible && (
          <button
            className="tcg-icon-button"
            onClick={onClose}
            aria-label="Đóng"
          >
            ×
          </button>
        )}
      </header>
      {children}
    </dialog>
  )
}
