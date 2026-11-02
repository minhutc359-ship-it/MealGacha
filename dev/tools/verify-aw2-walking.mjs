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
  port = values.compiled ? 8741 : 8740,
  out = ".asset-work/aw2-016h",
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
    window.__walkWrites = 0
    window.__walkFail = false
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (k, v) {
      if (k === "aw2.development.save") {
        window.__walkWrites++
        const candidate = document.querySelector(
          '[data-world-scene-state="preparing"] canvas',
        )
        window.__walkCommit = candidate
          ? {
              token: (candidate.__walkIdentity ??= crypto.randomUUID()),
              ready: candidate.dataset.worldRenderState,
              room: candidate.dataset.roomId ?? null,
            }
          : null
        if (window.__walkFail)
          throw new DOMException(
            "016H simulated storage failure",
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
    writes = () => page.evaluate(() => window.__walkWrites),
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
  const status = () => page.getByTestId("walking-status"),
    marker = () => map().getByTestId("walking-marker")
  const actor = () => canvas().getAttribute("data-party-positions")
  const begin = async (x, y) => {
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
    await status().waitFor()
  }
  const still = async (label) => {
    await page.waitForTimeout(70)
    const position = await actor()
    await page.waitForTimeout(160)
    check(
      `${label}: no residual movement or marker`,
      (await actor()) === position &&
        (await status().count()) === 0 &&
        (await marker().count()) === 0,
    )
  }
  const stopWalk = async (label) => {
    await page
      .getByRole("button", { name: "Dừng đường đi", exact: true })
      .click()
    await status().waitFor({ state: "hidden" })
    await still(label)
    check(
      `${label}: map focus restored`,
      await map().evaluate((m) => document.activeElement === m),
    )
  }
  const markerAlignment = async (label) => {
    await marker().waitFor()
    const result = await marker().evaluate((m) => {
      const parent = m.closest(".aw2-world-map"),
        c = parent.querySelector("canvas"),
        v = JSON.parse(c.dataset.worldCamera),
        r = c.getBoundingClientRect(),
        stage = parent.closest(".aw2-game-map"),
        s = stage?.getBoundingClientRect() ?? r,
        b = (stage ?? parent)
          .querySelector(".aw2-walk-status")
          ?.getBoundingClientRect(),
        mb = m.getBoundingClientRect()
      const left = Math.max(r.left, s.left, 0) + 18,
        right = Math.min(r.right, s.right, innerWidth) - 18,
        top = Math.max(r.top, s.top, b?.bottom ?? s.top, 0) + 18,
        bottom = Math.min(r.bottom, s.bottom, innerHeight) - 18
      const x =
          r.left +
          (((+m.dataset.targetX - v.x) * v.zoom + v.width / 2) / v.width) *
            r.width,
        y =
          r.top +
          (((+m.dataset.targetY - v.y) * v.zoom + v.height / 2) / v.height) *
            r.height
      return {
        error: Math.hypot(
          mb.x + mb.width / 2 - Math.max(left, Math.min(right, x)),
          mb.y + mb.height / 2 - Math.max(top, Math.min(bottom, y)),
        ),
        offscreen: m.dataset.offscreen === "true",
        expectedOffscreen: x < left || x > right || y < top || y > bottom,
        aria: m.getAttribute("aria-hidden"),
      }
    })
    check(
      `${label}: marker follows actual camera/crop ${JSON.stringify(result)}`,
      result.error < 2 &&
        result.offscreen === result.expectedOffscreen &&
        result.aria === "true",
    )
    const labelsFit = await map().evaluate((parent) => {
      const canvas = parent.querySelector("canvas").getBoundingClientRect(),
        stage = parent.closest(".aw2-game-map"),
        clip = stage?.getBoundingClientRect() ?? canvas,
        toolbar = stage
          ?.querySelector(".aw2-map-toolbar")
          ?.getBoundingClientRect(),
        bar = (stage ?? parent)
          .querySelector(".aw2-walk-status")
          ?.getBoundingClientRect()
      const bounds = {
        left: Math.max(canvas.left, clip.left, 0),
        right: Math.min(canvas.right, clip.right, innerWidth),
        top: Math.max(
          canvas.top,
          clip.top,
          toolbar?.bottom ?? canvas.top,
          bar?.bottom ?? canvas.top,
          0,
        ),
        bottom: Math.min(canvas.bottom, clip.bottom, innerHeight),
      }
      return [...parent.querySelectorAll("[data-world-label]")]
        .filter((node) => getComputedStyle(node).visibility === "visible")
        .every((node) => {
          const b = node.getBoundingClientRect()
          return (
            b.left >= bounds.left - 0.5 &&
            b.right <= bounds.right + 0.5 &&
            b.top >= bounds.top - 0.5 &&
            b.bottom <= bounds.bottom + 0.5
          )
        })
    })
    check(
      `${label}: visible labels remain whole inside the active crop`,
      labelsFit,
    )
    return result
  }
  const walkLayout = async (label) => {
    const result = await status().evaluate((s) => {
      const r = s.getBoundingClientRect(),
        b = s.querySelector("button").getBoundingClientRect()
      return {
        w: innerWidth,
        h: innerHeight,
        doc: [
          document.documentElement.scrollWidth,
          document.documentElement.scrollHeight,
        ],
        r: { x: r.x, y: r.y, right: r.right, bottom: r.bottom },
        b: {
          x: b.x,
          y: b.y,
          right: b.right,
          bottom: b.bottom,
          w: b.width,
          h: b.height,
        },
      }
    })
    check(
      `${label}: fixed viewport and destination status fit`,
      result.doc[0] <= result.w &&
        result.doc[1] <= result.h &&
        result.r.x >= -0.5 &&
        result.r.y >= -0.5 &&
        result.r.right <= result.w + 0.5 &&
        result.r.bottom <= result.h + 0.5,
    )
    check(
      `${label}: Stop control44px and visible`,
      result.b.w >= 43.9 &&
        result.b.h >= 43.9 &&
        result.b.x >= -0.5 &&
        result.b.y >= -0.5 &&
        result.b.right <= result.w + 0.5 &&
        result.b.bottom <= result.h + 0.5,
    )
  }
  const places = async (id) => {
    if (page.url().endsWith("world.html")) await click("Địa điểm trong vùng")
    else {
      await menu()
      await panel()
        .getByRole("button", { name: "Địa điểm", exact: true })
        .click()
    }
    for (let i = 0; i < 20; i++) {
      if (
        (await page
          .getByTestId("place-guidance")
          .getAttribute("data-place-id")) === id
      )
        return
      const next = panel().getByRole("button", {
        name: "Địa điểm sau",
        exact: true,
      })
      if (await next.isEnabled()) await next.click()
      else {
        const previous = panel().getByRole("button", {
          name: "Địa điểm trước",
          exact: true,
        })
        while (await previous.isEnabled()) await previous.click()
      }
    }
    throw Error(`Missing place ${id}`)
  }
  const placeWalk = async (id) => {
    await places(id)
    const before = await raw(),
      button = panel().getByRole("button", {
        name: "Đi tới địa điểm",
        exact: true,
      }),
      point = {
        x: +(await button.getAttribute("data-approach-x")),
        y: +(await button.getAttribute("data-approach-y")),
      }
    await button.click()
    await panel().waitFor({ state: "hidden" })
    await status().waitFor()
    check(
      `${id}: semantic destination named`,
      (await marker().getAttribute("data-entity-id")) === id,
    )
    await arrive(point.x, point.y)
    await status().waitFor({ state: "hidden" })
    check(
      `${id}: arrival never interacts or saves`,
      (await raw()) === before &&
        (await dialog().count()) === 0 &&
        (await marker().count()) === 0,
    )
  }
  const inspect = async (id, action) => {
    await places(id)
    await panel()
      .getByRole("button", { name: "Xem tương tác", exact: true })
      .click()
    await dialog().waitFor()
    if (action) {
      await dialog().getByRole("button", { name: action, exact: true }).click()
      await dialog().waitFor({ state: "hidden" })
    }
  }
  phase = "floor-stop-retarget"
  await page.goto(url)
  await click("Tạo bản lưu AW2")
  await ready()
  await page.evaluate(
    (v) => Object.entries(v).forEach(([k, s]) => localStorage.setItem(k, s)),
    legacy,
  )
  const original = await raw(),
    token = await canvas().evaluate(
      (c) => (c.__walkIdentity ??= crypto.randomUUID()),
    )
  await begin(616, 192)
  await markerAlignment("Village overview")
  check(
    "Floor tap has a neutral destination and no write",
    (await status().textContent()).includes("Điểm đã chọn") &&
      (await raw()) === original,
  )
  await tapWorldPoint(page, 520, 240)
  await page.waitForFunction(
    () =>
      Math.abs(
        +(
          document.querySelector('[data-testid="walking-marker"]')?.dataset
            .targetX ?? NaN
        ) - 520,
      ) < 0.1,
  )
  check(
    "Retarget replaces the earlier destination on the same canvas",
    (await canvas().evaluate((c) => c.__walkIdentity)) === token &&
      (await raw()) === original,
  )
  await stopWalk("Pointer Stop")
  check("Stop preserves exact save bytes", (await raw()) === original)
  await begin(616, 192)
  await page.getByRole("button", { name: "Dừng đường đi", exact: true }).focus()
  check(
    "Keyboard focus on Stop retains the route until explicit activation",
    (await status().count()) === 1,
  )
  await page.keyboard.press("Enter")
  await still("Keyboard Stop activation")
  await begin(616, 192)
  await tapWorldPoint(page, 320, 320)
  await status().waitFor({ state: "hidden" })
  await still("Blocked wall selection")
  check(
    "Invalid replacement target does not continue old route",
    (await raw()) === original,
  )
  await begin(616, 192)
  await map().focus()
  await page.keyboard.press("Escape")
  await still("Exploration Escape")
  await begin(616, 192)
  await map().focus()
  await page.keyboard.down("a")
  await page.waitForTimeout(80)
  await page.keyboard.up("a")
  await still("Manual keyboard override")
  await begin(616, 192)
  await page.getByRole("button", { name: "Đi Xuống", exact: true }).click()
  await still("Manual Dpad override")
  phase = "menu-and-focus-cancel"
  await begin(616, 192)
  await dock("Đội").click()
  await panel().waitFor()
  await close()
  await still("Menu close never resumes route")
  await begin(616, 192)
  await page.evaluate(() => window.dispatchEvent(new Event("blur")))
  await still("Simulated window blur")
  await page.evaluate(() => window.dispatchEvent(new Event("focus")))
  await still("Window focus does not resume route")
  await begin(616, 192)
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  )
  await still("Simulated visibility notification")
  phase = "camera-layout"
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
    const p = JSON.parse(await actor())[0],
      x = p.x > 320 ? 32 : 616
    await begin(x, 192)
    await walkLayout(`${width}x${height}/20px overview`)
    await markerAlignment(`${width} overview`)
    await click("Bám nhân vật")
    await page.waitForFunction(
      () =>
        JSON.parse(
          document.querySelector('[data-world-scene-state="active"] canvas')
            .dataset.worldCamera,
        ).mode === "follow",
    )
    await status().waitFor()
    await walkLayout(`${width}/20px follow`)
    const projected = await markerAlignment(`${width} follow`)
    if (width === 390)
      check(`${width}: offscreen edge arrow shown`, projected.offscreen)
    if (width === 390) await capture("walking-edge-390")
    await stopWalk(`${width} camera toggle/Stop`)
  }
  check(
    "Start/stop/camera/resize keep one original canvas and exact save",
    (await canvas().evaluate((c) => c.__walkIdentity)) === token &&
      (await raw()) === original,
  )
  await page.evaluate(() => (document.documentElement.style.fontSize = "16px"))
  await page.setViewportSize({ width: 1280, height: 900 })
  phase = "fresh-semantic-intro"
  await placeWalk("aw2-npc-giu-cho")
  await inspect("aw2-npc-giu-cho", "Nhận nhiệm vụ")
  await placeWalk("aw2-object-village-table")
  await inspect("aw2-object-village-table", "Đọc mảnh khăn")
  await placeWalk("aw2-npc-giu-cho")
  await inspect("aw2-npc-giu-cho", "Hoàn tất nhập môn")
  await ready()
  check(
    "Explicit fresh intro still grants exactly five/30XP/one receipt",
    (await save()).progress.partyIds.length === 5 &&
      (await save()).economy.teamExperience === 30 &&
      (await save()).economy.receipts.length === 1,
  )
  phase = "save-and-mode-cancel"
  await begin(616, 192)
  await menu()
  const atSave = JSON.parse(await actor())[0],
    prior = (await save()).revision
  await panel().getByRole("button", { name: "Lưu vị trí", exact: true }).click()
  await page.waitForFunction(
    (previous) =>
      JSON.parse(localStorage.getItem("aw2.development.save")).revision ===
      previous + 1,
    prior,
  )
  await close()
  const savedWalk = await save()
  check(
    "Explicit save stores current actor only, never destination intent",
    Math.abs(savedWalk.progress.x - atSave.x) < 0.01 &&
      Math.abs(savedWalk.progress.y - (atSave.y - 6)) < 0.01 &&
      !("walkingTarget" in savedWalk.progress) &&
      !("destination" in savedWalk.progress),
  )
  for (const mode of ["Ghé TCG", "Ghé Auto Chess"]) {
    await begin(616, 192)
    await menu()
    await panel().getByRole("button", { name: mode, exact: true }).click()
    await page
      .getByRole("button", { name: "Trở về hành trình", exact: true })
      .waitFor()
    const modeRaw = await raw()
    await click("Trở về hành trình")
    await ready()
    await still(`${mode} return`)
    check(`${mode}: checkpoint unchanged on return`, (await raw()) === modeRaw)
  }
  await begin(616, 192)
  await menu()
  await panel().getByRole("button", { name: "Đọc lại", exact: true }).click()
  await ready()
  await still("Reread/recreated scene")
  phase = "tea-room-walk"
  await placeWalk("aw2-object-village-tea-door")
  await inspect("aw2-object-village-tea-door", "Vào tiệm trà")
  await ready()
  const roomRaw = await raw(),
    outsideCheckpoint = {
      x: (await save()).progress.x,
      y: (await save()).progress.y,
      facing: (await save()).progress.facing,
    }
  const roomToken = await canvas().evaluate(
    (c) => (c.__walkIdentity ??= crypto.randomUUID()),
  )
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
    await go(64, 192)
    await places("aw2-object-tea-journal-desk")
    const button = panel().getByRole("button", {
      name: "Đi tới địa điểm",
      exact: true,
    })
    if (await button.count()) {
      await button.click()
      await status().waitFor()
      await walkLayout(`${width}/20px named room target`)
      await markerAlignment(`${width} room`)
      check(
        `${width}: room destination uses room scene and actual desk name`,
        (await marker().getAttribute("data-scene-id")) ===
          "aw2-room-village-tea" &&
          (await status().textContent()).includes("Góc nhật ký"),
      )
      if (width === 390) await capture("room-destination-390")
      await stopWalk(`${width} room Stop`)
    } else {
      await close()
      await go(64, 192)
    }
  }
  check(
    "Room walking/stopping retains canvas, exact save and outside checkpoint",
    (await raw()) === roomRaw &&
      (await canvas().evaluate((c) => c.__walkIdentity)) === roomToken,
  )
  await page.evaluate(() => (document.documentElement.style.fontSize = "16px"))
  await page.setViewportSize({ width: 1280, height: 900 })
  await go(48, 192)
  await inspect("aw2-object-tea-exit", "Ra hiên")
  await ready()
  check(
    "Explicit room exit retains exact outside checkpoint",
    (await save()).progress.interior === null &&
      (await save()).progress.x === outsideCheckpoint.x &&
      (await save()).progress.y === outsideCheckpoint.y &&
      (await save()).progress.facing === outsideCheckpoint.facing,
  )
  phase = "active-renderer-loss"
  await begin(616, 192)
  const beforeLoss = await raw()
  const lost = await canvas().evaluate((c) => {
    const gl = c.getContext("webgl2") || c.getContext("webgl"),
      ext = gl.getExtension("WEBGL_lose_context")
    if (!ext) return false
    ext.loseContext()
    return true
  })
  check("Real active WebGL loss is available", lost)
  await page.locator('.aw2-map-loading[role="alert"]').waitFor()
  await status().waitFor({ state: "hidden" })
  check(
    "Readiness loss cancels intent without a save",
    (await marker().count()) === 0 && (await raw()) === beforeLoss,
  )
  await menu()
  await panel().getByRole("button", { name: "Đọc lại", exact: true }).click()
  await ready()
  await still("Renderer recovery")
  phase = "stale-tab"
  const second = await context.newPage()
  await second.goto(url)
  await second
    .locator(
      '[data-world-scene-state="active"] canvas[data-world-render-state="ready"]',
    )
    .waitFor()
  await page.bringToFront()
  await begin(616, 192)
  await second.getByRole("button", { name: "Thêm", exact: true }).click()
  await second
    .getByTestId("game-panel")
    .getByRole("button", { name: "Lưu vị trí", exact: true })
    .click()
  await page.getByRole("alert").waitFor()
  await status().waitFor({ state: "hidden" })
  const staleRaw = await raw()
  await tapWorldPoint(page, 520, 240)
  await still("Other-tab save blocks stale walk")
  check(
    "Stale tab cannot overwrite the newer checkpoint",
    (await raw()) === staleRaw,
  )
  await page.bringToFront()
  await menu()
  await panel().getByRole("button", { name: "Đọc lại", exact: true }).click()
  await ready()
  await second.close()
  await still("Stale reread")
  phase = "all-renderer-families"
  const completed = JSON.parse(
    await readFile("docs/aw2/evidence/AW2-016F-story-source.json", "utf8"),
  ).observedRaw
  await page.evaluate(
    ({ key, completed }) => localStorage.setItem(key, completed),
    { key, completed },
  )
  await page.reload()
  await ready()
  check(
    "Authentic completed6 opens unchanged and has no walking intent",
    (await raw()) === completed &&
      (await writes()) === 0 &&
      (await status().count()) === 0,
  )
  for (const name of [
    "Phố Đèn Lồng",
    "Sân Bếp Bỏ Quên",
    "Phòng Kho",
    "Phòng Lửa",
    "Phòng Bàn",
  ]) {
    await travel(616, name)
    const regionRaw = await raw(),
      id = await canvas().evaluate(
        (c) => (c.__walkIdentity ??= crypto.randomUUID()),
      )
    await begin(520, 240)
    await markerAlignment(name)
    await stopWalk(`${name} Stop`)
    check(
      `${name}: stable renderer/no writes/one representative`,
      (await canvas().evaluate((c) => c.__walkIdentity)) === id &&
        (await raw()) === regionRaw &&
        (await canvas().getAttribute("data-party-size")) === "1",
    )
  }
  check(
    "Six-zone travel retains real ending300XP/five party",
    (await save()).progress.questIndex === 4 &&
      (await save()).economy.teamExperience === 300 &&
      (await save()).progress.partyIds.length === 5,
  )
  phase = "patrol-current-target"
  const street = JSON.parse(
    await readFile("docs/aw2/evidence/AW2-016G-source-browser.json", "utf8"),
  ).finalRaw
  // The016Gprofile ends in village, so reach street through its real portal before choosing the moving NPC.
  await page.evaluate(({ key, street }) => localStorage.setItem(key, street), {
    key,
    street,
  })
  await page.reload()
  await ready()
  await travel(616, "Phố Đèn Lồng")
  await places("aw2-npc-dem-nuoc")
  const beforeNpc = await raw()
  await panel()
    .getByRole("button", { name: "Đi tới địa điểm", exact: true })
    .click()
  await status().waitFor()
  check(
    "Moving NPC destination resolves its actual pinned snapshot",
    (await marker().getAttribute("data-entity-id")) === "aw2-npc-dem-nuoc" &&
      (await status().textContent()).includes("Em Đem Nước"),
  )
  await stopWalk("NPC approach canceled")
  check("NPC approach does not grant or save", (await raw()) === beforeNpc)
  phase = "historical5-and-classic"
  const historical = JSON.parse(
    await readFile("docs/aw2/evidence/AW2-016D-source-browser.json", "utf8"),
  ).finalRaw
  await page.evaluate(
    ({ key, historical }) => localStorage.setItem(key, historical),
    { key, historical },
  )
  await page.reload()
  await ready()
  await begin(32, 192)
  await stopWalk("Historical5 stop")
  check(
    "Historical5 walk and stop keep exact bytes without migration",
    (await raw()) === historical && (await writes()) === 0,
  )
  await page.goto(url.replace("game.html", "world.html"))
  await ready()
  await map().scrollIntoViewIfNeeded()
  await begin(32, 192)
  await markerAlignment("Classic village")
  const classicRaw = await raw(),
    classicToken = await canvas().evaluate(
      (c) => (c.__walkIdentity ??= crypto.randomUUID()),
    )
  await stopWalk("Classic pointer Stop/no clickthrough")
  check(
    "Classic Stop retains exact source canvas/raw",
    (await raw()) === classicRaw &&
      (await canvas().evaluate((c) => c.__walkIdentity)) === classicToken,
  )
  await placeWalk("aw2-object-village-tea-door")
  await inspect("aw2-object-village-tea-door", "Vào tiệm trà")
  await ready()
  await map().scrollIntoViewIfNeeded()
  await begin(432, 160)
  await markerAlignment("Classic room")
  await stopWalk("Classic room Stop")
  await go(48, 192)
  await inspect("aw2-object-tea-exit", "Ra hiên")
  await ready()
  finalRaw = await raw()
  check(
    "Legacy stable save sentinels preserved",
    await page.evaluate(
      (v) => Object.entries(v).every(([k, s]) => localStorage.getItem(k) === s),
      legacy,
    ),
  )
  check("No unexpected browser/resource/lifecycle errors", errors.length === 0)
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
        task: "AW2-016H",
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
          "Developer Chromium source/compiled; ephemeral walking intent, actual first-frame cameras and real intro, authentic historical5/completed6, no fabricated progression. Full battle/mode engine acceptance reused from016F; No independent human/physical phone/FPS/total GPU memory/full mode-match/rights/release acceptance.",
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
