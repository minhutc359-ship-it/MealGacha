import type {
  Application,
  ApplicationOptions,
  Ticker,
  WebGLRenderer,
} from "pixi.js"

type Cleanup = () => void

/** Late async acquisitions are disposed too; teardown never destroys shared sources. */
export class SceneLifetime {
  disposed = false
  private cleanups: Cleanup[] = []

  own(cleanup: () => void) {
    if (this.disposed) cleanup()
    else this.cleanups.push(cleanup)
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    for (const cleanup of this.cleanups.reverse()) {
      try {
        cleanup()
      } catch (cause) {
        console.error("AW2: chưa giải phóng được tài nguyên cảnh.", cause)
      }
    }
    this.cleanups = []
  }
}

export async function initializeWorldScene(
  app: Application,
  options: Partial<ApplicationOptions>,
  lifetime: SceneLifetime,
) {
  try {
    await app.init({ ...options, autoStart: false })
  } catch (cause) {
    // init may reject before the Application has a renderer or ticker.
    if (app.renderer) app.destroy(true, { children: true })
    else app.stage.destroy({ children: true })
    throw cause
  }
  lifetime.own(() => app.destroy(true, { children: true }))
}

/** Readiness means a real rendered frame. The same guarded ticker stays after promotion. */
export function firstWorldFrame(
  app: Application,
  host: HTMLDivElement,
  update: (ticker: Ticker) => void,
  lifetime: SceneLifetime,
  onFailure: (cause: unknown) => void,
): Promise<() => void> {
  return new Promise((resolve, reject) => {
    let rendered = false
    const canvas = app.canvas
    const assertUsable = () => {
      if (
        lifetime.disposed ||
        (app.renderer as WebGLRenderer).gl.isContextLost()
      )
        throw Error("Cảnh mất kết nối đồ họa. Hãy thử lại hoặc Đọc lại.")
    }
    const fail = (cause: unknown) => {
      if (lifetime.disposed) return
      canvas.dataset.worldRenderState = "failed"
      reject(cause)
      onFailure(cause)
    }
    const lost = (event: Event) => {
      event.preventDefault()
      fail(Error("Cảnh mất kết nối đồ họa. Hãy thử lại hoặc Đọc lại."))
    }
    canvas.addEventListener("webglcontextlost", lost)
    // Replace Pixi's unguarded render listener, so later drawing failures use map recovery too.
    app.ticker.remove(app.render, app)
    const tick = (ticker: Ticker) => {
      if (lifetime.disposed) return
      try {
        assertUsable()
        update(ticker)
        app.render()
        assertUsable()
        if (!rendered) {
          rendered = true
          canvas.dataset.worldRenderState = "ready"
          canvas.dataset.worldFirstFrameAt = String(performance.now())
          resolve(assertUsable)
        }
      } catch (cause) {
        fail(cause)
      }
    }
    lifetime.own(() => {
      canvas.removeEventListener("webglcontextlost", lost)
      app.ticker.remove(tick)
      app.stop()
      if (!rendered) reject(Error("Cảnh đã được đóng trước khung hình đầu."))
    })
    host.replaceChildren(canvas)
    app.ticker.add(tick)
    app.start()
  })
}
