import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { CHEF_IDS, CHEF_EXPRESSIONS, characterVisual, chefPortrait } from "@/game/characterVisuals"
import { newGame } from "@/game/progression"
import { newRpgSave, reduceRpg } from "@/game/adventureRpg/engine"
import { parseGame } from "@/game/storage"
import { CARD_MAP } from "@/game/catalog"
import { tcgCharacter, tcgCaster } from "@/game/tcgCharacterMotion"
import { unitCharacter } from "@/infrastructure/assets/characterSprites"
import { STARTER_CHARACTER_IDS, starterPose } from "@/game/starterCharacters"
import { rpgContactMs } from "@/components/game/useRpgImpactFrame"

describe("five chef production", () => {
  it("keeps every identity across TCG, Auto and Adventure with six distinct lazy portraits", () => {
    const portraits=new Set<string>(),models=new Set<string>()
    for (const id of CHEF_IDS) {
      const v=characterVisual(id)!,card=CARD_MAP[id]
      expect(tcgCharacter(card)).toEqual(unitCharacter(id))
      expect(tcgCaster(card.school).id).toBe(id)
      expect(unitCharacter(id).sheet).toBe(v.sheet);models.add(v.sheet)
      expect(v.portrait.path).toBe(chefPortrait(id))
      for(const expression of CHEF_EXPRESSIONS) portraits.add(createHash("sha256").update(readFileSync(`public${chefPortrait(id,expression)}`)).digest("hex"))
      expect(starterPose(id,"attack",299,false,300)).toBe(9)
      expect(starterPose(id,"attack",300,false,300)).toBe(10)
      expect(starterPose(id,"ultimate",959)).toBe(17)
      expect(starterPose(id,"ultimate",960)).toBe(18)
    }
    expect(models.size).toBe(5);expect(portraits.size).toBe(30)
    const g=newGame(),s=newRpgSave(g)
    expect(s.formation.map(uid=>s.roster.find(h=>h.uid===uid)!.cardId)).toEqual(STARTER_CHARACTER_IDS)
  })
  for(const id of CHEF_IDS) it(`${id}: commits its real ultimate once and survives reload/double skip without extra damage or cost`, () => {
    const g=newGame();let s=newRpgSave(g)
    const h=s.roster[0];h.cardId=id
    s=reduceRpg(s,{type:"start",stageId:"lantern-1"},g).save
    const a=s.run!.battle.actors.find(a=>a.id===id)!
    a.energy=100
    s=reduceRpg(s,{type:"burst",uid:h.uid},g).save
    expect(s.run!.battle.cinematic?.source).toBe(a.uid)
    const b=s.run!.battle,e=[...b.events].reverse().find(e=>e.source===a.uid && e.animation==="ultimate")!
    expect(e).toBeDefined()
    for(const hit of b.events.filter(h=>h.source===a.uid && h.tick===e.tick && ["hit","heal","shield"].includes(h.kind))) expect(rpgContactMs(b.events,hit)).toBe(960)
    const loaded=parseGame({...g,adventureRpg:s})!.adventureRpg!
    const before=structuredClone(loaded),serial=loaded.run!.battle.cinematic!.serial
    s=reduceRpg(loaded,{type:"cinematicDone",serial},g).save
    s=reduceRpg(s,{type:"cinematicDone",serial},g).save
    expect(s.run!.battle.actors).toEqual(before.run!.battle.actors)
    expect(s.resources).toEqual(before.resources);expect(s.roster).toEqual(before.roster)
    expect(s.run!.battle.cinematic).toBeUndefined()
  })
})
