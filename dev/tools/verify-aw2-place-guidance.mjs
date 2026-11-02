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
  port = values.compiled ? 8721 : 8720,
  out = ".asset-work/aw2-016g",
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
    window.__guideWrites = 0
    window.__guideFail = false
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (k, v) {
      if (k === "aw2.development.save") {
        window.__guideWrites++
        const candidate = document.querySelector(
          '[data-world-scene-state="preparing"] canvas',
        )
        window.__guideCommit = candidate
          ? {
              token: (candidate.__guideIdentity ??= crypto.randomUUID()),
              ready: candidate.dataset.worldRenderState,
              room: candidate.dataset.roomId ?? null,
            }
          : null
        if (window.__guideFail)
          throw new DOMException(
            "016G simulated storage failure",
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
    writes = () => page.evaluate(() => window.__guideWrites),
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
  const isClassic = () => page.url().endsWith("world.html")
  const places = async (id) => {
    if (isClassic()) await click("Địa điểm trong vùng")
    else {
      await menu()
      await panel()
        .getByRole("button", { name: "Địa điểm", exact: true })
        .click()
    }
    await page.getByTestId("place-guidance").waitFor()
    if (id) await seekPlace(id)
  }
  const seekPlace = async (id) => {
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
    throw Error(`Place absent: ${id}`)
  }
  const atlas = async (zone = "aw2-zone-covenant-village") => {
    if (isClassic()) await click("Bản đồ hành trình")
    else {
      await menu()
      await panel()
        .getByRole("button", { name: "Bản đồ hành trình", exact: true })
        .click()
    }
    await page.getByTestId("journey-overview").waitFor()
    await panel()
      .getByRole("combobox", {
        name: "Vùng trên bản đồ hành trình",
        exact: true,
      })
      .selectOption(zone)
  }
  const inspect = async (id) => {
    await places(id)
    const before = await raw()
    await panel()
      .getByRole("button", { name: "Xem tương tác", exact: true })
      .click()
    await dialog().waitFor()
    check(
      `Selected ${id}: one dialog and no save`,
      (await page.locator("dialog[open]").count()) === 1 &&
        (await raw()) === before,
    )
  }
  const fit = async (label) => {
    const result = await page.locator("dialog[open]").evaluate((d) => {
      const box = d.getBoundingClientRect()
      return {
        w: innerWidth,
        h: innerHeight,
        doc: document.documentElement.scrollWidth,
        bodyH: document.documentElement.scrollHeight,
        clip:
          d.scrollWidth <= d.clientWidth + 1 &&
          d.scrollHeight <= d.clientHeight + 1,
        box: { x: box.x, y: box.y, r: box.right, b: box.bottom },
        buttons: [...d.querySelectorAll("button,select")]
          .filter(
            (e) =>
              e.getClientRects().length &&
              getComputedStyle(e).visibility !== "hidden",
          )
          .map((e) => {
            const b = e.getBoundingClientRect()
            return {
              w: b.width,
              h: b.height,
              x: b.x,
              y: b.y,
              r: b.right,
              b: b.bottom,
            }
          }),
      }
    })
    check(
      `${label}: modal/document fit`,
      result.doc <= result.w &&
        (isClassic() || result.bodyH <= result.h) &&
        result.clip &&
        result.box.x >= -0.5 &&
        result.box.y >= -0.5 &&
        result.box.r <= result.w + 0.5 &&
        result.box.b <= result.h + 0.5,
    )
    check(
      `${label}: all native controls44px and visible`,
      result.buttons.length > 0 &&
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
  const nativeWalk = async (id) => {
    await places(id)
    const before = await raw(),
      button = panel().getByRole("button", {
        name: "Đi tới địa điểm",
        exact: true,
      })
    const point = {
      x: +(await button.getAttribute("data-approach-x")),
      y: +(await button.getAttribute("data-approach-y")),
    }
    await button.click()
    await panel().waitFor({ state: "hidden" })
    await arrive(point.x, point.y)
    check(
      `Place ${id}: walk only, map focus and no auto action`,
      (await raw()) === before &&
        (await dialog().count()) === 0 &&
        (await map().evaluate((m) => document.activeElement === m)),
    )
  }
  phase = "fresh-intro"
  await page.goto(url)
  await click("Tạo bản lưu AW2")
  await ready()
  await page.evaluate(
    (v) => Object.entries(v).forEach(([k, s]) => localStorage.setItem(k, s)),
    legacy,
  )
  await nativeWalk("aw2-npc-giu-cho")
  await inspect("aw2-npc-giu-cho")
  await dialog()
    .getByRole("button", { name: "Nhận nhiệm vụ", exact: true })
    .click()
  await dialog().waitFor({ state: "hidden" })
  await nativeWalk("aw2-object-village-table")
  await inspect("aw2-object-village-table")
  await dialog()
    .getByRole("button", { name: "Đọc mảnh khăn", exact: true })
    .click()
  await dialog().waitFor({ state: "hidden" })
  await nativeWalk("aw2-npc-giu-cho")
  await inspect("aw2-npc-giu-cho")
  await dialog()
    .getByRole("button", { name: "Hoàn tất nhập môn", exact: true })
    .click()
  await dialog().waitFor({ state: "hidden" })
  await ready()
  check(
    "Fresh selected-place intro grants exactly one receipt/five starters30XP",
    (await save()).economy.teamExperience === 30 &&
      (await save()).economy.receipts.length === 1 &&
      (await save()).progress.partyIds.length === 5,
  )
  phase = "selected-target-table"
  await go(160, 191)
  await inspect("aw2-object-village-table")
  check(
    "Selected table opens its own existing dialog",
    /mảnh khăn/i.test(await dialog().textContent()) &&
      !(await dialog()
        .getByRole("button", { name: "Nhận nhiệm vụ", exact: true })
        .count()),
  )
  await close()
  phase = "atlas-door-access"
  await atlas()
  const beforeAtlas = await raw()
  await panel().getByRole("button", { name: "Tiệm trà", exact: true }).click()
  check(
    "Village atlas exposes the real tea entrance",
    (await page.getByTestId("overview-tea-walk").textContent()) ===
      "Đi tới cửa tiệm trà",
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
    await fit(`${width}x${height}/20px village tea atlas`)
  }
  check(
    "Map tabs and viewport changes do not save",
    (await raw()) === beforeAtlas,
  )
  await page.evaluate(() => (document.documentElement.style.fontSize = "16px"))
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.getByTestId("overview-tea-walk").click()
  await arrive(300, 80)
  check(
    "Atlas walks to safe door approach without entering",
    (await save()).progress.interior === null &&
      (await raw()) === beforeAtlas &&
      (await dialog().count()) === 0,
  )
  check(
    "Nearby cue describes the authored entrance and E is linked to it",
    (await page.getByTestId("nearby-point").textContent()).includes(
      "Cửa tiệm trà",
    ) &&
      (await page
        .locator('[data-aw2-world-control="interact"]')
        .getAttribute("aria-describedby")) === "aw2-nearby-point",
  )
  await capture("door-cue")
  phase = "room-fault"
  await inspect("aw2-object-village-tea-door")
  const outsideRaw = await raw(),
    outsideToken = await canvas().evaluate(
      (c) => (c.__guideIdentity ??= crypto.randomUUID()),
    )
  fault = "/dev/aw2/assets/environments/village-tea/v1/floor.webp"
  let missing = true
  await page.route(`**${fault}`, (r) =>
    missing
      ? r.fulfill({ status: 404, body: "016G floor probe" })
      : r.continue(),
  )
  await dialog()
    .getByRole("button", { name: "Vào tiệm trà", exact: true })
    .click()
  await dialog().getByRole("alert").waitFor()
  check(
    "Missing room image preserves source save/canvas and disables exploration",
    (await raw()) === outsideRaw &&
      (await canvas().evaluate((c) => c.__guideIdentity)) === outsideToken &&
      (await page.locator('[data-aw2-world-control="interact"]').isDisabled()),
  )
  missing = false
  await dialog()
    .getByRole("button", { name: "Vào tiệm trà · thử lại", exact: true })
    .click()
  await dialog().waitFor({ state: "hidden" })
  await ready()
  await page.unroute(`**${fault}`)
  fault = ""
  const roomRaw = await raw(),
    checkpoint = {
      x: (await save()).progress.x,
      y: (await save()).progress.y,
      facing: (await save()).progress.facing,
    }
  check(
    "Explicit retry enters existing schema6 room once",
    (await save()).schemaVersion === 6 &&
      (await save()).progress.interior.roomId === "aw2-room-village-tea" &&
      (await save()).revision === JSON.parse(outsideRaw).revision + 1,
  )
  phase = "room-map-layout"
  await atlas("aw2-zone-lantern-street")
  check(
    "Map names actual room and the exit-first route",
    (await page.getByTestId("overview-current-scene").textContent()).includes(
      "Tiệm trà",
    ) &&
      (await page.getByTestId("overview-walk").textContent()).includes(
        "Ra hiên",
      ) === false &&
      (await page.getByTestId("overview-walk").textContent()).includes(
        "ra hiên",
      ),
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
    for (const zone of [
      "aw2-zone-covenant-village",
      "aw2-zone-lantern-street",
      "aw2-zone-kitchen-table",
    ]) {
      await panel()
        .getByRole("combobox", {
          name: "Vùng trên bản đồ hành trình",
          exact: true,
        })
        .selectOption(zone)
      await panel()
        .getByRole("button", { name: "Đường đi", exact: true })
        .click()
      await fit(`${width}/20px inside map ${zone}`)
      await panel()
        .getByRole("button", { name: "Cửa nối", exact: true })
        .click()
      await fit(`${width}/20px inside connections ${zone}`)
      if (zone === "aw2-zone-covenant-village") {
        await panel()
          .getByRole("button", { name: "Tiệm trà", exact: true })
          .click()
        await fit(`${width}/20px inside tea stop`)
      }
    }
    if (width === 390) await capture("room-map-390")
  }
  check(
    "All room map projections retain exact room save",
    (await raw()) === roomRaw,
  )
  await close()
  await page.evaluate(() => (document.documentElement.style.fontSize = "16px"))
  await page.setViewportSize({ width: 1280, height: 900 })
  phase = "room-services-layout"
  await nativeWalk("aw2-object-tea-party-desk")
  await places("aw2-object-tea-party-desk")
  const pausedPosition = await page.getByTestId("player-position").textContent()
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
    for (const id of [
      "aw2-object-tea-exit",
      "aw2-object-tea-party-desk",
      "aw2-object-tea-journal-desk",
    ]) {
      await seekPlace(id)
      await fit(`${width}/20px place ${id}`)
    }
  }
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press(i < 6 ? "Tab" : "Shift+Tab")
    check(
      `Places focus trapped${i + 1}`,
      await panel().evaluate((d) => d.contains(document.activeElement)),
    )
  }
  await page.keyboard.down("w")
  await page.waitForTimeout(180)
  await page.keyboard.up("w")
  check(
    "Places pauses keyboard movement and has no writes",
    (await raw()) === roomRaw &&
      (await page.getByTestId("player-position").textContent()) ===
        pausedPosition,
  )
  await close()
  check(
    "Escape restores map focus",
    await map().evaluate((m) => document.activeElement === m),
  )
  await page.evaluate(() => (document.documentElement.style.fontSize = "16px"))
  await page.setViewportSize({ width: 1280, height: 900 })
  await inspect("aw2-object-tea-party-desk")
  await dialog()
    .getByRole("button", { name: "Xem đội đồng hành", exact: true })
    .click()
  await panel().waitFor()
  check(
    "Selected desk opens existing five-member party service",
    (await page.getByTestId("game-party").count()) === 1,
  )
  await close()
  await nativeWalk("aw2-object-tea-journal-desk")
  await inspect("aw2-object-tea-journal-desk")
  await dialog()
    .getByRole("button", { name: "Xem công thức", exact: true })
    .click()
  await page.getByTestId("tea-recipe").waitFor()
  check(
    "Selected journal desk opens actual recipe without write",
    (await raw()) === roomRaw,
  )
  await close()
  phase = "stale-tab"
  await places("aw2-object-tea-journal-desk")
  const second = await context.newPage()
  await second.goto(url)
  await second
    .locator(
      '[data-world-scene-state="active"] canvas[data-world-render-state="ready"]',
    )
    .waitFor()
  await second.getByRole("button", { name: "Thêm", exact: true }).click()
  await second
    .getByTestId("game-panel")
    .getByRole("button", { name: "Lưu vị trí", exact: true })
    .click()
  await page.getByRole("alert").waitFor()
  const changedRaw = await raw()
  check(
    "Other-tab save disables selected inspection and does not open stale dialog",
    (await panel()
      .getByRole("button", { name: "Xem tương tác", exact: true })
      .isDisabled()) &&
      (await dialog().count()) === 0 &&
      changedRaw !== roomRaw,
  )
  await close()
  await menu()
  await panel().getByRole("button", { name: "Đọc lại", exact: true }).click()
  await ready()
  await second.close()
  check(
    "Reread clears pending selection without auto interaction",
    (await raw()) === changedRaw && (await dialog().count()) === 0,
  )
  phase = "exit-first-walk"
  await atlas("aw2-zone-kitchen-table")
  await page.getByTestId("overview-walk").click()
  await arrive(48, 192)
  check(
    "Choosing an outdoor region only walks to room exit",
    (await save()).progress.interior !== null &&
      (await raw()) === changedRaw &&
      (await dialog().count()) === 0,
  )
  await inspect("aw2-object-tea-exit")
  await dialog().getByRole("button", { name: "Ra hiên", exact: true }).click()
  await dialog().waitFor({ state: "hidden" })
  await ready()
  check(
    "Explicit room exit restores exact outside checkpoint",
    (await save()).progress.interior === null &&
      (await save()).progress.x === checkpoint.x &&
      (await save()).progress.y === checkpoint.y &&
      (await save()).progress.facing === checkpoint.facing,
  )
  phase = "street-tea-directions-and-lock"
  await travel(616, "Phố Đèn Lồng")
  await atlas()
  await panel().getByRole("button", { name: "Tiệm trà", exact: true }).click()
  check(
    "Outside village tea direction targets local return door",
    (await page.getByTestId("overview-tea-walk").textContent()).includes(
      "cửa về Làng",
    ),
  )
  const streetRaw = await raw()
  await page.getByTestId("overview-tea-walk").click()
  await arrive(48, 192)
  check(
    "Tea route in street does not teleport or save",
    (await save()).progress.zoneId === "aw2-zone-lantern-street" &&
      (await raw()) === streetRaw &&
      (await dialog().count()) === 0,
  )
  await travel(616, "Sân Bếp Bỏ Quên")
  await places("aw2-zone-forgotten-kitchen-yard:exit:east")
  check(
    "Far locked door cannot start walking from Places",
    await panel()
      .getByRole("button", { name: "Đi tới địa điểm", exact: true })
      .isDisabled(),
  )
  await close()
  await go(592, 192)
  await inspect("aw2-zone-forgotten-kitchen-yard:exit:east")
  check(
    "Selected locked door explains gate and never grants travel",
    (await dialog()
      .getByRole("button", { name: "Đi qua", exact: true })
      .count()) === 0,
  )
  await close()
  phase = "historical-v6-all-regions"
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
    "Authentic completed schema6 opens without writes",
    (await raw()) === completed &&
      (await writes()) === 0 &&
      JSON.parse(completed).progress.questIndex === 4,
  )
  await atlas()
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
    for (const zone of [
      "aw2-zone-covenant-village",
      "aw2-zone-lantern-street",
      "aw2-zone-forgotten-kitchen-yard",
      "aw2-zone-kitchen-pantry",
      "aw2-zone-kitchen-hearth",
      "aw2-zone-kitchen-table",
    ]) {
      await panel()
        .getByRole("combobox", {
          name: "Vùng trên bản đồ hành trình",
          exact: true,
        })
        .selectOption(zone)
      await panel()
        .getByRole("button", { name: "Đường đi", exact: true })
        .click()
      await fit(`${width}/20px completed route ${zone}`)
      await panel()
        .getByRole("button", { name: "Cửa nối", exact: true })
        .click()
      await fit(`${width}/20px completed connections ${zone}`)
    }
  }
  await close()
  await page.evaluate(() => (document.documentElement.style.fontSize = "16px"))
  await page.setViewportSize({ width: 1280, height: 900 })
  check(
    "All six-region map views retain completed raw exactly",
    (await raw()) === completed,
  )
  for (const name of [
    "Phố Đèn Lồng",
    "Sân Bếp Bỏ Quên",
    "Phòng Kho",
    "Phòng Lửa",
    "Phòng Bàn",
  ])
    await travel(616, name)
  check(
    "Existing six-region route preserves completion,300XP and five spirits",
    (await save()).progress.questIndex === 4 &&
      (await save()).economy.teamExperience === 300 &&
      (await save()).progress.partyIds.length === 5,
  )
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
  await atlas()
  await panel().getByRole("button", { name: "Tiệm trà", exact: true }).click()
  await close()
  check(
    "Historical5 map/Places browsing keeps exact raw and never migrates implicitly",
    (await raw()) === historical && (await writes()) === 0,
  )
  phase = "classic-shared-panels"
  await page.goto(url.replace("game.html", "world.html"))
  await ready()
  check(
    "Classic nav has one real tea entrance and no duplicate scenic shortcut",
    (await page
      .getByRole("button", { name: "Đi tới Cửa tiệm trà", exact: true })
      .count()) === 1 &&
      (await page
        .getByRole("button", { name: "Hiên tiệm trà", exact: true })
        .count()) === 0,
  )
  await atlas()
  await panel().getByRole("button", { name: "Tiệm trà", exact: true }).click()
  await fit("Classic village tea atlas")
  await page.getByTestId("overview-tea-walk").click()
  await arrive(300, 80)
  await inspect("aw2-object-village-tea-door")
  await dialog()
    .getByRole("button", { name: "Vào tiệm trà", exact: true })
    .click()
  await dialog().waitFor({ state: "hidden" })
  await ready()
  const classicRaw = await raw()
  await places("aw2-object-tea-exit")
  await fit("Classic room place")
  await close()
  await atlas("aw2-zone-lantern-street")
  await fit("Classic room map")
  await page.getByTestId("overview-walk").click()
  await arrive(48, 192)
  await inspect("aw2-object-tea-exit")
  await dialog().getByRole("button", { name: "Ra hiên", exact: true }).click()
  await dialog().waitFor({ state: "hidden" })
  await ready()
  check(
    "Classic selected interactions share schema6 and preserve legacy story/economy",
    (await save()).schemaVersion === 6 &&
      JSON.stringify((await save()).economy) ===
        JSON.stringify(JSON.parse(classicRaw).economy),
  )
  finalRaw = await raw()
  check(
    "Legacy stable keys preserved",
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
        task: "AW2-016G",
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
          "Developer Chromium source/compiled; new Places/atlas/cue flow, real fresh intro/locked quest gate and authentic published v5/v6 fixtures. Full combat/mode engine acceptance reused from016F; No independent human/physical phone/FPS/total GPU memory/full mode-match/rights/release acceptance.",
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
