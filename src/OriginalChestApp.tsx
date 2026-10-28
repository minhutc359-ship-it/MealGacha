import { useEffect } from "react"
import { BrowserRouter } from "react-router-dom"
import { ChestPage } from "./pages/ChestPage"
import { useAppStore } from "./store/useAppStore"
import { PresentationSettings } from "./components/game/PresentationSettings"
import { GameErrorBoundary } from "./components/layout/GameErrorBoundary"
import { Toast } from "./components/ui/Toast"
import { WebUpdatePrompt } from "./components/layout/WebUpdatePrompt"
import "./index.css"
import "./ui-polish.css"
import "./game/presentation440.css"

export function OriginalChestApp() {
  const init = useAppStore((state) => state.init)
  useEffect(() => {
    document.documentElement.dataset.productionSurface = "original-chest"
    document.title = "Rương Vị Giác original · Soul of Meal"
    init()
    return () => {
      delete document.documentElement.dataset.productionSurface
    }
  }, [init])

  return (
    <BrowserRouter>
      <PresentationSettings />
      <GameErrorBoundary>
        <WebUpdatePrompt />
        <div
          className="loot-client production-chest-shell"
          data-testid="production-original-chest"
        >
          <div className="client-backdrop" aria-hidden="true" />
          <div className="cinematic-curtain" aria-hidden="true" />
          <header className="production-chest-nav">
            <a href="/" aria-label="Trở lại hành trình Soul of Meal mới">
              ← Hành trình mới
            </a>
            <strong>Rương Vị Giác original</strong>
            <a href="/legal/privacy.html">Quyền riêng tư</a>
          </header>
          <div className="client-layout production-chest-layout">
            <main className="client-stage">
              <ChestPage standalone />
            </main>
          </div>
        </div>
        <Toast />
      </GameErrorBoundary>
    </BrowserRouter>
  )
}
