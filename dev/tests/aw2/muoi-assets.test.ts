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
  validateAssetManifest,
} from "@/aw2/assets/animation"
import { ROSTER, STARTER_TEAM } from "@/aw2/world/ids"

const muoi = ROSTER_ASSETS["aw2-muoi"]

describe("AW2-004J Muối reference assets without combat/collection grants", () => {
  it("resolves Muối while keeping starters fixed and the current missing inventory honest", () => {
    expect(ROSTER_ASSETS["aw2-muoi"]).toBe(muoi)
    expect(Object.keys(STARTER_ASSETS)).toEqual(STARTER_TEAM)
    expect(STARTER_TEAM).not.toContain("aw2-muoi")
    expect(Object.keys(ROSTER_ASSETS)).toHaveLength(8)
    expect(
      ROSTER.filter((s) => s.assets.status === "NOT_CREATED"),
    ).toHaveLength(4)
    expect(ROSTER.find((s) => s.spiritId === "aw2-muoi")).toMatchObject({
      displayName: "Muối Đen",
      rarity: "R",
      recipeAffiliation: "Muối rang",
      role: "Debuffer",
      assets: { world: muoi.assets.world.id, battle: muoi.assets.battle.id },
    })
  })
  it("preserves approved skill identities and truthful reference-only completion/provenance", () => {
    expect(validateAssetManifest(muoi)).toEqual([])
    expect(muoi.fullCharacterComplete).toBe(false)
    expect(muoi.provenance.commercialRelease).toBe("NOT_CLEARED")
    expect(muoi.provenance.externalReferences).toEqual([])
    expect(SKILL_SLOTS.map((slot) => muoi.skills[slot].displayName)).toEqual([
      "Hạt Chạm",
      "Nêm Đúng Chỗ",
      "Vị Còn Lại",
      "Một Nhúm Đủ Rồi",
    ])
    for (const slot of SKILL_SLOTS) {
      expect(muoi.skills[slot].id).toBe(`aw2-muoi:skill:${slot}`)
      expect(muoi.skills[slot].audio.id).toBe(`aw2-muoi:audio:${slot}`)
      expect(muoi.skills[slot].scope).toContain(
        "no collection or final numerical balance",
      )
    }
    expect(
      Object.values(muoi.assets).every(
        (a) => a.id.startsWith("aw2-muoi:") && a.url.includes("/muoi/base-v1/"),
      ),
    ).toBe(true)
  })
  it("authors four distinct poses per each HD state with bounded defeat and static reduced motion", () => {
    expect(Object.keys(muoi.frames)).toHaveLength(64)
    for (const state of BATTLE_STATES) {
      expect(new Set(muoi.battle[state].frames.map((k) => k.frame)).size).toBe(
        4,
      )
      const first = sampleBattleClip(muoi.battle[state], 0, true)
      expect(sampleBattleClip(muoi.battle[state], 10000, true).frame).toBe(
        first.frame,
      )
    }
    expect(sampleBattleClip(muoi.battle.defeat, 10000).frame).toBe(
      "battle.defeat.3",
    )
    expect(muoi.battle.guard.markers).toEqual([])
  })
  it("keeps each independently authored world direction separate and idles/reduces without walking", () => {
    const all = DIRECTIONS.flatMap((d) => muoi.world[d].walk)
    expect(new Set(all).size).toBe(16)
    for (const d of DIRECTIONS) {
      expect(sampleWorldFrame(muoi, d, true, 150)).toBe(`world.${d}.1`)
      expect(sampleWorldFrame(muoi, d, false, 150)).toBe(`world.${d}.0`)
      expect(sampleWorldFrame(muoi, d, true, 150, true)).toBe(`world.${d}.0`)
    }
  })
  it("separates basic flight from finite actual impact art with one reference launch/contact", () => {
    const s = muoi.skills.basic
    expect(sampleProjectile(s, 259)).toBeNull()
    expect(sampleProjectile(s, 260)?.frame).toBe("fx.basic.0")
    expect(sampleSkillFx(s, 699)).toBeNull()
    expect(sampleProjectile(s, 700)).toBeNull()
    expect(sampleSkillFx(s, 700)?.frame).toBe("fx.basic.2")
    expect(sampleSkillFx(s, 790)?.frame).toBe("fx.basic.3")
    expect(sampleSkillFx(s, 880)).toBeNull()
    expect(
      markersBetween(muoi.battle.attack, 0, 1000).map((m) => [m.kind, m.atMs]),
    ).toEqual([
      ["launch", 260],
      ["impact-preview", 700],
    ])
    expect(sampleProjectile(s, 400, true)).toBeNull()
  })
  it("keeps mark/refresh/burst FX finite and passive triggers preview-only without looped outcome markers", () => {
    for (const slot of ["auto", "passive", "ultimate"] as const) {
      const s = muoi.skills[slot]
      expect(sampleSkillFx(s, s.fxTriggerAtMs - 1)).toBeNull()
      expect(sampleSkillFx(s, s.fxTriggerAtMs)?.frame).toBe(`fx.${slot}.0`)
      expect(sampleSkillFx(s, s.fxTriggerAtMs + 440)).toBeNull()
    }
    expect(muoi.skills.passive.trigger).toContain("preview only")
    expect(muoi.skills.passive.trigger).toContain("bounded existing-target")
  })
  it("rejects foreign/replaced projectile frames and out-of-range motion metadata", () => {
    const broken = structuredClone(muoi)
    broken.skills.basic.projectile!.frames = ["fx.foreign"]
    broken.frames["battle.attack.0"].renderScale = -1
    expect(validateAssetManifest(broken)).toEqual(
      expect.arrayContaining([
        "Invalid projectile basic",
        "Invalid frame battle.attack.0",
      ]),
    )
  })
})
