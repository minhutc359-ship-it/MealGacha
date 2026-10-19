import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"
import {
  PRIORITY_SPIRIT_ASSET_ROOT,
  PRIORITY_SPIRIT_IDS,
  characterVisual,
} from "@/game/characterVisuals"
import { CARD_MAP } from "@/game/catalog"
import { SPIRIT_IDS, spiritArt } from "@/game/adventureRpg/spiritArt"
import { tcgCharacter } from "@/game/tcgCharacterMotion"
import { spiritCharacter, unitCharacter } from "@/infrastructure/assets/characterSprites"

describe("priority spirit models 5.9.17", () => {
  it("uses four identity-preserving 32-pose models in every combat resolver", () => {
    const sheets = new Set<string>()
    for (const id of PRIORITY_SPIRIT_IDS) {
      const visual = characterVisual(id)!
      const cell = SPIRIT_IDS.indexOf(id)
      expect(visual.atlas).toBe(`${PRIORITY_SPIRIT_ASSET_ROOT}/${id}.webp`)
      expect(visual.pixel).toBe(`${PRIORITY_SPIRIT_ASSET_ROOT}/${id}-pixel.webp`)
      expect(existsSync(`public${visual.atlas}`)).toBe(true)
      expect(existsSync(`public${visual.pixel}`)).toBe(true)
      expect(visual.portrait).toEqual({
        path: `/assets/rpg/spirit510/portraits-${Math.floor(cell / 16) + 1}.webp`,
        cell: cell % 16,
        columns: 4,
      })
      expect(spiritArt(id)).toEqual(visual.portrait)
      expect(spiritCharacter(id)?.sheet).toBe(visual.sheet)
      expect(tcgCharacter(CARD_MAP[id])).toEqual(unitCharacter(id))
      sheets.add(visual.sheet)
    }
    expect(sheets.size).toBe(PRIORITY_SPIRIT_IDS.length)
  })

  it("defers signature VFX and leaves elemental combat VFX as the fallback", () => {
    for (const id of PRIORITY_SPIRIT_IDS) {
      const visual = characterVisual(id)!
      expect(visual.effect).toBeNull()
      expect(visual.signature).toBe("none")
    }
  })
})
