import { describe, expect, it } from "vitest"
import { CHARACTER_VISUALS } from "@/game/characterVisuals"
import { ENEMY_VISUALS } from "@/game/enemyVisuals"
import { adventureCharacterModel } from "@/game/adventureRpg/presentationModel"
import { SPRITE_SHEETS } from "@/game/autochess/presentation"

describe("Adventure presentation model", () => {
  it("keeps authored allies on 256 px HD frames instead of the 64 px pixel atlas", () => {
    for (const [id, visual] of Object.entries(CHARACTER_VISUALS)) {
      const model = adventureCharacterModel(id, "ally")
      const sheet = SPRITE_SHEETS[model.sheet]
      expect(model.sheet).toBe(visual.sheet)
      expect(model.sheet).not.toBe(visual.pixelSheet)
      expect(sheet.path).toBe(visual.atlas)
      expect(sheet.width).toBe(1024)
      expect(sheet.rows[0].frames[0][2]).toBe(256)
    }
  })

  it("keeps authored enemies on 256 px HD frames too", () => {
    for (const [id, visual] of Object.entries(ENEMY_VISUALS)) {
      const model = adventureCharacterModel(id, "enemy")
      const sheet = SPRITE_SHEETS[model.sheet]
      expect(model.sheet).toBe(visual.sheet)
      expect(model.sheet).not.toBe(visual.pixelSheet)
      expect(sheet.path).toBe(visual.atlas)
      expect(sheet.width).toBe(1024)
      expect(sheet.rows[0].frames[0][2]).toBe(256)
    }
  })
})
