import { StrictMode, useState } from "react"
import { createRoot } from "react-dom/client"
import { STARTER_ASSETS } from "../../src/aw2/assets/starters"
import { AssetPreview } from "./AssetPreview"
import "./styles.css"

function StartersPreview() {
  const [identity, setIdentity] = useState(() => {
    const requested = new URLSearchParams(location.search).get("spirit") ?? "aw2-lua"
    return STARTER_ASSETS[requested] ? requested : "aw2-lua"
  })
  return <>
    <nav className="aw2-save" aria-label="Đội khởi đầu"><p className="eyebrow">AW2-004B · Chọn nhân vật</p><div className="actions">
      {Object.values(STARTER_ASSETS).map(manifest => <button key={manifest.spiritId} data-testid={`spirit-${manifest.spiritId}`} aria-pressed={identity === manifest.spiritId} onClick={() => setIdentity(manifest.spiritId)}>{manifest.displayName}</button>)}
    </div></nav>
    <AssetPreview key={identity} manifest={STARTER_ASSETS[identity]} />
  </>
}
createRoot(document.getElementById("root")!).render(<StrictMode><StartersPreview /></StrictMode>)
