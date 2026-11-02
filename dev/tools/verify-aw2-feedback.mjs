import assert from "node:assert/strict"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"

const { values } = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
    compiled: { type: "boolean", default: false },
    webkit: { type: "boolean", default: false },
  },
})
const flavor = values.compiled ? "compiled" : "source",
  engine = values.webkit ? "webkit" : "chromium",
  port = (values.webkit ? 8540 : 8538) + Number(values.compiled),
  out = ".asset-work/aw2-011b",
  key = "aw2.development.save",
  legacy = {
    "foodchest.user.v1": "PRIVATE_USER",
    "foodchest.tcg.v1": "PRIVATE_CARDS",
  },
  origin = `http://127.0.0.1:${port}`,
  url = `${origin}/dev/aw2/world.html?private=PRIVATE_QUERY`
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
  requests = [],
  samples = []
const check = (name, value = true) => {
  assert.ok(value, name)
  checks.push(name)
  console.log(name)
}
let browser, page, build, checkpoint
try {
  await mkdir(out, { recursive: true })
  if (!values.compiled) await server.listen()
  const api = await import(values.playwright)
  browser = await api[engine].launch(
    values.webkit
      ? { headless: true }
      : {
          executablePath: values.chromium,
          headless: true,
          args: [
            "--no-sandbox",
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
          ],
        },
  )
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    reducedMotion: "reduce",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
  })
  await context.route("**/favicon.ico", (route) =>
    route.fulfill({ status: 204 }),
  )
  await context.addInitScript(
    ({ key, legacy }) => {
      const set = Storage.prototype.setItem
      for (const [k, v] of Object.entries(legacy)) set.call(localStorage, k, v)
      window.__writes = []
      Storage.prototype.setItem = function (k, v) {
        window.__writes.push(k)
        return set.call(this, k, v)
      }
      window.__revoked = []
      const revoke = URL.revokeObjectURL.bind(URL)
      URL.revokeObjectURL = (u) => {
        window.__revoked.push(u)
        revoke(u)
      }
      window.__visibility = new Set()
      const add = document.addEventListener.bind(document),
        remove = document.removeEventListener.bind(document)
      document.addEventListener = (type, fn, opts) => {
        if (type === "visibilitychange") window.__visibility.add(fn)
        add(type, fn, opts)
      }
      document.removeEventListener = (type, fn, opts) => {
        if (type === "visibilitychange") window.__visibility.delete(fn)
        remove(type, fn, opts)
      }
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: () => Promise.reject(Error("QA denied clipboard")),
        },
      })
    },
    { key, legacy },
  )
  page = await context.newPage()
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text())
  })
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
  })
  page.on("request", (r) => requests.push(r.url()))
  await page.goto(url)
  const panel = () => page.getByTestId("playtest-feedback"),
    open = async () => {
      if (!((await panel().getAttribute("open")) !== null))
        await panel().locator("summary").click()
    },
    button = (name) => panel().getByRole("button", { name, exact: true }),
    generate = async () => {
      await button("Tạo phiếu phản hồi").click()
      return JSON.parse(
        await panel().getByTestId("feedback-report").inputValue(),
      )
    },
    raw = () => page.evaluate((key) => localStorage.getItem(key), key),
    writes = () => page.evaluate(() => window.__writes.length),
    measure = () => button("Đo nhịp khung hình (3 giây)"),
    download = async (report) => {
      const event = page.waitForEvent("download")
      await panel()
        .getByRole("link", { name: "Tải phiếu JSON", exact: true })
        .click()
      const file = await event
      const path = `${out}/${engine}-${flavor}-download.json`
      await file.saveAs(path)
      assert.equal(
        await readFile(path, "utf8"),
        JSON.stringify(report, null, 2) + "\n",
      )
      assert.equal(
        file.suggestedFilename(),
        `aw2-playtest-${report.build.codeFingerprint.slice(0, 12)}.json`,
      )
    }
  await panel().waitFor()
  check(
    "Feedback is initially collapsed and available with an empty save",
    (await panel().getAttribute("open")) === null && (await raw()) === null,
  )
  await open()
  await panel()
    .getByLabel("Thiết bị bạn đang thử")
    .fill("iPhone QA declaration; desktop engine emulation")
  const note = panel().getByLabel(
    "Bước đã làm, kết quả mong đợi và lỗi gặp phải",
  )
  await note.fill("Chạm cửa rồi gõ wasd e và mũi tên")
  let report = await generate()
  build = report.build
  check(
    "Generated empty report has exact build mode, content identity and unawarded acceptance",
    report.committedProgress.status === "empty" &&
      build.mode === flavor &&
      /^[a-f0-9]{64}$/.test(build.codeFingerprint) &&
      /^[a-f0-9]{40}$/.test(build.baseGitSha) &&
      build.inputFiles > 100 &&
      report.acceptance.physicalDevice === "NOT_VERIFIED" &&
      report.acceptance.independentPlaytest === "NOT_REVIEWED" &&
      report.acceptance.milestone === "NOT_AWARDED",
  )
  check(
    "No query or legacy values leak into the report",
    !/PRIVATE_/.test(JSON.stringify(report)),
  )
  await download(report)
  check(
    "Native JSON download contains exactly the generated snapshot and build filename",
  )
  await button("Sao chép phiếu").click()
  check(
    "Clipboard denial selects readable report and offers manual copy/download",
    (await panel()
      .getByTestId("feedback-status")
      .textContent()
      .then((t) => t.includes("Không sao chép tự động"))) &&
      (await panel()
        .getByTestId("feedback-report")
        .evaluate(
          (el) =>
            document.activeElement === el &&
            el.selectionEnd === el.value.length,
        )),
  )
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__copied = text
        },
      },
    }),
  )
  await button("Sao chép phiếu").click()
  check(
    "Clipboard success copies the same snapshot",
    (await page.evaluate(() => window.__copied)) ===
      JSON.stringify(report, null, 2) + "\n",
  )
  await note.fill("Thử lần hai")
  check(
    "Editing notes preserves point-in-time generated snapshot",
    (await panel().getByTestId("feedback-report").inputValue()) ===
      JSON.stringify(report, null, 2) + "\n",
  )
  report = await generate()
  await download(report)
  check(
    "Regeneration updates text and downloadable bytes together and revokes old blob",
    report.notes === "Thử lần hai" &&
      (await page.evaluate(() => window.__revoked.length)) === 1,
  )
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 })
    check(
      `Feedback fits ${width}px and native controls retain 44px targets/16px inputs`,
      await panel().evaluate((el) => {
        const controls = [
          ...el.querySelectorAll("summary,input,textarea,button,a"),
        ]
        return (
          document.documentElement.scrollWidth <= innerWidth &&
          controls.every(
            (c) =>
              c.getBoundingClientRect().height >= 44 &&
              c.getBoundingClientRect().width <=
                el.getBoundingClientRect().width,
          ) &&
          [...el.querySelectorAll("input,textarea")].every(
            (c) => parseFloat(getComputedStyle(c).fontSize) >= 16,
          )
        )
      }),
    )
  }
  await page.setViewportSize({ width: 390, height: 844 })
  const listenerCount = await page.evaluate(() => window.__visibility.size)
  await measure().click()
  await page.waitForFunction(() =>
    document
      .querySelector('[data-testid="feedback-status"]')
      .textContent.includes("Nhịp khung hình trang:"),
  )
  report = await generate()
  samples.push(report.observations)
  check(
    "Opt-in visible page cadence completes after >=3s and releases listener",
    report.observations.frameCadence?.elapsedMs >= 3000 &&
      report.observations.frameCadence.frames >= 2 &&
      (await page.evaluate(() => window.__visibility.size)) === listenerCount,
  )
  await measure().click()
  await panel().locator("summary").click()
  await open()
  report = await generate()
  check(
    "Closing panel cancels sample without retaining an old result/listener",
    report.observations.frameCadence === null &&
      (await page.evaluate(() => window.__visibility.size)) === listenerCount,
  )
  await measure().click()
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    })
    document.dispatchEvent(new Event("visibilitychange"))
    delete document.visibilityState
  })
  report = await generate()
  check(
    "Injected hidden-page event cancels sample and releases listener",
    report.observations.frameCadence === null &&
      (await page.evaluate(() => window.__visibility.size)) === listenerCount,
  )
  check(
    "Empty-save report/copy/download/sample never writes any storage",
    (await writes()) === 0 && (await raw()) === null,
  )
  const checkpointPath = `.asset-work/aw2-006f/${flavor}-browser.json`,
    priorText = await readFile(checkpointPath, "utf8"),
    prior = JSON.parse(priorText),
    earned = prior.checkpointRaw
  assert.equal(prior.status, "PASS")
  assert.equal(JSON.parse(earned).schemaVersion, 5)
  checkpoint = {
    path: checkpointPath,
    reportSha256: createHash("sha256").update(priorText).digest("hex"),
    rawSha256: createHash("sha256").update(earned).digest("hex"),
  }
  await page.evaluate(({ key, earned }) => localStorage.setItem(key, earned), {
    key,
    earned,
  })
  await page.reload()
  await page.locator('canvas[data-party-size="1"]').waitFor()
  await open()
  const beforeWrites = await writes(),
    beforePosition = await page.getByTestId("player-position").textContent()
  await note.fill("wasd e")
  await note.press("ArrowDown")
  await note.press("e")
  check(
    "Native text focus keeps movement and interaction keys inside the form",
    (await page.getByTestId("player-position").textContent()) ===
      beforePosition && !(await page.getByRole("dialog").isVisible()),
  )
  report = await generate()
  const parsed = JSON.parse(earned)
  check(
    "Ready report reads actual committed summary without identity/raw/timestamps",
    report.committedProgress.partySize === 5 &&
      report.committedProgress.questIndex === parsed.progress.questIndex &&
      report.committedProgress.teamExperience ===
        parsed.economy.teamExperience &&
      report.committedProgress.receiptCount ===
        parsed.economy.receipts.length &&
      !JSON.stringify(report).includes(parsed.saveId) &&
      !JSON.stringify(report).includes('"createdAt"'),
  )
  check(
    "Ready report and form typing leave exact earned save and storage untouched",
    (await raw()) === earned && (await writes()) === beforeWrites,
  )
  await panel().screenshot({ path: `${out}/${engine}-${flavor}-390.png` })
  const owned = await panel()
    .getByRole("link", { name: "Tải phiếu JSON" })
    .getAttribute("href")
  await page.evaluate(() => {
    window.__priorVisibility = new Set(window.__visibility)
  })
  await measure().click()
  await page.evaluate(() => {
    window.__sampleListeners = [...window.__visibility].filter(
      (fn) => !window.__priorVisibility.has(fn),
    )
  })
  await page.getByRole("button", { name: "Ghé nhanh TCG", exact: true }).click()
  await panel().waitFor({ state: "detached" })
  check(
    "Mode transition unmount releases generated blob and sampling callback",
    await page.evaluate(
      (u) =>
        window.__revoked.includes(u) &&
        window.__sampleListeners.every((fn) => !window.__visibility.has(fn)),
      owned,
    ),
  )
  // Invalid payload is deliberately placed only in this isolated test profile.
  await page.evaluate(
    (key) => localStorage.setItem(key, "PRIVATE_INVALID_RAW"),
    key,
  )
  await page.goto(url)
  await open()
  const invalidWrites = await writes()
  report = await generate()
  check(
    "Invalid save can produce feedback without exposing or repairing payload",
    report.committedProgress.status === "invalid" &&
      (await raw()) === "PRIVATE_INVALID_RAW" &&
      (await writes()) === invalidWrites &&
      !JSON.stringify(report).includes("PRIVATE_INVALID_RAW"),
  )
  await page.reload()
  await open()
  check(
    "Feedback text/report are not persisted after reload",
    (await note.inputValue()) === "" &&
      (await panel().getByTestId("feedback-report").count()) === 0,
  )
  check(
    "Legacy data remains byte-identical",
    await page.evaluate(
      (legacy) =>
        Object.entries(legacy).every(([k, v]) => localStorage.getItem(k) === v),
      legacy,
    ),
  )
  const isolated = await browser.newContext({
    viewport: { width: 390, height: 844 },
  })
  await isolated.route("**/favicon.ico", (r) => r.fulfill({ status: 204 }))
  await isolated.addInitScript(() => {
    const get = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) {
      if (k === "aw2.development.save") throw Error("QA unavailable storage")
      return get.call(this, k)
    }
    Object.defineProperty(navigator, "locks", { value: undefined })
  })
  const p = await isolated.newPage()
  await p.goto(url)
  await p.getByTestId("playtest-feedback").locator("summary").click()
  await p
    .getByRole("button", { name: "Tạo phiếu phản hồi", exact: true })
    .click()
  const unavailable = JSON.parse(
    await p.getByTestId("feedback-report").inputValue(),
  )
  check(
    "Unavailable storage/missing locks still allow feedback and useful HTTPS guidance",
    unavailable.committedProgress.status === "unavailable" &&
      unavailable.environment.webLocks === false &&
      (await p
        .getByText("Thiết bị này chưa đủ điều kiện ghi bản lưu.", {
          exact: false,
        })
        .isVisible()),
  )
  await isolated.close()
  check("No unexpected page/console/resource errors", errors.length === 0)
  check(
    "Feedback makes no external network requests",
    requests.every(
      (u) =>
        u.startsWith(origin) || u.startsWith("data:") || u.startsWith("blob:"),
    ),
  )
  await writeFile(
    `${out}/${engine}-${flavor}-browser.json`,
    JSON.stringify(
      {
        status: "PASS",
        task: "AW2-011B",
        engine,
        version: browser.version(),
        flavor,
        build,
        checks,
        errors,
        samples,
        checkpoint,
        scope:
          "Desktop engines, touch/viewport/user-agent emulation only; synthetic clipboard denial/hidden event/unavailable storage. Not physical iPhone or independent acceptance.",
      },
      null,
      2,
    ) + "\n",
  )
  console.log(
    JSON.stringify({ status: "PASS", engine, flavor, checks: checks.length }),
  )
} catch (cause) {
  await mkdir(out, { recursive: true })
  await page
    ?.screenshot({
      path: `${out}/${engine}-${flavor}-failure.png`,
      fullPage: true,
    })
    .catch(() => {})
  await writeFile(
    `${out}/${engine}-${flavor}-browser.json`,
    JSON.stringify(
      {
        status: "FAIL",
        engine,
        flavor,
        checks,
        errors,
        failure: String(cause),
      },
      null,
      2,
    ) + "\n",
  )
  throw cause
} finally {
  await browser?.close()
  await server.close()
}
