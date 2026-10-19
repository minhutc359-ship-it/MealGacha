import { useEffect, useRef, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import {
  INTRO_MANGA_CHAPTERS,
  mangaChapters,
  mangaEdition,
  unlockedAdventureManga,
  unlockedTcgManga,
  type MangaReaderBook,
  type MangaChapterInfo,
  type MangaContext,
  type MangaReaderPage,
  type MangaTrack,
} from "../../game/mangaChronicle"
import { useModeIntroStore } from "../../game/modeIntroState"
import "../../game/mangaChronicle.css"

interface Props extends MangaContext {
  track: MangaTrack
  clearedStages?: readonly string[]
  stars?: Readonly<Record<string, number>>
  choices?: Readonly<Record<string, 0 | 1>>
}

export function ComicPage({
  page,
  number,
  transcript = false,
}: {
  page: MangaReaderPage
  number: number
  transcript?: boolean
}) {
  const native = "fullPage" in page
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  return (
    <article
      className={`manga-comic-page ${native ? "manga-native-page" : ""}`}
      aria-label={`Trang ${number}: ${page.title}`}
    >
      {native ? (
        <>
          <img
            key={attempt}
            className="manga-full-art"
            src={page.image}
            width={page.size[0]}
            height={page.size[1]}
            loading="lazy"
            decoding="async"
            alt={`Trang ${number}: ${page.title}. Lời thoại nằm trong tranh.`}
            onError={() => setFailed(true)}
          />
          {failed && (
            <p role="alert" className="manga-load">
              Không tải được ảnh trang này.{" "}
              <button
                type="button"
                onClick={() => {
                  setFailed(false)
                  setAttempt((n) => n + 1)
                }}
              >
                Thử lại ảnh
              </button>
            </p>
          )}
        </>
      ) : (
        <>
          <header>
            <small>SOUL OF MEAL</small>
            <span>{String(number).padStart(2, "0")}</span>
          </header>
          <h3>{page.title}</h3>
          <svg
            className="manga-panel"
            viewBox={page.frame.join(" ")}
            style={{ aspectRatio: `${page.frame[2]} / ${page.frame[3]}` }}
            role="img"
            aria-label={`Minh họa: ${page.title}`}
          >
            <image
              href={page.image}
              width={page.size[0]}
              height={page.size[1]}
            />
          </svg>
        </>
      )}
      <div
        className={
          native
            ? `manga-transcript ${transcript ? "" : "manga-sr-only"}`
            : "manga-balloons"
        }
      >
        {page.lines.map((line, index) => (
          <blockquote
            key={index}
            className={
              /Người kể|Ngoại truyện/.test(line.speaker)
                ? "is-narration"
                : index % 2
                  ? "is-reply"
                  : ""
            }
          >
            <strong>{line.speaker}</strong>
            <p>{line.text}</p>
          </blockquote>
        ))}
      </div>
      {!native && <footer>{number} · Soul of Meal</footer>}
    </article>
  )
}

function MangaReader({
  chapter,
  track,
  context,
  onClose,
  previous,
  next,
  onChapter,
  returnFocus,
  intro = false,
}: {
  chapter: MangaChapterInfo
  track: MangaTrack
  context: MangaContext
  onClose: () => void
  previous?: MangaChapterInfo
  next?: MangaChapterInfo
  onChapter: (id: string) => void
  returnFocus: HTMLButtonElement | null
  intro?: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    scroll = useRef<HTMLDivElement>(null)
  const [extra, setExtra] = useState<MangaReaderBook | null>(null),
    [error, setError] = useState(false)
  const [retry, setRetry] = useState(0),
    [index, setIndex] = useState(0)
  const [continuous, setContinuous] = useState(false),
    [largeText, setLargeText] = useState(false)
  const [zoom, setZoom] = useState(false),
    [original, setOriginal] = useState(false)
  const pages = extra
    ? (extra.editions[mangaEdition(track, chapter.id, context)] ??
      extra.editions.base)
    : []
  useEffect(() => {
    const element = dialog.current!
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    element.showModal()
    return () => {
      element.close()
      document.body.style.overflow = overflow
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true })
      if (document.activeElement !== returnFocus)
        document.querySelector<HTMLElement>("#tcg-main,button[aria-label='Hướng dẫn auto chess'],.chest-help-trigger")?.focus({ preventScroll: true })
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    setError(false)
    fetch(
      intro
        ? `/assets/intro-manga5918/${chapter.id}.json`
        : `/assets/manga5916/${track}/${chapter.id}.json`,
      {
        signal: controller.signal,
      },
    )
      .then((response) => {
        if (!response.ok) throw Error("chapter")
        return response.json()
      })
      .then((data: MangaReaderBook) => {
        if (!data.editions?.base?.length) throw Error("chapter format")
        setExtra(data)
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true)
      })
    return () => controller.abort()
  }, [track, chapter.id, retry, intro])
  const turn = (page: number) => {
    setIndex(Math.max(0, Math.min(pages.length - 1, page)))
    scroll.current?.scrollTo({ top: 0, left: 0 })
  }
  return createPortal(
    <dialog
      ref={dialog}
      className={`manga-dialog ${intro ? "is-intro" : ""}`}
      aria-labelledby="manga-reader-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === "Tab") {
          const nodes = [
            ...e.currentTarget.querySelectorAll<HTMLElement>(
              'button:enabled,select:enabled,[tabindex="0"]',
            ),
          ]
          const target = e.shiftKey ? nodes[nodes.length - 1] : nodes[0]
          if (
            document.activeElement ===
            (e.shiftKey ? nodes[0] : nodes[nodes.length - 1])
          ) {
            e.preventDefault()
            target?.focus()
          }
        }
        if (
          continuous ||
          original ||
          !pages.length ||
          e.ctrlKey ||
          e.metaKey ||
          e.altKey ||
          /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName)
        )
          return
        if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
          e.preventDefault()
          turn(
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? pages.length - 1
                : index + (e.key === "ArrowRight" ? 1 : -1),
          )
        }
      }}
    >
      <div className="manga-dialog-shell">
        <header className="manga-reader-heading">
          <div>
            <small>
              {intro
                ? "MỘT LỜI MỜI, BỐN HÀNH TRÌNH"
                : track === "tcg"
                  ? "TẬP I · BÀN KÝ ỨC"
                  : "TẬP II · TÁM HƯƠNG ẤN"}
            </small>
            <h2 id="manga-reader-title">{chapter.title}</h2>
          </div>
          <button
            type="button"
            className="manga-close"
            onClick={onClose}
            aria-label="Đóng truyện"
            autoFocus
          >
            Đóng ×
          </button>
        </header>
        <div
          className="manga-toolbar"
          role="group"
          aria-label="Tùy chọn đọc truyện"
        >
          <button
            type="button"
            aria-pressed={continuous}
            disabled={original}
            onClick={() => {
              setContinuous(!continuous)
              turn(0)
            }}
          >
            {continuous ? "Đọc cuộn" : "Lật trang"}
          </button>
          <button
            type="button"
            aria-pressed={largeText}
            disabled={original}
            onClick={() => setLargeText(!largeText)}
          >
            {intro ? "Lời thoại" : "Chữ lớn"}
          </button>
          <button
            type="button"
            aria-pressed={zoom}
            onClick={() => setZoom(!zoom)}
          >
            Phóng to
          </button>
          {intro && (
            <select
              aria-label="Chọn chương giới thiệu"
              value={chapter.id}
              onChange={(event) => onChapter(event.target.value)}
            >
              {INTRO_MANGA_CHAPTERS.map((item, i) => (
                <option key={item.id} value={item.id}>
                  {i + 1}. {item.title}
                </option>
              ))}
            </select>
          )}
          {!intro && (
            <button
              type="button"
              aria-pressed={original}
              onClick={() => {
                setOriginal(!original)
                scroll.current?.scrollTo(0, 0)
              }}
            >
              {original ? "Về truyện" : "Tranh gốc"}
            </button>
          )}
        </div>
        <div
          ref={scroll}
          className={`manga-viewport ${zoom ? "is-zoomed" : ""} ${
            largeText ? "has-large-text" : ""
          }`}
          tabIndex={0}
          aria-label="Nội dung truyện"
        >
          {!extra ? (
            <div className="manga-load" role={error ? "alert" : "status"}>
              <p>{error ? "Không tải được truyện." : "Đang mở truyện…"}</p>
              {error && (
                <button type="button" onClick={() => setRetry(retry + 1)}>
                  Thử lại
                </button>
              )}
            </div>
          ) : original ? (
            <div className="manga-originals">
              <figure>
                <img src={chapter.image} alt={`Tranh gốc · ${chapter.title}`} />
                <figcaption>Tranh gốc</figcaption>
              </figure>
              <figure>
                <img
                  src={extra.extraImage}
                  alt={`Tranh bổ sung · ${chapter.title}`}
                  loading="lazy"
                />
                <figcaption>Tranh bổ sung</figcaption>
              </figure>
            </div>
          ) : (
            <div
              className="manga-pages"
              style={
                {
                  "--manga-page-width": zoom ? "1050px" : "720px",
                } as CSSProperties
              }
            >
              {(continuous ? pages : pages.slice(index, index + 1)).map(
                (page, offset) => (
                  <ComicPage
                    key={page.id}
                    page={page}
                    transcript={largeText}
                    number={continuous ? offset + 1 : index + 1}
                  />
                ),
              )}
              {continuous && (
                <p className="manga-end">Hết chương · {pages.length} trang</p>
              )}
            </div>
          )}
        </div>
        <footer className="manga-reader-controls">
          <div className="manga-pagination">
            <button
              type="button"
              disabled={!pages.length || continuous || original || index === 0}
              onClick={() => turn(index - 1)}
              aria-label="Trang trước"
            >
              ← Trước
            </button>
            <label>
              Trang{" "}
              <select
                aria-label="Đi đến trang"
                disabled={!pages.length || continuous || original}
                value={index}
                onChange={(e) => turn(Number(e.target.value))}
              >
                {pages.map((page, i) => (
                  <option key={page.id} value={i}>
                    {i + 1} / {pages.length} · {page.title}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={
                !pages.length ||
                continuous ||
                original ||
                index === pages.length - 1
              }
              onClick={() => turn(index + 1)}
              aria-label="Trang sau"
            >
              Sau →
            </button>
          </div>
          <div className="manga-chapter-nav">
            <button
              type="button"
              disabled={!previous}
              onClick={() => previous && onChapter(previous.id)}
            >
              ‹ Chương trước
            </button>
            <span role="status" aria-live="polite">
              {extra
                ? continuous
                  ? `${pages.length} trang · Đọc cuộn`
                  : original
                    ? "Tranh gốc đầy đủ"
                    : `${index + 1} / ${pages.length}`
                : ""}
            </span>
            <button
              type="button"
              disabled={!next}
              onClick={() => next && onChapter(next.id)}
            >
              Chương sau ›
            </button>
          </div>
        </footer>
      </div>
    </dialog>,
    document.body,
  )
}

export function MangaIntroduction({
  onClose,
  returnFocus,
  initialChapter = 0,
}: {
  onClose: () => void
  returnFocus: HTMLButtonElement | null
  initialChapter?: number
}) {
  const [index, setIndex] = useState(initialChapter)
  return (
    <MangaReader
      key={index}
      intro
      track="tcg"
      context={{}}
      chapter={INTRO_MANGA_CHAPTERS[index]}
      previous={INTRO_MANGA_CHAPTERS[index - 1]}
      next={INTRO_MANGA_CHAPTERS[index + 1]}
      onClose={onClose}
      onChapter={(id) =>
        setIndex(INTRO_MANGA_CHAPTERS.findIndex((c) => c.id === id))
      }
      returnFocus={returnFocus}
    />
  )
}

export function MangaChronicle({
  track,
  clearedStages = [],
  stars = {},
  choices = {},
  storyEnding,
  story400,
}: Props) {
  const chapters = mangaChapters(track)
  const unlocked = new Set(
    track === "tcg"
      ? unlockedTcgManga(clearedStages)
      : unlockedAdventureManga(stars),
  )
  const [selected, setSelected] = useState<string | null>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const chapter = chapters.find(
    (item) => item.id === selected && unlocked.has(item.id),
  )
  const chapterIndex = chapter ? chapters.indexOf(chapter) : -1
  const neighbor = (offset: number) => {
    const item = chapters[chapterIndex + offset]
    return item && unlocked.has(item.id) ? item : undefined
  }
  return (
    <section className={`manga-chronicle manga-${track}`}>
      <button
        className="manga-intro-entry"
        type="button"
        aria-haspopup="dialog"
        onClick={(event) =>
          useModeIntroStore.getState().openComic(event.currentTarget)
        }
      >
        <b>Manga giới thiệu · Một lời mời, bốn hành trình</b>
        <span>
          12 trang · Nguồn gốc Vị Linh, TCG, Auto Chess và Phiêu lưu · Đọc ngay
          ↗
        </span>
      </button>
      <header className="manga-heading">
        <img
          src={`/assets/manga5915/${track}/cover.webp`}
          alt="Bìa manga Soul of Meal"
          width="1086"
          height="1448"
        />
        <div>
          <small>
            {track === "tcg" ? "TẬP I · BÀN KÝ ỨC" : "TẬP II · TÁM HƯƠNG ẤN"}
          </small>
          <h1>
            {track === "tcg" ? "Bữa cơm còn một ghế" : "Con đường của Vân"}
          </h1>
          <p>Mỗi bữa ăn giữ một câu chuyện.</p>
          <p className="manga-shelf-note">
            Chọn chương để mở truyện · Có lời thoại · {unlocked.size}/
            {chapters.length} chương đã mở
          </p>
        </div>
      </header>
      <nav className="manga-shelf" aria-label="Danh sách chương manga">
        {chapters.map((item, index) => {
          const open = unlocked.has(item.id)
          return (
            <button
              type="button"
              key={item.id}
              disabled={!open}
              aria-haspopup="dialog"
              onClick={(e) => {
                trigger.current = e.currentTarget
                setSelected(item.id)
              }}
            >
              <span>
                {open
                  ? `CHƯƠNG ${String(index + 1).padStart(2, "0")}`
                  : `🔒 CHƯƠNG ${index + 1}`}
              </span>
              <b>{open ? item.title : "Chưa mở khóa"}</b>
              <small>
                {open
                  ? "Mở truyện ↗"
                  : track === "tcg"
                    ? "Vượt 3 màn của chương"
                    : "Vượt boss chương (Thường)"}
              </small>
            </button>
          )
        })}
      </nav>
      {chapter && (
        <MangaReader
          key={`${track}-${chapter.id}`}
          chapter={chapter}
          track={track}
          context={{ storyEnding, story400, choice: choices[chapter.id] }}
          onClose={() => setSelected(null)}
          previous={neighbor(-1)}
          next={neighbor(1)}
          onChapter={setSelected}
          returnFocus={trigger.current}
        />
      )}
    </section>
  )
}
