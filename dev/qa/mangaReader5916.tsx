import { createRoot } from "react-dom/client"
import { MangaChronicle } from "../../src/components/game/MangaChronicle"
import "../../src/index.css"

declare global {
  interface Window {
    mangaQa: (props: Parameters<typeof MangaChronicle>[0]) => void
  }
}
const root = createRoot(document.getElementById("root")!)
window.mangaQa = (props) =>
  root.render(<MangaChronicle key={JSON.stringify(props)} {...props} />)
window.mangaQa({ track: "tcg" })
