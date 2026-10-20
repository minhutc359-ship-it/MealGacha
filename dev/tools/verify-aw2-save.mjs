import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"

const { values } = parseArgs({
  options: {
    url: {
      type: "string",
      default: "http://127.0.0.1:8452/dev/aw2/index.html",
    },
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
  },
})
const { chromium } = await import(values.playwright)
const out = ".asset-work/aw2-001"
await mkdir(out, { recursive: true })
const browser = await chromium.launch({
  executablePath: values.chromium,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})
const checks = []
const errors = []
const requests = new Set()
const key = "aw2.development.save"
const legacy = {
  "foodchest.tcg.v1": '{"coins":9876,"cards":{"owned":7}}',
  "foodchest.user.v1": '{"keys":42}',
  "foodchest.tcg.v1.checkpoint.v4": "original checkpoint",
  "mealgacha.progress-journal.v4": "original journal",
  "mealgacha.progress-writer.v4": "original writer",
}
const check = (name, condition = true) => {
  assert.ok(condition, name)
  checks.push(name)
}
const raw = (page) => page.evaluate((key) => localStorage.getItem(key), key)
const text = (page) => page.locator("main").innerText()
const waitText = async (page, pattern) => {
  await page.waitForFunction(
    (source) =>
      new RegExp(source).test(
        document.querySelector("main")?.textContent ?? "",
      ),
    pattern.source,
  )
}
const create = (page) =>
  page.getByRole("button", { name: "Tạo bản lưu AW2", exact: true })
const save = (page) =>
  page.getByRole("button", { name: "Lưu thử AW2", exact: true })
const reset = (page) =>
  page.getByRole("button", { name: "Bắt đầu lại AW2…", exact: true })
const read = (page) =>
  page.getByRole("button", { name: "Đọc lại", exact: true })
const confirm = (page) =>
  page.getByRole("button", { name: "Xác nhận reset AW2", exact: true })

