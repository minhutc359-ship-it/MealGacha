import { describe, expect, it } from "vitest"
import { projectilePoint, skillVfx, TCG_IMPACT_MS } from "@/game/battleVfx"
import { actBattle, startBattle } from "@/game/battle"
import { STARTER_DECK } from "@/game/catalog"
import { frameSounds } from "@/game/audioScore"
import { tcgUnitMotion } from "@/game/tcgCharacterMotion"
import { frameDuration } from "@/game/combatDirection"

describe("combat presentation timing", () => {
  it("lands exactly on the authoritative target, including same-cell and reversed shots", () => {
    for (const [from, to] of [[{ x: 20, y: 240 }, { x: 280, y: 50 }], [{ x: 280, y: 50 }, { x: 20, y: 240 }], [{ x: 7, y: 7 }, { x: 7, y: 7 }]]) {
      expect(projectilePoint(from, to, -1, 18)).toEqual(from)
      const landing = projectilePoint(from, to, 2, 18)
      expect(landing.x).toBeCloseTo(to.x); expect(landing.y).toBeCloseTo(to.y)
      for (let i = 0; i <= 30; i++) {
        const p = projectilePoint(from, to, i / 30, 18)
        expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true)
      }
    }
  })
  it("distinguishes support from damage, melee from ranged, and channelled area spells", () => {
    expect(skillVfx("heal", 3)).toBe("heal")
    expect(skillVfx("shell", 1)).toBe("shield")
    expect(skillVfx("cleave", 1)).toBe("slash")
    expect(skillVfx("frost", 3)).toBe("wave")
    expect(skillVfx("summon", 3)).toBe("summon")
    expect(skillVfx("bolt", 3)).toBe("projectile")
  })
  it("aligns spell damage sound and casualty pose after the windup without rewriting either snapshot", () => {
    const battle = startBattle(STARTER_DECK, null, "courage", () => .37)
    battle.player.hand = ["spark"]; battle.player.mana = 7
    battle.enemy.board = [{ uid: "target", cardId: "banh-mi", health: 1, maxHealth: 1, attack: 1, ready: true, shield: 0, keywords: [] }]
    const frame = actBattle(battle, { type: "play", index: 0, target: "target" }).frames[0]
    const unchanged = JSON.stringify(frame)
    expect(frameSounds(frame).find(s => s.cue === "cast")?.delay).toBe(0)
    expect(frameSounds(frame).find(s => s.cue === "fire")?.delay).toBe(TCG_IMPACT_MS)
    expect(tcgUnitMotion(frame, "target", "enemy").delay).toBe(TCG_IMPACT_MS)
    expect(frameDuration(frame)).toBeGreaterThanOrEqual(TCG_IMPACT_MS + 700)
    expect(JSON.stringify(frame)).toBe(unchanged)
  })
})
