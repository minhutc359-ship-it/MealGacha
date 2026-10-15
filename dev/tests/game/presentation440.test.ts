import { describe, expect, it } from "vitest"
import { RenderBudget } from "@/infrastructure/presentation/renderQuality"
import { ambienceFor, fillAmbience } from "@/game/soundDesign"
describe("presentation budgets",()=>{
 it("reduces detail only after sustained slow frames and recovers with hysteresis",()=>{
  const b=new RenderBudget()
  for(let i=0;i<44;i++)b.sample(42,20)
  expect(b.light).toBe(false);expect(b.sample(42,20)).toBe(true);expect(b.light).toBe(true)
  for(let i=0;i<299;i++)b.sample(16,3)
  expect(b.light).toBe(true);b.sample(16,3);expect(b.light).toBe(false)
 })
 it("ignores background gaps and isolated hitches",()=>{
  const b=new RenderBudget()
  for(let i=0;i<200;i++){b.sample(16);b.sample(70);b.sample(2000)}
  expect(b.light).toBe(false)
 })
 it("builds finite, bounded and seamless original ambient loops for every environment",()=>{
  for(const kind of ["water","market","garden","kitchen","night"] as const){
   const data=new Float32Array(48000*4);fillAmbience(data,48000,kind)
   expect(data.every(Number.isFinite)).toBe(true);expect(Math.max(...data.slice(0,6000).map(Math.abs))).toBeLessThan(.2)
   expect(Math.abs(data[0])).toBe(0);expect(Math.abs(data.at(-1)!)).toBe(0)
   expect(data.some(n=>Math.abs(n)>.005)).toBe(true)
  }
  expect(ambienceFor("map-lantern")).toBe("market")
  expect(ambienceFor("map-harbor")).toBe("water")
  expect(ambienceFor("boss")).toBeNull()
 })
})
