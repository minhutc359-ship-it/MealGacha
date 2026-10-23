import assert from "node:assert/strict"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"
const { values } = parseArgs({
  options: {
    resume: { type: "boolean", default: false },
    compiled: { type: "boolean", default: false },
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
  },
})
const { chromium } = await import(values.playwright)
const flavor = values.compiled ? "compiled" : "source",
  port = values.compiled ? 8495 : 8494,
  root = `http://127.0.0.1:${port}`,
  out = ".asset-work/aw2-007j"
const server = values.compiled
  ? await preview({
      configFile: "dev/vite.aw2.config.ts",
      preview: { host: "127.0.0.1", port, strictPort: true },
    })
  : await createServer({
      configFile: "dev/vite.dev.config.ts",
      server: { host: "127.0.0.1", port, strictPort: true },
    })
const priorReport = values.resume
  ? JSON.parse(await readFile(`${out}/${flavor}-initial-combat.json`, "utf8"))
  : null
if (priorReport) {
  assert.equal(priorReport.checks.length, 20)
  assert.match(
    priorReport.failure,
    /Same-tick heavy preparation preserves confirmed ultimate gesture/,
  )
  assert.deepEqual(priorReport.errors, [])
}
let reestablishing = values.resume
const checks = priorReport ? [...priorReport.checks] : [],
  errors = [],
  saved = {
    "aw2.development.save": "preserve-aw2",
    "foodchest.user.v1": "preserve-user",
    "foodchest.tcg.v1": "preserve-tcg",
  }
