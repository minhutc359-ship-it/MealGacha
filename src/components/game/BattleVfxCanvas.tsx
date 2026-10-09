import { useEffect, useRef } from "react"
import type { EffectCue } from "../../game/combatEffects"
import type { School } from "../../game/types"
import { drawChannel, drawProjectile, drawImpact, TCG_IMPACT_MS, type VfxKind, type VfxPoint } from "../../game/battleVfx"
import { subscribeCharacterClock } from "../../infrastructure/assets/characterSprites"

type Placed = EffectCue & VfxPoint & { size: number }
function kindFor(cue: Placed, attack: boolean): VfxKind {
  if (cue.kind === "heal" || cue.kind === "leaves") return "heal"
  if (cue.kind === "shield" || cue.kind === "buff") return "shield"
  if (cue.kind === "break") return "shatter"
  if (cue.kind === "summon") return "summon"
  return attack || cue.kind === "strike" ? "slash" : "projectile"
}
export function BattleVfxCanvas({ source, cues, school, action, stamp, quiet }: {
  source: VfxPoint; cues: Placed[]; school: School; action: string; stamp: string; quiet: boolean
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const timeline = useRef({ stamp: "", start: 0, hiddenAt: null as number | null })
  useEffect(() => {
    const surface = canvas.current, ctx = surface?.getContext("2d")
    if (!surface || !ctx || quiet) return
    let width = 1, height = 1
    if (timeline.current.stamp !== stamp) timeline.current = { stamp, start: performance.now(), hiddenAt: null }
    const clock = timeline.current
    const contact = ["attack", "play"].includes(action) ? TCG_IMPACT_MS : 140
    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height)
      const age = now - clock.start
      if (document.hidden || age > contact + 760) return
      surface.dataset.phase = age < contact * .4 ? "windup" : age < contact ? "flight" : "impact"
      if (action === "play" && age < contact) drawChannel(ctx,source,school,age/contact,34)
      for (const cue of cues) {
        if (["draw","turn","awaken","resonance"].includes(cue.kind)) continue
        const point = { x:cue.x,y:cue.y }, kind = kindFor(cue,action === "attack")
        const support = action === "play" && ["heal", "shield", "buff", "summon"].includes(cue.kind)
        if((cue.projectile || support) && age > contact*.25 && age < contact)
          drawProjectile(ctx,source,point,cue.school,(age-contact*.25)/(contact*.75),Math.min(19,cue.size*.16),false,kind)
        drawImpact(ctx,point,cue.school,(age-contact)/1000,Math.min(48,cue.size*.4),kind)
      }
    }
    const resize = () => {
      width = Math.max(1,surface.clientWidth);height = Math.max(1,surface.clientHeight)
      const dpr = Math.min(2,window.devicePixelRatio||1)
      surface.width=Math.round(width*dpr);surface.height=Math.round(height*dpr)
      ctx.setTransform(dpr,0,0,dpr,0,0);draw(performance.now())
    }
    const visibility = () => {
      const now=performance.now()
      if(document.hidden) clock.hiddenAt??=now
      else if(clock.hiddenAt!==null){clock.start+=now-clock.hiddenAt;clock.hiddenAt=null}
    }
    const observer=new ResizeObserver(resize);observer.observe(surface);resize()
    const unsubscribe=subscribeCharacterClock(draw)
    document.addEventListener("visibilitychange",visibility)
    return ()=>{observer.disconnect();unsubscribe();document.removeEventListener("visibilitychange",visibility)}
  },[source,cues,school,action,stamp,quiet])
  return quiet ? null : <canvas ref={canvas} className="tcg-battle-vfx-canvas" data-vfx="elemental" aria-hidden="true" />
}
