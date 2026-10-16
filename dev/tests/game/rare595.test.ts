import { describe, expect, it } from "vitest"
import { RARE_IDS, RARE_ASSET_ROOT, RARE_SECOND_IDS, RARE_SECOND_ASSET_ROOT, characterVisual } from "@/game/characterVisuals"
import { unitCharacter, spiritCharacter } from "@/infrastructure/assets/characterSprites"
import { tcgCharacter } from "@/game/tcgCharacterMotion"
import { spiritArt } from "@/game/adventureRpg/spiritArt"
import { CARD_MAP } from "@/game/catalog"
import { newGame } from "@/game/progression"
import { newRpgSave, reduceRpg } from "@/game/adventureRpg/engine"
import { parseGame } from "@/game/storage"
import { rpgContactMs } from "@/components/game/useRpgImpactFrame"

describe.each([
  {ids:RARE_IDS,root:RARE_ASSET_ROOT},
  {ids:RARE_SECOND_IDS,root:RARE_SECOND_ASSET_ROOT},
])("rare spirit production: $root", ({ids,root}) => {
  it("keeps catalog identity and dedicated presentation across modes without aliasing another spirit", () => {
    const models=new Set(),portraits=new Set(),signatures=new Set()
    for(const id of ids) {
      const v=characterVisual(id)!
      expect(tcgCharacter(CARD_MAP[id])).toEqual(unitCharacter(id))
      expect(spiritCharacter(id)?.sheet).toBe(v.sheet)
      expect(spiritArt(id)).toEqual(v.portrait)
      expect(v.portrait).toEqual({path:`${root}/${id}-portrait.webp`,cell:0,columns:1})
      models.add(v.sheet);portraits.add(v.portrait.path);signatures.add(v.signature)
    }
    expect(models.size).toBe(4);expect(portraits.size).toBe(4);expect(signatures.size).toBe(4)
    expect(characterVisual("banh-chung")!.signature).not.toBe(characterVisual("com-tam")!.signature)
    expect(characterVisual("bun-thang")!.signature).not.toBe(characterVisual("banh-com-hang-than")!.signature)
    expect(characterVisual("thit-kho-trung")!.signature).not.toBe(characterVisual("banh-chung")!.signature)
  })
  for(const id of ids) it(`${id}: preserves the committed skill through reload and double skip`, () => {
    const g=newGame();let s=newRpgSave(g)
    const hero=s.roster[0];hero.cardId=id
    s=reduceRpg(s,{type:"start",stageId:"lantern-1"},g).save
    for(const a of s.run!.battle.actors)if(a.side==="enemy")a.hp=a.maxHp=50000
    const actor=s.run!.battle.actors.find(a=>a.id===id)!
    actor.energy=100
    s=reduceRpg(s,{type:"burst",uid:hero.uid},g).save
    const b=s.run!.battle,event=[...b.events].reverse().find(e=>e.source===actor.uid&&e.animation==="ultimate")!
    expect(b.cinematic?.source).toBe(actor.uid);expect(event).toBeDefined()
    const impacts=b.events.filter(e=>e.source===actor.uid&&e.tick===event.tick&&["hit","heal","shield"].includes(e.kind))
    expect(impacts.length).toBeGreaterThan(0)
    for(const hit of impacts)expect(rpgContactMs(b.events,hit)).toBe(960)
    const loaded=parseGame({...g,adventureRpg:s})!.adventureRpg!,before=structuredClone(loaded),serial=loaded.run!.battle.cinematic!.serial
    s=reduceRpg(loaded,{type:"cinematicDone",serial},g).save
    s=reduceRpg(s,{type:"cinematicDone",serial},g).save
    expect(s.run!.battle.actors).toEqual(before.run!.battle.actors)
    expect(s.resources).toEqual(before.resources);expect(s.roster).toEqual(before.roster)
    expect(s.run!.battle.cinematic).toBeUndefined()
  })
})
