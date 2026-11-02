import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { createServer } from "vite"
const rematch = process.argv.includes("--rematch")
const task = rematch ? "AW2-007M" : "AW2-007L"
const out = rematch ? ".asset-work/aw2-007m" : ".asset-work/aw2-007l"
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
  optimizeDeps: { noDiscovery: true, include: [] },
  logLevel: "error",
})
try {
  const combat = await server.ssrLoadModule("/src/aw2/combat/index.ts"),
    encounters = await server.ssrLoadModule("/src/aw2/world/encounter.ts"),
    world = await server.ssrLoadModule("/src/aw2/world/model.ts"),
    ids = await server.ssrLoadModule("/src/aw2/world/ids.ts"),
    collection = await server.ssrLoadModule("/src/aw2/collection/model.ts"),
    economy = await server.ssrLoadModule("/src/aw2/economy/model.ts"),
    save = await server.ssrLoadModule("/src/aw2/save/schema.ts")
  const starter = [...ids.STARTER_TEAM],
    configs = [
      { name: "starter", party: starter, mode: "protection" },
      ...["muoi", "nhien", "hai", "lien", "moc", "bach"].map((name) => ({
        name,
        party: starter.map((id) =>
          id ===
          {
            muoi: "aw2-suong",
            nhien: "aw2-lua",
            hai: "aw2-than",
            lien: "aw2-lam",
            moc: "aw2-moc-non",
            bach: "aw2-than",
          }[name]
            ? `aw2-${name}`
            : id,
        ),
        mode: "protection",
      })),
      ...["protection", "attack"].flatMap((mode) => [
        {
          name: `van-${mode}`,
          party: starter.map((id) => (id === "aw2-moc-non" ? "aw2-van" : id)),
          mode,
        },
        {
          name: `mixed-${mode}`,
          party: ["aw2-hai", "aw2-nhien", "aw2-moc", "aw2-lien", "aw2-van"],
          mode,
        },
        {
          name: `shield-${mode}`,
          party: ["aw2-bach", "aw2-muoi", "aw2-moc", "aw2-lien", "aw2-van"],
          mode,
        },
      ]),
    ]
  const runs = []
  for (const level of rematch ? [1, 3, 5, 10, 20] : [1, 5, 10, 20])
    for (const config of configs)
      for (const policy of ["auto", "ultimate"]) {
        const data = save.aw2DevSaveSchema.parse({
          gameId: "adventure-world-2",
          environment: "development",
          schemaVersion: 5,
          saveId: "00000000-0000-4000-8000-000000000001",
          revision: 8,
          createdAt: "2026-10-20T08:00:00.000Z",
          updatedAt: "2026-10-20T08:00:00.000Z",
          progress: {
            ...world.newWorldProgress(),
            zoneId: ids.ZONE_IDS[5],
            x: 96,
            y: 192,
            questIndex: rematch ? 4 : 3,
            accepted: !rematch,
            ...(rematch
              ? {
                  bossDefeated: true,
                  tableNoteRead: true,
                  endingChoice: "wait",
                }
              : {}),
            tableRead: true,
            memories: [...ids.MEMORY_IDS],
            threadChoice: "wait",
            hintRead: true,
            puzzleStep: 3,
            partyIds: config.party,
          },
          economy: {
            ...economy.newEconomy(),
            teamExperience: combat.experienceToReachLevel(level),
          },
          collection: {
            recruitedIds: [...collection.RECRUIT_IDS],
            vanEmphasis: config.mode,
          },
        })
        const raw = JSON.stringify(data),
          run = encounters.createWorldBossEncounter(
            raw,
            rematch ? "rematch" : "quest",
          ),
          commits = new Set()
        for (
          let tick = 0;
          tick < 300 && run.snapshot().battle.status === "active";
          tick++
        ) {
          let b = run.snapshot().battle
          if (policy === "ultimate")
            for (const a of b.actors.filter(
              (a) =>
                a.side === "player" &&
                a.hp > 0 &&
                a.energy >= 100 &&
                !a.cast &&
                !a.lienUltimate &&
                !a.mocBurst &&
                !a.bachStrike &&
                !combat.nhienBusy(a, b.tick),
            )) {
              const boss = b.actors.find((a) => a.side === "enemy" && a.hp > 0)
              if (!boss) break
              if (
                (["aw2-nhien", "aw2-moc"].includes(a.spiritId) ||
                  (a.spiritId === "aw2-van" && a.vanEmphasis === "attack")) &&
                Math.abs(a.position - boss.position) > a.range
              )
                continue
              run.ultimate(a.id)
            }
          b = run.snapshot().battle
          const replay = combat.advanceCombatBattle(
            JSON.parse(JSON.stringify(b)),
          )
          run.advance()
          const after = run.snapshot().battle
          assert.deepEqual(after, replay)
          assert.deepEqual(
            after.actors
              .filter((a) => a.side === "player")
              .map((a) => a.spiritId),
            config.party,
          )
          for (const a of after.actors) {
            assert.ok(
              a.hp >= 0 && a.hp <= a.maxHp && a.energy >= 0 && a.energy <= 100,
            )
            if (a.spiritId === "aw2-van")
              assert.equal(a.vanEmphasis, config.mode)
          }
          for (const e of after.events)
            if (e.kind === "cast-commit" && e.skillId?.endsWith(":ultimate"))
              commits.add(e.skillId)
        }
        const end = run.snapshot()
        assert.notEqual(end.battle.status, "active")
        assert.equal(JSON.stringify(data), raw)
        let result
        await encounters.commitWorldBossEncounter(
          run,
          raw,
          async (progress) => {
            result = save.aw2DevSaveSchema.parse({
              ...data,
              revision: 9,
              progress,
            })
            return result
          },
        )
        assert.deepEqual(result.collection, data.collection)
        assert.deepEqual(result.economy, data.economy)
        assert.deepEqual(result.progress.partyIds, config.party)
        assert.equal(
          result.progress.bossDefeated,
          rematch || end.battle.status === "player-win",
        )
        if (rematch) {
          const nonspatial = ({ zoneId, x, y, facing, ...p }) => p
          assert.deepEqual(
            nonspatial(result.progress),
            nonspatial(data.progress),
          )
        }
        runs.push({
          level,
          config: config.name,
          policy,
          status: end.battle.status,
          tick: end.battle.tick,
          ultimates: [...commits],
        })
      }
  await mkdir(out, { recursive: true })
  await writeFile(
    `${out}/simulation.json`,
    JSON.stringify(
      {
        task,
        status: "PASS",
        runs,
        limits: [
          "Development fixture snapshots, not earned browser journeys or final balance",
          "Real private controller, every-tick JSON replay and authenticated settlement verified",
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
      level1: runs
        .filter((r) => r.level === 1)
        .map((r) => ({
          team: r.config,
          policy: r.policy,
          result: r.status,
          tick: r.tick,
        })),
    }),
  )
} finally {
  await server.close()
}
