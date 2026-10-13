import { beforeEach, describe, expect, it } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { STARTER_DECK, LEGACY_STARTER_DECK, deckErrors, CARDS } from "@/game/catalog"
import { startBattle, actBattle } from "@/game/battle"
import { createExpedition } from "@/game/expedition"
import { startSideQuest, startWeekly as startWeeklyBattle } from "@/game/journeys"
import { newGame } from "@/game/progression"
import { useGameStore } from "@/game/useGameStore"
import { clearProtectedState } from "@/infrastructure/storage/protectedStorage"
import { TrapSlot, TrapReveal } from "@/components/game/TrapZone"
import { frameDuration } from "@/game/combatDirection"
import { frameSounds } from "@/game/audioScore"
import { atlasCellRect, propCellFor, terrainCellFor } from "@/game/adventure480"
import { ADVENTURE_MAPS } from "@/game/adventureWorld"
import { existsSync } from "node:fs"
beforeEach(()=>{
 const values=new Map<string,string>()
 Object.defineProperty(globalThis,"localStorage",{configurable:true,value:{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k),clear:()=>values.clear(),key:(i:number)=>[...values.keys()][i]??null,get length(){return values.size}}})
 clearProtectedState();useGameStore.setState({save:newGame(),notice:null,presentation:null})
})
describe("consistent TCG entry points",()=>{
 it("rejects short, over-size and third-copy decks before dealing or creating a run",()=>{
  for(const deck of [LEGACY_STARTER_DECK,[...STARTER_DECK,"spark"],[...STARTER_DECK.slice(0,23),"spark"]]){
   expect(()=>startBattle(deck,null)).toThrow();expect(()=>createExpedition(deck,7)).toThrow()
  }
  expect(startBattle(LEGACY_STARTER_DECK,null,"courage",()=>.4,false,450).rulesVersion).toBe(450)
  expect(createExpedition(LEGACY_STARTER_DECK,7,undefined,450).deck).toHaveLength(18)
 })
 it("uses a legal 24-card deck for campaign, practice, companion and weekly battles",()=>{
  const week=startWeeklyBattle(0,"2026-10-12")
  for(const b of [startBattle(STARTER_DECK,"lantern-1"),startBattle(STARTER_DECK,null),startSideQuest(STARTER_DECK,"bach","share"),week]){
   expect(b.player.deck.length+b.player.hand.length).toBe(24);expect(b.enemy.deck.length+b.enemy.hand.length).toBe(24)
   expect(deckErrors([...b.player.deck,...b.player.hand],Object.fromEntries(CARDS.map(c=>[c.id,2])))).toEqual([])
  }
 })
 it("informs the player of an invalid companion deck without changing their save",()=>{
  const save=newGame();save.clearedStages=["lantern-1","lantern-2","lantern-3"];save.decks[0].cards=[...LEGACY_STARTER_DECK]
  useGameStore.setState({save});const before=JSON.stringify(save)
  expect(useGameStore.getState().startSideQuest("bach","share")).toBe(false)
  expect(useGameStore.getState().notice).toContain("24");expect(JSON.stringify(useGameStore.getState().save)).toBe(before)
 })
})
describe("quiet trap frames and readable reveal",()=>{
 it("contains no visible caption for empty, face-down or ready traps and preserves ARIA inspection",()=>{
  const b=startBattle(STARTER_DECK,null);b.player.mana=b.player.maxMana=7;b.player.hand=["trap-lid"]
  for(const side of ["player","enemy"] as const){
   const empty=renderToStaticMarkup(createElement(TrapSlot,{battle:b,side,onInspect:()=>{},onSet:()=>{}}))
   expect(empty.replace(/<[^>]*>/g,"")).toBe("");expect(empty).toContain("aria-label")
  }
  const out=actBattle(b,{type:"play",index:0}),frame=out.frames.find(f=>f.event.kind==="set-trap")!
  const html=renderToStaticMarkup(createElement(TrapSlot,{battle:out.battle,side:"player",onInspect:()=>{},onSet:()=>{},setting:true,stamp:"set-once"}))
  expect(html.replace(/<[^>]*>/g,"")).toBe("");expect(html).toContain("is-setting");expect(html).toContain("tcg-trap-set-ring")
  expect(frameSounds(frame).filter(sound=>sound.cue==="trap-set")).toHaveLength(1)
  expect(frameDuration(frame)).toBe(650)
  const reveal={...frame,event:{...frame.event,kind:"trap" as const,cardId:"trap-lid"}}
  expect(frameDuration(reveal)).toBe(2250)
  expect(renderToStaticMarkup(createElement(TrapReveal,{frame:reveal,quiet:false}))).toContain("Nắp Nồi Bật Lửa")
 })
})
describe("Adventure atlas bounds and map semantics",()=>{
 it("covers non-divisible image dimensions exactly without cell overlap",()=>{
  let area=0
  for(let index=0;index<16;index++){
   const r=atlasCellRect(index,1254,1254);expect(r.x).toBeGreaterThanOrEqual(0);expect(r.y).toBeGreaterThanOrEqual(0)
   expect(r.x+r.width).toBeLessThanOrEqual(1254);expect(r.y+r.height).toBeLessThanOrEqual(1254);area+=r.width*r.height
   if(index%4<3)expect(r.x+r.width).toBe(atlasCellRect(index+1,1254,1254).x)
  }
  expect(area).toBe(1254*1254)
 })
 it("maps every world tile to a valid texture and preserves all collisions, doors and NPC positions",()=>{
  const before=JSON.stringify(ADVENTURE_MAPS)
  for(const map of ADVENTURE_MAPS)for(const row of map.grid)for(const cell of row){const index=terrainCellFor(cell,map.interior,map.areaId);expect(index).toBeGreaterThanOrEqual(0);expect(index).toBeLessThan(16)}
  expect(JSON.stringify(ADVENTURE_MAPS)).toBe(before)
  expect(propCellFor("tree","moon-table")).toBe(2);expect(propCellFor("tree","tide-pier")).toBe(3)
  expect(existsSync("public/assets/adventure/world-props-v480.webp")).toBe(true);expect(existsSync("public/assets/adventure/terrain-v480.webp")).toBe(true)
 })
})
