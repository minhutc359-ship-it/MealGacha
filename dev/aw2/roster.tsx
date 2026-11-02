import { StrictMode, useState } from "react"
import { createRoot } from "react-dom/client"
import { ROSTER_ASSETS } from "../../src/aw2/assets/roster"
import { isCombatSpiritId } from "../../src/aw2/combat/roster"
import { AssetPreview } from "./AssetPreview"
import "./styles.css"

function RosterPreview() {
  const [identity, setIdentity] = useState(() => {
    const requested =
      new URLSearchParams(location.search).get("spirit") ?? "aw2-muoi"
    return Object.prototype.hasOwnProperty.call(ROSTER_ASSETS, requested)
      ? requested
      : "aw2-muoi"
  })
  return (
    <>
      <nav className="aw2-save" aria-label="Các bộ nhân vật đã có hình">
        <p className="eyebrow">
          Bộ tham chiếu nhân vật · chưa phải danh sách sở hữu
        </p>
        <div className="actions">
          {Object.values(ROSTER_ASSETS).map((manifest) => (
            <button
              key={manifest.spiritId}
              data-testid={`spirit-${manifest.spiritId}`}
              aria-pressed={identity === manifest.spiritId}
              onClick={() => setIdentity(manifest.spiritId)}
            >
              {manifest.displayName}
            </button>
          ))}
        </div>
      </nav>
      <AssetPreview
        key={identity}
        manifest={ROSTER_ASSETS[identity]}
        combatImplemented={isCombatSpiritId(identity)}
      />
    </>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RosterPreview />
  </StrictMode>,
)
