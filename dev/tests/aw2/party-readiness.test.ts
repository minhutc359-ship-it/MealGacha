import { describe, expect, it } from "vitest"
import { describeDevelopmentParty } from "@/aw2/collection/readiness"
import {
  STARTER_SPIRIT_IDS,
  COMBAT_KITS,
  type CombatSpiritId,
} from "@/aw2/combat/roster"
import {
  createDevelopmentCombatSeed,
  experienceToReachLevel,
} from "@/aw2/combat/progression"
const starters = [...STARTER_SPIRIT_IDS]
const mixed = ["aw2-hai", "aw2-nhien", "aw2-moc", "aw2-lien", "aw2-van"]

describe("PARTY-READINESS-01 advisory matches actual encounter actors", () => {
  it.each([0, 119, 120, 205, 289, 290, 345, experienceToReachLevel(20)])(
    "projects actual seed HP/attack/defense at %iXP for every kit without mutating draft",
    (xp) => {
      const ids = Object.keys(COMBAT_KITS) as CombatSpiritId[]
      for (const id of ids) {
        const party = [...new Set([id, ...starters])].slice(0, 5)
        const before = JSON.stringify(party)
        const description = describeDevelopmentParty(party, xp, "attack")
        const actual = createDevelopmentCombatSeed("actual", id, xp, {
          vanEmphasis: "attack",
        })
        const member = description.members.find((m) => m.spiritId === id)!
        expect(member.maxHp).toBe(actual.maxHp)
        expect(member.attack).toBe(actual.attack)
        expect(member.defense).toBe(actual.defense)
        expect(member.role).toBe(COMBAT_KITS[id].role)
        expect(JSON.stringify(party)).toBe(before)
        member.maxHp = 0
        expect(
          describeDevelopmentParty(party, xp, "attack").members.find(
            (m) => m.spiritId === id,
          )?.maxHp,
        ).toBe(actual.maxHp)
      }
    },
  )
  it("keeps Mộc and Mộc Non separate and Vân hybrid for either emphasis, without predicting results", () => {
    const party = ["aw2-bach", "aw2-lien", "aw2-moc-non", "aw2-moc", "aw2-van"]
    for (const emphasis of ["attack", "protection"] as const) {
      const team = describeDevelopmentParty(party, 345, emphasis)
      expect(team.members.find((m) => m.spiritId === "aw2-moc")?.role).toBe(
        "mage",
      )
      expect(team.members.find((m) => m.spiritId === "aw2-moc-non")?.role).toBe(
        "support",
      )
      expect(team.members.find((m) => m.spiritId === "aw2-van")).toMatchObject({
        role: "hybrid",
        vanEmphasis: emphasis,
      })
      expect(team).toMatchObject({
        tanks: 1,
        healers: 1,
        damageSpecialists: 1,
        level: 3,
      })
      expect(team).not.toHaveProperty("winProbability")
    }
    expect(describeDevelopmentParty(mixed, 205, "protection")).toMatchObject({
      tanks: 1,
      healers: 1,
      damageSpecialists: 2,
      level: 2,
    })
  })
  it("identifies missing dedicated roles without counting Hybrid as a substitute", () => {
    expect(
      describeDevelopmentParty(
        ["aw2-lua", "aw2-nhien", "aw2-lam", "aw2-moc-non", "aw2-suong"],
        205,
        "protection",
      ).tanks,
    ).toBe(0)
    expect(
      describeDevelopmentParty(
        ["aw2-than", "aw2-lua", "aw2-van", "aw2-moc-non", "aw2-suong"],
        205,
        "protection",
      ).healers,
    ).toBe(0)
    const team = describeDevelopmentParty(
      ["aw2-than", "aw2-hai", "aw2-bach", "aw2-lien", "aw2-van"],
      345,
      "attack",
    )
    expect(team).toMatchObject({ tanks: 3, healers: 1, damageSpecialists: 0 })
  })
  it.each([
    { party: [] },
    { party: starters.slice(0, 4) },
    { party: [...starters, "aw2-van"] },
    { party: ["aw2-than", "aw2-than", ...starters.slice(2)] },
    { party: ["aw2-boss", ...starters.slice(1)] },
    { party: ["aw2-enemy-forgotten-host", ...starters.slice(1)] },
  ])(
    "rejects incomplete/duplicate/unknown/enemy selection $party",
    ({ party }) => {
      expect(() => describeDevelopmentParty(party, 205, "protection")).toThrow()
    },
  )
  it("rejects invalid XP/emphasis and returns detached data with no ownership/grant fields", () => {
    for (const xp of [
      -1,
      0.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.MAX_SAFE_INTEGER + 1,
    ])
      expect(() =>
        describeDevelopmentParty(starters, xp, "protection"),
      ).toThrow()
    expect(() =>
      describeDevelopmentParty(starters, 205, "invalid" as never),
    ).toThrow()
    const team = describeDevelopmentParty(starters, 205, "protection")
    expect(team.members.map((m) => m.spiritId)).toEqual(starters)
    expect(team).not.toHaveProperty("recruitedIds")
    expect(team).not.toHaveProperty("rewards")
  })
})
