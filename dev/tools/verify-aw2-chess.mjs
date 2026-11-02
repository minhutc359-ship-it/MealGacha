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
const port = values.compiled ? 8461 : 8460,
  flavor = values.compiled ? "compiled" : "source"
const server = values.compiled
  ? await preview({
      configFile: "dev/vite.aw2.config.ts",
      preview: { host: "127.0.0.1", port, strictPort: true },
    })
  : await createServer({
      configFile: "dev/vite.dev.config.ts",
      server: { host: "127.0.0.1", port, strictPort: true },
    })
const out = ".asset-work/aw2-009c",
  key = "aw2.development.save",
  url = `http://127.0.0.1:${port}/dev/aw2/world.html`
const checks = [],
  errors = [],
  legacy = {
    "foodchest.tcg.v1": "stable-cards",
    "foodchest.user.v1": "stable-user",
    "foodchest.tcg.v1.checkpoint.v4": "stable-checkpoint",
    "mealgacha.progress-journal.v4": "stable-journal",
    "mealgacha.progress-writer.v4": "stable-writer",
  }
const check = (name, condition = true) => {
  assert.ok(condition, name)
  checks.push(name)
  console.log(name)
}
let browser
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
    window.__chessWrites = 0
    window.__chessBlock = false
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === "aw2.development.save") {
        if (window.__chessBlock)
          throw Error("Unexpected world write during chess")
        window.__chessWrites++
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
  const click = (name) =>
    page.getByRole("button", { name, exact: true }).click()
  const raw = () => page.evaluate((key) => localStorage.getItem(key), key)
  const writes = () => page.evaluate(() => window.__chessWrites)
  const world = () => page.locator("canvas[data-party-size]").waitFor()
  const practice = page.getByTestId("chess-practice"),
    bench = page.getByRole("region", { name: "Hàng chờ", exact: true })
  const phase = () => practice.getAttribute("data-phase"),
    tick = async () => +(await practice.getAttribute("data-tick")),
    gold = async () => +(await page.getByTestId("chess-gold").textContent())
  const enter = async () => {
    await click("Ghé nhanh Auto Chess")
    await page.getByTestId("mode-lobby").waitFor()
    await click("Chơi Auto Chess thử")
    await practice.waitFor()
  }
  const owned = () => practice.locator("[data-piece-id]").evaluateAll((nodes) =>
      nodes.map((node) => ({
        uid: node.dataset.pieceId,
        id: node.dataset.spiritId,
        stars: +node.dataset.stars,
      })),
    )
  const buy = async (slot) =>
    page.locator(`[data-offer]`).nth(slot).getByRole("button").click()
  const noWrites = async (expected, count) =>
    (await raw()) === expected && (await writes()) === count
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
  let checkpoint = await raw(),
    writeCount = await writes()
  await page.evaluate(() => {
    window.__chessBlock = true
  })
  check(
    "Actual Auto Chess mounts through the adapter with focused heading",
    await page
      .getByRole("heading", { level: 1 })
      .evaluate((node) => document.activeElement === node),
  )
  check(
    "Entry preserves RPG progress/economy and starts only borrowed 10 gold",
    (await gold()) === 10 &&
      JSON.stringify(JSON.parse(checkpoint).progress) ===
        JSON.stringify(before.progress) &&
      JSON.stringify(JSON.parse(checkpoint).economy) ===
        JSON.stringify(before.economy),
  )
  check(
    "Empty formation cannot begin battle",
    await page
      .getByRole("button", { name: "Bắt đầu giao tranh", exact: true })
      .isDisabled(),
  )
  await buy(0)
  await buy(1)
  const initial = await owned(),
    first = initial[0].uid,
    second = initial[1].uid
  await bench.locator(`[data-piece-id="${first}"]`).click()
  await page.locator("[data-cell='0']").click()
  await bench.locator(`[data-piece-id="${second}"]`).click()
  await page.locator("[data-cell='4']").click()
  await page.locator("[data-cell='0']").click()
  await page.locator("[data-cell='4']").click()
  check(
    "Click placement and swap preserve distinct unit identities",
    (await page.locator("[data-cell='4']").getAttribute("data-piece-id")) ===
      first &&
      (await page.locator("[data-cell='0']").getAttribute("data-piece-id")) ===
        second,
  )
  await page.locator("[data-cell='4']").click()
  await click("Đưa về hàng chờ")
  await bench.locator(`[data-piece-id="${first}"]`).click()
  const beforeSell = await gold()
  await page.getByRole("button", { name: /^Bán quân đã chọn/ }).click()
  check(
    "Benching and selling return borrowed currency without changing RPG",
    (await gold()) > beforeSell &&
      (await owned()).length === 1 &&
      (await noWrites(checkpoint, writeCount)),
  )
  await page.getByRole("button", { name: "Khóa quầy", exact: true }).focus()
  await page.keyboard.press("Enter")
  check(
    "Lock is explicit and prevents paid refresh",
    (await page
      .getByRole("button", { name: "Mở khóa quầy", exact: true })
      .getAttribute("aria-pressed")) === "true" &&
      (await page
        .getByRole("button", { name: "Đổi quầy · 1 vàng", exact: true })
        .isDisabled()),
  )
  await click("Mở khóa quầy")
  const beforeRefresh = await gold()
  await click("Đổi quầy · 1 vàng")
  check(
    "Refresh spends exactly one practice gold",
    (await gold()) === beforeRefresh - 1,
  )
  await click("Nhận thua ván cờ")
  check(
    "Surrender is distinct terminal state with no grants",
    (await practice.getAttribute("data-status")) === "opponent-win" &&
      (await practice.textContent()).includes("Bạn nhận thua ván luyện tập.") &&
      (await noWrites(checkpoint, writeCount)),
  )
  await click("Chơi ván cờ mới")
  check(
    "Rematch resets only borrowed match resources",
    (await phase()) === "planning" &&
      (await gold()) === 10 &&
      (await owned()).length === 0 &&
      (await noWrites(checkpoint, writeCount)),
  )
  await click("Dừng ván cờ và về hành trình")
  await world()
  check(
    "Returning after planning/rematch is byte-identical and read-only",
    await noWrites(checkpoint, writeCount),
  )
  await page.evaluate(() => {
    window.__chessBlock = false
  })
  await enter()
  checkpoint = await raw()
  writeCount = await writes()
  await page.evaluate(() => {
    window.__chessBlock = true
  })
  let merged = false,
    totalTicks = 0,
    winRounds = [],
    pauseVerified = false
  const recruit = async () => {
    for (let tries = 0; tries < 40; tries++) {
      const units = await owned()
      merged ||= units.some((unit) => unit.stars === 2)
      const offers = await page.locator("[data-offer]").evaluateAll((nodes) =>
        nodes.map((node, slot) => ({
          id: node.dataset.offer,
          slot,
          usable:
            !!node.querySelector("button") &&
            !node.querySelector("button").disabled,
        })),
      )
      const score = (id) =>
        units.filter((unit) => unit.id === id && unit.stars === 1).length * 20 +
        (!units.some((unit) => unit.id === id) ? 8 : 0)
      offers.sort((a, b) => score(b.id) - score(a.id))
      const offer = offers.find((offer) => offer.usable)
      if (offer) {
        await buy(offer.slot)
        await click("Xếp đội gợi ý")
        continue
      }
      if ((await gold()) < 3 || units.length >= 8) break
      await click("Đổi quầy · 1 vàng")
    }
    await click("Xếp đội gợi ý")
  }
  while ((await phase()) !== "finished") {
    assert.equal(await phase(), "planning")
    await recruit()
    if (winRounds.length === 0) {
      await page.waitForFunction(() =>
        [
          ...document.querySelectorAll('[data-testid="chess-practice"] img'),
        ].every((img) => img.complete && img.naturalWidth > 0),
      )
      check(
        "Shop/formation portraits decode through canonical manifests",
        (await practice.locator("img").count()) > 0,
      )
      for (const width of [320, 390, 768]) {
        await page.setViewportSize({ width, height: 844 })
        check(
          `Shop/bench/formation fit ${width}px`,
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        check(
          `Main controls retain 44px targets at ${width}px`,
          await page
            .getByRole("button", { name: "Bắt đầu giao tranh", exact: true })
            .evaluate((node) => node.getBoundingClientRect().height >= 44),
        )
        if (width === 390)
          await page.screenshot({
            path: `${out}/${flavor}-mobile-planning.png`,
            fullPage: true,
          })
      }
    }
    await click("Bắt đầu giao tranh")
    if (
      await page
        .getByRole("button", { name: "Tạm dừng giao tranh", exact: true })
        .count()
    )
      await click("Tạm dừng giao tranh")
    if (!pauseVerified) {
      const at = await tick()
      await page.waitForTimeout(900)
      check(
        "Pause freezes authoritative auto-combat ticks",
        (await tick()) === at,
      )
      await click("Tiến một nhịp")
      check(
        "Single-step advances one genuine combat tick",
        (await tick()) === at + 1,
      )
      await click("Tiếp tục giao tranh")
      await page.waitForFunction(
        (at) =>
          +document.querySelector('[data-testid="chess-practice"]').dataset
            .tick > at,
        at + 1,
      )
      await click("Tạm dừng giao tranh")
      check(
        "Resume runs actual auto battle and hides planning mutations",
        (await tick()) > at + 1 &&
          (await page
            .getByRole("region", { name: "Quầy tuyển quân", exact: true })
            .count()) === 0,
      )
      await page.screenshot({
        path: `${out}/${flavor}-battle.png`,
        fullPage: true,
      })
      pauseVerified = true
    }
    let ticks = 0
    while ((await phase()) === "battle" && ticks++ < 81) {
      await click("Tiến một nhịp")
      totalTicks++
    }
    assert.ok(
      (await phase()) === "round-result" || (await phase()) === "finished",
    )
    winRounds.push({
      round: +(await practice.getAttribute("data-round")),
      tick: await tick(),
      outcome: await page
        .getByRole("region", { name: "Bàn giao tranh", exact: true })
        .getByRole("heading")
        .textContent(),
    })
    if ((await phase()) === "round-result") {
      const incomeBefore = await gold()
      await click("Vòng tiếp · nhận 6 vàng")
      assert.equal(await gold(), incomeBefore + 6)
    }
  }
  check(
    "Legal recruitment/formation and real combat survive all five rounds",
    (await practice.getAttribute("data-status")) === "player-win" &&
      winRounds.length === 5,
  )
  check(
    "Actual recruitment automatically merges three copies into 2-star units",
    merged,
  )
  check(
    "Combat, round income and final victory never write world save",
    await noWrites(checkpoint, writeCount),
  )
  await page.screenshot({
    path: `${out}/${flavor}-victory.png`,
    fullPage: true,
  })
  await click("Trở về hành trình")
  await world()
  check(
    "Returning from genuine victory grants nothing",
    await noWrites(checkpoint, writeCount),
  )
  await page.evaluate(() => {
    window.__chessBlock = false
  })
  await enter()
  checkpoint = await raw()
  writeCount = await writes()
  await page.evaluate(() => {
    window.__chessBlock = true
  })
  await buy(0)
  const weak = (await owned())[0].uid
  await bench.locator(`[data-piece-id="${weak}"]`).click()
  await page.locator("[data-cell='3']").click()
  let lossRounds = 0
  while ((await phase()) !== "finished" && lossRounds++ < 6) {
    await click("Bắt đầu giao tranh")
    if (
      await page
        .getByRole("button", { name: "Tạm dừng giao tranh", exact: true })
        .count()
    )
      await click("Tạm dừng giao tranh")
    let ticks = 0
    while ((await phase()) === "battle" && ticks++ < 81)
      await click("Tiến một nhịp")
    if ((await phase()) === "round-result")
      await click("Vòng tiếp · nhận 6 vàng")
  }
  check(
    "Weak legal formation loses the match from actual combat damage",
    (await phase()) === "finished" &&
      (await practice.getAttribute("data-status")) === "opponent-win" &&
      (await practice.textContent()).includes("Máu 0/12") &&
      !(await practice.textContent()).includes("nhận thua ván luyện tập"),
  )
  check(
    "Actual defeat makes no world save write or reward",
    await noWrites(checkpoint, writeCount),
  )
  await click("Chơi ván cờ mới")
  await buy(0)
  await click("Xếp đội gợi ý")
  await click("Bắt đầu giao tranh")
  await click("Dừng ván cờ và về hành trình")
  await world()
  await page.waitForTimeout(900)
  check(
    "Returning during running auto battle abandons match and cleans its timer",
    (await noWrites(checkpoint, writeCount)) && (await practice.count()) === 0,
  )
  await page.evaluate(() => {
    window.__chessBlock = false
  })
  await enter()
  const reloadRaw = await raw()
  await buy(0)
  await page.reload()
  await world()
  check(
    "Reload discards borrowed roster/currency at exact exploration checkpoint",
    (await raw()) === reloadRaw &&
      (await practice.count()) === 0 &&
      (await writes()) === 0,
  )
  await enter()
  const current = JSON.parse(await raw()),
    other = await context.newPage()
  await other.goto(url)
  await other.evaluate(
    ({ key, current }) =>
      localStorage.setItem(
        key,
        JSON.stringify({ ...current, revision: current.revision + 1 }),
      ),
    { key, current },
  )
  await other.close()
  const newerRaw = await raw(),
    beforeStaleGold = await gold()
  await click("Dừng ván cờ và về hành trình")
  await page.getByRole("alert").waitFor()
  check(
    "Stale return preserves match and newer-tab save bytes",
    (await practice.isVisible()) &&
      (await gold()) === beforeStaleGold &&
      (await raw()) === newerRaw,
  )
  await click("Đọc lại hành trình và rời bàn cờ")
  await world()
  check(
    "Explicit reread abandons stale chess without overwriting current save",
    (await raw()) === newerRaw,
  )
  check(
    "Every seeded legacy key stays byte-identical",
    await page.evaluate(
      (legacy) =>
        Object.entries(legacy).every(
          ([key, value]) => localStorage.getItem(key) === value,
        ),
      legacy,
    ),
  )
  const missingContext = await browser.newContext(),
    missing = await missingContext.newPage()
  await missing.route("**/*portrait*.webp", (route) => route.abort())
  await missing.goto(url)
  await missing
    .getByRole("button", { name: "Tạo bản lưu AW2", exact: true })
    .click()
  await missing.locator("canvas[data-party-size]").waitFor()
  await missing
    .getByRole("button", { name: "Ghé nhanh Auto Chess", exact: true })
    .click()
  await missing
    .getByRole("button", { name: "Chơi Auto Chess thử", exact: true })
    .click()
  await missing
    .getByRole("alert")
    .filter({ hasText: "Không tải được ảnh" })
    .first()
    .waitFor()
  check(
    "Missing portraits are explicit text errors with recruitment still usable",
    await missing.getByRole("button", { name: /^Mua / }).first().isEnabled(),
  )
  await missingContext.close()
  if (errors.length) console.error(errors)
  check(
    "No unexpected primary console/page/resource errors",
    errors.length === 0,
  )
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        status: "PASS",
        flavor,
        engine: browser.version(),
        checks,
        errors,
        winRounds,
        lossRounds,
        merged,
        totalTicks,
        scope:
          "Borrowed AW2 Auto Chess development practice; no RPG rewards, production balance, art/device/rights/full mode QA",
      },
      null,
      2,
    ) + "\n",
  )
  console.log(JSON.stringify({ status: "PASS", flavor, checks: checks.length }))
} finally {
  await browser?.close()
  if (values.compiled)
    await new Promise((resolve) => server.httpServer.close(resolve))
  else await server.close()
}
