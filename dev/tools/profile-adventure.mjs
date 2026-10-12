import { spawn } from "node:child_process"
import { writeFileSync } from "node:fs"
import assert from "node:assert/strict"
const server = spawn("pnpm", ["dev", "--host", "127.0.0.1", "--port", "4187"], {
  stdio: "ignore",
})
process.on("exit", () => server.kill())
for (let n = 0; n < 150; n++) {
  try {
    await fetch("http://127.0.0.1:4187")
    break
  } catch {
    await new Promise((r) => setTimeout(r, 100))
  }
}
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright")
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  headless: true,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
  env: {
    ...process.env,
    LD_LIBRARY_PATH: process.env.CHROMIUM_LIB_DIR || "/tmp",
  },
})
const rows = []
for (const [width, height, rate] of [
  [1440, 900, 1],
  [390, 844, 4],
]) {
  const context = await browser.newContext({ viewport: { width, height } }),
    page = await context.newPage(),
    errors = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.goto("http://127.0.0.1:4187/adventure", {
    waitUntil: "domcontentloaded",
  })
  await page.locator(".adv-starter-grid button").first().click()
  await page.locator(".adv-world-viewport").waitFor()
  await page.evaluate(async () => {
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    useGameStore.getState().adventureAction({ type: "dismiss" })
    useGameStore.setState((s) => ({
      save: {
        ...s.save,
        adventure: { ...s.save.adventure, x: 2, y: 14, message: null },
      },
    }))
  })
  await page.waitForTimeout(500)
  const client = await context.newCDPSession(page)
  await client.send("Performance.enable")
  await client.send("Emulation.setCPUThrottlingRate", { rate })
  const metrics = async () =>
    Object.fromEntries(
      (await client.send("Performance.getMetrics")).metrics.map((m) => [
        m.name,
        m.value,
      ]),
    )
  const before = await metrics()
  const sample = await page.evaluate(async () => {
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    let mutations = 0,
      writes = 0
    const samples = [],
      observer = new MutationObserver(
        (records) => (mutations += records.length),
      ),
      original = Storage.prototype.setItem
    Storage.prototype.setItem = function (...args) {
      writes++
      return original.apply(this, args)
    }
    observer.observe(document.querySelector(".adv-map-frame"), {
      subtree: true,
      attributes: true,
      childList: true,
      characterData: true,
    })
    const initial = useGameStore.getState().save.adventure.steps
    for (let n = 0; n < 36; n++) {
      const start = performance.now()
      assertMove(useGameStore.getState().adventureAction({
          type: "move",
          direction: n < 18 ? "right" : "left",
        }))
      samples.push(performance.now() - start)
      await new Promise((r) => setTimeout(r, 170))
    }
    function assertMove(result) {
      if (!result) throw Error("Move rejected")
    }
    observer.disconnect()
    Storage.prototype.setItem = original
    samples.sort((a, b) => a - b)
    return {
      steps: useGameStore.getState().save.adventure.steps - initial,
      mutations,
      writes,
      synchronousStepMeanMs:
        samples.reduce((a, b) => a + b, 0) / samples.length,
      synchronousStepP95Ms: samples[Math.floor(samples.length * 0.95)],
      worldElements: document.querySelectorAll(".adv-world-viewport *").length,
      worldTileButtons: document.querySelectorAll(".adv-world-tile").length,
    }
  })
  const after = await metrics()
  assert.equal(sample.steps, 36)
  const row = {
    width,
    height,
    cpuRate: rate,
    ...sample,
    scriptSeconds: after.ScriptDuration - before.ScriptDuration,
    layoutSeconds: after.LayoutDuration - before.LayoutDuration,
    recalcSeconds: after.RecalcStyleDuration - before.RecalcStyleDuration,
    taskSeconds: after.TaskDuration - before.TaskDuration,
    layoutCount: after.LayoutCount - before.LayoutCount,
    recalcCount: after.RecalcStyleCount - before.RecalcStyleCount,
    errors,
  }
  assert.deepEqual(errors, [])
  rows.push(row)
  await page.screenshot({
    path: `/tmp/adv-profile-${process.env.PROFILE_LABEL || "sample"}-${width}.png`,
  })
  await context.close()
}
writeFileSync(
  `/tmp/adv-profile-${process.env.PROFILE_LABEL || "sample"}.json`,
  JSON.stringify(rows, null, 2),
)
console.log(JSON.stringify(rows, null, 2))
await browser.close()
server.kill()
