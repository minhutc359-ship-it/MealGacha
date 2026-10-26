import { defineConfig } from "vitest/config"
import { resolve } from "node:path"
import { createHash } from "node:crypto"
import { writeFileSync, mkdirSync } from "node:fs"

// QA-only environment allowance. Assertions, seeds, loop counts and test sources stay unchanged.
const paths = ["dev/tests/game/expedition.test.ts", "dev/tests/game/tcg470.test.ts"]
const transformed: unknown[] = []
export default defineConfig({
  resolve: { alias: { "@": resolve(process.cwd(), "src") } },
  plugins: [{
    name: "016b-legacy-simulation-time-allowance",
    enforce: "pre",
    transform(code, id) {
      const path = paths.find((path) => id.split("?")[0] === resolve(process.cwd(), path))
      if (!path) return
      const pattern = /(}\s*,\s*)20_?000(\s*\))/g
      const matches = [...code.matchAll(pattern)]
      if (matches.length !== 1) throw Error(`Unexpected timeout occurrences in ${path}: ${matches.length}`)
      const result = code.replace(pattern, "$1" + "120000" + "$2")
      const sha = (text: string) => createHash("sha256").update(text).digest("hex")
      transformed.push({ path, sourceSha256: sha(code), transformedSha256: sha(result), onlyChange: "One explicit timeout 20000ms → 120000ms", occurrences: 1 })
      mkdirSync(".asset-work/aw2-016b", { recursive: true })
      writeFileSync(".asset-work/aw2-016b/timeout-transform.json", JSON.stringify(transformed, null, 2) + "\n")
      return { code: result, map: null }
    },
  }],
  test: { include: paths, maxWorkers: 1, testTimeout: 120000 },
})
