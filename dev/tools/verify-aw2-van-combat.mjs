import assert from "node:assert/strict"
import { mkdir, writeFile, readFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"
const { values } = parseArgs({
  options: {
    resume: { type: "boolean", default: false },
    "resume-protection": { type: "boolean", default: false },
    compiled: { type: "boolean", default: false },
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
  },
})
const { chromium } = await import(values.playwright),
  flavor = values.compiled ? "compiled" : "source",
  port = values.compiled ? 8497 : 8496,
  root = `http://127.0.0.1:${port}`,
  out = ".asset-work/aw2-007k"
const server = values.compiled
  ? await preview({
      configFile: "dev/vite.aw2.config.ts",
      preview: { host: "127.0.0.1", port, strictPort: true },
    })
  : await createServer({
      configFile: "dev/vite.dev.config.ts",
      server: { host: "127.0.0.1", port, strictPort: true },
    })
const resumeProtection = values["resume-protection"]
const prior =
  values.resume || resumeProtection
    ? JSON.parse(
        await readFile(
          `${out}/${flavor}-${resumeProtection ? "pre-protection" : "pre-missing"}-combat.json`,
          "utf8",
        ),
      )
    : null
if (prior) {
  assert.equal(prior.checks.length, resumeProtection ? 13 : 31)
  assert.equal(prior.status, "FAIL")
  assert.match(
    prior.failure,
    resumeProtection ? /Protection ultimate only/ : /locator.waitFor/,
  )
  assert.deepEqual(prior.errors, [])
}
const checks = prior ? [...prior.checks] : [],
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
    Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v))
    window.__vanAudio = []
    window.__vanDraws = { count: 0, invalid: 0 }
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      window.__vanAudio.push(this.src)
      return play.call(this)
    }
    const draw = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      if (
        args[0] instanceof HTMLImageElement &&
        args[0].src.includes("/van/base-v1/")
      ) {
        window.__vanDraws.count++
        if (
          args.length !== 9 ||
          args[1] < 0 ||
          args[2] < 0 ||
          args[1] + args[3] > args[0].naturalWidth ||
          args[2] + args[4] > args[0].naturalHeight
        )
          window.__vanDraws.invalid++
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
  if (!values.resume) {
    const state = async () =>
        JSON.parse(
          await page.getByTestId("van-state").getAttribute("data-state"),
        ),
      events = async () =>
        JSON.parse(
          await page.getByTestId("van-outcomes").getAttribute("data-events"),
        ),
      data = async (k) =>
        JSON.parse(await page.locator("canvas").getAttribute(`data-${k}`)),
      tick = async () =>
        +(await page.locator("canvas").getAttribute("data-tick"))
    const fx = async (slot) =>
      ((await data("actor-effects"))["player-aw2-van"] ?? []).filter((e) =>
        e.skillId.endsWith(`:${slot}`),
      )
    const open = async (emphasis = "protection") => {
      await page.goto(
        `${root}/dev/aw2/battle.html?team=van&emphasis=${emphasis}`,
        { waitUntil: "domcontentloaded" },
      )
      await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
      await page
        .getByTestId("battle-atlas-state")
        .filter({ hasText: "Đội luyện đã tải đủ bộ hình chiến đấu" })
        .waitFor()
      await page.waitForFunction(
        () => !!document.querySelector("canvas")?.dataset.actorEffects,
      )
      if ((await tick()) !== 0) {
        await page
          .getByRole("button", { name: "Tạo lại trận", exact: true })
          .press("Enter")
        await page
          .getByRole("button", { name: "Tạm dừng", exact: true })
          .press("Enter")
      }
      assert.equal(
        await tick(),
        0,
        "Native setup must pause a fresh tick-zero battle",
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
    if (!resumeProtection) {
      await open()
      check(
        "Five-member practice replaces Mộc Non with actual Vân",
        (await page.locator('[data-testid^="unit-aw2-"]').count()) === 5 &&
          (await page.getByTestId("unit-aw2-van").count()) === 1 &&
          (await page.getByTestId("unit-aw2-moc-non").count()) === 0,
      )
      check(
        "Protection default is visible and fixed",
        (await state()).vanEmphasis === "protection" &&
          (await page.getByTestId("van-active-emphasis").innerText()).includes(
            "Bảo hộ",
          ),
      )
      await page.getByTestId("van-emphasis").selectOption("attack")
      check(
        "Pending selection leaves current emphasis and energy intact",
        (await state()).vanEmphasis === "protection" &&
          (await state()).energy === 100,
      )
      await page.getByTestId("ultimate-aw2-van").click()
      check(
        "Paid protection anticipation has no invented outcome",
        (await state()).energy === 0 && !(await fx("ultimate")).length,
      )
      await page.getByTestId("van-interrupt").click()
      await until(3)
      check(
        "Real interruption grants neither ultimate branch",
        (await events()).filter(
          (e) =>
            e.skillId.endsWith(":ultimate") &&
            ["shield", "hit", "heal"].includes(e.kind),
        ).length === 0,
      )
      await open()
      await until(6)
      check(
        "Auto snapshots original threatened ally and enemy",
        (await state()).cast?.vanTargets?.allyId === "player-aw2-lua" &&
          (await state()).cast?.vanTargets?.enemyId === "enemy-than",
      )
      check(
        "Auto anticipation emits no confirmed effect",
        !(await fx("auto")).length,
      )
      await step()
      const first = (await state()).vanLink
      check(
        "Auto grants actual shield and one bounded mark",
        first?.supportedShield === 25 &&
          first.enemyId === "enemy-than" &&
          first.endsAtTick === 11,
      )
      check(
        "Shield and mark share one action clock with actual recipients",
        (await fx("auto")).length === 2 &&
          new Set((await fx("auto")).map((e) => e.serial)).size === 1,
      )
      await page
        .locator("canvas")
        .screenshot({ path: `${out}/${flavor}-support.png` })
      await page.getByTestId("van-cleanse").click()
      check(
        "Native enemy cleanse removes link and allows only earned capped healing",
        !(await state()).vanLink &&
          (await events()).filter((e) => e.kind === "heal").length === 1 &&
          (await events()).find((e) => e.kind === "heal").amount <=
            first.supportedShield,
      )
      await open()
      await until(16)
      const supported = (await state()).vanLink
      check(
        "Later support tracks original injured ally",
        supported?.allyId === "player-aw2-suong" &&
          supported.supportedShield === 25,
      )
      await until(20)
      const healed = (await events()).filter((e) => e.kind === "heal")
      check(
        "Natural expiry gives exactly one earned capped heal",
        healed.length === 1 &&
          healed[0].amount === 12 &&
          healed[0].targetIds[0] === "player-aw2-suong" &&
          !(await state()).vanLink,
      )
      check(
        "Passive uses its own confirmed effect clock",
        (await fx("passive")).length === 1 &&
          (await fx("passive"))[0].targetId === "player-aw2-suong",
      )
    }
    await open()
    await page.getByTestId("ultimate-aw2-van").click()
    await until(2)
    const wards = (await events()).filter(
      (e) => e.skillId.endsWith(":ultimate") && e.kind === "shield",
    )
    check(
      "Protection ultimate only shields real nearby recipients",
      wards.length === 5 &&
        (await events()).filter(
          (e) => e.skillId.endsWith(":ultimate") && e.kind === "hit",
        ).length === 0,
    )
    check(
      "Protection recipients share one authored 560ms outcome",
      (await fx("ultimate")).length === 5 &&
        (await fx("ultimate")).every((e) => e.atMs === 560) &&
        new Set((await fx("ultimate")).map((e) => e.serial)).size === 1,
    )
    await page
      .locator("canvas")
      .screenshot({ path: `${out}/${flavor}-protection.png` })
    const frozen = await page.locator("canvas").getAttribute("data-motion-time")
    await page.waitForTimeout(800)
    check(
      "Pause freezes core and presentation clocks",
      (await tick()) === 2 &&
        (await page.locator("canvas").getAttribute("data-motion-time")) ===
          frozen,
    )
    await page
      .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
      .check()
    check(
      "Reduced motion preserves confirmed gameplay",
      (await page.locator("canvas").getAttribute("data-reduced")) === "true" &&
        (await state()).vanEmphasis === "protection",
    )
    await page.getByTestId("van-emphasis").selectOption("attack")
    await page
      .getByRole("button", { name: "Tạo lại trận", exact: true })
      .click()
    await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
    check(
      "Explicit reset constructs attack emphasis at tick zero",
      (await state()).vanEmphasis === "attack" &&
        (await tick()) === 0 &&
        (await state()).energy === 100,
    )
    await page
      .getByLabel("Mục tiêu Vân", { exact: true })
      .selectOption("enemy-than")
    await page.getByTestId("ultimate-aw2-van").click()
    check(
      "Attack pays once without switching mode",
      (await state()).energy === 0 && (await state()).vanEmphasis === "attack",
    )
    await until(2)
    const hits = (await events()).filter(
      (e) => e.kind === "hit" && e.skillId.endsWith(":ultimate"),
    )
    check(
      "Attack area has only current enemies and at most three hits",
      hits.length > 0 &&
        hits.length <= 3 &&
        hits.every((e) => e.targetIds.every((id) => id.startsWith("enemy-"))) &&
        (await events()).filter(
          (e) => e.kind === "shield" && e.skillId.endsWith(":ultimate"),
        ).length === 0,
    )
    check(
      "Attack outcome uses own authored recipients and shared clock",
      (await fx("ultimate")).length === hits.length &&
        new Set((await fx("ultimate")).map((e) => e.serial)).size === 1,
    )
    await page
      .locator("canvas")
      .screenshot({ path: `${out}/${flavor}-attack.png` })
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 900 })
      check(
        `Viewport ${width} has no horizontal overflow`,
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      )
      if (width === 390)
        await page.screenshot({
          path: `${out}/${flavor}-mobile.png`,
          fullPage: true,
        })
    }
    await page.getByLabel("Cấp thử nghiệm").selectOption("20")
    check(
      "Pending level preserves active battle",
      (await state()).vanEmphasis === "attack" && (await state()).energy < 100,
    )
    await page
      .getByRole("button", { name: "Tạo lại trận", exact: true })
      .click()
    await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
    check(
      "Level20 reset preserves selected emphasis and projects stats",
      (await state()).maxHp === Math.round(155 * (1 + 19 * 0.055)) &&
        (await state()).vanEmphasis === "attack",
    )
    await open("attack")
    await page.getByRole("checkbox", { name: "Âm thanh", exact: true }).check()
    await page.getByTestId("ultimate-aw2-van").click()
    await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
    await page.waitForFunction(
      () =>
        window.__vanAudio.some((u) => u.includes("/van/base-v1/ultimate.wav")),
      null,
      { timeout: 12000 },
    )
    await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
    check(
      "Opted-in area ultimate plays one actual audio cue",
      await page.evaluate(
        () =>
          window.__vanAudio.filter((u) =>
            u.includes("/van/base-v1/ultimate.wav"),
          ).length === 1,
      ),
    )
    check(
      "Authored atlas rectangles stay in bounds",
      await page.evaluate(
        () => window.__vanDraws.count > 0 && window.__vanDraws.invalid === 0,
      ),
    )
    while (
      (await page.locator("canvas").getAttribute("data-status")) === "active"
    )
      await step()
    check(
      "Terminal state disables cast and clears pending link",
      (await page.getByTestId("ultimate-aw2-van").isDisabled()) &&
        !(await state()).vanLink &&
        !(await state()).cast,
    )
    check(
      "Stable and AW2 save bytes are preserved",
      await page.evaluate(
        (saved) =>
          Object.entries(saved).every(
            ([k, v]) => localStorage.getItem(k) === v,
          ),
        saved,
      ),
    )
    check("No accepted-flow browser or resource errors", errors.length === 0)
  }
  await page.goto(`${root}/dev/aw2/roster.html?spirit=aw2-van`)
  await page
    .getByRole("link", { name: "luyện kỹ năng Vân", exact: true })
    .waitFor()
  check(
    "Reference viewer links actual Vân practice and discloses pending collection",
    (await page.locator("main").innerText()).includes("Thu thập/đội lưu"),
  )
  for (const file of [
    "battle-motion-a-v1.webp",
    "battle-motion-b-v1.webp",
    "fx.webp",
  ]) {
    const c = await browser.newContext()
    await c.route(`**/van/base-v1/${file}`, (r) => r.abort())
    const p = await c.newPage()
    await p.goto(`${root}/dev/aw2/battle.html?team=van`)
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
        task: "AW2-007K",
        status: "PASS",
        flavor,
        engine: browser.version(),
        retainedChecks: prior?.checks.length ?? 0,
        checks,
        errors,
        limits: [
          "Desktop viewports, no human art/listening/physical-device acceptance",
          "No collection/save grant",
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
