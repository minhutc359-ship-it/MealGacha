import { CARD_MAP } from "../../game/catalog"
import type { CharacterId } from "../../game/characters"
import type { AdventureDirection } from "../../game/adventure"

export function WorldAsset({
  id,
  className = "",
}: {
  id: string
  className?: string
}) {
  return (
    <svg
      className={`adv-world-asset ${className}`}
      viewBox={
        id.startsWith("house-")
          ? "0 0 128 128"
          : /-(up|down|left|right)-/.test(id)
            ? "0 0 22 28"
            : "0 0 32 40"
      }
      aria-hidden="true"
    >
      <use href={`/assets/adventure/world.svg#${id}`} />
    </svg>
  )
}
export function HumanSprite({
  character,
  direction = "down",
  frame = 0,
}: {
  character: CharacterId
  direction?: AdventureDirection
  frame?: number
}) {
  return (
    <WorldAsset
      id={`${character}-${direction}-${frame % 2}`}
      className="adv-human-sprite"
    />
  )
}
/** Original food-creature models, with shape families and deterministic individual details. */
export function SpiritSprite({
  cardId,
  back = false,
}: {
  cardId: string
  back?: boolean
}) {
  const card = CARD_MAP[cardId],
    school = card.school
  const colors = {
    ember: ["#ce8050", "#f5d782"],
    tide: ["#649dba", "#c7e9df"],
    grove: ["#74a15c", "#e6efab"],
    hearth: ["#ad864e", "#f7de94"],
    sugar: ["#b889b1", "#f6cfd4"],
  }[school]
  const isBread = /banh-mi|croissant/.test(cardId),
    isWrap = /cuon|tet/.test(cardId),
    isRice = /com|xoi/.test(cardId)
  const cheeks = [...cardId].reduce((n, c) => n + c.charCodeAt(0), 0) % 2
  return (
    <svg
      className={`adv-spirit-sprite school-${school}`}
      viewBox="0 0 40 40"
      shapeRendering="crispEdges"
      aria-label={`Mô hình ${card.name}`}
      role="img"
    >
      <ellipse cx="20" cy="36" rx="13" ry="3" fill="#24483b" opacity=".25" />
      <path fill={colors[0]} d="M10 27h6v9h-6zm15 0h6v9h-6z" />
      <path
        fill={colors[1]}
        d={
          isBread
            ? "M7 13h4V9h18v4h4v16H7z"
            : isWrap
              ? "M11 7h18v25H11z"
              : "M5 18h30v7h-4v6H9v-6H5z"
        }
      />
      {isWrap ? (
        <>
          <path fill={colors[0]} d="M11 8h18v5H11zm0 14h18v4H11z" />
          <path fill="#91b76b" d="M14 14h12v7H14z" />
        </>
      ) : isBread ? (
        <path
          stroke={colors[0]}
          strokeWidth="3"
          d="m13 13 3 7m5-9 3 7m4-5 3 7"
        />
      ) : (
        <>
          <path fill={colors[0]} d="M7 16h26v5H7z" />
          <path
            fill={isRice ? "#fbebbc" : "#d9b065"}
            d="M10 12h20v6H10zM14 8h13v5H14z"
          />
          <path fill="#739b55" d="M10 13h5v4h-5zm16-3h4v5h-4z" />
          <path fill="#c5714c" d="M18 11h6v5h-6z" />
        </>
      )}
      <path fill={colors[0]} d="M4 23h5v4H4zm27 0h5v4h-5z" />
      {back ? (
        <path fill={colors[0]} opacity=".5" d="M17 24h7v3h-7z" />
      ) : (
        <>
          <path fill="#283e36" d="M13 23h3v4h-3zm11 0h3v4h-3zM18 28h5v2h-5z" />
          <path
            fill="#d88774"
            opacity=".7"
            d={`M10 ${27 + cheeks}h4v2h-4zm17 0h4v2h-4z`}
          />
        </>
      )}
      <path
        fill={colors[1]}
        d={
          school === "ember"
            ? "m18 2 2-2 3 5h-5z"
            : school === "grove"
              ? "M21 1h6v4h-6v3h-3V4h3z"
              : school === "tide"
                ? "m20 0 3 4-3 2-3-2z"
                : school === "sugar"
                  ? "m20 0 2 3h3l-3 2 1 3-3-2-3 2 1-3-3-2h3z"
                  : "M17 1h7v4h-7z"
        }
      />
    </svg>
  )
}
