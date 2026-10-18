import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { drawImpact, drawProjectile } from "@/game/battleVfx"

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

  it("does not let signature or reduced-motion branches bypass shared Auto Chess VFX", () => {
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
    expect(source.indexOf("drawProjectile(ctx,from,to")).toBeLessThan(
      source.indexOf("drawStarterVfx(ctx,u.id,from.x"),
    )
    expect(source.indexOf("drawImpact(ctx,{x,y:y+cell*.18}")).toBeLessThan(
      source.indexOf("drawStarterVfx(ctx,sourceActor!.id"),
    )
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
