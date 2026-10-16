import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"
import { CHARACTER_VISUALS, characterVisual, VISUAL_CONTACT } from "@/game/characterVisuals"
import { STARTER_CHARACTER_IDS, STARTER_STATES, starterPose } from "@/game/starterCharacters"
import { SPRITE_SHEETS } from "@/game/autochess/presentation"
import { unitCharacter, spiritCharacter } from "@/infrastructure/assets/characterSprites"
import { spiritArt } from "@/game/adventureRpg/spiritArt"
import { tcgCharacter } from "@/game/tcgCharacterMotion"
import { CARD_MAP } from "@/game/catalog"
import { newGame } from "@/game/progression"
import { newRpgSave, reduceRpg } from "@/game/adventureRpg/engine"
import { parseGame } from "@/game/storage"
import { rpgContactMs } from "@/components/game/useRpgImpactFrame"
import { TCG_IMPACT_MS } from "@/game/battleVfx"
import { drawStarterVfx, type CharacterVfxKind } from "@/game/starterVfx"
import type { RpgEvent } from "@/game/adventureRpg/types"

function geometry(id: string, kind: CharacterVfxKind, ms = 250, ultimate = false) {
  const commands: unknown[] = []
  const context = new Proxy({}, {get: (_, key) => (...args: number[]) => commands.push([key,...args]), set: () => true}) as CanvasRenderingContext2D
  drawStarterVfx(context,id,10,20,30,ms,ultimate,false,kind)
  return commands
}
describe("visual production manifest 5.9.1", () => {
  it("keeps the five saved starter IDs and adds Xôi only to visual production", () => {
    const g=newGame(),s=newRpgSave(g)
    expect(s.formation.map(uid=>s.roster.find(h=>h.uid===uid)!.cardId)).toEqual(STARTER_CHARACTER_IDS)
    expect(Object.keys(CHARACTER_VISUALS)).toHaveLength(15)
    expect(characterVisual("goi-cuon")).toBe(characterVisual("goi-cuon-tom-thit"))
    expect(characterVisual("xoi")!.species).toBe("Gấu Nếp Mới")
    expect(characterVisual("classic-burger")).toBeUndefined()
    expect(characterVisual("__proto__")).toBeUndefined()
  })
  it("resolves fifteen full HD/pixel atlases and portraits without sharing another identity", () => {
    const models = new Set<string>(), effects = new Set<string>()
    for (const [id,v] of Object.entries(CHARACTER_VISUALS)) {
      const m=tcgCharacter(CARD_MAP[id])!
      expect(spiritCharacter(id)?.sheet).toBe(v.sheet)
      expect(m).toEqual(unitCharacter(id));expect(m.sheet).toBe(v.sheet)
      models.add(`${m.sheet}:${m.row}`);effects.add(`${v.effect.path}:${v.effect.column}`)
      expect(existsSync(`public${v.effect.path}`)).toBe(true)
      for(const sheet of [v.sheet,v.pixelSheet]) {
        const data=SPRITE_SHEETS[sheet]
        expect(existsSync(`public${data.path}`)).toBe(true)
        expect(data.rows[0].frames).toHaveLength(32)
      }
      expect(spiritArt(id)).toEqual(v.portrait)
      expect(existsSync(`public${v.portrait.path}`)).toBe(true)
      expect(existsSync(`public${v.sound}`)).toBe(true)
      expect(existsSync(`public/assets/rpg/awakening530/movies/${id}.mp4`)).toBe(false)
      expect(v.anchors.foot).toEqual([.5,.9375])
      for(const n of v.anchors.cast) expect(n).toBeGreaterThan(0)
      expect(v.timeline.impact).toBe(v.contact.ultimate)
      for(const state of [...STARTER_STATES,"summon","guard","stun"])for(let age=0;age<3000;age+=71){
        const pose=starterPose(id,state,age)
        expect(pose).toBeGreaterThanOrEqual(0);expect(pose).toBeLessThan(32)
      }
      expect(starterPose(id,"attack",v.contact.attack-1,false,v.contact.attack)).toBe(9)
      expect(starterPose(id,"attack",v.contact.attack,false,v.contact.attack)).toBe(10)
      expect(starterPose(id,"cast",v.contact.cast,false,v.contact.cast)).toBe(14)
      expect(starterPose(id,"fall",3000,true)).toBe(27)
    }
    expect(effects.size).toBe(15)
    expect(models.size).toBe(15);expect(TCG_IMPACT_MS).toBe(VISUAL_CONTACT.tcg)
  })
  it("binds presentation deltas to their own source/tick, including multi-hit ultimates", () => {
    const events=[
      {serial:1,tick:2,source:"bear",animation:"ultimate"},
      {serial:2,tick:2,source:"fox",animation:"attack"},
      {serial:3,tick:2,source:"bear",kind:"hit"},
      {serial:4,tick:2,source:"fox",kind:"hit"},
      {serial:5,tick:3,source:"bear",animation:"support"},
      {serial:6,tick:3,source:"bear",kind:"shield"},
    ] as RpgEvent[]
    expect(rpgContactMs(events,events[2])).toBe(960)
    expect(rpgContactMs(events,events[3])).toBe(300)
    expect(rpgContactMs(events,events[5])).toBe(380)
  })
  it("has different attack, support and ultimate silhouettes and bounded cleanup", () => {
    const skills=[]
    for(const id of Object.keys(CHARACTER_VISUALS)) {
      const attack=geometry(id,"attack"),skill=geometry(id,"skill"),support=geometry(id,"shield")
      expect(attack).not.toEqual(skill);expect(support).not.toEqual(skill)
      expect(attack.length).toBeLessThan(80);expect(support.length).toBeLessThan(80)
      expect(geometry(id,"skill",650)).toEqual([])
      expect(geometry(id,"skill",2400,true)).toEqual([])
      expect(geometry(id,"skill",0,true)).toEqual([])
      skills.push(JSON.stringify(skill))
    }
    expect(new Set(skills).size).toBe(15)
  })
  it("reloads Xôi's committed cast without changing collection, damage or rewards on double skip", () => {
    const g=newGame();let s=newRpgSave(g)
    // Add an existing owned hero through the same persistent record schema, not a new gameplay ID.
    const hero={...s.roster[0],uid:"qa-xoi",cardId:"xoi"};s.roster.push(hero);s.formation[0]=hero.uid
    s=reduceRpg(s,{type:"start",stageId:"lantern-1"},g).save
    s.run!.battle.actors.find(a=>a.id==="xoi")!.energy=100
    s=reduceRpg(s,{type:"burst",uid:hero.uid},g).save
    const loaded=parseGame({...g,adventureRpg:s})!.adventureRpg!
    const before=structuredClone(loaded.run!.battle.actors),resources=structuredClone(loaded.resources),roster=structuredClone(loaded.roster),serial=loaded.run!.battle.cinematic!.serial
    s=reduceRpg(loaded,{type:"cinematicDone",serial},g).save
    s=reduceRpg(s,{type:"cinematicDone",serial},g).save
    expect(s.run!.battle.actors).toEqual(before);expect(s.resources).toEqual(resources);expect(s.roster).toEqual(roster)
  })
})
