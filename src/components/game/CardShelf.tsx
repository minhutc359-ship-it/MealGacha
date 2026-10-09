import { useEffect, useRef, type ReactNode } from "react"

// Keep controls in view; browse every card in the same scrollable list.
export function CardShelf({ items, resetKey, label }: {
  items: ReactNode[]
  resetKey: string
  label: string
}) {
  const list = useRef<HTMLDivElement>(null)
  useEffect(() => {
    list.current?.scrollTo({ top: 0 })
  }, [resetKey])
  return (
    <div ref={list} className="tcg-card-list tcg-deck-card-list" role="region" aria-label={label} tabIndex={0}>
      <div className="tcg-card-page tcg-card-list-grid">
        {items}
        {!items.length && <p className="tcg-shelf-empty">Không có thẻ phù hợp. Thử bỏ bớt bộ lọc.</p>}
      </div>
    </div>
  )
}
