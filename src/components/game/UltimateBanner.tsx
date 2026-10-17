import type { CSSProperties, ReactNode } from "react"
import { CARD_MAP, SCHOOLS } from "../../game/catalog"
import { spiritArt } from "../../game/adventureRpg/spiritArt"
import {
  CAST_SIGILS,
  SHOWCASE_THEMES,
  ultimateShowcase,
} from "../../game/ultimateShowcase"
import type { School } from "../../game/types"
import "./ultimateShowcase.css"

export function UltimateBanner({
  id,
  school,
  title,
  name,
  art,
  label = "TUYỆT KỸ",
  combo = 1,
  quiet = false,
  paused = false,
  children,
}: {
  id?: string
  school: School
  title: string
  name?: string
  art?: string
  label?: string
  combo?: number
  quiet?: boolean
  paused?: boolean
  children?: ReactNode
}) {
  const portrait = id ? spiritArt(id) : null,
    identity = id ? ultimateShowcase(id) : null
  const theme = SHOWCASE_THEMES[school]
  const columns = portrait?.columns ?? 1,
    cell = portrait?.cell ?? 0
  return (
    <aside
      className={`ultimate-banner theme-${school}${quiet ? " is-reduced" : ""}${
        paused ? " is-paused" : ""
      }`}
      style={
        {
          "--ultimate-color": theme.color,
          "--ultimate-shade": theme.shade,
        } as CSSProperties
      }
      data-showcase={id ?? school}
      role="status"
      aria-live="polite"
    >
      <span
        className="ultimate-portrait"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${portrait?.path ?? art ?? ""})`,
          backgroundSize: `${columns * 100}% ${columns * 100}%`,
          backgroundPosition: `${((cell % columns) * 100) / Math.max(1, columns - 1)}% ${(Math.floor(cell / columns) * 100) / Math.max(1, columns - 1)}%`,
        }}
      />
      <span className="ultimate-motif" aria-hidden="true">
        {SCHOOLS[school].symbol}
      </span>
      <div className="ultimate-copy">
        <small>
          {label} · {SCHOOLS[school].name}
        </small>
        <strong>{title}</strong>
        <span>
          {name ?? (id ? CARD_MAP[id]?.name : "")}
          {combo > 1 && <b className="ultimate-combo">Liên hương ×{combo}</b>}
        </span>
      </div>
      <span
        className="ultimate-icon"
        aria-hidden="true"
        style={
          identity
            ? {
                backgroundImage: `url(${CAST_SIGILS})`,
                backgroundSize: "1200% 1200%",
                backgroundPosition: `${((identity.icon % 12) * 100) / 11}% ${(Math.floor(identity.icon / 12) * 100) / 11}%`,
              }
            : undefined
        }
      >
        {!identity && SCHOOLS[school].symbol}
      </span>
      {children && <div className="ultimate-controls">{children}</div>}
    </aside>
  )
}

/** DOM cast decoration for the TCG caster. Canvas consumers use drawModelCast. */
export function ModelCastEffect({
  school,
  quiet = false,
}: {
  school: School
  quiet?: boolean
}) {
  return (
    <span
      className={`model-cast-effect${quiet ? " is-reduced" : ""}`}
      aria-hidden="true"
      style={
        { "--ultimate-color": SHOWCASE_THEMES[school].color } as CSSProperties
      }
    >
      <i />
      <b>{SCHOOLS[school].symbol}</b>
    </span>
  )
}
