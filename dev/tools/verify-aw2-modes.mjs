import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"

const { values } = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
    compiled: { type: "boolean", default: false },
  },
})
const { chromium } = await import(values.playwright)
const port = values.compiled ? 8457 : 8456
const server = values.compiled
  ? await preview({
      configFile: "dev/vite.aw2.config.ts",
      preview: { host: "127.0.0.1", port, strictPort: true },
    })
  : await createServer({
      configFile: "dev/vite.dev.config.ts",
      server: { host: "127.0.0.1", port, strictPort: true },
    })
let browser
const checks = [],
  errors = []
const key = "aw2.development.save"
const url = `http://127.0.0.1:${port}/dev/aw2/world.html`
const out = ".asset-work/aw2-009a"
const flavor = values.compiled ? "compiled" : "source"
const check = (name, condition = true) => {
  assert.ok(condition, name)
  checks.push(name)
  console.log(name)
}
const legacy = {
  "foodchest.tcg.v1": "original stable cards",
  "foodchest.user.v1": "original stable user",
  "foodchest.tcg.v1.checkpoint.v4": "original stable checkpoint",
  "mealgacha.progress-journal.v4": "original stable journal",
  "mealgacha.progress-writer.v4": "original stable writer",
}
try {
  if (!values.compiled) await server.listen()
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
    viewport: { width: 1280, height: 1000 },
  })
  await context.addInitScript(() => {
    window.__aw2Writes = []
    window.__aw2Fail = false
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === "aw2.development.save" && window.__aw2Fail)
        throw new DOMException("fixture quota", "QuotaExceededError")
      const result = set.call(this, key, value)
      if (key === "aw2.development.save") window.__aw2Writes.push(value)
      return result
    }
  })
  const page = await context.newPage()
  context.on("page", (other) => {
    other.on("pageerror", (cause) => errors.push(cause.message))
  })
  page.on("pageerror", (cause) => errors.push(cause.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`)
  })
  const raw = () => page.evaluate((key) => localStorage.getItem(key), key)
  const countWrites = () => page.evaluate(() => window.__aw2Writes.length)
  const world = () => page.locator("canvas[data-party-size]").waitFor()
  const lobby = (id, entry) =>
    page
      .locator(
        `[data-testid="mode-lobby"][data-mode-id="${id}"][data-entry="${entry}"]`,
      )
      .waitFor()
  const seed = async (save) => {
    await page.evaluate(
      ({ key, save }) => localStorage.setItem(key, JSON.stringify(save)),
      { key, save },
    )
    await page.reload()
    await world()
  }
  const go = async (x, y) => {
    const map = page.getByTestId("world-map")
    await map.scrollIntoViewIfNeeded()
    const box = await map.boundingBox()
    await page.mouse.click(
      box.x + (x / 640) * box.width,
      box.y + (y / 384) * box.height,
    )
    await page.waitForFunction(
      ({ x, y }) => {
        const match = document
          .querySelector('[data-testid="player-position"]')
          ?.textContent.match(/Vị trí (\d+), (\d+)/)
        return (
          match && Math.abs(+match[1] - x) < 2 && Math.abs(+match[2] - y) < 2
        )
      },
      { x, y },
    )
  }
  await mkdir(out, { recursive: true })
  await page.goto(url)
  await page
    .getByRole("button", { name: "Tạo bản lưu AW2", exact: true })
    .waitFor()
  check(
    "Opening world grants nothing and offers no quick-entry without a ready save",
    (await raw()) === null &&
      (await page
        .getByRole("navigation", { name: "Ghé bàn nhanh" })
        .count()) === 0,
  )
  await page.evaluate(
    (legacy) =>
      Object.entries(legacy).forEach(([key, value]) =>
        localStorage.setItem(key, value),
      ),
    legacy,
  )
  await page
    .getByRole("button", { name: "Tạo bản lưu AW2", exact: true })
    .click()
  await world()
  const initial = JSON.parse(await raw())
  await go(192, 224)
  const before = await raw()
  await page.evaluate(() => {
    window.__aw2Fail = true
  })
  await page.getByRole("button", { name: "Ghé nhanh TCG", exact: true }).click()
  await page.getByRole("alert").waitFor()
  check(
    "Failed quick-entry checkpoint leaves exact bytes and mounts no lobby",
    (await raw()) === before &&
      (await page.getByTestId("mode-lobby").count()) === 0,
  )
  await page.evaluate(() => {
    window.__aw2Fail = false
  })
  const beforeDouble = await countWrites()
  await page
    .getByRole("button", { name: "Ghé nhanh TCG", exact: true })
    .dblclick()
  await lobby("tcg", "quick-entry")
  const checkpoint = await raw(),
    parsed = JSON.parse(checkpoint)
  check(
    "Quick-entry checkpoints local movement exactly once after a double click",
    Math.abs(parsed.progress.x - 192) < 2 &&
      Math.abs(parsed.progress.y - 224) < 2 &&
      (await countWrites()) === beforeDouble + 1,
  )
  check(
    "Entry preserves quest/economy and exposes an honest lobby with focused heading",
    parsed.progress.questIndex === 0 &&
      JSON.stringify(parsed.economy) === JSON.stringify(initial.economy) &&
      (await page
        .getByText("Bộ bài luyện tập đã sẵn sàng", { exact: true })
        .isVisible()) &&
      (await page
        .getByRole("heading", { level: 1 })
        .evaluate((heading) => document.activeElement === heading)),
  )
  check(
    "Mode visit unmounts exploration and offers no nested mode entry",
    (await page.locator("canvas").count()) === 0 &&
      (await page
        .getByRole("navigation", { name: "Ghé bàn nhanh" })
        .count()) === 0,
  )
  await page.keyboard.press("w")
  await page
    .getByRole("button", { name: "Trở về hành trình", exact: true })
    .click()
  await world()
  check(
    "Return restores its world checkpoint without a second write or reward",
    (await raw()) === checkpoint &&
      (await countWrites()) === beforeDouble + 1 &&
      (await page
        .getByTestId("player-position")
        .innerText()
        .then((s) => /192, 224/.test(s))),
  )
  check(
    "Return restores keyboard focus to world heading",
    await page
      .getByRole("heading", { level: 1 })
      .evaluate((heading) => document.activeElement === heading),
  )
  await page
    .getByRole("button", { name: "Ghé nhanh Auto Chess", exact: true })
    .click()
  await lobby("auto-chess", "quick-entry")
  const chessRaw = await raw()
  await page.reload()
  await world()
  check(
    "Reload abandons Auto Chess lobby at its saved checkpoint with no resume/grant",
    (await raw()) === chessRaw &&
      (await page.getByTestId("mode-lobby").count()) === 0,
  )

  for (const [id, name, x] of [
    ["tcg", "TCG", 240],
    ["auto-chess", "Auto Chess", 432],
  ]) {
    const save = JSON.parse(await raw())
    save.progress = {
      ...save.progress,
      zoneId: "aw2-zone-lantern-street",
      x,
      y: 272,
    }
    await seed(save)
    const portalRaw = await raw()
    await page.keyboard.press("e")
    await page.getByRole("dialog").waitFor()
    await page
      .getByRole("button", { name: "Để sau / Đóng", exact: true })
      .click()
    check(
      `Closing ${name} portal dialogue does not enter or write`,
      (await raw()) === portalRaw &&
        (await page.getByTestId("mode-lobby").count()) === 0,
    )
    await page.keyboard.press("e")
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Ghé bàn", exact: true })
      .click()
    await lobby(id, "portal")
    const entered = await raw()
    await page
      .getByRole("button", { name: "Trở về hành trình", exact: true })
      .click()
    await world()
    check(
      `${name} portal uses the same checkpoint/return policy`,
      (await raw()) === entered &&
        JSON.parse(entered).revision === JSON.parse(portalRaw).revision + 1 &&
        JSON.stringify(JSON.parse(entered).progress) ===
          JSON.stringify(save.progress),
    )
  }

  const other = await context.newPage()
  await other.goto(url)
  await other.locator("canvas[data-party-size]").waitFor()
  await other.getByRole("button", { name: "Lưu vị trí", exact: true }).click()
  await other.getByRole("status").filter({ hasText: "Đã lưu vị trí" }).waitFor()
  const newer = await raw()
  await page.getByRole("button", { name: "Ghé nhanh TCG", exact: true }).click()
  await page.getByRole("alert").waitFor()
  check(
    "Stale-tab entry cannot overwrite newer save or mount a lobby",
    (await raw()) === newer &&
      (await page.getByTestId("mode-lobby").count()) === 0,
  )
  await page.getByRole("button", { name: "Đọc lại", exact: true }).click()
  await world()
  await page.getByRole("button", { name: "Ghé nhanh TCG", exact: true }).click()
  await lobby("tcg", "quick-entry")
  await other.reload()
  await other.locator("canvas[data-party-size]").waitFor()
  await other.getByRole("button", { name: "Lưu vị trí", exact: true }).click()
  await other.getByRole("status").filter({ hasText: "Đã lưu vị trí" }).waitFor()
  const newerReturn = await raw()
  await page
    .getByRole("button", { name: "Trở về hành trình", exact: true })
    .click()
  await page.getByRole("alert").filter({ hasText: "Đọc lại" }).waitFor()
  check(
    "Changed checkpoint rejects stale return and preserves the newer bytes",
    (await raw()) === newerReturn &&
      (await page.getByTestId("mode-lobby").isVisible()),
  )
  await page
    .getByRole("button", { name: "Đọc lại hành trình", exact: true })
    .click()
  await world()
  check(
    "Reread discards the stale visit without writing or reopening it",
    (await raw()) === newerReturn &&
      (await page.getByTestId("mode-lobby").count()) === 0,
  )
  await other.close()

  await page
    .getByRole("button", { name: "Ghé nhanh Auto Chess", exact: true })
    .click()
  await lobby("auto-chess", "quick-entry")
  await page.screenshot({
    path: `${out}/${flavor}-desktop.png`,
    fullPage: true,
  })
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 })
    check(
      `Lobby fits ${width}px`,
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
  await page.evaluate((key) => localStorage.setItem(key, "{invalid"), key)
  await page
    .getByRole("button", { name: "Trở về hành trình", exact: true })
    .click()
  await page.getByRole("alert").waitFor()
  await page
    .getByRole("button", { name: "Đọc lại hành trình", exact: true })
    .click()
  await page.getByRole("alert").filter({ hasText: "invalid" }).waitFor()
  check(
    "Corrupt save remains intact and reread disables mode entry",
    (await raw()) === "{invalid" &&
      (await page
        .getByRole("navigation", { name: "Ghé bàn nhanh" })
        .count()) === 0,
  )

  const boss = structuredClone(initial)
  boss.progress = {
    ...boss.progress,
    zoneId: "aw2-zone-kitchen-table",
    x: 320,
    y: 128,
    questIndex: 3,
    accepted: true,
    tableRead: true,
    memories: [
      "aw2-event-memory-vendor",
      "aw2-event-memory-chair",
      "aw2-event-memory-bowl",
    ],
    threadChoice: "wait",
    hintRead: true,
    puzzleStep: 3,
    partyIds: ["aw2-than", "aw2-lua", "aw2-lam", "aw2-moc-non", "aw2-suong"],
  }
  await seed(boss)
  await page.keyboard.press("e")
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Bắt đầu thử thách", exact: true })
    .click()
  await page.getByTestId("world-battle").waitFor()
  check(
    "Actual world battle exposes no mode entry or lobby",
    (await page.getByRole("navigation", { name: "Ghé bàn nhanh" }).count()) ===
      0 && (await page.getByTestId("mode-lobby").count()) === 0,
  )
  const battleRaw = await raw()
  await page
    .getByRole("button", { name: "Đọc lại và rời trận", exact: true })
    .click()
  await world()
  check(
    "Abandoning battle keeps its checkpoint and does not infer a mode or victory",
    (await raw()) === battleRaw &&
      !JSON.parse(battleRaw).progress.bossDefeated &&
      (await page.getByTestId("mode-lobby").count()) === 0,
  )
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 })
    check(
      `World quick-entry controls fit ${width}px`,
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    )
  }
  check(
    "All seeded stable keys remain byte-identical",
    await page.evaluate(
      (legacy) =>
        Object.entries(legacy).every(
          ([key, value]) => localStorage.getItem(key) === value,
        ),
      legacy,
    ),
  )
  if (errors.length) console.error(JSON.stringify({ errors }, null, 2))
  check("No unexpected console/page/resource errors", errors.length === 0)
  const report = {
    status: "PASS",
    flavor,
    engine: browser.version(),
    checks,
    errors,
    scope:
      "MODE-01 navigation/lobby regression only; playable TCG verified separately; no prize or device QA",
  }
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(report, null, 2) + "\n",
  )
  console.log(JSON.stringify({ status: "PASS", flavor, checks: checks.length }))
} finally {
  await browser?.close()
  if (values.compiled)
    await new Promise((resolve) => server.httpServer.close(resolve))
  else await server.close()
}
