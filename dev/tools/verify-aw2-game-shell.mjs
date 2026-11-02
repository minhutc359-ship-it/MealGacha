import assert from "node:assert/strict"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { createHash } from "node:crypto"
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
  port = values.compiled ? 8623 : 8622,
  out = ".asset-work/aw2-015a",
  key = "aw2.development.save"
const url = `http://127.0.0.1:${port}/dev/aw2/game.html`,
  checks = [],
  errors = [],
  expectedErrors = [],
  captures = [],
  origins = []
const legacy = {
  "foodchest.tcg.v1": "015a-tcg",
  "foodchest.user.v1": "015a-user",
  "foodchest.tcg.v1.checkpoint.v4": "015a-checkpoint",
  "mealgacha.progress-journal.v4": "015a-journal",
  "mealgacha.progress-writer.v4": "015a-writer",
}
const hash = (s) => createHash("sha256").update(s).digest("hex")
const check = (name, condition = true) => {
  assert.ok(condition, name)
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
      server: { host: "127.0.0.1", port, strictPort: true },
    })
const { chromium } = await import(values.playwright)
let browser,
  page,
  phase = "bootstrap",
  fault = ""
try {
  if (!values.compiled) await server.listen()
  await mkdir(out, { recursive: true })
  browser = await chromium.launch({
    executablePath: values.chromium,
    headless: true,
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
    reducedMotion: "no-preference",
  })
  await context.addInitScript(() => {
    window.__shellWrites = 0
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (k, v) {
      if (k === "aw2.development.save") window.__shellWrites++
      return set.call(this, k, v)
    }
  })
  page = await context.newPage()
  page.on("pageerror", (e) => errors.push(e.message))
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
  page.on("response", (r) => {
    if (r.status() >= 400)
      (fault && new URL(r.url()).pathname === fault
        ? expectedErrors
        : errors
      ).push(`${r.status()} ${r.url()}`)
  })
  const raw = () => page.evaluate((k) => localStorage.getItem(k), key),
    save = async () => JSON.parse(await raw())
  const map = () => page.getByTestId("world-map"),
    canvas = () => map().locator("canvas"),
    panel = () => page.getByTestId("game-panel")
  const ready = async () => {
    await canvas().waitFor()
    await map().locator(".aw2-map-loading").waitFor({ state: "hidden" })
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="world-map"] canvas')?.dataset
          .worldCamera,
    )
  }
  const dock = (name) =>
    page
      .getByRole("navigation", { name: "Menu game", exact: true })
      .getByRole("button", { name, exact: true })
  const close = async () => {
    await page.keyboard.press("Escape")
    await panel().waitFor({ state: "hidden" })
  }
  const pos = () => page.getByTestId("player-position").textContent()
  const layout = async (label) => {
    const metrics = await page.evaluate(() => {
      const active = document.querySelector("dialog[open]"),
        scope = active ?? document.querySelector('[data-testid="game-shell"]')
      const visible = (n) =>
        n.getClientRects().length > 0 &&
        getComputedStyle(n).visibility !== "hidden"
      const buttons = [...scope.querySelectorAll("button")]
        .filter(visible)
        .map((n) => {
          const r = n.getBoundingClientRect()
          return {
            name: n.getAttribute("aria-label") || n.textContent,
            width: r.width,
            height: r.height,
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom,
          }
        })
      const overflows = active
        ? [
            active,
            ...active.querySelectorAll(
              ".aw2-panel-content,.aw2-panel-body,.aw2-panel-stack",
            ),
          ]
            .map((n) => ({
              name: n.className,
              scroll: n.scrollHeight,
              client: n.clientHeight,
            }))
            .filter((n) => n.scroll > n.client + 1)
        : []
      let representativeVisible = true
      if (!active) {
        const c = document.querySelector('[data-testid="world-map"] canvas'),
          stage = document.querySelector('[data-testid="game-map-stage"]')
        if (c && stage) {
          const v = JSON.parse(c.dataset.worldCamera),
            p = JSON.parse(c.dataset.partyPositions)[0],
            b = c.getBoundingClientRect(),
            r = stage.getBoundingClientRect()
          const x = b.left + (((p.x - v.x) * v.zoom + 320) / 640) * b.width,
            y = b.top + (((p.y - v.y) * v.zoom + 192) / 384) * b.height
          representativeVisible =
            x >= r.left && x <= r.right && y >= r.top + 44 && y <= r.bottom
        }
      }
      return {
        representativeVisible,
        width: innerWidth,
        height: innerHeight,
        document: [
          document.documentElement.scrollWidth,
          document.documentElement.scrollHeight,
        ],
        buttons,
        overflows,
      }
    })
    check(
      `${label}: representative remains inside the visible game viewport`,
      metrics.representativeVisible,
    )
    check(
      `${label}: document and core panel fit viewport`,
      metrics.document[0] <= metrics.width &&
        metrics.document[1] <= metrics.height &&
        !metrics.overflows.length,
    )
    check(
      `${label}: all visible native buttons retain44px and stay inside viewport`,
      metrics.buttons.length > 0 &&
        metrics.buttons.every(
          (b) =>
            b.width >= 43.9 &&
            b.height >= 43.9 &&
            b.left >= -0.5 &&
            b.right <= metrics.width + 0.5 &&
            b.top >= -0.5 &&
            b.bottom <= metrics.height + 0.5,
        ),
    )
    return metrics
  }
  const capture = async (name) => {
    const path = `${out}/${flavor}-${name}.png`
    await page.screenshot({ path, fullPage: false })
    captures.push(path)
  }
  const openQuest = async () => {
    await dock("Nhiệm vụ").click()
    await panel().waitFor()
  }
  const currentQuestPage = async (index) => {
    const nav = panel().getByRole("navigation", { name: "Phân trang Nhiệm vụ" })
    for (let i = 0; i < 4; i++) {
      const m = (await nav.textContent()).match(/Nhiệm vụ (\d)\/4/)
      if (+m[1] === index + 1) return
      await nav
        .getByRole("button", {
          name: +m[1] > index + 1 ? "Nhiệm vụ trước" : "Nhiệm vụ sau",
          exact: true,
        })
        .click()
    }
    throw Error("Quest selection did not converge")
  }
  const direction = async (index = 0) => {
    await openQuest()
    await currentQuestPage((await save()).progress.questIndex)
    await panel()
      .getByRole("button", { name: "Chỉ đường", exact: true })
      .click()
    const buttons = panel().getByRole("navigation", {
      name: "Phân trang Điểm đến",
    })
    if (await buttons.count()) {
      for (let i = 0; i < 3; i++) {
        const m = (await buttons.textContent()).match(/Điểm đến (\d)\/(\d)/)
        if (+m[1] === index + 1) break
        await buttons
          .getByRole("button", {
            name: +m[1] > index + 1 ? "Điểm đến trước" : "Điểm đến sau",
            exact: true,
          })
          .click()
      }
    }
    const target = panel().locator('[data-testid^="game-quest-walk-"]')
    const id = (await target.getAttribute("data-testid")).replace(
      "game-quest-walk-",
      "",
    )
    const before = await raw(),
      point = {
        x: +(await target.getAttribute("data-approach-x")),
        y: +(await target.getAttribute("data-approach-y")),
      }
    await target.click()
    await panel().waitFor({ state: "hidden" })
    check(
      `${phase}: directions close menu and return map focus`,
      await map().evaluate((n) => document.activeElement === n),
    )
    await page.waitForFunction(
      ({ x, y }) => {
        const m = document
          .querySelector('[data-testid="player-position"]')
          .textContent.match(/Vị trí (\d+), (\d+)/)
        return m && Math.abs(+m[1] - x) <= 1 && Math.abs(+m[2] - y) <= 1
      },
      point,
      { timeout: 15000 },
    )
    await map().focus()
    await page.keyboard.press("e")
    await page.getByRole("dialog").waitFor()
    check(
      `${phase}: approach alone preserves exact save`,
      (await raw()) === before,
    )
    return id
  }
  const action = async (name) => {
    await page
      .getByRole("dialog")
      .getByRole("button", { name, exact: true })
      .click()
    await page.getByRole("dialog").waitFor({ state: "hidden" })
    await ready()
  }
  const responsive = async (label) => {
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [844, 390],
      [1280, 720],
    ]) {
      await page.setViewportSize({ width, height })
      await layout(`${label}/${width}world`)
      for (const name of ["Nhiệm vụ", "Đội", "Túi", "Thêm"]) {
        const before = await raw()
        await dock(name).click()
        await panel().waitFor()
        await layout(`${label}/${width}/${name}`)
        if (name === "Nhiệm vụ") {
          for (const tab of ["Mục tiêu", "Chỉ đường", "Phần thưởng"]) {
            await panel()
              .getByRole("button", { name: tab, exact: true })
              .click()
            await layout(`${label}/${width}/quest-${tab}`)
          }
        }
        await capture(`${label}-${width}-${name}`)
        await close()
        check(
          `${label}/${width}/${name}: closing restores launcher focus with no save writes`,
          (await dock(name).evaluate((n) => document.activeElement === n)) &&
            (await raw()) === before,
        )
      }
    }
    await page.setViewportSize({ width: 390, height: 844 })
  }
  await page.goto(url)
  check(
    "Fresh fixed-viewport entry neither writes nor unlocks party",
    (await raw()) === null,
  )
  await page.evaluate(
    (legacy) =>
      Object.entries(legacy).forEach(([k, v]) => localStorage.setItem(k, v)),
    legacy,
  )
  await page
    .getByRole("button", { name: "Tạo bản lưu AW2", exact: true })
    .click()
  await ready()
  const original = await raw()
  await page.evaluate(
    () =>
      (window.__shellCanvas = document.querySelector(
        '[data-testid="world-map"] canvas',
      )),
  )
  phase = "newsave"
  await responsive("newsave")
  await map().focus()
  await page.keyboard.press("j")
  await panel().waitFor()
  const position = await pos(),
    motion = await canvas().getAttribute("data-npc-motion")
  await page.keyboard.down("d")
  await page.mouse.click(4, 400)
  await page.waitForTimeout(180)
  await page.keyboard.up("d")
  check(
    "Modal blocks world keys, backdrop click-through and NPC clock",
    (await pos()) === position &&
      (await canvas().getAttribute("data-npc-motion")) === motion,
  )
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab")
    assert.ok(await panel().evaluate((n) => n.contains(document.activeElement)))
  }
  check("Native dialog traps keyboard focus")
  await panel()
    .getByRole("button", { name: "Nhiệm vụ sau", exact: true })
    .click()
  const selected = await page.getByTestId("journal-quest-title").textContent()
  await close()
  await map().focus()
  await page.keyboard.press("j")
  await panel().waitFor()
  check(
    "Quest selection persists across Escape/J without progress duplication",
    (await page.getByTestId("journal-quest-title").textContent()) ===
      selected && (await raw()) === original,
  )
  await currentQuestPage(0)
  await panel().getByRole("button", { name: "Mục tiêu", exact: true }).click()
  await panel()
    .getByRole("button", { name: "Bỏ ghim mục tiêu", exact: true })
    .click()
  await close()
  check(
    "Local unpin changes only HUD, not save",
    (await page.getByTestId("quest-objective").textContent()) ===
      "Mở Nhật ký để ghim nhiệm vụ hiện tại." && (await raw()) === original,
  )
  await openQuest()
  await panel()
    .getByRole("button", { name: "Ghim mục tiêu", exact: true })
    .click()
  await close()
  check(
    "All menu opens retain the same authored Pixi canvas",
    await page.evaluate(
      () =>
        window.__shellCanvas ===
        document.querySelector('[data-testid="world-map"] canvas'),
    ),
  )
  await map().focus()
  await page.keyboard.down("d")
  await page.waitForTimeout(100)
  await page.keyboard.press("j")
  const stopped = await pos()
  await page.waitForTimeout(200)
  await page.keyboard.up("d")
  check("Opening J during real movement stops drift", (await pos()) === stopped)
  await close()
  await page.waitForTimeout(120)
  check("Closing menu does not restore held walking", (await pos()) === stopped)
  const tappedBefore = await raw(),
    point = (await pos()).match(/Vị trí (\d+), (\d+)/),
    tapX = +point[1] + 20,
    tapY = +point[2]
  await tapWorldPoint(page, tapX, tapY)
  await page.waitForFunction(
    ({ x, y }) => {
      const m = document
        .querySelector('[data-testid="player-position"]')
        .textContent.match(/Vị trí (\d+), (\d+)/)
      return m && Math.abs(+m[1] - x) <= 1 && Math.abs(+m[2] - y) <= 1
    },
    { x: tapX, y: tapY },
  )
  check(
    "Uniform canvas cover keeps inverse touch exact without saving",
    (await raw()) === tappedBefore,
  )
  phase = "intro"
  assert.equal(await direction(), "aw2-npc-giu-cho")
  await layout("NPCintro")
  await action("Nhận nhiệm vụ")
  assert.equal(await direction(), "aw2-object-village-table")
  await action("Đọc mảnh khăn")
  assert.equal(await direction(), "aw2-npc-giu-cho")
  await action("Hoàn tất nhập môn")
  check(
    "New shell explicit intro grants exactly five starters30XP once",
    (await save()).progress.questIndex === 1 &&
      (await save()).progress.partyIds.length === 5 &&
      (await save()).economy.teamExperience === 30,
  )
  phase = "starters"
  await responsive("starters")
  // UI text size test on actual canonical content, not invented quest state.
  await page.setViewportSize({ width: 320, height: 568 })
  await page.evaluate(() => (document.documentElement.style.fontSize = "20px"))
  await openQuest()
  await panel().getByRole("button", { name: "Mục tiêu", exact: true }).click()
  await layout("large-text20px")
  await close()
  await page.evaluate(() => (document.documentElement.style.fontSize = ""))
  await page.setViewportSize({ width: 390, height: 844 })
  // Real travel: first guide step approaches the village exit; crossing remains explicit.
  assert.equal(await direction(), "aw2-npc-va-den")
  await action("Đi qua")
  assert.equal(await direction(), "aw2-npc-va-den")
  await action("Nhận nhiệm vụ")
  await openQuest()
  await panel().getByRole("button", { name: "Chỉ đường", exact: true }).click()
  await layout("three-memory-directions")
  await close()
  assert.equal(await direction(2), "aw2-npc-dem-nuoc")
  await action("Ghi nhớ câu chuyện")
  await openQuest()
  await panel().getByRole("button", { name: "Mục tiêu", exact: true }).click()
  check(
    "NPC/HUD/Journal use the same actual two-memory remaining state",
    (await page.getByTestId("quest-objective").textContent()).includes(
      "còn 2",
    ) && (await panel().textContent()).includes("còn 2"),
  )
  await close()
  // Both current adapters remain functional, but their full fixed-viewport scene migration is explicitly out of this task.
  for (const [name, id] of [
    ["Ghé TCG", "tcg"],
    ["Ghé Auto Chess", "auto-chess"],
  ]) {
    await dock("Thêm").click()
    await panel().getByRole("button", { name, exact: true }).click()
    await page
      .getByRole("button", { name: "Trở về hành trình", exact: true })
      .waitFor()
    const checkpoint = await raw()
    await page
      .getByRole("button", { name: "Trở về hành trình", exact: true })
      .click()
    await ready()
    check(
      `${id}: existing scene returns exact world/save context to new shell`,
      (await raw()) === checkpoint,
    )
    await layout(`${id}return`)
  }
  const classicBefore = await raw()
  await page.goto(`http://127.0.0.1:${port}/dev/aw2/world.html`)
  await ready()
  check(
    "Parallel legacy world entry reads the exact shared save",
    (await raw()) === classicBefore &&
      (await page.getByTestId("game-shell").count()) === 0,
  )
  await page.getByTestId("room-waypoint-aw2-npc-nguoi-ban").click()
  await page.waitForFunction(() => {
    const m = document
      .querySelector('[data-testid="player-position"]')
      .textContent.match(/Vị trí (\d+), (\d+)/)
    return m && Math.abs(+m[1] - 280) <= 1 && Math.abs(+m[2] - 160) <= 1
  })
  await map().focus()
  await page.keyboard.press("e")
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Ghi nhớ câu chuyện", exact: true })
    .click()
  await page.getByRole("dialog").waitFor({ state: "hidden" })
  const classicAfter = await raw()
  assert.equal((await save()).progress.memories.length, 2)
  await page.goto(url)
  await ready()
  check(
    "Legacy explicit quest action is immediately shared by new HUD without backfill",
    (await raw()) === classicAfter &&
      (await page.getByTestId("quest-objective").textContent()).includes(
        "còn 1",
      ),
  )
  // Missing authored floor must not become a false ready UI.
  const scene = JSON.parse(
      await readFile(
        "src/aw2/assets/lantern-street.environment-v1.json",
        "utf8",
      ),
    ),
    earned = await raw()
  fault = scene.assets.floor.url
  await page.route(`**${fault}`, (r) =>
    r.fulfill({ status: 404, body: "015A floor fault" }),
  )
  await page.reload()
  await map().getByRole("alert").waitFor()
  await openQuest()
  await panel().getByRole("button", { name: "Chỉ đường", exact: true }).click()
  check(
    "Missing required floor disables journal directions with exact earned save",
    (await panel().locator('[data-testid^="game-quest-walk-"]').isDisabled()) &&
      (await raw()) === earned,
  )
  await close()
  await page.unroute(`**${fault}`)
  await page.reload()
  await ready()
  fault = ""
  check(
    "Recovered resource preserves exact earned bytes and no page overflow",
    (await raw()) === earned,
  )
  await layout("recoveredstreet")
  // Authentic historical completed checkpoint only, no historical assertions or forged progress.
  const originPath = `docs/aw2/evidence/AW2-008A-${flavor}-browser.json`,
    originText = await readFile(originPath, "utf8"),
    origin = JSON.parse(originText),
    completed = origin.observedRaw
  assert.equal(JSON.parse(completed).progress.questIndex, 4)
  origins.push({
    path: originPath,
    reportSha256: hash(originText),
    rawSha256: hash(completed),
    retainedAssertions: 0,
    scope:
      "Historical actual completed raw only; new UI projection/party/bag assertions fresh.",
  })
  await page.evaluate(
    ({ key, completed }) => localStorage.setItem(key, completed),
    { key, completed },
  )
  await page.reload()
  await ready()
  await openQuest()
  await panel()
    .getByRole("button", { name: "Phần thưởng", exact: true })
    .click()
  check(
    "Completed Journal reads real receipt/345XP without another reward",
    (await panel().textContent()).includes("đã nhận quà") &&
      (await save()).economy.teamExperience === 345,
  )
  await close()
  assert.equal(await raw(), completed)
  await dock("Đội").click()
  await panel()
    .getByLabel("Vị trí đội 1", { exact: true })
    .selectOption("aw2-lam")
  await panel()
    .getByRole("button", { name: "Lưu đội hình", exact: true })
    .click()
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("aw2.development.save")).progress
        .partyIds[0] === "aw2-lam",
  )
  await close()
  await ready()
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="world-map"] canvas')?.dataset
        .partyIds === JSON.stringify(["aw2-lam"]),
  )
  check(
    "Actual paged party editor preserves five combat units and one committed representative",
    (await save()).progress.partyIds.length === 5 &&
      JSON.stringify((await save()).economy) ===
        JSON.stringify(JSON.parse(completed).economy),
  )
  await dock("Túi").click()
  await panel().getByRole("button", { name: "Bếp", exact: true }).click()
  check(
    "Paged bag enforces actual remote-kitchen proximity",
    (await panel()
      .getByRole("button", { name: "Nấu Chén cơm ấm", exact: true })
      .isDisabled()) &&
      (await panel()
        .getByRole("button", { name: "Chia bữa · +45 EXP", exact: true })
        .isDisabled()),
  )
  await close()
  check(
    "Five legacy sentinels remain byte-identical",
    await page.evaluate(
      (legacy) =>
        Object.entries(legacy).every(([k, v]) => localStorage.getItem(k) === v),
      legacy,
    ),
  )
  check(
    "No unexpected page/resource/console/lifecycle errors",
    errors.length === 0,
  )
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-015A",
        status: "PASS",
        flavor,
        checks,
        freshAssertions: checks.length,
        retainedAssertions: 0,
        errors,
        expectedErrors,
        captures,
        origins,
        observedRaw: await raw(),
        limitations:
          "First opt-in exploration/menus only; full battle/TCG/Chess no-scroll migration015B NOT_RUN. Existing mode entry/return compatibility checked, no full new mode rounds/boss.30/100quest paging is unit fixture coverage, actual canon has4quests. Independent human/device/gamepad/FPS/rights NOT_RUN.",
      },
      null,
      2,
    ) + "\n",
  )
  console.log(`PASS ${flavor} ${checks.length}`)
} catch (error) {
  await mkdir(out, { recursive: true })
  await page
    ?.screenshot({ path: `${out}/${flavor}-failure.png` })
    .catch(() => {})
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-015A",
        status: "FAIL",
        flavor,
        phase,
        checks,
        errors,
        expectedErrors,
        captures,
        origins,
        error: String(error.stack || error),
        observedRaw: await page
          ?.evaluate((key) => localStorage.getItem(key), key)
          .catch(() => null),
      },
      null,
      2,
    ) + "\n",
  )
  throw error
} finally {
  await browser?.close()
  await server.close()
}
