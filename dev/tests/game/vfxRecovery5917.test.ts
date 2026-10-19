import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { drawImpact, drawProjectile } from "@/game/battleVfx"
import { drawCombatArt } from "@/game/combatArt"

function recordingContext() {
  const calls: string[] = []
  const context = new Proxy({}, {
    get:
      (_target, key) =>
      (..._args: unknown[]) =>
        calls.push(String(key)),
    set: () => true,
  }) as CanvasRenderingContext2D
  return { calls, context }
}

describe("combat VFX recovery 5.9.17", () => {
  it("keeps a light projectile trail and elemental impact for reduced motion", () => {
    const projectile = recordingContext()
    drawProjectile(
      projectile.context,
      { x: 10, y: 20 },
      { x: 120, y: 70 },
      "ember",
      0.7,
      24,
      true,
      "projectile",
    )
    expect(projectile.calls).toContain("stroke")
    expect(projectile.calls).toContain("fill")

    const impact = recordingContext()
    drawImpact(
      impact.context,
      { x: 120, y: 70 },
      "ember",
      0.2,
      32,
      "projectile",
      true,
    )
    expect(impact.calls).toContain("stroke")
    expect(impact.calls).toContain("fill")
    expect(impact.calls).not.toContain("drawImage")
  })

  it("maps attacks to the painted five-school atlas", () => {
    let calls: unknown[][] = []
    const context = new Proxy({}, {
      get: (_target, key) => (...args: unknown[]) => calls.push([key, ...args]),
      set: () => true,
    }) as CanvasRenderingContext2D
    const image = { complete: true, naturalWidth: 400, naturalHeight: 500 } as HTMLImageElement

    for(const [row,school] of (["hearth","ember","grove","tide","sugar"] as const).entries()) {
      for(const [column,kind] of (["slash","projectile","impact","cast"] as const).entries()) {
        calls=[]
        expect(drawCombatArt(context,image,school,kind,50,60,20,.5,school)).toBe(true)
        expect(calls.find(call=>call[0] === "drawImage")?.slice(2,6)).toEqual([column*100+2,row*100+2,96,96])
      }
    }
    expect(drawCombatArt(context,{ complete: false, naturalWidth: 0 } as HTMLImageElement,"ember","slash",0,0,20,.5,"banh-mi")).toBe(false)
  })

  it("keeps painted Auto Chess VFX primary and geometry as a broken-asset fallback", () => {
    const source = readFileSync(
      "src/components/autochess/AutoBoard.tsx",
      "utf8",
    )
    expect(source).not.toContain("if (opts.reducedMotion) continue")
    expect(source).not.toMatch(
      /!starter\s*&&\s*!opts\.reducedMotion\s*&&\s*age/,
    )
    expect(source).toContain(
      "const essentialLow = opts.lowQuality || opts.reducedMotion",
    )
    expect(source).toContain('const combatTexture = leased("combat583", COMBAT_ART)')
    expect(source).toContain('const impactTexture = leased("elemental-impacts", ELEMENTAL_IMPACTS)')
    expect(source).toContain('if(!drawn && combatTextureStatus === "fallback") drawProjectile')
    expect(source).toContain('if(impactTextureStatus !== "loading") drawImpact')
    expect(source).not.toContain("texturedImpacts")
    expect(source).not.toContain("if (!starter && kind")
    expect(source).toContain("starter && skillCast && !authoredCast && combatTextureStatus")
  })

  it("keeps normal Adventure cues and paints the common impact below signatures", () => {
    const source = readFileSync("src/components/game/RpgBattleVfx.tsx", "utf8")
    expect(source).not.toMatch(/quiet\s*&&\s*!\["burst","boss"\]/)
    const targetLoop = source.slice(
      source.lastIndexOf("for(const target of c.targets"),
    )
    expect(targetLoop.indexOf("drawImpact(ctx,p")).toBeGreaterThan(-1)
    expect(targetLoop.indexOf("drawImpact(ctx,p")).toBeLessThan(
      targetLoop.indexOf("drawStarterVfx(ctx,c.actor.id"),
    )
    expect(targetLoop.indexOf("drawImpact(ctx,p")).toBeLessThan(
      targetLoop.indexOf("drawEnemyVfx(ctx,c.actor.id"),
    )
  })
})
