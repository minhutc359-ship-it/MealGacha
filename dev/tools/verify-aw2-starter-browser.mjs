import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"

const { values } = parseArgs({
  options: {
    url: {
      type: "string",
      default: "http://127.0.0.1:8452/dev/aw2/starters.html",
    },
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
const out = ".asset-work/aw2-004b"
await mkdir(out, { recursive: true })
const checks = [],
  errors = [],
  failed = [],
  audio = [],
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
const units = ["lua", "lam", "moc-non", "suong"]
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    reducedMotion: "no-preference",
  })
  await context.addInitScript(() => {
    window.aw2Played = []
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      window.aw2Played.push(this)
      return play.call(this)
    }
  })
  const page = await context.newPage()
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
  const loaded = () =>
    page
      .getByTestId("atlas-state")
      .filter({ hasText: "Atlas đã tải" })
      .waitFor()
  await loaded()
  check(
    "Preview creates no AW2 save",
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
  check(
    "Only initially selected unit image atlases load",
    [...assets]
      .filter((path) => path.endsWith(".webp"))
      .every((path) => path.includes("/lua/")),
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
  for (const unit of units) {
    await page.setViewportSize({ width: 1280, height: 1000 })
    await page.getByTestId(`spirit-aw2-${unit}`).click()
    await loaded()
    await page.waitForFunction(
      (unit) =>
        document.querySelector("canvas")?.dataset.spirit === `aw2-${unit}`,
      unit,
    )
    check(
      `${unit}: selection resets audio opt-in`,
      !(await page
        .getByRole("checkbox", { name: "Bật âm thanh", exact: true })
        .isChecked()),
    )
    check(
      `${unit}: previous unit audio is stopped`,
      await page.evaluate(() =>
        window.aw2Played.every((element) => element.paused),
      ),
    )
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
          document.querySelector("canvas").dataset.frame ===
            `battle.${state}` ||
          document
            .querySelector("canvas")
            .dataset.frame.startsWith(`battle.${state}.`),
        state,
      )
      await pause()
      check(
        `${unit}: HD ${state} draws authored pixels`,
        (await pixels()) > 10000,
      )
      await page
        .locator("canvas")
        .screenshot({ path: `${out}/${unit}-battle-${state}.png` })
    }
    if (unit !== "lua") {
      await page.getByTestId("skill-basic").click()
      await page.waitForFunction(
        () =>
          Number(document.querySelector("canvas").dataset.projectileX) > 240,
      )
      await pause()
      check(
        `${unit}: authored projectile travels before impact`,
        (
          await page.locator("canvas").getAttribute("data-projectile")
        ).startsWith("fx.basic.") &&
          (await page.locator("canvas").getAttribute("data-fx")) === "",
      )
      const projectilePixels = await page
        .locator("canvas")
        .evaluate((canvas) => {
          const x = 300 + Number(canvas.dataset.projectileX) * 0.68
          const data = canvas
            .getContext("2d")
            .getImageData(Math.floor(x - 25), 207, 50, 50).data
          return [...data].filter((value, i) => i % 4 === 3 && value > 64)
            .length
        })
      check(
        `${unit}: projectile contains actual atlas pixels`,
        projectilePixels > 50,
      )
      await page
        .locator("canvas")
        .screenshot({ path: `${out}/${unit}-projectile.png` })
    }
    await page
      .getByRole("checkbox", { name: "Bật âm thanh", exact: true })
      .check()
    for (const slot of ["basic", "auto", "passive", "ultimate"]) {
      const count =
        (unit === "lua" && slot === "basic") ||
        (unit === "lam" && slot === "ultimate")
          ? 2
          : 1
      await page.getByTestId(`skill-${slot}`).click()
      await page.waitForFunction(
        (count) =>
          Number(document.querySelector("canvas").dataset.cues) === count,
        count,
      )
      await page.waitForFunction(
        (slot) =>
          document.querySelector("canvas").dataset.fx === `fx.${slot}.2`,
        slot,
      )
      await pause()
      check(
        `${unit}: ${slot} shows its own FX and all ${count} cues`,
        (await page.getByTestId("contact-cue").innerText()).includes(slot),
      )
      const expectedEvents = slot === "basic" && unit !== "lua" ? 2 : count
      check(
        `${unit}: ${slot} markers emit once per authored timestamp`,
        Number(await page.locator("canvas").getAttribute("data-events")) ===
          expectedEvents,
      )
      await page
        .locator("canvas")
        .screenshot({ path: `${out}/${unit}-skill-${slot}.png` })
    }
    check(
      `${unit}: opted-in skill audio uses this unit only`,
      await page.evaluate(
        (unit) =>
          window.aw2Played
            .slice(-5)
            .some((element) =>
              element.src.includes(`/assets/${unit}/base-v1/`),
            ),
        unit,
      ),
    )
    audio.push(
      ...(await page.evaluate(async (unit) => {
        const context = new AudioContext()
        try {
          const result = []
          for (const slot of ["basic", "auto", "passive", "ultimate"]) {
            const response = await fetch(
              `/dev/aw2/assets/${unit}/base-v1/${slot}.wav`,
            )
            if (!response.ok)
              throw Error(`Audio ${unit}/${slot} HTTP ${response.status}`)
            const decoded = await context.decodeAudioData(
              await response.arrayBuffer(),
            )
            result.push({
              unit,
              slot,
              duration: decoded.duration,
              channels: decoded.numberOfChannels,
            })
          }
          return result
        } finally {
          await context.close()
        }
      }, unit)),
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
      `${unit}: reduced motion holds an authored pose`,
      (await page
        .locator("canvas")
        .evaluate((canvas) => canvas.toDataURL())) === staticImage,
    )
    await page
      .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
      .uncheck()
    await page
      .getByRole("button", { name: "World / chibi", exact: true })
      .click()
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
      await pause()
      check(
        `${unit}: world ${direction} advances real cels`,
        (await pixels()) > 10000,
      )
      await page
        .locator("canvas")
        .screenshot({ path: `${out}/${unit}-world-${direction}.png` })
      await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
    }
    await pause()
    const time = await page.locator("canvas").getAttribute("data-elapsed")
    await page.waitForTimeout(200)
    check(
      `${unit}: pause freezes time`,
      (await page.locator("canvas").getAttribute("data-elapsed")) === time,
    )
    await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
    await page.waitForFunction(
      (time) =>
        Number(document.querySelector("canvas").dataset.elapsed) >
        Number(time) + 100,
      time,
    )
    check(`${unit}: resume advances time`)
    await page.getByRole("checkbox", { name: "Đi bộ", exact: true }).uncheck()
    await page.waitForFunction(
      () => document.querySelector("canvas").dataset.frame === "world.up.0",
    )
    check(`${unit}: standing uses directional idle`)
    await page.getByRole("img").scrollIntoViewIfNeeded()
    check(
      `${unit}: original portrait loads`,
      await page
        .getByRole("img")
        .evaluate((image) => image.complete && image.naturalWidth > 0),
    )
    await page.setViewportSize({ width: 390, height: 844 })
    check(
      `${unit}: mobile viewport has no horizontal overflow`,
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    )
    await page.screenshot({ path: `${out}/${unit}-mobile.png`, fullPage: true })
  }
  check(
    "Sixteen original audio cues fetch and decode",
    audio.length === 16 &&
      audio.every((cue) => cue.duration > 0.1 && cue.channels === 1),
  )
  await page.setViewportSize({ width: 1280, height: 1000 })
  for (const identity of ["aw2-lam", "aw2-lua", "aw2-than", "aw2-suong"])
    await page.getByTestId(`spirit-${identity}`).click()
  await loaded()
  await page.waitForFunction(
    () => document.querySelector("canvas")?.dataset.spirit === "aw2-suong",
  )
  check(
    "Rapid character changes settle on the latest identity with idle timeline and audio off",
    (await page.locator("canvas").getAttribute("data-frame")) ===
      "battle.idle" &&
      !(await page
        .getByRole("checkbox", { name: "Bật âm thanh", exact: true })
        .isChecked()),
  )
  const preserved = await page.evaluate(
    (keys) =>
      Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)])),
    Object.keys(original),
  )
  check(
    "All legacy and AW2 save bytes unchanged",
    JSON.stringify(preserved) === JSON.stringify(original),
  )
  check(
    "No primary-context browser errors or missing assets",
    errors.length === 0 && failed.length === 0,
  )
  for (const unit of units) {
    const blocked = await browser.newContext()
    await blocked.route(`**/assets/${unit}/base-v1/world.webp`, (route) =>
      route.abort(),
    )
    const missing = await blocked.newPage()
    await missing.goto(`${values.url}?spirit=aw2-${unit}`)
    await missing
      .getByRole("alert")
      .filter({ hasText: `Không tải được asset aw2-${unit}:world:base-v1` })
      .waitFor()
    check(
      `${unit}: missing atlas reports error and leaves canvas blank`,
      await missing.locator("canvas").evaluate(
        (canvas) =>
          !canvas
            .getContext("2d")
            .getImageData(0, 0, 640, 440)
            .data.some((value) => value > 0),
      ),
    )
    await blocked.close()
  }
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
    task: "AW2-004B",
    status: "PASS",
    engine: `Chromium ${browser.version()}`,
    viewports: ["1280x1000", "390x844"],
    checks,
    errors,
    failed,
    audio,
    requestedAssets: [...assets].sort(),
    limits: [
      "headless audio decoded, not human listening",
      "no physical device/combat/leveling/legal review",
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
        task: "AW2-004B",
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
