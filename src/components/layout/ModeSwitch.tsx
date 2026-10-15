import { useEffect, useState, type MouseEvent } from "react"
import { createPortal } from "react-dom"
import { Link, useNavigate } from "react-router-dom"
import { randomGameIntroImage } from "../../game/loadingImages"
import { useAppStore } from "../../store/useAppStore"

type ModeDestination = {
  id: "tcg" | "chest" | "auto" | "adventure"
  label: string
  name: string
  url: string
}

interface PendingMode extends ModeDestination {
  image: string
  quiet: boolean
}

const MODES: readonly ModeDestination[] = [
  { id: "tcg", label: "TCG", name: "TCG", url: "/?tab=home" },
  { id: "chest", label: "Rương", name: "Rương vị giác", url: "/chest" },
  { id: "auto", label: "Auto chess", name: "Auto chess", url: "/autochess" },
  {
    id: "adventure",
    label: "Phiêu lưu",
    name: "Phiêu lưu Vị Linh",
    url: "/adventure",
  },
]

export function ModeSwitch({
  mode,
}: {
  mode: "tcg" | "chest" | "auto" | "adventure"
}) {
  const navigate = useNavigate()
  const reducedMotion = useAppStore(
    (state) => state.user.preferences.reducedMotion,
  )
  const [pending, setPending] = useState<PendingMode | null>(null)

  useEffect(() => {
    if (!pending) return
    const timer = window.setTimeout(
      () => navigate(pending.url),
      pending.quiet ? 360 : 900,
    )
    return () => window.clearTimeout(timer)
  }, [navigate, pending])

  function startTransition(
    event: MouseEvent<HTMLAnchorElement>,
    destination: ModeDestination,
  ) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    event.preventDefault()
    if (pending) return
    const systemQuiet = window.matchMedia?.("(prefers-reduced-motion: reduce)")
      .matches
    setPending({
      ...destination,
      image: randomGameIntroImage(),
      quiet: reducedMotion || Boolean(systemQuiet),
    })
  }

  return (
    <>
      <nav className="meal-mode-selector" aria-label="Chuyển chế độ game">
        {MODES.filter((m) => m.id !== mode).map((m) => (
          <Link
            key={m.id}
            className={`meal-mode-switch mode-${mode}`}
            to={m.url}
            aria-label={`Chuyển sang ${m.name}`}
            aria-disabled={pending ? "true" : undefined}
            title={`Chuyển sang ${m.name} · Tiến trình được giữ lại`}
            onClick={(event) => startTransition(event, m)}
          >
            <span aria-hidden="true">⇄</span> {m.label}
          </Link>
        ))}
      </nav>
      {pending &&
        createPortal(
          <div
            className={`mode-switch-loading ${pending.quiet ? "is-quiet" : ""}`}
            role="status"
            aria-live="polite"
            aria-label={`Đang chuyển sang ${pending.name}`}
          >
            <img src={pending.image} alt="" decoding="async" />
            <div className="mode-switch-loading-shade" />
            <div className="mode-switch-loading-copy">
              <small>SOUL OF MEAL · ĐANG CHUYỂN CHẾ ĐỘ</small>
              <strong>{pending.name}</strong>
              <span>Đang chuẩn bị hành trình vị giác…</span>
              <i aria-hidden="true" />
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
