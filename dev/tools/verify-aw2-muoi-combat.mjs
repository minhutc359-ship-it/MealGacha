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
  port = values.compiled ? 8479 : 8478,
  root = `http://127.0.0.1:${port}`,
  out = ".asset-work/aw2-007e"
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
  contacts = [],
  saved = {
    "aw2.development.save": "preserve-existing-aw2",
    "foodchest.user.v1": "preserve-stable-user",
    "foodchest.tcg.v1": "preserve-stable-tcg",
  }
let browser, page
const check = (name, value = true) => {
  assert.ok(value, name)
  checks.push(name)
  console.log(name)
}
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
    for (const [k, v] of Object.entries(saved)) localStorage.setItem(k, v)
    window.__muoiContacts = []
    window.__muoiPreparation = []
    window.__muoiAudio = []
    window.__muoiDraws = {}
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      window.__muoiAudio.push(this.src)
      return play.call(this)
    }
    const draw = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function (...a) {
      if (
        a[0] instanceof HTMLImageElement &&
        a[0].src.includes("/muoi/base-v1/")
      ) {
        const r = window.__muoiDraws[a[0].src] ?? { count: 0, invalid: 0 }
        r.count++
        if (
          a.length !== 9 ||
          a[1] < 0 ||
          a[2] < 0 ||
          a[1] + a[3] > a[0].naturalWidth ||
          a[2] + a[4] > a[0].naturalHeight
        )
          r.invalid++
        window.__muoiDraws[a[0].src] = r
      }
      return draw.apply(this, a)
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
  await page.goto(`${root}/dev/aw2/battle.html?team=muoi`)
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  await page
    .getByTestId("battle-atlas-state")
    .filter({ hasText: "Đội luyện đã tải đủ bộ hình chiến đấu" })
    .waitFor()
  check(
    "Actual practice draws own Muoi atlas and exactly five player cards",
    (await page.locator('[data-testid^="unit-aw2-"]').count()) === 5 &&
      (await page.getByTestId("unit-aw2-muoi").count()) === 1,
  )
  check(
    "No outcome audio before opt-in",
    await page.evaluate(() => window.__muoiAudio.length === 0),
  )
  await page
    .getByText("Máu và trạng thái từng nhân vật", { exact: true })
    .click()
  await page.evaluate(() => {
    const poll = () => {
      const d = document.querySelector("canvas")?.dataset
      if (d) {
        const cue = JSON.parse(d.actorCues ?? "{}")["player-aw2-muoi"]
        if (["prepare", "launch"].includes(cue?.phase))
          window.__muoiPreparation.push({ ...cue, tick: +d.tick })
        for (const fx of JSON.parse(d.actorEffects ?? "{}")[
          "player-aw2-muoi"
        ] ?? [])
          if (
            fx.fx &&
            !window.__muoiContacts.some(
              (e) => e.serial === fx.serial && e.fx === fx.fx,
            )
          )
            window.__muoiContacts.push({ ...fx, tick: +d.tick })
      }
      requestAnimationFrame(poll)
    }
    poll()
  })
  const tick = async () =>
    +(await page.locator("canvas").getAttribute("data-tick"))
  const step = async () => {
    const before = await tick()
    await page.getByRole("button", { name: "Bước 1 nhịp", exact: true }).click()
    await page.waitForFunction(
      (before) => +document.querySelector("canvas").dataset.tick > before,
      before,
    )
  }
  const until = async (target) => {
    while ((await tick()) < target) await step()
  }
  const markList = async () =>
    JSON.parse(
      await page.getByTestId("muoi-mark-state").getAttribute("data-marks"),
    )
  // Observe a real enemy shield before the manual ultimate, no injected outcome.
  await until(4)
  await page
    .getByRole("combobox", { name: "Mục tiêu Muối Đen", exact: true })
    .selectOption("enemy-than")
  await page.getByTestId("ultimate-aw2-muoi").click()
  await step()
  check(
    "Preparing ultimate emits no confirmed burst",
    await page.evaluate(
      () =>
        !window.__muoiContacts.some(
          (e) => e.skillId === "aw2-muoi:skill:ultimate",
        ),
    ),
  )
  await step()
  await page.waitForFunction(() =>
    window.__muoiContacts.some((e) => e.skillId === "aw2-muoi:skill:ultimate"),
  )
  check(
    "Actual dispel targets selected ordinary shield",
    (await page.getByTestId("muoi-outcomes").innerText()).includes(
      "khiên thường",
    ),
  )
  const ultimate = await page.evaluate(() =>
    window.__muoiContacts.filter(
      (e) => e.skillId === "aw2-muoi:skill:ultimate",
    ),
  )
  check(
    "Dispel and burst share one confirmed FX serial/cue560 at actual target",
    ultimate.length > 0 &&
      new Set(ultimate.map((e) => e.serial)).size === 1 &&
      ultimate.every((e) => e.targetId === "enemy-than" && e.atMs === 560),
  )
  await page
    .locator("canvas")
    .screenshot({ path: `${out}/${flavor}-ultimate.png` })
  const time = await page.locator("canvas").getAttribute("data-motion-time")
  await page.waitForTimeout(120)
  check(
    "Paused step does not advance presentation clocks",
    (await page.locator("canvas").getAttribute("data-motion-time")) === time,
  )
  await page.getByRole("checkbox", { name: "Âm thanh", exact: true }).check()
  // Move through real ticks until the highest-threat mark appears.
  while (!(await markList()).length && (await tick()) < 25) await step()
  const marks = await markList()
  check(
    "Actual auto applies exactly one finite mark",
    marks.length === 1 &&
      marks[0].expiresAtTick - marks[0].appliedTick === 6 &&
      marks[0].capTick - marks[0].appliedTick === 10,
  )
  await page
    .getByRole("combobox", { name: "Mục tiêu Muối Đen", exact: true })
    .selectOption(marks[0].targetId)
  check(
    "Victim roster exposes the real attack-reduction mark",
    (
      await page.locator(`[data-actor-id="${marks[0].targetId}"]`).innerText()
    ).includes("giảm công20%"),
  )
  await page.getByTestId("muoi-cleanse").click()
  check(
    "Practice counterplay removes real mark without new hit/mark FX",
    (await markList()).length === 0,
  )
  const before = await page.evaluate(
    () =>
      JSON.parse(document.querySelector("canvas").dataset.actorEffects)[
        "player-aw2-muoi"
      ]?.find((e) => e.skillId === "aw2-muoi:skill:auto")?.serial,
  )
  await step()
  check(
    "Subsequent basic does not silently recreate cleansed mark",
    (await markList()).length === 0,
  )
  check(
    "Removal leaves confirmed effect serial unchanged",
    (await page.evaluate(
      () =>
        JSON.parse(document.querySelector("canvas").dataset.actorEffects)[
          "player-aw2-muoi"
        ]?.find((e) => e.skillId === "aw2-muoi:skill:auto")?.serial,
    )) === before,
  )
  // Paused stepping intentionally mutes sound; resume for a real new contact.
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
  await page.waitForFunction(
    () => window.__muoiAudio.some((url) => url.includes("/muoi/base-v1/")),
    null,
    { timeout: 10000 },
  )
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  // Step actual combat quickly until basic and its marked-target refresh occur.
  for (let i = 0; i < 110; i++) {
    const seen = await page.evaluate(() => window.__muoiContacts)
    if (
      ["basic", "auto", "passive"].every((slot) =>
        seen.some((e) => e.skillId === `aw2-muoi:skill:${slot}`),
      )
    )
      break
    if ((await page.locator("canvas").getAttribute("data-status")) !== "active")
      break
    await step()
  }
  const observed = await page.evaluate(() => window.__muoiContacts)
  contacts.push(...observed)
  check(
    "Actual basic/mark/passive and ultimate each produce own confirmed effects",
    ["basic", "auto", "passive", "ultimate"].every((slot) =>
      observed.some((e) => e.skillId === `aw2-muoi:skill:${slot}`),
    ),
  )
  for (const [slot, cue] of [
    ["basic", 700],
    ["auto", 420],
    ["passive", 180],
  ])
    check(
      `${slot}: event-owned cue/target`,
      observed
        .filter((e) => e.skillId === `aw2-muoi:skill:${slot}`)
        .every((e) => e.atMs === cue && e.targetId?.startsWith("enemy-")),
    )
  check(
    "Basic contacts draw only impact cels2/3",
    observed
      .filter((e) => e.skillId === "aw2-muoi:skill:basic")
      .every((e) => ["fx.basic.2", "fx.basic.3"].includes(e.fx)),
  )
  check(
    "Cast preparation/flight cannot draw outcome FX",
    await page.evaluate(
      () =>
        window.__muoiPreparation.length > 0 &&
        window.__muoiPreparation.every((c) => c.fx === ""),
    ),
  )
  check(
    "Opted-in confirmed Muoi cues use own authored audio",
    await page.evaluate(() =>
      window.__muoiAudio.some((s) => s.includes("/muoi/base-v1/")),
    ),
  )
  await page
    .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
    .check()
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
  await page.waitForTimeout(480)
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  check(
    "Reduced motion cannot revive expired ultimate FX",
    await page.evaluate(() =>
      JSON.parse(document.querySelector("canvas").dataset.actorEffects)
        ["player-aw2-muoi"].filter(
          (e) => e.skillId === "aw2-muoi:skill:ultimate",
        )
        .every((e) => e.fx === ""),
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
  for (
    let i = 0;
    i < 140 &&
    (await page.locator("canvas").getAttribute("data-status")) === "active";
    i++
  )
    await step()
  await page.waitForFunction(
    () =>
      document.querySelector("canvas").dataset.status !== "active" &&
      Object.values(
        JSON.parse(document.querySelector("canvas").dataset.actorEffects),
      )
        .flat()
        .every((e) => e.fx === ""),
  )
  check(
    "Actual terminal cancels effect playback and all mark state",
    (await markList()).length === 0,
  )
  check(
    "Muoi atlas draws stay within declared source bounds",
    await page.evaluate(
      () =>
        Object.keys(window.__muoiDraws).length >= 2 &&
        Object.values(window.__muoiDraws).every((r) => r.invalid === 0),
    ),
  )
  check(
    "Actual practice preserves all seeded save bytes",
    await page.evaluate(
      (saved) =>
        Object.entries(saved).every(([k, v]) => localStorage.getItem(k) === v),
      saved,
    ),
  )
  await page.goto(`${root}/dev/aw2/roster.html?spirit=aw2-muoi`)
  check(
    "Reference viewer links actual practice and links persisted collection",
    (await page.locator("main").innerText()).includes(
      "Mời nhân vật và lưu đội trong hành trình",
    ),
  )
  check("No unexpected browser/resource errors", errors.length === 0)
  await writeFile(
    `${out}/${flavor}-combat.json`,
    JSON.stringify(
      {
        task: "AW2-007E",
        status: "PASS",
        flavor,
        engine: browser.version(),
        checks,
        errors,
        contacts,
        limits: [
          "Actual isolated practice, no collection/world-party unlock",
          "Desktop viewports only; no human listening/device/rights acceptance",
        ],
      },
      null,
      2,
    ) + "\n",
  )
  console.log(JSON.stringify({ status: "PASS", flavor, checks: checks.length }))
} catch (e) {
  await mkdir(out, { recursive: true })
  await writeFile(
    `${out}/${flavor}-combat.json`,
    JSON.stringify(
      {
        task: "AW2-007E",
        status: "FAIL",
        flavor,
        checks,
        errors,
        contacts,
        failure: String(e),
      },
      null,
      2,
    ) + "\n",
  )
  throw e
} finally {
  await browser?.close()
  await server.close()
}
