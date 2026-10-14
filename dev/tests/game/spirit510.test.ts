import {describe, expect, it} from "vitest"
import {existsSync, statSync} from "node:fs"
import {CARDS} from "@/game/catalog"
import {newGame} from "@/game/progression"
import {parseGame} from "@/game/storage"
import {newRpgSave, reduceRpg, heroRole, heroSkills, advanceRpgBattle, syncRoster} from "@/game/adventureRpg/engine"
import {SPIRIT_IDS, spiritArt} from "@/game/adventureRpg/spiritArt"
import {reactionName} from "@/game/adventureRpg/skills"
import type {RpgSave} from "@/game/adventureRpg/types"
const game = newGame()
function battle(): RpgSave {
 const s = newRpgSave(game)
 for (const h of s.roster) h.level = 10
 const r = reduceRpg(s,{type:"start",stageId:"lantern-1"},game).save
 const b = r.run!.battle; b.rulesVersion=520
 for (const a of b.actors) {a.hp=a.maxHp=10000; a.energy=100; a.nextAttack=a.nextSkill=a.nextSupport=1000}
 return r
}
const burst = (s: RpgSave, id: string) => reduceRpg(s,{type:"burst",uid:s.run!.battle.actors.find(a=>a.id===id)!.uid},game).save

describe("Spirit 5.1 art and skill coverage",()=>{
 it("gives every unit its own immutable portrait cell, without food-photo fallback",()=>{
  const units = CARDS.filter(c=>c.kind==="unit")
  expect(new Set(SPIRIT_IDS)).toEqual(new Set(units.map(c=>c.id)))
  const locations = units.map(c=>{const a=spiritArt(c.id)!; expect(existsSync(`public${a.path}`)).toBe(true);return `${a.path}:${a.cell}`})
  expect(new Set(locations).size).toBe(units.length)
  expect(spiritArt("not-a-card")).toBeNull()
  const bytes = Array.from({length:9},(_,i)=>statSync(`public/assets/rpg/spirit510/portraits-${i+1}.webp`).size).reduce((a,b)=>a+b,0)
  expect(bytes).toBeLessThan(5_000_000)
 })
 it("covers all four skills for every owned card with valid icons and distinct elemental kits",()=>{
  const all = newRpgSave({...game,cards:Object.fromEntries(CARDS.filter(c=>c.kind==="unit").map(c=>[c.id,1]))})
  syncRoster(all,Object.fromEntries(CARDS.filter(c=>c.kind==="unit").map(c=>[c.id,45])))
  const kits = new Set<string>()
  for(const h of all.roster){const skills=heroSkills(h);expect(skills).toHaveLength(4);for(const s of skills){expect(s.icon).toBeGreaterThanOrEqual(0);expect(s.icon).toBeLessThan(208)}kits.add(`${heroRole(h.cardId)}:${skills[2].name}`)}
  expect(kits.size).toBeGreaterThanOrEqual(17)
 })
})
describe("Spirit tactics and save compatibility",()=>{
 it("selects a living enemy and directs ordinary attacks there; refuses invalid targets",()=>{
  let s=battle(); const b=s.run!.battle, enemy=b.actors.filter(a=>a.side==="enemy")[1]
  s=reduceRpg(s,{type:"focus",uid:enemy.uid},game).save
  const a=s.run!.battle.actors[0];a.nextAttack=0
  const next=advanceRpgBattle(s.run!.battle)
  expect(next.events.find(e=>e.source===a.uid&&e.kind==="hit")!.targets).toEqual([enemy.uid])
  expect(reduceRpg(s,{type:"focus",uid:a.uid},game).error).toBeTruthy()
  expect(reduceRpg(s,{type:"focus",uid:null},game).save.run!.battle.focus).toBeNull()
  s.run!.battle.actors.find(a=>a.uid===enemy.uid)!.hp=0
  expect(advanceRpgBattle(s.run!.battle).focus).toBeNull()
 })
 it("chains different casters, caps at three, expires, and cannot reuse energy",()=>{
  let s=burst(battle(),"com-tam");s=burst(s,"banh-mi");s=burst(s,"pho-bo")
  expect(s.run!.battle.chain?.count).toBe(3)
  const uid=s.run!.battle.actors[0].uid
  expect(reduceRpg(s,{type:"burst",uid},game).error).toBeTruthy()
  s.run!.battle.tick=13;s=burst(s,"banh-cuon")
  expect(s.run!.battle.chain?.count).toBe(1)
 })
 it("consumes elemental setup and produces a real team heal; expired marks do not react",()=>{
  let s=battle();for(const a of s.run!.battle.actors.filter(a=>a.side==="ally")) a.hp=4000
  s=burst(s,"pho-bo"); const before=s.run!.battle.actors[0].hp
  s=burst(s,"banh-cuon")
  expect(s.run!.battle.events.some(e=>e.kind==="reaction"&&e.text==="Sinh trưởng")).toBe(true)
  expect(s.run!.battle.actors[0].hp).toBeGreaterThan(before)
  expect(s.run!.battle.actors.filter(a=>a.side==="enemy")[0].mark).toBeUndefined()
  s=battle();s=burst(s,"pho-bo");s.run!.battle.tick=21;s=burst(s,"banh-cuon")
  expect(s.run!.battle.events.some(e=>e.kind==="reaction")).toBe(false)
  expect(reactionName("ember","tide")).toBe("Bốc hơi")
  expect(reactionName("tide","tide")).toBeNull()
 })
 it("resolves offensive, control and ward reactions with per-recipient amounts",()=>{
  function encounter(){const s=newRpgSave({...game,cards:{...game.cards,"chef-nhien":1,"chef-lien":1}});syncRoster(s,{"chef-nhien":45,"chef-lien":45});for(const h of s.roster)h.level=10;s.formation=["com-tam","chef-nhien","banh-cuon","pho-bo","chef-lien"].map(id=>s.roster.find(h=>h.cardId===id)!.uid);const r=reduceRpg(s,{type:"start",stageId:"lantern-1"},game).save;r.run!.battle.rulesVersion=520;for(const a of r.run!.battle.actors){a.hp=a.maxHp=10000;a.energy=100}r.run!.battle.focus=r.run!.battle.actors.find(a=>a.side==="enemy")!.uid;return r}
  let s=encounter();s.run!.battle.actors.find(a=>a.side==="enemy")!.mark={school:"ember",until:20}
  const base=structuredClone(s);delete base.run!.battle.actors.find(a=>a.side==="enemy")!.mark
  const vapor=burst(s,"pho-bo").run!.battle, normal=burst(base,"pho-bo").run!.battle
  expect(vapor.actors.find(a=>a.side==="enemy")!.hp).toBeLessThan(normal.actors.find(a=>a.side==="enemy")!.hp)
  s=encounter();s.run!.battle.actors.find(a=>a.side==="enemy")!.mark={school:"grove",until:20};s=burst(s,"chef-nhien")
  expect(s.run!.battle.actors.find(a=>a.side==="enemy")!.weaken).toBe(20)
  expect(s.run!.battle.actors.find(a=>a.side==="enemy")!.burn).toBe(20)
  s=encounter();s.run!.battle.actors.find(a=>a.side==="enemy")!.mark={school:"hearth",until:20};s=burst(s,"chef-lien")
  expect(s.run!.battle.actors.filter(a=>a.side==="ally").every(a=>a.shield===1200)).toBe(true)
  const ward=s.run!.battle.events.find(e=>e.kind==="shield")!
  expect(Object.values(ward.values!)).toEqual([1200])
  s=encounter();s.run!.battle.actors[0].hp=5000;s=burst(s,"banh-cuon")
  for(const event of s.run!.battle.events.filter(e=>e.kind==="heal"))expect(Object.values(event.values!).reduce((a,b)=>a+b,0)).toBe(event.value)
 })
 it("applies both ultimate paths without spending wallet or collection resources",()=>{
  const base=battle(), assault=structuredClone(base),support=structuredClone(base)
  assault.run!.battle.actors[0].path="assault";support.run!.battle.actors[0].path="support"
  const a=burst(assault,"com-tam").run!.battle,b=burst(support,"com-tam").run!.battle
  expect(a.actors.find(x=>x.side==="enemy")!.hp).toBeLessThan(b.actors.find(x=>x.side==="enemy")!.hp)
  expect(b.actors[0].shield).toBeGreaterThan(a.actors[0].shield)
  const outside=newRpgSave(game),uid=outside.roster[0].uid
  expect(reduceRpg(outside,{type:"path",uid,path:"assault"},game).error).toBeTruthy()
  outside.roster[0].level=10
  const changed=reduceRpg(outside,{type:"path",uid,path:"support"},game).save
  expect(changed.resources).toEqual(outside.resources)
  expect(parseGame({...game,adventureRpg:changed})!.adventureRpg!.roster[0].path).toBe("support")
  expect(reduceRpg(base,{type:"path",uid:base.roster[0].uid,path:"assault"},game).error).toBeTruthy()
 })
 it("keeps ongoing 5.0 battle rules and progress when reloaded",()=>{
  const old=battle();delete old.run!.battle.rulesVersion
  const parsed=parseGame({...game,adventureRpg:old})!.adventureRpg!
  expect(parsed.run!.battle.rulesVersion).toBeUndefined()
  const next=burst(parsed,"pho-bo")
  expect(next.run!.battle.chain).toBeUndefined()
  expect(next.run!.battle.actors.every(a=>!a.mark)).toBe(true)
  expect(reduceRpg(parsed,{type:"focus",uid:null},game).error).toBeTruthy()
 })

})
