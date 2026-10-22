import assert from "node:assert/strict"
import { mkdir, readFile, writeFile } from "node:fs/promises"
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
const port = values.compiled ? 8475 : 8474,
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
const root = `http://127.0.0.1:${port}`,
  out = ".asset-work/aw2-004j"
const manifest = JSON.parse(
  await readFile("src/aw2/assets/muoi.base-v1.json", "utf8"),
)
const checks = [],
  errors = [],
  audio = [],
  requested = new Set(),
  timelines = {}
const saved = {
  "foodchest.user.v1": "unchanged-stable-user",
  "foodchest.tcg.v1": "unchanged-stable-tcg",
  "aw2.development.save": "unchanged-aw2-bytes",
}
const check = (name, ok = true) => {
  assert.ok(ok, name)
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
    for (const [k, v] of Object.entries(saved)) localStorage.setItem(k, v)
    window.__played = []
    window.__draws = {}
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      window.__played.push(this.src)
      return play.call(this)
    }
    const draw = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function (...a) {
      if (
        a[0] instanceof HTMLImageElement &&
        a[0].src.includes("/aw2/assets/")
      ) {
        const r = window.__draws[a[0].src] ?? { count: 0, invalid: 0 }
        r.count++
        if (
          a.length !== 9 ||
          a[1] < 0 ||
          a[2] < 0 ||
          a[1] + a[3] > a[0].naturalWidth ||
          a[2] + a[4] > a[0].naturalHeight
        )
          r.invalid++
        window.__draws[a[0].src] = r
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
    if (r.url().includes("/aw2/assets/"))
      requested.add(new URL(r.url()).pathname)
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
  })
  await page.goto(`${root}/dev/aw2/roster.html?spirit=aw2-muoi`)
  await page
    .getByTestId("atlas-state")
    .filter({ hasText: "Atlas đã tải" })
    .waitFor()
  check(
    "Six authored references available without changing five-starter ownership",
    (await page.locator('nav [data-testid^="spirit-"]').count()) === 6,
  )
  check(
    "Muoi preview truthfully declares combat and collection pending",
    (await page.locator("main").innerText()).includes(
      "kỹ năng combat và thu thập chưa được triển khai",
    ),
  )
  check(
    "No opted-out sound played",
    await page.evaluate(() => window.__played.length === 0),
  )
  for (const [state, clip] of Object.entries(manifest.battle)) {
    await page.getByTestId(`state-${state}`).click()
    const seen = await page.evaluate(
      async ({ state, duration }) => {
        const seen = new Set(),
          start = performance.now()
        await new Promise((resolve, reject) => {
          const poll = () => {
            const d = document.querySelector("canvas").dataset
            if (d.frame?.startsWith(`battle.${state}.`)) seen.add(d.frame)
            if (seen.size === 4) resolve()
            else if (performance.now() - start > duration + 2500)
              reject(Error("Missing new cels " + state))
            else requestAnimationFrame(poll)
          }
          poll()
        })
        return [...seen]
      },
      { state, duration: clip.durationMs },
    )
    timelines[state] = seen
    check(`${state}: all four new cels render`, seen.length === 4)
    await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
    const time = await page.locator("canvas").getAttribute("data-elapsed")
    await page.waitForTimeout(100)
    check(
      `${state}: pause freezes the timeline`,
      (await page.locator("canvas").getAttribute("data-elapsed")) === time,
    )
    if (["attack", "ultimate", "defeat"].includes(state))
      await page
        .locator("canvas")
        .screenshot({ path: `${out}/${flavor}-${state}.png` })
  }
  await page.getByTestId("skill-basic").click()
  await page.waitForFunction(() =>
    document
      .querySelector("canvas")
      .dataset.projectile?.startsWith("fx.basic."),
  )
  check(
    "Basic flight uses authored projectile cels before impact",
    (await page.locator("canvas").getAttribute("data-fx")) === "",
  )
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.fx === "fx.basic.2",
  )
  check(
    "Basic impact starts after flight ends",
    (await page.locator("canvas").getAttribute("data-projectile")) === "",
  )
  await page.waitForFunction(
    () => +document.querySelector("canvas").dataset.elapsed >= 900,
  )
  check(
    "Basic impact expires and markers emit exactly once",
    (await page.locator("canvas").getAttribute("data-fx")) === "" &&
      (await page.locator("canvas").getAttribute("data-events")) === "2",
  )
  await page
    .getByRole("checkbox", { name: "Bật âm thanh", exact: true })
    .check()
  for (const slot of ["basic", "auto", "passive", "ultimate"]) {
    await page.getByTestId(`skill-${slot}`).click()
    await page.waitForFunction(
      (slot) => document.querySelector("canvas").dataset.fx === `fx.${slot}.2`,
      slot,
    )
    check(
      `${slot}: own FX and one opted-in cue`,
      (await page.locator("canvas").getAttribute("data-cues")) === "1",
    )
    const sound = await page.evaluate(async (slot) => {
      const ctx = new AudioContext()
      try {
        const r = await fetch(`/dev/aw2/assets/muoi/base-v1/${slot}.wav`)
        const d = await ctx.decodeAudioData(await r.arrayBuffer())
        return { slot, channels: d.numberOfChannels, duration: d.duration }
      } finally {
        await ctx.close()
      }
    }, slot)
    audio.push(sound)
  }
  check(
    "Four unit-owned synthesized cues decode, without human listening claim",
    audio.length === 4 &&
      audio.every((a) => a.channels === 1 && a.duration > 0.1),
  )
  check(
    "Opted-in audio only requests Muoi sources",
    await page.evaluate(
      () =>
        window.__played.length >= 4 &&
        window.__played.every((p) => p.includes("/muoi/base-v1/")),
    ),
  )
  await page
    .getByRole("checkbox", { name: "Bật âm thanh", exact: true })
    .uncheck()
  await page
    .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
    .check()
  await page.getByTestId("state-attack").click()
  await page.waitForFunction(
    () =>
      document.querySelector("canvas").dataset.frame === "battle.attack.0" &&
      document.querySelector("canvas").dataset.fx === "",
  )
  const image = await page.locator("canvas").evaluate((c) => c.toDataURL())
  await page.waitForTimeout(150)
  check(
    "Reduced motion is a static authored cel",
    (await page.locator("canvas").evaluate((c) => c.toDataURL())) === image,
  )
  await page
    .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
    .uncheck()
  await page.getByRole("button", { name: "World / chibi", exact: true }).click()
  for (const direction of ["down", "left", "right", "up"]) {
    await page.getByTestId(`direction-${direction}`).click()
    const seen = await page.evaluate(async (direction) => {
      const seen = new Set(),
        start = performance.now()
      await new Promise((resolve, reject) => {
        const poll = () => {
          const f = document.querySelector("canvas").dataset.frame
          if (f?.startsWith(`world.${direction}.`)) seen.add(f)
          if (seen.size === 4) resolve()
          else if (performance.now() - start > 4000)
            reject(Error("World cels missing"))
          else requestAnimationFrame(poll)
        }
        poll()
      })
      return [...seen]
    }, direction)
    check(`World ${direction}: four authored cels cycle`, seen.length === 4)
  }
  await page.getByRole("checkbox", { name: "Đi bộ", exact: true }).uncheck()
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.frame === "world.up.0",
  )
  check("Standing uses the chosen directional idle")
  check(
    "All decoded source rectangles stay in bounds",
    await page.evaluate(() =>
      Object.values(window.__draws).every(
        (r) => r.count > 0 && r.invalid === 0,
      ),
    ),
  )
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 1000 })
    check(
      `${width}px: controls and page fit viewport`,
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    )
  }
  await page.screenshot({ path: `${out}/${flavor}-mobile.png`, fullPage: true })
  await page.getByTestId("spirit-aw2-than").click()
  await page.waitForFunction(
    () => document.querySelector("canvas")?.dataset.spirit === "aw2-than",
  )
  check(
    "Shared preview retains starter combat-ready copy",
    (await page.locator("main").innerText()).includes(
      "Đã có combat và cấp độ thử nghiệm.",
    ),
  )
  check(
    "Selection resets audio opt-in",
    !(await page
      .getByRole("checkbox", { name: "Bật âm thanh", exact: true })
      .isChecked()),
  )
  for (const id of ["aw2-muoi", "aw2-lua", "aw2-muoi"])
    await page.getByTestId(`spirit-${id}`).click()
  await page.waitForFunction(
    () => document.querySelector("canvas")?.dataset.spirit === "aw2-muoi",
  )
  check("Rapid selection returns to latest identity")
  check(
    "All seeded stable and AW2 save bytes remain unchanged",
    await page.evaluate(
      (saved) =>
        Object.entries(saved).every(([k, v]) => localStorage.getItem(k) === v),
      saved,
    ),
  )
  check("No unexpected browser/resource errors", errors.length === 0)
  for (const name of [
    "world",
    "fx",
    "battle-motion-a-v3",
    "battle-motion-b-v3",
  ]) {
    const blocked = await browser.newContext()
    await blocked.route(`**/muoi/base-v1/${name}.webp`, (r) => r.abort())
    const missing = await blocked.newPage()
    await missing.goto(`${root}/dev/aw2/roster.html?spirit=aw2-muoi`)
    await missing
      .getByRole("alert")
      .filter({ hasText: `Không tải được asset aw2-muoi:${name}:base-v1` })
      .waitFor()
    check(
      `Missing ${name}: explicit error and blank canvas`,
      await missing.locator("canvas").evaluate(
        (c) =>
          !c
            .getContext("2d")
            .getImageData(0, 0, 640, 440)
            .data.some((v) => v > 0),
      ),
    )
    await blocked.close()
  }
  const reduced = await browser.newContext({ reducedMotion: "reduce" }),
    p = await reduced.newPage()
  await p.goto(`${root}/dev/aw2/roster.html?spirit=aw2-muoi`)
  check(
    "System reduced-motion preference initializes control",
    await p
      .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
      .isChecked(),
  )
  await reduced.close()
  const invalid = await context.newPage()
  await invalid.goto(`${root}/dev/aw2/roster.html?spirit=constructor`)
  await invalid.waitForFunction(
    () => document.querySelector("canvas")?.dataset.spirit === "aw2-muoi",
  )
  check("Unknown/prototype query safely selects Muoi reference")
  await invalid.close()
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-004J",
        status: "PASS",
        flavor,
        engine: browser.version(),
        checks,
        errors,
        audio,
        timelines,
        requested: [...requested],
        limits: [
          "Asset preview only; Muoi combat/collection NOT_IMPLEMENTED",
          "No physical device/human listening/legal/full-character acceptance",
        ],
      },
      null,
      2,
    ) + "\n",
  )
  console.log(JSON.stringify({ status: "PASS", flavor, checks: checks.length }))
} catch (e) {
  await mkdir(out, { recursive: true })
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-004J",
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
