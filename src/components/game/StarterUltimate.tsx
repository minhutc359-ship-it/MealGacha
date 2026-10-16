import { useEffect, useRef } from "react"
import {
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
    const kit = starterCharacter(id)!,
      lease = acquireCharacterImage(kit.atlas),
      effectLease = acquireCharacterImage(kit.effect.path),
      effect = effectLease.image,
      image = lease.image
    let lastMs = -1
    let w = 1,
      h = 1
    const draw = () => {
      const ms = state.current.reduced
        ? kit.timeline.impact + 80
        : Math.min(kit.timeline.end-1, state.current.age())
      if (ms === lastMs) return
      lastMs = ms
      el.dataset.phase = ultimatePhase(ms)
      ctx.clearRect(0, 0, w, h)
      if (image.naturalWidth) {
        const p = state.current.reduced ? kit.reducedPose : starterPose(id, "ultimate", ms),
          size = Math.min(w * 0.48, h * 0.92)
        ctx.drawImage(
          image,
          (p % 4) * 256,
          Math.floor(p / 4) * 256,
          256,
          256,
          w * 0.32 - size / 2,
          h * 0.89 - size * kit.anchors.foot[1],
          size,
          size,
        )
      }
      // One painted effect frame replaces geometry when ready; never stack both.
      if (ms >= kit.timeline.casting && ms < kit.timeline.recovery) {
        if (effect.naturalWidth) {
          const row = ms < kit.timeline.impact ? 0 : ms < kit.timeline.finisher ? 1 : 2,
            size = Math.min(w*.39,h*.78)
          ctx.globalAlpha = Math.max(0,Math.min(1,(ms-kit.timeline.casting)/200,(kit.timeline.recovery-ms)/250))
          ctx.drawImage(effect,kit.effect.column*256,row*256,256,256,w*.76-size/2,h*.58-size/2,size,size)
          ctx.globalAlpha = 1
        } else drawStarterVfx(ctx,id,w*.76,h*.54,Math.min(w*.2,h*.29),ms,true,renderIsLight() || state.current.reduced)
      }
    }
    const resize = () => {
      lastMs = -1
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
    effect.addEventListener("load", resize)
    resize()
    const stop = subscribeCharacterClock(
      draw,
      () => !state.current.paused && !state.current.reduced,
    )
    return () => {
      stop()
      observer.disconnect()
      image.removeEventListener("load", resize)
      effect.removeEventListener("load", resize)
      effectLease.release()
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
