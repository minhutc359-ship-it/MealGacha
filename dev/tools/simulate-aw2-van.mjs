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
  const r = await server.ssrLoadModule("/src/aw2/combat/index.ts"),
    s = await server.ssrLoadModule("/dev/aw2/battleSession.ts")
  for (const level of [1, 5, 10, 20])
    for (const team of [
      undefined,
      "muoi",
      "nhien",
      "hai",
      "lien",
      "moc",
      "bach",
      "van-protection",
      "van-attack",
    ])
      for (const policy of ["auto", "ultimate", "interrupt"]) {
        const emphasis = team === "van-attack" ? "attack" : "protection",
          practice = team?.startsWith("van-") ? "van" : team
        let b = s.createBattlePreviewSession(level, practice, emphasis).battle
        let support = 0,
          heal = 0,
          ultShield = 0,
          ultDamage = 0,
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
              const needs =
                [
                  "aw2-lua",
                  "aw2-suong",
                  "aw2-muoi",
                  "aw2-nhien",
                  "aw2-moc",
                ].includes(actor.spiritId) ||
                (actor.spiritId === "aw2-van" &&
                  r.vanEmphasis(actor) === "attack")
              const target = b.actors
                .filter(
                  (a) =>
                    a.side === "enemy" &&
                    a.hp > 0 &&
                    (!["aw2-nhien", "aw2-moc", "aw2-van"].includes(
                      actor.spiritId,
                    ) ||
                      Math.abs(a.position - actor.position) <= actor.range),
                )
                .sort(
                  (a, c) =>
                    Math.abs(a.position - actor.position) -
                      Math.abs(c.position - actor.position) || a.slot - c.slot,
                )[0]
              if (needs && !target) continue
              b = r.castCombatUltimate(
                b,
                actor.id,
                needs ? target?.id : undefined,
              )
            }
          if (policy === "interrupt") {
            const actor = b.actors.find(
              (a) =>
                ["aw2-lien", "aw2-moc", "aw2-bach", "aw2-van"].includes(
                  a.spiritId,
                ) &&
                a.hp > 0 &&
                (a.cast || a.bachStrike),
            )
            if (actor) {
              b = r.interruptCombatCast(b, actor.id)
              interrupted++
            }
          }
          const before = b.eventSerial,
            replay = r.advanceCombatBattle(JSON.parse(JSON.stringify(b)))
          b = r.advanceCombatBattle(b)
          assert.deepEqual(b, replay)
          for (const actor of b.actors) {
            assert.ok(
              actor.hp >= 0 &&
                actor.hp <= actor.maxHp &&
                actor.energy >= 0 &&
                actor.energy <= 100,
            )
            if (actor.spiritId === "aw2-van") {
              assert.equal(r.vanEmphasis(actor), emphasis)
              if (actor.vanLink) {
                assert.ok(actor.vanLink.supportedShield >= 0)
                assert.ok(
                  actor.vanLink.endsAtTick > b.tick &&
                    actor.vanLink.endsAtTick <= b.tick + 4,
                )
              }
              if (actor.hp <= 0) assert.equal(actor.vanLink, undefined)
            }
          }
          const fresh = b.events.filter(
            (e) => e.serial > before && e.skillId?.startsWith("aw2-van:"),
          )
          for (const e of fresh) {
            if (e.kind === "shield" && e.skillId.endsWith(":auto"))
              support += e.amount
            if (e.kind === "heal") heal += e.amount
            if (e.kind === "shield" && e.skillId.endsWith(":ultimate"))
              ultShield += e.amount
            if (e.kind === "hit" && e.skillId.endsWith(":ultimate"))
              ultDamage += (e.amount ?? 0) + (e.absorbed ?? 0)
            if (e.kind === "heal")
              assert.ok(
                e.amount <=
                  Math.round(
                    b.actors.find((a) => a.id === e.sourceId).attack * 0.25 + 4,
                  ),
              )
          }
          assert.ok(heal <= support)
          if (emphasis === "attack") assert.equal(ultShield, 0)
          else assert.equal(ultDamage, 0)
          if (practice === "van" && level === 5 && fresh.length)
            schedule.push({
              tick: b.tick,
              van: b.actors.find((a) => a.spiritId === "aw2-van"),
              events: fresh,
            })
        }
        assert.notEqual(b.status, "active")
        assert.ok(b.actors.every((a) => !a.vanLink))
        assert.equal(b.events.filter((e) => e.kind === "battle-end").length, 1)
        runs.push({
          level,
          team: team ?? "starter",
          policy,
          status: b.status,
          tick: b.tick,
          support,
          heal,
          ultShield,
          ultDamage,
          interrupted,
          ...(schedule.length ? { schedule } : {}),
        })
      }
  await mkdir(".asset-work/aw2-007k", { recursive: true })
  await writeFile(
    ".asset-work/aw2-007k/simulation.json",
    JSON.stringify(
      {
        task: "AW2-007K",
        status: "PASS",
        runs,
        limits: [
          "Development seeds/policies, not final balance",
          "Each tick JSON replay/mode/budgets/terminal verified",
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
      van: runs
        .filter((r) => r.level === 5 && r.team.startsWith("van"))
        .map(({ schedule, ...r }) => r),
    }),
  )
} finally {
  await server.close()
}
