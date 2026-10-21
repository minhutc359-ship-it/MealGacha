import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"

const { values } = parseArgs({
  options: {
    url: { type: "string", default: "http://127.0.0.1:8452/dev/aw2/than.html" },
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
  },
})
const { chromium } = await import(values.playwright)
const browser = await chromium.launch({
  executablePath: values.chromium,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})
const out = ".asset-work/aw2-004a"
await mkdir(out, { recursive: true })
const checks = [],
  errors = [],
  failed = [],
  assets = new Set()
const check = (name, condition = true) => {
  assert.ok(condition, name)
  checks.push(name)
}
const original = {
  "foodchest.tcg.v1": "stable tcg bytes",
  "foodchest.user.v1": "stable user bytes",
  "aw2.development.save": "original aw2 bytes",
}
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
  })
  const page = await context.newPage()
  await page.emulateMedia({ reducedMotion: "no-preference" })
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("response", (response) => {
    if (response.url().includes("/dev/aw2/assets/")) {
      assets.add(new URL(response.url()).pathname)
      if (response.status() >= 400) failed.push(response.url())
    }
  })
  await page.goto(values.url)
  await page
    .getByTestId("atlas-state")
    .filter({ hasText: "Atlas đã tải" })
    .waitFor()
  check(
    "Asset preview opens without creating game saves",
    (await page.evaluate(() =>
      localStorage.getItem("aw2.development.save"),
    )) === null,
  )
  await page.evaluate(
    (original) =>
      Object.entries(original).forEach(([key, value]) =>
        localStorage.setItem(key, value),
      ),
    original,
  )
  await page.waitForFunction(() =>
    document.querySelector("canvas")?.dataset.frame.startsWith("battle.idle"),
  )
  const pause = async () =>
    page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  const pixels = () => page.locator("canvas").evaluate((canvas) => {
      const data = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data
      let visible = 0
      for (let i = 3; i < data.length; i += 4) if (data[i] > 64) visible++
      return visible
    })
  for (const state of [
    "idle",
    "move",
    "attack",
    "cast",
    "hit",
    "guard",
    "ultimate",
    "defeat",
  ]) {
    await page.getByTestId(`state-${state}`).click()
    await page.waitForFunction(
      (state) =>
        document.querySelector("canvas").dataset.frame === `battle.${state}` ||
        document
          .querySelector("canvas")
          .dataset.frame.startsWith(`battle.${state}.`),
      state,
    )
    await pause()
    check(`HD state ${state} draws authored pixels`, (await pixels()) > 10000)
    await page
      .locator("canvas")
      .screenshot({ path: `${out}/battle-${state}.png` })
  }
  await page
    .getByRole("checkbox", { name: "Bật âm thanh", exact: true })
    .check()
  for (const slot of ["basic", "auto", "passive", "ultimate"]) {
    await page.getByTestId(`skill-${slot}`).click()
    await page.waitForFunction(
      (slot) =>
        document.querySelector("canvas").dataset.fx ===
        `fx.${slot}.${slot === "basic" ? 0 : 2}`,
      slot,
    )
    await pause()
    check(
      `Skill ${slot} uses its own authored FX at the declared cue`,
      (await page.getByTestId("contact-cue").innerText()).includes(slot),
    )
    check(
      `Skill ${slot} emits only one cue`,
      (await page.locator("canvas").getAttribute("data-events")) === "1",
    )
    await page
      .locator("canvas")
      .screenshot({ path: `${out}/skill-${slot}.png` })
  }
  const audio = await page.evaluate(async () => {
    const context = new AudioContext()
    try {
      const result = []
      for (const slot of ["basic", "auto", "passive", "ultimate"]) {
        const response = await fetch(`/dev/aw2/assets/than/base-v1/${slot}.wav`)
        if (!response.ok) throw Error(`Audio ${slot} HTTP ${response.status}`)
        const decoded = await context.decodeAudioData(
          await response.arrayBuffer(),
        )
        result.push({
          slot,
          duration: decoded.duration,
          channels: decoded.numberOfChannels,
        })
      }
      return result
    } finally {
      await context.close()
    }
  })
  check(
    "All four WAV cues load and decode in the browser",
    audio.length === 4 &&
      audio.every((cue) => cue.duration > 0.1 && cue.channels === 1),
  )
  await page
    .getByRole("checkbox", { name: "Bật âm thanh", exact: true })
    .uncheck()
  await page
    .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
    .check()
  await page.getByTestId("state-attack").click()
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.frame === "battle.attack",
  )
  const staticImage = await page
    .locator("canvas")
    .evaluate((canvas) => canvas.toDataURL())
  await page.waitForTimeout(250)
  check(
    "Reduced motion holds a meaningful attack pose without visual animation",
    (await page.locator("canvas").evaluate((canvas) => canvas.toDataURL())) ===
      staticImage,
  )
  await page
    .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
    .uncheck()
  await page.getByRole("button", { name: "World / chibi", exact: true }).click()
  for (const direction of ["down", "left", "right", "up"]) {
    await page.getByTestId(`direction-${direction}`).click()
    await page.waitForFunction(
      (direction) =>
        document
          .querySelector("canvas")
          .dataset.frame.startsWith(`world.${direction}.`),
      direction,
    )
    const first = await page.locator("canvas").getAttribute("data-frame")
    await page.waitForFunction(
      (first) => document.querySelector("canvas").dataset.frame !== first,
      first,
    )
    check(
      `World ${direction} advances real walk cels`,
      (await pixels()) > 10000,
    )
    await page
      .locator("canvas")
      .screenshot({ path: `${out}/world-${direction}.png` })
  }
  await pause()
  const pausedTime = await page.locator("canvas").getAttribute("data-elapsed")
  await page.waitForTimeout(200)
  check(
    "Pause freezes the timeline",
    (await page.locator("canvas").getAttribute("data-elapsed")) === pausedTime,
  )
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
  await page.waitForFunction(
    (before) =>
      Number(document.querySelector("canvas").dataset.elapsed) >
      Number(before) + 100,
    pausedTime,
  )
  check("Resume continues the timeline")
  await page.getByRole("checkbox", { name: "Đi bộ", exact: true }).uncheck()
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.frame === "world.up.0",
  )
  check("Standing selects the direction-specific idle cel")
  await page
    .getByRole("img", { name: "Chân dung Than áo chàm và khiên đồng" })
    .scrollIntoViewIfNeeded()
  check(
    "Separate portrait loads",
    await page
      .getByRole("img")
      .evaluate((image) => image.complete && image.naturalWidth > 0),
  )
  await page.setViewportSize({ width: 390, height: 844 })
  check(
    "Mobile preview has no horizontal overflow",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  )
  await page.screenshot({ path: `${out}/mobile.png`, fullPage: true })
  const preserved = await page.evaluate(
    (keys) =>
      Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)])),
    Object.keys(original),
  )
  check(
    "All legacy and AW2 save bytes remain unchanged",
    JSON.stringify(preserved) === JSON.stringify(original),
  )
  check(
    "No primary-context browser errors or missing assets",
    !errors.length && !failed.length,
  )

  const blocked = await browser.newContext()
  await blocked.route("**/world.webp", (route) => route.abort())
  const missing = await blocked.newPage()
  await missing.goto(values.url)
  await missing
    .getByRole("alert")
    .filter({ hasText: "Không tải được asset aw2-than:world:base-v1" })
    .waitFor()
  check(
    "Missing atlas reports an error without a geometry replacement",
    await missing.locator("canvas").evaluate(
      (canvas) =>
        !canvas
          .getContext("2d")
          .getImageData(0, 0, 640, 440)
          .data.some((value) => value > 0),
    ),
  )
  await blocked.close()

  const reducedContext = await browser.newContext({ reducedMotion: "reduce" })
  const reduced = await reducedContext.newPage()
  await reduced.goto(values.url)
  check(
    "System reduced-motion preference initializes the control",
    await reduced
      .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
      .isChecked(),
  )
  await reducedContext.close()
  const report = {
    task: "AW2-004A",
    status: "PASS",
    engine: `Chromium ${browser.version()}`,
    viewports: ["1280x1000", "390x844"],
    checks,
    errors,
    failed,
    audio,
    requestedAssets: [...assets].sort(),
    limits: [
      "headless browser audio decoded, not human listening",
      "no real device/combat/leveling/legal approval",
    ],
  }
  await writeFile(`${out}/browser.json`, JSON.stringify(report, null, 2) + "\n")
  console.log(
    JSON.stringify({
      status: "PASS",
      checks: checks.length,
      report: `${out}/browser.json`,
    }),
  )
} catch (error) {
  await writeFile(
    `${out}/browser.json`,
    JSON.stringify(
      {
        task: "AW2-004A",
        status: "FAIL",
        checks,
        errors,
        failed,
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
