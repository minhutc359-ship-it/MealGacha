import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"
import { NORTHWEST_SPIRIT_IDS, NORTHWEST_SPIRIT_ASSET_ROOT, characterVisual } from "@/game/characterVisuals"
import { SPIRIT_IDS, spiritArt } from "@/game/adventureRpg/spiritArt"
import { CARD_MAP } from "@/game/catalog"
import { tcgCharacter } from "@/game/tcgCharacterMotion"
import { spiritCharacter } from "@/infrastructure/assets/characterSprites"
import { drawCharacterEffect } from "@/game/characterEffect"
import { starterPose } from "@/game/starterCharacters"

describe("Northwest spirit models 5.9.22", () => {
  it("replaces all six immutable portrait cells with distinct battle models, keeping the portrait identity", () => {
    const models = new Set<string>()
    for (const [column,id] of NORTHWEST_SPIRIT_IDS.entries()) {
      const visual = characterVisual(id)!, cell = SPIRIT_IDS.indexOf(id)
      models.add(visual.sheet)
      expect(cell).toBe(106+column)
      expect(spiritArt(id)).toEqual({path:"/assets/rpg/spirit510/portraits-7.webp",cell:10+column,columns:4})
      expect(tcgCharacter(CARD_MAP[id])?.sheet).toBe(visual.sheet)
      expect(spiritCharacter(id)?.sheet).toBe(visual.sheet)
      for (const path of [visual.atlas,visual.pixel,visual.sound,visual.effect!.path]) expect(existsSync(`public${path}`)).toBe(true)
      expect(visual.effect).toEqual({path:`${NORTHWEST_SPIRIT_ASSET_ROOT}/ultimate.webp`,column})
      expect(starterPose(id,"cast",379,false,380)).toBe(13)
      expect(starterPose(id,"cast",380,false,380)).toBe(14)
      expect(starterPose(id,"ultimate",960)).toBe(18)
      expect(starterPose(id,"fall",3000)).toBe(27)
    }
    expect(models.size).toBe(6)
  })

  it("draws all six painted columns without crossing cells, including reduced motion and unloaded fallbacks", () => {
    for (const [column,id] of NORTHWEST_SPIRIT_IDS.entries()) {
      const calls: unknown[][] = []
      const ctx = new Proxy({}, {get:(_t,key)=>(...args:unknown[])=>calls.push([key,...args]),set:()=>true}) as CanvasRenderingContext2D
      const image = {complete:true,naturalWidth:1536,naturalHeight:768} as HTMLImageElement
      expect(drawCharacterEffect(ctx,id,image,70,90,36,.5,true)).toBe(true)
      expect(calls.filter(c=>c[0]==="drawImage").map(c=>c.slice(2,6))).toEqual([[column*256+2,258,252,252]])
      expect(drawCharacterEffect(ctx,id,undefined,70,90,36,.5)).toBe(false)
      expect(drawCharacterEffect(ctx,id,image,70,90,36,1)).toBe(false)
    }
  })
})
