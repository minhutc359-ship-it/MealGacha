import type { CSSProperties } from "react"
import type { BattleUnit } from "../../game/tacticalTcg/engine"
import {
  tacticalSpiritPortrait,
  tacticalUnitModel,
  tacticalModelAnimated,
} from "../../game/tacticalTcg/presentation/models"
import {
  tacticalUnitMotion,
  type TacticalTransition,
} from "../../game/tacticalTcg/presentation/transitions"
import { CharacterSprite } from "./CharacterSprite"
import "../../game/characterMotion.css"
import "../../game/tacticalSpirit.css"

export function TacticalSpiritArt({
  id,
  className = "",
}: {
  id: string
  className?: string
}) {
  const art = tacticalSpiritPortrait(id)
  return (
    <span
      className={`tactical-spirit-portrait ${className}`}
      data-spirit={id}
      aria-hidden="true"
    >
      <span className="spirit-portrait-crop" style={
        art
          ? {
              backgroundImage: `url("${art.path}")`,
              backgroundSize: `${art.columns * 100}% ${art.columns * 100}%`,
              backgroundPosition: `${((art.cell % art.columns) * 100) / Math.max(1, art.columns - 1)}% ${(Math.floor(art.cell / art.columns) * 100) / Math.max(1, art.columns - 1)}%`,
            } as CSSProperties
          : undefined
      } />
      {!art && "✦"}
    </span>
  )
}
export function TacticalSpiritActor({
  unit,
  transition,
  quiet,
  winner,
}: {
  unit: BattleUnit
  transition: TacticalTransition | null
  quiet: boolean
  winner: "player" | "enemy" | null
}) {
  const model = tacticalUnitModel(unit)
  const cue = tacticalUnitMotion(unit, transition, winner)
  return (
    <span
      className="tactical-spirit-actor"
      data-model={model?.id}
      data-animation={
        model && tacticalModelAnimated(model) ? "atlas" : "portrait"
      }
    >
      <TacticalSpiritArt id={unit.cardId ?? unit.id} />
      {model && (
        <CharacterSprite
          model={model}
          {...cue}
          stamp={transition?.id ?? `idle:${winner}`}
          flip={unit.side === "enemy"}
          quiet={quiet}
          contactMs={transition?.contact}
        />
      )}
    </span>
  )
}
