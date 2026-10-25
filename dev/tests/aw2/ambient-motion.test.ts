import { describe, expect, it, vi } from "vitest"
import {
  AMBIENT_MOTION,
  ambientForZone,
  sampleAmbientFrame,
} from "../../../src/aw2/assets/ambientMotion"
import {
  loadAmbientTexture,
  releaseAmbientTexture,
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

  it("freezes the six non-interactive anchors", () => {
    expect(ambientForZone("aw2-zone-covenant-village")?.placements).toEqual([
      { id: "village-water-1", x: -300, y: 220 },
      { id: "village-water-2", x: 940, y: 236 },
    ])
    expect(ambientForZone("aw2-zone-lantern-street")?.placements).toHaveLength(
      4,
    )
    expect(ambientForZone("aw2-zone-forgotten-kitchen-yard")).toBeUndefined()
    expect(AMBIENT_MOTION.geometryAuthorityChanged).toBe(false)
  })

  it("keeps display size and depth separate from gameplay geometry", () => {
    const village = ambientForZone("aw2-zone-covenant-village")!
    const street = ambientForZone("aw2-zone-lantern-street")!
    expect(village.display).toEqual({ width: 76, height: 38 })
    expect(village.depth).toBe(-850)
    expect(street.display).toEqual({ width: 24, height: 24 })
    expect(street.depth).toBe(7)
    expect(AMBIENT_MOTION.fullEnvironmentComplete).toBe(false)
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

  it("does not request ambient textures outside the two authored zones", async () => {
    const load = vi.fn()
    expect(
      await loadAmbientTexture(
        "aw2-zone-forgotten-kitchen-yard",
        load,
        vi.fn(),
      ),
    ).toBeUndefined()
    expect(load).not.toHaveBeenCalled()
  })
})
