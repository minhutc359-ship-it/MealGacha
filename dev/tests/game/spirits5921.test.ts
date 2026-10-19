import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"
import { VIET_FEAST_IDS, PRIORITY_SPIRIT_IDS, characterVisual, VISUAL_CONTACT } from "@/game/characterVisuals"
import { SPIRIT_IDS, spiritArt } from "@/game/adventureRpg/spiritArt"
import { CARD_MAP } from "@/game/catalog"
import { tcgCharacter } from "@/game/tcgCharacterMotion"
import { spiritCharacter } from "@/infrastructure/assets/characterSprites"
import { characterEffect, drawCharacterEffect } from "@/game/characterEffect"
import { starterPose } from "@/game/starterCharacters"

describe("Vietnamese feast models and painted spirit VFX 5.9.21", () => {
  it("resolves new battle models and immutable portraits by the existing gameplay ID", () => {
    for (const id of VIET_FEAST_IDS) {
      const visual = characterVisual(id)!, cell = SPIRIT_IDS.indexOf(id)
      expect(tcgCharacter(CARD_MAP[id])!.sheet).toBe(visual.sheet)
      expect(spiritCharacter(id)?.sheet).toBe(visual.sheet)
      expect(spiritArt(id)).toEqual({ path:`/assets/rpg/spirit510/portraits-${Math.floor(cell/16)+1}.webp`,cell:cell%16,columns:4 })
      expect(visual.contact).toEqual(VISUAL_CONTACT)
      for (const path of [visual.atlas,visual.pixel,visual.sound,visual.effect!.path]) expect(existsSync(`public${path}`)).toBe(true)
      expect(starterPose(id,"attack",VISUAL_CONTACT.attack-1,false,VISUAL_CONTACT.attack)).toBe(9)
      expect(starterPose(id,"attack",VISUAL_CONTACT.attack,false,VISUAL_CONTACT.attack)).toBe(10)
      expect(starterPose(id,"ultimate",VISUAL_CONTACT.ultimate-1)).toBe(17)
      expect(starterPose(id,"ultimate",VISUAL_CONTACT.ultimate)).toBe(18)
      expect(starterPose(id,"fall",10000)).toBe(27)
    }
  })

  it("selects eight distinct painted signatures, with a stable reduced-motion phase", () => {
    const keys = new Set<string>()
    for (const ids of [VIET_FEAST_IDS,PRIORITY_SPIRIT_IDS]) {
      for (const [column,id] of ids.entries()) {
        const effect = characterEffect(id)!
        keys.add(`${effect.path}:${effect.column}`)
        expect(effect.column).toBe(column)
        const calls: unknown[][] = []
        const ctx = new Proxy({}, {get:(_t,key)=>(...args:unknown[])=>calls.push([key,...args]),set:()=>true}) as CanvasRenderingContext2D
        const image = {complete:true,naturalWidth:1024,naturalHeight:768} as HTMLImageElement
        expect(drawCharacterEffect(ctx,id,image,100,100,40,.3,true)).toBe(true)
        const draws = calls.filter(c=>c[0]==="drawImage")
        expect(draws).toHaveLength(1)
        expect(draws[0].slice(2,6)).toEqual([column*256+2,258,252,252])
        expect(drawCharacterEffect(ctx,id,undefined,100,100,40,.3)).toBe(false)
        expect(drawCharacterEffect(ctx,id,image,100,100,40,1)).toBe(false)
      }
    }
    expect(keys.size).toBe(8)
  })
})
