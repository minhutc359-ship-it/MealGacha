import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
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
  port = values.compiled ? 8771 : 8770,
  out = ".asset-work/aw2-016k",
  key = "aw2.development.save"
const checks = [],
  errors = [],
  captures = [],
  url = `http://127.0.0.1:${port}/dev/aw2/game.html`
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
let browser,
  page,
  phase = "bootstrap",
  finalRaw = "",
  tcgResult = "",
  chessResult = ""
const check = (name, ok = true) => {
  assert.ok(ok, name)
  checks.push(name)
  console.log(name)
}
try {
  if (!values.compiled) await server.listen()
  await mkdir(out, { recursive: true })
  const { chromium } = await import(values.playwright)
  browser = await chromium.launch({
    executablePath: values.chromium,
    headless: true,
    env: {
      ...process.env,
      LD_LIBRARY_PATH: values.chromium?.slice(
        0,
        values.chromium.lastIndexOf("/"),
      ),
    },
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    reducedMotion: "reduce",
  })
  await context.addInitScript(() => {
    window.__roomFail = false
    window.__roomWrites = 0
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (k, v) {
      if (k === "aw2.development.save") {
        window.__roomWrites++
        if (window.__roomFail) throw Error("016K simulated quota failure")
      }
      return set.call(this, k, v)
    }
  })
  page = await context.newPage()
  page.setDefaultTimeout(45000)
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => {
    if (
      m.type() === "error" ||
      (m.type() === "warning" &&
        /destroyed instead of unloaded|already has key/.test(m.text()))
    )
      errors.push(m.text())
  })
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
  })
  const raw = () => page.evaluate((k) => localStorage.getItem(k), key),
    save = async () => JSON.parse(await raw()),
    click = (name) => page.getByRole("button", { name, exact: true }).click()
  const map = () =>
      page
        .locator('[data-world-scene-state="active"]')
        .getByTestId("world-map"),
    canvas = () => map().locator("canvas"),
    panel = () => page.getByTestId("game-panel"),
    dialog = () => page.locator("dialog[open]:not(.aw2-game-panel)"),
    practice = () => page.getByTestId("room-practice")
  const ready = async () => {
    await canvas().waitFor()
    await map().locator(".aw2-map-loading").waitFor({ state: "hidden" })
    await page.waitForFunction(
      () =>
        document.querySelector('[data-world-scene-state="active"] canvas')
          ?.dataset.worldRenderState === "ready",
    )
  }
  const close = async () => {
    await page.keyboard.press("Escape")
    await page.locator("dialog[open]").waitFor({ state: "hidden" })
  }
  const places = async (id) => {
    if (page.url().endsWith("world.html")) await click("Địa điểm trong vùng")
    else {
      await page
        .getByRole("navigation", { name: "Menu game", exact: true })
        .getByRole("button", { name: "Thêm", exact: true })
        .click()
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
        const prev = panel().getByRole("button", {
          name: "Địa điểm trước",
          exact: true,
        })
        while (await prev.isEnabled()) await prev.click()
      }
    }
    throw Error(`No place ${id}`)
  }
  const walk = async (id) => {
    await places(id)
    const before = await raw(),
      b = panel().getByRole("button", { name: "Đi tới địa điểm", exact: true })
    if (await b.count()) {
      const p = {
        x: +(await b.getAttribute("data-approach-x")),
        y: +(await b.getAttribute("data-approach-y")),
      }
      await b.click()
      await panel().waitFor({ state: "hidden" })
      await page.waitForFunction(({ x, y }) => {
        const m = document
          .querySelector('[data-testid="player-position"]')
          ?.textContent.match(/Vị trí (\d+), (\d+)/)
        return m && Math.abs(+m[1] - x) <= 1 && Math.abs(+m[2] - y) <= 1
      }, p)
      await page.getByTestId("walking-status").waitFor({ state: "hidden" })
    } else await close()
    check(
      `${id}: walking never interacts/saves`,
      (await raw()) === before && (await dialog().count()) === 0,
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
  const openPractice = async () => {
    await inspect("aw2-object-tea-journal-desk", "Xem bàn luyện tập")
    await practice().waitFor()
    check(
      "Exactly one blocking selector, no leftover dialogue",
      (await page.locator("dialog[open]").count()) === 1,
    )
  }
  const scene = (value) =>
    page
      .getByRole("combobox", { name: "Nội dung màn chơi", exact: true })
      .selectOption(value)
  const layout = async (name, classic = false) => {
    const r = await page.evaluate(() => {
      const s =
          document.querySelector("dialog[open]") ??
          document.querySelector(".aw2-activity") ??
          document.querySelector(".aw2-game-shell"),
        visible = (n) =>
          n.getClientRects().length &&
          getComputedStyle(n).visibility !== "hidden",
        controls = [...s.querySelectorAll("button,select")]
          .filter(visible)
          .map((n) => {
            const b = n.getBoundingClientRect()
            return {
              x: b.x,
              y: b.y,
              r: b.right,
              b: b.bottom,
              w: b.width,
              h: b.height,
              text: n.textContent,
            }
          }),
        overflow = [
          ...s.querySelectorAll(
            ".aw2-panel-content,.aw2-panel-stack,.aw2-activity-body,.aw2-activity-card,.aw2-activity-stack,.aw2-paged-copy",
          ),
        ]
          .filter(visible)
          .filter(
            (n) =>
              n.scrollWidth > n.clientWidth + 1 ||
              n.scrollHeight > n.clientHeight + 1,
          )
          .map((n) => n.className)
      return {
        w: innerWidth,
        h: innerHeight,
        dw: document.documentElement.scrollWidth,
        dh: document.documentElement.scrollHeight,
        controls,
        overflow,
      }
    })
    check(
      `${name}: no clipping/native44px ${JSON.stringify(r.overflow)}`,
      !r.overflow.length &&
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
    if (!classic) check(`${name}: fixed document`, r.dw <= r.w && r.dh <= r.h)
  }
  const capture = async (name) => {
    const p = `${out}/${flavor}-${name}.png`
    await page.screenshot({ path: p })
    captures.push(p)
  }
  phase = "fresh-intro-room"
  await page.goto(url)
  await click("Tạo bản lưu AW2")
  await ready()
  await page.evaluate(() =>
    localStorage.setItem("foodchest.tcg.v1", "016K-legacy"),
  )
  for (const [id, action] of [
    ["aw2-npc-giu-cho", "Nhận nhiệm vụ"],
    ["aw2-object-village-table", "Đọc mảnh khăn"],
    ["aw2-npc-giu-cho", "Hoàn tất nhập môn"],
  ]) {
    await walk(id)
    await inspect(id, action)
  }
  check(
    "Fresh intro still gives five/30XP",
    (await save()).progress.partyIds.length === 5 &&
      (await save()).economy.teamExperience === 30,
  )
  await walk("aw2-object-village-tea-door")
  await inspect("aw2-object-village-tea-door", "Vào tiệm trà")
  await ready()
  const outside = (({ x, y, facing }) => ({ x, y, facing }))(
    (await save()).progress,
  )
  await walk("aw2-object-tea-journal-desk")
  const beforeView = await raw(),
    position = await canvas().getAttribute("data-party-positions"),
    token = await canvas().evaluate(
      (c) => (c.__roomIdentity ??= crypto.randomUUID()),
    )
  phase = "menu-matrix"
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [844, 390],
    [1280, 720],
  ]) {
    await page.setViewportSize({ width, height })
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "20px"),
    )
    await inspect("aw2-object-tea-journal-desk")
    await layout(`desk/${width}`)
    await dialog()
      .getByRole("button", { name: "Xem bàn luyện tập", exact: true })
      .click()
    await practice().waitFor()
    for (const name of ["TCG", "Auto Chess"]) {
      await practice().getByRole("button", { name, exact: true }).click()
      await layout(`${name}/${width}`)
      check(
        `${name}/${width}: panel focus`,
        await panel().evaluate((d) => d.contains(document.activeElement)),
      )
    }
    await page.keyboard.press("Tab")
    await page.keyboard.press("Shift+Tab")
    check(
      `${width}: trapped focus`,
      await panel().evaluate((d) => d.contains(document.activeElement)),
    )
    if (width === 390) await capture("room-selector-390")
    await close()
    check(
      `${width}: Escape/map/no writes`,
      (await map().evaluate((m) => m === document.activeElement)) &&
        (await raw()) === beforeView,
    )
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => (document.documentElement.style.fontSize = "16px"))
  check(
    "Reading/tab/resize preserves actor/canvas",
    (await canvas().getAttribute("data-party-positions")) === position &&
      (await canvas().evaluate((c) => c.__roomIdentity)) === token,
  )
  phase = "quota-and-tcg"
  await openPractice()
  await page.evaluate(() => (window.__roomFail = true))
  await practice()
    .getByRole("button", { name: "Ghé bàn TCG", exact: true })
    .click()
  await practice()
    .filter({ hasText: /Chưa lưu được AW2/ })
    .waitFor()
  await practice()
    .getByRole("button", { name: "Ghé bàn TCG", exact: true })
    .waitFor()
  check(
    "Failed service keeps selector/exactraw/one room canvas and retry focus",
    (await raw()) === beforeView &&
      (await canvas().evaluate((c) => c.__roomIdentity)) === token &&
      (await panel().evaluate((d) => d.contains(document.activeElement))),
  )
  check(
    "Explicit retry remains enabled",
    await practice()
      .getByRole("button", { name: "Ghé bàn TCG", exact: true })
      .isEnabled(),
  )
  await layout("failed-service")
  await page.evaluate(() => (window.__roomFail = false))
  await practice()
    .getByRole("button", { name: "Ghé bàn TCG", exact: true })
    .evaluate((b) => {
      b.click()
      b.click()
    })
  await page.getByTestId("mode-lobby").waitFor()
  const tcgCheckpoint = await raw(),
    tcgSave = await save()
  check(
    "Duplicate click checkpoints once through room-service",
    tcgSave.revision === JSON.parse(beforeView).revision + 1 &&
      (await page.getByTestId("mode-lobby").getAttribute("data-entry")) ===
        "room-service",
  )
  check(
    "Checkpoint retains room desk/outside/XP/party",
    tcgSave.progress.interior.x === 432 &&
      tcgSave.progress.interior.y === 160 &&
      tcgSave.progress.x === outside.x &&
      tcgSave.progress.y === outside.y &&
      tcgSave.economy.teamExperience === 30 &&
      tcgSave.progress.partyIds.length === 5,
  )
  await scene("welcome")
  await click("Chơi TCG thử")
  let attacked = false
  for (let attempt = 0; attempt < 12 && !attacked; attempt++) {
    await scene("player")
    const attack = page.getByRole("button", { name: /^Tấn công bằng/ })
    if ((await attack.count()) && (await attack.isEnabled())) {
      await attack.click()
      for (let i = 0; i < 4; i++) {
        const hit = page.getByRole("button", { name: /^Nhắm / })
        if (await hit.count()) {
          await hit.click()
          attacked = true
          break
        }
        const next = page.getByRole("button", {
          name: "Mục tiêu sau",
          exact: true,
        })
        if (await next.isEnabled()) await next.click()
        else break
      }
    }
    if (!attacked) {
      await scene("turn")
      await click("Chơi nước gợi ý")
    }
  }
  check("Room TCG resolves a real manually chosen target", attacked)
  for (
    let i = 0;
    i < 200 &&
    (await page.getByTestId("tcg-practice").getAttribute("data-status")) ===
      "active";
    i++
  ) {
    await scene("turn")
    await click("Chơi nước gợi ý")
  }
  tcgResult = await page.getByTestId("tcg-practice").getAttribute("data-status")
  check("Room TCG reaches terminal via legal moves", tcgResult !== "active")
  check("TCG does not mutate world checkpoint", (await raw()) === tcgCheckpoint)
  await click("Trở về hành trình")
  await ready()
  check(
    "TCG returns exact room checkpoint without write",
    (await raw()) === tcgCheckpoint &&
      (await save()).progress.interior.roomId === "aw2-room-village-tea",
  )
  phase = "chess"
  await openPractice()
  await practice()
    .getByRole("button", { name: "Auto Chess", exact: true })
    .click()
  await practice()
    .getByRole("button", { name: "Ghé bàn Auto Chess", exact: true })
    .click()
  await page.getByTestId("mode-lobby").waitFor()
  const chessCheckpoint = await raw()
  await scene("welcome")
  await click("Chơi Auto Chess thử")
  await scene("shop")
  for (let i = 0; i < 3; i++) {
    const buy = page.getByRole("button", { name: /^Mua / })
    if ((await buy.count()) && (await buy.isEnabled())) await buy.click()
    const next = page.getByRole("button", { name: "Quầy sau", exact: true })
    if (await next.isEnabled()) await next.click()
  }
  await scene("actions")
  await click("Xếp đội gợi ý")
  await scene("formation")
  await layout("room-chess-formation")
  await capture("room-chess-formation")
  await click("Bắt đầu giao tranh")
  await scene("actions")
  for (
    let i = 0;
    i < 85 &&
    (await page.getByTestId("chess-practice").getAttribute("data-phase")) ===
      "battle";
    i++
  )
    await click("Tiến một nhịp")
  chessResult = await page
    .getByTestId("chess-practice")
    .getAttribute("data-phase")
  check(
    "Room Chess completes real placement/combat",
    ["round-result", "finished"].includes(chessResult),
  )
  if (chessResult === "round-result") {
    await click("Vòng tiếp · nhận 6 vàng")
    check(
      "Room Chess advances to round2",
      (await page.getByTestId("chess-practice").getAttribute("data-round")) ===
        "2",
    )
  }
  await scene("actions")
  await click("Nhận thua ván cờ")
  check(
    "Chess leaves world resources unchanged",
    (await raw()) === chessCheckpoint,
  )
  await click("Trở về hành trình")
  await ready()
  check(
    "Chess returns to exact room checkpoint",
    (await raw()) === chessCheckpoint,
  )
  phase = "reload-and-stale"
  await openPractice()
  await practice()
    .getByRole("button", { name: "Ghé bàn TCG", exact: true })
    .click()
  await page.getByTestId("mode-lobby").waitFor()
  const abandoned = await raw()
  await page.reload()
  await ready()
  check(
    "Reload abandons practice at exact saved room checkpoint",
    (await raw()) === abandoned &&
      (await page.getByTestId("mode-lobby").count()) === 0,
  )
  await openPractice()
  const second = await context.newPage()
  await second.goto(url)
  await second
    .locator(
      '[data-world-scene-state="active"] canvas[data-world-render-state="ready"]',
    )
    .waitFor()
  await second
    .getByRole("navigation", { name: "Menu game", exact: true })
    .getByRole("button", { name: "Thêm", exact: true })
    .click()
  await second
    .getByTestId("game-panel")
    .getByRole("button", { name: "Lưu vị trí", exact: true })
    .click()
  await practice()
    .filter({ hasText: /tab khác/ })
    .waitFor()
  check(
    "Another-tab checkpoint disables stale room service",
    await practice()
      .getByRole("button", { name: "Ghé bàn TCG", exact: true })
      .isDisabled(),
  )
  const newer = await raw()
  await practice()
    .getByRole("button", { name: "Đọc lại hành trình", exact: true })
    .click()
  await ready()
  await second.close()
  check("Explicit reread preserves newer checkpoint", (await raw()) === newer)
  phase = "classic"
  await page.goto(url.replace("game.html", "world.html"))
  await ready()
  await map().scrollIntoViewIfNeeded()
  await openPractice()
  await layout("classic selector", true)
  await practice()
    .getByRole("button", { name: "Ghé bàn TCG", exact: true })
    .click()
  await page.getByTestId("mode-lobby").waitFor()
  const classic = await raw()
  check(
    "Classic uses same validated room service",
    (await page.getByTestId("mode-lobby").getAttribute("data-entry")) ===
      "room-service",
  )
  await click("Trở về hành trình")
  await ready()
  check("Classic exact room return", (await raw()) === classic)
  await walk("aw2-object-tea-exit")
  await inspect("aw2-object-tea-exit", "Ra hiên")
  await ready()
  const after = await save()
  check(
    "Explicit exit restores exact outside checkpoint",
    after.progress.interior === null &&
      after.progress.x === outside.x &&
      after.progress.y === outside.y &&
      after.progress.facing === outside.facing,
  )
  check(
    "World XP/party/legacy unchanged after both actual games",
    after.economy.teamExperience === 30 &&
      after.progress.partyIds.length === 5 &&
      (await page.evaluate(() => localStorage.getItem("foodchest.tcg.v1"))) ===
        "016K-legacy",
  )
  finalRaw = await raw()
  check("No unexpected browser/resource/lifecycle errors", errors.length === 0)
  phase = "complete"
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-016K",
        status: "PASS",
        flavor,
        checkCount: checks.length,
        checks,
        errors,
        captures,
        tcgResult,
        chessResult,
        finalRaw,
        limits:
          "Fresh isolated developer Chromium; physical device/independent human/FPS/rights not tested. Chess covers one actual round and round2 entry, not all five rounds.",
      },
      null,
      2,
    ) + "\n",
  )
} catch (error) {
  if (page)
    try {
      await page.screenshot({ path: `${out}/${flavor}-failure.png` })
      finalRaw = await page.evaluate((k) => localStorage.getItem(k), key)
    } catch {}
  await mkdir(out, { recursive: true })
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-016K",
        status: "FAIL",
        phase,
        checks,
        errors,
        error: String(error.stack || error),
        finalRaw,
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
