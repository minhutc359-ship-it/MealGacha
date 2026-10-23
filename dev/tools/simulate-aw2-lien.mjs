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
    for (const team of [undefined, "muoi", "nhien", "hai", "lien"])
      for (const policy of ["auto", "ultimate", "interrupt"]) {
        let b = s.createBattlePreviewSession(level, team).battle
        let healed = 0,
          cleansed = 0,
          guards = 0,
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
                !a.lienUltimate &&
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
            const actor = b.actors.find(
              (a) => a.spiritId === "aw2-lien" && a.hp > 0 && a.cast,
            )
            if (actor) {
              b = r.interruptCombatCast(b, actor.id)
              interrupted++
            }
          }
          const before = b.eventSerial
          const replay = r.advanceCombatBattle(JSON.parse(JSON.stringify(b)))
          b = r.advanceCombatBattle(b)
          assert.deepEqual(b, replay)
          for (const actor of b.actors) {
            assert.ok(
              Number.isFinite(actor.hp) &&
                actor.hp >= 0 &&
                actor.hp <= actor.maxHp,
            )
            assert.ok(actor.energy >= 0 && actor.energy <= 100)
            if (actor.lienHoT)
              assert.ok(
                actor.lienHoT.index < 3 &&
                  actor.lienHoT.nextPulseTick <= b.tick + 2,
              )
            if (actor.lienUltimate)
              assert.ok(
                actor.lienUltimate.index < 2 &&
                  actor.lienUltimate.targetIds.length <= 5,
              )
            assert.ok(Object.keys(actor.lienGuardCooldowns ?? {}).length <= 5)
            if (actor.hp <= 0) assert.ok(!actor.lienHoT && !actor.lienUltimate)
          }
          const fresh = b.events.filter(
            (e) => e.serial > before && e.skillId?.startsWith("aw2-lien:"),
          )
          healed += fresh
            .filter((e) => e.kind === "heal")
            .reduce((sum, e) => sum + e.amount, 0)
          cleansed += fresh.filter(
            (e) => e.statusEffect === "lien-cleanse",
          ).length
          guards += fresh.filter((e) => e.statusEffect === "lien-guard").length
          if (team === "lien" && level === 5 && fresh.length)
            schedule.push({
              tick: b.tick,
              lien: b.actors.find((a) => a.spiritId === "aw2-lien"),
              events: fresh.map((e) => ({
                kind: e.kind,
                slot: e.skillId.split(":").at(-1),
                status: e.statusEffect,
                index: e.contactIndex,
                amount: e.amount,
                targets: e.targetIds,
              })),
            })
        }
        assert.notEqual(b.status, "active")
        assert.ok(b.actors.every((a) => !a.lienHoT && !a.lienUltimate))
        assert.equal(b.events.filter((e) => e.kind === "battle-end").length, 1)
        runs.push({
          level,
          team: team ?? "starter",
          policy,
          status: b.status,
          tick: b.tick,
          healed,
          cleansed,
          guards,
          interrupted,
          ...(schedule.length ? { schedule } : {}),
        })
      }
  await mkdir(".asset-work/aw2-007h", { recursive: true })
  await writeFile(
    ".asset-work/aw2-007h/simulation.json",
    JSON.stringify(
      {
        task: "AW2-007H",
        status: "PASS",
        runs,
        limits: [
          "Development seeds/policies, not final balance or controlled team comparison",
          "No collection/save grants; each tick JSON replay verified",
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
      lien: runs
        .filter((r) => r.level === 5 && r.team === "lien")
        .map(({ schedule, ...r }) => r),
    }),
  )
} finally {
  await server.close()
}
