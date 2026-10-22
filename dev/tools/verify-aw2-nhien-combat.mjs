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
const flavor = values.compiled ? "compiled" : "source"
const port = values.compiled ? 8483 : 8482
const root = `http://127.0.0.1:${port}`
const out = ".asset-work/aw2-007f"
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
  errors = []
const saved = {
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
    window.__nhienAudio = []
    window.__nhienDraws = { count: 0, invalid: 0 }
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      window.__nhienAudio.push(this.src)
      return play.call(this)
    }
    const draw = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function (...a) {
      if (
        a[0] instanceof HTMLImageElement &&
        a[0].src.includes("/nhien/base-v1/")
      ) {
        window.__nhienDraws.count++
        if (
          a.length !== 9 ||
          a[1] < 0 ||
          a[2] < 0 ||
          a[1] + a[3] > a[0].naturalWidth ||
          a[2] + a[4] > a[0].naturalHeight
        )
          window.__nhienDraws.invalid++
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
  const tick = async () =>
    +(await page.locator("canvas").getAttribute("data-tick"))
  const state = async () =>
    JSON.parse(await page.getByTestId("nhien-state").getAttribute("data-state"))
  const dataset = async (key) =>
    JSON.parse(await page.locator("canvas").getAttribute(`data-${key}`))
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
  const open = async () => {
    await page.goto(`${root}/dev/aw2/battle.html?team=nhien`)
    await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
    await page
      .getByTestId("battle-atlas-state")
      .filter({ hasText: "Đội luyện đã tải đủ bộ hình chiến đấu" })
      .waitFor()
    await page.waitForFunction(
      () => !!document.querySelector("canvas")?.dataset.tick,
    )
  }
  await open()
  check(
    "Own Nhiên practice has exactly five members and replaces Lua",
    (await page.locator('[data-testid^="unit-aw2-"]').count()) === 5 &&
      (await page.getByTestId("unit-aw2-nhien").count()) === 1 &&
      (await page.getByTestId("unit-aw2-lua").count()) === 0,
  )
  check(
    "Sound remains off before opt-in",
    await page.evaluate(() => window.__nhienAudio.length === 0),
  )
  await page.getByTestId("ultimate-aw2-nhien").click()
  check(
    "Out-of-range ultimate preserves energy and explains rejection",
    (await state()).energy === 100 &&
      (await page.locator("main").innerText()).includes("ngoài tầm cận chiến"),
  )
  // Use legal ally ultimates to protect the striker through the later basic
  // contacts. Without team support Nhiên can genuinely be defeated first.
  for (const id of ["than", "lam", "moc-non", "suong"])
    await page.getByTestId(`ultimate-aw2-${id}`).click()
  await until(4)
  await page.getByTestId("ultimate-aw2-nhien").click()
  check(
    "Actual selected-target ultimate spends energy and starts wind-up",
    (await state()).energy === 0 &&
      (await state()).cast?.targetId === "enemy-than",
  )
  await step()
  check(
    "Preparation creates no confirmed ultimate effect",
    !(await dataset("actor-effects"))["player-aw2-nhien"]?.some((e) =>
      e.skillId.endsWith(":ultimate"),
    ),
  )
  const contacts = []
  for (let index = 0; index < 3; index++) {
    await step()
    await page.waitForFunction(
      (index) =>
        JSON.parse(document.querySelector("canvas").dataset.actorEffects)[
          "player-aw2-nhien"
        ]?.some((e) => e.skillId.endsWith(":ultimate") && e.index === index),
      index,
    )
    const fx = (await dataset("actor-effects"))["player-aw2-nhien"].find((e) =>
      e.skillId.endsWith(":ultimate"),
    )
    contacts.push(fx)
    check(
      `Ultimate contact ${index + 1} uses its actual indexed cue and selected victim`,
      fx.index === index &&
        fx.atMs === [240, 520, 800][index] &&
        fx.targetId === "enemy-than",
    )
    const pose = (await dataset("actor-poses"))["player-aw2-nhien"]
    const cue = (await dataset("actor-cues"))["player-aw2-nhien"]
    contacts[index] = { ...fx, pose, cue }
    check(
      `Ultimate contact ${index + 1} uses own strike or actual counterplay reaction: ${pose}`,
      pose === `battle.ultimate.${index + 1}` ||
        (/^battle\.(hit|guard)\./.test(pose) && !cue.skillId),
    )
  }
  check(
    "Three contacts have distinct event serials",
    new Set(contacts.map((e) => e.serial)).size === 3,
  )
  check(
    "Final contact enters actual recovery and blocks recast",
    (await state()).nhienRecoveryUntilTick === 11 &&
      (await page.getByTestId("ultimate-aw2-nhien").isDisabled()),
  )
  await page
    .locator("canvas")
    .screenshot({ path: `${out}/${flavor}-ultimate.png` })
  const clock = await page.locator("canvas").getAttribute("data-motion-time")
  await page.waitForTimeout(100)
  check(
    "Paused presentation clock stays fixed",
    (await page.locator("canvas").getAttribute("data-motion-time")) === clock,
  )
  await until(17)
  check(
    "Actual basic reports both contacts",
    (await dataset("actor-effects"))["player-aw2-nhien"].some(
      (e) => e.skillId === "aw2-nhien:skill:basic" && e.index === 1,
    ),
  )
  const rhythm = (await state()).nhienRhythm
  check(
    "Actual distinct-target passive grants bounded energy",
    rhythm?.energyGranted > 0 &&
      rhythm.energyGranted <= 24 &&
      rhythm.procs <= 3,
  )
  const effects = (await dataset("actor-effects"))["player-aw2-nhien"]
  check(
    "Basic, sweep and passive have independent confirmed effects",
    ["basic", "auto", "passive"].every((slot) =>
      effects.some((e) => e.skillId.endsWith(`:${slot}`)),
    ),
  )
  await page.getByRole("checkbox", { name: "Âm thanh", exact: true }).check()
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
  await page.waitForFunction(
    () => window.__nhienAudio.some((s) => s.includes("/nhien/base-v1/")),
    null,
    { timeout: 15000 },
  )
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  check(
    "Confirmed Nhiên events play own audio after opt-in",
    await page.evaluate(() =>
      window.__nhienAudio.some((s) => s.includes("/nhien/base-v1/")),
    ),
  )
  await page
    .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
    .check()
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
  while (
    (await page.locator("canvas").getAttribute("data-status")) === "active" &&
    (await tick()) < 180
  )
    await step()
  await page.waitForFunction(
    () =>
      document.querySelector("canvas").dataset.status !== "active" &&
      Object.values(
        JSON.parse(document.querySelector("canvas").dataset.actorEffects),
      )
        .flat()
        .every((e) => !e.fx),
  )
  check(
    "Real terminal clears sequence/recovery and all effect playback",
    !(await state()).nhienSequence && !(await state()).nhienRecoveryUntilTick,
  )
  check(
    "Own atlas draws stay within measured source bounds",
    await page.evaluate(
      () => window.__nhienDraws.count > 0 && window.__nhienDraws.invalid === 0,
    ),
  )
  await page
    .getByRole("combobox", { name: "Cấp thử nghiệm" })
    .selectOption("10")
  await page.getByRole("button", { name: "Tạo lại trận", exact: true }).click()
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  check(
    "Level reset retains Nhiên five-member practice and applies actual stats",
    (await state()).maxHp > 170 &&
      (await page.getByTestId("unit-aw2-nhien").count()) === 1,
  )
  // Separate genuine attempt: interrupt after first ultimate contact, without
  // changing HP, event logs, combat state or injected outcomes.
  await open()
  await until(4)
  await page.getByTestId("ultimate-aw2-nhien").click()
  await until(6)
  await page.getByTestId("nhien-interrupt").click()
  check(
    "Real counterplay cancels remaining contacts without energy refund",
    !(await state()).nhienSequence &&
      (await state()).energy < 100 &&
      (await page.getByTestId("nhien-outcomes").innerText()).includes(
        "Chuỗi nhịp bị ngắt",
      ),
  )
  await until(8)
  const interrupted = await page
    .getByTestId("nhien-outcomes")
    .locator('[data-kind="hit"][data-index]')
    .evaluateAll((rows) =>
      rows.map((r) => ({ index: +r.dataset.index, action: r.dataset.action })),
    )
  check(
    "Interruption leaves exactly one ultimate contact",
    interrupted.length === 1 && interrupted[0].index === 0,
  )
  const cue = (await dataset("actor-cues"))["player-aw2-nhien"]
  check(
    "Cancelled anticipation/contact pose has stopped",
    cue?.skillId !== "aw2-nhien:skill:ultimate",
  )
  check(
    "Isolated practice preserves all seeded save bytes",
    await page.evaluate(
      (saved) =>
        Object.entries(saved).every(([k, v]) => localStorage.getItem(k) === v),
      saved,
    ),
  )
  await page.goto(`${root}/dev/aw2/roster.html?spirit=aw2-nhien`)
  await page
    .getByRole("link", { name: "trận luyện Nhiên", exact: true })
    .waitFor()
  check(
    "Reference viewer links actual practice and leaves collection pending",
    (await page.locator("main").innerText()).includes(
      "thu thập và đội lưu trong hành trình còn chờ",
    ),
  )
  check("No unexpected browser or resource errors", errors.length === 0)
  await writeFile(
    `${out}/${flavor}-combat.json`,
    JSON.stringify(
      {
        task: "AW2-007F",
        status: "PASS",
        flavor,
        engine: browser.version(),
        checks,
        errors,
        contacts,
        limits: [
          "Isolated development practice, no collection/world-team unlock",
          "Desktop viewports; no physical-device, human-listening or independent-art acceptance",
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
      {
        task: "AW2-007F",
        status: "FAIL",
        flavor,
        checks,
        errors,
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
