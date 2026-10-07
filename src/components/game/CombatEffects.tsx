import { useEffect, useState, type RefObject } from "react"
import { CARD_MAP, SCHOOLS } from "../../game/catalog"
import type { BattleFrame } from "../../game/battle"
interface Props {
  arena: RefObject<HTMLDivElement | null>
  frame: BattleFrame | undefined
  stamp: string
}
interface Flight {
  x1: number
  y1: number
  x2: number
  y2: number
  width: number
  height: number
}
export function CombatEffects({ arena, frame, stamp }: Props) {
  const [flight, setFlight] = useState<Flight | null>(null)
  useEffect(() => {
    const root = arena.current
    if (!root || !frame || !["play", "attack"].includes(frame.event.kind)) {
      setFlight(null)
      return
    }
    const { event } = frame
    const side = event.side
    const source = event.source
      ? root.querySelector<HTMLElement>(`[data-unit="${event.source}"]`)
      : root.querySelector<HTMLElement>(`[data-hero="${side}"]`)
    const foe = side === "player" ? "enemy" : "player"
    const target =
      event.target === "hero"
        ? root.querySelector<HTMLElement>(`[data-hero="${foe}"]`)
        : event.target
          ? root.querySelector<HTMLElement>(`[data-unit="${event.target}"]`)
          : source
    if (!source || !target) {
      setFlight(null)
      return
    }
    const a = root.getBoundingClientRect(),
      s = source.getBoundingClientRect(),
      t = target.getBoundingClientRect()
    setFlight({
      x1: s.left + s.width / 2 - a.left,
      y1: s.top + s.height / 2 - a.top,
      x2: t.left + t.width / 2 - a.left,
      y2: t.top + t.height / 2 - a.top,
      width: a.width,
      height: a.height,
    })
  }, [arena, frame, stamp])
  if (!flight || !frame) return null
  const color = frame.event.cardId
    ? SCHOOLS[CARD_MAP[frame.event.cardId].school].color
    : "#f4bf60"
  return (
    <svg
      className={`tcg-combat-fx fx-${frame.event.kind}`}
      key={stamp}
      viewBox={`0 0 ${flight.width} ${flight.height}`}
      aria-hidden="true"
      style={{ color }}
    >
      <line
        className="tcg-energy-trail"
        x1={flight.x1}
        y1={flight.y1}
        x2={flight.x2}
        y2={flight.y2}
        pathLength="1"
      />
      <g transform={`translate(${flight.x2} ${flight.y2})`}>
        <circle className="tcg-impact-ring" r="34" />
        {Array.from({ length: 8 }, (_, i) => (
          <line
            key={i}
            className="tcg-impact-ray"
            x1="16"
            x2="50"
            transform={`rotate(${i * 45})`}
          />
        ))}
      </g>
    </svg>
  )
}
