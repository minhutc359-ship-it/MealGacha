import { useEffect, useRef } from "react"
import {
  STARTER_ASSET_ROOT,
  starterCharacter,
  starterPose,
  ultimatePhase,
} from "../../game/starterCharacters"
import { drawStarterVfx } from "../../game/starterVfx"
import {
  acquireCharacterImage,
  subscribeCharacterClock,
} from "../../infrastructure/assets/characterSprites"
import {
  renderDpr,
  renderIsLight,
} from "../../infrastructure/presentation/renderQuality"

/** One clock, one actor, one effect layer. This component never mutates combat. */
export function StarterUltimate({
  id,
  age,
  paused,
  reduced,
}: {
  id: string
  age: () => number
  paused: boolean
  reduced: boolean
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    state = useRef({ age, paused, reduced })
  state.current = { age, paused, reduced }
  useEffect(() => {
    const el = canvas.current!,
      ctx = el.getContext("2d")!
    const lease = acquireCharacterImage(`${STARTER_ASSET_ROOT}/${id}.webp`),
      image = lease.image,
      kit = starterCharacter(id)!
    let w = 1,
      h = 1
    const draw = () => {
      const ms = state.current.reduced
        ? 1040
        : Math.min(2399, state.current.age())
      el.dataset.phase = ultimatePhase(ms)
      ctx.clearRect(0, 0, w, h)
      const gradient = ctx.createRadialGradient(
        w * 0.55,
        h * 0.5,
        0,
        w * 0.55,
        h * 0.5,
        w * 0.75,
      )
      gradient.addColorStop(0, "#234a50")
      gradient.addColorStop(1, "#071824")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = kit.color
      ctx.globalAlpha = 0.25
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.ellipse(w * 0.33, h * 0.87, w * 0.18, h * 0.035, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
      if (image.naturalWidth) {
        const p = starterPose(id, "ultimate", ms),
          size = Math.min(w * 0.48, h * 0.92)
        ctx.drawImage(
          image,
          (p % 4) * 256,
          Math.floor(p / 4) * 256,
          256,
          256,
          w * 0.32 - size / 2,
          h * 0.89 - (size * 240) / 256,
          size,
          size,
        )
      }
      // Keep the finishing gesture on the right, away from the actor silhouette.
      drawStarterVfx(
        ctx,
        id,
        w * 0.73,
        h * 0.54,
        Math.min(w * 0.2, h * 0.29),
        ms,
        true,
        renderIsLight() || state.current.reduced,
      )
    }
    const resize = () => {
      w = el.clientWidth
      h = el.clientHeight
      const dpr = renderDpr()
      el.width = Math.round(w * dpr)
      el.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    image.addEventListener("load", resize)
    resize()
    const stop = subscribeCharacterClock(
      draw,
      () => !state.current.paused && !state.current.reduced,
    )
    return () => {
      stop()
      observer.disconnect()
      image.removeEventListener("load", resize)
      lease.release()
    }
  }, [id])
  return (
    <canvas
      ref={canvas}
      className="rpg-cinematic-native"
      data-character={id}
      aria-hidden="true"
    />
  )
}
