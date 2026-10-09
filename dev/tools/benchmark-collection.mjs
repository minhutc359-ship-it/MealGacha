// Offline acquisition experiment, not a prediction of real retention or completion time.
// Run from the repo: node scripts/benchmark-collection.mjs [output.json]
import { createServer } from "vite"
import { writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const vite = await createServer({ root, logLevel: "error" })
try {
  const { CARDS, RARITIES } = await vite.ssrLoadModule("/src/game/catalog.ts")
  const { PACKS, newGame, grantCard, openPack } = await vite.ssrLoadModule(
    "/src/game/progression.ts",
  )
  const original = structuredClone(RARITIES),
    prices = PACKS.map((p) => p.coinCost)
  const result = {
    catalog: {
      cards: CARDS.length,
      byRarity: Object.fromEntries(
        Object.keys(RARITIES).map((r) => [
          r,
          CARDS.filter((c) => c.rarity === r).length,
        ]),
      ),
    },
    policy:
      "200 fixed seeds per scenario; paid origin packs only; craft cheapest missing card whenever affordable; unique cards, not two copies. No stage/quest/daily rewards or trades. Food-import scenario grants each food once using grantCard, as legacy import does.",
    scenarios: {},
  }
  for (const scenario of ["starter", "all-foods-imported"]) {
    result.scenarios[scenario] = {}
    for (const mode of ["old", "new"]) {
      for (const [rarity, value] of Object.entries(RARITIES))
        value.dust =
          mode === "old"
            ? { common: 25, rare: 70, epic: 180, legendary: 400 }[rarity]
            : original[rarity].dust
      PACKS.forEach((p, i) => {
        p.coinCost = mode === "old" ? 100 : prices[i]
      })
      const ordered = [...CARDS].sort(
        (a, b) =>
          RARITIES[a.rarity].dust - RARITIES[b.rarity].dust ||
          a.id.localeCompare(b.id),
      )
      const rows = []
      let ownedStart = 0
      for (let seed = 1; seed <= 200; seed++) {
        let state = seed
        const rng = () => {
          state = (Math.imul(state, 1664525) + 1013904223) >>> 0
          return state / 4294967296
        }
        let save = { ...newGame(), coins: 10000000, packTickets: 0 },
          paid = 0
        if (scenario === "all-foods-imported")
          for (const card of CARDS.filter((c) =>
            c.art?.startsWith("/assets/food/"),
          ))
            save = grantCard(save, card.id)
        ownedStart = Object.values(save.cards).filter((n) => n > 0).length
        const targets = {}
        for (let pack = 0; pack <= 2000; pack++) {
          for (const card of ordered)
            if (!save.cards[card.id] && save.dust >= RARITIES[card.rarity].dust)
              save = grantCard(
                { ...save, dust: save.dust - RARITIES[card.rarity].dust },
                card.id,
              )
          const owned = Object.values(save.cards).filter((n) => n > 0).length
          for (const fraction of [0.8, 0.9, 1])
            if (
              !targets[fraction] &&
              owned >= Math.ceil(CARDS.length * fraction)
            )
              targets[fraction] = { packs: pack, coins: paid }
          if (owned === CARDS.length) break
          const next = openPack(save, "origin", rng)
          paid += save.coins - next.save.coins
          save = next.save
        }
        if (!targets[1])
          throw Error("Collection did not finish within the experiment limit")
        rows.push(targets)
      }
      const quantile = (ns, q) =>
        [...ns].sort((a, b) => a - b)[Math.floor((ns.length - 1) * q)]
      result.scenarios[scenario][mode] = {
        ownedStart,
        targets: Object.fromEntries(
          [0.8, 0.9, 1].map((fraction) => [
            fraction,
            {
              samples: rows.length,
              medianPacks: quantile(
                rows.map((r) => r[fraction].packs),
                0.5,
              ),
              medianCoins: quantile(
                rows.map((r) => r[fraction].coins),
                0.5,
              ),
              p10Packs: quantile(
                rows.map((r) => r[fraction].packs),
                0.1,
              ),
              p90Packs: quantile(
                rows.map((r) => r[fraction].packs),
                0.9,
              ),
            },
          ]),
        ),
      }
    }
  }
  const json = JSON.stringify(result, null, 2)
  if (process.argv[2]) writeFileSync(resolve(process.argv[2]), json + "\n")
  console.log(json)
} finally {
  await vite.close()
}
