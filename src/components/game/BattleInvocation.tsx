import type { CSSProperties } from "react"
import type { BattleFrame } from "../../game/battle"
import { battleInvocation } from "../../game/combatDirection"
import { SCHOOLS } from "../../game/catalog"
import { CHARACTER_ART, type CharacterId } from "../../game/characters"
import { tcgCharacter, tcgCaster } from "../../game/tcgCharacterMotion"
import { CharacterSprite } from "./CharacterSprite"

export function BattleInvocation({
  frame,
  opponent,
  stamp,
  quiet = false,
}: {
  frame: BattleFrame | undefined
  opponent: CharacterId
  stamp: string
  quiet?: boolean
}) {
  const action = frame ? battleInvocation(frame) : null
  if (!frame || !action) return null
  const enemy = frame.event.side === "enemy"
  const model = action.kind === "cast" ? tcgCaster(action.card.school) : tcgCharacter(action.card)
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
        {model ? <CharacterSprite model={model} motion={action.kind} stamp={stamp}
          quiet={quiet} flip={enemy} cinematic fallback={action.art} /> : <img src={action.art} alt="" draggable={false} />}
        {action.kind === "cast" && <img className="tcg-invocation-spell-card" src={action.card.art} alt="" draggable={false} />}
        {action.spirit && (
          <img className="tcg-memory-dish" src={action.card.art} alt="" />
        )}
        <i />
        <i />
        <i />
      </div>
      <div className="tcg-invocation-label">
        <strong>{action.spirit && model ? `${action.card.name} → ${model.name}` : action.detail}</strong>
        <span>
          {action.spirit && action.kind === "summon"
            ? action.spirit.memory
            : action.outcome}
        </span>
      </div>
    </div>
  )
}
