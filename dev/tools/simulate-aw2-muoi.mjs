import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { createServer } from "vite"
const server = await createServer({
  configFile: "dev/vite.aw2.config.ts",
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
})
const runs = []
try {
  const rules = await server.ssrLoadModule("/src/aw2/combat/index.ts")
  const sessions = await server.ssrLoadModule("/dev/aw2/battleSession.ts")
  for (const level of [1, 5, 10, 20])
    for (const team of [undefined, "muoi"])
      for (const strategy of ["auto", "ultimate", "cleanse"]) {
        let b = sessions.createBattlePreviewSession(level, team).battle
        let maxTargets = 0,
          maxLife = 0,
          dispel = 0,
          refresh = 0
        const ticks = []
        for (let t = 0; t < 180 && b.status === "active"; t++) {
          if (strategy === "ultimate")
            for (const a of b.actors.filter(
              (a) =>
                a.side === "player" && a.hp > 0 && a.energy >= 100 && !a.cast,
            )) {
              const target = b.actors.find(
                (e) => e.side === "enemy" && e.hp > 0,
              )
              b = rules.castCombatUltimate(
                b,
                a.id,
                ["aw2-lua", "aw2-suong", "aw2-muoi"].includes(a.spiritId)
                  ? target?.id
                  : undefined,
              )
            }
          if (strategy === "cleanse")
            for (const target of b.actors.filter(
              (a) =>
                a.side === "enemy" &&
                a.hp > 0 &&
                Object.keys(a.muoiMarks ?? {}).length,
            ))
              b = rules.cleanseMuoiMarks(b, target.id)
          const serial = b.eventSerial
          b = rules.advanceCombatBattle(b)
          const events = b.events.filter((e) => e.serial > serial)
          dispel += events
            .filter((e) => e.statusChange === "dispel")
            .reduce((n, e) => n + (e.amount ?? 0), 0)
          refresh += events.filter((e) => e.statusChange === "refresh").length
          for (const source of b.actors.filter(
            (a) => a.spiritId === "aw2-muoi",
          )) {
            const owned = b.actors.flatMap((a) =>
              a.muoiMarks?.[source.id] ? [a.muoiMarks[source.id]] : [],
            )
            maxTargets = Math.max(maxTargets, owned.length)
            for (const mark of owned) {
              assert.ok(mark.expiresAtTick <= mark.capTick)
              maxLife = Math.max(maxLife, mark.expiresAtTick - mark.appliedTick)
            }
          }
          if (team === "muoi" && level === 5 && strategy === "auto")
            ticks.push({
              tick: b.tick,
              events: events
                .filter((e) => e.skillId?.startsWith("aw2-muoi:"))
                .map((e) => ({
                  serial: e.serial,
                  kind: e.kind,
                  slot: e.skillId.split(":").at(-1),
                  change: e.statusChange,
                  target: e.targetIds[0],
                })),
            })
        }
        assert.notEqual(b.status, "active")
        assert.ok(maxTargets <= 1 && maxLife <= 10)
        assert.equal(b.events.filter((e) => e.kind === "battle-end").length, 1)
        assert.ok(b.actors.every((a) => !Object.keys(a.muoiMarks ?? {}).length))
        runs.push({
          level,
          team: team ?? "starter",
          strategy,
          status: b.status,
          tick: b.tick,
          playerHp: b.actors
            .filter((a) => a.side === "player")
            .reduce((n, a) => n + a.hp, 0),
          maxTargets,
          maxLife,
          dispel,
          refresh,
          ...(ticks.length ? { ticks } : {}),
        })
      }
  await mkdir(".asset-work/aw2-007e", { recursive: true })
  await writeFile(
    ".asset-work/aw2-007e/simulation.json",
    JSON.stringify(
      {
        task: "AW2-007E",
        status: "PASS",
        runs,
        limits: [
          "Provisional development seeds, not final balance",
          "Different team positions/opponent distance in the two preview presets; not a controlled DPS ranking",
          "Cleanse is explicit counterplay in practice, not automatic product enemy AI",
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
      muoiAutoLevel5: runs.find(
        (r) => r.level === 5 && r.team === "muoi" && r.strategy === "auto",
      ),
    }),
  )
} finally {
  await server.close()
}
