import assert from "node:assert/strict"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { createHash } from "node:crypto"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"
const { values } = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
    compiled: { type: "boolean", default: false },
  },
})
const flavor = values.compiled ? "compiled" : "source",
  port = values.compiled ? 8535 : 8534,
  url = `http://127.0.0.1:${port}/dev/aw2/world.html`,
  out = ".asset-work/aw2-006d",
  key = "aw2.development.save"
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
  manifest = JSON.parse(
    await readFile("src/aw2/assets/forgotten-host.world-v1.json", "utf8"),
  )
const checks = [],
  errors = [],
  expectedErrors = [],
  origins = [],
  requests = [],
  legacy = {
    "foodchest.user.v1": "006d-original-user",
    "foodchest.tcg.v1": "006d-original-tcg",
  }
const check = (name, condition = true) => {
  assert.ok(condition, name)
  checks.push(name)
  console.log(name)
}
let browser, page
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
  page.on("request", (r) => requests.push(new URL(r.url()).pathname))
  const map = () => page.getByTestId("world-map"),
    canvas = () => map().locator("canvas"),
    raw = () => page.evaluate((key) => localStorage.getItem(key), key),
    save = async () => JSON.parse(await raw())
  const ready = async () => {
    await page.waitForFunction(() => {
      const p = JSON.parse(
          localStorage.getItem("aw2.development.save"),
        )?.progress,
        c = document.querySelector('[data-testid="world-map"] canvas')
      return (
        c &&
        c.dataset.partySize === "1" &&
        c.dataset.partyIds === JSON.stringify([p.partyIds[0] ?? "aw2-than"])
      )
    })
    await map().locator(".aw2-map-loading").waitFor({ state: "hidden" })
  }
  const room = async () => {
    await ready()
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="world-map"] canvas')?.dataset
          .worldBoss,
    )
  }
  const state = async () =>
    JSON.parse(await canvas().getAttribute("data-world-boss"))
  const restore = async (path) => {
    const text = await readFile(path, "utf8"),
      d = JSON.parse(text),
      checkpoint = d.checkpointRaw ?? d.observedRaw
    assert.ok(checkpoint)
    origins.push({
      path,
      sha256: createHash("sha256").update(text).digest("hex"),
      checkpointSha256: createHash("sha256").update(checkpoint).digest("hex"),
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
      "Exact earned checkpoint restore renders own boss without writing",
      (await raw()) === checkpoint,
    )
  }
  const go = async (x, y) => {
    await ready()
    await map().scrollIntoViewIfNeeded()
    const b = await map().boundingBox()
    await page.touchscreen.tap(
      b.x + (x / 640) * b.width,
      b.y + (y / 384) * b.height,
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
  await page.goto(url)
  await restore(`.asset-work/aw2-006b/failed-visibility/${flavor}-demo.json`)
  const before = await raw(),
    baseline = await save()
  check(
    "World loads its own chibi atlas without requesting old HD battle body",
    requests.includes(manifest.asset.url) &&
      !requests.includes(
        "/dev/aw2/assets/forgotten-host/reference-v1/battle.webp",
      ),
  )
  for (const [x, y, facing] of [
    [240, 128, "left"],
    [400, 128, "right"],
    [320, 32, "up"],
    [320, 224, "down"],
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
    const s = await state(),
      f = manifest.frames[manifest.directions[facing]]
    check(
      `Native approach ${facing} uses own idle texture and fixed measured foot anchor`,
      s.frame === manifest.directions[facing] &&
        s.assetId === manifest.asset.id &&
        s.x === 320 &&
        s.y === 134 &&
        s.depth === 138 &&
        Math.abs(s.anchorX - f.anchorX / f.width) < 0.00001 &&
        Math.abs(s.anchorY - f.anchorY / f.height) < 0.00001 &&
        s.scale === manifest.display.scale &&
        s.alpha === 1,
    )
    await canvas().screenshot({ path: `${out}/${flavor}-${facing}.png` })
  }
  check(
    "Facing updates do not auto-interact, start battle or change earned bytes",
    (await raw()) === before &&
      (await page.getByRole("dialog").count()) === 0 &&
      (await page.getByTestId("world-battle").count()) === 0,
  )
  await map().focus()
  await page.keyboard.down("w")
  await page.waitForTimeout(120)
  await page.keyboard.up("w")
  await room()
  check(
    "Keyboard movement preserves single representative and stationary idle boss",
    (await canvas().getAttribute("data-party-size")) === "1" &&
      (await state()).x === 320 &&
      (await state()).y === 134,
  )
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 })
    check(
      `${width}px full boss frame/label/native controls remain inside map`,
      (await page.evaluate(() => {
        if (document.documentElement.scrollWidth > innerWidth) return false
        const map = document.querySelector('[data-testid="world-map"]'),
          r = map.getBoundingClientRect()
        return [...map.querySelectorAll(".aw2-world-label")].every(
          (e) => e.getBoundingClientRect().bottom <= r.bottom + 1,
        )
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
    if (width === 390)
      await map().screenshot({ path: `${out}/${flavor}-mobile.png` })
  }
  await page.setViewportSize({ width: 1280, height: 1000 })
  await go(320, 160)
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
  check(
    "Boss encounter still draws five saved combat actors and existing HD boss body",
    (await page.locator('[data-testid^="world-unit-aw2-"]').count()) === 5 &&
      requests.includes(
        "/dev/aw2/assets/forgotten-host/reference-v1/battle.webp",
      ),
  )
  for (
    let i = 0;
    i < 180 && (await battle.getAttribute("data-status")) === "active";
    i++
  ) {
    if (+(await battle.getAttribute("data-tick")) >= 5)
      for (const id of ["than", "lua", "lam", "moc-non", "suong"]) {
        const ult = page.getByTestId(`world-ultimate-aw2-${id}`)
        if (
          (await battle.getAttribute("data-status")) === "active" &&
          (await ult.isEnabled())
        )
          await ult.click()
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
    "Actual earned205XP encounter wins without injecting HP/outcome",
    (await battle.getAttribute("data-status")) === "player-win",
  )
  await click("Lưu kết quả và trở về")
  await room()
  await page.waitForFunction(
    () =>
      JSON.parse(
        document.querySelector('[data-testid="world-map"] canvas').dataset
          .worldBoss,
      ).alpha === 0.6,
  )
  check(
    "True committed victory dims own chibi before ending without new economy grants",
    (await save()).progress.bossDefeated &&
      (await state()).alpha === 0.6 &&
      JSON.stringify((await save()).economy) ===
        JSON.stringify(baseline.economy),
  )
  await go(448, 144)
  await interact("Đọc ghi chép")
  const readRaw = await raw()
  await page.reload()
  await room()
  check(
    "Read note/reload retain own chibi and actual victory/note bytes",
    (await raw()) === readRaw &&
      (await save()).progress.tableNoteRead &&
      (await state()).alpha === 0.6,
  )
  await restore(`.asset-work/aw2-006e/${flavor}-browser.json`)
  const completed = await save(),
    economy = JSON.stringify(completed.economy),
    ending = completed.progress.endingChoice
  check(
    "Authentic completed ending restores full-opacity world boss and rematch label",
    (await state()).alpha === 1 &&
      (
        await page
          .getByTestId("room-waypoint-aw2-enemy-forgotten-host")
          .textContent()
      ).includes("Đấu lại không nhận thưởng"),
  )
  await go(24, 192)
  await interact("Đi qua")
  await ready()
  check(
    "West exit retains unchanged other-zone renderer",
    (await canvas().getAttribute("data-scene-id")) === "debug-terrain",
  )
  await go(616, 192)
  await interact("Đi qua")
  await room()
  check(
    "Returning west/east reloads own chibi without extra rewards",
    (await state()).assetId === manifest.asset.id &&
      JSON.stringify((await save()).economy) === economy,
  )
  await go(520, 240)
  await interact("Đi qua")
  await ready()
  await go(520, 240)
  await interact("Đi qua")
  await room()
  check(
    "Completed reciprocal shortcut restores world boss and exact ending",
    JSON.stringify((await save()).economy) === economy &&
      (await save()).progress.endingChoice === ending,
  )
  await go(320, 160)
  await interact("Đấu lại boss · không nhận thưởng")
  await page.getByTestId("world-battle").waitFor()
  await click("Rút lui về Phòng Bàn")
  await click("Lưu kết quả và trở về")
  await room()
  check(
    "Real rematch return restores own idle chibi with one representative and no grants",
    (await state()).alpha === 1 &&
      (await canvas().getAttribute("data-party-size")) === "1" &&
      JSON.stringify((await save()).economy) === economy &&
      (await save()).progress.endingChoice === ending,
  )
  check(
    "No unexpected page/console errors before deliberate new-atlas fault",
    errors.length === 0,
  )
  const final = await raw(),
    route = "**" + manifest.asset.url + "*"
  await context.route(route, (r) =>
    r.fulfill({ status: 404, body: "Deliberate missing world boss atlas" }),
  )
  await page.reload()
  await map().getByRole("alert").waitFor()
  check(
    "Missing world boss art fails visibly without HD/debug fallback or enabled waypoints",
    (await canvas().count()) === 0 &&
      (await page
        .getByTestId("table-room-waypoints")
        .getByRole("button")
        .evaluateAll((bs) => bs.length === 4 && bs.every((b) => b.disabled))),
  )
  check(
    "Missing boss art preserves exact completed save bytes",
    (await raw()) === final,
  )
  expectedErrors.push(...errors.splice(0))
  await context.unroute(route)
  await page.reload()
  await room()
  check(
    "Atlas recovery restores own chibi/one actor without writes or new errors",
    (await raw()) === final &&
      (await state()).assetId === manifest.asset.id &&
      errors.length === 0,
  )
  check(
    "Legacy save bytes unchanged throughout native boss-world operations",
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
        task: "AW2-006D",
        status: "PASS",
        flavor,
        engine: browser.version(),
        checks,
        errors,
        expectedErrors,
        origins,
        requests,
        checkpointRaw: await raw(),
        scope:
          "Focused native boss-world checks from exact historical earned checkpoints, not a fresh full-story run",
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
  await server.close()
}
