import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { createServer } from "vite"

// Read the same pure seed factory as the world controller; no renderer/save writes.
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: "custom",
})
try {
  const core = await server.ssrLoadModule("/src/aw2/combat/index.ts")
  const kit = await server.ssrLoadModule("/src/aw2/combat/forgottenHost.ts")
  const outcomes = []
  for (const experience of [0, 160, 205])
    for (const strategy of [
      "auto-only",
      "ultimates-from-tick5",
      "hold-damage-ultimates-for-barrier",
    ]) {
      let battle = core.createCombatBattle({
        id: "boss-development-simulation",
        players: core.STARTER_SPIRIT_IDS.map((spiritId, slot) =>
          core.createDevelopmentStarterSeed(
            `player-${spiritId}`,
            spiritId,
            experience,
            { energy: 100, position: 12 + slot * 4 },
          ),
        ),
        enemies: [kit.createForgottenHostSeed()],
      })
      while (battle.status === "active" && battle.tick < 400) {
        const barrier = battle.actors.at(-1).bossKit.barrierHits
        if (strategy !== "auto-only" && battle.tick >= 5)
          for (const actor of battle.actors.filter(
            (actor) =>
              actor.side === "player" &&
              actor.hp > 0 &&
              actor.energy === 100 &&
              !actor.cast,
          )) {
            const offensive = ["aw2-lua", "aw2-suong"].includes(actor.spiritId)
            if (
              strategy === "hold-damage-ultimates-for-barrier" &&
              barrier > 0 &&
              offensive
            )
              continue
            battle = core.castCombatUltimate(
              battle,
              actor.id,
              offensive ? kit.FORGOTTEN_HOST_ID : undefined,
            )
          }
        battle = core.advanceCombatBattle(battle)
      }
      assert.notEqual(
        battle.status,
        "active",
        "Simulation must reach a real terminal",
      )
      outcomes.push({
        experience,
        strategy,
        result: battle.status,
        tick: battle.tick,
        survivingPlayers: battle.actors.filter(
          (actor) => actor.side === "player" && actor.hp > 0,
        ).length,
      })
    }
  assert.equal(
    outcomes[0].result,
    "enemy-win",
    "Level1 auto-only fixture must demonstrate a real loss",
  )
  assert.equal(
    outcomes[1].result,
    "player-win",
    "Five approved level1 starters must be able to win with ultimates",
  )
  assert.ok(
    outcomes[2].tick < outcomes[1].tick,
    "Saving damage ultimates for the barrier must improve this deterministic fixture",
  )
  assert.ok(
    outcomes.slice(3).every((outcome) => outcome.result === "player-win"),
    "Earned XP team must remain viable",
  )
  const report = {
    profile: kit.FORGOTTEN_HOST_PROFILE,
    seed: kit.createForgottenHostSeed(),
    status: "PASS development fixture, not final balance",
    outcomes,
  }
  await mkdir(".asset-work/aw2-007d", { recursive: true })
  await writeFile(
    ".asset-work/aw2-007d/boss-simulation.json",
    JSON.stringify(report, null, 2) + "\n",
  )
  console.log(JSON.stringify(report, null, 2))
} finally {
  await server.close()
}