const check = (name, value = true) => {
  if (reestablishing) return
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
    window.__bachAudio = []
    window.__bachDraws = { count: 0, invalid: 0 }
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      window.__bachAudio.push(this.src)
      return play.call(this)
    }
    const draw = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      if (
        args[0] instanceof HTMLImageElement &&
        args[0].src.includes("/bach/base-v1/")
      ) {
        window.__bachDraws.count++
        if (
          args.length !== 9 ||
          args[1] < 0 ||
          args[2] < 0 ||
          args[1] + args[3] > args[0].naturalWidth ||
          args[2] + args[4] > args[0].naturalHeight
        )
          window.__bachDraws.invalid++
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
    JSON.parse(await page.getByTestId("bach-state").getAttribute("data-state"))
  const allies = async () =>
    JSON.parse(await page.getByTestId("bach-allies").getAttribute("data-state"))
  const events = async () =>
    JSON.parse(
      await page.getByTestId("bach-outcomes").getAttribute("data-events"),
    )
  const data = async (key) =>
    JSON.parse(await page.locator("canvas").getAttribute(`data-${key}`))
  const tick = async () =>
    +(await page.locator("canvas").getAttribute("data-tick"))
  const ownFx = async (slot) =>
    ((await data("actor-effects"))["player-aw2-bach"] ?? []).filter((e) =>
      e.skillId.endsWith(`:${slot}`),
    )
  const open = async () => {
    await page.goto(`${root}/dev/aw2/battle.html?team=bach`)
    await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
    await page
      .getByTestId("battle-atlas-state")
      .filter({ hasText: "Đội luyện đã tải đủ bộ hình chiến đấu" })
      .waitFor()
    await page.waitForFunction(
      () => !!document.querySelector("canvas")?.dataset.actorEffects,
    )
  }
  const step = async () => {
    const before = await tick()
    await page
      .getByRole("button", { name: "Bước 1 nhịp", exact: true })
      .press("Enter")
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
    "Five-person Tank practice replaces Than with Bách",
    (await page.locator('[data-testid^="unit-aw2-"]').count()) === 5 &&
      (await page.getByTestId("unit-aw2-bach").count()) === 1 &&
      (await page.getByTestId("unit-aw2-than").count()) === 0,
  )
  check(
    "Sound stays silent before opt-in",
    await page.evaluate(() => window.__bachAudio.length === 0),
  )
  await page.getByTestId("ultimate-aw2-bach").click()
  check(
    "Paid ultimate anticipation grants no predicted shield or impact",
    (await state()).energy === 0 &&
      !!(await state()).cast &&
      !(await ownFx("ultimate")).length,
  )
  await page.getByTestId("bach-interrupt").click()
  await until(2)
  check(
    "Real cast interruption leaves no future outcome or energy refund",
    !(await state()).cast &&
      (await state()).energy === 0 &&
      !(await events()).some(
        (e) =>
          e.skillId.endsWith(":ultimate") && ["shield", "hit"].includes(e.kind),
      ),
  )
  await open()
  await until(3)
  check(
    "Gói Chắc anticipation promises no shield",
    !!(await state()).cast &&
      (await state()).shield === 0 &&
      !(await ownFx("auto")).length,
  )
  await until(4)
  check(
    "Committed Gói Chắc grants actual finite personal shell",
    (await state()).shield === 76 && (await state()).shieldExpiresAtTick === 9,
  )
  check(
    "Personal shell uses own420ms confirmed cell",
    (await ownFx("auto")).some(
      (e) =>
        e.atMs === 420 &&
        e.targetId === "player-aw2-bach" &&
        e.fx.startsWith("fx.auto."),
    ),
  )
  await until(5)
  check(
    "Meter counts real ordinary shield absorption and no HP damage",
    (await state()).bachGuarded === 11 &&
      (await state()).shield === 65 &&
      (await state()).hp === 305,
  )
  await until(9)
  check(
    "Expired shell is not counted as newly absorbed damage",
    (await state()).shield === 0 && (await state()).bachGuarded === 33,
  )
  check(
    "Heavy basic waits for one real melee contact with no projectile",
    (await state()).bachStrike?.resolveTick === 10 &&
      !(await ownFx("basic")).length &&
      !(await events()).some((e) => e.kind === "projectile-launch"),
  )
  await page.getByTestId("bach-interrupt").click()
  await until(10)
  check(
    "Real heavy-strike interruption cancels contact and keeps cooldown",
    !(await state()).bachStrike &&
      (await state()).nextBasicTick === 15 &&
      !(await ownFx("basic")).length,
  )
  await open()
  await until(10)
  check(
    "Actual Mối Buộc contact uses own460ms impact at real opponent",
    (await ownFx("basic")).some(
      (e) =>
        e.atMs === 460 &&
        e.targetId === "enemy-than" &&
        e.fx.startsWith("fx.basic."),
    ),
  )
  await until(14)
  const passive = (await events()).filter(
    (e) => e.kind === "shield" && e.skillId.endsWith(":passive"),
  )
  check(
    "Actual threshold proc shares exactly24 shield with nearby Sương",
    passive.length === 1 &&
      passive[0].amount === 24 &&
      passive[0].targetIds[0] === "player-aw2-suong",
  )
  check(
    "Successful Chia Phần resets capped meter and starts cooldown",
    (await state()).bachGuarded === 0 &&
      (await state()).bachShareUntilTick === 22,
  )
  check(
    "Confirmed passive has recipient-owned reaction and own180ms FX",
    (await ownFx("passive")).some(
      (e) => e.atMs === 180 && e.targetId === "player-aw2-suong",
    ),
  )
  await page
    .locator("canvas")
    .screenshot({ path: `${out}/${flavor}-share.png` })
  const held = (await state()).shield
  await page.getByTestId("ultimate-aw2-bach").click()
  check(
    "Ultimate reserves energy while preserving shell until commit",
    (await state()).energy === 0 &&
      (await state()).shield === held &&
      !!(await state()).cast,
  )
  await until(16)
  const ultimate = (await events()).filter((e) =>
    e.skillId.endsWith(":ultimate"),
  )
  const release = ultimate.find((e) => e.statusEffect === "bach-release")
  const wards = ultimate.filter((e) => e.kind === "shield")
  const hits = ultimate.filter((e) => e.kind === "hit")
  check(
    "Committed ultimate spends remaining personal shield before allocating",
    release?.amount > 0 &&
      wards.length > 0 &&
      wards.every(
        (e) =>
          e.serial > release.serial && !e.targetIds.includes("player-aw2-bach"),
      ),
  )
  check(
    "Actual ally protection never exceeds consumed personal budget",
    wards.reduce((sum, e) => sum + e.amount, 0) <= release.amount,
  )
  check(
    "Short frontline impact uses only actual core hit recipients",
    hits.length > 0 && hits.length <= 3 && hits.every((e) => e.tick === 16),
  )
  check(
    "Ward and impact share one authored ultimate clock and560ms cue",
    (await ownFx("ultimate")).length === wards.length + hits.length &&
      new Set((await ownFx("ultimate")).map((e) => e.serial)).size === 1 &&
      (await ownFx("ultimate")).every((e) => e.atMs === 560),
  )
  reestablishing = false
  check(
    "Incoming hit reaction survives later heavy windup while ultimate FX remain confirmed",
    /^battle\.hit\.[0-3]$/.test(
      (await data("actor-poses"))["player-aw2-bach"],
    ) && (await ownFx("ultimate")).every((e) => e.atMs === 560 && !!e.fx),
  )
  await page
    .locator("canvas")
    .screenshot({ path: `${out}/${flavor}-ultimate.png` })
  const frozen = +(await page
    .locator("canvas")
    .getAttribute("data-motion-time"))
  await page.waitForTimeout(150)
  check(
    "Pause freezes core and presentation clocks",
    (await tick()) === 16 &&
      +(await page.locator("canvas").getAttribute("data-motion-time")) ===
        frozen,
  )
  await page
    .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
    .check()
  check(
    "Reduced motion uses own authored pose without changing outcomes",
    (await page.locator("canvas").getAttribute("data-reduced")) === "true" &&
      (await state()).energy < 100,
  )
  await open()
  await until(14)
  await page.getByRole("checkbox", { name: "Âm thanh", exact: true }).check()
  await page.getByTestId("ultimate-aw2-bach").click()
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
  await page.waitForFunction(
    () =>
      window.__bachAudio.some((u) => u.includes("/bach/base-v1/ultimate.wav")),
    null,
    { timeout: 12000 },
  )
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  check(
    "One real mixed ward/impact plays exactly one opted-in ultimate cue",
    await page.evaluate(
      () =>
        window.__bachAudio.filter((u) =>
          u.includes("/bach/base-v1/ultimate.wav"),
        ).length === 1,
    ),
  )
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
  await page.waitForTimeout(1100)
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  check(
    "Ultimate effect expires while ordinary shield state stays authoritative",
    !(await ownFx("ultimate")).some((e) => e.fx),
  )
  check(
    "Own atlas draws remain inside authored source rectangles",
    await page.evaluate(
      () => window.__bachDraws.count > 0 && window.__bachDraws.invalid === 0,
    ),
  )
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 })
    check(
      `${width}px practice controls fit viewport`,
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
    "Reset retains Bách practice and actual level20 stats",
    (await state()).maxHp === 511 &&
      (await state()).energy === 100 &&
      !(await state()).bachStrike &&
      !(await state()).bachGuarded,
  )
  while (
    (await page.locator("canvas").getAttribute("data-status")) === "active"
  )
    await step()
  check(
    "Real terminal result cancels unfinished heavy strike and disables actions",
    !(await state()).bachStrike &&
      (await page
        .getByRole("button", { name: "Bước 1 nhịp", exact: true })
        .isDisabled()) &&
      (await page.getByTestId("ultimate-aw2-bach").isDisabled()),
  )
  check(
    "Practice preserves all seeded stable and AW2 save bytes",
    await page.evaluate(
      (saved) =>
        Object.entries(saved).every(([k, v]) => localStorage.getItem(k) === v),
      saved,
    ),
  )
  await page.goto(`${root}/dev/aw2/roster.html?spirit=aw2-bach`)
  await page
    .getByRole("link", { name: "luyện kỹ năng Bách", exact: true })
    .waitFor()
  check(
    "Reference links actual Tank practice and links persisted collection",
    (await page.locator("main").innerText()).includes(
      "Mời nhân vật và lưu đội trong hành trình",
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
    await p.route(`**/bach/base-v1/${file}`, (r) => r.abort())
    await p.goto(`${root}/dev/aw2/battle.html?team=bach`)
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
        task: "AW2-007J",
        status: "PASS",
        flavor,
        engine: browser.version(),
        checks,
        errors,
        reusedInitialChecks: priorReport?.checks.length ?? 0,
        resumedFrom: priorReport
          ? `${out}/${flavor}-initial-combat.json`
          : null,
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
