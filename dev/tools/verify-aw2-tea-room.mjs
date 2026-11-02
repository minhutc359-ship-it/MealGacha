import assert from "node:assert/strict"
import { mkdir, writeFile, readFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"
import { tapWorldPoint } from "./aw2-world-browser-view.mjs"
const { values } = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
    compiled: { type: "boolean", default: false },
  },
})
const flavor = values.compiled ? "compiled" : "source",
  port = values.compiled ? 8691 : 8690,
  out = ".asset-work/aw2-016f",
  key = "aw2.development.save",
  checks = [],
  errors = [],
  expectedErrors = [],
  captures = []
const url = `http://127.0.0.1:${port}/dev/aw2/game.html`,
  legacy = {
    "foodchest.user.v1": "016e-user",
    "foodchest.tcg.v1": "016e-cards",
    "foodchest.tcg.v1.checkpoint.v4": "016e-checkpoint",
    "mealgacha.progress-journal.v4": "016e-journal",
    "mealgacha.progress-writer.v4": "016e-writer",
  }
const check = (name, ok = true) => {
  assert.ok(ok, name)
  checks.push(name)
  console.log(name)
}
const server = values.compiled
  ? await preview({
      configFile: "dev/vite.aw2.config.ts",
      preview: { host: "127.0.0.1", port, strictPort: true },
    })
  : await createServer({
      configFile: "dev/vite.dev.config.ts",
      server: {
        host: "127.0.0.1",
        port,
        strictPort: true,
        watch: { ignored: ["**/dist*/**"] },
      },
    })
const { chromium } = await import(values.playwright)
let browser,
  page,
  phase = "bootstrap",
  fault = "",
  finalRaw = ""
