import { lazy, Suspense, useEffect } from "react"
import { BrowserRouter } from "react-router-dom"
import { PresentationSettings } from "./components/game/PresentationSettings"
import { GameErrorBoundary } from "./components/layout/GameErrorBoundary"
import { WebUpdatePrompt } from "./components/layout/WebUpdatePrompt"
import { TCGPage } from "./pages/TCGPage"
import "./index.css"
import "./ui-polish.css"
const TacticalBackupPanel = lazy(() =>
  import("./components/game/TacticalBackupPanel").then((module) => ({
    default: module.TacticalBackupPanel,
  })),
)
export default function TacticalTcgApp({
  migrationNotice,
}: {
  migrationNotice?: string | null
}) {
  useEffect(() => {
    document.documentElement.dataset.productionSurface = "tactical-tcg"
    document.title = "Soul of Meal · Linh Chiến Vị Giác"
    return () => {
      delete document.documentElement.dataset.productionSurface
    }
  }, [])
  return (
    <BrowserRouter>
      <PresentationSettings />
      <GameErrorBoundary
        recovery={
          <Suspense fallback={<p>Đang mở khôi phục…</p>}>
            <TacticalBackupPanel onRestored={() => window.location.reload()} />
          </Suspense>
        }
      >
        <WebUpdatePrompt />
        {migrationNotice && (
          <aside className="tactical-migration-notice" role="status">
            {migrationNotice}
          </aside>
        )}
        <TCGPage />
      </GameErrorBoundary>
    </BrowserRouter>
  )
}
