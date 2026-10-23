import assert from "node:assert/strict"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { createHash } from "node:crypto"
import { parseArgs } from "node:util"
import { preview } from "vite"
const { values } = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
    earned: { type: "string" },
  },
})
assert.ok(
  values.earned,
  "Supply an authentic completed journey report with checkpointRaw",
)
const text = await readFile(values.earned, "utf8"),
  data = JSON.parse(text),
  raw = data.checkpointRaw ?? data.observedRaw,
  save = JSON.parse(raw)
assert.equal(save.progress.questIndex, 4)
assert.equal(save.progress.zoneId, "aw2-zone-kitchen-table")
const server = await preview({
  configFile: "dev/vite.aw2.config.ts",
  preview: { host: "127.0.0.1", port: 8524, strictPort: true },
})
const { chromium } = await import(values.playwright)
let browser
const out = ".asset-work/aw2-006b",
  checks = [],
  observedErrors = [],
  key = "aw2.development.save"
const check = (name, condition = true) => {
  assert.ok(condition, name)
  checks.push(name)
  console.log(name)
}
try {
  await mkdir(out, { recursive: true })
  browser = await chromium.launch({
    executablePath: values.chromium,
    headless: true,
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  })
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    }),
    page = await context.newPage()
  page.on("pageerror", (error) => observedErrors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") observedErrors.push(message.text())
  })
  await page.goto("http://127.0.0.1:8524/dev/aw2/world.html")
  await page.evaluate(
    ({ key, raw }) => {
      localStorage.setItem(key, raw)
      localStorage.setItem("foodchest.user.v1", "room-failure-original")
    },
    { key, raw },
  )
  const route = "**/dev/aw2/assets/environments/kitchen-table/v1/floor.webp*"
  await context.route(route, (r) =>
    r.fulfill({ status: 404, body: "deliberate QA missing floor" }),
  )
  await page.reload()
  const alert = page.getByTestId("world-map").getByRole("alert")
  await alert.waitFor()
  check(
    "Missing authored floor produces visible load error instead of a completed fallback",
    /Bản đồ/.test(await alert.textContent()) &&
      (await page
        .locator('canvas[data-scene-id="aw2-environment-kitchen-table-v1"]')
        .count()) === 0,
  )
  check(
    "All room waypoint controls remain disabled while required art failed",
    await page
      .getByTestId("table-room-waypoints")
      .getByRole("button")
      .evaluateAll((bs) => bs.length === 4 && bs.every((b) => b.disabled)),
  )
  check(
    "Failed scene load preserves exact completed save and legacy bytes",
    await page.evaluate(
      ({ key, raw }) =>
        localStorage.getItem(key) === raw &&
        localStorage.getItem("foodchest.user.v1") === "room-failure-original",
      { key, raw },
    ),
  )
  await page.screenshot({
    path: `${out}/compiled-room-missing.png`,
    fullPage: true,
  })
  await context.unroute(route)
  const errorCount = observedErrors.length
  await page.reload()
  await page
    .locator('canvas[data-scene-id="aw2-environment-kitchen-table-v1"]')
    .waitFor()
  await page
    .getByTestId("world-map")
    .locator(".aw2-map-loading")
    .waitFor({ state: "hidden" })
  check(
    "Reload after asset recovery restores authored scene and native controls",
    (await page
      .getByTestId("room-waypoint-aw2-enemy-forgotten-host")
      .isEnabled()) &&
      (await page.getByTestId("world-map").getByRole("alert").count()) === 0,
  )
  check(
    "Successful recovery writes no quest/XP/ending/legacy changes",
    await page.evaluate(
      ({ key, raw }) =>
        localStorage.getItem(key) === raw &&
        localStorage.getItem("foodchest.user.v1") === "room-failure-original",
      { key, raw },
    ),
  )
  check(
    "No new console/page errors after required asset was restored",
    observedErrors.length === errorCount,
  )
  await writeFile(
    `${out}/failure-recovery.json`,
    JSON.stringify(
      {
        task: "AW2-006B",
        status: "PASS",
        checks,
        expectedFailure: "Deliberate404 for floor.webp",
        observedErrors,
        earned: {
          source: values.earned,
          sha256: createHash("sha256").update(text).digest("hex"),
          checkpointSha256: createHash("sha256").update(raw).digest("hex"),
        },
        engine: browser.version(),
      },
      null,
      2,
    ) + "\n",
  )
  console.log(JSON.stringify({ status: "PASS", checks: checks.length }))
} finally {
  await browser?.close()
  await new Promise((r) => server.httpServer.close(r))
}
