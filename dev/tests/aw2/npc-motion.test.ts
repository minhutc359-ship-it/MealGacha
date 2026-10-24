import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  NPC_MOTION,
  npcForEntity,
  npcsForZone,
  sampleNpcIdle,
  advanceNpcClock,
} from "@/aw2/assets/npcMotion"
import { ZONE_IDS, type ZoneId } from "@/aw2/world/ids"
import { zoneById } from "@/aw2/world/maps"
const hash = (path: string) =>
  createHash("sha256").update(readFileSync(path)).digest("hex")
describe("006M all canonical NPC idle motion", () => {
  it("covers exactly eight approved NPCs once in their original zones, no collectible or boss", () => {
    const canonical = ZONE_IDS.flatMap((zone) =>
      zoneById(zone)
        .objects.filter((o) => o.id.startsWith("aw2-npc-"))
        .map((o) => o.id),
    ).sort()
    expect(NPC_MOTION.npc.map((n) => n.entityId).sort()).toEqual(canonical)
    expect(new Set(canonical).size).toBe(8)
    expect(NPC_MOTION.authoredFrameCount).toBe(32)
    expect(NPC_MOTION.fullNpcComplete).toBe(false)
    expect(NPC_MOTION.locomotionComplete).toBe(false)
    expect(npcForEntity("aw2-enemy-forgotten-host")).toBeUndefined()
    expect(npcsForZone(ZONE_IDS[3])).toEqual([])
    expect(npcsForZone(ZONE_IDS[1])).toHaveLength(6)
    for (const n of NPC_MOTION.npc) {
      expect(npcForEntity(n.entityId)).toBe(n)
      expect(
        zoneById(n.zoneId as ZoneId).objects.some((o) => o.id === n.entityId),
      ).toBe(true)
      expect(n).not.toHaveProperty("spiritId")
      expect(n).not.toHaveProperty("rarity")
    }
  })
  it.each(NPC_MOTION.npc)(
    "$entityId source/runtime/identity/prompt/selection remain exact and review-required",
    (npc) => {
      const a = npc.asset,
        p = npc.provenance
      for (const [path, sha] of [
        [a.url.slice(1), a.sha256],
        [a.source.path, a.source.sha256],
        [p.prompts.path, p.prompts.sha256],
        [p.selection.path, p.selection.sha256],
        ...p.references.map((r) => [r.path, r.sha256]),
      ])
        expect(hash(path)).toBe(sha)
      expect(readFileSync(a.url.slice(1)).length).toBe(a.bytes)
      expect(a.bytes).toBeLessThanOrEqual(2_000_000)
      expect(a.width * a.height * 4).toBeLessThanOrEqual(8_000_000)
      expect(p.licenseStatus).toBe("REVIEW_REQUIRED")
      expect(p.commercialRelease).toBe("NOT_CLEARED")
      expect(npc.idleMotionComplete).toBe(true)
      expect(npc.locomotionComplete).toBe(false)
    },
  )
  it.each(NPC_MOTION.npc)(
    "$entityId four safe frames use one scale/real foot anchors without clipping or flips",
    (npc) => {
      expect(Object.keys(npc.frames)).toEqual([
        "neutral",
        "breath",
        "blink",
        "gesture",
      ])
      expect(npc.display.scale * npc.frames.neutral.height).toBeCloseTo(
        npc.display.neutralHeight,
        8,
      )
      for (const f of Object.values(npc.frames)) {
        expect(f.x).toBeGreaterThanOrEqual(f.cellRegion.x)
        expect(f.y).toBeGreaterThanOrEqual(f.cellRegion.y)
        expect(f.x + f.width).toBeLessThanOrEqual(
          f.cellRegion.x + f.cellRegion.width,
        )
        expect(f.y + f.height).toBeLessThanOrEqual(
          f.cellRegion.y + f.cellRegion.height,
        )
        expect(f.alphaEdgeMax).toBeLessThanOrEqual(8)
        expect(f.anchorX).toBeGreaterThan(0)
        expect(f.anchorX).toBeLessThan(f.width)
        expect(f.anchorY).toBeGreaterThan(0)
        expect(f.anchorY).toBeLessThan(f.height)
        expect(f.height * npc.display.scale).toBeLessThan(
          npc.display.neutralHeight * 1.05,
        )
      }
    },
  )
  it.each(NPC_MOTION.npc)(
    "$entityId samples exact timeline boundaries/cycle and explicit reduced pose without mutation",
    (npc) => {
      const prior = JSON.stringify(npc)
      let at = 0
      for (const step of NPC_MOTION.timeline) {
        const t = (at - npc.phaseMs + NPC_MOTION.cycleMs) % NPC_MOTION.cycleMs
        expect(sampleNpcIdle(npc, t, false)).toBe(step.frame)
        expect(sampleNpcIdle(npc, t + step.durationMs - 0.01, false)).toBe(
          step.frame,
        )
        expect(sampleNpcIdle(npc, t + NPC_MOTION.cycleMs, false)).toBe(
          step.frame,
        )
        expect(sampleNpcIdle(npc, t, true)).toBe("neutral")
        at += step.durationMs
      }
      expect(at).toBe(NPC_MOTION.cycleMs)
      expect(JSON.stringify(npc)).toBe(prior)
    },
  )
  it("freezes pause/reduced time, caps suspended-tab delta, resumes from prior authored phase", () => {
    let t = 500
    t = advanceNpcClock(t, 30, true, false)
    expect(t).toBe(500)
    t = advanceNpcClock(t, 30, false, true)
    expect(t).toBe(500)
    t = advanceNpcClock(t, 20, false, false)
    expect(t).toBe(520)
    expect(advanceNpcClock(t, 5000, false, false)).toBe(620)
    const npc = NPC_MOTION.npc[0]
    expect(sampleNpcIdle(npc, 500, false)).toBe("breath")
    expect(
      sampleNpcIdle(npc, advanceNpcClock(500, 20, true, false), false),
    ).toBe("breath")
  })
  it("rejects invalid clocks rather than hiding a broken animation state", () => {
    for (const n of [-1, NaN, Infinity]) {
      expect(() => sampleNpcIdle(NPC_MOTION.npc[0], n, false)).toThrow()
      expect(() => advanceNpcClock(0, n, false, false)).toThrow()
      expect(() => advanceNpcClock(n, 0, true, false)).toThrow()
    }
  })
  it("bounds each actual active texture inventory and omits the redundant static street atlas", () => {
    for (const region of NPC_MOTION.regions) {
      expect(region.budget.compressedBytes).toBeLessThanOrEqual(
        region.budget.maxCompressedBytes,
      )
      expect(region.budget.decodedRgbaBytes).toBeLessThanOrEqual(
        region.budget.maxDecodedRgbaBytes,
      )
      for (const npc of npcsForZone(region.zoneId))
        expect(region.requiredAssetIds).toContain(npc.asset.id)
    }
    const street = NPC_MOTION.regions.find((r) => r.zoneId === ZONE_IDS[1])!
    expect(street.requiredAssetIds).not.toContain(
      "aw2-environment-lantern-street-v1:props",
    )
  })
})
