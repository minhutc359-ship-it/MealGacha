import { describe, expect, it } from "vitest"
import { STARTER_ASSETS } from "@/aw2/assets/starters"
import {
  markersBetween,
  sampleBattleClip,
  sampleProjectile,
  sampleSkillFx,
  skillCueTimes,
  validateAssetManifest,
} from "@/aw2/assets/animation"
import { BATTLE_STATES, DIRECTIONS, SKILL_SLOTS } from "@/aw2/assets/types"
import { ROSTER, STARTER_TEAM } from "@/aw2/world/ids"

describe("ART-STARTERS authored identity, cue and projectile contracts", () => {
  it.each(STARTER_TEAM)(
    "resolves %s without crossing identity or claiming full character completion",
    (identity) => {
      const manifest = STARTER_ASSETS[identity]
      expect(validateAssetManifest(manifest)).toEqual([])
      expect(manifest.fullCharacterComplete).toBe(false)
      expect(manifest.provenance.licenseStatus).toBe("REVIEW_REQUIRED")
      expect(manifest.provenance.commercialRelease).toBe("NOT_CLEARED")
      const roster = ROSTER.find((unit) => unit.spiritId === identity)!
      expect(roster.assets.world).toBe(manifest.assets.world.id)
      expect(roster.assets.battle).toBe(manifest.assets.battle.id)
      expect(
        Object.values(manifest.assets).every((asset) =>
          asset.id.startsWith(`${identity}:`),
        ),
      ).toBe(true)
      expect(
        new Set(
          DIRECTIONS.flatMap((d) => [
            manifest.world[d].idle,
            ...manifest.world[d].walk,
          ]),
        ).size,
      ).toBe(16)
      expect(
        new Set(
          BATTLE_STATES.map((s) => manifest.frames[`battle.${s}`]).map((f) =>
            [f.x, f.y, f.width, f.height].join(),
          ),
        ).size,
      ).toBe(8)
      for (const slot of SKILL_SLOTS)
        expect(manifest.skills[slot].audio.id).toBe(`${identity}:audio:${slot}`)
    },
  )
  it("keeps starter membership separate from authored non-starter assets", () => {
    expect(Object.keys(STARTER_ASSETS)).toEqual(STARTER_TEAM)
    expect(
      ROSTER.filter((unit) => unit.assets.status === "NOT_CREATED"),
    ).toHaveLength(0)
  })
  it("authors Lua two-hit basic contacts and Lam two-stage ultimate independently", () => {
    const lua = STARTER_ASSETS["aw2-lua"]
    expect(
      markersBetween(lua.battle.attack, 0, 760).map((m) => m.atMs),
    ).toEqual([220, 380])
    expect(
      markersBetween(lua.battle.attack, 220, 380).map((m) => m.atMs),
    ).toEqual([380])
    expect(lua.skills.basic.projectile).toBeNull()
    expect(skillCueTimes(lua.skills.basic)).toEqual([220, 380])
    expect(sampleSkillFx(lua.skills.basic, 379)?.cue).toBe(220)
    expect(sampleSkillFx(lua.skills.basic, 380)?.cue).toBe(380)
    const lam = STARTER_ASSETS["aw2-lam"]
    expect(
      markersBetween(lam.battle.ultimate, 0, 1700).map((m) => m.atMs),
    ).toEqual([520, 1040])
    expect(skillCueTimes(lam.skills.ultimate)).toEqual([520, 1040])
    expect(sampleSkillFx(lam.skills.ultimate, 1039)).toBeNull()
    expect(sampleSkillFx(lam.skills.ultimate, 1040)?.cue).toBe(1040)
  })
  it.each(["aw2-lam", "aw2-moc-non", "aw2-suong"])(
    "separates %s launch, authored flight and impact boundaries",
    (identity) => {
      const manifest = STARTER_ASSETS[identity],
        skill = manifest.skills.basic,
        track = skill.projectile!
      expect(sampleProjectile(skill, track.launchAtMs - 1)).toBeNull()
      const start = sampleProjectile(skill, track.launchAtMs)!
      expect(start.frame).toBe("fx.basic.0")
      expect([start.x, start.y]).toEqual([track.from.x, track.from.y])
      const middle = sampleProjectile(
        skill,
        (track.launchAtMs + track.impactAtMs) / 2,
      )!
      expect(middle.x).toBe((track.from.x + track.to.x) / 2)
      expect(sampleSkillFx(skill, track.impactAtMs - 1)).toBeNull()
      expect(sampleProjectile(skill, track.impactAtMs)).toBeNull()
      expect(sampleSkillFx(skill, track.impactAtMs)?.frame).toBe("fx.basic.2")
      expect(
        markersBetween(manifest.battle.attack, 0, 1000).map((m) => m.kind),
      ).toEqual(["launch", "impact-preview"])
      expect(sampleProjectile(skill, 400, true)).toBeNull()
      expect(sampleSkillFx(skill, 400, true)?.frame).toBe("fx.basic.2")
      expect(sampleBattleClip(manifest.battle.attack, 400, true).frame).toBe(
        "battle.attack",
      )
    },
  )
  it("rejects broken projectile frames/flight and duplicate or late effect cues", () => {
    const clone = () => structuredClone(STARTER_ASSETS["aw2-lam"])
    const missing = clone()
    missing.skills.basic.projectile!.frames = ["missing"]
    const backwards = clone()
    backwards.skills.basic.projectile!.impactAtMs = 100
    const late = clone()
    late.skills.ultimate.fxCueAtMs = [520, 9000]
    const duplicate = clone()
    duplicate.skills.ultimate.fxCueAtMs = [520, 520]
    const invalid = clone()
    invalid.skills.basic.projectile!.from.x = NaN
    for (const manifest of [missing, backwards, late, duplicate, invalid])
      expect(validateAssetManifest(manifest).length).toBeGreaterThan(0)
  })
  it("never binds passive proc to the looping guard pose", () => {
    for (const manifest of Object.values(STARTER_ASSETS)) {
      expect(manifest.battle.guard.markers).toEqual([])
      expect(manifest.skills.passive.trigger).toContain("combat")
    }
  })
})
