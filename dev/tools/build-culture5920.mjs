import { readFileSync, writeFileSync } from "node:fs"
const pages = JSON.parse(readFileSync("dev/content/culture5920.json", "utf8"))
if (pages.length !== 9 || new Set(pages.map(p => p.id)).size !== 9 || pages.some(p => p.steps?.length !== 3 || p.steps.some(s => s.choices?.filter(c => c.advance).length !== 1))) throw Error("Invalid culture content")
const target = "public/assets/culture5920/journeys.json", output = JSON.stringify(pages) + "\n"
if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8") !== output) throw Error("Stale culture content. Run node dev/tools/build-culture5920.mjs")
} else writeFileSync(target, output)
console.log(JSON.stringify({ pages: pages.length, steps: pages.reduce((n, p) => n + p.steps.length, 0), checking: process.argv.includes("--check") }))
