import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"
const { values } = parseArgs({
  options: {
    compiled: { type: "boolean", default: false },
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
  },
})
const { chromium } = await import(values.playwright)
const flavor = values.compiled ? "compiled" : "source",
  port = values.compiled ? 8489 : 8488,
  root = `http://127.0.0.1:${port}`,
  out = ".asset-work/aw2-007g"
const server = values.compiled
  ? await preview({
      configFile: "dev/vite.aw2.config.ts",
      preview: { host: "127.0.0.1", port, strictPort: true },
    })
  : await createServer({
      configFile: "dev/vite.dev.config.ts",
      server: { host: "127.0.0.1", port, strictPort: true },
    })
const checks = [],
  errors = [],
  saved = {
    "aw2.development.save": "preserve-aw2",
    "foodchest.user.v1": "preserve-user",
    "foodchest.tcg.v1": "preserve-tcg",
  }
const check = (name, value = true) => {
  assert.ok(value, name)
  checks.push(name)
  console.log(name)
}
let browser, page
try {
  if (!values.compiled) await server.listen()
  await mkdir(out, { recursive: true })
  browser = await chromium.launch({
    executablePath: values.chromium,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
  })
  await context.addInitScript((saved) => {
    for (const [key, value] of Object.entries(saved))
      localStorage.setItem(key, value)
    window.__haiAudio = []
    window.__haiDraws = { count: 0, invalid: 0 }
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      window.__haiAudio.push(this.src)
      return play.call(this)
    }
    const draw = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      if (
        args[0] instanceof HTMLImageElement &&
        args[0].src.includes("/hai/base-v1/")
      ) {
        window.__haiDraws.count++
        if (
          args.length !== 9 ||
          args[1] < 0 ||
          args[2] < 0 ||
          args[1] + args[3] > args[0].naturalWidth ||
          args[2] + args[4] > args[0].naturalHeight
        )
          window.__haiDraws.invalid++
      }
      return draw.apply(this, args)
    }
  }, saved)
  page = await context.newPage()
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (e) => {
    if (e.type() === "error") errors.push(e.text())
  })
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
  })
  const state = async () =>
    JSON.parse(await page.getByTestId("hai-state").getAttribute("data-state"))
  const data = async (key) =>
    JSON.parse(await page.locator("canvas").getAttribute(`data-${key}`))
  const tick = async () =>
    +(await page.locator("canvas").getAttribute("data-tick"))
  const open = async () => {
    await page.goto(`${root}/dev/aw2/battle.html?team=hai`)
    await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
    await page
      .getByTestId("battle-atlas-state")
      .filter({ hasText: "Đội luyện đã tải đủ bộ hình chiến đấu" })
      .waitFor()
    await page.waitForFunction(
      () => !!document.querySelector("canvas")?.dataset.haiFields,
    )
  }
  const step = async () => {
    const before = await tick()
    await page.getByRole("button", { name: "Bước 1 nhịp", exact: true }).click()
    await page.waitForFunction(
      (t) => +document.querySelector("canvas").dataset.tick > t,
      before,
    )
  }
  const until = async (target) => {
    while ((await tick()) < target) await step()
  }
  await open()
  check(
    "Five-member Hải practice replaces Than",
    (await page.locator('[data-testid^="unit-aw2-"]').count()) === 5 &&
      (await page.getByTestId("unit-aw2-hai").count()) === 1 &&
      (await page.getByTestId("unit-aw2-than").count()) === 0,
  )
  check(
    "Audio remains silent before opt-in",
    await page.evaluate(() => window.__haiAudio.length === 0),
  )
  await page.getByTestId("ultimate-aw2-hai").click()
  check(
    "Paid ultimate starts real windup without a line",
    (await state()).energy === 0 &&
      (await state()).cast &&
      !(await state()).haiLine,
  )
  check(
    "Preparation has no confirmed ultimate effect",
    !((await data("actor-effects"))["player-aw2-hai"] ?? []).some((e) =>
      e.skillId.endsWith(":ultimate"),
    ),
  )
  await page.getByTestId("hai-interrupt").click()
  await until(2)
  check(
    "Actual interruption cancels promised line without refund",
    !(await state()).haiLine &&
      (await state()).energy === 0 &&
      !(await state()).cast,
  )
  await open()
  await page.getByRole("checkbox", { name: "Âm thanh", exact: true }).check()
  await page.getByTestId("ultimate-aw2-hai").click()
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
  await page.waitForFunction(
    () =>
      !!JSON.parse(
        document.querySelector('[data-testid="hai-state"]').dataset.state,
      ).haiLine,
  )
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  const line = (await state()).haiLine
  check(
    "Commit creates finite directional capacity",
    line?.position === 14 &&
      line.facing === 1 &&
      line.expiresAtTick === 8 &&
      line.remaining === 103,
  )
  const fields = await data("hai-fields")
  check(
    "Own painted ultimate field renders at fixed rules position",
    fields.some(
      (f) =>
        f.slot === "ultimate" &&
        f.position === line.position &&
        f.frame === "fx.ultimate.2",
    ),
  )
  check(
    "Ultimate owns one opted-in cue",
    await page.evaluate(
      () =>
        window.__haiAudio.filter((u) => u.includes("/hai/base-v1/ultimate.wav"))
          .length === 1,
    ),
  )
  await until(4)
  check(
    "Line stays fixed while Hải advances",
    (await state()).position > 14 && (await state()).haiLine.position === 14,
  )
  await page.locator("canvas").screenshot({ path: `${out}/${flavor}-line.png` })
  const clock = await page.locator("canvas").getAttribute("data-motion-time")
  await page.waitForTimeout(100)
  check(
    "Pause freezes presentation clock",
    (await page.locator("canvas").getAttribute("data-motion-time")) === clock,
  )
  await until(8)
  check(
    "Expired line is removed from rules and rendered fields",
    !(await state()).haiLine &&
      !(await data("hai-fields")).some((f) => f.slot === "ultimate"),
  )
  const zone = (await state()).haiZone
  check(
    "Auto commits its own finite slow field",
    zone &&
      (await data("hai-fields")).some(
        (f) => f.slot === "auto" && f.position === zone.center,
      ),
  )
  await page
    .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
    .check()
  check(
    "Reduced motion keeps live fields tied to rules",
    (await data("hai-fields")).every((f) => f.expiresAtTick > 8),
  )
  await until(10)
  check(
    "Nearby low-HP ally triggers real ordinary shield and cooldown",
    (await state()).haiPassiveUntilTick > 10 &&
      (await page.getByTestId("hai-outcomes").innerText()).includes("Khiên"),
  )
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
  await page.waitForTimeout(1050)
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  check(
    "Finite previous ultimate FX expire independently of persistent state",
    !((await data("actor-effects"))["player-aw2-hai"] ?? []).some(
      (e) => e.skillId.endsWith(":ultimate") && e.fx,
    ),
  )
  check(
    "Actual draws stay inside Hải source atlases",
    await page.evaluate(
      () => window.__haiDraws.count > 0 && window.__haiDraws.invalid === 0,
    ),
  )
  await open()
  await page.getByRole("checkbox", { name: "Âm thanh", exact: true }).check()
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
  await page.waitForFunction(
    () =>
      window.__haiAudio.some((u) => u.includes("/hai/base-v1/passive.wav")) &&
      window.__haiAudio.some((u) => u.includes("/hai/base-v1/auto.wav")),
    null,
    { timeout: 20000 },
  )
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  check("Actual auto/passive events play own audio while running")
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 })
    check(
      `${width}px controls fit viewport`,
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    )
  }
  await page.screenshot({ path: `${out}/${flavor}-mobile.png`, fullPage: true })
  await page
    .getByRole("combobox", { name: "Cấp thử nghiệm" })
    .selectOption("20")
  await page.getByRole("button", { name: "Tạo lại trận", exact: true }).click()
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  check(
    "Reset retains Hải practice and projects level20",
    (await state()).maxHp === 491 &&
      (await state()).energy === 100 &&
      !(await state()).haiLine,
  )
  check(
    "Practice preserves seeded stable and AW2 bytes",
    await page.evaluate(
      (saved) =>
        Object.entries(saved).every(([k, v]) => localStorage.getItem(k) === v),
      saved,
    ),
  )
  await page.goto(`${root}/dev/aw2/roster.html?spirit=aw2-hai`)
  await page
    .getByRole("link", { name: "luyện kỹ năng Hải", exact: true })
    .waitFor()
  check(
    "Reference links actual kit and links persisted collection",
    (await page.locator("main").innerText()).includes(
      "Mời nhân vật và lưu đội trong hành trình",
    ),
  )
  check("No unexpected console or resource errors", errors.length === 0)
  for (const file of [
    "battle-motion-a-v2.webp",
    "battle-motion-b-v2.webp",
    "fx.webp",
  ]) {
    const c = await browser.newContext()
    const p = await c.newPage()
    await p.route(`**/hai/base-v1/${file}`, (r) => r.abort())
    await p.goto(`${root}/dev/aw2/battle.html?team=hai`)
    await p
      .getByRole("alert")
      .filter({ hasText: "Không tải được atlas" })
      .waitFor()
    check(
      `Missing ${file} has explicit failure and blank canvas`,
      await p.locator("canvas").evaluate((c) =>
        c
          .getContext("2d")
          .getImageData(0, 0, c.width, c.height)
          .data.every((v) => v === 0),
      ),
    )
    await c.close()
  }
  await writeFile(
    `${out}/${flavor}-combat.json`,
    JSON.stringify(
      {
        task: "AW2-007G",
        status: "PASS",
        flavor,
        engine: browser.version(),
        checks,
        errors,
        limits: [
          "Desktop viewports; no independent art/listening/device/rights acceptance",
          "No collection or saved-team grants",
        ],
      },
      null,
      2,
    ) + "\n",
  )
  console.log(JSON.stringify({ status: "PASS", flavor, checks: checks.length }))
} catch (e) {
  await mkdir(out, { recursive: true })
  await page
    ?.screenshot({ path: `${out}/${flavor}-failure.png`, fullPage: true })
    .catch(() => {})
  await writeFile(
    `${out}/${flavor}-combat.json`,
    JSON.stringify(
      { status: "FAIL", flavor, checks, errors, failure: String(e) },
      null,
      2,
    ) + "\n",
  )
  throw e
} finally {
  await browser?.close()
  await server.close()
}
