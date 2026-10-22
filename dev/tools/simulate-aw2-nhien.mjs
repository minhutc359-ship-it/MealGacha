import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { createServer } from "vite"
const server = await createServer({
  configFile: "dev/vite.aw2.config.ts",
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
})
const runs = []
try {
  const rules = await server.ssrLoadModule("/src/aw2/combat/index.ts")
  const sessions = await server.ssrLoadModule("/dev/aw2/battleSession.ts")
  for (const level of [1, 5, 10, 20])
    for (const team of [undefined, "muoi", "nhien"])
      for (const strategy of ["auto", "ultimate", "interrupt"]) {
        let b = sessions.createBattlePreviewSession(level, team).battle
        let interrupted = 0,
          maxGranted = 0,
          maxProcs = 0,
          maxWindowTargets = 0,
          terminalCount = 0
        const ticks = []
        for (let t = 0; t < 180 && b.status === "active"; t++) {
          if (strategy === "ultimate")
            for (const actor of b.actors.filter(
              (a) =>
                a.side === "player" &&
                a.hp > 0 &&
                a.energy >= 100 &&
                !a.cast &&
                !rules.nhienBusy(a, b.tick),
            )) {
              const target =
                actor.spiritId === "aw2-nhien"
                  ? rules.nhienTargets(b, actor)[0]
                  : b.actors.find((a) => a.side === "enemy" && a.hp > 0)
              if (actor.spiritId === "aw2-nhien" && !target) continue
              b = rules.castCombatUltimate(
                b,
                actor.id,
                ["aw2-lua", "aw2-suong", "aw2-muoi", "aw2-nhien"].includes(
                  actor.spiritId,
                )
                  ? target?.id
                  : undefined,
              )
            }
          if (strategy === "interrupt") {
            const n = b.actors.find(
              (a) =>
                a.spiritId === "aw2-nhien" &&
                a.side === "player" &&
                a.hp > 0 &&
                (a.cast || (a.nhienSequence?.nextIndex ?? 0) >= 1),
            )
            if (n) {
              b = rules.interruptCombatCast(b, n.id)
              interrupted++
            }
          }
          const serial = b.eventSerial
          b = rules.advanceCombatBattle(b)
          const events = b.events.filter((e) => e.serial > serial)
          terminalCount += events.filter((e) => e.kind === "battle-end").length
          const n = b.actors.find(
            (a) => a.side === "player" && a.spiritId === "aw2-nhien",
          )
          if (n) {
            maxGranted = Math.max(maxGranted, n.nhienRhythm?.energyGranted ?? 0)
            maxProcs = Math.max(maxProcs, n.nhienRhythm?.procs ?? 0)
            maxWindowTargets = Math.max(
              maxWindowTargets,
              n.nhienRhythm?.targetIds.length ?? 0,
            )
            assert.ok(
              n.energy >= 0 &&
                n.energy <= 100 &&
                maxGranted <= 24 &&
                maxProcs <= 3 &&
                maxWindowTargets <= 2,
            )
            assert.ok(
              !n.nhienSequence ||
                n.nhienSequence.nextIndex <
                  rules.nhienMultipliers(n.nhienSequence.slot).length,
            )
          }
          if (team === "nhien" && level === 5)
            ticks.push({
              tick: b.tick,
              events: events
                .filter((e) => e.skillId?.startsWith("aw2-nhien:"))
                .map((e) => ({
                  serial: e.serial,
                  kind: e.kind,
                  skill: e.skillId,
                  contactIndex: e.contactIndex,
                  actionId: e.actionId,
                  amount: e.amount,
                  targetIds: e.targetIds,
                  text: e.text,
                })),
              energy: n?.energy,
              position: n?.position,
              recoveryUntil: n?.nhienRecoveryUntilTick,
              sequence: n?.nhienSequence,
            })
        }
        assert.notEqual(b.status, "active")
        assert.equal(terminalCount, 1)
        assert.ok(
          b.actors.every((a) => !a.nhienSequence && !a.nhienRecoveryUntilTick),
        )
        runs.push({
          level,
          team: team ?? "starter",
          strategy,
          status: b.status,
          tick: b.tick,
          playerHp: b.actors
            .filter((a) => a.side === "player")
            .reduce((s, a) => s + a.hp, 0),
          interrupted,
          maxGranted,
          maxProcs,
          maxWindowTargets,
          ...(ticks.length ? { ticks } : {}),
        })
      }
  await mkdir(".asset-work/aw2-007f", { recursive: true })
  await writeFile(
    ".asset-work/aw2-007f/simulation.json",
    JSON.stringify(
      {
        task: "AW2-007F",
        status: "PASS",
        runs,
        limits: [
          "Provisional development seeds, not final balance or controlled DPS comparison; default and optional presets use different opponent distances",
          "Explicit interrupt policy is practice counterplay, not product enemy AI",
          "No collection/economy/save grants",
        ],
      },
      null,
      2,
    ) + "\n",
  )
  console.log(
    JSON.stringify({
      status: "PASS",
      runs: runs.length,
      nhienLevel5: runs
        .filter((r) => r.level === 5 && r.team === "nhien")
        .map(({ ticks, ...r }) => r),
    }),
  )
} finally {
  await server.close()
}
