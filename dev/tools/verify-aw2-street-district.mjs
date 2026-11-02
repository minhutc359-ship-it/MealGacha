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
  port = values.compiled ? 8791 : 8790,
  out = ".asset-work/aw2-017b",
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
        if (window.__roomFail) throw Error("017B simulated quota failure")
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

  phase = "fresh-village"
  await page.goto(url)
  await click("Tạo bản lưu AW2")
  await ready()
  await page.evaluate(() =>
    localStorage.setItem("foodchest.tcg.v1", "017B-legacy"),
  )
  for (const [id, action] of [
    ["aw2-npc-giu-cho", "Nhận nhiệm vụ"],
    ["aw2-object-village-table", "Đọc mảnh khăn"],
    ["aw2-npc-giu-cho", "Hoàn tất nhập môn"],
  ]) {
    await walk(id)
    await inspect(id, action)
  }
  await walk("aw2-zone-covenant-village:exit:east")
  await inspect("aw2-zone-covenant-village:exit:east", "Đi qua")
  await ready()
  await walk("aw2-npc-va-den")
  await inspect("aw2-npc-va-den", "Nhận nhiệm vụ")
  await click("Toàn cảnh")
  await page.waitForTimeout(250)
  await capture("street-overview")
  check(
    "Three active functional street facades",
    JSON.parse(await canvas().getAttribute("data-settlement")).length === 3,
  )
  check(
    "Only An and water child remain outdoors",
    JSON.parse(await canvas().getAttribute("data-npc-motion")).length === 2,
  )
  // Native journal points to a door while preserving the NPC target identity.
  await page.keyboard.press("j")
  await panel().waitFor()
  await panel().getByRole("button", { name: "Chỉ đường", exact: true }).click()
  const route = page.getByTestId("game-quest-walk-aw2-npc-nguoi-ban")
  await route.waitFor()
  check(
    "Journal leads breakfast NPC through its door",
    +(await route.getAttribute("data-approach-x")) === 72 &&
      +(await route.getAttribute("data-approach-y")) === 80,
  )
  await route.click()
  await panel().waitFor({ state: "hidden" })
  await page.getByTestId("walking-status").waitFor({ state: "hidden" })
  check(
    "Following journal walks without auto-entry",
    (await save()).progress.interior === null,
  )
  const roomData = [
    {
      id: "street-breakfast",
      x: 72,
      name: "Quầy bữa sáng",
      action: "Vào Quầy bữa sáng",
      services: ["aw2-npc-nguoi-ban", "aw2-object-breakfast-recipes"],
      npcs: 1,
    },
    {
      id: "street-workshop",
      x: 300,
      name: "Xưởng sửa ghế",
      action: "Vào Xưởng sửa ghế",
      services: ["aw2-npc-sua-ghe"],
      npcs: 1,
    },
    {
      id: "street-play",
      x: 528,
      name: "Nhà bàn chơi",
      action: "Vào Nhà bàn chơi",
      services: ["aw2-npc-ban-bai", "aw2-npc-ban-co"],
      npcs: 2,
    },
  ]
  const checkpoints = {}
  for (const r of roomData) {
    phase = r.id
    const door = `aw2-object-${r.id}-door`
    await click("Toàn cảnh")
    const before = await raw()
    await tapWorldPoint(page, r.x, -64)
    await page.waitForFunction(
      (x) =>
        document
          .querySelector('[data-testid="player-position"]')
          .textContent.includes(`Vị trí ${x}, 80`),
      r.x,
    )
    await page.getByTestId("walking-status").waitFor({ state: "hidden" })
    check(
      `${r.id}: clicking actual facade reaches its door without writing`,
      (await raw()) === before,
    )
    await inspect(door)
    const outsideRaw = await raw(),
      priorEntry = (await save()).revision
    const canvasToken = await canvas().evaluate(
      (c) => (c.__districtToken ??= Math.random()),
    )
    await page.evaluate(() => (window.__roomFail = true))
    await dialog().getByRole("button", { name: r.action, exact: true }).click()
    const retry = dialog().getByRole("button", {
      name: `${r.action} · thử lại`,
      exact: true,
    })
    await retry.waitFor()
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="travel-progress"]'),
    )
    check(
      `${r.id}: failed entry keeps exact outside save and source canvas`,
      (await raw()) === outsideRaw &&
        (await canvas().evaluate((c) => c.__districtToken)) === canvasToken,
    )
    await page.evaluate(() => (window.__roomFail = false))
    await retry.evaluate((b) => {
      b.click()
      b.click()
    })
    await dialog().waitFor({ state: "hidden" })
    await ready()
    check(
      `${r.id}: explicit retry commits only once`,
      (await save()).revision === priorEntry + 1,
    )
    const entry = await save(),
      entryRaw = await raw()
    check(
      `${r.id}: distinct real scene/exact source checkpoint`,
      entry.progress.interior.roomId === `aw2-room-${r.id}` &&
        entry.progress.x === r.x &&
        entry.progress.y === 80,
    )
    check(
      `${r.id}: only actual resident sprites`,
      JSON.parse(await canvas().getAttribute("data-npc-motion")).length ===
        r.npcs,
    )
    await capture(`${r.id}-inside`)
    for (const id of r.services) {
      await walk(id)
      if (id === r.services[0]) {
        const expected = {
          "street-breakfast": "Người Bán Bữa Sáng",
          "street-workshop": "Thợ Sửa Ghế",
          "street-play": "Chủ Bàn Bài · TCG",
        }[r.id]
        const label = map().locator(
          `[data-world-label="${id}"] .aw2-place-name`,
        )
        check(
          `${id}: correct visible resident label`,
          (await label.textContent()) === expected && (await label.isVisible()),
        )
        await capture(`${r.id}-resident`)
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
          await places(id)
          await layout(`${r.id}-service/${width}`)
          await close()
        }
        await page.setViewportSize({ width: 390, height: 844 })
        await page.evaluate(
          () => (document.documentElement.style.fontSize = "16px"),
        )
      }
      await inspect(id)
      if (r.id === "street-play") {
        await dialog()
          .getByRole("button", { name: "Ghé bàn", exact: true })
          .click()
        await page.getByTestId("mode-lobby").waitFor()
        const modeRaw = await raw()
        check(
          `${id}: native portal owns return room`,
          (await page.getByTestId("mode-lobby").getAttribute("data-entry")) ===
            "portal",
        )
        await click("Trở về hành trình")
        await ready()
        check(
          `${id}: exact checkpoint after mode return`,
          (await raw()) === modeRaw,
        )
      } else if (id.startsWith("aw2-npc-")) {
        const beforeMemory = await save()
        await dialog()
          .getByRole("button", { name: "Ghi nhớ câu chuyện", exact: true })
          .click()
        await dialog().waitFor({ state: "hidden" })
        check(
          `${id}: actual memory action preserves inventory and adds one memory`,
          (await save()).progress.memories.length ===
            beforeMemory.progress.memories.length + 1 &&
            JSON.stringify((await save()).economy) ===
              JSON.stringify(beforeMemory.economy),
        )
      } else {
        const action = id.includes("party")
          ? "Xem đội đồng hành"
          : "Xem nhật ký"
        const reading = await raw()
        await dialog()
          .getByRole("button", { name: action, exact: true })
          .click()
        await panel().waitFor()
        await close()
        check(
          `${id}: real service reads without save`,
          (await raw()) === reading,
        )
      }
    }
    // Explicitly save local inside position before checking independent reload.
    await page
      .getByRole("navigation", { name: "Menu game", exact: true })
      .getByRole("button", { name: "Thêm", exact: true })
      .click()
    const priorRevision = (await save()).revision
    await panel()
      .getByRole("button", { name: "Lưu vị trí", exact: true })
      .click()
    await page.waitForFunction(
      ({ key, revision }) =>
        JSON.parse(localStorage.getItem(key)).revision === revision + 1,
      { key, revision: priorRevision },
    )
    await close()
    const saved = await raw()
    checkpoints[r.id] = saved
    await page.reload()
    await ready()
    check(`${r.id}: reload exact room/save`, (await raw()) === saved)
    const exit = `aw2-object-${r.id}-exit`
    await walk(exit)
    await inspect(exit, "Ra hiên")
    await ready()
    const returned = await save()
    check(
      `${r.id}: exit exact door/quest/XP`,
      returned.progress.interior === null &&
        returned.progress.x === r.x &&
        returned.progress.y === 80 &&
        returned.economy.teamExperience === 30,
    )
  }
  await walk("aw2-npc-dem-nuoc")
  await inspect("aw2-npc-dem-nuoc", "Ghi nhớ câu chuyện")
  await walk("aw2-npc-va-den")
  await inspect("aw2-npc-va-den", "Người trở lại")
  check(
    "Three real memories and turn-in retain exactly80XP",
    (await save()).economy.teamExperience === 80,
  )
  phase = "historical7"
  const current = await save(),
    old = JSON.stringify({ ...current, schemaVersion: 7 })
  await page.evaluate(({ key, old }) => localStorage.setItem(key, old), {
    key,
    old,
  })
  await page.reload()
  await ready()
  check("Historical7 reads without upgrade write", (await raw()) === old)
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
    await click("Toàn cảnh")
    await layout(`district/${width}`)
    await capture(`district-${width}`)
    await places("aw2-object-street-play-door")
    await layout(`door-menu/${width}`)
    await close()
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => (document.documentElement.style.fontSize = "16px"))
  await capture("village-final-390")
  check(
    "No implicit upgrade or progress/resource change while inspecting",
    (await raw()) === old && (await save()).economy.teamExperience === 80,
  )
  finalRaw = await raw()
  check(
    "Legacy sentinel retained",
    (await page.evaluate(() => localStorage.getItem("foodchest.tcg.v1"))) ===
      "017B-legacy",
  )
  check("No unexpected browser errors", errors.length === 0)
  phase = "complete"
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-017B",
        status: "PASS",
        flavor,
        checkCount: checks.length,
        checks,
        errors,
        captures,
        checkpoints,
        finalRaw,
        limits:
          "Street slice only; explicit E doors, original reused room art; no new terminal-mode matches/physical device/FPS/final art acceptance.",
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
        task: "AW2-017B",
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
