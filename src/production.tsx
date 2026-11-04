import { StrictMode, type ReactNode } from "react"
import { createRoot } from "react-dom/client"
import { startWebOffline } from "./infrastructure/web/offline"
import { productionRoute } from "./productionRoute"
import { migrateTacticalStorage } from "./game/tacticalTcg/migration"
import "./production.css"
const root = createRoot(document.getElementById("root")!)
const render = (content: ReactNode) =>
  root.render(<StrictMode>{content}</StrictMode>)
function renderFailure(cause: unknown) {
  render(
    <main className="production-start-error" role="alert">
      <h1>Chưa mở được Linh Chiến Vị Giác</h1>
      <p>
        {cause instanceof Error ? cause.message : "Hãy tải lại để tiếp tục."}
      </p>
      <button type="button" onClick={() => location.reload()}>
        Thử lại
      </button>
      <a href="/chest">Mở Rương Vị Giác</a>
    </main>,
  )
}
async function start() {
  startWebOffline()
  const route = productionRoute(location.pathname)
  if (route.surface === "redirect" && route.destination) {
    location.replace(route.destination)
    return
  }
  if (route.surface === "legal") return
  if (route.surface === "chest") {
    const { OriginalChestApp } = await import("./OriginalChestApp")
    render(<OriginalChestApp />)
    return
  }
  const migration = migrateTacticalStorage(localStorage),
    notice =
      migration.status === "blocked" || migration.status === "failed"
        ? "Bản lưu cũ chưa được chuyển đổi; dữ liệu gốc vẫn được giữ nguyên. Hãy xuất backup trước khi tiếp tục trên thiết bị này."
        : null
  const { default: TacticalTcgApp } = await import("./TacticalTcgApp")
  render(<TacticalTcgApp migrationNotice={notice} />)
}
void start().catch(renderFailure)
