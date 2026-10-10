import { useEffect, useRef } from "react"
import { useAppStore } from "../../store/useAppStore"
import "./arenaScene.css"

export type ArenaRegion = "market" | "harbor" | "kitchen"
export function arenaRegion(id?: string | null): ArenaRegion {
  return id?.startsWith("rain-harbor")
    ? "harbor"
    : id?.startsWith("tomorrow-table")
      ? "kitchen"
      : "market"
}

/** A presentation-only, layered stage. Actor/input canvases retain their grid. */
export function ArenaScene({
  region,
  pressure = false,
}: {
  region: ArenaRegion
  pressure?: boolean
}) {
  const host = useRef<HTMLDivElement>(null),
    pressureRef = useRef(pressure)
  pressureRef.current = pressure
  const low = useAppStore((s) => s.user.preferences.graphicsQuality === "low")
  const preference = useAppStore((s) => s.user.preferences.reducedMotion)
  const reduced =
    preference || window.matchMedia("(prefers-reduced-motion: reduce)").matches
  useEffect(() => {
    const element = host.current!
    let cancelled = false,
      frame = 0,
      last = 0,
      visibleTime = 0,
      width = 1,
      height = 1
    let app: import("pixi.js").Application | undefined
    let graphics: import("pixi.js").Graphics | undefined
    let surface: HTMLCanvasElement = document.createElement("canvas"),
      context: CanvasRenderingContext2D | null = null
    let draw: () => void = () => {}
    let cleanGpu: () => void = () => {}
    const resetCanvas = () => {
      surface = document.createElement("canvas")
      surface.setAttribute("aria-hidden", "true")
      element.replaceChildren(surface)
      return surface
    }
    const resize = () => {
      width = Math.max(1, element.clientWidth)
      height = Math.max(1, element.clientHeight)
      const dpr = Math.min(low ? 1 : 2, window.devicePixelRatio || 1)
      if (app) app.renderer.resize(width, height, dpr)
      else if (surface && context) {
        surface.width = Math.round(width * dpr)
        surface.height = Math.round(height * dpr)
        context.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      draw()
    }
    const shapes = () =>
      Array.from({ length: low ? 5 : 12 }, (_, i) => {
        const t = reduced ? 0 : visibleTime / 1000
        return {
          x: width * ((i * 0.173 + 0.1) % 1),
          y: height * (0.28 + ((i * 0.117 + t * 0.018) % 0.58)),
          r: 8 + (i % 4) * 5,
          alpha: pressureRef.current ? 0.075 : 0.04,
          wind: reduced ? 0 : Math.sin(t * 0.8 + i) * 12,
        }
      })
    const fallback = () => {
      cleanGpu()
      cleanGpu = () => {}
      app?.destroy(false, { children: true })
      app = undefined
      graphics = undefined
      context = resetCanvas().getContext("2d")
      element.dataset.renderer = "canvas"
      draw = () => {
        if (!context || cancelled) return
        context.clearRect(0, 0, width, height)
        for (const p of shapes()) {
          context.fillStyle = `rgba(241,229,200,${p.alpha})`
          context.beginPath()
          context.ellipse(
            p.x + p.wind,
            p.y,
            p.r * 2,
            p.r * 0.7,
            0,
            0,
            Math.PI * 2,
          )
          context.fill()
        }
        if (region === "harbor") {
          context.strokeStyle = "#83d8ed30"
          for (let i = 0; i < 3; i++) {
            context.beginPath()
            context.ellipse(
              width * (0.3 + i * 0.25),
              height * 0.7,
              30 + ((visibleTime / 70 + i * 22) % 90),
              8,
              0,
              0,
              Math.PI * 2,
            )
            context.stroke()
          }
        }
      }
      resize()
    }
    const loop = (now: number) => {
      if (cancelled) return
      if (
        !document.hidden &&
        now - last >= 1000 / (low || reduced ? 30 : 60) - 1
      ) {
        visibleTime += !reduced && last ? Math.min(50, now - last) : 0
        last = now
        draw()
      }
      frame = requestAnimationFrame(loop)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    const visibility = () => {
      last = 0
      if (document.hidden) {
        cancelAnimationFrame(frame)
        frame = 0
      } else if (!frame) frame = requestAnimationFrame(loop)
    }
    document.addEventListener("visibilitychange", visibility)
    resetCanvas()
    void (async () => {
      if (low || reduced) {
        fallback()
        return
      }
      try {
        const { Application, Graphics } = await import("pixi.js")
        if (cancelled) return
        const next = new Application()
        await next.init({
          canvas: surface,
          width: element.clientWidth || 1,
          height: element.clientHeight || 1,
          preference: "webgl",
          backgroundAlpha: 0,
          autoStart: false,
          resolution: Math.min(2, window.devicePixelRatio || 1),
          powerPreference: "low-power",
        })
        if (cancelled) {
          next.destroy(false, { children: true })
          return
        }
        app = next
        graphics = new Graphics()
        app.stage.addChild(graphics)
        const lost = (event: Event) => {
          event.preventDefault()
          fallback()
        }
        surface.addEventListener("webglcontextlost", lost)
        const original = surface
        cleanGpu = () => original.removeEventListener("webglcontextlost", lost)
        element.dataset.renderer = "webgl"
        draw = () => {
          if (!graphics || !app || cancelled) return
          graphics.clear()
          for (const p of shapes())
            graphics
              .ellipse(p.x + p.wind, p.y, p.r * 2, p.r * 0.7)
              .fill({ color: 0xf1e5c8, alpha: p.alpha })
          if (region === "harbor")
            for (let i = 0; i < 3; i++)
              graphics
                .ellipse(
                  width * (0.3 + i * 0.25),
                  height * 0.7,
                  30 + ((visibleTime / 70 + i * 22) % 90),
                  8,
                )
                .stroke({ color: 0x83d8ed, alpha: 0.18, width: 1 })
          app.renderer.render(app.stage)
        }
        resize()
      } catch {
        if (!cancelled) fallback()
      }
    })()
    frame = requestAnimationFrame(loop)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener("visibilitychange", visibility)
      cleanGpu()
      app?.destroy(false, { children: true })
      element.replaceChildren()
    }
  }, [region, low, reduced])
  return (
    <div
      className="arena-scene"
      data-region={region}
      data-pressure={pressure}
      data-quiet={reduced || low}
      aria-hidden="true"
    >
      <img
        className="arena-far"
        src={`/assets/v4/arenas/${region}.webp`}
        alt=""
        decoding="async"
      />
      <div className="arena-depth" />
      <div className="arena-light" />
      <div className="arena-atmosphere" ref={host} />
      <div className="arena-foreground">
        <i />
        <i />
      </div>
    </div>
  )
}
