// Deterministic strategy smoke test, not a claim about human difficulty.
import { createServer } from "vite"
import { writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
})
const { reduceAuto } = await server.ssrLoadModule(
  "/src/game/autochess/reducer.ts",
)
const { advanceCombat } = await server.ssrLoadModule(
  "/src/game/autochess/combat.ts",
)
const { UNIT_MAP } = await server.ssrLoadModule(
  "/src/game/autochess/catalog.ts",
)
const { capacity, boardPieces, copies } = await server.ssrLoadModule(
  "/src/game/autochess/economy.ts",
)
const { BENCH_SLOTS, MAX_LEVEL } = await server.ssrLoadModule("/src/game/autochess/config.ts")
const { equipPreview } = await server.ssrLoadModule("/src/game/autochess/items.ts")
const { autoSaveSchema } = await server.ssrLoadModule(
  "/src/game/autochess/schema.ts",
)
const { newGame } = await server.ssrLoadModule("/src/game/progression.ts")
const results = []
const supports = new Set(["heal", "leaves", "ginger", "feast"])
const focusSets = [
  ["ember", "hearth"],
  ["tide", "grove"],
  ["sugar", "hearth"],
]
for (const mode of ["campaign", "survival"])
  for (let strategy = 0; strategy < 3; strategy++)
    for (const seed of [1, 42, 987654321]) {
      let save = reduceAuto(undefined, {
        type: "start",
        mode,
        seed,
        day: "2026-10-08",
        id: `${mode}-${strategy}-${seed}`,
      }).save
      const act = (a) => {
        const out = reduceAuto(save, a)
        if (out.error) throw Error(out.error)
        save = out.save
      }
      const check = () => {
        const r = autoSaveSchema.safeParse(save)
        if (!r.success) throw Error(JSON.stringify(r.error.issues))
      }
      const rank = (p) => {
        const u = UNIT_MAP[p.id]
        return (
          p.star * 100 +
          (focusSets[strategy].includes(u.school) ? 18 : 0) +
          u.cost * 3 +
          (u.profession === "keeper" ? 4 : 0)
        )
      }
      let rounds = 0
      while (!["won", "lost"].includes(save.run.phase) && rounds++ < 120) {
        while (save.run.scene || save.run.combat?.pendingScene)
          act({ type: "dialogue" })
        while (save.run.phase === "reward")
          act({ type: "reward", id: save.run.reward.choices[0] })
        while (save.run.scene) act({ type: "dialogue" })
        if (save.run.phase === "result") {
          act({ type: "next" })
          continue
        }
        if (save.run.phase !== "prepare") throw Error(save.run.phase)
        let r = save.run
        // Spend enough to add slots gradually; avoid chasing exact shop contents.
        while (
          capacity(r.xp) < Math.min(MAX_LEVEL, 3 + Math.floor(r.wave / 2)) &&
          r.gold >= 8
        ) {
          act({ type: "xp" })
          r = save.run
        }
        for (let roll = 0; roll < 4; roll++) {
          for (let i = 0; i < 5; i++) {
            r = save.run
            const id = r.shop[i]
            if (!id || r.gold < UNIT_MAP[id].cost) continue
            const u = UNIT_MAP[id],
              owned = r.roster.some((p) => p.id === id)
            if (
              !owned &&
              !focusSets[strategy].includes(u.school) &&
              !(supports.has(u.skill) && !r.roster.some(p => supports.has(UNIT_MAP[p.id].skill))) &&
              r.roster.length >= capacity(r.xp)
            )
              continue
            if (
              r.roster.filter((p) => p.cell === null).length >= BENCH_SLOTS &&
              r.roster.filter((p) => p.id === id && p.star === 1).length < 2
            )
              continue
            const out = reduceAuto(save, { type: "buy", index: i })
            if (!out.error) save = out.save
          }
          if (roll < 3 && save.run.gold >= 12) act({ type: "reroll" })
          else break
        }
        r = save.run
        // Choose highest ranked pieces with at least a front-line keeper.
        const sorted = [...r.roster].sort((a, b) => rank(b) - rank(a)),
          keep = sorted.find((p) => UNIT_MAP[p.id].profession === "keeper")
        const support = sorted.find(p => p.uid !== keep?.uid && supports.has(UNIT_MAP[p.id].skill))
        const best = [
          ...(keep ? [keep] : []),
          ...(support ? [support] : []),
          ...sorted.filter((p) => p.uid !== keep?.uid && p.uid !== support?.uid),
        ].slice(0, capacity(r.xp))
        for (const old of boardPieces(save.run))
          if (!best.some((p) => p.uid === old.uid)) {
            if (save.run.roster.filter((p) => p.cell === null).length >= BENCH_SLOTS)
              act({ type: "sell", uid: old.uid })
            else act({ type: "move", uid: old.uid, cell: null })
          }
        const positioned = new Set()
        const front = [...Array(18)].map((_, i) => i + 18)
        const back = [...front.slice(12), ...front.slice(6, 12), ...front.slice(0, 6)]
        for (const p of best) {
          if (!save.run.roster.some((q) => q.uid === p.uid)) continue
          const order = UNIT_MAP[p.id].profession === "keeper" ? front : back
          const cell = order.find(cell => !positioned.has(cell))
          positioned.add(cell)
          act({
            type: "move",
            uid: p.uid,
            cell,
          })
        }
        for (const id of [...save.run.inventory]) {
          const target = best.find((p) => {
            const x = save.run.roster.find((q) => q.uid === p.uid)
            return x && equipPreview(x, id).valid
          })
          if (target) act({ type: "equip", uid: target.uid, item: id })
        }
        check()
        act({ type: "battle" })
        let ticks = 0
        while (!save.run.combat.result && ticks++ < 100) {
          let advanced = advanceCombat(save.run, 40)
          act({ type: "checkpoint", run: advanced })
          while (save.run.combat?.pendingScene) act({ type: "dialogue" })
          check()
        }
        if (!save.run.combat.result) throw Error("combat stalled")
      }
      while (save.run.scene) act({ type: "dialogue" })
      if (save.run.phase === "won") act({ type: "ending", choice: "hall" })
      check()
      results.push({
        mode,
        strategy,
        seed,
        phase: save.run.phase,
        wave: save.run.bestWave,
        attempts: save.run.rounds,
        health: save.run.health,
        score: save.run.score,
        seconds: save.run.activeTicks / 20,
        finished: save.run.finished,
        recorded: save.records.some(record => record.id === save.run.id),
      })
      if (mode === "campaign" && save.run.phase === "won")
        writeFileSync(
          path.join(tmpdir(), "autochess-final-fixture.json"),
          JSON.stringify({ ...newGame(), autoChess: save }),
        )
    }
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 2))
// Defeat now ends a run immediately, including with willpower left.
// Validate terminal recording; old clear targets relied on retrying lost rounds.
if (results.some(r => !["won", "lost"].includes(r.phase) || !r.finished || !r.recorded))
  throw Error("A simulated run did not finish and record its score")
if (
  results
    .filter((r) => r.mode === "survival")
    .some((r) => r.phase !== "lost")
)
  throw Error("Survival did not terminate")
await server.close()
