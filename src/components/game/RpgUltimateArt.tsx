import { useEffect, useRef } from "react"
import { CARD_MAP } from "../../game/catalog"
import { drawUltimateArt, ultimateIdentity } from "../../game/adventureRpg/ultimateArt"
import { VFX_COLORS } from "../../game/battleVfx"
import { subscribeCharacterClock } from "../../infrastructure/assets/characterSprites"
import { renderDpr, renderIsLight } from "../../infrastructure/presentation/renderQuality"
import { SpiritArt } from "./SpiritArt"

export function RpgUltimateArt({id, paused = false, reduced = false, compact = false}: {
  id: string
  paused?: boolean
  reduced?: boolean
  compact?: boolean
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const clock = useRef({age: 0, previous: 0, paused})
  clock.current.paused = paused
  const identity = ultimateIdentity(id), card = CARD_MAP[id]
  useEffect(() => {
    const surface = canvas.current, ctx = surface?.getContext("2d")
    if (!surface || !ctx) return
    let width = 1, height = 1
    clock.current.age = 0; clock.current.previous = 0
    const draw = (now: number) => {
      const state = clock.current
      if (state.previous && !state.paused && !document.hidden) state.age += Math.min(50, now - state.previous)
      state.previous = now
      ctx.clearRect(0, 0, width, height)
      const progress = reduced ? .38 : (state.age % 2400) / 2400
      drawUltimateArt(ctx, identity.pattern, width * (compact ? .7 : .66), height * .46, Math.min(width * .24, height * .39), progress, VFX_COLORS[card.school][1], identity.motif, renderIsLight())
    }
    const resize = () => {
      width = surface.clientWidth; height = surface.clientHeight
      const dpr = renderDpr(); surface.width = Math.round(width * dpr); surface.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(performance.now())
    }
    const observer = new ResizeObserver(resize); observer.observe(surface); resize()
    const stop = reduced ? () => {} : subscribeCharacterClock(draw, () => !clock.current.paused)
    return () => { stop(); observer.disconnect() }
  }, [id, reduced, compact])
  return <span className={`rpg-ultimate-illustration school-${card.school} ${compact ? "is-compact" : ""} ${paused ? "is-paused" : ""} ${reduced ? "is-reduced" : ""}`} data-pattern={identity.pattern} data-spirit={id} aria-hidden="true">
    <span className="rpg-ultimate-cut-in"><SpiritArt id={id}/></span>
    <canvas ref={canvas} />
  </span>
}
