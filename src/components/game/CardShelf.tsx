import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"

// Page capacity follows the space left after controls, including resized/rotated screens.
export function CardShelf({
  items,
  resetKey,
  label,
  compact = false,
}: {
  items: ReactNode[]
  resetKey: string
  label: string
  compact?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState({ columns: 2, rows: 1, rowHeight: 220 })
  const [page, setPage] = useState(0)
  useEffect(() => {
    setPage(0)
  }, [resetKey])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const columns = Math.max(2, Math.min(8, Math.floor((width + 10) / 150)))
      const idealHeight = compact
        ? 175
        : Math.min(260, ((width - (columns - 1) * 10) / columns) * 1.15 + 22)
      const rows = Math.max(
        1,
        Math.min(2, Math.floor((height + 10) / (idealHeight + 10))),
      )
      const rowHeight = Math.max(
        1,
        Math.min(idealHeight, (height - (rows - 1) * 10) / rows),
      )
      setLayout((old) =>
        old.columns === columns &&
        old.rows === rows &&
        Math.abs(old.rowHeight - rowHeight) < 1
          ? old
          : { columns, rows, rowHeight },
      )
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [compact])
  const size = layout.columns * layout.rows
  const pages = Math.max(1, Math.ceil(items.length / size))
  const index = Math.min(page, pages - 1)
  return (
    <div className="tcg-card-shelf" aria-label={label}>
      <div
        ref={ref}
        className="tcg-card-page"
        style={
          {
            "--shelf-columns": layout.columns,
            "--shelf-row-height": `${layout.rowHeight}px`,
          } as CSSProperties
        }
      >
        {items.slice(index * size, (index + 1) * size)}
        {!items.length && (
          <p className="tcg-shelf-empty">
            Không có thẻ phù hợp. Thử bỏ bớt bộ lọc.
          </p>
        )}
      </div>
      <nav className="tcg-pagination" aria-label={`Phân trang ${label}`}>
        <button
          aria-label="Trang thẻ trước"
          disabled={index === 0}
          onClick={() => setPage(index - 1)}
        >
          ←
        </button>
        <span role="status" aria-live="polite">
          {items.length
            ? `${index * size + 1}–${Math.min((index + 1) * size, items.length)} / ${items.length} thẻ`
            : "0 thẻ"}
          <small>
            Trang {index + 1}/{pages}
          </small>
        </span>
        <button
          aria-label="Trang thẻ tiếp"
          disabled={index === pages - 1}
          onClick={() => setPage(index + 1)}
        >
          →
        </button>
      </nav>
    </div>
  )
}
