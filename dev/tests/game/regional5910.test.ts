import { describe, it, expect } from "vitest"
import { REGIONAL_IDS, characterVisual } from "@/game/characterVisuals"
import { drawStarterVfx, type CharacterVfxKind } from "@/game/starterVfx"
import { starterPose } from "@/game/starterCharacters"
import { actorPose } from "@/game/autochess/actorPresentation"
import { unitCharacter } from "@/infrastructure/assets/characterSprites"
import type { Actor } from "@/game/autochess/types"

function geometry(
  id: string,
  age: number,
  kind: CharacterVfxKind,
  ultimate = false,
) {
  const commands: unknown[] = []
  const ctx = new Proxy({}, {
    get:
      (_, key) =>
      (...values: unknown[]) =>
        commands.push([key, ...values]),
    set: () => true,
  }) as CanvasRenderingContext2D
  drawStarterVfx(ctx, id, 0, 0, 40, age, ultimate, true, kind)
  return commands
}
describe("regional spirit presentation 5.9.10", () => {
  it("draws four distinct bounded motifs without unused texture dependencies", () => {
    expect(
      new Set(
        REGIONAL_IDS.map((id) => JSON.stringify(geometry(id, 200, "skill"))),
      ).size,
    ).toBe(4)
    for (const id of REGIONAL_IDS) {
      expect(characterVisual(id)!.effect).toBeNull()
      expect(geometry(id, -1, "skill")).toEqual([])
      expect(geometry(id, 650, "skill")).toEqual([])
      expect(geometry(id, 2400, "skill", true)).toEqual([])
      const skill = geometry(id, 200, "skill")
      expect(skill.length).toBeLessThan(75)
      expect(geometry(id, 200, "attack").length).toBeLessThan(skill.length)
      expect(geometry(id, 200, "heal")).not.toEqual(skill)
      expect(geometry(id, 1100, "skill", true).length).toBeGreaterThan(10)
    }
  })
  it("keeps authored contact frames aligned with accelerated Auto and TCG actions", () => {
    for (const id of REGIONAL_IDS) {
      const model = unitCharacter(id)
      const actor = {
        id,
        hp: 100,
        action: { kind: "attack", start: 10, hit: 14, end: 20 },
      } as Actor
      expect(actorPose(actor, model.sheet, 13.9, null, false, false)).toBe(9)
      expect(actorPose(actor, model.sheet, 14, null, false, false)).toBe(10)
      actor.action!.hit = 12
      expect(actorPose(actor, model.sheet, 12, null, false, false)).toBe(10)
      expect(starterPose(id, "attack", 559, false, 560)).toBe(9)
      expect(starterPose(id, "attack", 560, false, 560)).toBe(10)
      expect(starterPose(id, "ultimate", 960)).toBe(18)
      expect(starterPose(id, "ultimate", 1200, true)).toBe(16)
    }
  })
})