try {
  if (!values.compiled) await server.listen()
  await mkdir(out, { recursive: true })
  browser = await chromium.launch({
    executablePath: values.chromium,
    env: {
      ...process.env,
      LD_LIBRARY_PATH: values.chromium?.slice(
        0,
        values.chromium.lastIndexOf("/"),
      ),
    },
    headless: true,
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    hasTouch: true,
    reducedMotion: "no-preference",
  })
  await context.addInitScript(() => {
    window.__teaWrites = 0
    window.__teaFail = false
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (k, v) {
      if (k === "aw2.development.save") {
        window.__teaWrites++
        const candidate = document.querySelector(
          '[data-world-scene-state="preparing"] canvas',
        )
        window.__teaCommit = candidate
          ? {
              token: (candidate.__teaIdentity ??= crypto.randomUUID()),
              ready: candidate.dataset.worldRenderState,
              room: candidate.dataset.roomId ?? null,
            }
          : null
        if (window.__teaFail)
          throw new DOMException(
            "016F simulated storage failure",
            "QuotaExceededError",
          )
      }
      return set.call(this, k, v)
    }
  })
  page = await context.newPage()
  page.setDefaultTimeout(45000)
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("response", (r) => {
    if (r.status() >= 400)
      (fault && new URL(r.url()).pathname === fault
        ? expectedErrors
        : errors
      ).push(`${r.status()} ${r.url()}`)
  })
  page.on("console", (m) => {
    if (m.type() === "error")
      (fault && /404|Failed to load|Error loading|Could not load/.test(m.text())
        ? expectedErrors
        : errors
      ).push(m.text())
    if (
      m.type() === "warning" &&
      /destroyed instead of unloaded|already has key/.test(m.text())
    )
      errors.push(m.text())
  })
  const raw = () => page.evaluate((k) => localStorage.getItem(k), key),
    save = async () => JSON.parse(await raw()),
    writes = () => page.evaluate(() => window.__teaWrites),
    map = () =>
      page
        .locator('[data-world-scene-state="active"]')
        .getByTestId("world-map"),
    canvas = () => map().locator("canvas"),
    dialog = () => page.locator("dialog[open]:not(.aw2-game-panel)"),
    panel = () => page.getByTestId("game-panel"),
    click = (name) => page.getByRole("button", { name, exact: true }).click(),
    dock = (name) =>
      page
        .getByRole("navigation", { name: "Menu game", exact: true })
        .getByRole("button", { name, exact: true })
  const ready = async () => {
    await canvas().waitFor()
    await map().locator(".aw2-map-loading").waitFor({ state: "hidden" })
    await page.waitForFunction(
      () =>
        document.querySelector('[data-world-scene-state="active"] canvas')
          ?.dataset.worldRenderState === "ready",
    )
  }
  const arrive = (x, y) =>
    page.waitForFunction(
      ({ x, y }) => {
        const p = document
          .querySelector('[data-testid="player-position"]')
          ?.textContent.match(/Vị trí (\d+), (\d+)/)
        return p && Math.abs(+p[1] - x) <= 1 && Math.abs(+p[2] - y) <= 1
      },
      { x, y },
    )
  const go = async (x, y) => {
    await ready()
    await click("Toàn cảnh")
    await page.waitForFunction(
      () =>
        JSON.parse(
          document.querySelector('[data-world-scene-state="active"] canvas')
            .dataset.worldCamera,
        ).mode === "overview",
    )
    await tapWorldPoint(page, x, y)
    await arrive(x, y)
  }
  const interact = async (action) => {
    await map().focus()
    await page.keyboard.press("e")
    await dialog().waitFor()
    if (action) {
      await dialog().getByRole("button", { name: action, exact: true }).click()
      await dialog().waitFor({ state: "hidden" })
    }
  }
  const close = async () => {
    await page.keyboard.press("Escape")
    await page.locator("dialog[open]").waitFor({ state: "hidden" })
  }
  const menu = async () => {
    await dock("Thêm").click()
    await panel().waitFor()
  }
  const travel = async (x, name) => {
    await go(x, 192)
    await interact("Đi qua")
    await page.getByTestId("zone-name").filter({ hasText: name }).waitFor()
    await ready()
    check(
      `${name}: prepared scene ready with one representative`,
      (await canvas().getAttribute("data-party-size")) === "1",
    )
  }
  const capture = async (name) => {
    const p = `${out}/${flavor}-${name}.png`
    await page.screenshot({ path: p })
    captures.push(p)
  }
  phase = "fresh-intro"
  await page.goto(url)
  await click("Tạo bản lưu AW2")
  await page.evaluate(
    (v) => Object.entries(v).forEach(([k, s]) => localStorage.setItem(k, s)),
    legacy,
  )
  await ready()
  await go(160, 272)
  await interact("Nhận nhiệm vụ")
  await go(160, 176)
  await interact("Đọc mảnh khăn")
  await go(160, 272)
  await interact("Hoàn tất nhập môn")
  check(
    "Fresh real intro awards five starters and30XP under schema6",
    (await save()).schemaVersion === 6 &&
      (await save()).progress.partyIds.length === 5 &&
      (await save()).economy.teamExperience === 30,
  )
  await go(300, 80)
  await interact()
  const sourceRaw = await raw(),
    sourcePos = await page.getByTestId("player-position").textContent(),
    sourceWrites = await writes(),
    sourceToken = await canvas().evaluate(
      (c) => (c.__teaIdentity ??= crypto.randomUUID()),
    ),
    sourceActor = JSON.parse(
      await canvas().getAttribute("data-party-positions"),
    )[0]
  phase = "missing-floor"
  fault = "/dev/aw2/assets/environments/village-tea/v1/floor.webp"
  let missing = true
  await page.route(`**${fault}`, (route) =>
    missing
      ? route.fulfill({ status: 404, body: "016F missing floor" })
      : route.continue(),
  )
  await dialog()
    .getByRole("button", { name: "Vào tiệm trà", exact: true })
    .click()
  await dialog().getByRole("alert").waitFor()
  check(
    "Required room floor404 makes no write",
    (await raw()) === sourceRaw && (await writes()) === sourceWrites,
  )
  check(
    "Floor404 retains exact source canvas and position",
    (await canvas().evaluate((c) => c.__teaIdentity)) === sourceToken &&
      (await page.getByTestId("player-position").textContent()) === sourcePos,
  )
  missing = false
  await page.unroute(`**${fault}`)
  fault = ""
  phase = "cancel-loading"
  let releaseTexture, textureDone
  const textureHandled = new Promise((resolve) => (textureDone = resolve))
  await page.route(
    `**${fault || "/dev/aw2/assets/environments/village-tea/v1/floor.webp"}`,
    async (route) => {
      await new Promise((resolve) => {
        releaseTexture = resolve
      })
      await route.continue()
      textureDone()
    },
  )
  await dialog()
    .getByRole("button", { name: "Vào tiệm trà · thử lại", exact: true })
    .click()
  for (let i = 0; i < 100 && !releaseTexture; i++) await page.waitForTimeout(20)
  assert.ok(releaseTexture, "request held")
  await dialog()
    .getByRole("button", { name: "Hủy chuyển vùng", exact: true })
    .click()
  await dialog()
    .getByRole("button", { name: "Vào tiệm trà", exact: true })
    .waitFor()
  releaseTexture()
  await textureHandled
  await page.unroute("**/dev/aw2/assets/environments/village-tea/v1/floor.webp")
  check(
    "Cancel during actual floor load retains exact raw and source canvas",
    (await raw()) === sourceRaw &&
      (await canvas().evaluate((c) => c.__teaIdentity)) === sourceToken,
  )
  phase = "storage-failure"
  await page.evaluate(() => (window.__teaFail = true))
  await dialog()
    .getByRole("button", { name: "Vào tiệm trà", exact: true })
    .click()
  await dialog().getByRole("alert").waitFor()
  check(
    "Failed durable write retains exact outside raw and source canvas",
    (await raw()) === sourceRaw &&
      (await canvas().evaluate((c) => c.__teaIdentity)) === sourceToken,
  )
  await page.evaluate(() => (window.__teaFail = false))
  const stale = await context.newPage()
  await stale.goto(url)
  await stale
    .locator(
      '[data-world-scene-state="active"] canvas[data-world-render-state="ready"]',
    )
    .waitFor()
  phase = "enter-room"
  await dialog()
    .getByRole("button", { name: "Vào tiệm trà · thử lại", exact: true })
    .click()
  await dialog().waitFor({ state: "hidden" })
  await ready()
  check(
    "Explicit entry commits schema6 room once",
    (await save()).progress.interior.roomId === "aw2-room-village-tea" &&
      (await save()).revision === JSON.parse(sourceRaw).revision + 1,
  )
  const checkpoint = (await save()).progress,
    token = await canvas().evaluate((c) => c.__teaIdentity)
  const commit = await page.evaluate(() => window.__teaCommit)
  check(
    "Same real first-frame candidate canvas is promoted after durable write",
    commit.ready === "ready" &&
      commit.room === "aw2-room-village-tea" &&
      token === commit.token,
  )
  check(
    "Outside checkpoint exactly matches approached doorway",
    checkpoint.x === sourceActor.x &&
      checkpoint.y === sourceActor.y - 6 &&
      checkpoint.facing === "up",
  )
  check(
    "Three authored room props and one representative render",
    JSON.parse(await canvas().getAttribute("data-room-props")).length === 3 &&
      (await canvas().getAttribute("data-party-size")) === "1",
  )
  await capture("room-follow")
  phase = "stale-tab"
  await stale.getByRole("button", { name: "Thêm", exact: true }).click()
  await stale
    .getByTestId("game-panel")
    .getByRole("button", { name: "Lưu vị trí", exact: true })
    .click()
  await stale.getByRole("alert").waitFor()
  check(
    "Stale outside tab cannot overwrite the committed room",
    (await save()).progress.interior.roomId === "aw2-room-village-tea",
  )
  await stale.close()
  phase = "room-walk-save"
  await go(160, 224)
  check(
    "Room walking does not change durable save",
    (await save()).progress.interior.x === 64,
  )
  await menu()
  await panel().getByRole("button", { name: "Lưu vị trí", exact: true }).click()
  await close()
  const walkedRaw = await raw()
  check(
    "Explicit room save retains exact outside checkpoint",
    Math.abs((await save()).progress.interior.x - 160) < 1 &&
      (await save()).progress.x === checkpoint.x &&
      (await save()).progress.y === checkpoint.y,
  )
  await page.reload()
  await ready()
  await arrive(160, 224)
  check(
    "Reload restores room position without write",
    (await raw()) === walkedRaw && (await writes()) === 0,
  )
  phase = "room-services"
  await go(240, 160)
  await interact("Xem đội đồng hành")
  await panel().waitFor()
  let serviceRaw = await raw(),
    servicePos = await page.getByTestId("player-position").textContent()
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press(i < 6 ? "Tab" : "Shift+Tab")
    check(
      `Party focus stays modal${i + 1}`,
      await panel().evaluate((d) => d.contains(document.activeElement)),
    )
  }
  await page.keyboard.down("w")
  await page.waitForTimeout(180)
  await page.keyboard.up("w")
  check(
    "Service modal pauses world movement and read-only open does not save",
    (await raw()) === serviceRaw &&
      (await page.getByTestId("player-position").textContent()) === servicePos,
  )
  await close()
  check(
    "Service Escape returns map focus",
    await map().evaluate((m) => document.activeElement === m),
  )
  await interact("Xem đội đồng hành")
  await panel()
    .getByRole("combobox", { name: "Vị trí đội 1", exact: true })
    .selectOption("aw2-lua")
  await close()
  check(
    "Closing an uncommitted party draft keeps exact raw",
    (await raw()) === serviceRaw,
  )
  await interact("Xem đội đồng hành")
  await panel()
    .getByRole("combobox", { name: "Vị trí đội 1", exact: true })
    .selectOption("aw2-lua")
  await panel()
    .getByRole("button", { name: "Lưu đội hình", exact: true })
    .click()
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("aw2.development.save")).progress
        .partyIds[0] === "aw2-lua",
  )
  await close()
  await ready()
  check(
    "Committed owned leader changes room sprite and retains five party/outside checkpoint",
    JSON.parse(await canvas().getAttribute("data-party-ids"))[0] ===
      "aw2-lua" &&
      (await save()).progress.partyIds.length === 5 &&
      (await save()).progress.x === checkpoint.x,
  )
  serviceRaw = await raw()
  await go(432, 160)
  await interact("Xem công thức")
  await page.getByTestId("tea-recipe").waitFor()
  phase = "four-viewports"
  const activeDialog = () => page.locator("dialog[open]")
  const fit = async (label) => {
    const r = await activeDialog().evaluate((d) => {
      const b = d.getBoundingClientRect()
      const els = [...d.querySelectorAll("button:not(:disabled)")].filter(
        (e) => e.getClientRects().length,
      )
      return {
        w: innerWidth,
        h: innerHeight,
        doc: document.documentElement.scrollWidth,
        fit:
          d.scrollWidth <= d.clientWidth + 1 &&
          d.scrollHeight <= d.clientHeight + 1,
        b: { x: b.x, y: b.y, r: b.right, b: b.bottom },
        controls: els.map((e) => {
          const r = e.getBoundingClientRect()
          return {
            x: r.x,
            y: r.y,
            w: r.width,
            h: r.height,
            r: r.right,
            b: r.bottom,
          }
        }),
      }
    })
    check(
      `${label}: dialog and document fit`,
      r.doc <= r.w &&
        r.fit &&
        r.b.x >= -0.5 &&
        r.b.y >= -0.5 &&
        r.b.r <= r.w + 0.5 &&
        r.b.b <= r.h + 0.5,
    )
    check(
      `${label}: controls44px inside viewport`,
      r.controls.length > 0 &&
        r.controls.every(
          (b) =>
            b.w >= 43.9 &&
            b.h >= 43.9 &&
            b.x >= -0.5 &&
            b.y >= -0.5 &&
            b.r <= r.w + 0.5 &&
            b.b <= r.h + 0.5,
        ),
    )
  }
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [768, 1024],
    [1280, 900],
  ]) {
    await page.setViewportSize({ width, height })
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "20px"),
    )
    while (
      await panel()
        .getByRole("button", { name: "Công thức trước", exact: true })
        .isEnabled()
    )
      await panel()
        .getByRole("button", { name: "Công thức trước", exact: true })
        .click()
    for (let i = 0; i < 3; i++) {
      await fit(`${width}x${height}/20px recipe${i + 1}`)
      if (i < 2)
        await panel()
          .getByRole("button", { name: "Công thức sau", exact: true })
          .click()
    }
    if (width === 390) await capture("recipe-390")
  }
  check(
    "Recipe browsing has no save/economy mutation",
    (await raw()) === serviceRaw,
  )
  await close()
  await page.evaluate(() => (document.documentElement.style.fontSize = "16px"))
  await page.setViewportSize({ width: 1280, height: 900 })
  await interact("Xem nhật ký")
  await panel().waitFor()
  check(
    "Journal opens existing quest status inside tea room",
    (await panel().textContent()).includes("Nhiệm vụ"),
  )
  await close()
  phase = "mode-return"
  for (const name of ["Ghé TCG", "Ghé Auto Chess"]) {
    const p = JSON.stringify({
      ...(await save()).progress,
      interior: JSON.parse(
        await canvas().getAttribute("data-interior-position"),
      ),
    })
    await menu()
    await panel().getByRole("button", { name, exact: true }).click()
    await page
      .getByRole("button", { name: "Trở về hành trình", exact: true })
      .waitFor()
    check(
      `${name}: return label identifies tea room`,
      (await page.locator("body").textContent()).includes("Tiệm trà"),
    )
    const modeRaw = await raw()
    await click("Trở về hành trình")
    await ready()
    check(
      `${name}: exact room checkpoint returns without another write`,
      JSON.stringify((await save()).progress) === p &&
        (await raw()) === modeRaw,
    )
  }
  phase = "exact-exit"
  await go(48, 192)
  await interact("Ra hiên")
  await ready()
  check(
    "Exit restores exact original outside checkpoint and facing",
    (await save()).progress.interior === null &&
      (await save()).progress.x === checkpoint.x &&
      (await save()).progress.y === checkpoint.y &&
      (await save()).progress.facing === checkpoint.facing,
  )
  phase = "inside-lock-context-loss"
  await interact()
  const lockedRaw = await raw(),
    lockedToken = await canvas().evaluate(
      (c) => (c.__teaIdentity ??= crypto.randomUUID()),
    )
  const locker = await context.newPage()
  await locker.goto(url)
  await locker.evaluate(() => {
    window.__releaseTeaLock = null
    window.__teaLockHeld = false
    navigator.locks.request("aw2.development.save", async () => {
      window.__teaLockHeld = true
      await new Promise((r) => (window.__releaseTeaLock = r))
    })
  })
  await locker.waitForFunction(() => window.__teaLockHeld)
  await dialog()
    .getByRole("button", { name: "Vào tiệm trà", exact: true })
    .click()
  const candidate = page.locator(
    '[data-world-scene-state="preparing"] canvas[data-world-render-state="ready"]',
  )
  await candidate.waitFor({ state: "attached" })
  const lost = await candidate.evaluate((c) => {
    const gl = c.getContext("webgl2") || c.getContext("webgl")
    const ext = gl.getExtension("WEBGL_lose_context")
    if (!ext) return false
    ext.loseContext()
    return true
  })
  check("Real room WebGL context can be lost while write lock is held", lost)
  await page.waitForFunction(
    () =>
      document.querySelector('[data-world-scene-state="preparing"] canvas')
        ?.dataset.worldRenderState !== "ready",
  )
  await locker.evaluate(() => window.__releaseTeaLock())
  await dialog().getByRole("alert").waitFor()
  check(
    "Inside-lock guard rejects disposed room candidate with exact outside raw/canvas",
    (await raw()) === lockedRaw &&
      (await canvas().evaluate((c) => c.__teaIdentity)) === lockedToken,
  )
  await locker.close()
  await close()
  phase = "historical-v5"
  const historical = JSON.parse(
    await readFile("docs/aw2/evidence/AW2-016D-source-browser.json", "utf8"),
  ).finalRaw
  await page.evaluate(
    ({ key, historical }) => localStorage.setItem(key, historical),
    { key, historical },
  )
  await page.reload()
  await ready()
  check(
    "Authentic historical v5 opens with no implicit migration write",
    (await raw()) === historical &&
      (await writes()) === 0 &&
      JSON.parse(historical).schemaVersion === 5,
  )
  check(
    "Historical fixture is already in village",
    (await save()).progress.zoneId === "aw2-zone-covenant-village",
  )
  await go(300, 80)
  await interact("Vào tiệm trà")
  await ready()
  check(
    "Historical v5 enters schema6 preserving earned story and economy",
    (await save()).schemaVersion === 6 &&
      JSON.stringify((await save()).economy) ===
        JSON.stringify(JSON.parse(historical).economy) &&
      (await save()).saveId === JSON.parse(historical).saveId,
  )
  phase = "classic-entry"
  await page.goto(url.replace("game.html", "world.html"))
  await ready()
  await page
    .getByRole("button", {
      name: "Đi tới Góc nhật ký và công thức",
      exact: true,
    })
    .click()
  await arrive(432, 160)
  await interact("Xem công thức")
  await page.getByTestId("tea-recipe").waitFor()
  const classicRaw = await raw()
  await fit("Classic recipe1280")
  await close()
  check(
    "Classic service read preserves raw and returns focus",
    (await raw()) === classicRaw &&
      (await map().evaluate((m) => document.activeElement === m)),
  )
  await go(48, 192)
  await interact("Ra hiên")
  await ready()
  check(
    "Classic exit restores village",
    (await save()).progress.interior === null,
  )
  finalRaw = await raw()
  check(
    "Five legacy stable keys preserved",
    await page.evaluate(
      (v) => Object.entries(v).every(([k, s]) => localStorage.getItem(k) === s),
      legacy,
    ),
  )
  check("No unexpected browser errors", errors.length === 0)
  phase = "complete"
} catch (cause) {
  errors.push(`${phase}: ${cause.stack || cause}`)
  if (page)
    try {
      await page.screenshot({ path: `${out}/${flavor}-failure.png` })
    } catch {}
  throw cause
} finally {
  if (page && !finalRaw)
    try {
      finalRaw = await page.evaluate(() =>
        localStorage.getItem("aw2.development.save"),
      )
    } catch {}
  await mkdir(out, { recursive: true })
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-016F",
        flavor,
        status: phase === "complete" ? "PASS" : "FAIL",
        phase,
        checks,
        checkCount: checks.length,
        errors,
        expectedErrors,
        captures,
        finalRaw,
        limits:
          "Developer Chromium source/compiled, synthetic failure probes and authentic historical v5. No independent human/physical phone/FPS/total GPU memory/full mode-match/rights/release acceptance.",
      },
      null,
      2,
    ) + "\n",
  )
  await browser?.close()
  if (values.compiled)
    await new Promise((resolve) => server.httpServer.close(resolve))
  else await server.close()
}
