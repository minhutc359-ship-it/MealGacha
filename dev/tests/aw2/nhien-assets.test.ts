import { describe, expect, it } from "vitest"
import { ROSTER_ASSETS } from "@/aw2/assets/roster"
import { STARTER_ASSETS } from "@/aw2/assets/starters"
import { BATTLE_STATES, DIRECTIONS, SKILL_SLOTS } from "@/aw2/assets/types"
import {
  markersBetween,
  sampleBattleClip,
  sampleProjectile,
  sampleSkillFx,
  sampleWorldFrame,
  skillCueTimes,
  validateAssetManifest,
} from "@/aw2/assets/animation"
import { isCombatSpiritId } from "@/aw2/combat/roster"
import { ROSTER, STARTER_TEAM } from "@/aw2/world/ids"

const nhien = ROSTER_ASSETS["aw2-nhien"]

describe("AW2-004K Nhiên reference availability and bounded presentation", () => {
  it("exposes seven authored references without granting ownership or expanding the starter team", () => {
    expect(Object.keys(ROSTER_ASSETS)).toHaveLength(7)
    expect(Object.keys(STARTER_ASSETS)).toEqual(STARTER_TEAM)
    expect(STARTER_TEAM).not.toContain("aw2-nhien")
    expect(isCombatSpiritId("aw2-nhien")).toBe(true)
    expect(isCombatSpiritId("aw2-muoi")).toBe(true)
    expect(
      ROSTER.filter((s) => s.assets.status === "NOT_CREATED"),
    ).toHaveLength(5)
    expect(ROSTER.find((s) => s.spiritId === "aw2-nhien")).toMatchObject({
      displayName: "Nhiên",
      rarity: "SR",
      recipeAffiliation: "Bún bò",
      role: "Striker",
      assets: { world: nhien.assets.world.id, battle: nhien.assets.battle.id },
    })
  })
  it("preserves four approved skill identities and own original reference sources without completion claims", () => {
    expect(validateAssetManifest(nhien)).toEqual([])
    expect(nhien.fullCharacterComplete).toBe(false)
    expect(nhien.provenance.externalReferences).toEqual([])
    expect(nhien.provenance.commercialRelease).toBe("NOT_CLEARED")
    expect(SKILL_SLOTS.map((slot) => nhien.skills[slot].displayName)).toEqual([
      "Nhịp Chảo",
      "Bắt Nhịp",
      "Bếp Đông",
      "Lửa Qua Ba Nhịp",
    ])
    for (const slot of SKILL_SLOTS) {
      expect(nhien.skills[slot].id).toBe(`aw2-nhien:skill:${slot}`)
      expect(nhien.skills[slot].audio.id).toBe(`aw2-nhien:audio:${slot}`)
      expect(nhien.skills[slot].scope).toContain(
        "no collection or final numerical balance",
      )
    }
    expect(
      Object.values(nhien.assets).every(
        (a) =>
          a.id.startsWith("aw2-nhien:") && a.url.includes("/nhien/base-v1/"),
      ),
    ).toBe(true)
  })
  it("uses four authored cels per state, explicit ultimate recovery and a finite final kneel", () => {
    expect(Object.keys(nhien.frames)).toHaveLength(64)
    for (const state of BATTLE_STATES) {
      const own = nhien.battle[state].frames.filter((f) =>
        f.frame.startsWith(`battle.${state}.`),
      )
      expect(new Set(own.map((f) => f.frame)).size).toBe(4)
      expect(sampleBattleClip(nhien.battle[state], 10000, true).frame).toBe(
        `battle.${state}.0`,
      )
    }
    expect(sampleBattleClip(nhien.battle.ultimate, 1080).frame).toBe(
      "battle.idle.0",
    )
    expect(sampleBattleClip(nhien.battle.defeat, 10000).frame).toBe(
      "battle.defeat.3",
    )
    expect(nhien.battle.defeat.loop).toBe(false)
  })
  it("keeps sixteen four-way world cels separate with stable standing and reduced poses", () => {
    expect(new Set(DIRECTIONS.flatMap((d) => nhien.world[d].walk)).size).toBe(
      16,
    )
    for (const d of DIRECTIONS) {
      expect(sampleWorldFrame(nhien, d, true, 150)).toBe(`world.${d}.1`)
      expect(sampleWorldFrame(nhien, d, false, 150)).toBe(`world.${d}.0`)
      expect(sampleWorldFrame(nhien, d, true, 150, true)).toBe(`world.${d}.0`)
    }
  })
  it("separates two melee contacts with no fake projectile or effect during recovery", () => {
    const s = nhien.skills.basic
    expect(s.projectile).toBeNull()
    expect(sampleProjectile(s, 300)).toBeNull()
    expect(skillCueTimes(s)).toEqual([220, 440])
    expect(
      markersBetween(nhien.battle.attack, 0, 1000).map((m) => m.atMs),
    ).toEqual([220, 440])
    expect(sampleSkillFx(s, 219)).toBeNull()
    expect(sampleSkillFx(s, 220)?.cue).toBe(220)
    expect(sampleSkillFx(s, 400)).toBeNull()
    expect(sampleSkillFx(s, 440)?.cue).toBe(440)
    expect(sampleSkillFx(s, 700)).toBeNull()
  })
  it("has three separate finite ultimate cues and never invents a fourth contact from recovery", () => {
    const s = nhien.skills.ultimate
    expect(skillCueTimes(s)).toEqual([240, 520, 800])
    expect(
      markersBetween(nhien.battle.ultimate, 0, 10000).map((m) => m.atMs),
    ).toEqual([240, 520, 800])
    expect(markersBetween(nhien.battle.ultimate, 800, 10000)).toEqual([])
    for (const cue of [240, 520, 800]) {
      expect(sampleSkillFx(s, cue - 1)).toBeNull()
      expect(sampleSkillFx(s, cue)?.cue).toBe(cue)
      expect(sampleSkillFx(s, cue + 220)).toBeNull()
    }
    expect(sampleSkillFx(s, 0, false, 3)).toBeNull()
    expect(nhien.battle.guard.markers).toEqual([])
    expect(nhien.skills.passive.trigger).toContain("preview only")
    expect(nhien.skills.passive.trigger).toContain("bounded energy")
  })
  it("calibrates smaller source B with logical scales while keeping kneeling shorter than standing", () => {
    const height = (id: string) => {
      const f = nhien.frames[id]
      return (f.visibleBounds[3] - f.visibleBounds[1]) * (f.renderScale ?? 1)
    }
    expect(
      Math.abs(height("battle.idle.0") - height("battle.hit.0")),
    ).toBeLessThan(10)
    expect(height("battle.defeat.3")).toBeLessThan(height("battle.hit.0"))
    for (const frame of Object.values(nhien.frames))
      expect(frame.maxEdgeAlpha).toBeLessThanOrEqual(8)
  })
})
