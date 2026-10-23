import { describe, expect, it } from "vitest"
import { ROSTER_ASSETS } from "@/aw2/assets/roster"
import { STARTER_ASSETS } from "@/aw2/assets/starters"
import { BATTLE_STATES, DIRECTIONS, SKILL_SLOTS } from "@/aw2/assets/types"
import {
  validateAssetManifest,
  sampleBattleClip,
  sampleSkillFx,
  sampleProjectile,
  skillCueTimes,
  sampleWorldFrame,
} from "@/aw2/assets/animation"
import { isCombatSpiritId } from "@/aw2/combat/roster"
import { ROSTER, STARTER_TEAM } from "@/aw2/world/ids"
import { sampleConfirmedEffect } from "@/aw2/assets/playback"

const references = [
  {
    id: "aw2-hai",
    name: "Hải",
    rarity: "SR",
    recipe: "Canh chua",
    ranged: false,
    skills: ["Gạt Sóng", "Giữ Lối", "Biết Đường Về", "Bờ Đợi"],
  },
  {
    id: "aw2-lien",
    name: "Liên",
    rarity: "SR",
    recipe: "Chè sen",
    ranged: true,
    skills: ["Hạt Sen", "Hẹn Sau Cơn Mệt", "Lời Hẹn Còn Đây", "Mở Lời"],
  },
  {
    id: "aw2-moc",
    name: "Mộc",
    rarity: "SSR",
    recipe: "Cốm",
    ranged: true,
    skills: ["Nét Lá", "Gieo Dấu", "Mùa Nối Mùa", "Mở Gói Mùa Xanh"],
  },
  {
    id: "aw2-bach",
    name: "Bách",
    rarity: "SSR",
    recipe: "Bánh chưng",
    ranged: false,
    skills: ["Mối Buộc", "Gói Chắc", "Chia Phần", "Mở Vòng Dây"],
  },
  {
    id: "aw2-van",
    name: "Vân",
    rarity: "UR",
    recipe: "Bữa ăn thất lạc",
    ranged: true,
    skills: ["Mảnh Âm", "Nối Hai Đầu", "Nhớ Một Phần", "Bữa Ăn Chưa Gọi Tên"],
  },
]

describe.each(references)("$id original reference package", (unit) => {
  const m = ROSTER_ASSETS[unit.id]
  it("resolves approved identity and own assets without enabling ownership or combat", () => {
    expect(validateAssetManifest(m)).toEqual([])
    expect(ROSTER.find((s) => s.spiritId === unit.id)).toMatchObject({
      displayName: unit.name,
      rarity: unit.rarity,
      recipeAffiliation: unit.recipe,
    })
    expect(Object.keys(STARTER_ASSETS)).toEqual(STARTER_TEAM)
    expect(STARTER_TEAM).toHaveLength(5)
    expect(STARTER_TEAM).not.toContain(unit.id)
    expect(isCombatSpiritId(unit.id)).toBe(false)
    expect(
      Object.values(m.assets).every(
        (a) =>
          a.id.startsWith(unit.id + ":") &&
          a.url.includes(`/${unit.id.slice(4)}/base-v1/`),
      ),
    ).toBe(true)
    expect(m.fullCharacterComplete).toBe(false)
    expect(m.provenance.externalReferences).toEqual([])
    expect(m.provenance.commercialRelease).toBe("NOT_CLEARED")
  })
  it("has32 distinct HD cels,16 directional world cels and16 own FX cells", () => {
    expect(Object.keys(m.frames)).toHaveLength(64)
    for (const state of BATTLE_STATES) {
      const cels = m.battle[state].frames.filter((f) =>
        f.frame.startsWith(`battle.${state}.`),
      )
      expect(new Set(cels.map((f) => f.frame)).size).toBe(4)
      expect(sampleBattleClip(m.battle[state], 9999, true).frame).toBe(
        `battle.${state}.0`,
      )
    }
    for (const d of DIRECTIONS) {
      expect(new Set(m.world[d].walk).size).toBe(4)
      expect(sampleWorldFrame(m, d, true, 150)).toBe(`world.${d}.1`)
      expect(sampleWorldFrame(m, d, true, 150, true)).toBe(`world.${d}.0`)
    }
    expect(sampleBattleClip(m.battle.defeat, 9999).frame).toBe(
      "battle.defeat.3",
    )
    expect(sampleBattleClip(m.battle.ultimate, 1300).frame).toBe(
      "battle.idle.0",
    )
  })
  it("keeps each approved skill ID, finite cue and independent audio source", () => {
    expect(SKILL_SLOTS.map((s) => m.skills[s].displayName)).toEqual(unit.skills)
    for (const slot of SKILL_SLOTS) {
      const skill = m.skills[slot]
      expect(skill.id).toBe(`${unit.id}:skill:${slot}`)
      expect(skill.audio.id).toBe(`${unit.id}:audio:${slot}`)
      expect(skill.trigger).toContain("manual reference preview only")
      for (const cue of skillCueTimes(skill)) {
        expect(sampleSkillFx(skill, cue - 1)).toBeNull()
        expect(sampleSkillFx(skill, cue)?.cue).toBe(cue)
        const life = (skill.projectile ? 2 : 4) * skill.fxFrameMs
        expect(sampleSkillFx(skill, cue + life)).toBeNull()
        const confirmed = { serial: 1, skillId: skill.id, index: 0 }
        const clock = sampleConfirmedEffect(
          m,
          undefined,
          confirmed,
          0,
          true,
        ).clock
        expect(
          sampleConfirmedEffect(m, clock, confirmed, life, true).effect,
        ).toBeNull()
      }
      expect(sampleSkillFx(skill, 10000)).toBeNull()
    }
  })
  it("keeps projectile launch/flight separate from impact and melee free of projectiles", () => {
    const skill = m.skills.basic
    if (unit.ranged) {
      expect(sampleProjectile(skill, 259)).toBeNull()
      expect(sampleProjectile(skill, 260)?.frame).toBe("fx.basic.0")
      expect(sampleProjectile(skill, 700)).toBeNull()
      expect(sampleSkillFx(skill, 699)).toBeNull()
      expect(sampleSkillFx(skill, 700)?.frame).toBe("fx.basic.2")
    } else {
      expect(skill.projectile).toBeNull()
      expect(sampleProjectile(skill, 500)).toBeNull()
    }
  })
  it("preserves alpha-safe measured bounds and consistent logical standing height", () => {
    for (const frame of Object.values(m.frames)) {
      expect(frame.maxEdgeAlpha).toBeLessThanOrEqual(8)
      expect(
        Math.min(
          frame.visibleBounds[0],
          frame.visibleBounds[1],
          frame.width - frame.visibleBounds[2],
          frame.height - frame.visibleBounds[3],
        ),
      ).toBeGreaterThanOrEqual(2)
    }
    const height = (id: string) => {
      const f = m.frames[id]
      return (f.visibleBounds[3] - f.visibleBounds[1]) * (f.renderScale ?? 1)
    }
    expect(
      Math.abs(height("battle.idle.0") - height("battle.hit.0")),
    ).toBeLessThan(55)
    expect(height("battle.defeat.3")).toBeLessThan(height("battle.hit.0"))
  })
})
