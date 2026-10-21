import { simulatePopulation } from "../../src/aw2/gacha/simulator.ts"
// Node 24 native type stripping. This process has no browser/save/spend access.
console.log(JSON.stringify(simulatePopulation(), null, 2))
