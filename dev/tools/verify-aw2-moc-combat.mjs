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
  port = values.compiled ? 8493 : 8492,
  root = `http://127.0.0.1:${port}`,
  out = ".asset-work/aw2-007i"
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
    window.__mocAudio = []
    window.__mocDraws = { count: 0, invalid: 0 }
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      window.__mocAudio.push(this.src)
      return play.call(this)
    }
    const draw = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      if (
        args[0] instanceof HTMLImageElement &&
        args[0].src.includes("/moc/base-v1/")
      ) {
        window.__mocDraws.count++
        if (
          args.length !== 9 ||
          args[1] < 0 ||
          args[2] < 0 ||
          args[1] + args[3] > args[0].naturalWidth ||
          args[2] + args[4] > args[0].naturalHeight
        )
          window.__mocDraws.invalid++
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
    JSON.parse(await page.getByTestId("moc-state").getAttribute("data-state"))
  const data = async (key) =>
    JSON.parse(await page.locator("canvas").getAttribute(`data-${key}`))
  const events = async () =>
    JSON.parse(
      await page.getByTestId("moc-outcomes").getAttribute("data-events"),
    )
  const tick = async () =>
    +(await page.locator("canvas").getAttribute("data-tick"))
  const ownFx = async (slot) =>
    ((await data("actor-effects"))["player-aw2-moc"] ?? []).filter((e) =>
      e.skillId.endsWith(`:${slot}`),
    )
  const open = async () => {
    await page.goto(`${root}/dev/aw2/battle.html?team=moc`)
    await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
    await page
      .getByTestId("battle-atlas-state")
      .filter({ hasText: "Đội luyện đã tải đủ bộ hình chiến đấu" })
      .waitFor()
    await page.waitForFunction(
      () => !!document.querySelector("canvas")?.dataset.mocFields,
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
  const until = async (t) => {
    while ((await tick()) < t) await step()
  }
  await open()
  check(
    "Five-member Mộc practice replaces Sương, keeps Mộc Non",
    (await page.locator('[data-testid^="unit-aw2-"]').count()) === 5 &&
      (await page.getByTestId("unit-aw2-moc").count()) === 1 &&
      (await page.getByTestId("unit-aw2-moc-non").count()) === 1 &&
      (await page.getByTestId("unit-aw2-suong").count()) === 0,
  )
  check(
    "Sound remains silent before opt-in",
    await page.evaluate(() => window.__mocAudio.length === 0),
  )
  await page.getByTestId("ultimate-aw2-moc").click()
  check(
    "Paid ultimate anticipation promises no area or damage effect",
    (await state()).energy === 0 &&
      !!(await state()).cast &&
      !(await state()).mocBurst &&
      !(await ownFx("ultimate")).length,
  )
  await page.getByTestId("moc-interrupt").click()
  await until(2)
  check(
    "Real interruption leaves no committed burst and no energy refund",
    !(await state()).cast &&
      !(await state()).mocBurst &&
      (await state()).energy === 0,
  )
  await open()
  await until(5)
  check(
    "Nét Lá launches own projectile before impact",
    (await data("actor-cues"))["player-aw2-moc"]?.phase === "launch" &&
      !(await ownFx("basic")).length,
  )
  await until(7)
  check(
    "Actual basic contact uses own safe impact cells",
    (await ownFx("basic")).some(
      (e) => e.targetId === "enemy-than" && /^fx.basic.[23]$/.test(e.fx),
    ),
  )
  await until(8)
  const mark = (await state()).mocMark
  check(
    "Gieo Dấu commits one fixed mark with finite arm and expiry",
    mark?.center === 42 && mark.armedAtTick === 11 && mark.expiresAtTick === 14,
  )
  check(
    "Ground mark draws authored own cell at actual center",
    (await data("moc-fields")).some(
      (f) =>
        f.slot === "auto" &&
        f.position === mark.center &&
        f.frame === "fx.auto.1",
    ),
  )
  check(
    "Unarmed ground mark creates no hit FX or damage",
    !(await ownFx("auto")).length &&
      !(await events()).some(
        (e) => e.kind === "hit" && e.skillId.endsWith(":auto"),
      ),
  )
  await page.locator("canvas").screenshot({ path: `${out}/${flavor}-mark.png` })
  await until(10)
  check(
    "Three-tick arming cannot resolve early",
    !!(await state()).mocMark && !(await ownFx("auto")).length,
  )
  await until(11)
  const hits = (await events()).filter(
    (e) => e.kind === "hit" && e.skillId.endsWith(":auto"),
  )
  check(
    "Armed mark resolves once against actual occupants",
    hits.length === 2 &&
      hits.every((e) => e.tick === 11) &&
      !(await state()).mocMark,
  )
  check(
    "One actual area pulse groups recipient FX",
    new Set((await ownFx("auto")).map((e) => e.targetId)).size === 2,
  )
  await open()
  await until(8)
  await page.getByTestId("ultimate-aw2-moc").click()
  await until(10)
  const burst = (await state()).mocBurst
  check(
    "Ultimate consumes the valid mark only at commit",
    burst?.consumedMark === true &&
      burst.center === 42 &&
      burst.resolveTick === 12 &&
      !(await state()).mocMark,
  )
  check(
    "Two-tick warning uses own finite field without confirmed damage",
    (await data("moc-fields")).some(
      (f) =>
        f.slot === "ultimate" &&
        f.frame === "fx.ultimate.0" &&
        f.position === 42,
    ) && !(await ownFx("ultimate")).length,
  )
  await page
    .locator("canvas")
    .screenshot({ path: `${out}/${flavor}-warning.png` })
  await until(11)
  check(
    "Warned burst cannot deal damage one tick early",
    !(await ownFx("ultimate")).length,
  )
  await until(12)
  check(
    "One confirmed burst uses current recipients and own authored FX",
    !(await state()).mocBurst &&
      (await ownFx("ultimate")).length >= 1 &&
      (await ownFx("ultimate")).every((e) => e.fx.startsWith("fx.ultimate.")),
  )
  check(
    "Same-tick auto anticipation preserves confirmed ultimate gesture",
    (await data("actor-cues"))["player-aw2-moc"]?.skillId ===
      "aw2-moc:skill:ultimate",
  )
  await page
    .locator("canvas")
    .screenshot({ path: `${out}/${flavor}-ultimate.png` })
  const frozen = +(await page
    .locator("canvas")
    .getAttribute("data-motion-time"))
  await page.waitForTimeout(150)
  check(
    "Paused core and field visual clocks remain fixed",
    (await tick()) === 12 &&
      +(await page.locator("canvas").getAttribute("data-motion-time")) ===
        frozen,
  )
  await page
    .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
    .check()
  check(
    "Reduced motion keeps actual field and outcome state",
    (await page.locator("canvas").getAttribute("data-reduced")) === "true" &&
      !(await state()).mocBurst,
  )
  await open()
  await until(8)
  await page.getByRole("checkbox", { name: "Âm thanh", exact: true }).check()
  await page.getByTestId("ultimate-aw2-moc").click()
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
  await page.waitForFunction(
    () =>
      window.__mocAudio.some((u) => u.includes("/moc/base-v1/ultimate.wav")),
    null,
    { timeout: 12000 },
  )
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  check(
    "Exactly one confirmed ultimate cue after opt-in",
    await page.evaluate(
      () =>
        window.__mocAudio.filter((u) => u.includes("/moc/base-v1/ultimate.wav"))
          .length === 1,
    ),
  )
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
  await page.waitForTimeout(1100)
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  check(
    "Confirmed burst effect expires after its finite own track",
    !(await ownFx("ultimate")).some((e) => e.fx),
  )
  check(
    "All actual own image draws remain inside source bounds",
    await page.evaluate(
      () => window.__mocDraws.count > 0 && window.__mocDraws.invalid === 0,
    ),
  )
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
    "Reset retains Mộc practice and level20 stats without fields",
    (await state()).maxHp === 307 &&
      (await state()).energy === 100 &&
      !(await state()).mocMark &&
      !(await state()).mocBurst,
  )
  while (
    (await page.locator("canvas").getAttribute("data-status")) === "active"
  )
    await step()
  check(
    "Actual terminal result clears Mộc fields and disables controls",
    (await data("moc-fields")).length === 0 &&
      (await page
        .getByRole("button", { name: "Bước 1 nhịp", exact: true })
        .isDisabled()) &&
      (await page.getByTestId("ultimate-aw2-moc").isDisabled()),
  )
  check(
    "Practice preserves seeded stable and AW2 save bytes",
    await page.evaluate(
      (saved) =>
        Object.entries(saved).every(([k, v]) => localStorage.getItem(k) === v),
      saved,
    ),
  )
  await page.goto(`${root}/dev/aw2/roster.html?spirit=aw2-moc`)
  await page
    .getByRole("link", { name: "luyện kỹ năng Mộc", exact: true })
    .waitFor()
  check(
    "Reference links actual Mộc practice and discloses pending collection",
    (await page.locator("main").innerText()).includes(
      "Thu thập và đội lưu còn chờ",
    ),
  )
  check("No unexpected page/console/resource errors", errors.length === 0)
  for (const file of [
    "battle-motion-a-v1.webp",
    "battle-motion-b-v1.webp",
    "fx.webp",
  ]) {
    const c = await browser.newContext(),
      p = await c.newPage()
    await p.route(`**/moc/base-v1/${file}`, (r) => r.abort())
    await p.goto(`${root}/dev/aw2/battle.html?team=moc`)
    await p
      .getByRole("alert")
      .filter({ hasText: "Không tải được atlas" })
      .waitFor()
    check(
      `Missing ${file} fails explicitly with blank canvas`,
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
        task: "AW2-007I",
        status: "PASS",
        flavor,
        engine: browser.version(),
        checks,
        errors,
        limits: [
          "Desktop viewports; no independent art/listening/physical-device/rights acceptance",
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
