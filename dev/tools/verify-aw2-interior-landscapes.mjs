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
    "resume-rematch": { type: "string" },
  },
})
const flavor = values.compiled ? "compiled" : "source",
  port = values.compiled ? 8549 : 8548,
  out = ".asset-work/aw2-006l",
  key = "aw2.development.save",
  url = `http://127.0.0.1:${port}/dev/aw2/world.html`
const server = values.compiled
  ? await preview({
      configFile: "dev/vite.aw2.config.ts",
      preview: { host: "127.0.0.1", port, strictPort: true },
    })
  : await createServer({
      configFile: "dev/vite.dev.config.ts",
      server: { host: "127.0.0.1", port, strictPort: true },
    })
const { chromium } = await import(values.playwright),
  checks = [],
  errors = [],
  expectedErrors = [],
  requests = [],
  captures = [],
  origins = []
const legacy = {
  "foodchest.user.v1": "006l-original-user",
  "foodchest.tcg.v1": "006l-original-cards",
  "foodchest.tcg.v1.checkpoint.v4": "006l-checkpoint",
  "mealgacha.progress-journal.v4": "006l-journal",
  "mealgacha.progress-writer.v4": "006l-writer",
}
const check = (name, ok = true) => {
  assert.ok(ok, name)
  checks.push(name)
  console.log(name)
}
const hash = (s) => createHash("sha256").update(s).digest("hex")
let browser,
  page,
  phase = "bootstrap",
  fault = "",
  bossTick = null
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
  const watch = (p) => {
    p.on("request", (r) => requests.push(new URL(r.url()).pathname))
    p.on("pageerror", (e) => errors.push(e.message))
    p.on("console", (m) => {
      if (m.type() === "error")
        (fault &&
        /404|Failed to load|Error loading|Could not load/.test(m.text())
          ? expectedErrors
          : errors
        ).push(m.text())
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
  await page.goto(url)
  const inputPath =
      values["resume-rematch"] ??
      `docs/aw2/evidence/AW2-006HJK-${flavor}-prechest.json`,
    input = await readFile(inputPath, "utf8"),
    inputReport = JSON.parse(input),
    earnedRaw = inputReport.observedRaw,
    earned = JSON.parse(earnedRaw)
  if (values["resume-rematch"]) {
    assert.equal(inputReport.task, "AW2-006L")
    assert.equal(inputReport.flavor, flavor)
    assert.equal(inputReport.errors.length, 0)
    assert.equal(
      inputReport.checks.at(-1),
      "Earned ending opens actual yard-to-table shortcut",
    )
    assert.equal(earned.progress.zoneId, "aw2-zone-kitchen-table")
    assert.equal(earned.progress.questIndex, 4)
    assert.equal(earned.economy.teamExperience, 345)
    checks.push(...inputReport.checks)
    expectedErrors.push(...inputReport.expectedErrors)
    bossTick = inputReport.bossTick
  } else {
    assert.equal(earned.progress.zoneId, "aw2-zone-kitchen-pantry")
    assert.equal(earned.progress.questIndex, 2)
    assert.equal(earned.progress.hintRead, true)
    assert.equal(earned.progress.puzzleStep, 0)
    assert.equal(earned.economy.teamExperience, 80)
  }
  origins.push({
    path: inputPath,
    reportSha256: hash(input),
    rawSha256: hash(earnedRaw),
    retainedAssertions: values["resume-rematch"]
      ? inputReport.checks.length
      : 0,
    parent: inputReport.origins ?? null,
    scope: values["resume-rematch"]
      ? "Retain44 verified current-task prefix assertions on frozen c24de0805c292c6dd84f1201712ef7ffe401b4f25925ea567a7f9e4084d8af66 inputs. Exact native earned safe rematch checkpoint restored; rerun failed selector boundary only, no HP/quest/party edits."
      : "Exact historical earned chest/hint checkpoint; no historical assertions added. Fresh focused checks from native earned state.",
  })
  await page.evaluate(
    ({ key, raw, legacy }) => {
      localStorage.setItem(key, raw)
      Object.entries(legacy).forEach(([k, v]) => localStorage.setItem(k, v))
    },
    { key, raw: earnedRaw, legacy },
  )
  await page.reload()
  const raw = () => page.evaluate((key) => localStorage.getItem(key), key),
    save = async () => JSON.parse(await raw()),
    map = () => page.getByTestId("world-map"),
    canvas = () => map().locator("canvas")
  const ready = async () => {
    await page.waitForFunction(() => {
      const c = document.querySelector('[data-testid="world-map"] canvas'),
        s = JSON.parse(localStorage.getItem("aw2.development.save"))
      return (
        c?.dataset.sceneId ===
          `aw2-environment-${s.progress.zoneId.replace("aw2-zone-", "")}-${
            [
              "aw2-zone-kitchen-hearth",
              "aw2-zone-kitchen-table",
              "aw2-zone-covenant-village",
            ].includes(s.progress.zoneId)
              ? "v2"
              : "v1"
          }` &&
        c.dataset.worldCamera &&
        c.dataset.partyIds === JSON.stringify(s.progress.partyIds.slice(0, 1))
      )
    })
    await map().locator(".aw2-map-loading").waitFor({ state: "hidden" })
  }
  const arrive = (x, y) =>
    page.waitForFunction(
      ({ x, y }) => {
        const m = document
          .querySelector('[data-testid="player-position"]')
          ?.textContent.match(/Vị trí (\d+), (\d+)/)
        return m && Math.abs(+m[1] - x) <= 1 && Math.abs(+m[2] - y) <= 1
      },
      { x, y },
    )
  const go = async (x, y) => {
    await ready()
    await tapWorldPoint(page, x, y)
    await arrive(x, y)
  }
  const click = (name) =>
    page.getByRole("button", { name, exact: true }).click()
  const interact = async (name) => {
    await map().focus()
    await page.keyboard.press("e")
    await page.getByRole("dialog").waitFor()
    if (name) {
      await page
        .getByRole("dialog")
        .getByRole("button", { name, exact: true })
        .click()
      await page.getByRole("dialog").waitFor({ state: "hidden" })
    }
  }
  const travel = async (x, name) => {
    await go(x, 192)
    await interact("Đi qua")
    await page.getByTestId("zone-name").filter({ hasText: name }).waitFor()
    await ready()
  }
  const view = async (mode) => {
    await click(mode === "overview" ? "Toàn cảnh" : "Bám nhân vật")
    await page.waitForFunction(
      (mode) =>
        JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas').dataset
            .worldCamera,
        ).mode === mode,
      mode,
    )
  }
  const props = async () =>
    JSON.parse(await canvas().getAttribute("data-interaction-props"))
  const capture = async (name) => {
    await map().scrollIntoViewIfNeeded()
    const path = `${out}/${flavor}-${name}.png`
    await page.screenshot({ path, fullPage: true })
    captures.push(path)
  }
  const scenery = async (zone, expectedProps, target) => {
    phase = `scenery-${zone}`
    await ready()
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="world-map"] canvas')?.dataset
          .foregroundAlpha,
    )
    const before = await raw(),
      p = await save(),
      menu = page.getByTestId(
        `${zone === "kitchen-hearth" ? "hearth" : "table"}-room-waypoints`,
      )
    check(
      `${zone}: v2 scene, all authored objects and one committed map leader/five saved combat members`,
      (await canvas().getAttribute("data-scene-id")) ===
        `aw2-environment-${zone}-v2` &&
        (await props()).length === expectedProps &&
        (await canvas().getAttribute("data-party-size")) === "1" &&
        p.progress.partyIds.length === 5,
    )
    const wp = page.getByTestId(`room-waypoint-${target.id}`)
    await wp.focus()
    await wp.press("Enter")
    await arrive(target.x, target.y + 32)
    check(
      `${zone}: keyboard native destination approaches silhouette safely, restores focus and grants nothing`,
      (await map().evaluate((e) => e === document.activeElement)) &&
        (await page.getByRole("dialog").count()) === 0 &&
        (await raw()) === before,
    )
    await view("overview")
    await capture(`${zone}-overview`)
    await view("follow")
    await go(128, 256)
    check(
      `${zone}: inverse camera touch reaches canonical destination without writing`,
      (await raw()) === before,
    )
    await view("overview")
    const position = await page.getByTestId("player-position").textContent()
    await tapWorldPoint(page, -80, 192)
    await page.waitForTimeout(180)
    check(
      `${zone}: decorative apron tap cannot leave logical walkfield or write`,
      (await page.getByTestId("player-position").textContent()) === position &&
        (await raw()) === before,
    )
    await view("follow")
    await go(364, 320)
    await page.waitForFunction(
      () =>
        +document.querySelector('[data-testid="world-map"] canvas').dataset
          .foregroundAlpha < 1,
    )
    check(
      `${zone}: furniture fades from inverse-transformed real actor bounds`,
      +(await canvas().getAttribute("data-foreground-alpha")) === 0.35,
    )
    await go(364, 364)
    await go(320, 364)
    await page.waitForFunction(
      () =>
        +document.querySelector('[data-testid="world-map"] canvas').dataset
          .foregroundAlpha === 1,
    )
    const depth = JSON.parse(await canvas().getAttribute("data-ground-depths"))
    check(
      `${zone}: south detour respects collision and restores foreground depth`,
      depth.actors[0] > depth.prop && (await raw()) === before,
    )
    await go(320, 240)
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 900 })
      await map().scrollIntoViewIfNeeded()
      await page.waitForTimeout(100)
      const layout = await map().evaluate((e) => {
        const c = e.querySelector("canvas").getBoundingClientRect()
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          labels: [...e.querySelectorAll("[data-world-label]")]
            .filter((l) => getComputedStyle(l).visibility === "visible")
            .every((l) => {
              const b = l.getBoundingClientRect()
              return (
                b.left >= c.left - 1 &&
                b.right <= c.right + 1 &&
                b.top >= c.top - 1 &&
                b.bottom <= c.bottom + 1
              )
            }),
        }
      })
      check(
        `${zone}: ${width}px labels fit actual canvas and native controls have44px targets`,
        !layout.overflow &&
          layout.labels &&
          (await menu
            .getByRole("button")
            .evaluateAll((bs) =>
              bs.every((b) => b.getBoundingClientRect().height >= 44),
            )),
      )
      await capture(`${zone}-${width}`)
    }
    await page.setViewportSize({ width: 1280, height: 1000 })
    await go(target.x, target.y + 32)
    await interact()
    check(
      `${zone}: open interaction pauses room navigation and view controls`,
      (await menu
        .getByRole("button")
        .evaluateAll((bs) => bs.every((b) => b.disabled))) &&
        (await page
          .getByRole("button", { name: "Toàn cảnh", exact: true })
          .isDisabled()),
    )
    await page.keyboard.press("Escape")
    await click("Lưu vị trí")
    await page
      .getByRole("status")
      .filter({ hasText: "Đã lưu vị trí AW2." })
      .waitFor()
    const earnedRoom = await raw()
    origins.push({
      stage: zone,
      rawSha256: hash(earnedRoom),
      scope:
        "Current task native travel, explicitly saved position; exact copy into isolated error/recovery context.",
    })
    const failContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
      }),
      failed = await failContext.newPage()
    watch(failed)
    fault = `/dev/aw2/assets/environments/${zone}/v2/landscape.webp`
    await failed.route(`**${fault}`, (r) =>
      r.fulfill({ status: 404, body: "Deliberate006Lrequired floor failure" }),
    )
    await failed.goto(url)
    await failed.evaluate(
      ({ key, raw, legacy }) => {
        localStorage.setItem(key, raw)
        Object.entries(legacy).forEach(([k, v]) => localStorage.setItem(k, v))
      },
      { key, raw: earnedRoom, legacy },
    )
    await failed.reload()
    await failed.getByRole("alert").filter({ hasText: "Bản đồ:" }).waitFor()
    check(
      `${zone}: required landscape404 shows error, no fallback and disabled destinations with exact save`,
      (await failed.getByTestId("world-map").locator("canvas").count()) === 0 &&
        (await failed
          .getByTestId(
            `${zone === "kitchen-hearth" ? "hearth" : "table"}-room-waypoints`,
          )
          .getByRole("button")
          .evaluateAll((bs) => bs.every((b) => b.disabled))) &&
        (await failed.evaluate((key) => localStorage.getItem(key), key)) ===
          earnedRoom,
    )
    await failed.unroute(`**${fault}`)
    fault = ""
    await failed.reload()
    await failed
      .locator(`canvas[data-scene-id="aw2-environment-${zone}-v2"]`)
      .waitFor()
    await failed
      .getByTestId("world-map")
      .locator(".aw2-map-loading")
      .waitFor({ state: "hidden" })
    check(
      `${zone}: resource recovery reload preserves exact earned bytes without grants`,
      (await failed.evaluate((key) => localStorage.getItem(key), key)) ===
        earnedRoom,
    )
    await failContext.close()
  }
  if (!values["resume-rematch"]) {
    await ready()
    check(
      "Exact earned pantry checkpoint restore is read-only",
      (await raw()) === earnedRaw,
    )
    check(
      "Both new interior textures remain lazy before native travel",
      !requests.some((p) =>
        /kitchen-(hearth|table)\/v2\/landscape.webp/.test(p),
      ),
    )
    await go(432, 272)
    await interact("Mở rương nguyên liệu")
    await travel(616, "Phòng Lửa")
    await scenery("kitchen-hearth", 5, {
      id: "aw2-object-steam-0",
      x: 208,
      y: 144,
    })
    check(
      "Unsolved puzzle keeps east exit genuinely disabled",
      await page
        .getByTestId("room-waypoint-aw2-zone-kitchen-hearth:exit:east")
        .isDisabled(),
    )
    await go(432, 176)
    const inventory = JSON.stringify((await save()).economy.inventory)
    await interact("Nhóm lửa")
    check(
      "Wrong native puzzle attempt is retryable without ingredient spend",
      (await save()).progress.puzzleStep === 0 &&
        JSON.stringify((await save()).economy.inventory) === inventory,
    )
    for (const [step, x, action] of [
      [0, 208, "Mở lối thoát"],
      [1, 320, "Đặt nồi"],
      [2, 432, "Nhóm lửa"],
    ]) {
      await page.getByTestId(`room-waypoint-aw2-object-steam-${step}`).click()
      await arrive(x, 176)
      await interact(action)
      const current = await raw()
      await page.reload()
      await ready()
      check(
        `Puzzle step${step + 1} uses explicit action and survives exact reload`,
        (await save()).progress.puzzleStep === step + 1 &&
          (await raw()) === current,
      )
    }
    check(
      "Solved puzzle updates real sprite state and unlocks east destination",
      (await props())
        .filter((p) => p.entityId.startsWith("aw2-object-steam-"))
        .every((p) => p.state === "solved") &&
        (await page
          .getByTestId("room-waypoint-aw2-zone-kitchen-hearth:exit:east")
          .isEnabled()),
    )
    await travel(616, "Phòng Bàn")
    await go(448, 176)
    await interact()
    check(
      "Early table note remains unavailable despite authored scenery",
      (await page
        .getByRole("button", { name: "Đọc ghi chép", exact: true })
        .count()) === 0,
    )
    await page.keyboard.press("Escape")
    await travel(24, "Phòng Lửa")
    await travel(24, "Phòng Kho")
    await travel(24, "Sân Bếp Bỏ Quên")
    await go(320, 128)
    await interact("Báo đã mở bếp")
    await page.locator(".aw2-bag-panel > summary").click()
    await page.getByText("Nấu và chia một bữa ấm", { exact: true }).click()
    await click("Nấu Chén cơm ấm")
    await click("Chia bữa · +45 EXP")
    await page
      .getByRole("status")
      .filter({ hasText: "Bữa ăn được chia sẻ" })
      .waitFor()
    check(
      "Reciprocal room travel preserves real cook/share205XP economy",
      (await save()).economy.teamExperience === 205,
    )
    await go(320, 128)
    await interact("Nhận nhiệm vụ")
    await travel(616, "Phòng Kho")
    await travel(616, "Phòng Lửa")
    await travel(616, "Phòng Bàn")
    await scenery("kitchen-table", 3, {
      id: "aw2-object-table-note",
      x: 448,
      y: 144,
    })
    phase = "boss-facing"
    const bossManifest = JSON.parse(
        await readFile("src/aw2/assets/forgotten-host.world-v1.json", "utf8"),
      ),
      beforeFacing = await raw()
    for (const [x, y, facing] of [
      [256, 128, "left"],
      [384, 128, "right"],
      [320, 64, "up"],
      [320, 192, "down"],
    ]) {
      await go(x, y)
      await page.waitForFunction(
        (facing) =>
          JSON.parse(
            document.querySelector('[data-testid="world-map"] canvas').dataset
              .worldBoss,
          ).facing === facing,
        facing,
      )
      const b = JSON.parse(await canvas().getAttribute("data-world-boss"))
      check(
        `Boss ${facing} idle uses own atlas/feet/common scale through scenic camera`,
        b.assetId === bossManifest.asset.id &&
          b.frame === bossManifest.directions[facing] &&
          b.x === 320 &&
          b.y === 128 + bossManifest.display.footOffsetY &&
          b.scale === bossManifest.display.scale &&
          (await raw()) === beforeFacing,
      )
    }
    phase = "actual-battle"
    await page.getByTestId("room-waypoint-aw2-enemy-forgotten-host").click()
    await arrive(320, 160)
    await interact("Bắt đầu thử thách")
    await page.getByTestId("world-battle").waitFor()
    await click("Tạm dừng")
    await page
      .getByTestId("battle-atlas-state")
      .filter({ hasText: "Năm atlas chiến đấu đã tải" })
      .waitFor()
    const battle = page.getByTestId("world-battle").locator("canvas"),
      battleRaw = await raw()
    for (
      let turn = 0;
      turn < 180 && (await battle.getAttribute("data-status")) === "active";
      turn++
    ) {
      if (+(await battle.getAttribute("data-tick")) >= 5)
        for (const id of ["than", "lua", "lam", "moc-non", "suong"]) {
          const u = page.getByTestId(`world-ultimate-aw2-${id}`)
          if (await u.isEnabled()) await u.click()
        }
      if ((await battle.getAttribute("data-status")) === "active") {
        const tick = +(await battle.getAttribute("data-tick"))
        await click("Bước 1 nhịp")
        await page.waitForFunction(
          (t) =>
            +document.querySelector('[data-testid="world-battle"] canvas')
              .dataset.tick ===
            t + 1,
          tick,
        )
      }
    }
    bossTick = +(await battle.getAttribute("data-tick"))
    check(
      "Scenic boss entry reaches actual player-win with five committed combat members and no premature save",
      (await battle.getAttribute("data-status")) === "player-win" &&
        (await raw()) === battleRaw,
    )
    await click("Lưu kết quả và trở về")
    await ready()
    await page.reload()
    await ready()
    check(
      "Explicit real boss result survives reload before note permission",
      (await save()).progress.bossDefeated &&
        !(await save()).progress.tableNoteRead,
    )
    await go(448, 176)
    await interact("Đọc ghi chép")
    const noteRaw = await raw()
    await page.reload()
    await ready()
    check(
      "Read note sprite and exact save follow actual boss permission",
      (await save()).progress.tableNoteRead &&
        (await props()).find((p) => p.entityId === "aw2-object-table-note")
          .state === "read" &&
        (await raw()) === noteRaw,
    )
    for (const name of [
      "Phòng Lửa",
      "Phòng Kho",
      "Sân Bếp Bỏ Quên",
      "Phố Đèn Lồng",
      "Làng Giao Ước",
    ])
      await travel(24, name)
    await go(160, 240)
    await click("Lưu vị trí")
    await page
      .getByRole("status")
      .filter({ hasText: "Đã lưu vị trí AW2." })
      .waitFor()
    const endingReady = await raw()
    for (const [action, ending] of [
      ["Để ghế trống chờ", "wait"],
      ["Mời cả làng dùng bữa", "share"],
    ]) {
      if (ending === "share") {
        await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
          key,
          raw: endingReady,
        })
        await page.reload()
        await ready()
      }
      await interact(action)
      const completed = await raw()
      await page.reload()
      await ready()
      const s = await save()
      check(
        `Actual ${ending} ending settles once345XP/5receipts and exact reload`,
        s.progress.questIndex === 4 &&
          s.progress.endingChoice === ending &&
          s.economy.teamExperience === 345 &&
          s.economy.receipts.length === 5 &&
          (await raw()) === completed,
      )
    }
    phase = "completed-room"
    await travel(616, "Phố Đèn Lồng")
    await travel(616, "Sân Bếp Bỏ Quên")
    await go(520, 240)
    await interact("Đi qua")
    await ready()
    check(
      "Earned ending opens actual yard-to-table shortcut",
      (await save()).progress.zoneId === "aw2-zone-kitchen-table" &&
        (await page
          .getByTestId("room-waypoint-aw2-shortcut-table-yard")
          .isEnabled()),
    )
  } else {
    await ready()
    check(
      "Exact current-task completed checkpoint resumes read-only before rematch",
      (await raw()) === earnedRaw,
    )
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await view("overview")
  await map().screenshot({ path: `${out}/${flavor}-table-map-overview.png` })
  await view("follow")
  await map().screenshot({ path: `${out}/${flavor}-table-map-follow.png` })
  await page.setViewportSize({ width: 1280, height: 1000 })
  const completedEconomy = JSON.stringify((await save()).economy)
  await page.getByTestId("room-waypoint-aw2-enemy-forgotten-host").click()
  await arrive(320, 160)
  await interact("Đấu lại boss · không nhận thưởng")
  await page.getByTestId("world-battle").waitFor()
  await click("Tạm dừng")
  await click("Rút lui về Phòng Bàn")
  await click("Lưu kết quả và trở về")
  await ready()
  check(
    "Completed boss rematch/retreat returns safely without rewards",
    (await save()).progress.zoneId === "aw2-zone-kitchen-table" &&
      (await save()).progress.x === 96 &&
      JSON.stringify((await save()).economy) === completedEconomy,
  )
  await travel(24, "Phòng Lửa")
  await page.setViewportSize({ width: 390, height: 844 })
  await view("overview")
  await map().screenshot({ path: `${out}/${flavor}-hearth-map-overview.png` })
  await view("follow")
  await map().screenshot({ path: `${out}/${flavor}-hearth-map-follow.png` })
  await travel(616, "Phòng Bàn")
  check(
    "Completed reciprocal hearth/table travel preserves all economy receipts",
    JSON.stringify((await save()).economy) === completedEconomy,
  )
  await go(520, 240)
  await interact("Đi qua")
  await ready()
  check(
    "Table-to-yard shortcut is reciprocal and preserves ending economy",
    (await save()).progress.zoneId === "aw2-zone-forgotten-kitchen-yard" &&
      JSON.stringify((await save()).economy) === completedEconomy,
  )
  check(
    "All five stable legacy keys remain byte-identical",
    await page.evaluate(
      (legacy) =>
        Object.entries(legacy).every(([k, v]) => localStorage.getItem(k) === v),
      legacy,
    ),
  )
  check("No unexpected page/console/resource errors", errors.length === 0)
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-006L",
        status: "PASS",
        flavor,
        checks,
        freshAssertions: checks.length - origins[0].retainedAssertions,
        retainedAssertions: origins[0].retainedAssertions,
        errors,
        expectedErrors,
        requests,
        captures,
        origins,
        bossTick,
        checkpointRaw: await raw(),
        limitations:
          "Focused composite current-task checks from authentic earned checkpoints. Verified current-task prefix retained only by exact report/hash; no historical assertion totals added. Fresh intro/full uninterrupted story/human/device/art rights acceptance NOT_RUN.",
      },
      null,
      2,
    ) + "\n",
  )
} catch (error) {
  console.error(error)
  await page
    ?.screenshot({ path: `${out}/${flavor}-failed.png`, fullPage: true })
    .catch(() => {})
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-006L",
        status: "FAIL",
        flavor,
        phase,
        checks,
        freshAssertions: checks.length - origins[0].retainedAssertions,
        retainedAssertions: origins[0].retainedAssertions,
        errors,
        expectedErrors,
        origins,
        bossTick,
        error: String(error),
        observedRaw: await page
          ?.evaluate((key) => localStorage.getItem(key), key)
          .catch(() => null),
      },
      null,
      2,
    ) + "\n",
  )
  process.exitCode = 1
} finally {
  await browser?.close()
  await server.close()
}
