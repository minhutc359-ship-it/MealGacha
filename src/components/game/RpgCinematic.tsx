import { useEffect, useRef, useState } from "react"
import { subscribeCharacterClock } from "../../infrastructure/assets/characterSprites"
import { gameAudio } from "../../infrastructure/audio/gameAudio"
import { AWAKENING_MEDIA } from "../../game/adventureRpg/awakening"
import { CARD_MAP } from "../../game/catalog"
import { SHOWCASE_MS, ultimateShowcase } from "../../game/ultimateShowcase"
import { UltimateBanner } from "./UltimateBanner"

/** Presents an already committed cast. Completion never casts or pays anything.
 * Keep the serialized cinematic transaction for old saves; its UI is now a compact 2D banner. */
export function RpgCinematic({
  id,
  paused,
  reduced = false,
  combo = 1,
  onDone,
  onTogglePause,
}: {
  id: string
  paused: boolean
  reduced?: boolean
  combo?: number
  onDone: () => boolean | void
  onTogglePause?: () => void
}) {
  const [hidden, setHidden] = useState(document.hidden),
    [finished, setFinished] = useState(false),
    [failed, setFailed] = useState(false)
  const callback = useRef(onDone),
    done = useRef(false),
    elapsed = useRef(0)
  const root = useRef<HTMLDivElement>(null),
    progress = useRef<HTMLDivElement>(null)
  callback.current = onDone
  const stopped = paused || hidden
  reduced =
    reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches
  function finish() {
    if (done.current) return
    done.current = true
    if (callback.current() === false) {
      done.current = false
      setFailed(true)
    } else setFinished(true)
  }
  const complete = useRef(finish)
  complete.current = finish
  useEffect(() => {
    const update = () => setHidden(document.hidden)
    document.addEventListener("visibilitychange", update)
    return () => document.removeEventListener("visibilitychange", update)
  }, [])
  useEffect(() => {
    if (stopped || failed || finished) return
    const sound = gameAudio.playClip(
      `${AWAKENING_MEDIA}/sounds/${id}.mp3`,
      () => elapsed.current / 1000,
    )
    return () => sound?.stop()
  }, [id, stopped, failed, finished])
  useEffect(() => {
    if (stopped || failed || finished) return
    let previous = performance.now()
    return subscribeCharacterClock((now) => {
      if (document.hidden) {
        previous = now
        return
      }
      elapsed.current += Math.min(80, now - previous)
      previous = now
      if (progress.current)
        progress.current.style.transform = `scaleX(${Math.min(1, elapsed.current / SHOWCASE_MS)})`
      if (root.current && !reduced)
        root.current.style.opacity = String(
          Math.min(1, (SHOWCASE_MS - elapsed.current) / 200),
        )
      if (elapsed.current >= SHOWCASE_MS) complete.current()
    }, true)
  }, [stopped, failed, finished, reduced])
  const card = CARD_MAP[id],
    identity = ultimateShowcase(id)
  if (finished) return null
  return (
    <div
      ref={root}
      className="rpg-showcase"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault()
          finish()
        }
      }}
    >
      <UltimateBanner
        id={id}
        school={card.school}
        title={identity?.title ?? card.name}
        combo={combo}
        quiet={reduced}
        paused={stopped}
      >
        {onTogglePause && (
          <button
            type="button"
            aria-label={paused ? "Tiếp hoạt ảnh" : "Dừng hoạt ảnh"}
            onClick={onTogglePause}
          >
            {paused ? "▶" : "Ⅱ"}
          </button>
        )}
        <button type="button" onClick={finish}>
          {failed ? "Thử lại" : "Bỏ qua ›"}
        </button>
      </UltimateBanner>
      {failed && (
        <p className="rpg-showcase-error" role="alert">
          Chưa lưu được kết thúc hoạt ảnh.{" "}
          <a href="/settings">Sao lưu & lưu trữ ↗</a>
        </p>
      )}
      <div ref={progress} className="rpg-showcase-progress" />
    </div>
  )
}
