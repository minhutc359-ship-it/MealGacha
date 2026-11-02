import assert from "node:assert/strict"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { createHash } from "node:crypto"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"
import { rematchAfterEnding } from "./aw2-rematch-browser-flow.mjs"
const { values } = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
    compiled: { type: "boolean", default: false },
    earned: { type: "string" },
  },
})
assert.ok(values.earned, "An exact recorded earned-journey report is required")
const text = await readFile(values.earned, "utf8"),
  earned = JSON.parse(text),
  checkpoint = JSON.parse(earned.observedRaw)
assert.equal(earned.status, "PARTIAL")
assert.equal(earned.checks.length, 79)
assert.equal(checkpoint.progress.questIndex, 4)
assert.equal(checkpoint.economy.teamExperience, 345)
assert.equal(checkpoint.collection.recruitedIds.length, 7)
const flavor = values.compiled ? "compiled" : "source",
  out = ".asset-work/aw2-007m",
  port = values.compiled ? 8463 : 8462
assert.equal(earned.flavor, flavor)
const server = values.compiled
  ? await preview({
      configFile: "dev/vite.aw2.config.ts",
      preview: { host: "127.0.0.1", port, strictPort: true },
    })
  : await createServer({
      configFile: "dev/vite.dev.config.ts",
      server: { host: "127.0.0.1", port, strictPort: true },
    })
const { chromium } = await import(values.playwright)
let browser, page
const checks = [],
  errors = [],
  key = "aw2.development.save",
  url = `http://127.0.0.1:${port}/dev/aw2/world.html`
const legacy = {
  "foodchest.tcg.v1": "original-cards",
  "foodchest.user.v1": "original-user",
  "foodchest.tcg.v1.checkpoint.v4": "original-checkpoint",
  "mealgacha.progress-journal.v4": "original-journal",
  "mealgacha.progress-writer.v4": "original-writer",
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
    reducedMotion: "reduce",
    hasTouch: true,
  })
  await context.addInitScript(() => {
    window.__demoBlock = false
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === "aw2.development.save" && window.__demoBlock)
        throw Error("QA write blocked")
      return set.call(this, key, value)
    }
  })
  const watch = (target) => {
    target.on("pageerror", (error) => errors.push(error.message))
    target.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text())
    })
    target.on("requestfailed", (r) =>
      errors.push(`${r.failure()?.errorText} ${r.url()}`),
    )
    target.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
    })
  }
  page = await context.newPage()
  watch(page)
  await page.goto(url)
  await page.evaluate(
    ({ key, raw, legacy }) => {
      localStorage.setItem(key, raw)
      for (const [k, v] of Object.entries(legacy)) localStorage.setItem(k, v)
    },
    { key, raw: earned.observedRaw, legacy },
  )
  await page.reload()
  const raw = () => page.evaluate((key) => localStorage.getItem(key), key),
    save = async () => JSON.parse(await raw())
  const world = async () => {
    await page.locator("canvas[data-party-size]").waitFor()
    await page
      .getByTestId("world-map")
      .locator(".aw2-map-loading")
      .waitFor({ state: "hidden" })
  }
  await world()
  assert.equal(await raw(), earned.observedRaw)
  const go = async (x, y) => {
    await world()
    const map = page.getByTestId("world-map")
    await map.scrollIntoViewIfNeeded()
    const box = await map.boundingBox()
    await page.touchscreen.tap(
      box.x + (x / 640) * box.width,
      box.y + (y / 384) * box.height,
    )
    await page.waitForFunction(
      ({ x, y }) => {
        const m = document
          .querySelector('[data-testid="player-position"]')
          ?.textContent.match(/Vị trí (\d+), (\d+)/)
        return m && Math.abs(+m[1] - x) <= 1 && Math.abs(+m[2] - y) <= 1
      },
      { x, y },
    )
  }
  const interact = async (name) => {
    await page.getByTestId("world-map").focus()
    await page.keyboard.press("e")
    await page.getByRole("dialog").waitFor()
    if (name) {
      await page
        .getByRole("dialog")
        .getByRole("button", { name, exact: true })
        .click()
      await page.getByRole("dialog").waitFor({ state: "hidden" })
    }
  }
  await rematchAfterEnding({
    page,
    check,
    raw,
    save,
    go,
    interact,
    world,
    url,
    out,
    flavor,
    watch,
  })
  check(
    "All five legacy keys remain byte-identical throughout continued rematches",
    await page.evaluate(
      (legacy) =>
        Object.entries(legacy).every(([k, v]) => localStorage.getItem(k) === v),
      legacy,
    ),
  )
  check(
    "No unexpected continued console/page/resource errors",
    errors.length === 0,
  )
  const report = {
    status: "PASS",
    task: "AW2-007M",
    flavor,
    engine: browser.version(),
    checks: [...earned.checks, ...checks],
    errors: [...earned.errors, ...errors],
    continuation: {
      source: values.earned,
      sha256: createHash("sha256").update(text).digest("hex"),
      retainedAssertions: earned.checks.length,
      freshAssertions: checks.length,
      checkpointSha256: createHash("sha256")
        .update(earned.observedRaw)
        .digest("hex"),
      scope:
        "Same unchanged runtime/build;79 passed earned journey checks retained, rematch hook resumed from exact authentic saved bytes. No single uninterrupted full browser run claimed.",
    },
    final: {
      experience: (await save()).economy.teamExperience,
      receipts: (await save()).economy.receipts,
      ending: (await save()).progress.endingChoice,
    },
  }
  await writeFile(
    `${out}/${flavor}-demo.json`,
    JSON.stringify(report, null, 2) + "\n",
  )
  console.log(
    JSON.stringify({
      status: "PASS",
      flavor,
      checks: report.checks.length,
      continued: checks.length,
    }),
  )
} catch (error) {
  await mkdir(out, { recursive: true })
  await page
    ?.screenshot({
      path: `${out}/${flavor}-resume-failure.png`,
      fullPage: true,
    })
    .catch(() => {})
  await writeFile(
    `${out}/${flavor}-resume-failure.json`,
    JSON.stringify(
      {
        status: "FAIL",
        checks,
        errors,
        failure: String(error),
        observedRaw: await page
          ?.evaluate((key) => localStorage.getItem(key), key)
          .catch(() => null),
      },
      null,
      2,
    ) + "\n",
  )
  throw error
} finally {
  await browser?.close()
  if (values.compiled)
    await new Promise((resolve) => server.httpServer.close(resolve))
  else await server.close()
}
