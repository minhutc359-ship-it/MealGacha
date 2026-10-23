import assert from "node:assert/strict"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"

const { values } = parseArgs({
  options: {
    unit: { type: "string" },
    "expected-count": { type: "string", default: "12" },
    compiled: { type: "boolean", default: false },
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
  },
})
assert.ok(["hai", "lien", "moc", "bach", "van"].includes(values.unit))
const unit = values.unit,
  identity = `aw2-${unit}`
const manifest = JSON.parse(
  await readFile(`src/aw2/assets/${unit}.base-v1.json`, "utf8"),
)
const spec = JSON.parse(
  await readFile(`dev/aw2/assets/${unit}/base-v1/spec.json`, "utf8"),
)
const { chromium } = await import(values.playwright)
const flavor = values.compiled ? "compiled" : "source",
  port = values.compiled ? 8487 : 8486
const root = `http://127.0.0.1:${port}`,
  out = `.asset-work/${spec.task.toLowerCase()}`
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
  timelines = {},
  audio = []
const saved = {
  "aw2.development.save": "unchanged-aw2",
  "foodchest.user.v1": "unchanged-stable",
  "foodchest.tcg.v1": "unchanged-tcg",
}
const check = (name, value = true) => {
  assert.ok(value, name)
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
    for (const [key, value] of Object.entries(saved))
      localStorage.setItem(key, value)
    window.__referenceAudio = []
    window.__referenceDraws = { count: 0, invalid: 0 }
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      window.__referenceAudio.push(this.src)
      return play.call(this)
    }
    const draw = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function (...a) {
      if (
        a[0] instanceof HTMLImageElement &&
        a[0].src.includes("/aw2/assets/")
      ) {
        window.__referenceDraws.count++
        if (
          a.length !== 9 ||
          a[1] < 0 ||
          a[2] < 0 ||
          a[1] + a[3] > a[0].naturalWidth ||
          a[2] + a[4] > a[0].naturalHeight
        )
          window.__referenceDraws.invalid++
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
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
  })
  await page.goto(`${root}/dev/aw2/roster.html?spirit=${identity}`)
  await page
    .getByTestId("atlas-state")
    .filter({ hasText: "Atlas đã tải" })
    .waitFor()
  check(
    "Authored registry count is explicit, without expanding ownership",
    (await page.locator('nav [data-testid^="spirit-"]').count()) ===
      +values["expected-count"],
  )
  check(
    "New reference truthfully keeps combat and collection pending",
    (await page.locator("main").innerText()).includes(
      "kỹ năng combat và thu thập chưa được triển khai",
    ),
  )
  check(
    "Audio remains off before opt-in",
    await page.evaluate(() => window.__referenceAudio.length === 0),
  )
  for (const [state, clip] of Object.entries(manifest.battle)) {
    await page.getByTestId(`state-${state}`).click()
    const seen = await page.evaluate(
      async ({ state, duration }) => {
        const seen = new Set(),
          start = performance.now()
        await new Promise((resolve, reject) => {
          const poll = () => {
            const frame = document.querySelector("canvas").dataset.frame
            if (frame?.startsWith(`battle.${state}.`)) seen.add(frame)
            if (seen.size === 4) resolve()
            else if (performance.now() - start > duration + 2500)
              reject(Error(`Missing ${state} cels`))
            else requestAnimationFrame(poll)
          }
          poll()
        })
        return [...seen]
      },
      { state, duration: clip.durationMs },
    )
    timelines[state] = seen
    check(`${state}: four distinct authored cels render`, seen.length === 4)
    await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
    const time = await page.locator("canvas").getAttribute("data-elapsed")
    await page.waitForTimeout(90)
    check(
      `${state}: pause freezes its clock`,
      (await page.locator("canvas").getAttribute("data-elapsed")) === time,
    )
    if (["attack", "ultimate", "defeat"].includes(state))
      await page
        .locator("canvas")
        .screenshot({ path: `${out}/${flavor}-${state}.png` })
  }
  await page
    .getByRole("checkbox", { name: "Bật âm thanh", exact: true })
    .check()
  for (const [slot, skill] of Object.entries(manifest.skills)) {
    await page.getByTestId(`skill-${slot}`).click()
    if (skill.projectile) {
      await page.waitForFunction(() =>
        document
          .querySelector("canvas")
          .dataset.projectile.startsWith("fx.basic."),
      )
      check(
        "Ranged basic shows own flight before impact",
        (await page.locator("canvas").getAttribute("data-fx")) === "",
      )
    }
    await page.waitForFunction(
      (slot) => document.querySelector("canvas").dataset.fx === `fx.${slot}.2`,
      slot,
    )
    const expected = skill.fxCueAtMs.length
    await page.waitForFunction(
      (expected) => +document.querySelector("canvas").dataset.cues === expected,
      expected,
    )
    check(
      `${slot}: exactly ${expected} opted-in own cues`,
      +(await page.locator("canvas").getAttribute("data-cues")) === expected,
    )
    const lifetime = (skill.projectile ? 2 : 4) * skill.fxFrameMs
    const end = skill.fxCueAtMs.at(-1) + lifetime + 30
    await page.waitForFunction(
      (end) => +document.querySelector("canvas").dataset.elapsed >= end,
      end,
    )
    check(
      `${slot}: expired effect and projectile stay absent in recovery`,
      await page
        .locator("canvas")
        .evaluate((c) => c.dataset.fx === "" && c.dataset.projectile === ""),
    )
    const sound = await page.evaluate(
      async ({ unit, slot }) => {
        const ctx = new AudioContext()
        try {
          const r = await fetch(`/dev/aw2/assets/${unit}/base-v1/${slot}.wav`)
          const d = await ctx.decodeAudioData(await r.arrayBuffer())
          return { slot, channels: d.numberOfChannels, duration: d.duration }
        } finally {
          await ctx.close()
        }
      },
      { unit, slot },
    )
    audio.push(sound)
  }
  check(
    "Four original cues decode, without a human-listening claim",
    audio.length === 4 &&
      audio.every((a) => a.channels === 1 && a.duration > 0.1),
  )
  check(
    "Opt-in only plays this unit's own audio",
    await page.evaluate(
      (unit) =>
        window.__referenceAudio.length >= 4 &&
        window.__referenceAudio.every((p) => p.includes(`/${unit}/base-v1/`)),
      unit,
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
      !document.querySelector("canvas").dataset.fx,
  )
  const image = await page.locator("canvas").evaluate((c) => c.toDataURL())
  await page.waitForTimeout(120)
  check(
    "Reduced motion holds one authored cel",
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
            reject(Error("Missing world cels"))
          else requestAnimationFrame(poll)
        }
        poll()
      })
      return [...seen]
    }, direction)
    check(`${direction}: four separate world cels cycle`, seen.length === 4)
  }
  await page.getByRole("checkbox", { name: "Đi bộ", exact: true }).uncheck()
  await page.waitForFunction(
    () => document.querySelector("canvas").dataset.frame === "world.up.0",
  )
  check("Standing respects selected directional idle")
  check(
    "All actual draws remain inside their source atlas",
    await page.evaluate(
      () =>
        window.__referenceDraws.count > 0 &&
        window.__referenceDraws.invalid === 0,
    ),
  )
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 1000 })
    check(
      `${width}px controls fit viewport`,
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
    "Starter copy retains existing combat readiness",
    (await page.locator("main").innerText()).includes(
      "Đã có combat và cấp độ thử nghiệm.",
    ),
  )
  check(
    "Selection resets sound opt-in",
    !(await page
      .getByRole("checkbox", { name: "Bật âm thanh", exact: true })
      .isChecked()),
  )
  check(
    "Preview preserves all seeded stable and AW2 bytes",
    await page.evaluate(
      (saved) =>
        Object.entries(saved).every(([k, v]) => localStorage.getItem(k) === v),
      saved,
    ),
  )
  check("No unexpected browser/resource errors", errors.length === 0)
  for (const name of ["world", "fx", spec.sheetA, spec.sheetB]) {
    const blocked = await browser.newContext()
    await blocked.route(`**/${unit}/base-v1/${name}.webp`, (route) =>
      route.abort(),
    )
    const missing = await blocked.newPage()
    await missing.goto(`${root}/dev/aw2/roster.html?spirit=${identity}`)
    const alert = missing
      .getByRole("alert")
      .filter({ hasText: `Không tải được asset ${identity}:` })
    await alert.waitFor()
    const ids = Object.values(manifest.assets)
      .filter((a) => a.url.endsWith(`/${name}.webp`))
      .map((a) => a.id)
    const message = await alert.innerText()
    assert.ok(ids.some((id) => message.endsWith(id)))
    check(
      `Missing ${name}: own explicit error and blank canvas`,
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
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: spec.task,
        spiritId: identity,
        status: "PASS",
        flavor,
        engine: browser.version(),
        checks,
        errors,
        timelines,
        audio,
        limits: [
          "Reference preview only; no combat/ownership/save grants",
          "Desktop viewports only; independent art/listening/device/rights still open",
        ],
      },
      null,
      2,
    ) + "\n",
  )
  console.log(
    JSON.stringify({ status: "PASS", unit, flavor, checks: checks.length }),
  )
} catch (e) {
  await mkdir(out, { recursive: true })
  await page
    ?.screenshot({ path: `${out}/${flavor}-failure.png`, fullPage: true })
    .catch(() => {})
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      { task: spec.task, status: "FAIL", checks, errors, failure: String(e) },
      null,
      2,
    ) + "\n",
  )
  throw e
} finally {
  await browser?.close()
  await server.close()
}
