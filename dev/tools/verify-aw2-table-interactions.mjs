import assert from "node:assert/strict"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { createHash } from "node:crypto"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"
import {
  roomBeforeBoss,
  roomAfterVictory,
  roomAfterNote,
} from "./aw2-table-room-browser-flow.mjs"
const { values } = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
    compiled: { type: "boolean", default: false },
  },
})
const flavor = values.compiled ? "compiled" : "source",
  port = values.compiled ? 8527 : 8526
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
  out = ".asset-work/aw2-006c",
  key = "aw2.development.save",
  url = `http://127.0.0.1:${port}/dev/aw2/world.html`
const checks = [],
  errors = [],
  origins = [],
  expectedErrors = [],
  legacy = {
    "foodchest.user.v1": "006c-user",
    "foodchest.tcg.v1": "006c-cards",
  }
let browser, page
const check = (name, condition = true) => {
  assert.ok(condition, name)
  checks.push(name)
  console.log(name)
}
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
  page = await context.newPage()
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text())
  })
  await page.goto(url)
  const raw = () => page.evaluate((key) => localStorage.getItem(key), key),
    save = async () => JSON.parse(await raw())
  const ready = async () => {
    await page.locator("canvas[data-party-size]").waitFor()
    await page
      .getByTestId("world-map")
      .locator(".aw2-map-loading")
      .waitFor({ state: "hidden" })
  }
  const room = async () => {
    await ready()
    await page.waitForFunction(
      () =>
        JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas')?.dataset
            .interactionProps ?? "[]",
        ).length === 3,
    )
  }
  const restore = async (path) => {
    const text = await readFile(path, "utf8"),
      d = JSON.parse(text),
      checkpoint = d.checkpointRaw ?? d.observedRaw
    assert.ok(checkpoint)
    const s = JSON.parse(checkpoint)
    assert.equal(s.progress.zoneId, "aw2-zone-kitchen-table")
    origins.push({
      path,
      sha256: createHash("sha256").update(text).digest("hex"),
      checkpointSha256: createHash("sha256").update(checkpoint).digest("hex"),
      questIndex: s.progress.questIndex,
    })
    await page.evaluate(
      ({ key, checkpoint, legacy }) => {
        localStorage.setItem(key, checkpoint)
        Object.entries(legacy).forEach(([k, v]) => localStorage.setItem(k, v))
      },
      { key, checkpoint, legacy },
    )
    await page.reload()
    await room()
    check(
      "Exact earned checkpoint restore/render preserves bytes",
      (await raw()) === checkpoint,
    )
  }
  const props = async () =>
    JSON.parse(
      await page
        .getByTestId("world-map")
        .locator("canvas")
        .getAttribute("data-interaction-props"),
    )
  const states = async (note, shortcut) => {
    await page.waitForFunction(
      ({ note, shortcut }) => {
        const ps = JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas')?.dataset
            .interactionProps ?? "[]",
        )
        return (
          ps.find((p) => p.entityId === "aw2-object-table-note")?.state ===
            note &&
          ps.find((p) => p.entityId === "aw2-shortcut-table-yard")?.alpha ===
            shortcut
        )
      },
      { note, shortcut },
    )
  }
  const go = async (x, y) => {
    await ready()
    const map = page.getByTestId("world-map")
    await map.scrollIntoViewIfNeeded()
    const box = await map.boundingBox()
    await page.touchscreen.tap(
      box.x + (x / 640) * box.width,
      box.y + (y / 384) * box.height,
    )
    await page.waitForFunction(
      ({ x, y }) => {
        const m = document
          .querySelector('[data-testid="player-position"]')
          ?.textContent.match(/Vị trí (\d+), (\d+)/)
        return m && Math.abs(+m[1] - x) <= 1 && Math.abs(+m[2] - y) <= 1
      },
      { x, y },
    )
  }
  const interact = async (name) => {
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
  const click = (name) =>
    page.getByRole("button", { name, exact: true }).click()
  await restore(`.asset-work/aw2-006b/failed-visibility/${flavor}-demo.json`)
  const baseline = (await save()).economy
  await states("locked", 0.4)
  const initialProps = await props()
  check(
    "Three actual sprites use canonical anchors, own textures and flat depth below all actors",
    initialProps.length === 3 &&
      initialProps.every(
        (p) =>
          p.depth === 1 &&
          p.textureId.startsWith(
            "aw2-environment-kitchen-table-interactions-v1:",
          ),
      ) &&
      initialProps.find((p) => p.entityId === "aw2-object-table-note").x ===
        448 &&
      initialProps.find((p) => p.entityId.endsWith(":exit:west")).x === 24,
  )
  await roomBeforeBoss({
    page,
    check,
    raw,
    save,
    go,
    interact,
    world: ready,
    out,
    flavor,
  })
  const before = await raw()
  check(
    "Flat prop rendering/walking leaves earned economy unchanged",
    JSON.stringify((await save()).economy) === JSON.stringify(baseline),
  )
  await interact("Bắt đầu thử thách")
  await page.getByTestId("world-battle").waitFor()
  await click("Tạm dừng")
  await page
    .getByTestId("battle-atlas-state")
    .filter({ hasText: "đã tải" })
    .waitFor()
  const battle = page.getByTestId("world-battle").locator("canvas")
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="world-battle"] canvas')?.dataset
        .status === "active",
  )
  for (
    let i = 0;
    i < 180 && (await battle.getAttribute("data-status")) === "active";
    i++
  ) {
    if (+(await battle.getAttribute("data-tick")) >= 5)
      for (const id of ["than", "lua", "lam", "moc-non", "suong"]) {
        const b = page.getByTestId(`world-ultimate-aw2-${id}`)
        if (
          (await battle.getAttribute("data-status")) === "active" &&
          (await b.isEnabled())
        )
          await b.click()
      }
    if ((await battle.getAttribute("data-status")) === "active") {
      const tick = +(await battle.getAttribute("data-tick"))
      await click("Bước 1 nhịp")
      await page.waitForFunction(
        (t) =>
          +document.querySelector('[data-testid="world-battle"] canvas').dataset
            .tick ===
          t + 1,
        tick,
      )
    }
  }
  check(
    "Real earned205XP team wins actual boss before note unlock",
    (await battle.getAttribute("data-status")) === "player-win",
  )
  await click("Lưu kết quả và trở về")
  await room()
  await roomAfterVictory({ page, check })
  await states("available", 0.4)
  check(
    "Actual win changes note sprite opacity/state while shortcut remains locked",
    (await props()).find((p) => p.entityId === "aw2-object-table-note")
      .alpha === 1,
  )
  await go(448, 144)
  await interact("Đọc ghi chép")
  await roomAfterNote({ page, check })
  await states("read", 0.4)
  const readRaw = await raw()
  await go(400, 192)
  await page
    .getByTestId("world-map")
    .screenshot({ path: `${out}/${flavor}-note-read.png` })
  await page.reload()
  await room()
  await states("read", 0.4)
  check(
    "Reload preserves native note-read state and exact bytes",
    (await raw()) === readRaw,
  )
  check(
    "Win/read add no economy grants",
    JSON.stringify((await save()).economy) === JSON.stringify(baseline),
  )
  await restore(`.asset-work/aw2-006b/${flavor}-demo.json`)
  const completed = await save(),
    economy = JSON.stringify(completed.economy),
    ending = completed.progress.endingChoice
  await states("read", 1)
  check(
    "Authentic completed ending lights actual shortcut sprite",
    (await props()).find((p) => p.entityId === "aw2-shortcut-table-yard")
      .alpha === 1,
  )
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 })
    await go(240, 192)
    check(
      `${width}px labels stay below complete prop bounds and native controls fit`,
      (await page.evaluate(() => {
        if (document.documentElement.scrollWidth > innerWidth) return false
        const map = document.querySelector('[data-testid="world-map"]'),
          rect = map.getBoundingClientRect()
        const props = JSON.parse(
          map.querySelector("canvas").dataset.interactionProps,
        )
        return props.every((p) => {
          const label = [...map.querySelectorAll(".aw2-world-label")].find(
            (label) =>
              Math.abs(parseFloat(label.style.top) * 3.84 - (p.y + 24)) < 0.01,
          )
          return (
            label &&
            label.getBoundingClientRect().top >=
              rect.top + ((p.y + p.height / 2) / 384) * rect.height - 3
          )
        })
      })) &&
        (await page
          .getByTestId("table-room-waypoints")
          .getByRole("button")
          .evaluateAll(
            (bs) =>
              bs.length === 4 &&
              bs.every((b) => b.getBoundingClientRect().height >= 44),
          )),
    )
    if (width === 390) {
      await page
        .getByTestId("world-map")
        .screenshot({ path: `${out}/${flavor}-completed-mobile.png` })
      await page
        .getByTestId("table-room-waypoints")
        .screenshot({ path: `${out}/${flavor}-waypoints-mobile.png` })
    }
  }
  await page.setViewportSize({ width: 1280, height: 1000 })
  await go(400, 192)
  await page
    .getByTestId("world-map")
    .screenshot({ path: `${out}/${flavor}-completed-desktop.png` })
  await page.getByTestId("room-waypoint-aw2-shortcut-table-yard").click()
  await go(520, 240)
  await interact("Đi qua")
  await ready()
  check(
    "Native shortcut leaves authored room for unchanged Sân renderer",
    (await page
      .getByTestId("world-map")
      .locator("canvas")
      .getAttribute("data-scene-id")) === "debug-terrain",
  )
  await go(520, 240)
  await interact("Đi qua")
  await room()
  await states("read", 1)
  check(
    "Reciprocal shortcut restores three props and ending/rewards",
    JSON.stringify((await save()).economy) === economy &&
      (await save()).progress.endingChoice === ending,
  )
  await go(320, 128)
  await interact("Đấu lại boss · không nhận thưởng")
  await page.getByTestId("world-battle").waitFor()
  await click("Rút lui về Phòng Bàn")
  await click("Lưu kết quả và trở về")
  await room()
  await states("read", 1)
  check(
    "Real rematch retreat restores current authored props without reward/ending changes",
    JSON.stringify((await save()).economy) === economy &&
      (await save()).progress.endingChoice === ending,
  )
  const final = await raw()
  await page.reload()
  await room()
  check(
    "Completed scene reload keeps exact settled bytes",
    (await raw()) === final,
  )
  check(
    "No unexpected page/console errors before deliberate asset faults",
    errors.length === 0,
  )
  for (const name of ["note", "threshold"]) {
    const route = `**/dev/aw2/assets/environments/kitchen-table/interaction-v1/${name}.webp*`,
      beforeErrors = errors.length
    await context.route(route, (r) =>
      r.fulfill({ status: 404, body: "deliberate006C missing asset" }),
    )
    await page.reload()
    await page.getByTestId("world-map").getByRole("alert").waitFor()
    check(
      `Missing ${name} fails visibly with all waypoints disabled`,
      await page
        .getByTestId("table-room-waypoints")
        .getByRole("button")
        .evaluateAll((bs) => bs.length === 4 && bs.every((b) => b.disabled)),
    )
    check(`Missing ${name} preserves exact save bytes`, (await raw()) === final)
    expectedErrors.push(...errors.splice(beforeErrors))
    await context.unroute(route)
    await page.reload()
    await room()
    await states("read", 1)
    check(
      `Recovered ${name} restores props without writes/new errors`,
      (await raw()) === final && errors.length === 0,
    )
  }
  check(
    "Seeded legacy bytes preserved across all native scene operations",
    await page.evaluate(
      (legacy) =>
        Object.entries(legacy).every(([k, v]) => localStorage.getItem(k) === v),
      legacy,
    ),
  )
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-006C",
        status: "PASS",
        flavor,
        engine: browser.version(),
        checks,
        errors,
        expectedErrors,
        origins,
        checkpointRaw: await raw(),
        scope:
          "Focused native scene/boss/note/return/rematch checks from exact006B earned checkpoints, not a fresh full-story run",
      },
      null,
      2,
    ) + "\n",
  )
  console.log(JSON.stringify({ status: "PASS", flavor, checks: checks.length }))
} catch (e) {
  await page
    ?.screenshot({ path: `${out}/${flavor}-failure.png`, fullPage: true })
    .catch(() => {})
  await writeFile(
    `${out}/${flavor}-failure.json`,
    JSON.stringify(
      { status: "FAIL", checks, errors, cause: String(e) },
      null,
      2,
    ),
  )
  throw e
} finally {
  await browser?.close()
  if (values.compiled) await new Promise((r) => server.httpServer.close(r))
  else await server.close()
}
