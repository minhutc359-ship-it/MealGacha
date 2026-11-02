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
const port = values.compiled ? 8459 : 8458
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
  errors = [],
  key = "aw2.development.save",
  out = ".asset-work/aw2-009b"
const flavor = values.compiled ? "compiled" : "source"
const url = `http://127.0.0.1:${port}/dev/aw2/world.html`
const legacy = {
  "foodchest.tcg.v1": "stable cards",
  "foodchest.user.v1": "stable user",
  "foodchest.tcg.v1.checkpoint.v4": "stable checkpoint",
  "mealgacha.progress-journal.v4": "stable journal",
  "mealgacha.progress-writer.v4": "stable writer",
}
const check = (name, condition = true) => {
  assert.ok(condition, name)
  checks.push(name)
  console.log(name)
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
    window.__tcgWrites = 0
    window.__blockTcgWrites = false
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === "aw2.development.save") {
        if (window.__blockTcgWrites)
          throw Error("Unexpected world write during practice")
        window.__tcgWrites++
      }
      return set.call(this, key, value)
    }
  })
  const page = await context.newPage()
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`)
  })
  const raw = () => page.evaluate((key) => localStorage.getItem(key), key)
  const writes = () => page.evaluate(() => window.__tcgWrites)
  const world = () => page.locator("canvas[data-party-size]").waitFor()
  const practice = page.getByTestId("tcg-practice")
  const status = () => practice.getAttribute("data-status")
  const click = (name) =>
    page.getByRole("button", { name, exact: true }).click()
  const enter = async () => {
    await click("Ghé nhanh TCG")
    await page.getByTestId("mode-lobby").waitFor()
    await click("Chơi TCG thử")
    await practice.waitFor()
  }
  const noWrites = async (expectedRaw, expectedWrites) =>
    (await raw()) === expectedRaw && (await writes()) === expectedWrites
  await mkdir(out, { recursive: true })
  await page.goto(url)
  await page
    .getByRole("button", { name: "Tạo bản lưu AW2", exact: true })
    .waitFor()
  await page.evaluate(
    (legacy) =>
      Object.entries(legacy).forEach(([key, value]) =>
        localStorage.setItem(key, value),
      ),
    legacy,
  )
  await click("Tạo bản lưu AW2")
  await world()
  const before = JSON.parse(await raw())
  await enter()
  const checkpoint = await raw(),
    writeCount = await writes()
  check(
    "Borrowed practice enters through the world adapter and focuses its heading",
    await page
      .getByRole("heading", { level: 1 })
      .evaluate((node) => document.activeElement === node),
  )
  check(
    "Practice checkpoint preserves RPG progress and economy",
    JSON.stringify(JSON.parse(checkpoint).progress) ===
      JSON.stringify(before.progress) &&
      JSON.stringify(JSON.parse(checkpoint).economy) ===
        JSON.stringify(before.economy),
  )
  await page.evaluate(() => {
    window.__blockTcgWrites = true
  })
  check(
    "Opening hand has four public cards and no opponent hand DOM",
    (await page
      .getByRole("region", { name: "Bài trên tay" })
      .locator("[data-card-id]")
      .count()) === 4 &&
      (await page
        .getByRole("region", { name: "Bàn Chủ bàn" })
        .locator("[data-card-id]")
        .count()) === 0,
  )
  await page.getByRole("button", { name: "Kết thúc lượt", exact: true }).focus()
  await page.keyboard.press("Enter")
  check(
    "Keyboard end-turn runs a real bounded opponent turn and refreshes energy",
    (await practice.getAttribute("data-turn")) === "3" &&
      (await page.getByTestId("tcg-resources").textContent()).includes(
        "Năng lượng 2/2",
      ),
  )
  let manualAttack = false,
    manualSpell = false,
    guardSeen = false
  for (let step = 0; step < 140 && (await status()) === "active"; step++) {
    const spell = page
      .getByRole("button", { name: "Dùng Hơi sương", exact: true })
      .filter({ visible: true })
    const availableSpell = await spell.evaluateAll((nodes) =>
      nodes.findIndex((node) => !node.disabled),
    )
    const attacks = page.getByRole("button", { name: /^Tấn công bằng/ })
    const availableAttack = await attacks.evaluateAll((nodes) =>
      nodes.findIndex((node) => !node.disabled),
    )
    if (!manualSpell && availableSpell >= 0) {
      const serial = await practice.getAttribute("data-event-serial")
      await spell.nth(availableSpell).click()
      check(
        "Spell selection alone does not execute or spend a card",
        (await practice.getAttribute("data-event-serial")) === serial,
      )
      await click("Hủy chọn mục tiêu")
      await spell.nth(availableSpell).click()
      await page
        .getByRole("button", { name: /^Nhắm / })
        .first()
        .click()
      manualSpell = true
    } else if (!manualAttack && availableAttack >= 0) {
      await attacks.nth(availableAttack).click()
      const hasGuard = (
        await page.getByRole("region", { name: "Bàn Chủ bàn" }).textContent()
      ).includes("Hộ vệ")
      if (hasGuard) {
        check(
          "Enemy guard removes leader targets from manual attack controls",
          (await page
            .getByRole("button", { name: "Nhắm Chủ bàn", exact: true })
            .count()) === 0,
        )
        guardSeen = true
      }
      await page
        .getByRole("button", { name: /^Nhắm / })
        .first()
        .click()
      manualAttack = true
    } else await click("Chơi nước gợi ý")
    if (manualAttack && manualSpell) break
  }
  check(
    "Manual attack and targeted tactic execute real legal commands",
    manualAttack && manualSpell,
  )
  check(
    "Playing, targeting and opponent turns make no world writes",
    await noWrites(checkpoint, writeCount),
  )
  if ((await status()) === "active") await click("Nhận thua")
  check(
    "A completed practice exposes rematch and freezes turn controls",
    (await page
      .getByRole("button", { name: "Chơi ván mới", exact: true })
      .isVisible()) &&
      (await page
        .getByRole("button", { name: "Kết thúc lượt", exact: true })
        .isDisabled()),
  )
  await click("Chơi ván mới")
  check(
    "Rematch creates a new borrowed shuffle without save writes",
    (await status()) === "active" &&
      (await practice.getAttribute("data-turn")) === "1" &&
      (await noWrites(checkpoint, writeCount)),
  )
  let moves = 0
  while ((await status()) === "active" && moves++ < 1000)
    await click("Chơi nước gợi ý")
  check(
    "Actual legal recommended moves reach a player victory (not a supplied outcome)",
    (await status()) === "player-win",
  )
  const winTurn = await practice.getAttribute("data-turn")
  await page.screenshot({
    path: `${out}/${flavor}-victory.png`,
    fullPage: true,
  })
  check(
    "Victory grants no world item, XP or write",
    await noWrites(checkpoint, writeCount),
  )
  await click("Trở về hành trình")
  await world()
  check(
    "Returning from actual victory is read-only",
    await noWrites(checkpoint, writeCount),
  )
  await page.evaluate(() => {
    window.__blockTcgWrites = false
  })
  await enter()
  const lossCheckpoint = await raw(),
    lossWrites = await writes()
  await page.evaluate(() => {
    window.__blockTcgWrites = true
  })
  let passes = 0
  while ((await status()) === "active" && passes++ < 60)
    await click("Kết thúc lượt")
  check(
    "Passing lets actual opponent damage end the match in defeat",
    (await status()) === "opponent-win" &&
      !(await practice.textContent()).includes("nhận thua ván"),
  )
  check(
    "Defeat and subsequent rematch preserve checkpoint bytes",
    await noWrites(lossCheckpoint, lossWrites),
  )
  await click("Chơi ván mới")
  await click("Nhận thua")
  check(
    "Explicit surrender records a distinct real loss",
    (await status()) === "opponent-win" &&
      (await practice.textContent()).includes("Bạn nhận thua ván này."),
  )
  await click("Chơi ván mới")
  for (let n = 0; n < 8; n++) await click("Chơi nước gợi ý")
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-testid="tcg-practice"] img')].every(
      (img) => img.complete && img.naturalWidth > 0,
    ),
  )
  check(
    "Rendered card portraits decode through canonical manifests",
    (await practice.locator("img").count()) > 0,
  )
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 })
    check(
      `Playable cards and controls fit ${width}px`,
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    )
    check(
      `Main controls retain touch targets at ${width}px`,
      await page
        .getByRole("button", { name: "Kết thúc lượt", exact: true })
        .evaluate((node) => node.getBoundingClientRect().height >= 44),
    )
    if (width === 390)
      await page.screenshot({
        path: `${out}/${flavor}-mobile.png`,
        fullPage: true,
      })
  }
  await click("Dừng ván và về hành trình")
  await world()
  check(
    "Mid-match return abandons only transient state without writes",
    await noWrites(lossCheckpoint, lossWrites),
  )
  await page.evaluate(() => {
    window.__blockTcgWrites = false
  })
  await enter()
  const reloadCheckpoint = await raw()
  await click("Chơi nước gợi ý")
  await page.reload()
  await world()
  check(
    "Reload abandons practice at the exact saved exploration checkpoint",
    (await raw()) === reloadCheckpoint &&
      (await practice.count()) === 0 &&
      (await writes()) === 0,
  )
  await enter()
  const staleCheckpoint = JSON.parse(await raw())
  const other = await context.newPage()
  await other.goto(url)
  const newer = { ...staleCheckpoint, revision: staleCheckpoint.revision + 1 }
  await other.evaluate(
    ({ key, newer }) => localStorage.setItem(key, JSON.stringify(newer)),
    { key, newer },
  )
  await other.close()
  const newerRaw = await raw(),
    serial = await practice.getAttribute("data-event-serial")
  await click("Dừng ván và về hành trình")
  await page.getByRole("alert").waitFor()
  check(
    "Stale return preserves both current practice and newer world bytes",
    (await practice.getAttribute("data-event-serial")) === serial &&
      (await raw()) === newerRaw,
  )
  await click("Đọc lại hành trình và rời ván")
  await world()
  check(
    "Explicit reread abandons stale practice without overwriting save",
    (await raw()) === newerRaw && (await practice.count()) === 0,
  )
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
  const missingContext = await browser.newContext()
  const missing = await missingContext.newPage()
  await missing.route("**/*portrait*.webp", (route) => route.abort())
  await missing.goto(url)
  await missing
    .getByRole("button", { name: "Tạo bản lưu AW2", exact: true })
    .click()
  await missing.locator("canvas[data-party-size]").waitFor()
  await missing
    .getByRole("button", { name: "Ghé nhanh TCG", exact: true })
    .click()
  await missing
    .getByRole("button", { name: "Chơi TCG thử", exact: true })
    .click()
  await missing
    .getByRole("alert")
    .filter({ hasText: "Không tải được ảnh" })
    .first()
    .waitFor()
  check(
    "Missing portrait reports explicit text while legal gameplay remains usable",
    await missing
      .getByRole("button", { name: "Kết thúc lượt", exact: true })
      .isEnabled(),
  )
  await missingContext.close()
  if (errors.length) console.error(errors)
  check(
    "No unexpected primary console/page/resource errors",
    errors.length === 0,
  )
  const report = {
    status: "PASS",
    flavor,
    engine: browser.version(),
    checks,
    errors,
    win: { seed: 20261022, moves, turn: +winTurn },
    loss: { seed: 20261021, passes },
    manualAttack,
    manualSpell,
    guardSeen,
    scope:
      "AW2 borrowed TCG practice; no rewards, production balance, Auto Chess or physical-device QA",
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
