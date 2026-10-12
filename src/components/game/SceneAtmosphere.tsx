import type { StoryArtId } from "../../game/storyArt"
import { useEffect, useRef } from "react"
import { useAppStore } from "../../store/useAppStore"
import { subscribeCharacterClock } from "../../infrastructure/assets/characterSprites"
import { renderDpr, renderIsLight } from "../../infrastructure/presentation/renderQuality"
export function SceneAtmosphere({kind: requested, art, paused=false}: {kind?: "motes"|"rain"|"leaves"|"embers"; art?: StoryArtId; paused?: boolean}) {
 const kind=requested ?? (art && ["rain-harbor","harbor","tide"].includes(art) ? "rain" : art === "garden" ? "leaves" : "motes")
 const canvas=useRef<HTMLCanvasElement>(null)
 const quiet=useAppStore(s=>s.user.preferences.reducedMotion || s.user.preferences.graphicsQuality === "low")
 useEffect(()=>{
  const surface=canvas.current,ctx=surface?.getContext("2d")
  if(!surface || !ctx || quiet || paused || matchMedia("(prefers-reduced-motion: reduce)").matches)return
  let width=1,height=1,visible=true
  const resize=()=>{width=surface.clientWidth;height=surface.clientHeight;const dpr=renderDpr();surface.width=Math.max(1,width*dpr);surface.height=Math.max(1,height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
  const draw=(now:number)=>{
   if(!visible)return
   ctx.clearRect(0,0,width,height)
   if(renderIsLight())return
   const time=now/1000,count=kind==="rain"?22:14
   for(let i=0;i<count;i++){
    const seed=((i*733+91)%997)/997,x=(seed*width+Math.sin(time*.2+i)*12+width)%width
    const phase=(time*(kind==="rain"?.28:.025)+i*.137)%1,y=kind==="embers"?(1-phase)*height:phase*height
    ctx.globalAlpha=Math.sin(phase*Math.PI)*(kind==="rain"?.14:.24)
    if(kind==="rain"){ctx.strokeStyle="#bfe7ec";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+14);ctx.stroke()}
    else {ctx.fillStyle=kind==="leaves"?"#cff0a9":kind==="embers"?"#ffd895":"#f5dc98";ctx.beginPath();ctx.ellipse(x,y,kind==="leaves"?3:1.5,kind==="leaves"?1.3:1.5,time*.3+i,0,Math.PI*2);ctx.fill()}
   }
   ctx.globalAlpha=1
  }
  const observer=new ResizeObserver(resize);observer.observe(surface);resize()
  const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting});intersection.observe(surface)
  const release=subscribeCharacterClock(draw)
  return()=>{release();observer.disconnect();intersection.disconnect();ctx.clearRect(0,0,width,height)}
 },[kind,quiet,paused])
 return <canvas ref={canvas} className="scene-atmosphere" aria-hidden="true" data-atmosphere={kind}/>
}
