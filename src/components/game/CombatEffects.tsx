import {
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react"
import { CARD_MAP, SCHOOLS } from "../../game/catalog"
import { combatCues, type EffectCue } from "../../game/combatEffects"
import { FLAVOR_SPIRITS } from "../../game/flavorSpirits"
import { battleInvocation } from "../../game/combatDirection"
import { tcgCharacter } from "../../game/tcgCharacterMotion"
import { BattleVfxCanvas } from "./BattleVfxCanvas"
import { TCG_IMPACT_MS } from "../../game/battleVfx"
import { CharacterSprite } from "./CharacterSprite"
import type { BattleFrame } from "../../game/battle"
interface Props {
  arena: RefObject<HTMLDivElement | null>
  frame: BattleFrame | undefined
  stamp: string
  quiet?: boolean
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
  vanish: "✧",
  awaken: "☾",
  finish: "✺",
}
export function CombatEffects({ arena, frame, stamp, quiet = false }: Props) {
  const [layout, setLayout] = useState<Layout | null>(null)
  useEffect(() => {
    for (const src of new Set([
      ...Object.values(SPRITES),
      ...Object.values(FLAVOR_SPIRITS).map((spirit) => spirit.art),
      "/assets/tcg/characters/anime/hero-command.webp",
    ])) {
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
  const card = frame?.event.cardId ? CARD_MAP[frame.event.cardId] : undefined
  const invocation = frame ? battleInvocation(frame) : null
  const attacker = invocation ? tcgCharacter(invocation.card) : null
  const contact = layout.cues.find(
    (cue) => cue.projectile && cue.side !== frame?.event.side,
  )
  return (
    <div
      className={`tcg-combat-fx tcg-elemental-fx action-${frame?.event.kind ?? "idle"}`}
      key={stamp}
      aria-hidden="true"
    >
      <BattleVfxCanvas source={layout.source} cues={layout.cues} school={invocation?.card.school ?? "hearth"}
        action={frame?.event.kind ?? "idle"} stamp={stamp} quiet={quiet} />
      {invocation?.kind === "attack" && contact && (
        <div
          className="tcg-attack-manifest"
          data-effect="spirit-flight"
          style={
            {
              left: layout.source.x,
              top: layout.source.y,
              "--flight-x": `${contact.x - layout.source.x}px`,
              "--flight-y": `${contact.y - layout.source.y}px`,
              "--flight-color": SCHOOLS[invocation.card.school].color,
            } as CSSProperties
          }
        >
          {attacker ? <CharacterSprite model={attacker} motion="attack" stamp={stamp}
            flip={contact.x < layout.source.x || (Math.abs(contact.x - layout.source.x) < 5 && frame?.event.side === "enemy")}
            quiet={quiet} fallback={invocation.art} /> : <img src={invocation.art} alt="" draggable={false} />}
        </div>
      )}
      {frame?.event.kind === "play" && card?.kind === "spell" && (
        <div
          className="tcg-cast-rune"
          style={
            {
              left: layout.source.x,
              top: layout.source.y,
              "--fx-color": SCHOOLS[card.school].color,
            } as CSSProperties
          }
          data-effect="cast"
        >
          <i />
          <i />
          <b>{card.symbol}</b>
        </div>
      )}
      {card?.effect === "sweep" && (
        <div
          className={`tcg-sweep-wave ${
            frame?.event.side === "player" ? "enemy" : "player"
          }`}
          style={{ "--fx-color": SCHOOLS[card.school].color } as CSSProperties}
          data-effect="sweep"
        />
      )}
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
          "--fx-contact": `${["attack","play"].includes(frame?.event.kind ?? "") ? TCG_IMPACT_MS : 80}ms`,
        } as CSSProperties
        return (
          <div
            key={`${cue.kind}-${cue.side}-${cue.target}-${i}`}
            className={`tcg-fx-anchor fx-${cue.kind}`}
            data-effect={cue.kind}
            data-effect-target={`${cue.side}:${cue.target}`}
            style={style}
          >
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
            {["fire", "water", "strike", "finish"].includes(cue.kind) && (
              <span className="tcg-fx-contact">
                <i />
                <i />
                <i />
                <i />
              </span>
            )}
            {cue.kind === "draw" && (
              <span className="tcg-fx-draw-fan">
                <i>▱</i>
                <i>▱</i>
                <i>▱</i>
              </span>
            )}
            {cue.kind === "awaken" && (
              <span className="tcg-fx-awaken-label">THỨC TỈNH</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
