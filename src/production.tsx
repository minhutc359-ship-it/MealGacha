import { StrictMode, type ReactNode } from "react"
import { createRoot } from "react-dom/client"
import { startWebOffline } from "./infrastructure/web/offline"
import { productionSurface } from "./productionRoute"
import "./production.css"

const root = createRoot(document.getElementById("root")!)

function render(content: ReactNode) {
  root.render(<StrictMode>{content}</StrictMode>)
}

function renderFailure(cause: unknown) {
  void cause
  render(
    <main className="production-start-error" role="alert">
      <h1>Chưa mở được Soul of Meal</h1>
      <p>Hãy tải lại để tiếp tục hành trình.</p>
      <button type="button" onClick={() => location.reload()}>
        Thử lại
      </button>
      {location.pathname !== "/" && <a href="/">Về hành trình mới</a>}
    </main>,
  )
}

async function start() {
  startWebOffline()
  if (productionSurface(location.pathname) === "chest") {
    const { OriginalChestApp } = await import("./OriginalChestApp")
    render(<OriginalChestApp />)
    return
  }
  const [{ WorldPreview }, { WebUpdatePrompt }] = await Promise.all([
    import("../dev/aw2/world"),
    import("./components/layout/WebUpdatePrompt"),
  ])
  render(
    <>
      <WebUpdatePrompt />
      <WorldPreview production />
    </>,
  )
}

void start().catch(renderFailure)
