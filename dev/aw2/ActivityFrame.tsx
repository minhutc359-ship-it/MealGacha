import { useEffect, useRef, type ReactNode, type HTMLAttributes } from "react"
import { PageControls, PagedCopy } from "./GamePanels"
import { pageSlice } from "../../src/aw2/world/questJournal"
import "./activity.css"

type ActivityPage = readonly [string, string]
interface Props extends HTMLAttributes<HTMLElement> {
  title: string
  status: string
  page: string
  pages: readonly ActivityPage[]
  onPage: (page: string) => void
  footer: ReactNode
}
/** One mounted scene page: no hidden scroll surfaces, no extra blocking layers. */
export function ActivityFrame({
  title,
  status,
  page,
  pages,
  onPage,
  footer,
  children,
  className = "",
  ...attrs
}: Props) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    document.documentElement.classList.add("aw2-game-document")
    heading.current?.focus({ preventScroll: true })
    return () => document.documentElement.classList.remove("aw2-game-document")
  }, [])
  return (
    <main {...attrs} className={`aw2-activity ${className}`}>
      <header>
        <h1 ref={heading} tabIndex={-1}>
          {title}
        </h1>
      </header>
      <p className="aw2-activity-status" role="status">
        {status}
      </p>
      <select
        aria-label="Nội dung màn chơi"
        value={page}
        onChange={(e) => onPage(e.target.value)}
      >
        {pages.map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
      <div
        className="aw2-activity-body"
        data-testid="activity-page"
        data-page={page}
      >
        {children}
      </div>
      <footer>{footer}</footer>
    </main>
  )
}

export function ActivityPages<T>({
  items,
  page,
  onPage,
  label,
  children,
}: {
  items: readonly T[]
  page: number
  onPage: (value: number) => void
  label: string
  children: (item: T, index: number) => ReactNode
}) {
  const view = pageSlice(items, page, 1)
  return (
    <div className="aw2-activity-stack">
      <div className="aw2-activity-card">
        {view.items.length ? (
          children(view.items[0], view.page)
        ) : (
          <p>Chưa có mục nào.</p>
        )}
      </div>
      <PageControls
        page={view.page}
        pages={view.pages}
        onPage={onPage}
        label={label}
      />
    </div>
  )
}

export function ActivityCopy({
  text,
  role,
}: {
  text: string
  role?: "alert" | "status"
}) {
  return (
    <div className="aw2-activity-copy" role={role}>
      <PagedCopy limit={90} text={text} />
    </div>
  )
}
