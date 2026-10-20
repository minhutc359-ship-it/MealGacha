import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"

const { values } = parseArgs({
  options: {
    url: {
      type: "string",
      default: "http://127.0.0.1:8452/dev/aw2/battle.html",
    },
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
  },
})
const { chromium } = await import(values.playwright)
const browser = await chromium.launch({
  executablePath: values.chromium,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})
const out = ".asset-work/aw2-007b"
await mkdir(out, { recursive: true })
const checks = [],
  errors = [],
  failed = []
const check = (name, condition = true) => {
  assert.ok(condition, name)
  checks.push(name)
}
const original = {
  "foodchest.tcg.v1": "stable tcg bytes",
  "foodchest.user.v1": "stable user bytes",
  "aw2.development.save": "original aw2 bytes",
}

try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    reducedMotion: "no-preference",
  })
  await context.addInitScript(
    (original) =>
      Object.entries(original).forEach(([key, value]) =>
        localStorage.setItem(key, value),
      ),
    original,
  )
  const page = await context.newPage()
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("response", (response) => {
    if (response.status() >= 400) failed.push(response.url())
  })
  await page.goto(values.url)
  await page
    .getByTestId("battle-atlas-state")
    .filter({ hasText: "Năm atlas chiến đấu đã tải" })
    .waitFor()
  check(
    "Five starter ultimate cards render",
    (await page.locator("[data-testid^=unit-aw2-]").count()) === 5,
  )
  check(
    "Canvas draws authored atlas pixels",
    await page.locator("canvas").evaluate((canvas) => {
      const data = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data
      let visible = 0
      for (let index = 3; index < data.length; index += 4)
        if (data[index] > 64) visible++
      return visible > 100000
    }),
  )
  const initialTick = Number(
    await page.locator("canvas").getAttribute("data-tick"),
  )
  await page.waitForFunction(
    (tick) => Number(document.querySelector("canvas").dataset.tick) > tick,
    initialTick,
  )
  check("Auto combat advances core ticks")

  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  const pausedTick = await page.locator("canvas").getAttribute("data-tick")
  await page.waitForTimeout(900)
  check(
    "Pause freezes core ticks",
    (await page.locator("canvas").getAttribute("data-tick")) === pausedTick,
  )
  await page.getByRole("button", { name: "Bước 1 nhịp", exact: true }).click()
  await page.waitForFunction(
    (tick) =>
      Number(document.querySelector("canvas").dataset.tick) ===
      Number(tick) + 1,
    pausedTick,
  )
  check("Manual step advances exactly one tick")

  await page.getByLabel("Cấp thử nghiệm").selectOption("10")
  await page.getByRole("button", { name: "Tạo lại trận", exact: true }).click()
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  check(
    "Level reset applies development stats without persistence",
    (await page.getByTestId("unit-aw2-than").innerText()).includes("Cấp 10"),
  )
  await page.getByTestId("ultimate-aw2-lua").click()
  check(
    "Manual ultimate emits core cast event and spends energy",
    (await page.getByTestId("event-log").innerText()).includes("cast-start") &&
      !(await page.getByTestId("ultimate-aw2-lua").isEnabled()),
  )

  await page.getByRole("button", { name: "Tạo lại trận", exact: true }).click()
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  let sawProjectile = false
  for (let step = 0; step < 8 && !sawProjectile; step++) {
    await page.getByRole("button", { name: "Bước 1 nhịp", exact: true }).click()
    sawProjectile =
      Number(await page.locator("canvas").getAttribute("data-projectiles")) > 0
  }
  check("Projectile remains visible after authoritative launch", sawProjectile)
  let settled = false
  for (let step = 0; step < 4 && !settled; step++) {
    await page.getByRole("button", { name: "Bước 1 nhịp", exact: true }).click()
    settled =
      Number(await page.locator("canvas").getAttribute("data-projectiles")) ===
        0 && (await page.getByTestId("event-log").innerText()).includes("hit")
  }
  check("Authoritative hit settles projectile presentation", settled)

  await page.getByLabel("Giảm chuyển động").check()
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.reduced === "true",
  )
  check("Reduced motion reaches renderer while outcomes remain readable")
  await page.screenshot({ path: `${out}/desktop.png`, fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  check(
    "Mobile viewport has no horizontal overflow",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  )
  await page.screenshot({ path: `${out}/mobile.png`, fullPage: true })

  const preserved = await page.evaluate(
    (keys) =>
      Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)])),
    Object.keys(original),
  )
  check(
    "Battle preview leaves stable and AW2 save bytes unchanged",
    JSON.stringify(preserved) === JSON.stringify(original),
  )
  check(
    "No primary-context browser errors or failed requests",
    errors.length === 0 && failed.length === 0,
  )
  await context.close()

  const blocked = await browser.newContext()
  await blocked.route("**/assets/than/base-v1/battle.webp", (route) =>
    route.abort(),
  )
  const missing = await blocked.newPage()
  await missing.goto(values.url)
  await missing
    .getByRole("alert")
    .filter({ hasText: "Không tải được atlas" })
    .waitFor()
  check("Missing authored atlas reports a visible error")
  await blocked.close()

  const reducedContext = await browser.newContext({ reducedMotion: "reduce" })
  const reduced = await reducedContext.newPage()
  await reduced.goto(values.url)
  check(
    "System reduced-motion preference initializes the control",
    await reduced.getByLabel("Giảm chuyển động").isChecked(),
  )
  await reducedContext.close()

  const report = {
    task: "AW2-007B",
    status: "PASS",
    engine: `Chromium ${browser.version()}`,
    viewports: ["1280x1000", "390x844"],
    checks,
    errors,
    failed,
    limits: [
      "development renderer only",
      "no physical device/performance/save/boss/reward/final-balance approval",
    ],
  }
  await writeFile(`${out}/browser.json`, JSON.stringify(report, null, 2) + "\n")
  console.log(
    JSON.stringify({
      status: "PASS",
      checks: checks.length,
      report: `${out}/browser.json`,
    }),
  )
} catch (error) {
  await writeFile(
    `${out}/browser.json`,
    JSON.stringify(
      {
        task: "AW2-007B",
        status: "FAIL",
        checks,
        errors,
        failed,
        failure: String(error),
      },
      null,
      2,
    ) + "\n",
  )
  throw error
} finally {
  await browser.close()
}
