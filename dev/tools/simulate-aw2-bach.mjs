import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { createServer } from "vite"
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
  optimizeDeps: { noDiscovery: true, include: [] },
  logLevel: "error",
})
const runs = []
try {
  const r = await server.ssrLoadModule("/src/aw2/combat/index.ts")
  const s = await server.ssrLoadModule("/dev/aw2/battleSession.ts")
  for (const level of [1, 5, 10, 20])
    for (const team of [
      undefined,
      "muoi",
      "nhien",
      "hai",
      "lien",
      "moc",
      "bach",
    ])
      for (const policy of ["auto", "ultimate", "interrupt"]) {
        let b = s.createBattlePreviewSession(level, team).battle
        let damage = 0,
          shellGranted = 0,
          sharedGranted = 0,
          wardGranted = 0,
          personalConsumed = 0,
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
                !a.mocBurst &&
                !a.bachStrike &&
                !r.nhienBusy(a, b.tick),
            )) {
              const target = ["aw2-nhien", "aw2-moc"].includes(actor.spiritId)
                ? actor.spiritId === "aw2-moc"
                  ? r.mocEnemy(b, actor)
                  : r.nhienTargets(b, actor)[0]
                : b.actors.find((a) => a.side === "enemy" && a.hp > 0)
              if (["aw2-nhien", "aw2-moc"].includes(actor.spiritId) && !target)
                continue
              b = r.castCombatUltimate(
                b,
                actor.id,
                [
                  "aw2-lua",
                  "aw2-suong",
                  "aw2-muoi",
                  "aw2-nhien",
                  "aw2-moc",
                ].includes(actor.spiritId)
                  ? target?.id
                  : undefined,
              )
            }
          if (policy === "interrupt") {
            const actor = b.actors.find(
              (a) =>
                ["aw2-lien", "aw2-moc", "aw2-bach"].includes(a.spiritId) &&
                a.hp > 0 &&
                (a.cast || a.bachStrike),
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
            if (actor.mocMark)
              assert.ok(
                actor.mocMark.expiresAtTick > b.tick &&
                  actor.mocMark.expiresAtTick <= b.tick + 6,
              )
            if (actor.mocBurst)
              assert.ok(
                actor.mocBurst.resolveTick <= b.tick + 2 &&
                  actor.mocBurst.resolveTick > b.tick,
              )
            if (actor.bachStrike)
              assert.ok(
                actor.bachStrike.resolveTick === b.tick + 1 && !actor.cast,
              )
            if (actor.spiritId === "aw2-bach")
              assert.ok(
                (actor.bachGuarded ?? 0) >= 0 &&
                  (actor.bachGuarded ?? 0) <= r.bachThreshold(actor),
              )
            if (actor.hp <= 0)
              assert.ok(
                !actor.bachStrike &&
                  !actor.mocMark &&
                  !actor.mocBurst &&
                  !actor.lienHoT &&
                  !actor.lienUltimate,
              )
          }
          const fresh = b.events.filter(
            (e) => e.serial > before && e.skillId?.startsWith("aw2-bach:"),
          )
          damage += fresh
            .filter((e) => e.kind === "hit")
            .reduce((sum, e) => sum + (e.amount ?? 0) + (e.absorbed ?? 0), 0)
          shellGranted += fresh
            .filter((e) => e.kind === "shield" && e.skillId.endsWith(":auto"))
            .reduce((sum, e) => sum + e.amount, 0)
          sharedGranted += fresh
            .filter(
              (e) => e.kind === "shield" && e.skillId.endsWith(":passive"),
            )
            .reduce((sum, e) => sum + e.amount, 0)
          wardGranted += fresh
            .filter(
              (e) => e.kind === "shield" && e.skillId.endsWith(":ultimate"),
            )
            .reduce((sum, e) => sum + e.amount, 0)
          personalConsumed += fresh
            .filter((e) => e.statusEffect === "bach-release")
            .reduce((sum, e) => sum + e.amount, 0)
          assert.ok(wardGranted <= personalConsumed)
          if (team === "bach" && level === 5 && fresh.length)
            schedule.push({
              tick: b.tick,
              bach: b.actors.find((a) => a.spiritId === "aw2-bach"),
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
        assert.ok(
          b.actors.every(
            (a) =>
              !a.bachStrike &&
              !a.lienHoT &&
              !a.lienUltimate &&
              !a.mocMark &&
              !a.mocBurst,
          ),
        )
        assert.equal(b.events.filter((e) => e.kind === "battle-end").length, 1)
        runs.push({
          level,
          team: team ?? "starter",
          policy,
          status: b.status,
          tick: b.tick,
          damage,
          shellGranted,
          sharedGranted,
          wardGranted,
          personalConsumed,
          interrupted,
          ...(schedule.length ? { schedule } : {}),
        })
      }
  await mkdir(".asset-work/aw2-007j", { recursive: true })
  await writeFile(
    ".asset-work/aw2-007j/simulation.json",
    JSON.stringify(
      {
        task: "AW2-007J",
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
      bach: runs
        .filter((r) => r.level === 5 && r.team === "bach")
        .map(({ schedule, ...r }) => r),
    }),
  )
} finally {
  await server.close()
}
