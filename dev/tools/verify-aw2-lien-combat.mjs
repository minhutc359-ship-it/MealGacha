import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"
const { values } = parseArgs({
  options: {
    compiled: { type: "boolean", default: false },
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
  },
})
const { chromium } = await import(values.playwright)
const flavor = values.compiled ? "compiled" : "source",
  port = values.compiled ? 8491 : 8490,
  root = `http://127.0.0.1:${port}`,
  out = ".asset-work/aw2-007h"
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
  saved = {
    "aw2.development.save": "preserve-aw2",
    "foodchest.user.v1": "preserve-user",
    "foodchest.tcg.v1": "preserve-tcg",
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
    window.__lienAudio = []
    window.__lienDraws = { count: 0, invalid: 0 }
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      window.__lienAudio.push(this.src)
      return play.call(this)
    }
    const draw = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      if (
        args[0] instanceof HTMLImageElement &&
        args[0].src.includes("/lien/base-v1/")
      ) {
        window.__lienDraws.count++
        if (
          args.length !== 9 ||
          args[1] < 0 ||
          args[2] < 0 ||
          args[1] + args[3] > args[0].naturalWidth ||
          args[2] + args[4] > args[0].naturalHeight
        )
          window.__lienDraws.invalid++
      }
      return draw.apply(this, args)
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
  const state = async () =>
    JSON.parse(await page.getByTestId("lien-state").getAttribute("data-state"))
  const data = async (key) =>
    JSON.parse(await page.locator("canvas").getAttribute(`data-${key}`))
  const tick = async () =>
    +(await page.locator("canvas").getAttribute("data-tick"))
  const open = async () => {
    await page.goto(`${root}/dev/aw2/battle.html?team=lien`)
    await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
    await page
      .getByTestId("battle-atlas-state")
      .filter({ hasText: "Đội luyện đã tải đủ bộ hình chiến đấu" })
      .waitFor()
    await page.waitForFunction(
      () => !!document.querySelector("canvas")?.dataset.actorEffects,
    )
  }
  const step = async () => {
    const before = await tick()
    await page.getByRole("button", { name: "Bước 1 nhịp", exact: true }).click()
    await page.waitForFunction(
      (t) => +document.querySelector("canvas").dataset.tick > t,
      before,
    )
  }
  const until = async (target) => {
    while ((await tick()) < target) await step()
  }
  const allies = async () =>
    JSON.parse(await page.getByTestId("lien-allies").getAttribute("data-state"))
  const ownFx = async (slot) =>
    ((await data("actor-effects"))["player-aw2-lien"] ?? []).filter((e) =>
      e.skillId.endsWith(`:${slot}`),
    )
  await open()
  check(
    "Five-member Liên practice replaces Lam",
    (await page.locator('[data-testid^="unit-aw2-"]').count()) === 5 &&
      (await page.getByTestId("unit-aw2-lien").count()) === 1 &&
      (await page.getByTestId("unit-aw2-lam").count()) === 0,
  )
  check(
    "Sound remains silent before opt-in",
    await page.evaluate(() => window.__lienAudio.length === 0),
  )
  await page.getByTestId("ultimate-aw2-lien").click()
  check(
    "Paid ultimate has anticipation without promised healing FX",
    (await state()).energy === 0 &&
      !!(await state()).cast &&
      !(await state()).lienUltimate &&
      !(await ownFx("ultimate")).length,
  )
  await page.getByTestId("lien-interrupt").click()
  await until(2)
  check(
    "Real anticipation interruption has no refund or future pulses",
    !(await state()).cast &&
      !(await state()).lienUltimate &&
      (await state()).energy === 0 &&
      !(await ownFx("ultimate")).length,
  )
  await open()
  await until(3)
  check(
    "Basic flies before its authoritative impact",
    (await data("actor-cues"))["player-aw2-lien"]?.phase === "launch" &&
      !(await ownFx("basic")).length,
  )
  await until(5)
  check(
    "Confirmed basic uses own impact cells at real enemy",
    (await ownFx("basic")).some(
      (f) => f.targetId === "enemy-than" && /^fx.basic.[23]$/.test(f.fx),
    ),
  )
  check(
    "Actual Muối opponent marks an ally",
    (await allies()).some((a) => Object.keys(a.muoiMarks ?? {}).length > 0),
  )
  await until(6)
  const hot = (await state()).lienHoT
  check(
    "First auto pulse commits one finite HoT",
    hot?.index === 1 &&
      hot.nextPulseTick === 8 &&
      hot.targetId === "player-aw2-suong",
  )
  check(
    "Auto outcome owns target FX at its420ms cue",
    (await ownFx("auto")).some(
      (f) => f.atMs === 420 && f.targetId === hot.targetId,
    ),
  )
  await page.getByTestId("ultimate-aw2-lien").click()
  await step()
  check(
    "Ultimate windup creates no future pulse FX",
    !(await ownFx("ultimate")).length && (await state()).lienHoT?.id === hot.id,
  )
  await step()
  const first = (await ownFx("ultimate"))[0]
  check(
    "First ultimate pulse cleanses actual Muối mark",
    (await allies()).find((a) => a.id === "player-aw2-lua").muoiMarks ===
      undefined &&
      (await page.getByTestId("lien-outcomes").innerText()).includes(
        "tẩy một hiệu ứng",
      ),
  )
  check(
    "First actual pulse uses own520ms cue at real Lua recipient",
    first.index === 0 &&
      first.atMs === 520 &&
      first.targetId === "player-aw2-lua",
  )
  check(
    "Actual ultimate gesture survives simultaneous basic launch",
    (await data("actor-poses"))["player-aw2-lien"] === "battle.ultimate.1",
  )
  const clock = await page.locator("canvas").getAttribute("data-motion-time")
  await page.waitForTimeout(100)
  check(
    "Pause freezes presentation clock",
    (await page.locator("canvas").getAttribute("data-motion-time")) === clock,
  )
  await page
    .locator("canvas")
    .screenshot({ path: `${out}/${flavor}-ultimate.png` })
  await until(10)
  const second = (await ownFx("ultimate"))[0]
  check(
    "Second pulse is confirmed separately at1040ms",
    second.index === 1 &&
      second.atMs === 1040 &&
      second.serial !== first.serial,
  )
  check(
    "Both committed healing schedules end after their finite pulses",
    !(await state()).lienHoT && !(await state()).lienUltimate,
  )
  await page
    .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
    .check()
  check(
    "Reduced motion uses own authored cel",
    /^battle\./.test((await data("actor-poses"))["player-aw2-lien"]),
  )
  await open()
  await until(20)
  const protectedActor = (await allies()).find(
    (a) => a.id === "player-aw2-than",
  )
  check(
    "Positive heal on an actual weakened ally grants one finite guard",
    protectedActor.interruptGuardCharges === 1 &&
      protectedActor.interruptGuardUntilTick === 24 &&
      (await state()).lienGuardCooldowns[protectedActor.id] === 28,
  )
  const independent = (await data("actor-effects"))["player-aw2-lien"]
  check(
    "Basic, auto and passive keep independent own effect clocks",
    ["basic", "auto", "passive"].every((slot) =>
      independent.some((f) => f.skillId === `aw2-lien:skill:${slot}`),
    ) &&
      new Set(independent.map((f) => f.serial)).size >= 3 &&
      (await ownFx("passive")).some(
        (f) => f.targetId === protectedActor.id && f.atMs === 180,
      ),
  )
  await page
    .getByRole("combobox", { name: "Đồng minh thử ngắt", exact: true })
    .selectOption(protectedActor.id)
  if (!protectedActor.cast) await page.getByTestId("ultimate-aw2-than").click()
  await page.getByTestId("lien-interrupt").click()
  const resisted = (await allies()).find((a) => a.id === protectedActor.id)
  check(
    "First real interrupt consumes guard and preserves cast",
    resisted.interruptGuardCharges === 0 && !!resisted.cast,
  )
  await page.getByTestId("lien-interrupt").click()
  check(
    "Second real interrupt cancels unprotected cast",
    !(await allies()).find((a) => a.id === protectedActor.id).cast,
  )
  await page
    .locator("canvas")
    .screenshot({ path: `${out}/${flavor}-guard.png` })
  await open()
  await until(6)
  await page.getByRole("checkbox", { name: "Âm thanh", exact: true }).check()
  await page.getByTestId("ultimate-aw2-lien").click()
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
  await page.waitForFunction(
    () =>
      window.__lienAudio.filter((u) => u.includes("/lien/base-v1/ultimate.wav"))
        .length >= 2,
    null,
    { timeout: 12000 },
  )
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  check(
    "Two positive ultimate pulses play exactly two opted-in own cues",
    await page.evaluate(
      () =>
        window.__lienAudio.filter((u) =>
          u.includes("/lien/base-v1/ultimate.wav"),
        ).length === 2,
    ),
  )
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
  await page.waitForTimeout(1050)
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  check(
    "Finite ultimate FX expire after the final real pulse",
    !(await ownFx("ultimate")).some((f) => f.fx),
  )
  check(
    "Actual own atlas draws stay in safe source bounds",
    await page.evaluate(
      () => window.__lienDraws.count > 0 && window.__lienDraws.invalid === 0,
    ),
  )
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 })
    check(
      `${width}px controls fit viewport`,
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    )
  }
  await page.screenshot({ path: `${out}/${flavor}-mobile.png`, fullPage: true })
  await page
    .getByRole("combobox", { name: "Cấp thử nghiệm" })
    .selectOption("20")
  await page.getByRole("button", { name: "Tạo lại trận", exact: true }).click()
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  check(
    "Reset retains Liên practice and level20 stats",
    (await state()).maxHp === 297 &&
      (await state()).energy === 100 &&
      !(await state()).lienHoT,
  )
  check(
    "Practice preserves seeded stable and AW2 save bytes",
    await page.evaluate(
      (saved) =>
        Object.entries(saved).every(([k, v]) => localStorage.getItem(k) === v),
      saved,
    ),
  )
  await page.goto(`${root}/dev/aw2/roster.html?spirit=aw2-lien`)
  await page
    .getByRole("link", { name: "luyện kỹ năng Liên", exact: true })
    .waitFor()
  check(
    "Reference links actual practice while collection remains pending",
    (await page.locator("main").innerText()).includes(
      "Thu thập và đội lưu còn chờ",
    ),
  )
  check("No unexpected page/console/resource errors", errors.length === 0)
  for (const file of [
    "battle-motion-a-v1.webp",
    "battle-motion-b-v1.webp",
    "fx.webp",
  ]) {
    const c = await browser.newContext(),
      p = await c.newPage()
    await p.route(`**/lien/base-v1/${file}`, (r) => r.abort())
    await p.goto(`${root}/dev/aw2/battle.html?team=lien`)
    await p
      .getByRole("alert")
      .filter({ hasText: "Không tải được atlas" })
      .waitFor()
    check(
      `Missing ${file} fails explicitly with blank canvas`,
      await p.locator("canvas").evaluate((c) =>
        c
          .getContext("2d")
          .getImageData(0, 0, c.width, c.height)
          .data.every((v) => v === 0),
      ),
    )
    await c.close()
  }
  await writeFile(
    `${out}/${flavor}-combat.json`,
    JSON.stringify(
      {
        task: "AW2-007H",
        status: "PASS",
        flavor,
        engine: browser.version(),
        checks,
        errors,
        limits: [
          "Desktop viewports; no independent art/listening/physical-device/rights acceptance",
          "No collection or saved-team grants",
        ],
      },
      null,
      2,
    ) + "\n",
  )
  console.log(JSON.stringify({ status: "PASS", flavor, checks: checks.length }))
} catch (e) {
  await mkdir(out, { recursive: true })
  await page
    ?.screenshot({ path: `${out}/${flavor}-failure.png`, fullPage: true })
    .catch(() => {})
  await writeFile(
    `${out}/${flavor}-combat.json`,
    JSON.stringify(
      { status: "FAIL", flavor, checks, errors, failure: String(e) },
      null,
      2,
    ) + "\n",
  )
  throw e
} finally {
  await browser?.close()
  await server.close()
}
