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
  const r = await server.ssrLoadModule("/src/aw2/combat/index.ts")
  const s = await server.ssrLoadModule("/dev/aw2/battleSession.ts")
  for (const level of [1, 5, 10, 20])
    for (const team of [undefined, "muoi", "nhien", "hai"])
      for (const policy of ["auto", "ultimate", "interrupt"]) {
        let b = s.createBattlePreviewSession(level, team).battle
        let maxLine = 0,
          blocked = 0,
          passives = 0,
          interrupted = 0
        const schedule = []
        for (let t = 0; t < 240 && b.status === "active"; t++) {
          if (policy === "ultimate")
            for (const actor of b.actors.filter(
              (a) =>
                a.side === "player" &&
                a.hp > 0 &&
                a.energy >= 100 &&
                !a.cast &&
                !r.nhienBusy(a, b.tick),
            )) {
              const target =
                actor.spiritId === "aw2-nhien"
                  ? r.nhienTargets(b, actor)[0]
                  : b.actors.find((a) => a.side === "enemy" && a.hp > 0)
              if (actor.spiritId === "aw2-nhien" && !target) continue
              b = r.castCombatUltimate(
                b,
                actor.id,
                ["aw2-lua", "aw2-suong", "aw2-muoi", "aw2-nhien"].includes(
                  actor.spiritId,
                )
                  ? target?.id
                  : undefined,
              )
            }
          if (policy === "interrupt") {
            const h = b.actors.find(
              (a) => a.spiritId === "aw2-hai" && a.hp > 0 && a.cast,
            )
            if (h) {
              b = r.interruptCombatCast(b, h.id)
              interrupted++
            }
          }
          const before = b.eventSerial
          const resumed = r.advanceCombatBattle(JSON.parse(JSON.stringify(b)))
          b = r.advanceCombatBattle(b)
          assert.deepEqual(b, resumed)
          for (const a of b.actors) {
            assert.ok(Number.isFinite(a.hp) && a.hp >= 0 && a.hp <= a.maxHp)
            assert.ok(a.energy >= 0 && a.energy <= 100)
            if (a.haiLine) {
              assert.ok(
                a.haiLine.remaining > 0 &&
                  a.haiLine.remaining <=
                    Math.max(1, Math.round(a.maxHp * 0.35)),
              )
              maxLine = Math.max(maxLine, a.haiLine.remaining)
            }
            if (a.hp <= 0) assert.ok(!a.haiLine && !a.haiZone)
          }
          const fresh = b.events.filter(
            (e) => e.serial > before && e.skillId?.startsWith("aw2-hai:"),
          )
          passives += fresh.filter((e) => e.kind === "shield").length
          blocked += fresh
            .filter((e) => e.statusEffect === "hai-block")
            .reduce((sum, e) => sum + e.amount, 0)
          if (team === "hai" && level === 5 && fresh.length)
            schedule.push({
              tick: b.tick,
              events: fresh.map((e) => ({
                kind: e.kind,
                slot: e.skillId.split(":").at(-1),
                status: e.statusEffect,
                amount: e.amount,
              })),
            })
        }
        assert.notEqual(b.status, "active")
        assert.ok(b.actors.every((a) => !a.haiLine && !a.haiZone))
        assert.equal(b.events.filter((e) => e.kind === "battle-end").length, 1)
        runs.push({
          level,
          team: team ?? "starter",
          policy,
          status: b.status,
          tick: b.tick,
          maxLine,
          blocked,
          passives,
          interrupted,
          ...(schedule.length ? { schedule } : {}),
        })
      }
  await mkdir(".asset-work/aw2-007g", { recursive: true })
  await writeFile(
    ".asset-work/aw2-007g/simulation.json",
    JSON.stringify(
      {
        task: "AW2-007G",
        status: "PASS",
        runs,
        limits: [
          "Provisional levels/seeds, not final balance or controlled team comparison",
          "No collection/economy/save grants; JSON replay of battle only",
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
      hai: runs
        .filter((r) => r.level === 5 && r.team === "hai")
        .map(({ schedule, ...run }) => run),
    }),
  )
} finally {
  await server.close()
}
