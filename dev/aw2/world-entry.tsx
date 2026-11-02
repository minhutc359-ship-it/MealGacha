import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { WorldPreview } from "./world"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WorldPreview />
  </StrictMode>,
)
