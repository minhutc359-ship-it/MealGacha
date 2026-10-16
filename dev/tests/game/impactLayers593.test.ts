import { describe, expect, it } from "vitest"
import { drawImpact } from "@/game/battleVfx"
function render(texture?: Partial<HTMLImageElement>, low=false, age=.2) {
  const calls: string[]=[]
  const ctx=new Proxy({}, {get:(_,key)=>(..._args: unknown[])=>calls.push(String(key)),set:()=>true}) as CanvasRenderingContext2D
  drawImpact(ctx,{x:30,y:50},"tide",age,20,"wave",low,texture as HTMLImageElement)
  return calls
}
describe("one impact representation",()=>{
  it("uses the painted atlas exclusively when loaded and geometry only while missing or in light mode",()=>{
    const image={complete:true,naturalWidth:1000,naturalHeight:1000}
    const painted=render(image)
    expect(painted.filter(c=>c==="drawImage")).toHaveLength(2)
    expect(painted).not.toContain("stroke")
    for(const fallback of [render(),render({...image,complete:false}),render({...image,naturalWidth:0}),render(image,true)]) {
      expect(fallback).toContain("stroke");expect(fallback).not.toContain("drawImage")
    }
  })
  it("does not draw before activation or after the 700 ms lifetime",()=>{
    for(const age of [-.1,.7,2]) expect(render({complete:true,naturalWidth:1000,naturalHeight:1000},false,age)).toEqual([])
  })
})
