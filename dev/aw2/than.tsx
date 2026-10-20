import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { THAN_ASSETS } from "../../src/aw2/assets/than"
import { AssetPreview } from "./AssetPreview"
import "./styles.css"

createRoot(document.getElementById("root")!).render(<StrictMode><AssetPreview manifest={THAN_ASSETS} /></StrictMode>)
