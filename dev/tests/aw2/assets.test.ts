import { describe, expect, it } from "vitest"
import { THAN_ASSETS } from "@/aw2/assets/than"
import {
  markersBetween,
  sampleBattleClip,
  sampleWorldFrame,
  validateAssetManifest,
} from "@/aw2/assets/animation"
import { BATTLE_STATES, DIRECTIONS, SKILL_SLOTS } from "@/aw2/assets/types"
import { ROSTER } from "@/aw2/world/ids"

describe("ART-THAN reference manifest and animation boundaries", () => {
  it("resolves real art for Than while leaving the other seven visibly incomplete", () => {
    expect(validateAssetManifest(THAN_ASSETS)).toEqual([])
    const than = ROSTER.find((spirit) => spirit.spiritId === "aw2-than")!
    expect(than.assets.world).toBe(THAN_ASSETS.assets.world.id)
    expect(than.assets.battle).toBe(THAN_ASSETS.assets.battle.id)
    expect(
      ROSTER.filter((spirit) => spirit.assets.status === "NOT_CREATED"),
    ).toHaveLength(7)
    expect(THAN_ASSETS.fullCharacterComplete).toBe(false)
    expect(THAN_ASSETS.provenance.licenseStatus).toBe("REVIEW_REQUIRED")
    expect(THAN_ASSETS.provenance.commercialRelease).toBe("NOT_CLEARED")
  })
  it("has distinct four-way world art and distinct eight-state HD poses", () => {
    expect(Object.keys(THAN_ASSETS.frames)).toHaveLength(72)
    const worldCels = DIRECTIONS.flatMap((direction) => [
      THAN_ASSETS.world[direction].idle,
      ...new Set(THAN_ASSETS.world[direction].walk),
    ])
    expect(new Set(worldCels).size).toBe(16)
    const poseRects = BATTLE_STATES.map(
      (state) => THAN_ASSETS.frames[`battle.${state}`],
    ).map((frame) => `${frame.x},${frame.y},${frame.width},${frame.height}`)
    expect(new Set(poseRects).size).toBe(8)
    for (const state of BATTLE_STATES) {
      const clip = THAN_ASSETS.battle[state]
      expect(new Set(clip.frames.map((key) => key.frame)).size).toBe(4)
      expect(
        new Set(
          clip.frames.map((key) =>
            JSON.stringify(THAN_ASSETS.frames[key.frame]),
          ),
        ).size,
      ).toBe(4)
      expect(clip.reducedMotionFrame).toBe(`battle.${state}`)
    }
  })
  it("rejects missing art, bleed, out-of-bounds cells and invalid timelines instead of substituting geometry", () => {
    const clone = () =>
      JSON.parse(JSON.stringify(THAN_ASSETS)) as typeof THAN_ASSETS
    const outside = clone()
    outside.frames["battle.attack"].x = 100000
    const missing = clone()
    delete missing.frames["world.up.0"]
    const bleeding = clone()
    bleeding.frames["fx.auto.0"].maxEdgeAlpha = 255
    const time = clone()
    time.battle.attack.frames[1].atMs = -1
    const motion = clone()
    motion.battle.hit.motion[0].scale = 0
    const skill = clone()
    skill.skills.auto.battleState = "unknown-state"
    const anchor = clone()
    anchor.skills.auto.fxPlacement.scale = 0
    const scale = clone()
    scale.frames["battle.attack.0"].renderScale = 0
    const reduced = clone()
    reduced.battle.attack.reducedMotionFrame = "absent"
    for (const manifest of [
      outside,
      missing,
      bleeding,
      time,
      motion,
      skill,
      anchor,
      scale,
      reduced,
    ])
      expect(validateAssetManifest(manifest).length).toBeGreaterThan(0)
  })
  it("switches attack poses at authored boundaries and interpolates exactly at contact", () => {
    const clip = THAN_ASSETS.battle.attack
    expect(sampleBattleClip(clip, 119).frame).toBe("battle.attack.0")
    expect(sampleBattleClip(clip, 120).frame).toBe("battle.attack.1")
    expect(sampleBattleClip(clip, 240)).toMatchObject({
      x: 28,
      frame: "battle.attack.2",
    })
    expect(sampleBattleClip(clip, 420).frame).toBe("battle.attack.3")
    expect(sampleBattleClip(clip, 10000).time).toBe(clip.durationMs)
    expect(sampleBattleClip(clip, NaN).time).toBe(0)
  })
  it("emits a contact only when crossing its timestamp, with no replay at the same time", () => {
    const clip = THAN_ASSETS.battle.attack
    expect(markersBetween(clip, 0, 239)).toEqual([])
    expect(markersBetween(clip, 239, 240)).toEqual([
      { atMs: 240, kind: "contact", skill: "basic" },
    ])
    expect(markersBetween(clip, 240, 300)).toEqual([])
    expect(markersBetween(clip, 300, 200)).toEqual([])
    expect(markersBetween(clip, 700, 10000)).toEqual([])
    // Guarding is not itself a shield-expired proc; the future combat owner decides.
    expect(THAN_ASSETS.battle.guard.markers).toEqual([])
    expect(THAN_ASSETS.skills.passive.trigger).toContain("shield-expired")
  })
  it("loops idle/world safely and holds defeat without restarting", () => {
    const idle = THAN_ASSETS.battle.idle
    expect(sampleBattleClip(idle, idle.durationMs + 600).time).toBe(600)
    const defeat = THAN_ASSETS.battle.defeat
    expect(sampleBattleClip(defeat, 5000).frame).toBe("battle.defeat.3")
    expect(sampleBattleClip(defeat, 5000).time).toBe(defeat.durationMs)
    const world = THAN_ASSETS.world.down
    expect(sampleWorldFrame(THAN_ASSETS, "down", true, 149)).toBe(world.walk[0])
    expect(sampleWorldFrame(THAN_ASSETS, "down", true, 150)).toBe(world.walk[1])
    expect(sampleWorldFrame(THAN_ASSETS, "down", true, 600)).toBe(world.walk[0])
    expect(sampleWorldFrame(THAN_ASSETS, "up", false, 1000)).toBe(
      THAN_ASSETS.world.up.idle,
    )
  })
  it("reduces motion to a stable meaningful pose without losing skill identity", () => {
    for (const state of BATTLE_STATES) {
      const clip = THAN_ASSETS.battle[state]
      const first = sampleBattleClip(clip, 0, true),
        later = sampleBattleClip(clip, 315, true)
      expect(first.frame).toBe(later.frame)
      expect(first).toMatchObject({
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        opacity: 1,
      })
    }
    expect(sampleBattleClip(THAN_ASSETS.battle.attack, 0, true).frame).toBe(
      "battle.attack",
    )
    expect(sampleWorldFrame(THAN_ASSETS, "left", true, 50, true)).toBe(
      THAN_ASSETS.world.left.idle,
    )
  })
  it("binds four distinct authored FX tracks and unique audio to canonical melee skills", () => {
    const fx = SKILL_SLOTS.map((slot) => THAN_ASSETS.skills[slot].fx.join(","))
    expect(new Set(fx).size).toBe(4)
    expect(
      new Set(SKILL_SLOTS.map((slot) => THAN_ASSETS.skills[slot].audio.sha256))
        .size,
    ).toBe(4)
    expect(THAN_ASSETS.skills.basic.fxPlacement.attachment).toBe("contact")
    expect(THAN_ASSETS.skills.ultimate.fxPlacement.layer).toBe("behind")
    for (const slot of SKILL_SLOTS) {
      expect(THAN_ASSETS.skills[slot].id).toBe(`aw2-than:skill:${slot}`)
      expect(THAN_ASSETS.skills[slot].projectile).toBeNull()
    }
  })
})