try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })
  context.on("page", (page) => {
    page.on("pageerror", (error) => errors.push(error.message))
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text())
    })
    page.on("request", (request) =>
      requests.add(new URL(request.url()).pathname),
    )
  })
  const page = await context.newPage()
  await page.goto(values.url)
  await create(page).waitFor()
  await page.evaluate(
    (legacy) =>
      Object.entries(legacy).forEach(([key, value]) =>
        localStorage.setItem(key, value),
      ),
    legacy,
  )
  await page.reload()
  await create(page).waitFor()
  check("Opening AW2 leaves absent save absent", (await raw(page)) === null)
  await create(page).click()
  await waitText(page, /Đã lưu AW2/)
  const first = JSON.parse(await raw(page))
  const firstRaw = await raw(page)
  check(
    "Create writes development schema v2",
    first.environment === "development" && first.schemaVersion === 2,
  )
  await page.reload()
  await save(page).waitFor()
  check(
    "Reload preserves save identity and exact bytes",
    (await raw(page)) === firstRaw && JSON.parse(await raw(page)).saveId === first.saveId,
  )
  await save(page).click()
  await waitText(page, /Đã lưu AW2/)
  check("Save advances revision", JSON.parse(await raw(page)).revision === 1)
  const beforeReset = await raw(page)
  await reset(page).click()
  await page.getByRole("dialog").waitFor()
  await page.waitForFunction(() => document.activeElement?.textContent === "Hủy")
  check(
    "Reset opens modal with cancel focused",
    (await page.getByRole("dialog").isVisible()) &&
      (await page
        .getByRole("button", { name: "Hủy", exact: true })
        .evaluate((el) => document.activeElement === el)),
  )
  check(
    "Reset disabled before typed confirmation",
    await confirm(page).isDisabled(),
  )
  await page.getByLabel(/Nhập RESET AW2/).fill("reset aw2")
  check("Wrong phrase keeps reset disabled", await confirm(page).isDisabled())
  await page.getByLabel(/Nhập RESET AW2/).fill("RESET AW2")
  await page.getByRole("button", { name: "Hủy", exact: true }).click()
  check("Cancel preserves exact bytes", (await raw(page)) === beforeReset)
  await reset(page).click()
  check(
    "New dialog forgets previous phrase",
    (await page.getByLabel(/Nhập RESET AW2/).inputValue()) === "",
  )
  await page.keyboard.press("Escape")
  check(
    "Escape preserves exact bytes and closes modal",
    (await raw(page)) === beforeReset &&
      !(await page.getByRole("dialog").isVisible()),
  )
  await reset(page).click()
  await page.getByLabel(/Nhập RESET AW2/).fill("RESET AW2")
  await confirm(page).click()
  await waitText(page, /Đã bắt đầu lại/)
  const afterReset = JSON.parse(await raw(page))
  check(
    "Confirmed reset creates fresh identity",
    afterReset.saveId !== first.saveId && afterReset.revision === 0,
  )

  const other = await context.newPage()
  await other.goto(values.url)
  await save(other).waitFor()
  await reset(page).click()
  await save(other).click()
  await waitText(other, /Đã lưu AW2/)
  const otherRaw = await raw(other)
  await page.getByLabel(/Nhập RESET AW2/).fill("RESET AW2")
  await confirm(page).click()
  await waitText(page, /Đọc lại trước/)
  check(
    "Stale reset cannot overwrite another tab",
    (await raw(page)) === otherRaw,
  )
  await save(page).click()
  await waitText(page, /Đọc lại trước/)
  check(
    "Stale save cannot overwrite another tab",
    (await raw(page)) === otherRaw,
  )
  await read(page).click()
  await save(page).click()
  await waitText(page, /Đã lưu AW2/)
  check(
    "Reread permits subsequent save",
    JSON.parse(await raw(page)).revision === 2,
  )
  await read(other).click()
  await page.evaluate(key => {
    void navigator.locks.request(key, () => new Promise(resolve => {
      window.releaseAw2TestLock = resolve
    }))
  }, key)
  await page.waitForFunction(() => !!window.releaseAw2TestLock)
  await Promise.all([save(page).click(), save(other).click()])
  await page.evaluate(() => window.releaseAw2TestLock())
  await page.waitForFunction(() => !document.querySelector("button").disabled)
  await other.waitForFunction(() => !document.querySelector("button").disabled)
  check("Web Locks serialize simultaneous writes from two tabs", JSON.parse(await raw(page)).revision === 3)
  await read(page).click()
  await other.close()

  for (const [bad, expected] of [
    ["{broken-original", /không hợp lệ/],
    [
      JSON.stringify({ schemaVersion: 3, futureData: ["retain"] }),
      /schema mới hơn/,
    ],
  ]) {
    await page.evaluate(({ key, bad }) => localStorage.setItem(key, bad), {
      key,
      bad,
    })
    await page.reload()
    await waitText(page, expected)
    check(
      `Unreadable save preserved: ${expected.source}`,
      (await raw(page)) === bad && (await save(page).isDisabled()),
    )
    await reset(page).click()
    await page.keyboard.press("Escape")
    check(
      `Cancel unreadable reset preserves bytes: ${expected.source}`,
      (await raw(page)) === bad,
    )
    await reset(page).click()
    await page.getByLabel(/Nhập RESET AW2/).fill("RESET AW2")
    await confirm(page).click()
    await waitText(page, /Đã bắt đầu lại/)
    check(
      `Explicit development reset recovers: ${expected.source}`,
      JSON.parse(await raw(page)).schemaVersion === 2,
    )
  }

  const beforeFailure = await raw(page)
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === "aw2.development.save")
        throw new DOMException("Quota exceeded", "QuotaExceededError")
      return original.call(this, key, value)
    }
  })
  await save(page).click()
  await waitText(page, /Chưa lưu được AW2/)
  check(
    "Write failure reports error and preserves bytes",
    (await raw(page)) === beforeFailure &&
      !(await text(page)).includes("Đã lưu AW2."),
  )
  await reset(page).click()
  await page.getByLabel(/Nhập RESET AW2/).fill("RESET AW2")
  await confirm(page).click()
  await waitText(page, /Chưa lưu được AW2/)
  check(
    "Reset failure reports error and closes consumed confirmation",
    (await raw(page)) === beforeFailure &&
      !(await page.getByRole("dialog").isVisible()),
  )
  await page.reload()
  await save(page).waitFor()

  await page.setViewportSize({ width: 390, height: 844 })
  await reset(page).click()
  check(
    "Mobile viewport has no horizontal overflow",
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <= innerWidth &&
        document.querySelector("dialog").scrollWidth <=
          document.querySelector("dialog").clientWidth,
    ),
  )
  await page.screenshot({ path: `${out}/mobile-reset.png`, fullPage: true })
  await page.keyboard.press("Escape")
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.screenshot({ path: `${out}/desktop-save.png`, fullPage: true })
  const preserved = await page.evaluate(
    (keys) =>
      Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)])),
    Object.keys(legacy),
  )
  check(
    "All seeded legacy keys remain byte-for-byte intact",
    JSON.stringify(preserved) === JSON.stringify(legacy),
  )
  check(
    "Standalone screen never imports legacy app/bootstrap/save",
    ![...requests].some((path) =>
      /\/src\/(App|main|game\/|store\/|infrastructure\/native\/)/.test(path),
    ),
  )

  const blockedContext = await browser.newContext()
  await blockedContext.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Denied", "SecurityError")
      },
    })
  })
  const blocked = await blockedContext.newPage()
  await blocked.goto(values.url)
  await waitText(blocked, /Chưa truy cập được kho AW2/)
  check(
    "Storage denial renders a recoverable error",
    await save(blocked).isDisabled(),
  )
  await blockedContext.close()

  const noLockContext = await browser.newContext()
  await noLockContext.addInitScript(() =>
    Object.defineProperty(navigator, "locks", { value: undefined }),
  )
  const noLock = await noLockContext.newPage()
  await noLock.goto(values.url)
  await waitText(noLock, /Cần Web Locks/)
  check(
    "Missing Web Locks blocks creation with an explanation",
    await create(noLock).isDisabled(),
  )
  await noLockContext.close()
  check("No browser console or page errors", errors.length === 0)
  const report = {
    task: "AW2-001",
    status: "PASS",
    engine: `Chromium ${browser.version()}`,
    viewports: ["1280x800", "390x844"],
    checks,
    errors,
    requestedPaths: [...requests].sort(),
    screenshots: [`${out}/desktop-save.png`, `${out}/mobile-reset.png`],
  }
  await writeFile(`${out}/browser.json`, JSON.stringify(report, null, 2) + "\n")
  console.log(
    JSON.stringify({
      status: "PASS",
      checks: checks.length,
      engine: report.engine,
      report: `${out}/browser.json`,
    }),
  )
} catch (error) {
  await writeFile(
    `${out}/browser.json`,
    JSON.stringify(
      {
        task: "AW2-001",
        status: "FAIL",
        checks,
        errors,
        failure: String(error),
      },
      null,
      2,
    ) + "\n",
  )
  throw error
} finally {
  await browser.close()
}
