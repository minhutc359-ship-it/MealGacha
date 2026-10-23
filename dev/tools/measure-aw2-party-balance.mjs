import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { createServer } from "vite"
import { PARTY_BALANCE_CASES } from "./aw2-party-balance-cases.mjs"
const out = ".asset-work/aw2-007n"
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
  optimizeDeps: { noDiscovery: true, include: [] },
  logLevel: "error",
})
try {
  const combat = await server.ssrLoadModule("/src/aw2/combat/index.ts"),
    { Aw2DevSaveStore } = await server.ssrLoadModule("/src/aw2/save/store.ts"),
    world = await server.ssrLoadModule("/src/aw2/world/model.ts"),
    ids = await server.ssrLoadModule("/src/aw2/world/ids.ts"),
    { RECRUIT_IDS } = await server.ssrLoadModule(
      "/src/aw2/collection/model.ts",
    ),
    { newEconomy } = await server.ssrLoadModule("/src/aw2/economy/model.ts"),
    save = await server.ssrLoadModule("/src/aw2/save/schema.ts")
  const runs = []
  for (const xp of [205, 345])
    for (const config of PARTY_BALANCE_CASES)
      for (const policy of ["auto", "ready-after-five", "counterplay"]) {
        const rematch = xp === 345,
          purpose = rematch ? "rematch" : "quest"
        const data = save.aw2DevSaveSchema.parse({
          gameId: "adventure-world-2",
          environment: "development",
          schemaVersion: 5,
          saveId: "00000000-0000-4000-8000-000000000001",
          revision: 8,
          createdAt: "2026-10-23T08:00:00.000Z",
          updatedAt: "2026-10-23T08:00:00.000Z",
          progress: {
            ...world.newWorldProgress(),
            zoneId: ids.ZONE_IDS[5],
            x: 320,
            y: 128,
            questIndex: rematch ? 4 : 3,
            accepted: !rematch,
            tableRead: true,
            memories: [...ids.MEMORY_IDS],
            threadChoice: "wait",
            hintRead: true,
            puzzleStep: 3,
            partyIds: config.party,
            ...(rematch
              ? {
                  bossDefeated: true,
                  tableNoteRead: true,
                  endingChoice: "wait",
                }
              : {}),
          },
          economy: { ...newEconomy(), teamExperience: xp },
          collection: {
            recruitedIds: [...RECRUIT_IDS],
            vanEmphasis: config.emphasis,
          },
        })
        const raw = JSON.stringify(data),
          storage = new Map([
            [save.AW2_DEV_SAVE_KEY, raw],
            ["foodchest.user.v1", "stable-original"],
          ])
        let queue = Promise.resolve()
        const store = new Aw2DevSaveStore({
          storage: () => ({
            getItem: (k) => storage.get(k) ?? null,
            setItem: (k, v) => {
              assert.equal(k, save.AW2_DEV_SAVE_KEY)
              storage.set(k, v)
            },
          }),
          lock: (action) => {
            const p = queue.then(action)
            queue = p.then(
              () => undefined,
              () => undefined,
            )
            return p
          },
          now: () => "2026-10-23T09:00:00.000Z",
        })
        const { snapshot, encounter } = await store.beginBoss(
          raw,
          data.progress,
          purpose,
        )
        const events = new Map(),
          commands = [],
          remember = () => {
            for (const e of encounter.snapshot().battle.events)
              if (!events.has(e.serial)) events.set(e.serial, e)
          }
        remember()
        for (
          let step = 0;
          step < 240 && encounter.snapshot().battle.status === "active";
          step++
        ) {
          let b = encounter.snapshot().battle
          if (policy !== "auto" && b.tick >= 5)
            for (const id of config.party) {
              b = encounter.snapshot().battle
              if (b.status !== "active") break
              const a = b.actors.find(
                  (a) => a.side === "player" && a.spiritId === id,
                ),
                boss = b.actors.find((a) => a.side === "enemy" && a.hp > 0)
              if (
                !a ||
                !boss ||
                a.hp <= 0 ||
                a.energy < 100 ||
                a.cast ||
                a.lienUltimate ||
                a.mocBurst ||
                a.bachStrike ||
                combat.nhienBusy(a, b.tick)
              )
                continue
              if (
                (["aw2-nhien", "aw2-moc"].includes(id) ||
                  (id === "aw2-van" && a.vanEmphasis === "attack")) &&
                Math.abs(a.position - boss.position) > a.range
              )
                continue
              const damage =
                [
                  "aw2-lua",
                  "aw2-suong",
                  "aw2-muoi",
                  "aw2-nhien",
                  "aw2-moc",
                ].includes(id) ||
                (id === "aw2-van" && a.vanEmphasis === "attack")
              const healer = ["aw2-lam", "aw2-lien"].includes(id)
              if (policy === "counterplay") {
                const wounded = b.actors.some(
                  (a) =>
                    a.side === "player" && a.hp > 0 && a.hp / a.maxHp < 0.7,
                )
                if (
                  damage
                    ? boss.bossKit.barrierHits > 0
                    : healer
                      ? !wounded
                      : !boss.bossKit.intent && !wounded
                )
                  continue
              }
              encounter.ultimate(a.id)
              const after = encounter.snapshot().battle
              assert.equal(after.actors.find((x) => x.id === a.id).energy, 0)
              commands.push({
                tick: b.tick,
                actor: id,
                skillId: `${id}:skill:ultimate`,
                barrierHits: boss.bossKit.barrierHits,
                warning: boss.bossKit.intent?.kind ?? null,
              })
              remember()
            }
          b = encounter.snapshot().battle
          if (b.status !== "active") break
          const replay = combat.advanceCombatBattle(
            JSON.parse(JSON.stringify(b)),
          )
          encounter.advance()
          remember()
          const next = encounter.snapshot().battle
          assert.deepEqual(next, replay)
          for (const a of next.actors) {
            assert.ok(Number.isFinite(a.hp) && a.hp >= 0 && a.hp <= a.maxHp)
            assert.ok(a.energy >= 0 && a.energy <= 100)
          }
        }
        const battle = encounter.snapshot().battle
        assert.notEqual(
          battle.status,
          "active",
          `${xp}/${config.name}/${policy} timed out`,
        )
        assert.equal(
          [...events.values()].filter((e) => e.kind === "battle-end").length,
          1,
        )
        const settled = await store.finishBoss(snapshot.raw, encounter)
        const nonspatial = ({ zoneId, x, y, facing, bossDefeated, ...p }) => p
        assert.deepEqual(
          nonspatial(settled.save.progress),
          nonspatial(data.progress),
        )
        assert.deepEqual(settled.save.economy, data.economy)
        assert.deepEqual(settled.save.collection, data.collection)
        assert.equal(
          settled.save.progress.bossDefeated,
          rematch || battle.status === "player-win",
        )
        assert.equal(storage.get("foodchest.user.v1"), "stable-original")
        await assert.rejects(() => store.finishBoss(snapshot.raw, encounter))
        assert.equal(store.load().raw, settled.raw)
        const allEvents = [...events.values()].sort(
            (a, b) => a.serial - b.serial,
          ),
          rows = battle.actors.map((a) => ({
            id: a.id,
            spiritId: a.spiritId,
            side: a.side,
            hp: a.hp,
            maxHp: a.maxHp,
            hpDamageDealt: allEvents
              .filter((e) => e.kind === "hit" && e.sourceId === a.id)
              .reduce((n, e) => n + (e.amount ?? 0), 0),
            hpRestored: allEvents
              .filter((e) => e.kind === "heal" && e.sourceId === a.id)
              .reduce((n, e) => n + (e.amount ?? 0), 0),
            shieldGranted: allEvents
              .filter((e) => e.kind === "shield" && e.sourceId === a.id)
              .reduce((n, e) => n + (e.amount ?? 0), 0),
            interrupted: allEvents.filter(
              (e) => e.kind === "interrupt" && e.sourceId === a.id,
            ).length,
          }))
        runs.push({
          xp,
          level: combat.developmentProgression(xp).level,
          purpose,
          config: config.name,
          party: config.party,
          emphasis: config.emphasis,
          policy,
          status: battle.status,
          tick: battle.tick,
          survivors: rows.filter((a) => a.side === "player" && a.hp > 0).length,
          bossHp: rows.find((a) => a.side === "enemy").hp,
          actors: rows,
          commands,
          events: allEvents,
          checkpointSha256: createHash("sha256")
            .update(snapshot.raw)
            .digest("hex"),
        })
      }
  assert.equal(runs.length, 96)
  for (const xp of [205, 345])
    assert.ok(
      runs.some(
        (r) =>
          r.xp === xp &&
          r.config === "starter" &&
          r.policy !== "auto" &&
          r.status === "player-win",
      ),
      "Starter must have a legal earned-XP clear",
    )
  for (const id of ids.SPIRIT_IDS)
    assert.ok(
      runs.some((r) => r.party.includes(id)),
      id,
    )
  const summary = [205, 345].flatMap((xp) =>
    ["auto", "ready-after-five", "counterplay"].map((policy) => ({
      xp,
      policy,
      wins: runs.filter(
        (r) => r.xp === xp && r.policy === policy && r.status === "player-win",
      ).length,
      losses: runs.filter(
        (r) => r.xp === xp && r.policy === policy && r.status === "enemy-win",
      ).length,
      draws: runs.filter(
        (r) => r.xp === xp && r.policy === policy && r.status === "draw",
      ).length,
    })),
  )
  await mkdir(out, { recursive: true })
  await writeFile(
    `${out}/balance.json`,
    JSON.stringify(
      {
        task: "AW2-007N",
        status: "PASS",
        summary,
        runs,
        limits: [
          "Predeclared deterministic development fixture matrix at earned XP amounts, not96human playtests or a random win-rate estimate",
          "All kit stats/rules/save/rewards unchanged; policies are legal timing examples, not optimal play",
          "Every command/unique event retained; hit amounts are HP damage, heal amounts actual restored HP, shield amounts granted protection (not absorbed damage)",
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
      summary,
      starter: runs
        .filter((r) => r.config === "starter")
        .map(({ xp, policy, status, tick }) => ({ xp, policy, status, tick })),
    }),
  )
} finally {
  await server.close()
}
