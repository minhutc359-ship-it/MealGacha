import { useEffect, useRef, useState } from "react"
import { INTRO_MANGA_CHAPTERS } from "../../game/mangaChronicle"
import { MangaIntroduction } from "./MangaChronicle"
import { CultureJourney } from "./CultureJourney"
import "./sharedLibrary.css"

export default function SharedLibrary({
  initialTab,
  cultureId,
  onClose,
  returnFocus,
}: {
  initialTab: "manga" | "culture"
  cultureId: string | null
  onClose: () => void
  returnFocus: HTMLButtonElement | null
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement | null>(null)
  const [tab, setTab] = useState(initialTab),
    [reading, setReading] = useState<number | null>(null)
  useEffect(() => {
    const el = dialog.current!,
      overflow = document.body.style.overflow
    el.showModal()
    document.body.style.overflow = "hidden"
    return () => {
      el.close()
      document.body.style.overflow = overflow
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true })
    }
  }, [])
  return (
    <>
      <dialog
        ref={dialog}
        className="meal-library"
        aria-label="Sổ hành trình Soul of Meal"
        onCancel={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onClose()
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return
          const controls = [
              ...event.currentTarget.querySelectorAll<HTMLElement>(
                "button:not(:disabled),a[href],select",
              ),
            ],
            first = controls[0],
            last = controls.at(-1)
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last?.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first?.focus()
          }
        }}
      >
        <header>
          <div>
            <small>SOUL OF MEAL</small>
            <h2>Sổ hành trình</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng Sổ hành trình"
          >
            Đóng ×
          </button>
        </header>
        <nav aria-label="Nội dung sổ">
          <button
            type="button"
            aria-pressed={tab === "manga"}
            onClick={() => setTab("manga")}
          >
            Manga giới thiệu
          </button>
          <button
            type="button"
            aria-pressed={tab === "culture"}
            onClick={() => setTab("culture")}
          >
            Văn hóa Việt
          </button>
        </nav>
        <div className="meal-library-scroll">
          {tab === "manga" ? (
            <section>
              <h3>Một lời mời, bốn hành trình</h3>
              <p>
                4 chương · 12 trang có lời thoại trong tranh. Đọc ngay từ mọi
                chế độ.
              </p>
              <div className="meal-library-grid">
                {INTRO_MANGA_CHAPTERS.map((chapter, index) => (
                  <button
                    type="button"
                    key={chapter.id}
                    className="meal-book-card"
                    aria-haspopup="dialog"
                    onClick={(event) => {
                      trigger.current = event.currentTarget
                      setReading(index)
                    }}
                  >
                    <small>CHƯƠNG {index + 1} · 3 TRANG</small>
                    <strong>{chapter.title}</strong>
                    <span>Đọc nguyên trang ↗</span>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <CultureJourney initialId={cultureId} />
          )}
        </div>
      </dialog>
      {reading !== null && (
        <MangaIntroduction
          initialChapter={reading}
          returnFocus={trigger.current}
          onClose={() => setReading(null)}
        />
      )}
    </>
  )
}
