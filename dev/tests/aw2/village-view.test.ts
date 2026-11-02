import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import scene from "@/aw2/assets/covenant-village.environment-v2.json"
import old from "@/aw2/assets/covenant-village.environment-v1.json"
import {
  villageCamera,
  projectVillage,
  unprojectVillage,
  villageWorldBounds,
  villageFoliage,
} from "@/aw2/assets/villageView"
import { newWorldProgress } from "@/aw2/world/model"

describe("006I camera and authored layers preserve world authority", () => {
  it.each(["follow", "overview"] as const)(
    "round-trips every gameplay corner and target in %s",
    (mode) => {
      for (const p of [
        { x: 16, y: 16 },
        { x: 624, y: 368 },
        { x: 160, y: 240 },
        { x: 160, y: 144 },
        { x: 616, y: 192 },
      ]) {
        const c = villageCamera(p, mode),
          projected = projectVillage(p, c),
          actual = unprojectVillage(projected, c)
        expect(actual.x).toBeCloseTo(p.x, 10)
        expect(actual.y).toBeCloseTo(p.y, 10)
        expect(c.x - c.width / c.zoom / 2).toBeGreaterThanOrEqual(
          scene.landscape.x,
        )
        expect(c.x + c.width / c.zoom / 2).toBeLessThanOrEqual(
          scene.landscape.x + scene.landscape.width,
        )
        expect(c.y - c.height / c.zoom / 2).toBeGreaterThanOrEqual(
          scene.landscape.y,
        )
        expect(c.y + c.height / c.zoom / 2).toBeLessThanOrEqual(
          scene.landscape.y + scene.landscape.height,
        )
      }
    },
  )
  it("clamps outlying presentation positions without changing the caller", () => {
    const p = { ...newWorldProgress(), x: -99999, y: 99999 },
      before = JSON.stringify(p)
    const c = villageCamera(p, "follow")
    expect(c.x - c.width / c.zoom / 2).toBe(scene.landscape.x)
    expect(c.y + c.height / c.zoom / 2).toBe(
      scene.landscape.y + scene.landscape.height,
    )
    expect(JSON.stringify(p)).toBe(before)
  })
  it("overview reveals the scenic apron without moving the world or mutating manifest", () => {
    const world = newWorldProgress(),
      before = JSON.stringify({ world, scene })
    const c = villageCamera(world, "overview")
    expect(c.zoom).toBeLessThan(villageCamera(world, "follow").zoom)
    expect(c.width / c.zoom).toBeGreaterThan(1500)
    expect(JSON.stringify({ world, scene })).toBe(before)
  })
  it("converts global actor bounds back before world-space occlusion", () => {
    const c = villageCamera({ x: 320, y: 292 }, "follow"),
      a = { x: 310, y: 250, width: 20, height: 48 }
    const actual = villageWorldBounds(
      {
        ...projectVillage(a, c),
        width: a.width * c.zoom,
        height: a.height * c.zoom,
      },
      c,
    )
    for (const key of ["x", "y", "width", "height"] as const)
      expect(actual[key]).toBeCloseTo(a[key], 10)
  })
  it.each([NaN, Infinity, -Infinity])(
    "rejects nonfinite inputs %s",
    (value) => {
      const c = villageCamera({ x: 96, y: 192 }, "follow")
      expect(() => villageCamera({ x: value, y: 0 }, "follow")).toThrow()
      expect(() => projectVillage({ x: 0, y: value }, c)).toThrow()
      expect(() =>
        unprojectVillage({ x: 0, y: 0 }, { ...c, zoom: value }),
      ).toThrow()
      expect(() =>
        villageWorldBounds({ x: 0, y: 0, width: value, height: 1 }, c),
      ).toThrow()
      expect(() =>
        villageFoliage(c, { x: 0, y: 0, width: 1, height: value }, false),
      ).toThrow()
    },
  )
  it.each([0, -1])("rejects invalid camera scale %s", (zoom) => {
    expect(() =>
      unprojectVillage({ x: 0, y: 0 }, {
        ...villageCamera({ x: 0, y: 0 }, "follow"),
        zoom,
      }),
    ).toThrow()
  })
  it("bounds optional parallax, disables it under reduced motion and fades foreground over leader", () => {
    const c = villageCamera({ x: 16, y: 368 }, "follow"),
      actor = { x: 65, y: 348, width: 14, height: 35 }
    const still = villageFoliage(c, actor, true),
      animated = villageFoliage(c, actor, false)
    still.forEach((p, i) => {
      expect([p.x, p.y]).toEqual([scene.foliage[i].x, scene.foliage[i].y])
      expect(Math.abs(animated[i].x - p.x)).toBeLessThanOrEqual(12)
      expect(Math.abs(animated[i].y - p.y)).toBeLessThanOrEqual(8)
    })
    expect(still.find((p) => p.frame === "willow")?.alpha).toBe(0.28)
    expect(
      villageFoliage(c, { x: 320, y: 192, width: 15, height: 48 }, true).every(
        (p) => p.alpha === 1,
      ),
    ).toBe(true)
    still[0].x = 999
    expect(scene.foliage[0].x).toBe(-80)
  })
  it("retains all canonical props, collider and existing shared textures", () => {
    expect(scene.props).toEqual(old.props)
    expect(scene.obstacle).toEqual(old.obstacle)
    expect(scene.assets.props).toEqual(old.assets.props)
    expect(scene.assets.threshold).toEqual(old.assets.threshold)
    expect(scene.frames).toEqual(old.frames)
  })
  it("binds selected foreground bytes and both pinned own mainline references", () => {
    const hash = (p: string) =>
      createHash("sha256").update(readFileSync(p)).digest("hex")
    expect(hash(scene.assets.foreground.source.path)).toBe(
      scene.assets.foreground.source.sha256,
    )
    expect(hash(scene.assets.foreground.url.slice(1))).toBe(
      scene.assets.foreground.sha256,
    )
    expect(scene.provenance.references).toHaveLength(2)
    for (const r of scene.provenance.references) {
      expect(hash(r.path)).toBe(r.sha256)
      expect(r.commit).toBe("f9d39257d17b4dd378a2fbd2a9f936724754fc16")
    }
    for (const p of scene.foliage) {
      const f =
        scene.foregroundFrames[(p.frame as keyof typeof scene.foregroundFrames)]
      expect(p.width / p.height).toBeCloseTo(f.width / f.height, 5)
    }
  })
})
