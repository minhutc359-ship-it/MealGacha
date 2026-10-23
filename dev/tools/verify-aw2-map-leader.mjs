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
  port = values.compiled ? 8531 : 8530,
  out = ".asset-work/aw2-006e",
  key = "aw2.development.save"
const url = `http://127.0.0.1:${port}/dev/aw2/world.html`
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
const ids = [
  "than",
  "lua",
  "lam",
  "moc-non",
  "suong",
  "muoi",
  "nhien",
  "hai",
  "lien",
  "moc",
  "bach",
  "van",
].map((id) => "aw2-" + id)
const manifests = Object.fromEntries(
  await Promise.all(
    ids.map(async (id) => [
      id,
      JSON.parse(
        await readFile(`src/aw2/assets/${id.slice(4)}.base-v1.json`, "utf8"),
      ),
    ]),
  ),
)
const checks = [],
  errors = [],
  expectedErrors = [],
  worldRequests = [],
  legacy = {
    "foodchest.user.v1": "006e-original-user",
    "foodchest.tcg.v1": "006e-original-tcg",
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
  await context.addInitScript(() => {
    const original = Storage.prototype.setItem
    window.__blockLeaderSave = false
    Storage.prototype.setItem = function (k, v) {
      if (k === "aw2.development.save" && window.__blockLeaderSave)
        throw Error("Deliberate QA write failure")
      return original.call(this, k, v)
    }
  })
  page = await context.newPage()
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text())
  })
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.endsWith("/world.webp"))
      worldRequests.push(new URL(r.url()).pathname)
  })
  const raw = () => page.evaluate((key) => localStorage.getItem(key), key),
    save = async () => JSON.parse(await raw())
  const map = () => page.getByTestId("world-map"),
    canvas = () => map().locator("canvas")
  const ready = async () => {
    await page.waitForFunction(() => {
      const p = JSON.parse(
        localStorage.getItem("aw2.development.save"),
      )?.progress
      const c = document.querySelector('[data-testid="world-map"] canvas')
      return (
        c?.dataset.partySize === "1" &&
        c.dataset.partyIds === JSON.stringify([p?.partyIds[0] ?? "aw2-than"]) &&
        JSON.parse(c.dataset.partyPositions ?? "[]").length === 1
      )
    })
    await map().locator(".aw2-map-loading").waitFor({ state: "hidden" })
  }
  const leader = async () =>
    JSON.parse(await canvas().getAttribute("data-party-ids"))[0]
  const click = (name) =>
    page.getByRole("button", { name, exact: true }).click()
  const bag = async () => {
    const d = page.locator("details.aw2-bag-panel")
    if (!(await d.evaluate((d) => d.open)))
      await d.locator(":scope > summary").click()
  }
  const closeBag = async () => {
    const d = page.locator("details.aw2-bag-panel")
    if (await d.evaluate((d) => d.open))
      await d.locator(":scope > summary").click()
  }
  const choose = async (id) => {
    await bag()
    await page.getByLabel("Vị trí đội 1", { exact: true }).selectOption(id)
  }
  const commit = async () => {
    await click("Lưu đội hình")
    await ready()
    await closeBag()
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
  await page.goto(url)
  await click("Tạo bản lưu AW2")
  await ready()
  check(
    "Fresh pre-intro uses one Than representative without granting a party",
    (await leader()) === "aw2-than" &&
      (await save()).progress.partyIds.length === 0 &&
      (await save()).economy.teamExperience === 0,
  )
  const earnedPath = `.asset-work/aw2-006b/${flavor}-demo.json`,
    earnedText = await readFile(earnedPath, "utf8"),
    earned = JSON.parse(earnedText),
    checkpoint = earned.checkpointRaw
  assert.equal(JSON.parse(checkpoint).progress.questIndex, 4)
  let unusedRequests = 0
  const unusedRoute = "**" + manifests["aw2-nhien"].assets.world.url + "*"
  await context.route(unusedRoute, (r) => {
    unusedRequests++
    return r.fulfill({
      status: 404,
      body: "Unused nonleader atlas deliberately absent",
    })
  })
  await page.evaluate(
    ({ key, checkpoint, legacy }) => {
      localStorage.setItem(key, checkpoint)
      Object.entries(legacy).forEach(([k, v]) => localStorage.setItem(k, v))
    },
    { key, checkpoint, legacy },
  )
  await page.reload()
  await ready()
  const original = await save(),
    originalParty = [...original.progress.partyIds],
    economy = JSON.stringify(original.economy),
    collection = JSON.stringify(original.collection)
  check(
    "Earned saved leader renders alone and missing nonleader atlas is never requested",
    (await leader()) === originalParty[0] &&
      unusedRequests === 0 &&
      (await raw()) === checkpoint,
  )
  await choose("aw2-van")
  check(
    "Draft slot1 swap leaves representative and exact saved party untouched",
    (await leader()) === originalParty[0] && (await raw()) === checkpoint,
  )
  await click("Hủy chọn đội")
  check(
    "Cancel restores first-slot selection without changing map or save",
    (await page.getByLabel("Vị trí đội 1", { exact: true }).inputValue()) ===
      originalParty[0] &&
      (await leader()) === originalParty[0] &&
      (await raw()) === checkpoint,
  )
  await choose("aw2-van")
  await page.evaluate(() => (window.__blockLeaderSave = true))
  await click("Lưu đội hình")
  await page
    .getByRole("alert")
    .filter({ hasText: "Chưa lưu được AW2" })
    .waitFor()
  check(
    "Failed team save keeps old representative, stored five and retryable draft",
    (await raw()) === checkpoint &&
      (await leader()) === originalParty[0] &&
      (await page.getByLabel("Vị trí đội 1", { exact: true }).inputValue()) ===
        "aw2-van",
  )
  await page.evaluate(() => (window.__blockLeaderSave = false))
  await commit()
  const reordered = [...originalParty],
    index = reordered.indexOf("aw2-van")
  ;[reordered[0], reordered[index]] = [reordered[index], reordered[0]]
  check(
    "Successful retry changes only representative while retaining exact five-member swap",
    (await leader()) === "aw2-van" &&
      JSON.stringify((await save()).progress.partyIds) ===
        JSON.stringify(reordered),
  )
  const saved = await raw()
  await page.reload()
  await ready()
  check(
    "Reload preserves one committed representative and exact save bytes",
    (await leader()) === "aw2-van" && (await raw()) === saved,
  )
  await page.evaluate(
    () =>
      (window.__leaderCanvas = document.querySelector(
        '[data-testid="world-map"] canvas',
      )),
  )
  await bag()
  const party = (await save()).progress.partyIds
  await page.getByLabel("Vị trí đội 2", { exact: true }).selectOption(party[2])
  await commit()
  check(
    "Reordering nonleader slots keeps the same single map actor/canvas",
    (await leader()) === "aw2-van" &&
      (await canvas().evaluate((c) => c === window.__leaderCanvas)),
  )
  await context.unroute(unusedRoute)
  const seen = []
  for (const id of ids) {
    if ((await save()).progress.partyIds[0] !== id) {
      await choose(id)
      await commit()
    }
    await go(240, 192)
    await page.waitForTimeout(60)
    const p = await save(),
      ps = JSON.parse(await canvas().getAttribute("data-party-positions"))
    check(
      `${id} alone represents its saved five without ownership/XP changes`,
      (await leader()) === id &&
        ps.length === 1 &&
        Math.abs(ps[0].x - 240) < 1 &&
        Math.abs(ps[0].y - 198) < 1 &&
        p.progress.partyIds.length === 5 &&
        new Set(p.progress.partyIds).size === 5 &&
        JSON.stringify(p.economy) === economy &&
        JSON.stringify(p.collection) === collection,
    )
    seen.push(id)
  }
  check(
    "All12 original world manifests can be the single saved representative",
    new Set(seen).size === 12,
  )
  await page.emulateMedia({ reducedMotion: "no-preference" })
  for (const [key, direction] of [
    ["w", "up"],
    ["a", "left"],
    ["s", "down"],
    ["d", "right"],
  ]) {
    await go(240, 192)
    await map().focus()
    await page.keyboard.down(key)
    try {
      await page.waitForFunction(
        ({ direction, idle }) => {
          const c = document.querySelector('[data-testid="world-map"] canvas')
          return (
            c.dataset.representativeFrame.startsWith(
              "world." + direction + ".",
            ) && c.dataset.representativeFrame !== idle
          )
        },
        { direction, idle: manifests["aw2-van"].world[direction].idle },
      )
    } finally {
      await page.keyboard.up(key)
    }
    await page.waitForFunction(
      (idle) =>
        document.querySelector('[data-testid="world-map"] canvas').dataset
          .representativeFrame === idle,
      manifests["aw2-van"].world[direction].idle,
    )
    check(
      `One representative walks and returns to actual ${direction} idle frame`,
      (await leader()) === "aw2-van",
    )
  }
  await page.emulateMedia({ reducedMotion: "reduce" })
  await go(272, 320)
  await page.waitForFunction(
    () =>
      +document.querySelector('[data-testid="world-map"] canvas').dataset
        .foregroundAlpha === 0.35,
  )
  check(
    "Furniture fades only for the single overlapping representative",
    JSON.parse(await canvas().getAttribute("data-ground-depths")).actors
      .length === 1,
  )
  await canvas().screenshot({ path: `${out}/${flavor}-behind-prop.png` })
  await go(320, 366)
  const depth = JSON.parse(await canvas().getAttribute("data-ground-depths"))
  check(
    "Representative in front still sorts above furniture",
    depth.actors[0] > depth.prop,
  )
  await go(240, 192)
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 })
    check(
      `${width}px single representative and native map controls fit`,
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    )
    if (width === 390) {
      await map().screenshot({ path: `${out}/${flavor}-map-mobile.png` })
      await page
        .getByTestId("map-representative")
        .screenshot({ path: `${out}/${flavor}-representative-mobile.png` })
    }
  }
  await page.setViewportSize({ width: 1280, height: 1000 })
  await map().screenshot({ path: `${out}/${flavor}-map-desktop.png` })
  const zones = []
  for (const name of [
    "Phòng Lửa",
    "Phòng Kho",
    "Sân Bếp Bỏ Quên",
    "Phố Đèn Lồng",
    "Làng Giao Ước",
  ]) {
    await go(24, 192)
    await interact("Đi qua")
    await ready()
    const zone = await page.getByTestId("zone-name").textContent()
    check(
      `Native return to ${name} retains one saved leader`,
      zone.includes(name) && (await leader()) === "aw2-van",
    )
    zones.push(zone)
  }
  for (const name of [
    "Phố Đèn Lồng",
    "Sân Bếp Bỏ Quên",
    "Phòng Kho",
    "Phòng Lửa",
    "Phòng Bàn",
  ]) {
    await go(616, 192)
    await interact("Đi qua")
    await ready()
    check(
      `Native forward to ${name} retains one saved leader`,
      (await page.getByTestId("zone-name").textContent()).includes(name) &&
        (await leader()) === "aw2-van",
    )
  }
  const battleParty = [...(await save()).progress.partyIds]
  await go(320, 128)
  await interact("Đấu lại boss · không nhận thưởng")
  await page.getByTestId("world-battle").waitFor()
  await click("Tạm dừng")
  await page
    .getByTestId("battle-atlas-state")
    .filter({ hasText: "đã tải" })
    .waitFor()
  const actual = await page
    .locator('[data-testid^="world-unit-aw2-"]')
    .evaluateAll((es) => es.map((e) => JSON.parse(e.dataset.state).spiritId))
  check(
    "Actual rematch still renders all five saved combat actors in exact order",
    JSON.stringify(actual) === JSON.stringify(battleParty) &&
      actual.length === 5,
  )
  await click("Rút lui về Phòng Bàn")
  await click("Lưu kết quả và trở về")
  await ready()
  check(
    "Rematch return restores one representative and exact ending/XP/ownership",
    (await leader()) === battleParty[0] &&
      JSON.stringify((await save()).economy) === economy &&
      JSON.stringify((await save()).collection) === collection &&
      (await save()).progress.endingChoice === original.progress.endingChoice,
  )
  const settled = await raw()
  await page.reload()
  await ready()
  check(
    "Settled return reload preserves exact bytes and one actor",
    (await raw()) === settled,
  )
  check(
    "No unexpected console/page errors before deliberate representative failure",
    errors.length === 0,
  )
  const missingRoute = "**" + manifests[battleParty[0]].assets.world.url + "*"
  await context.route(missingRoute, (r) =>
    r.fulfill({ status: 404, body: "Deliberate representative missing atlas" }),
  )
  await page.reload()
  await map().getByRole("alert").waitFor()
  check(
    "Missing representative fails visibly without changing save or enabling room waypoints",
    (await raw()) === settled &&
      (await page
        .getByTestId("table-room-waypoints")
        .getByRole("button")
        .evaluateAll((bs) => bs.every((b) => b.disabled))),
  )
  expectedErrors.push(...errors.splice(0))
  await context.unroute(missingRoute)
  await page.reload()
  await ready()
  check(
    "Atlas recovery restores exactly one representative without writes/new errors",
    (await raw()) === settled && errors.length === 0,
  )
  check(
    "Legacy save bytes stay unchanged",
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
        task: "AW2-006E",
        status: "PASS",
        flavor,
        engine: browser.version(),
        checks,
        errors,
        expectedErrors,
        worldRequests,
        earned: {
          path: earnedPath,
          sha256: createHash("sha256").update(earnedText).digest("hex"),
          checkpointSha256: createHash("sha256")
            .update(checkpoint)
            .digest("hex"),
        },
        checkpointRaw: await raw(),
        scope:
          "Fresh pre-intro plus exact historical earned completed checkpoint, native saved-team/leader/movement/rematch; no fresh full-story claim",
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
