import { useMemo } from "react"
import { CARD_MAP } from "../../game/catalog"
import { ADVENTURE_LOADING_IMAGES } from "../../game/adventureV560"
import { tcgCharacter } from "../../game/tcgCharacterMotion"
import type { RpgSave } from "../../game/adventureRpg/types"
import { CharacterSprite } from "./CharacterSprite"
import { SpiritArt } from "./SpiritArt"

function travelParty(save: RpgSave) {
  const heroes = save.formation
    .map((uid) => save.roster.find((hero) => hero.uid === uid))
    .filter((hero) => !!hero)
  return {
    leader: heroes[0]?.cardId ?? "com-tam",
    spirits: [heroes[1]?.cardId ?? "banh-mi", heroes[2]?.cardId ?? "pho-bo"],
  }
}

export function AdventureTransition({
  save,
  label,
  quiet,
}: {
  save: RpgSave
  label: string
  quiet: boolean
}) {
  const image = useMemo(
    () =>
      ADVENTURE_LOADING_IMAGES[
        Math.floor(Math.random() * ADVENTURE_LOADING_IMAGES.length)
      ],
    [],
  )
  const party = travelParty(save)
  const model = tcgCharacter(CARD_MAP[party.leader])
  return (
    <div
      className={`rpg-transition ${quiet ? "is-quiet" : ""}`}
      role="status"
      aria-live="polite"
    >
      <img src={image} alt="" decoding="async" />
      <div className="rpg-transition-shade" />
      <div className="rpg-transition-copy">
        <small>SOUL OF MEAL · ĐANG CHUYỂN CẢNH</small>
        <strong>{label}</strong>
        <div className="rpg-travel-progress" aria-hidden="true">
          <i />
          <span className="rpg-travel-party">
            {model && (
              <span className="rpg-travel-leader">
                <CharacterSprite
                  model={model}
                  motion={quiet ? "idle" : "victory"}
                  stamp={`transition:${party.leader}`}
                  quiet={quiet}
                />
              </span>
            )}
            <SpiritArt
              id={party.spirits[0]}
              className="rpg-travel-spirit spirit-one"
            />
            <SpiritArt
              id={party.spirits[1]}
              className="rpg-travel-spirit spirit-two"
            />
          </span>
        </div>
        <p>Nhân vật và hai Vị Linh đang dẫn đường…</p>
      </div>
    </div>
  )
}
