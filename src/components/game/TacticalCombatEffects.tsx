import {
  useLayoutEffect,
  useState,
  type RefObject,
  type CSSProperties,
} from "react"
import type { EffectCue } from "../../game/combatEffects"
import type { TacticalTransition } from "../../game/tacticalTcg/presentation/transitions"
import { tacticalSpiritModel } from "../../game/tacticalTcg/presentation/models"
import { TACTICAL_CARD_MAP } from "../../game/tacticalTcg/cards"
import { BattleVfxCanvas } from "./BattleVfxCanvas"
import { TacticalSpiritArt } from "./TacticalSpirit"

type Point = { x: number; y: number; size: number }
export function TacticalCombatEffects({
  transition: t,
  arena,
  quiet,
}: {
  transition: TacticalTransition | null
  arena: RefObject<HTMLDivElement | null>
  quiet: boolean
}) {
  const [anchors, setAnchors] = useState<Record<string, Point>>({})
  useLayoutEffect(() => {
    const root = arena.current
    if (!root || !t) return
    const measure = () => {
      const bounds = root.getBoundingClientRect(),
        next: Record<string, Point> = {}
      root
        .querySelectorAll<HTMLElement>("[data-unit], [data-hero]")
        .forEach((el) => {
          const r = el.getBoundingClientRect()
          next[el.dataset.unit ?? `hero:${el.dataset.hero}`] = {
            x: r.left - bounds.left + r.width / 2,
            y: r.top - bounds.top + r.height / 2,
            size: Math.min(r.width, r.height),
          }
        })
      setAnchors(next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [t, arena])
  if (!t) return null
  const source = anchors[t.sourceId] ?? anchors[`hero:${t.side}`]
  const card = t.cardId ? TACTICAL_CARD_MAP[t.cardId] : null
  const cues = t.deltas.flatMap((d) => {
    const point = anchors[d.id]
    if (!point) return []
    const kind: EffectCue["kind"] = d.spawned
      ? "summon"
      : d.hp < 0 || d.shield < 0
        ? "strike"
        : d.hp > 0
          ? "heal"
          : d.shield > 0
            ? "shield"
            : "buff"
    return [
      {
        ...point,
        kind,
        side: d.side,
        target: d.id,
        school: t.school,
        projectile: d.id !== t.sourceId,
      },
    ]
  })
  const modelId = t.cardId ? tacticalSpiritModel(t.cardId)?.id : undefined
  return (
    <div
      className="tactical-combat-effects"
      data-action={t.kind}
      data-contact={t.contact}
      aria-hidden="true"
    >
      {source && (
        <BattleVfxCanvas
          source={source}
          sourceId={modelId}
          cues={cues}
          school={t.school}
          action={t.kind === "attack" ? "attack" : "play"}
          contactMs={t.contact}
          stamp={t.id}
          quiet={quiet}
        />
      )}
      {t.deltas
        .filter((d) => !d.spawned && (d.hp || d.shield || d.attack))
        .map((d) => {
          const p = anchors[d.id]
          if (!p) return null
          const values = [
            d.hp ? `${d.hp > 0 ? "+" : ""}${d.hp} ♥` : "",
            d.shield ? `${d.shield > 0 ? "+" : ""}${d.shield} ◇` : "",
            d.attack > 0 ? `+${d.attack} ⚔` : "",
          ]
            .filter(Boolean)
            .join(" · ")
          return (
            <b
              key={d.id}
              className={`tactical-delta ${
                d.hp < 0 || d.shield < 0 ? "is-damage" : "is-support"
              }`}
              style={
                {
                  left: p.x,
                  top: p.y,
                  "--contact": `${quiet ? 0 : t.contact}ms`,
                } as CSSProperties
              }
            >
              {values}
            </b>
          )
        })}
      {t.kind === "ultimate" && card && (
        <div className="tactical-ultimate-cutin">
          <TacticalSpiritArt id={card.id} />
          <span>
            <small>
              TUYỆT KỸ · {t.side === "player" ? "ĐỒNG MINH" : "ĐỐI THỦ"}
            </small>
            <strong>{card.name}</strong>
            <b>Bùng nổ Hương lực</b>
          </span>
        </div>
      )}
      {t.combo && (
        <div className="tactical-combo" role="status">
          <strong>✦ {t.combo.name}</strong>
          <span>{t.combo.detail}</span>
        </div>
      )}
    </div>
  )
}
