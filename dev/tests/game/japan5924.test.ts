import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"
import { JAPAN_SPIRIT_IDS, JAPAN_SPIRIT_ASSET_ROOT, characterVisual } from "@/game/characterVisuals"
import { SPIRIT_IDS, spiritArt } from "@/game/adventureRpg/spiritArt"
import { CARD_MAP } from "@/game/catalog"
import { tcgCharacter } from "@/game/tcgCharacterMotion"
import { characterEffect, drawCharacterEffect } from "@/game/characterEffect"
import { spiritCharacter } from "@/infrastructure/assets/characterSprites"
import { starterPose } from "@/game/starterCharacters"

describe("Japanese spirit models 5.9.24", () => {
  it("replaces six portrait-only spirits with distinct 32-pose models in every mode", () => {
    const cells = [33,34,35,53,70,71]
    const models = new Set<string>()
    for (const [index,id] of JAPAN_SPIRIT_IDS.entries()) {
      const visual = characterVisual(id)!
      const cell = SPIRIT_IDS.indexOf(id)
      expect(cell).toBe(cells[index])
      expect(spiritArt(id)).toEqual({path:`/assets/rpg/spirit510/portraits-${Math.floor(cell/16)+1}.webp`,cell:cell%16,columns:4})
      expect(tcgCharacter(CARD_MAP[id])?.sheet).toBe(visual.sheet)
      expect(spiritCharacter(id)?.sheet).toBe(visual.sheet)
      expect(visual.atlas).toBe(`${JAPAN_SPIRIT_ASSET_ROOT}/${id}.webp`)
      for (const path of [visual.atlas,visual.pixel,visual.sound]) expect(existsSync(`public${path}`)).toBe(true)
      models.add(visual.sheet)
      expect(starterPose(id,"attack",300,false,300)).toBe(10)
      expect(starterPose(id,"cast",380,false,380)).toBe(14)
      expect(starterPose(id,"ultimate",960)).toBe(18)
      expect(starterPose(id,"fall",3000)).toBe(27)
    }
    expect(models.size).toBe(6)
  })

  it("defers custom VFX cleanly so the compositors use their painted school atlas", () => {
    for (const id of JAPAN_SPIRIT_IDS) {
      expect(characterVisual(id)!.signature).toBe("none")
      expect(characterEffect(id)).toBeNull()
      const ctx = new Proxy({}, {get:()=>()=>undefined,set:()=>true}) as CanvasRenderingContext2D
      expect(drawCharacterEffect(ctx,id,undefined,70,90,36,.5)).toBe(false)
    }
  })
})
