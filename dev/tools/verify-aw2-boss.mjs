import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { isAbsolute, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { createServer, preview } from "vite"

const { values } = parseArgs({
  options: {
    compiled: { type: "boolean", default: false },
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
  },
})
const { chromium } = await import(
  isAbsolute(values.playwright)
    ? pathToFileURL(resolve(values.playwright)).href
    : values.playwright
)
const flavor = values.compiled ? "compiled" : "source",
  port = values.compiled ? 8471 : 8470,
  root = `http://127.0.0.1:${port}`,
  out = ".asset-work/aw2-007d"
const checks = [],
  errors = [],
  runs = []
const check = (name, condition = true) => {
  assert.ok(condition, name)
  checks.push(name)
  console.log(name)
}
const fixture = {
  gameId: "adventure-world-2",
  environment: "development",
  schemaVersion: 3,
  saveId: "00000000-0000-4000-8000-000000000001",
  revision: 8,
  createdAt: "2026-10-20T08:00:00.000Z",
  updatedAt: "2026-10-20T08:00:00.000Z",
  progress: {
    zoneId: "aw2-zone-kitchen-table",
    x: 320,
    y: 128,
    facing: "right",
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
    bossDefeated: false,
    tableNoteRead: false,
    endingChoice: null,
  },
}
let browser, server
try {
  await mkdir(out, { recursive: true })
  server = values.compiled
    ? await preview({
        configFile: "dev/vite.aw2.config.ts",
        preview: { host: "127.0.0.1", port, strictPort: true },
      })
    : await createServer({
        configFile: "dev/vite.dev.config.ts",
        server: { host: "127.0.0.1", port, strictPort: true },
      })
  if (!values.compiled) await server.listen()
  browser = await chromium.launch({
    executablePath: values.chromium,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--use-angle=swiftshader",
    ],
  })
  const start = async () => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 1000 },
    })
    await context.addInitScript((fixture) => {
      if (localStorage.getItem("aw2.development.save") === null)
        localStorage.setItem("aw2.development.save", JSON.stringify(fixture))
      if (localStorage.getItem("foodchest.user.v1") === null)
        localStorage.setItem("foodchest.user.v1", "stable-user-fixture")
    }, fixture)
    const page = await context.newPage()
    page.on("pageerror", (e) => errors.push(e.message))
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text())
    })
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
    })
    await page.goto(`${root}/dev/aw2/world.html`)
    await page.getByTestId("player-position").waitFor()
    await page.keyboard.press("e")
    await page
      .getByRole("button", { name: "Bắt đầu thử thách", exact: true })
      .click()
    await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="world-battle"] canvas')?.dataset
          .status === "active",
    )
    const canvas = page.locator("canvas")
    const raw = () =>
      page.evaluate(() => localStorage.getItem("aw2.development.save"))
    const step = async () => {
      const tick = +(await canvas.getAttribute("data-tick"))
      await page
        .getByRole("button", { name: "Bước 1 nhịp", exact: true })
        .click()
      await page.waitForFunction(
        (t) => +document.querySelector("canvas").dataset.tick === t + 1,
        tick,
      )
    }
    return { context, page, canvas, raw, step }
  }
  const first = await start()
  const checkpoint = await first.raw()
  while (+(await first.canvas.getAttribute("data-tick")) < 3) await first.step()
  const protection = first.page.getByTestId("boss-protection")
  check(
    "Real Ghế trống activates with a finite four-basic protection counter",
    (await protection.locator("progress").getAttribute("max")) === "4" &&
      +(await protection.locator("progress").getAttribute("value")) > 0,
  )
  const pausedText = await first.page.getByTestId("boss-telegraph").innerText()
  await first.page.waitForTimeout(800)
  check(
    "Pause freezes the authoritative boss countdown/protection",
    (await first.page.getByTestId("boss-telegraph").innerText()) === pausedText,
  )
  for (const width of [390, 320]) {
    await first.page.setViewportSize({ width, height: 844 })
    await first.page.locator(".aw2-battle-jumps a").first().click()
    const visible = await first.page
      .getByTestId("boss-telegraph")
      .evaluate((el) => {
        const r = el.getBoundingClientRect()
        return (
          r.top >= 0 &&
          r.bottom <= innerHeight &&
          document.documentElement.scrollWidth <= innerWidth
        )
      })
    check(
      `${width}px sticky protection remains visible at manual ultimate controls`,
      visible,
    )
    check(
      `${width}px jump leaves the first ultimate uncovered by the sticky panel`,
      await first.page
        .getByTestId("world-ultimate-aw2-than")
        .evaluate((button) => {
          const box = button.getBoundingClientRect()
          const at = document.elementFromPoint(
            box.x + box.width / 2,
            box.y + box.height / 2,
          )
          return at === button || button.contains(at)
        }),
    )
    await first.page
      .getByTestId("boss-telegraph")
      .screenshot({ path: `${out}/${flavor}-protection-${width}.png` })
    await first.page.screenshot({
      path: `${out}/${flavor}-controls-${width}.png`,
    })
  }
  while (+(await first.canvas.getAttribute("data-tick")) < 12)
    await first.step()
  for (const remaining of [3, 2, 1]) {
    check(
      `Mời hụt displays real remaining beat ${remaining}`,
      (await first.page.getByTestId("boss-intent").innerText()).includes(
        `Mời hụt · còn ${remaining} nhịp`,
      ),
    )
    if (remaining === 3)
      await first.page
        .getByTestId("boss-telegraph")
        .screenshot({ path: `${out}/${flavor}-sweep.png` })
    await first.step()
  }
  check(
    "Sweep warning ends after its actual scheduled resolution",
    !(await first.page.getByTestId("boss-intent").innerText()).includes(
      "Mời hụt",
    ),
  )
  while (+(await first.canvas.getAttribute("data-tick")) < 21)
    await first.step()
  for (const remaining of [3, 2, 1]) {
    check(
      `Tắt bếp exposes countdown ${remaining} with audio off`,
      (await first.page.getByTestId("boss-intent").innerText()).includes(
        `Tắt bếp · còn ${remaining} nhịp`,
      ),
    )
    if (remaining === 3)
      await first.page
        .getByTestId("boss-telegraph")
        .screenshot({ path: `${out}/${flavor}-snuff.png` })
    await first.step()
  }
  check(
    "Live combat progress cannot write boss victory before explicit settlement",
    (await first.raw()) === checkpoint,
  )
  await first.page
    .getByRole("button", { name: "Rút lui về Sân", exact: true })
    .click()
  check(
    "Retreat suppresses outstanding warning/protection display",
    (await first.page.getByTestId("boss-telegraph").innerText()).includes(
      "Thử thách đã kết thúc.",
    ) && (await first.page.getByTestId("boss-protection").count()) === 0,
  )
  await first.page
    .getByRole("button", { name: "Lưu kết quả và trở về", exact: true })
    .click()
  await first.page.getByTestId("player-position").waitFor()
  const retreated = JSON.parse(await first.raw())
  check(
    "Retreat returns to the safe yard with accepted objectives and no boss grant",
    retreated.progress.zoneId === "aw2-zone-forgotten-kitchen-yard" &&
      retreated.progress.bossDefeated === false &&
      retreated.progress.questIndex === 3 &&
      retreated.progress.accepted &&
      retreated.economy.receipts.length === 0,
  )
  await first.context.close()

  for (const strategy of ["auto-only", "hold-damage-ultimates-for-barrier"]) {
    const run = await start()
    const before = await run.raw()
    await run.page
      .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
      .check()
    for (
      let turn = 0;
      turn < 180 && (await run.canvas.getAttribute("data-status")) === "active";
      turn++
    ) {
      const tick = +(await run.canvas.getAttribute("data-tick"))
      if (strategy !== "auto-only" && tick >= 5) {
        const barrier =
          (await run.page.getByTestId("boss-protection").count()) > 0
        for (const id of ["than", "lua", "lam", "moc-non", "suong"]) {
          const button = run.page.getByTestId(`world-ultimate-aw2-${id}`)
          if (barrier && ["lua", "suong"].includes(id)) continue
          if (await button.isEnabled()) await button.click()
        }
      }
      await run.step()
    }
    const result = await run.canvas.getAttribute("data-status"),
      tick = +(await run.canvas.getAttribute("data-tick"))
    runs.push({ strategy, result, tick })
    check(
      `${strategy} reaches its real ${
        strategy === "auto-only" ? "enemy-win" : "player-win"
      } result`,
      result === (strategy === "auto-only" ? "enemy-win" : "player-win"),
    )
    check(
      `${strategy} terminal clears telegraph/protection without writing results`,
      (await run.page.getByTestId("boss-telegraph").innerText()).includes(
        "Thử thách đã kết thúc.",
      ) && (await run.raw()) === before,
    )
    if (strategy !== "auto-only") {
      await run.page.evaluate(() => {
        const native = Storage.prototype.setItem
        let fail = true
        Storage.prototype.setItem = function (key, value) {
          if (key === "aw2.development.save" && fail) {
            fail = false
            throw new DOMException("QA failed write", "QuotaExceededError")
          }
          return native.call(this, key, value)
        }
      })
      await run.page
        .getByRole("button", { name: "Lưu kết quả và trở về", exact: true })
        .click()
      await run.page.getByRole("alert").waitFor()
      check(
        "Failed win settlement retains checkpoint bytes and authentic live terminal for retry",
        (await run.raw()) === before &&
          (await run.canvas.getAttribute("data-status")) === "player-win",
      )
    }
    await run.page
      .getByRole("button", { name: "Lưu kết quả và trở về", exact: true })
      .click()
    await run.page.getByTestId("player-position").waitFor()
    const committed = await run.raw(),
      stored = JSON.parse(committed)
    check(
      `${strategy} commits only its actual result and correct safe return`,
      stored.progress.bossDefeated === (result === "player-win") &&
        stored.progress.zoneId ===
          (result === "player-win"
            ? "aw2-zone-kitchen-table"
            : "aw2-zone-forgotten-kitchen-yard") &&
        stored.economy.receipts.length === 0,
    )
    await run.page.reload()
    await run.page.getByTestId("player-position").waitFor()
    check(
      `${strategy} reload preserves exact committed bytes and seeded legacy`,
      (await run.raw()) === committed &&
        (await run.page.evaluate(() =>
          localStorage.getItem("foodchest.user.v1"),
        )) === "stable-user-fixture",
    )
    await run.context.close()
  }
  check("No browser/page/asset errors", errors.length === 0)
  await writeFile(
    `${out}/${flavor}-boss.json`,
    JSON.stringify(
      {
        task: "AW2-007D",
        status: "PASS",
        flavor,
        checks,
        errors,
        runs,
        browser: await browser.version(),
        fixture:
          "Isolated v3 ready quest, no injected combat result; not a full earned quest journey.",
      },
      null,
      2,
    ) + "\n",
  )
  console.log(`PASS ${checks.length} ${flavor} boss checks`)
} finally {
  await browser?.close()
  if (values.compiled)
    await new Promise((resolve) => server?.httpServer.close(resolve))
  else await server?.close()
}
