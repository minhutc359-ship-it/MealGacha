import { useEffect, useRef, type ReactNode } from "react"

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
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    const previous = document.activeElement as HTMLElement | null
    el?.showModal()
    return () => {
      el?.close()
      previous?.focus()
    }
  }, [])
  return (
    <dialog
      className={`tcg-dialog ${wide ? "is-wide" : ""}`}
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-labelledby="tcg-dialog-title"
    >
      <header>
        <h2 id="tcg-dialog-title">{title}</h2>
        <button className="tcg-icon-button" onClick={onClose} aria-label="Đóng">
          ×
        </button>
      </header>
      {children}
    </dialog>
  )
}
