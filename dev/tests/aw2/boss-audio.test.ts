import { expect, it } from "vitest"
import { bossAudioCues } from "@/aw2/combat/bossAudio"
import { FORGOTTEN_HOST_ASSETS as art } from "@/aw2/assets/forgottenHost"
import { createCombatBattle, advanceCombatBattle } from "@/aw2/combat"
import { createForgottenHostSeed } from "@/aw2/combat/forgottenHost"

it("binds all four boss cues to real confirmed events, without per-target replay or forecast audio", () => {
  let battle = createCombatBattle({
    id: "boss-audio",
    players: [0, 1, 2].map((n) => ({
      id: `p${n}`,
      spiritId: "aw2-than",
      hp: 50000,
      maxHp: 50000,
      position: 50,
      nextBasicTick: 999,
      nextAutoTick: 999,
    })),
    enemies: [{ ...createForgottenHostSeed(), position: 50 }],
  })
  for (let n = 0; n < 27; n++) battle = advanceCombatBattle(battle)
  const cues = bossAudioCues(battle.events, 0)
  for (const asset of Object.values(art.audio))
    expect(cues.some((cue) => cue.url === asset.url)).toBe(true)
  expect(bossAudioCues(battle.events, battle.eventSerial)).toEqual([])
  const forecasts = battle.events.filter((e) =>
    ["cast-start", "cast-commit", "miss"].includes(e.kind),
  )
  expect(bossAudioCues(forecasts, 0)).toEqual([])
  const sweep = battle.events.filter(
    (e) => e.kind === "hit" && e.skillId === art.skills.sweep.id,
  )
  expect(sweep.length).toBeGreaterThan(1)
  expect(bossAudioCues(sweep, 0)).toHaveLength(1)
  expect(bossAudioCues(sweep, sweep[0].serial)).toEqual([])
})
