import type { CSSProperties } from "react"
import {
  activeEnemyWarning,
  enemyWarningTargets,
} from "../../game/enemyPresentation"
import { enemyVisual } from "../../game/enemyVisuals"
import { actorAnchor } from "../../game/adventureRpg/formationLayout"
import type { RpgBattle } from "../../game/adventureRpg/types"
export function RpgEnemyTelegraph({ battle: b }: { battle: RpgBattle }) {
  const active = activeEnemyWarning(b)
  if (!active) return null
  const v = enemyVisual(active.actor.id)
  return (
    <div
      className={`rpg-enemy-telegraph motif-${v?.motif ?? "aroma"}`}
      data-warning-source={active.actor.id}
      aria-hidden="true"
    >
      {enemyWarningTargets(b).map((a) => {
        const p = actorAnchor(a),
          wide = actorAnchor(a, true)
        return (
          <span
            key={a.uid}
            className={`rpg-threat-cell${
              a.side === active.actor.side ? " is-support" : ""
            }`}
            data-target={a.uid}
            data-effect={a.side === active.actor.side ? "support" : "danger"}
            style={
              {
                left: `${p.x}%`,
                top: `${p.y}%`,
                "--wide-left": `${wide.x}%`,
              } as CSSProperties
            }
          >
            <i />
            <b>{a.side === active.actor.side ? "+" : "◇"}</b>
          </span>
        )
      })}
    </div>
  )
}
