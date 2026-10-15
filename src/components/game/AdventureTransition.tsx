import { useMemo } from "react"
import { randomGameIntroImage } from "../../game/loadingImages"
import type { RpgSave } from "../../game/adventureRpg/types"
import { VillageParty } from "./VillageParty"

export function AdventureTransition({
  save,
  label,
  quiet,
}: {
  save: RpgSave
  label: string
  quiet: boolean
}) {
  const image = useMemo(() => randomGameIntroImage(), [])
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
            <VillageParty
              compact
              moving
              quiet={quiet}
              stamp={`transition:${save.serial}`}
            />
          </span>
        </div>
        <p>Nhân vật và hai Vị Linh đang dẫn đường…</p>
      </div>
    </div>
  )
}
