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
  port = values.compiled ? 8793 : 8792
const out = ".asset-work/aw2-017b-story",
  key = "aw2.development.save",
  checks = [],
  errors = [],
  captures = []
const url = `http://127.0.0.1:${port}/dev/aw2/game.html`
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
  bossTick = null,
  finalRaw = ""
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
  const browserVersion = await browser.version()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    hasTouch: true,
    reducedMotion: "reduce",
  })
  await context.addInitScript(() => {
    window.__questFail = false
    window.__questWrites = 0
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (k, v) {
      if (k === "aw2.development.save") {
        window.__questWrites++
        if (window.__questFail)
          throw Error("016J simulated storage write failure")
      }
      return original.call(this, k, v)
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
    save = async () => JSON.parse(await raw())
  const click = (name) =>
    page.getByRole("button", { name, exact: true }).click()
  const map = () =>
      page
        .locator('[data-world-scene-state="active"]')
        .getByTestId("world-map"),
    canvas = () => map().locator("canvas")
  const panel = () => page.getByTestId("game-panel"),
    dialog = () => page.locator("dialog[open]:not(.aw2-game-panel)")
  const dock = (name) =>
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
  const close = async () => {
    await page.keyboard.press("Escape")
    await page.locator("dialog[open]").waitFor({ state: "hidden" })
  }
  const arrive = (x, y) =>
    page.waitForFunction(
      ({ x, y }) => {
        const position = document
          .querySelector('[data-testid="player-position"]')
          ?.textContent.match(/Vị trí (\d+), (\d+)/)
        return (
          position &&
          Math.abs(+position[1] - x) <= 1 &&
          Math.abs(+position[2] - y) <= 1
        )
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
  const places = async (id) => {
    if (page.url().endsWith("world.html")) await click("Địa điểm trong vùng")
    else {
      await dock("Thêm").click()
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
    throw Error(`Missing place ${id}`)
  }
  const walk = async (id) => {
    await places(id)
    const before = await raw(),
      token = await canvas().evaluate(
        (c) => (c.__questIdentity ??= crypto.randomUUID()),
      )
    const button = panel().getByRole("button", {
      name: "Đi tới địa điểm",
      exact: true,
    })
    if (await button.count()) {
      const x = +(await button.getAttribute("data-approach-x")),
        y = +(await button.getAttribute("data-approach-y"))
      await button.click()
      await panel().waitFor({ state: "hidden" })
      await arrive(x, y)
      await page.getByTestId("walking-status").waitFor({ state: "hidden" })
    } else await close()
    check(
      `${id}: approach preserves canvas/save and never auto-interacts`,
      (await raw()) === before &&
        (await canvas().evaluate((c) => c.__questIdentity)) === token &&
        (await dialog().count()) === 0,
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
  const residentRoom = {
    "aw2-npc-nguoi-ban": "street-breakfast",
    "aw2-npc-sua-ghe": "street-workshop",
    "aw2-npc-ban-bai": "street-play",
    "aw2-npc-ban-co": "street-play",
  }
  const roomName = {
    "street-breakfast": "Quầy bữa sáng",
    "street-workshop": "Xưởng sửa ghế",
    "street-play": "Nhà bàn chơi",
  }
  const ensureScene = async (id) => {
    const target = residentRoom[id] ?? null
    const current = await canvas().getAttribute("data-room-id")
    if ((current ?? null) === (target ? `aw2-room-${target}` : null)) return
    if (current) {
      const exit = `aw2-object-${current.slice(9)}-exit`
      await walk(exit)
      await inspect(exit, "Ra hiên")
      await ready()
    }
    if (target) {
      const door = `aw2-object-${target}-door`
      await walk(door)
      await inspect(door, `Vào ${roomName[target]}`)
      await ready()
      check(
        `${id}: enters its actual scene before quest interaction`,
        (await canvas().getAttribute("data-room-id")) === `aw2-room-${target}`,
      )
    }
  }
  const cue = async (id, state) => {
    await ensureScene(id)
    await page.waitForFunction(
      ({ id, state }) => {
        const n = document.querySelector(
          `[data-world-scene-state="active"] [data-world-label="${id}"] [data-place-state]`,
        )
        return state
          ? n?.dataset.placeState === state
          : !n?.dataset.placeState.startsWith("quest-")
      },
      { id, state },
    )
    check(`${id}: ${state ?? "no quest cue"}`)
  }

  const travel = async (x, name, y = 192) => {
    await go(x, y)
    await map().focus()
    await page.keyboard.press("e")
    await dialog().getByRole("button", { name: "Đi qua", exact: true }).click()
    await page.getByTestId("zone-name").filter({ hasText: name }).waitFor()
    await ready()
    check(`${name}: travel reaches ready scene`)
  }
  const layout = async (label) => {
    const result = await page.evaluate(() => {
      const scope =
          document.querySelector("dialog[open]") ??
          document.querySelector('[data-testid="game-shell"]'),
        visible = (n) =>
          n.getClientRects().length &&
          getComputedStyle(n).visibility !== "hidden",
        buttons = [...scope.querySelectorAll("button,select")]
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
            }
          }),
        overflow = [
          ...scope.querySelectorAll(
            ".aw2-panel-content,.aw2-panel-body,.aw2-panel-stack",
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
        buttons,
        overflow,
      }
    })
    check(
      `${label}: viewport/no clipping/native44px ${JSON.stringify(result.overflow)}`,
      result.dw <= result.w &&
        result.dh <= result.h &&
        !result.overflow.length &&
        result.buttons.every(
          (b) =>
            b.w >= 43.9 &&
            b.h >= 43.9 &&
            b.x >= -0.5 &&
            b.y >= -0.5 &&
            b.r <= result.w + 0.5 &&
            b.b <= result.h + 0.5,
        ),
    )
  }
  const matrix = async (id, state, name) => {
    const before = await raw(),
      token = await canvas().evaluate(
        (c) => (c.__questIdentity ??= crypto.randomUUID()),
      )
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
      for (const camera of ["Toàn cảnh", "Bám nhân vật"]) {
        await click(camera)
        await page.waitForFunction(
          (mode) => {
            const c = document.querySelector(
              '[data-world-scene-state="active"] canvas',
            )
            return (
              c?.dataset.worldCamera &&
              JSON.parse(c.dataset.worldCamera).mode === mode
            )
          },
          camera === "Toàn cảnh" ? "overview" : "follow",
        )
        await layout(`${name}/${width}/${camera}`)
        const bounds = await map().evaluate((parent) => {
          const r = parent.getBoundingClientRect(),
            rects = [...parent.querySelectorAll("[data-world-label]")]
              .filter(
                (n) =>
                  getComputedStyle(n).visibility === "visible" &&
                  n.querySelector("[data-place-state]"),
              )
              .map((n) => n.getBoundingClientRect())
          return {
            parent: {
              left: r.left,
              right: r.right,
              top: r.top,
              bottom: r.bottom,
            },
            rects: rects.map((b) => ({
              left: b.left,
              right: b.right,
              top: b.top,
              bottom: b.bottom,
            })),
            whole: rects.every(
              (b) =>
                b.left >= Math.max(0, r.left) - 0.5 &&
                b.right <= Math.min(innerWidth, r.right) + 0.5 &&
                b.top >= Math.max(0, r.top) - 0.5 &&
                b.bottom <= Math.min(innerHeight, r.bottom) + 0.5,
            ),
            overlap: rects.some((a, i) =>
              rects
                .slice(i + 1)
                .some(
                  (b) =>
                    a.left < b.right &&
                    a.right > b.left &&
                    a.top < b.bottom &&
                    a.bottom > b.top,
                ),
            ),
          }
        })
        check(
          `${name}/${width}/${camera}: visible labels whole/nonoverlapping ${JSON.stringify(bounds)}`,
          bounds.whole && !bounds.overlap,
        )
      }
      await places(id)
      await layout(`${name}/${width}/Places`)
      check(
        `${name}/${width}: same accessible cue in Places`,
        (await panel()
          .locator("[data-place-state]")
          .getAttribute("data-place-state")) === state,
      )
      await page.keyboard.press("Tab")
      await page.keyboard.press("Shift+Tab")
      check(
        `${name}/${width}: focus trapped`,
        await panel().evaluate((d) => d.contains(document.activeElement)),
      )
      await close()
      check(
        `${name}/${width}: Escape restores map focus`,
        await map().evaluate((m) => document.activeElement === m),
      )
      if (width === 390) {
        const path = `${out}/${flavor}-${name}.png`
        await page.screenshot({ path })
        captures.push(path)
      }
    }
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "16px"),
    )
    await page.setViewportSize({ width: 1280, height: 720 })
    check(
      `${name}: resize/camera/menu never write or recreate canvas`,
      (await raw()) === before &&
        (await canvas().evaluate((c) => c.__questIdentity)) === token,
    )
  }

  phase = "intro-and-failed-write"
  await page.goto(url)
  await click("Tạo bản lưu AW2")
  await ready()
  await page.evaluate(() =>
    localStorage.setItem("foodchest.tcg.v1", "016J-legacy"),
  )
  await cue("aw2-npc-giu-cho", "quest-available")
  await walk("aw2-npc-giu-cho")
  await matrix("aw2-npc-giu-cho", "quest-available", "available")
  await inspect("aw2-npc-giu-cho")
  const failedRaw = await raw()
  await page.evaluate(() => (window.__questFail = true))
  await dialog()
    .getByRole("button", { name: "Nhận nhiệm vụ", exact: true })
    .click()
  await page
    .getByRole("alert")
    .filter({ hasText: /Chưa lưu được AW2/ })
    .first()
    .waitFor()
  await cue("aw2-npc-giu-cho", "quest-available")
  check(
    "Failed accept retains exact raw, old cue and zero party",
    (await raw()) === failedRaw &&
      (await save()).progress.partyIds.length === 0,
  )
  await page.evaluate(() => (window.__questFail = false))
  await dialog()
    .getByRole("button", { name: "Nhận nhiệm vụ", exact: true })
    .click()
  await dialog().waitFor({ state: "hidden" })
  await cue("aw2-npc-giu-cho")
  await cue("aw2-object-village-table", "quest-active")
  await walk("aw2-object-village-table")
  await inspect("aw2-object-village-table", "Đọc mảnh khăn")
  await cue("aw2-object-village-table")
  await cue("aw2-npc-giu-cho", "quest-ready")
  await walk("aw2-npc-giu-cho")
  await matrix("aw2-npc-giu-cho", "quest-ready", "return")
  const classicCheckpoint = await raw()
  await inspect("aw2-npc-giu-cho", "Hoàn tất nhập môn")
  await cue("aw2-npc-giu-cho")
  check(
    "Explicit intro grants five/30XP/one receipt",
    (await save()).progress.partyIds.length === 5 &&
      (await save()).economy.teamExperience === 30 &&
      (await save()).economy.receipts.length === 1,
  )
  phase = "memories"
  await travel(616, "Phố Đèn Lồng")
  await cue("aw2-npc-va-den", "quest-available")
  await walk("aw2-npc-va-den")
  await inspect("aw2-npc-va-den", "Nhận nhiệm vụ")
  for (const id of [
    "aw2-npc-nguoi-ban",
    "aw2-npc-sua-ghe",
    "aw2-npc-dem-nuoc",
  ]) {
    await cue(id, "quest-active")
    await walk(id)
    await inspect(id, "Ghi nhớ câu chuyện")
    await cue(id)
  }
  await cue("aw2-npc-va-den", "quest-ready")
  await walk("aw2-npc-va-den")
  await inspect("aw2-npc-va-den", "Người trở lại")
  check(
    "Three real memories grant exactly80XP",
    (await save()).economy.teamExperience === 80,
  )
  phase = "puzzle"
  await travel(616, "Sân Bếp Bỏ Quên")
  await cue("aw2-npc-gac-bep", "quest-available")
  await walk("aw2-npc-gac-bep")
  await inspect("aw2-npc-gac-bep", "Nhận nhiệm vụ")
  await cue("aw2-npc-gac-bep")
  await travel(208, "Phòng Kho", 48)
  await cue("aw2-object-hearth-hint", "quest-active")
  await walk("aw2-object-hearth-hint")
  await inspect("aw2-object-hearth-hint", "Ghi lại gợi ý")
  await cue("aw2-object-hearth-hint")
  await travel(616, "Phòng Lửa")
  await cue("aw2-object-steam-0", "quest-active")
  await cue("aw2-object-steam-1")
  await walk("aw2-object-steam-0")
  await inspect("aw2-object-steam-0", "Mở lối thoát")
  await cue("aw2-object-steam-1", "quest-active")
  await walk("aw2-object-steam-2")
  await inspect("aw2-object-steam-2", "Nhóm lửa")
  await cue("aw2-object-steam-0", "quest-active")
  for (const [i, label] of ["Mở lối thoát", "Đặt nồi", "Nhóm lửa"].entries()) {
    await cue(`aw2-object-steam-${i}`, "quest-active")
    await walk(`aw2-object-steam-${i}`)
    await inspect(`aw2-object-steam-${i}`, label)
    await cue(`aw2-object-steam-${i}`)
  }
  await travel(24, "Phòng Kho")
  await travel(24, "Sân Bếp Bỏ Quên")
  await cue("aw2-npc-gac-bep", "quest-ready")
  await walk("aw2-npc-gac-bep")
  await inspect("aw2-npc-gac-bep", "Báo đã mở bếp")
  await cue("aw2-npc-gac-bep", "quest-available")
  await places("aw2-npc-gac-bep")
  check(
    "Quest priority retains kitchen availability explanation",
    (await panel().getByTestId("place-availability").innerText()).includes(
      "Có thể nấu",
    ),
  )
  await close()
  await inspect("aw2-npc-gac-bep", "Nhận nhiệm vụ")
  await cue("aw2-npc-gac-bep", "ready")
  phase = "actual-boss"
  await travel(208, "Phòng Kho", 48)
  await travel(616, "Phòng Lửa")
  await travel(616, "Phòng Bàn")
  await cue("aw2-enemy-forgotten-host", "quest-active")
  await cue("aw2-object-table-note")
  await walk("aw2-enemy-forgotten-host")
  await inspect("aw2-enemy-forgotten-host", "Bắt đầu thử thách")
  const battle = page.getByTestId("world-battle"),
    scene = (value) =>
      page
        .getByRole("combobox", { name: "Nội dung màn chơi", exact: true })
        .selectOption(value)
  await battle.waitFor()
  await click("Tạm dừng")
  const bossRaw = await raw()
  for (
    let i = 0;
    i < 180 && (await battle.getAttribute("data-status")) === "active";
    i++
  ) {
    if (+(await battle.getAttribute("data-tick")) >= 5) {
      await scene("team")
      const prev = page.getByRole("button", {
          name: "Vị Linh trước",
          exact: true,
        }),
        next = page.getByRole("button", { name: "Vị Linh sau", exact: true })
      while (await prev.isEnabled()) await prev.click()
      for (let u = 0; u < 5; u++) {
        const ultimate = page.locator('[data-testid^="world-ultimate-"]')
        if (await ultimate.isEnabled()) await ultimate.click()
        if ((await battle.getAttribute("data-status")) !== "active") break
        if (u < 4) await next.click()
      }
    }
    if ((await battle.getAttribute("data-status")) === "active") {
      await scene("controls")
      await click("Bước 1 nhịp")
    }
  }
  bossTick = +(await battle.getAttribute("data-tick"))
  check(
    "Actual fresh boss win preserves checkpoint until explicit settlement",
    (await battle.getAttribute("data-status")) === "player-win" &&
      (await raw()) === bossRaw,
  )
  await click("Lưu kết quả và trở về")
  await ready()
  await cue("aw2-enemy-forgotten-host")
  await cue("aw2-object-table-note", "quest-active")
  await walk("aw2-object-table-note")
  await inspect("aw2-object-table-note", "Đọc ghi chép")
  await cue("aw2-object-table-note")
  for (const name of [
    "Phòng Lửa",
    "Phòng Kho",
    "Sân Bếp Bỏ Quên",
    "Phố Đèn Lồng",
    "Làng Giao Ước",
  ])
    await travel(24, name)
  await cue("aw2-npc-giu-cho", "quest-ready")
  await walk("aw2-npc-giu-cho")
  await inspect("aw2-npc-giu-cho", "Mời cả làng dùng bữa")
  await cue("aw2-npc-giu-cho")
  const complete = await raw()
  await page.reload()
  await ready()
  check(
    "Complete/reload keeps exact earned300XP and no quest marker",
    (await raw()) === complete &&
      (await save()).economy.teamExperience === 300 &&
      (await map().locator('[data-place-state^="quest-"]').count()) === 0,
  )
  await travel(616, "Phố Đèn Lồng")
  await travel(616, "Sân Bếp Bỏ Quên")
  await travel(480, "Phòng Bàn", 48)
  await travel(520, "Sân Bếp Bỏ Quên", 240)
  check("Completed yard/table shortcut works in both directions")
  phase = "classic-shared-checkpoint"
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
    key,
    value: classicCheckpoint,
  })
  await page.goto(url.replace("game.html", "world.html"))
  await ready()
  await map().scrollIntoViewIfNeeded()
  await cue("aw2-npc-giu-cho", "quest-ready")
  await places("aw2-npc-giu-cho")
  check(
    "Classic shares authentic pending-return cue without migrating or claiming",
    (await panel()
      .locator("[data-place-state]")
      .getAttribute("data-place-state")) === "quest-ready" &&
      (await raw()) === classicCheckpoint,
  )
  await close()
  check(
    "Legacy save preserved",
    (await page.evaluate(() => localStorage.getItem("foodchest.tcg.v1"))) ===
      "016J-legacy",
  )
  finalRaw = await raw()
  check("No unexpected browser/resource/lifecycle errors", errors.length === 0)
  phase = "complete"
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-017B-story",
        status: "PASS",
        flavor,
        browserVersion,
        checkCount: checks.length,
        checks,
        errors,
        captures,
        bossTick,
        finalRaw,
        completedRaw: complete,
        limits:
          "Fresh isolated automated journey; physical phone/independent human/FPS/rights not tested.",
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
        task: "AW2-017B-story",
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
