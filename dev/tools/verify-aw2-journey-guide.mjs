import assert from "node:assert/strict"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"
import { tapWorldPoint } from "./aw2-world-browser-view.mjs"

const { values } = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
    compiled: { type: "boolean", default: false },
    "resume-team": { type: "string" },
  },
})
const flavor = values.compiled ? "compiled" : "source",
  port = values.compiled ? 8611 : 8610
const out = ".asset-work/aw2-008a",
  key = "aw2.development.save"
const url = `http://127.0.0.1:${port}/dev/aw2/world.html`
const origins = []
let retainedAssertions = 0
const checks = [],
  errors = [],
  expectedErrors = [],
  captures = [],
  snapshots = [],
  visited = new Set()
const legacy = {
  "foodchest.user.v1": "008a-user",
  "foodchest.tcg.v1": "008a-cards",
  "foodchest.tcg.v1.checkpoint.v4": "008a-checkpoint",
  "mealgacha.progress-journal.v4": "008a-journal",
  "mealgacha.progress-writer.v4": "008a-writer",
}
const digest = (value) => createHash("sha256").update(value).digest("hex")
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
  fault = "",
  bossTick = null,
  endingBranchRaw = null
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
    viewport: { width: 1280, height: 1000 },
    hasTouch: true,
    reducedMotion: "reduce",
  })
  await context.addInitScript(() => {
    const original = Storage.prototype.setItem
    window.__guideWrites = 0
    window.__guideBlock = false
    Storage.prototype.setItem = function (k, value) {
      if (k === "aw2.development.save") {
        if (window.__guideBlock) throw Error("008A simulated storage failure")
        window.__guideWrites++
      }
      return original.call(this, k, value)
    }
  })
  const watch = (p) => {
    p.on("pageerror", (e) => errors.push(e.message))
    p.on("console", (m) => {
      if (m.type() === "error")
        (fault &&
        /404|Failed to load|Error loading|Could not load/.test(m.text())
          ? expectedErrors
          : errors
        ).push(m.text())
      if (
        m.type() === "warning" &&
        /\[Assets\].*destroyed instead of unloaded|\[Cache\] already has key/.test(
          m.text(),
        )
      )
        errors.push(m.text())
    })
    p.on("response", (r) => {
      if (r.status() >= 400)
        (fault && new URL(r.url()).pathname === fault
          ? expectedErrors
          : errors
        ).push(`${r.status()} ${r.url()}`)
    })
  }
  page = await context.newPage()
  watch(page)
  const click = (name) =>
    page.getByRole("button", { name, exact: true }).click()
  const raw = () => page.evaluate((k) => localStorage.getItem(k), key)
  const save = async () => JSON.parse(await raw())
  const ready = async () => {
    await page
      .getByTestId("world-map")
      .locator("canvas[data-party-size='1']")
      .waitFor()
    await page
      .getByTestId("world-map")
      .locator(".aw2-map-loading")
      .waitFor({ state: "hidden" })
    visited.add((await save()).progress.zoneId)
  }
  const targetCard = (id) => page.locator(`[data-journey-target='${id}']`)
  const targetIds = () =>
    page
      .locator("[data-journey-target]")
      .evaluateAll((nodes) => nodes.map((n) => n.dataset.journeyTarget))
  const interact = async (action) => {
    await page.getByTestId("world-map").focus()
    await page.keyboard.press("e")
    await page.getByRole("dialog").waitFor()
    check(
      `${phase}: opening dialogue disables every journey direction`,
      await page
        .getByTestId("journey-directions")
        .getByRole("button")
        .evaluateAll((nodes) => nodes.every((n) => n.disabled)),
    )
    if (action) {
      await page
        .getByRole("dialog")
        .getByRole("button", { name: action, exact: true })
        .click()
      await page.getByRole("dialog").waitFor({ state: "hidden" })
    }
  }
  const walk = async (id, keyboard = false) => {
    await ready()
    const card = targetCard(id)
    await card.waitFor()
    const before = await raw(),
      writes = await page.evaluate(() => window.__guideWrites)
    if ((await card.getAttribute("data-journey-arrived")) !== "true") {
      const button = card.getByRole("button")
      await button.waitFor()
      await page.waitForFunction(
        (id) =>
          !document.querySelector(`[data-testid='journey-walk-${id}']`)
            ?.disabled,
        id,
      )
      if (keyboard) {
        await button.focus()
        await page.keyboard.press("Enter")
      } else await button.tap()
      check(
        `${phase}: ${id} walk restores actual map focus`,
        await page
          .getByTestId("world-map")
          .evaluate((node) => document.activeElement === node),
      )
      await page.waitForFunction(
        (id) =>
          document.querySelector(`[data-journey-target='${id}']`)?.dataset
            .journeyArrived === "true",
        id,
        { timeout: 15000 },
      )
    }
    check(
      `${phase}: ${id} approach never writes, travels or advances progress`,
      (await raw()) === before &&
        (await page.evaluate(() => window.__guideWrites)) === writes,
    )
  }
  const follow = async (id, keyboard = false) => {
    for (let i = 0; i < 6; i++) {
      await walk(id, keyboard)
      const zones = (
        await targetCard(id).getAttribute("data-journey-zones")
      ).split(",")
      if (zones.length === 1) return
      const next = zones[1]
      await interact("Đi qua")
      await page.waitForFunction(
        (next) =>
          JSON.parse(localStorage.getItem("aw2.development.save")).progress
            .zoneId === next,
        next,
      )
      await ready()
      check(
        `${phase}: explicit travel reaches ${next} and recomputes route`,
        (await targetCard(id).getAttribute("data-journey-zones")).split(
          ",",
        )[0] === next,
      )
    }
    throw Error("Route failed to terminate")
  }
  const manual = async (x, y) => {
    await ready()
    await page.getByTestId("world-map").scrollIntoViewIfNeeded()
    await tapWorldPoint(page, x, y)
    await page.waitForFunction(
      ({ x, y }) => {
        const m = document
          .querySelector('[data-testid="player-position"]')
          .textContent.match(/Vị trí (\d+), (\d+)/)
        return m && Math.abs(+m[1] - x) <= 1 && Math.abs(+m[2] - y) <= 1
      },
      { x, y },
    )
  }
  const responsive = async (label) => {
    const before = await raw()
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 900 })
      const layout = await page
        .getByTestId("journey-directions")
        .evaluate((node) => {
          const buttons = [...node.querySelectorAll("button")].map((b) => {
            const r = b.getBoundingClientRect()
            return {
              width: r.width,
              height: r.height,
              left: r.left,
              right: r.right,
            }
          })
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            buttons,
          }
        })
      check(
        `${label}: ${width}px directions fit viewport with44px native controls`,
        !layout.overflow &&
          layout.buttons.length > 0 &&
          layout.buttons.every(
            (b) =>
              b.width >= 44 &&
              b.height >= 44 &&
              b.left >= 0 &&
              b.right <= width,
          ),
      )
      await page.getByTestId("journey-directions").scrollIntoViewIfNeeded()
      const path = `${out}/${flavor}-${label}-${width}.png`
      await page.screenshot({ path, fullPage: false })
      captures.push(path)
    }
    await page.setViewportSize({ width: 1280, height: 1000 })
    check(
      `${label}: resize and rendering do not save`,
      (await raw()) === before,
    )
  }
  const resourceChecks = async (manifestPath, label) => {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")),
      assetUrl = manifest.assets.floor.url
    const before = await raw(),
      targets = await targetIds()
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    const handler = async (route) => {
      await gate
      await route.continue().catch(() => {})
    }
    await page.route(`**${assetUrl}`, handler)
    await page.reload()
    await page.getByTestId("world-map").getByRole("status").waitFor()
    check(
      `${label}: actual delayed scene load disables all guide controls`,
      await page
        .getByTestId("journey-directions")
        .getByRole("button")
        .evaluateAll(
          (nodes) => nodes.length > 0 && nodes.every((n) => n.disabled),
        ),
    )
    release()
    await ready()
    await page.unroute(`**${assetUrl}`, handler)
    check(
      `${label}: correct scene readiness enables guide after load without writes`,
      (await raw()) === before &&
        (await page
          .getByTestId("journey-directions")
          .getByRole("button")
          .evaluateAll((nodes) => nodes.some((n) => !n.disabled))),
    )
    fault = assetUrl
    await page.route(`**${assetUrl}`, (route) =>
      route.fulfill({ status: 404, body: "008A required scenery fault" }),
    )
    await page.reload()
    await page.getByTestId("world-map").getByRole("alert").waitFor()
    check(
      `${label}: missing required scene keeps directions disabled and exact save`,
      (await raw()) === before &&
        (await page
          .getByTestId("journey-directions")
          .getByRole("button")
          .evaluateAll((nodes) => nodes.every((n) => n.disabled))),
    )
    await page.unroute(`**${assetUrl}`)
    await page.reload()
    await ready()
    fault = ""
    assert.deepEqual(await targetIds(), targets)
    check(
      `${label}: resource recovery recreates correct guide with exact save`,
      (await raw()) === before,
    )
  }
  if (values["resume-team"]) {
    const path = values["resume-team"],
      text = await readFile(path, "utf8"),
      prior = JSON.parse(text),
      earned = JSON.parse(prior.observedRaw)
    assert.equal(prior.flavor, flavor)
    assert.equal(prior.errors.length, 0)
    assert.equal(
      prior.checks.at(-1),
      "Ready new leader keeps one map representative, five party members and exact economy",
    )
    assert.equal(earned.progress.questIndex, 1)
    assert.equal(earned.progress.accepted, false)
    assert.equal(earned.economy.teamExperience, 30)
    assert.equal(earned.progress.partyIds[0], "aw2-than")
    retainedAssertions = prior.checks.length
    checks.push(...prior.checks)
    captures.push(...prior.captures)
    expectedErrors.push(...prior.expectedErrors)
    origins.push({
      path,
      reportSha256: digest(text),
      rawSha256: digest(prior.observedRaw),
      retainedAssertions,
      scope:
        "Current-task verified prefix only. Initial immediate team-restore read failed before commit/render; exact native earned stored checkpoint already contains committed original party. Wait corrected; remaining checks fresh on unchanged runtime.",
    })
    await page.goto(url)
    await page.evaluate(
      ({ key, value, legacy }) => {
        localStorage.setItem(key, value)
        Object.entries(legacy).forEach(([k, v]) => localStorage.setItem(k, v))
      },
      { key, value: prior.observedRaw, legacy },
    )
    await page.reload()
    await ready()
    check(
      "Exact native earned team-restored checkpoint loads with ready directions",
      (await raw()) === prior.observedRaw &&
        (await targetCard("aw2-npc-va-den").getByRole("button").isEnabled()),
    )
  } else {
    await page.goto(url)
    check(
      "Fresh profile does not create a save or show mandatory targets",
      (await raw()) === null &&
        (await page.locator("[data-journey-target]").count()) === 0,
    )
    await page.evaluate(
      (legacy) =>
        Object.entries(legacy).forEach(([k, v]) => localStorage.setItem(k, v)),
      legacy,
    )
    await click("Tạo bản lưu AW2")
    await ready()
    phase = "intro"
    assert.deepEqual(await targetIds(), ["aw2-npc-giu-cho"])
    await responsive("intro")
    await resourceChecks(
      "src/aw2/assets/covenant-village.environment-v2.json",
      "village",
    )
    const initial = await raw()
    await page.evaluate(() => {
      window.__guideBlock = true
    })
    await click("Lưu vị trí")
    await page
      .getByRole("alert")
      .filter({ hasText: "Chưa lưu được AW2" })
      .waitFor()
    check(
      "Save failure disables directions without altering saved bytes",
      (await targetCard("aw2-npc-giu-cho").getByRole("button").isDisabled()) &&
        (await raw()) === initial,
    )
    await page.evaluate(() => {
      window.__guideBlock = false
    })
    await click("Đọc lại")
    await ready()
    check(
      "Reread recovers real map readiness and directions",
      (await targetCard("aw2-npc-giu-cho").getByRole("button").isEnabled()) &&
        (await raw()) === initial,
    )
    const second = await context.newPage()
    watch(second)
    await second.goto(url)
    await second.getByTestId("world-map").locator("canvas").waitFor()
    await second
      .getByRole("button", { name: "Lưu vị trí", exact: true })
      .click()
    await page.getByRole("alert").filter({ hasText: "tab khác" }).waitFor()
    check(
      "Another-tab write disables directions until explicit reread",
      await targetCard("aw2-npc-giu-cho").getByRole("button").isDisabled(),
    )
    await second.close()
    await click("Đọc lại")
    await ready()
    await follow("aw2-npc-giu-cho", true)
    await interact()
    const beforeDialog = await raw()
    await page.keyboard.press("Escape")
    check(
      "Closing an arrival dialogue grants no action",
      (await raw()) === beforeDialog,
    )
    await interact("Nhận nhiệm vụ")
    assert.deepEqual(await targetIds(), ["aw2-object-village-table"])
    await follow("aw2-object-village-table")
    await interact("Đọc mảnh khăn")
    await follow("aw2-npc-giu-cho")
    await interact("Hoàn tất nhập môn")
    check(
      "Guided native intro grants exactly five starters30XP once",
      (await save()).progress.partyIds.length === 5 &&
        (await save()).economy.teamExperience === 30,
    )
    for (const mode of ["TCG", "Auto Chess"]) {
      const prior = await save()
      await click(`Ghé nhanh ${mode}`)
      await page
        .getByRole("button", { name: "Trở về hành trình", exact: true })
        .waitFor()
      const checkpoint = await raw()
      check(
        `${mode}: actual mode unmounts objective navigation without grants`,
        (await page.locator("[data-journey-target]").count()) === 0 &&
          JSON.stringify((await save()).economy) ===
            JSON.stringify(prior.economy),
      )
      await click("Trở về hành trình")
      await ready()
      check(
        `${mode}: returning remounts ready directions at exact saved checkpoint`,
        (await raw()) === checkpoint &&
          (await targetIds())[0] === "aw2-npc-va-den",
      )
    }
    // Change the committed representative using the real team editor and hold its actual texture request.
    await page.locator(".aw2-bag-panel > summary").click()
    const beforeTeam = await save()
    await page
      .getByLabel("Vị trí đội 1", { exact: true })
      .selectOption("aw2-lam")
    const lam = JSON.parse(
      await readFile("src/aw2/assets/lam.base-v1.json", "utf8"),
    )
    let releaseLeader
    const leaderGate = new Promise((resolve) => {
      releaseLeader = resolve
    })
    const leaderHold = async (route) => {
      await leaderGate
      await route.continue().catch(() => {})
    }
    await page.route(`**${lam.assets.world.url}`, leaderHold)
    await click("Lưu đội hình")
    await page.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem("aw2.development.save")).progress
          .partyIds[0] === "aw2-lam",
    )
    await page.getByTestId("world-map").getByRole("status").waitFor()
    check(
      "New saved leader cannot use previous leader readiness while texture loads",
      await targetCard("aw2-npc-va-den").getByRole("button").isDisabled(),
    )
    releaseLeader()
    await ready()
    await page.unroute(`**${lam.assets.world.url}`, leaderHold)
    check(
      "Ready new leader keeps one map representative, five party members and exact economy",
      (await page
        .getByTestId("world-map")
        .locator("canvas")
        .getAttribute("data-party-ids")) === JSON.stringify(["aw2-lam"]) &&
        (await save()).progress.partyIds.length === 5 &&
        JSON.stringify((await save()).economy) ===
          JSON.stringify(beforeTeam.economy),
    )
    await page
      .getByLabel("Vị trí đội 1", { exact: true })
      .selectOption("aw2-than")
    await click("Lưu đội hình")
    await ready()
    await page.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem("aw2.development.save")).progress
          .partyIds[0] === "aw2-than",
    )
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="world-map"] canvas')?.dataset
          .partyIds === JSON.stringify(["aw2-than"]),
    )
    assert.deepEqual(
      (await save()).progress.partyIds,
      beforeTeam.progress.partyIds,
    )
    await page.locator(".aw2-bag-panel > summary").click()
  }
  phase = "memories"
  await follow("aw2-npc-va-den", true)
  await interact("Nhận nhiệm vụ")
  assert.deepEqual(await targetIds(), [
    "aw2-npc-nguoi-ban",
    "aw2-npc-sua-ghe",
    "aw2-npc-dem-nuoc",
  ])
  check("All three remaining memory targets stay freely selectable")
  await responsive("memories")
  await resourceChecks(
    "src/aw2/assets/lantern-street.environment-v1.json",
    "street",
  )
  for (const id of [
    "aw2-npc-dem-nuoc",
    "aw2-npc-nguoi-ban",
    "aw2-npc-sua-ghe",
  ]) {
    await follow(id)
    await interact("Ghi nhớ câu chuyện")
    check(
      `${id}: remembered target disappears without forcing the other order`,
      !(await targetIds()).includes(id),
    )
  }
  await follow("aw2-npc-va-den")
  await interact("Người trở lại")
  check(
    "Memory hand-in preserves actual80XP",
    (await save()).economy.teamExperience === 80,
  )
  phase = "hearth"
  await follow("aw2-npc-gac-bep")
  check(
    "Unaccepted hearth objective points to Di rather than locked pantry",
    (await targetCard("aw2-npc-gac-bep").getAttribute("data-journey-step")) ===
      "aw2-npc-gac-bep",
  )
  await interact("Nhận nhiệm vụ")
  await follow("aw2-object-hearth-hint")
  await interact("Ghi lại gợi ý")
  // Optional existing chest, explicitly opened through its native room control.
  await page.getByTestId("room-waypoint-aw2-chest-pantry").tap()
  await page.waitForFunction(() => {
    const m = document
      .querySelector('[data-testid="player-position"]')
      .textContent.match(/Vị trí (\d+), (\d+)/)
    return m && Math.abs(+m[1] - 432) <= 1 && Math.abs(+m[2] - 304) <= 1
  })
  await interact("Mở rương nguyên liệu")
  await page
    .getByTestId("room-waypoint-aw2-zone-kitchen-pantry:exit:east")
    .tap()
  await page.waitForFunction(() => {
    const m = document
      .querySelector('[data-testid="player-position"]')
      .textContent.match(/Vị trí (\d+), (\d+)/)
    return m && Math.abs(+m[1] - 616) <= 1 && Math.abs(+m[2] - 192) <= 1
  })
  await interact("Đi qua")
  await ready()
  await resourceChecks(
    "src/aw2/assets/kitchen-hearth.environment-v2.json",
    "hearth",
  )
  for (const [step, label] of [
    [0, "Mở lối thoát"],
    [1, "Đặt nồi"],
    [2, "Nhóm lửa"],
  ]) {
    const id = `aw2-object-steam-${step}`
    assert.deepEqual(await targetIds(), [id])
    await follow(id)
    await interact(label)
    check(
      `Puzzle guide follows actual step${step + 1} without solving on arrival`,
      (await save()).progress.puzzleStep === step + 1,
    )
    if (step === 0) {
      const p = await raw()
      await page.reload()
      await ready()
      check(
        "Partial puzzle reload restores only the actual next step",
        (await raw()) === p && (await targetIds())[0] === "aw2-object-steam-1",
      )
    }
  }
  await follow("aw2-npc-gac-bep")
  await interact("Báo đã mở bếp")
  check(
    "Hearth hand-in uses actual160XP",
    (await save()).economy.teamExperience === 160,
  )
  await page.locator(".aw2-bag-panel > summary").click()
  await page.getByText("Nấu và chia một bữa ấm", { exact: true }).click()
  await click("Nấu Chén cơm ấm")
  await click("Chia bữa · +45 EXP")
  await page
    .getByRole("status")
    .filter({ hasText: "Bữa ăn được chia sẻ" })
    .waitFor()
  check(
    "Existing proximity cooking earns205XP through explicit actions",
    (await save()).economy.teamExperience === 205,
  )
  phase = "boss"
  await follow("aw2-npc-gac-bep")
  await interact("Nhận nhiệm vụ")
  await follow("aw2-enemy-forgotten-host")
  await interact("Bắt đầu thử thách")
  const battle = page.getByTestId("world-battle").locator("canvas")
  await page
    .getByRole("status")
    .filter({ hasText: "Năm atlas chiến đấu đã tải" })
    .waitFor()
  await click("Tạm dừng")
  const checkpoint = await raw()
  for (
    let i = 0;
    i < 180 && (await battle.getAttribute("data-status")) === "active";
    i++
  ) {
    if (+(await battle.getAttribute("data-tick")) >= 5)
      for (const id of ["than", "lua", "lam", "moc-non", "suong"]) {
        const ultimate = page.getByTestId(`world-ultimate-aw2-${id}`)
        if (await ultimate.isEnabled()) await ultimate.click()
      }
    if ((await battle.getAttribute("data-status")) === "active") {
      const tick = +(await battle.getAttribute("data-tick"))
      await click("Bước 1 nhịp")
      await page.waitForFunction(
        (tick) =>
          +document.querySelector('[data-testid="world-battle"] canvas').dataset
            .tick ===
          tick + 1,
        tick,
      )
    }
  }
  check(
    "Fresh guided journey wins actual boss with no save until commit",
    (await battle.getAttribute("data-status")) === "player-win" &&
      (await raw()) === checkpoint,
  )
  bossTick = +(await battle.getAttribute("data-tick"))
  await click("Lưu kết quả và trở về")
  await ready()
  check(
    "Only explicit victory commit changes objective to the real note",
    (await save()).progress.bossDefeated &&
      (await targetIds())[0] === "aw2-object-table-note",
  )
  phase = "return"
  await follow("aw2-object-table-note")
  await interact("Đọc ghi chép")
  const idsBefore = await targetIds()
  assert.deepEqual(idsBefore, ["aw2-npc-giu-cho"])
  check(
    "Final return does not suggest unearned shortcut",
    !(
      await targetCard("aw2-npc-giu-cho").getAttribute("data-journey-step")
    ).includes("shortcut"),
  )
  await responsive("return")
  await follow("aw2-npc-giu-cho", true)
  await click("Lưu vị trí")
  await page
    .getByRole("status")
    .filter({ hasText: "Đã lưu vị trí AW2." })
    .waitFor()
  endingBranchRaw = await raw()
  snapshots.push({
    stage: "earned-preending",
    raw: endingBranchRaw,
    sha256: digest(endingBranchRaw),
  })
  for (const [choice, label] of [
    ["wait", "Để ghế trống chờ"],
    ["share", "Mời cả làng dùng bữa"],
  ]) {
    if (choice === "share") {
      await page.evaluate(
        ({ key, value }) => localStorage.setItem(key, value),
        { key, value: endingBranchRaw },
      )
      await page.reload()
      await ready()
    }
    await interact(label)
    check(
      `${choice}: explicit ending removes mandatory directions and grants345XP once`,
      (await page.locator("[data-journey-target]").count()) === 0 &&
        (await save()).progress.endingChoice === choice &&
        (await save()).economy.teamExperience === 345 &&
        (await save()).economy.receipts.length === 5,
    )
    const completed = await raw()
    await page.reload()
    await ready()
    check(
      `${choice}: exact completed save reload invents no quest destination`,
      (await raw()) === completed &&
        (await page.locator("[data-journey-target]").count()) === 0,
    )
  }
  check("Actual guided route visits all six scenic regions", visited.size === 6)
  check(
    "Legacy keys remain byte-identical",
    await page.evaluate(
      (legacy) =>
        Object.entries(legacy).every(([k, v]) => localStorage.getItem(k) === v),
      legacy,
    ),
  )
  check(
    "No unexpected page/console/resource/lifecycle errors",
    errors.length === 0,
  )
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-008A",
        status: "PASS",
        flavor,
        checks,
        freshAssertions: checks.length - retainedAssertions,
        retainedAssertions,
        origins,
        errors,
        expectedErrors,
        captures,
        visited: [...visited],
        bossTick,
        snapshots,
        observedRaw: await raw(),
        limitations:
          "Native automated guided journey including actual boss and both ending branches from the same earned preending save. Source fresh; optional compiled current-task prefix checkpoint composition is recorded in origins. No independent human/phone/rights acceptance; old detailed engine/mode/art evidence retained only by hashes.",
      },
      null,
      2,
    ) + "\n",
  )
  console.log(`PASS ${flavor}: ${checks.length} assertions`)
} catch (error) {
  await mkdir(out, { recursive: true })
  await page
    ?.screenshot({ path: `${out}/${flavor}-failure.png`, fullPage: false })
    .catch(() => {})
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-008A",
        status: "FAIL",
        flavor,
        phase,
        checks,
        errors,
        expectedErrors,
        captures,
        snapshots,
        bossTick,
        failure: String(error.stack || error),
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
