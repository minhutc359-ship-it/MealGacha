import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { characterEffect, drawCharacterEffect } from "@/game/characterEffect"

function image(width = 1280, height = 768) {
  return { complete: true, naturalWidth: width, naturalHeight: height } as HTMLImageElement
}

describe("authored character VFX priority 5.9.17", () => {
  it("uses Bách's authored effect column and leaves missing art to the school fallback", () => {
    expect(characterEffect("chef-bach")).toEqual({
      path: "/assets/characters/chefs593/ultimate.webp",
      column: 0,
    })
    expect(characterEffect("lau-rieu-cua")).toBeNull()
  })

  it("draws one bounded atlas cell instead of procedural full-field geometry", () => {
    const calls: unknown[][] = []
    const ctx = new Proxy({}, {
      get: (_target, key) => (...args: unknown[]) => calls.push([key, ...args]),
      set: () => true,
    }) as CanvasRenderingContext2D
    expect(drawCharacterEffect(ctx,"chef-bach",image(),100,80,42,.5)).toBe(true)
    const draw = calls.find(call=>call[0] === "drawImage")!
    expect(draw.slice(2,6)).toEqual([2,258,252,252])
    expect(draw.at(-2)).toBeLessThanOrEqual(84)
    expect(draw.at(-1)).toBeLessThanOrEqual(84)
    expect(drawCharacterEffect(ctx,"lau-rieu-cua",image(),100,80,42,.5)).toBe(false)
  })

  it("keeps model motion primary in Adventure and uses school VFX as fallback", () => {
    const source = readFileSync("src/components/game/RpgBattleVfx.tsx","utf8")
    const css = readFileSync("src/game/adventureRpg/rpg.css","utf8")
    expect(source).not.toContain("drawUltimateArt")
    expect(source).toContain("drawCharacterEffect(ctx,c.actor.id")
    expect(source).toContain('surface.dataset.ultimate=custom?"character-asset":"school-fallback"')
    expect(source.indexOf("drawModelCast(ctx")).toBeLessThan(source.indexOf("drawCharacterEffect(ctx,c.actor.id"))
    expect(css).toContain(".rpg-shield-bubble{position:absolute;inset:14% 3% 2%;z-index:1")
    expect(css).toContain(".rpg-actor-body{position:relative;z-index:2}")
  })

  it("keeps the elemental impact under optional TCG character art", () => {
    const source = readFileSync("src/components/game/BattleVfxCanvas.tsx","utf8")
    expect(source.indexOf("drawImpact(ctx,point")).toBeLessThan(source.indexOf("drawStarterVfx(ctx,sourceId"))
  })
})
