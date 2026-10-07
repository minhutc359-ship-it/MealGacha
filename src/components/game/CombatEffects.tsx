import {
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react"
import { SCHOOLS } from "../../game/catalog"
import { combatCues, type EffectCue } from "../../game/combatEffects"
import type { BattleFrame } from "../../game/battle"
interface Props {
  arena: RefObject<HTMLDivElement | null>
  frame: BattleFrame | undefined
  stamp: string
}
interface Point {
  x: number
  y: number
}
interface PlacedCue extends EffectCue {
  x: number
  y: number
  size: number
}
interface Layout {
  source: Point
  cues: PlacedCue[]
}
const SPRITES: Partial<Record<EffectCue["kind"], string>> = {
  fire: "/assets/tcg/fx/fire-impact.webp",
  water: "/assets/tcg/fx/water-impact.webp",
  shield: "/assets/tcg/fx/shield.webp",
  break: "/assets/tcg/fx/shield.webp",
}
const GLYPHS: Partial<Record<EffectCue["kind"], string>> = {
  heal: "+",
  buff: "↑",
  summon: "✦",
  draw: "▱",
  resonance: "✧",
  turn: "◆",
  leaves: "❧",
  sparkle: "✦",
  strike: "╱",
}
export function CombatEffects({ arena, frame, stamp }: Props) {
  const [layout, setLayout] = useState<Layout | null>(null)
  useEffect(() => {
    for (const src of new Set(Object.values(SPRITES))) {
      const image = new Image()
      image.src = src
    }
  }, [])
  useLayoutEffect(() => {
    const root = arena.current
    if (!root || !frame) {
      setLayout(null)
      return
    }
    const place = () => {
      const bounds = root.getBoundingClientRect()
      const locate = (side: EffectCue["side"], target: string) =>
        target === "hand"
          ? root.querySelector<HTMLElement>(".tcg-hand")
          : target === "hero"
            ? root.querySelector<HTMLElement>(`[data-hero="${side}"]`)
            : root.querySelector<HTMLElement>(`[data-unit="${target}"]`)
      const position = (element: HTMLElement) => {
        const r = element.getBoundingClientRect()
        return {
          x: r.left + r.width / 2 - bounds.left,
          y: r.top + r.height / 2 - bounds.top,
          size: Math.min(150, Math.max(75, r.height + 36)),
        }
      }
      const source = locate(frame.event.side, frame.event.source ?? "hero")
      if (!source) {
        setLayout(null)
        return
      }
      const cues = combatCues(frame).flatMap((cue) => {
        const element = locate(cue.side, cue.target)
        return element ? [{ ...cue, ...position(element) }] : []
      })
      setLayout({ source: position(source), cues })
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(root)
    return () => observer.disconnect()
  }, [arena, frame, stamp])
  if (!layout || !layout.cues.length) return null
  return (
    <div
      className="tcg-combat-fx tcg-elemental-fx"
      key={stamp}
      aria-hidden="true"
    >
      {layout.cues.map((cue, i) => {
        const color = ["heal", "leaves"].includes(cue.kind)
          ? "#b4f08b"
          : ["shield", "break", "water"].includes(cue.kind)
            ? "#91eaff"
            : SCHOOLS[cue.school].color
        const style = {
          left: cue.x,
          top: cue.y,
          "--fx-size": `${cue.size}px`,
          "--fx-color": color,
        } as CSSProperties
        return (
          <div
            key={`${cue.kind}-${cue.side}-${cue.target}-${i}`}
            className={`tcg-fx-anchor fx-${cue.kind}`}
            data-effect={cue.kind}
            data-effect-target={`${cue.side}:${cue.target}`}
            style={style}
          >
            {cue.projectile && (
              <span
                className="tcg-fx-projectile"
                style={
                  {
                    "--from-x": `${layout.source.x - cue.x}px`,
                    "--from-y": `${layout.source.y - cue.y}px`,
                  } as CSSProperties
                }
              />
            )}
            <span className="tcg-fx-halo" />
            {SPRITES[cue.kind] ? (
              <img
                className="tcg-fx-sprite"
                src={SPRITES[cue.kind]}
                alt=""
                draggable={false}
              />
            ) : (
              <span className="tcg-fx-glyph">{GLYPHS[cue.kind]}</span>
            )}
            {Array.from({ length: 6 }, (_, n) => (
              <span
                className="tcg-fx-particle"
                key={n}
                style={
                  {
                    "--angle": `${n * 60}deg`,
                    "--travel": `${cue.size * 0.45}px`,
                    "--delay": `${80 + n * 15}ms`,
                  } as CSSProperties
                }
              />
            ))}
            {cue.kind === "strike" && <span className="tcg-fx-slash" />}
          </div>
        )
      })}
    </div>
  )
}
