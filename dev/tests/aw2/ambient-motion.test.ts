import { describe, expect, it, vi } from "vitest"
import {
  AMBIENT_MOTION,
  ambientForZone,
  ambientRegionsForZone,
  sampleAmbientFrame,
} from "../../../src/aw2/assets/ambientMotion"
import {
  loadAmbientTexture,
  loadAmbientTextures,
  releaseAmbientTexture,
  releaseAmbientTextures,
} from "../../aw2/AmbientLayer"

describe("AW2 authored ambient motion", () => {
  it("uses four deterministic poses and a static reduced pose", () => {
    expect(
      [0, 800, 1600, 2400, 3200].map((at) => sampleAmbientFrame(at, false)),
    ).toEqual(["calm", "lift", "bright", "settle", "calm"])
    expect(sampleAmbientFrame(1700, true)).toBe("calm")
    expect(() => sampleAmbientFrame(Number.NaN, false)).toThrow()
    expect(() => sampleAmbientFrame(-1, false)).toThrow()
  })

  it("freezes all twelve non-interactive anchors", () => {
    expect(ambientForZone("aw2-zone-covenant-village")?.placements).toEqual([
      { id: "village-water-1", x: -300, y: 220 },
      { id: "village-water-2", x: 940, y: 236 },
    ])
    expect(ambientForZone("aw2-zone-lantern-street")?.placements).toHaveLength(
      4,
    )
    const yard = ambientRegionsForZone("aw2-zone-forgotten-kitchen-yard")
    expect(yard.map((region) => region.asset)).toEqual([
      "yard-steam",
      "yard-water",
    ])
    expect(yard.flatMap((region) => region.placements)).toEqual([
      { id: "yard-steam-1", x: -60, y: -105 },
      { id: "yard-steam-2", x: 65, y: -96 },
      { id: "yard-steam-3", x: 720, y: 420 },
      { id: "yard-water-1", x: 820, y: -70 },
      { id: "yard-water-2", x: 900, y: 100 },
      { id: "yard-water-3", x: 920, y: 255 },
    ])
    expect(AMBIENT_MOTION.geometryAuthorityChanged).toBe(false)
  })

  it("keeps display size and depth separate from gameplay geometry", () => {
    const village = ambientForZone("aw2-zone-covenant-village")!
    const street = ambientForZone("aw2-zone-lantern-street")!
    const [steam, water] = ambientRegionsForZone(
      "aw2-zone-forgotten-kitchen-yard",
    )
    expect(village.display).toEqual({ width: 76, height: 38 })
    expect(village.depth).toBe(-850)
    expect(street.display).toEqual({ width: 24, height: 24 })
    expect(street.depth).toBe(7)
    expect(steam.display).toEqual({ width: 34, height: 50 })
    expect(steam.depth).toBe(-700)
    expect(water.display).toEqual({ width: 60, height: 24 })
    expect(water.depth).toBe(-850)
    expect(AMBIENT_MOTION.fullEnvironmentComplete).toBe(false)
  })

  it("loads both yard sheets and releases or rolls back every acquired lease", async () => {
    const unload = vi.fn(async () => undefined)
    const loaded = await loadAmbientTextures(
      "aw2-zone-forgotten-kitchen-yard",
      async (url) => ({ url }) as never,
      unload,
    )
    expect(loaded.map((item) => item.asset.id)).toEqual([
      "aw2-ambient-v2:yard-steam",
      "aw2-ambient-v2:yard-water",
    ])
    releaseAmbientTextures(loaded.map((item) => item.asset.url))
    await vi.waitFor(() => expect(unload).toHaveBeenCalledTimes(2))

    const failingUnload = vi.fn(async () => undefined)
    await expect(
      loadAmbientTextures(
        "aw2-zone-forgotten-kitchen-yard",
        async (url) => {
          if (url.includes("yard-water")) throw Error("missing water")
          return { url } as never
        },
        failingUnload,
      ),
    ).rejects.toThrow("missing water")
    await vi.waitFor(() => expect(failingUnload).toHaveBeenCalledOnce())
  })

  it("leases one concurrent texture and unloads it only after the last owner", async () => {
    let loads = 0
    const texture = {}
    const unload = vi.fn(async () => undefined)
    const load = async () => {
      loads += 1
      await Promise.resolve()
      return texture as never
    }
    const [first, second] = await Promise.all([
      loadAmbientTexture("aw2-zone-covenant-village", load, unload),
      loadAmbientTexture("aw2-zone-covenant-village", load, unload),
    ])
    expect(loads).toBe(1)
    releaseAmbientTexture(first?.asset.url)
    expect(unload).not.toHaveBeenCalled()
    releaseAmbientTexture(second?.asset.url)
    await vi.waitFor(() => expect(unload).toHaveBeenCalledOnce())

    const third = await loadAmbientTexture(
      "aw2-zone-covenant-village",
      load,
      unload,
    )
    expect(loads).toBe(2)
    releaseAmbientTexture(third?.asset.url)
    await vi.waitFor(() => expect(unload).toHaveBeenCalledTimes(2))
  })

  it("does not request ambient textures in any interior", async () => {
    const load = vi.fn()
    for (const zoneId of [
      "aw2-zone-pantry",
      "aw2-zone-hearth-room",
      "aw2-zone-table-room",
    ])
      expect(await loadAmbientTextures(zoneId, load, vi.fn())).toEqual([])
    expect(load).not.toHaveBeenCalled()
  })
})
