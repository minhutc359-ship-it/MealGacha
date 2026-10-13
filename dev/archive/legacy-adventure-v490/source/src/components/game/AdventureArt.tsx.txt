import { ADVENTURE_ART_480, propCellFor } from "../../game/adventure480"
import { useEffect, useRef, useState } from "react"
import { CharacterSprite } from "./CharacterSprite"
import {
  tcgCharacter,
  type CharacterMotion,
} from "../../game/tcgCharacterMotion"
import { unitCharacter } from "../../infrastructure/assets/characterSprites"
import { useAppStore } from "../../store/useAppStore"
import { CARD_MAP } from "../../game/catalog"
import type { CharacterId } from "../../game/characters"
import type { AdventureDirection } from "../../game/adventure"
import { atlasPosition } from "../../game/visualPack"

import { WALK_ATLASES } from "../../game/adventurePresentation"

export function WorldAsset({
  id,
  className = "",
}: {
  id: string
  className?: string
}) {
  const cell = propCellFor(id)
  if (cell !== undefined) return <span className={`adv-world-asset ${className}`} aria-hidden="true" style={{display:"block",backgroundImage:`url(${ADVENTURE_ART_480.props})`,backgroundSize:"400% 400%",backgroundPosition:`${(cell % 4) * 100 / 3}% ${Math.floor(cell / 4) * 100 / 3}%`}} />
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
  const quiet = useAppStore(
    (state) =>
      state.user.preferences.reducedMotion ||
      state.user.preferences.graphicsQuality === "low",
  )
  const atlas = WALK_ATLASES[character]
  if (atlas) {
    return (
      <span
        className={`adv-human-sprite adv-walk-atlas ${
          character === "hero" ? "adv-hero-atlas" : "adv-npc-atlas"
        }`}
        data-character={character}
        data-facing={direction}
        aria-hidden="true"
        style={{
          backgroundImage: `url(${atlas})`,
          backgroundSize: "400% 400%",
          backgroundPosition: atlasPosition(direction, quiet ? 0 : frame),
        }}
      />
    )
  }
  const chef = ["bach", "hai", "moc", "nhien", "lien"].includes(character)
  return (
    <span className="adv-human-sprite" data-facing={direction}>
      {chef ? (
        <CharacterSprite
          model={unitCharacter(`chef-${character}`)}
          motion="idle"
          stamp={`${character}-${frame}`}
          flip={direction === "left"}
          quiet={quiet}
        />
      ) : (
        <WorldAsset id={`${character}-${direction}-${frame % 2}`} />
      )}
    </span>
  )
}
/** Shared animated atlas renderer used by TCG and Auto chess. */
export function SpiritSprite({
  cardId,
  back = false,
  motion = "idle",
  stamp = cardId,
  delay = 0,
  lead,
  quiet = false,
  paused = false,
  lazy = false,
}: {
  cardId: string
  back?: boolean
  motion?: CharacterMotion
  stamp?: string
  delay?: number
  lead?: "attack"
  quiet?: boolean
  paused?: boolean
  lazy?: boolean
}) {
  const holder = useRef<HTMLSpanElement>(null)
  const [visible,setVisible] = useState(!lazy)
  useEffect(()=>{
    if(!lazy)return
    if(typeof IntersectionObserver === "undefined"){setVisible(true);return}
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{rootMargin:"120px"})
    if(holder.current)observer.observe(holder.current)
    return()=>observer.disconnect()
  },[lazy])
  const card = CARD_MAP[cardId],
    model = tcgCharacter(card)
  return (
    <span
      ref={holder}
      className={`adv-spirit-sprite school-${card.school}`}
      role="img"
      aria-label={`Vị Linh ${card.name}`}
    >
      {model && visible ? (
        <CharacterSprite
          model={model}
          motion={motion}
          stamp={stamp}
          delay={delay}
          lead={lead}
          flip={back}
          quiet={quiet}
          paused={paused}
          fallback={card.art}
        />
      ) : (
        <img src={model?.showcase ?? card.art} alt="" loading="lazy" decoding="async" />
      )}
    </span>
  )
}
