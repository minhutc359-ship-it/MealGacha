import { useEffect, useRef } from "react"
import type { School } from "../../game/types"
import { drawChannel, drawImpact, drawProjectile } from "../../game/battleVfx"
import { subscribeCharacterClock } from "../../infrastructure/assets/characterSprites"
import { renderDpr, renderIsLight } from "../../infrastructure/presentation/renderQuality"
import { gameAudio } from "../../infrastructure/audio/gameAudio"
import type { CharacterMotion } from "../../game/tcgCharacterMotion"
const soundFor = {ember:"fire",tide:"water",grove:"leaves",hearth:"impact",sugar:"sparkle"} as const
export function AdventureEffects({ally,enemy,allySchool,enemySchool,stamp,allyDelay,enemyDelay,quiet,paused}: {
 ally:CharacterMotion;enemy:CharacterMotion;allySchool:School;enemySchool:School;stamp:string;allyDelay:number;enemyDelay:number;quiet:boolean;paused:boolean
}) {
 const canvas=useRef<HTMLCanvasElement>(null)
 const timeline=useRef({stamp:"",start:0,pausedAt:0,sounded:new Set<string>()})
 useEffect(()=>{
  const surface=canvas.current,ctx=surface?.getContext("2d")
  if(!surface||!ctx)return
  const now=performance.now(),clock=timeline.current
  if(clock.stamp!==stamp){clock.stamp=stamp;clock.start=now;clock.pausedAt=0;clock.sounded.clear()}
  if(paused){clock.pausedAt ||= now;return}
  if(clock.pausedAt){clock.start+=now-clock.pausedAt;clock.pausedAt=0}
  let width=1,height=1,release=()=>{}
  const draw=(now:number)=>{
   ctx.clearRect(0,0,width,height)
   const age=now-clock.start,low=renderIsLight()
   if(age>1900){release();return}
   for(const [side,motion,school,delay] of [["ally",ally,allySchool,allyDelay],["enemy",enemy,enemySchool,enemyDelay]] as const){
    if(!["attack","cast","summon"].includes(motion))continue
    const t=age-delay,from=side==="ally"?{x:width*.22,y:height*.76}:{x:width*.78,y:height*.26},to=side==="ally"?{x:width*.78,y:height*.26}:{x:width*.22,y:height*.76}
    const kind=motion==="summon"?"summon":motion==="cast"?"projectile":"slash"
    if(t>=0&&t<360&&!quiet)drawChannel(ctx,from,school,t/360,25,low)
    if(t>=200&&t<560&&!quiet&&motion!=="summon")drawProjectile(ctx,from,to,school,(t-200)/360,Math.min(18,width*.045),low,kind)
    if(t>=560&&t<1050){if(!quiet)drawImpact(ctx,motion==="summon"?from:to,school,(t-560)/1000,36,kind,low)
     if(!clock.sounded.has(side)){clock.sounded.add(side);gameAudio.play(motion==="summon"?"summon":soundFor[school],0,side==="ally"?.25:-.25)}
    }
   }
  }
  const resize=()=>{width=surface.clientWidth;height=surface.clientHeight;const dpr=renderDpr();surface.width=Math.max(1,width*dpr);surface.height=Math.max(1,height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
  const observer=new ResizeObserver(resize);observer.observe(surface);resize();release=subscribeCharacterClock(draw,true)
  const visibility=()=>{const now=performance.now();if(document.hidden)clock.pausedAt ||= now;else if(clock.pausedAt){clock.start+=now-clock.pausedAt;clock.pausedAt=0}}
  document.addEventListener("visibilitychange",visibility)
  return()=>{release();observer.disconnect();document.removeEventListener("visibilitychange",visibility)}
 },[ally,enemy,allySchool,enemySchool,stamp,allyDelay,enemyDelay,quiet,paused])
 return <canvas ref={canvas} className="adv-elemental-effects" aria-hidden="true"/>
}
