import { describe, expect, it } from "vitest"
import { battleAtlasKeys, sampleActorPlayback } from "@/aw2/assets/playback"
import { THAN_ASSETS } from "@/aw2/assets/than"
import { STARTER_ASSETS } from "@/aw2/assets/starters"

describe("ART-THAN / BATTLE-01 actor playback across core ticks", () => {
  it("finishes a long ultimate across unrelated 650ms core renders", () => {
    const cue = { state: "ultimate" as const, serial: 10 }
    const first = sampleActorPlayback(
      THAN_ASSETS,
      undefined,
      cue,
      false,
      100,
      false,
    )
    const middle = sampleActorPlayback(
      THAN_ASSETS,
      first.clock,
      cue,
      false,
      750,
      false,
    )
    expect(middle.clock).toBe(first.clock)
    expect(middle.pose.frame).toBe("battle.ultimate.2")
    const last = sampleActorPlayback(
      THAN_ASSETS,
      middle.clock,
      cue,
      false,
      1300,
      false,
    )
    expect(last.pose.frame).toBe("battle.ultimate.3")
    const settled = sampleActorPlayback(
      THAN_ASSETS,
      last.clock,
      cue,
      false,
      1500,
      false,
    )
    expect(settled.state).toBe("idle")
    expect(settled.active).toBe(false)
    expect(
      sampleActorPlayback(THAN_ASSETS, settled.clock, cue, false, 2000, false)
        .state,
    ).toBe("idle")
  })

  it("allows a genuinely new received-hit cue to interrupt the caster", () => {
    const cast = sampleActorPlayback(
      THAN_ASSETS,
      undefined,
      { state: "cast", serial: 1 },
      false,
      0,
      false,
    )
    const hit = sampleActorPlayback(
      THAN_ASSETS,
      cast.clock,
      { state: "hit", serial: 2 },
      false,
      300,
      false,
    )
    expect(hit.state).toBe("hit")
    expect(hit.elapsedMs).toBe(0)
    expect(hit.pose.frame).toBe("battle.hit.0")
  })

  it("holds defeat's final cel through other actors' events and repeated renders", () => {
    const first = sampleActorPlayback(
      THAN_ASSETS,
      undefined,
      { state: "defeat", serial: 5 },
      true,
      30,
      false,
    )
    const last = sampleActorPlayback(
      THAN_ASSETS,
      first.clock,
      { state: "guard", serial: 6 },
      true,
      5000,
      false,
    )
    expect(last.clock).toBe(first.clock)
    expect(last.pose.frame).toBe("battle.defeat.3")
    expect(last.pose.time).toBe(1000)
  })

  it("keeps paused time and reduced-motion poses stable without changing rules", () => {
    const cue = { state: "attack" as const, serial: 3 }
    const first = sampleActorPlayback(
      THAN_ASSETS,
      undefined,
      cue,
      false,
      10,
      true,
    )
    expect(first.pose.frame).toBe("battle.attack")
    expect(
      sampleActorPlayback(THAN_ASSETS, first.clock, cue, false, 10, true),
    ).toEqual(first)
    expect(
      sampleActorPlayback(THAN_ASSETS, first.clock, cue, false, 300, true).pose
        .frame,
    ).toBe("battle.attack")
  })

  it("resolves every clip/reduced pose atlas for all starters, without unrelated portraits", () => {
    for (const manifest of Object.values(STARTER_ASSETS)) {
      const keys = battleAtlasKeys(manifest)
      expect(keys).not.toContain("portrait")
      for (const key of keys) expect(manifest.assets[key]).toBeDefined()
      for (const clip of Object.values(manifest.battle)) {
        for (const frame of clip.frames)
          expect(keys).toContain(manifest.frames[frame.frame].asset)
      }
    }
    expect(battleAtlasKeys(THAN_ASSETS)).toHaveLength(4)
  })
})
