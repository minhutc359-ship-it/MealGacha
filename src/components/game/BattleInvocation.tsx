import type { CSSProperties } from "react"
import type { BattleFrame } from "../../game/battle"
import { battleInvocation } from "../../game/combatDirection"
import { SCHOOLS } from "../../game/catalog"
import { CHARACTER_ART, type CharacterId } from "../../game/characters"

export function BattleInvocation({
  frame,
  opponent,
  stamp,
}: {
  frame: BattleFrame | undefined
  opponent: CharacterId
  stamp: string
}) {
  const action = frame ? battleInvocation(frame) : null
  if (!frame || !action) return null
  const enemy = frame.event.side === "enemy"
  return (
    <div
      className={`tcg-invocation invocation-${action.kind} ${
        enemy ? "is-enemy" : ""
      }`}
      style={
        { "--invoke-color": SCHOOLS[action.card.school].color } as CSSProperties
      }
      key={stamp}
      data-effect="invocation"
      data-invocation={action.kind}
      aria-hidden="true"
    >
      <div className="tcg-invocation-commander">
        <img
          src={
            enemy
              ? CHARACTER_ART[opponent]
              : "/assets/tcg/characters/anime/hero-command.webp"
          }
          alt=""
          draggable={false}
        />
        <div>
          <small>
            {enemy ? "CHỦ TƯỚNG ĐỊCH" : "NGƯỜI GIỮ VỊ"} · {action.title}
          </small>
          <strong>“{action.quote}”</strong>
        </div>
      </div>
      <div className="tcg-invocation-art">
        <img src={action.art} alt="" draggable={false} />
        {action.spirit && (
          <img className="tcg-memory-dish" src={action.card.art} alt="" />
        )}
        <i />
        <i />
        <i />
      </div>
      <div className="tcg-invocation-label">
        <strong>{action.detail}</strong>
        <span>
          {action.spirit && action.kind === "summon"
            ? action.spirit.memory
            : action.outcome}
        </span>
      </div>
    </div>
  )
}
