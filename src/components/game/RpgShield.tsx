import { useEffect, useRef, useState, type CSSProperties } from "react"

/** The ward lingers only long enough to dissolve when its protection ends. */
export function RpgShield({ active, strength, breakSerial = 0 }: {
  active: boolean
  strength: number
  breakSerial?: number
}) {
  const previous = useRef(active)
  const [dissolving, setDissolving] = useState(false)
  useEffect(() => {
    if (previous.current && !active || breakSerial > 0 && !active) setDissolving(true)
    if (active) setDissolving(false)
    previous.current = active
  }, [active, breakSerial])
  if (!active && !dissolving) return null
  return <span
    className={`rpg-shield-bubble ${active ? "is-intact" : "is-dissolving"}`}
    style={{ "--shield-strength": Math.max(.2, Math.min(1, strength)) } as CSSProperties}
    data-shield={active ? "active" : "dissolving"}
    aria-hidden="true"
    onAnimationEnd={event => {
      if (event.target === event.currentTarget && event.animationName === "rpg-bubble-dissolve") setDissolving(false)
    }}
  >
    <span className="rpg-bubble-film" />
    {Array.from({ length: 8 }, (_, index) => <i key={index} style={{ "--drop": index } as CSSProperties} />)}
  </span>
}
