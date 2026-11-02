import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { ULTIMATE_ART } from "@/aw2/assets/ultimateArt"
import { latestUltimateArtCue } from "@/aw2/assets/ultimatePresentation"
import { SPIRIT_IDS } from "@/aw2/world/ids"
import { ROSTER_ASSETS } from "@/aw2/assets/roster"
import {
  createCombatBattle,
  castCombatUltimate,
  advanceCombatBattle,
} from "@/aw2/combat"

const hash = (data: Uint8Array) =>
  createHash("sha256").update(data).digest("hex")
function fixture(spiritId = "aw2-than", energy = 100) {
  return createCombatBattle({
    id: `ultimate-art:${spiritId}`,
    players: [
      {
        id: "p",
        spiritId,
        energy,
        position: 20,
        nextBasicTick: 10000,
        nextAutoTick: 10000,
      },
    ],
    enemies: [
      {
        id: "e",
        spiritId: "enemy",
        maxHp: 10000,
        hp: 10000,
        position: 26,
        nextBasicTick: 10000,
        nextAutoTick: 10000,
      },
    ],
  })
}

describe("AW2 original ultimate illustration pack", () => {
  it("covers exactly the twelve immutable identities with distinct source images", () => {
    expect(Object.keys(ULTIMATE_ART)).toEqual([...SPIRIT_IDS])
    expect(
      new Set(Object.values(ULTIMATE_ART).map((art) => art.source.sha256)).size,
    ).toBe(12)
    expect(
      Object.values(ULTIMATE_ART).reduce((sum, art) => sum + art.bytes, 0),
    ).toBeLessThanOrEqual(26_000_000)
  })
  it.each(SPIRIT_IDS)(
    "verifies preserved source, runtime and prompt bytes for %s",
    async (id) => {
      const art = ULTIMATE_ART[id]
      const runtime = await readFile(art.url.slice(1))
      expect(runtime.byteLength).toBe(art.bytes)
      expect(hash(runtime)).toBe(art.sha256)
      expect(hash(await readFile(art.source.path))).toBe(art.source.sha256)
      const prompts = await readFile(
        art.source.path.replace("art.png", "prompts.json"),
      )
      expect(hash(prompts)).toBe(art.promptSha256)
      const data = JSON.parse(prompts.toString())
      expect(data.spiritId).toBe(id)
      expect(data.externalInputs).toEqual([])
      expect(data.referenceInputs).toHaveLength(1)
      expect(art.width * art.height * 4).toBeLessThanOrEqual(8_000_000)
      expect(art.transparentFraction).toBeGreaterThan(0.005)
    },
  )
  it.each(SPIRIT_IDS)(
    "reads an accepted real ultimate for %s without changing combat",
    (id) => {
      const initial = fixture(id)
      const cast = castCombatUltimate(initial, "p", "e")
      const bytes = JSON.stringify(cast)
      expect(latestUltimateArtCue(cast, initial.eventSerial)).toMatchObject({
        spiritId: id,
        displayName: ROSTER_ASSETS[id].displayName,
        skillName: ROSTER_ASSETS[id].skills.ultimate.displayName,
        side: "player",
        battleId: cast.id,
      })
      expect(JSON.stringify(cast)).toBe(bytes)
      expect(latestUltimateArtCue(cast, cast.eventSerial)).toBeNull()
    },
  )
  it("does not present rejected commands, ordinary attacks or old tick history", () => {
    const denied = fixture("aw2-than", 0)
    expect(() => castCombatUltimate(denied, "p")).toThrow()
    expect(latestUltimateArtCue(denied, 0)).toBeNull()
    const accepted = castCombatUltimate(fixture(), "p")
    expect(latestUltimateArtCue(advanceCombatBattle(accepted), 0)).toBeNull()
  })
  it("bounds simultaneous casts to the latest event and rejects forged actor/skill identities", () => {
    const cast = castCombatUltimate(fixture(), "p")
    const event = cast.events.find((event) => event.kind === "cast-start")!
    cast.events.push({ ...event, serial: event.serial + 1 })
    expect(latestUltimateArtCue(cast, 0)?.serial).toBe(event.serial + 1)
    cast.events = [{ ...event, skillId: "aw2-lua:skill:ultimate" }]
    expect(latestUltimateArtCue(cast, 0)).toBeNull()
    cast.events = [{ ...event, sourceId: "missing" }]
    expect(latestUltimateArtCue(cast, 0)).toBeNull()
    cast.events = [{ ...event, kind: "cast-commit" }]
    expect(latestUltimateArtCue(cast, 0)).toBeNull()
  })
  it("keeps completed battles and the enemy-only boss out of spirit cut-ins", () => {
    const cast = castCombatUltimate(fixture(), "p")
    cast.status = "player-win"
    expect(latestUltimateArtCue(cast, 0)).toBeNull()
    cast.status = "active"
    cast.actors[0].spiritId = "aw2-enemy-forgotten-host"
    expect(latestUltimateArtCue(cast, 0)).toBeNull()
  })
})
