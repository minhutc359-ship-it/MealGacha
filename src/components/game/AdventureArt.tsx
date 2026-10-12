import { CharacterSprite } from "./CharacterSprite"
import { tcgCharacter, type CharacterMotion } from "../../game/tcgCharacterMotion"
import { unitCharacter } from "../../infrastructure/assets/characterSprites"
import { useAppStore } from "../../store/useAppStore"
import { CARD_MAP } from "../../game/catalog"
import type { CharacterId } from "../../game/characters"
import type { AdventureDirection } from "../../game/adventure"

export function WorldAsset({
  id,
  className = "",
}: {
  id: string
  className?: string
}) {
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
  const quiet = useAppStore(state => state.user.preferences.reducedMotion || state.user.preferences.graphicsQuality === "low")
  if (character === "hero") {
    const row = {down:0,left:1,right:2,up:3}[direction]
    return <span className="adv-human-sprite adv-hero-atlas" data-facing={direction} role="img" aria-label="Người giữ vị" style={{backgroundImage:"url(/assets/adventure/hero-v440.webp)",backgroundSize:"400% 400%",backgroundPosition:`${(quiet ? 0 : frame % 4) * 100 / 3}% ${row * 100 / 3}%`}} />
  }
  const chef = ["bach", "hai", "moc", "nhien", "lien"].includes(character)
  return <span className="adv-human-sprite" data-facing={direction}>
    {chef ? <CharacterSprite model={unitCharacter(`chef-${character}`)} motion="idle" stamp={`${character}-${frame}`} flip={direction === "left"} quiet={quiet} />
      : <WorldAsset id={`${character}-${direction}-${frame % 2}`} />}
  </span>
}
/** Shared animated atlas renderer used by TCG and Auto chess. */
export function SpiritSprite({ cardId, back = false, motion = "idle", stamp = cardId, delay = 0, lead, quiet = false, paused = false }: {
  cardId: string; back?: boolean; motion?: CharacterMotion; stamp?: string;
  delay?: number; lead?: "attack"; quiet?: boolean; paused?: boolean
}) {
  const card = CARD_MAP[cardId], model = tcgCharacter(card)
  return <span className={`adv-spirit-sprite school-${card.school}`} role="img" aria-label={`Vị Linh ${card.name}`}>
    {model ? <CharacterSprite model={model} motion={motion} stamp={stamp} delay={delay} lead={lead} flip={back} quiet={quiet} paused={paused} fallback={card.art} /> : <img src={card.art} alt="" />}
  </span>
}
