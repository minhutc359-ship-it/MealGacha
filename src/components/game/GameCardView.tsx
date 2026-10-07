import type { CSSProperties } from "react"
import { SCHOOLS, RARITIES } from "../../game/catalog"
import type { GameCard } from "../../game/types"

interface Props {
  card: GameCard
  onClick?: () => void
  compact?: boolean
  selected?: boolean
  muted?: boolean
  foil?: boolean
  count?: number
  cost?: number
  playable?: boolean
  disabled?: boolean
}
export function GameCardView({
  card,
  onClick,
  compact,
  selected,
  muted,
  foil,
  count,
  disabled,
  cost = card.cost,
  playable,
}: Props) {
  const content = (
    <>
      <span className="tcg-card-art">
        {card.art ? (
          <img
            src={card.art}
            alt=""
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
        ) : (
          <span className="tcg-card-sigil" aria-hidden="true">
            {card.symbol}
          </span>
        )}
      </span>
      <span className="tcg-card-cost" aria-label={`${cost} năng lượng`}>
        {cost}
      </span>
      <span className="tcg-card-school" title={SCHOOLS[card.school].name}>
        {card.symbol}
      </span>
      <span className="tcg-card-body">
        <span className="tcg-card-eyebrow">
          {card.kind === "unit" ? "ĐỒNG MINH" : "BÍ THUẬT"}{" "}
          <span>{RARITIES[card.rarity].name}</span>
        </span>
        <strong>{card.name}</strong>
        <span className="tcg-card-text">{card.text}</span>
        <span className="tcg-card-footer">
          {card.kind === "unit" ? (
            <>
              <b title="Sức tấn công">⚔ {card.attack}</b>
              <b title="Máu">♥ {card.health}</b>
            </>
          ) : (
            <span>✧ Phép thuật</span>
          )}
          <span>{SCHOOLS[card.school].name}</span>
        </span>
      </span>
      {count !== undefined && (
        <span className="tcg-card-count">
          {count ? `×${count}` : "Chưa có"}
        </span>
      )}
      {foil && <span className="tcg-foil" aria-hidden="true" />}
    </>
  )
  const className = `tcg-card tcg-rarity-${card.rarity} ${
    compact ? "is-compact" : ""
  } ${selected ? "is-selected" : ""} ${muted ? "is-muted" : ""} ${
    playable ? "is-playable" : ""
  }`
  const style = {
    "--school-color": SCHOOLS[card.school].color,
  } as CSSProperties
  return onClick ? (
    <button
      className={className}
      style={style}
      onClick={onClick}
      disabled={disabled}
      title={`${card.name} · ${card.text}`}
      aria-pressed={selected}
      aria-label={`${card.name}, ${cost} năng lượng${
        count !== undefined ? `, sở hữu ${count}` : ""
      }`}
    >
      {content}
    </button>
  ) : (
    <div className={className} style={style}>
      {content}
    </div>
  )
}
