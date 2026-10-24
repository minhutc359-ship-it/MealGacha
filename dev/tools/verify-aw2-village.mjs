import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
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
  port = values.compiled ? 8543 : 8542,
  out = ".asset-work/aw2-006g",
  key = "aw2.development.save",
  village = "aw2-zone-covenant-village",
  url = `http://127.0.0.1:${port}/dev/aw2/world.html`,
  legacy = {
    "foodchest.user.v1": "006g-user",
    "foodchest.tcg.v1": "006g-cards",
  },
  manifest = JSON.parse(
    await readFile(
      "src/aw2/assets/covenant-village.environment-v1.json",
      "utf8",
    ),
  )
const server = values.compiled
  ? await preview({
      configFile: "dev/vite.aw2.config.ts",
      preview: { host: "127.0.0.1", port, strictPort: true },
    })
  : await createServer({
      configFile: "dev/vite.dev.config.ts",
      server: { host: "127.0.0.1", port, strictPort: true },
    })
const checks = [],
  errors = [],
  expectedErrors = [],
  requests = []
const check = (name, condition = true) => {
  assert.ok(condition, name)
  checks.push(name)
  console.log(name)
}
let browser,
  page,
  checkpoint,
  fault = ""
try {
  await mkdir(out, { recursive: true })
  if (!values.compiled) await server.listen()
  const { chromium } = await import(values.playwright)
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
  await context.route("**/favicon.ico", (r) => r.fulfill({ status: 204 }))
  await context.addInitScript(
    ({ legacy }) => {
      const original = Storage.prototype.setItem
      for (const [k, v] of Object.entries(legacy))
        original.call(localStorage, k, v)
      window.__writes = 0
      Storage.prototype.setItem = function (k, v) {
        window.__writes++
        return original.call(this, k, v)
      }
    },
    { legacy },
  )
  page = await context.newPage()
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("request", (r) => requests.push(new URL(r.url()).pathname))
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
  })
  const raw = () => page.evaluate((key) => localStorage.getItem(key), key),
    save = async () => JSON.parse(await raw()),
    writes = () => page.evaluate(() => window.__writes),
    map = () => page.getByTestId("world-map"),
    canvas = () => map().locator("canvas"),
    waypoint = (id) => page.getByTestId(`room-waypoint-${id}`),
    keeper = "aw2-npc-giu-cho",
    table = "aw2-object-village-table",
    props = async () =>
      JSON.parse(await canvas().getAttribute("data-interaction-props")),
    ready = async () => {
      await page.waitForFunction(() => {
        const p = JSON.parse(
            localStorage.getItem("aw2.development.save"),
          )?.progress,
          c = document.querySelector('[data-testid="world-map"] canvas')
        const scene =
          {
            "aw2-zone-covenant-village": "aw2-environment-covenant-village-v1",
            "aw2-zone-kitchen-hearth": "aw2-environment-kitchen-hearth-v1",
            "aw2-zone-kitchen-table": "aw2-environment-kitchen-table-v1",
          }[p?.zoneId] ?? "debug-terrain"
        return (
          c?.dataset.sceneId === scene &&
          c.dataset.partyIds ===
            JSON.stringify([p.partyIds[0] ?? "aw2-than"]) &&
          (scene === "debug-terrain" || !!c.dataset.interactionProps)
        )
      })
      await map().locator(".aw2-map-loading").waitFor({ state: "hidden" })
    },
    arrive = async (x, y) =>
      page.waitForFunction(
        ({ x, y }) => {
          const m = document
            .querySelector('[data-testid="player-position"]')
            ?.textContent.match(/Vị trí (\d+), (\d+)/)
          return m && Math.abs(+m[1] - x) <= 1 && Math.abs(+m[2] - y) <= 1
        },
        { x, y },
      ),
    go = async (x, y) => {
      await ready()
      await map().scrollIntoViewIfNeeded()
      const b = await map().boundingBox()
      await page.touchscreen.tap(
        b.x + (x * b.width) / 640,
        b.y + (y * b.height) / 384,
      )
      await arrive(x, y)
    },
    approach = async (id, x, y) => {
      await waypoint(id).click()
      await arrive(x, y)
    },
    interact = async (name) => {
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
    },
    close = () =>
      page
        .getByRole("dialog")
        .getByRole("button", { name: "Để sau / Đóng", exact: true })
        .click(),
    travel = async (x, name) => {
      await go(x, 192)
      await interact("Đi qua")
      await page.getByTestId("zone-name").filter({ hasText: name }).waitFor()
      await ready()
    }
  await page.goto(url)
  await page
    .getByRole("button", { name: "Tạo bản lưu AW2", exact: true })
    .waitFor()
  check(
    "Empty world grants no save and village raster requests remain lazy",
    (await raw()) === null &&
      !requests.some(
        (p) => p.includes("covenant-village/v1/") && p.endsWith(".webp"),
      ),
  )
  await page
    .getByRole("button", { name: "Tạo bản lưu AW2", exact: true })
    .click()
  await ready()
  check(
    "Created village uses authored floor/three props, one visual fallback and no unlocked party",
    (await canvas().getAttribute("data-scene-id")) === manifest.id &&
      (await props()).length === 3 &&
      (await canvas().getAttribute("data-party-ids")) === '["aw2-than"]' &&
      (await save()).progress.partyIds.length === 0,
  )
  check(
    "All required village textures load without unrelated dungeon or battle assets",
    Object.values(manifest.assets).every((a) => requests.includes(a.url)) &&
      !requests.some(
        (p) =>
          p.includes("kitchen-hearth/v1/") || p.includes("forgotten-host/"),
      ),
  )
  const first = await raw(),
    firstWrites = await writes()
  await approach(table, 160, 176)
  await interact()
  check(
    "Early cloth visit has no inspect grant before accepting intro",
    (await page
      .getByRole("button", { name: "Đọc mảnh khăn", exact: true })
      .count()) === 0 &&
      (await raw()) === first &&
      (await writes()) === firstWrites,
  )
  await close()
  await approach(keeper, 160, 272)
  check(
    "Native target stops near Bà, restores map focus and never accepts or writes",
    (await map().evaluate((e) => e === document.activeElement)) &&
      (await raw()) === first &&
      (await writes()) === firstWrites,
  )
  await interact("Nhận nhiệm vụ")
  check(
    "Explicit acceptance updates real cloth status without starters or reward",
    (await waypoint(table).textContent()).includes("Đọc mảnh khăn") &&
      (await save()).economy.teamExperience === 0 &&
      (await save()).progress.partyIds.length === 0,
  )
  const accepted = await raw()
  await approach(table, 160, 176)
  check(
    "Walking to cloth preserves committed bytes",
    (await raw()) === accepted,
  )
  await interact("Đọc mảnh khăn")
  const read = await raw()
  await page.reload()
  await ready()
  check(
    "Read-cloth reload is byte-identical and shows real hand-in state",
    (await raw()) === read &&
      (await waypoint(keeper).textContent()).includes("Hoàn tất nhập môn") &&
      (await props()).find((p) => p.entityId === table).state === "read",
  )
  await approach(keeper, 160, 272)
  await interact("Hoàn tất nhập môn")
  const intro = await raw()
  check(
    "True intro hand-in grants exactly saved five/30XP/one receipt while drawing one leader",
    (await save()).progress.partyIds.length === 5 &&
      (await save()).economy.teamExperience === 30 &&
      (await save()).economy.receipts.length === 1 &&
      (await canvas().getAttribute("data-party-size")) === "1",
  )
  await interact()
  await close()
  check(
    "Reopened Bà dialogue cannot repeat intro grant",
    (await raw()) === intro &&
      (await waypoint(keeper).textContent()).includes("vẫn chờ"),
  )
  const target = waypoint(table)
  await target.focus()
  await page.keyboard.press("e")
  await page.keyboard.press("ArrowDown")
  check(
    "Native waypoint keyboard ownership does not open dialogue or move the map",
    !(await page.getByRole("dialog").isVisible()) && (await raw()) === intro,
  )
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 })
    await ready()
    check(
      `Village native labels/controls fit ${width}px and sprites retain clear text`,
      await page.evaluate(
        ({ manifest }) => {
          const host = document.querySelector('[data-testid="world-map"]'),
            b = host.getBoundingClientRect(),
            c = host.querySelector("canvas"),
            actual = JSON.parse(c.dataset.interactionProps),
            buttons = [
              ...document.querySelectorAll(
                '[data-testid="village-waypoints"] button',
              ),
            ]
          const overlap = (a, b) =>
            a.left < b.right - 1 &&
            a.right > b.left + 1 &&
            a.top < b.bottom - 1 &&
            a.bottom > b.top + 1
          const shapes = actual
            .filter((p) => p.entityId !== manifest.props[2].entityId)
            .map((p) => {
              const spec = manifest.props.find(
                  (s) => s.entityId === p.entityId,
                ),
                left =
                  b.left + ((p.x - p.width * spec.anchorX) * b.width) / 640,
                top = b.top + ((p.y - p.height * spec.anchorY) * b.height) / 384
              return {
                left,
                top,
                right: left + (p.width * b.width) / 640,
                bottom: top + (p.height * b.height) / 384,
              }
            })
          return (
            document.documentElement.scrollWidth <= innerWidth &&
            buttons.every((x) => x.getBoundingClientRect().height >= 44) &&
            [...host.querySelectorAll(".aw2-world-label")].every((l) => {
              const r = l.getBoundingClientRect()
              return (
                r.left >= b.left - 1 &&
                r.right <= b.right + 1 &&
                !shapes.some((s) => overlap(r, s))
              )
            })
          )
        },
        { manifest },
      ),
    )
    if (width === 390) {
      await map().screenshot({ path: `${out}/${flavor}-village-390.png` })
      await page
        .getByTestId("village-waypoints")
        .screenshot({ path: `${out}/${flavor}-waypoints-390.png` })
    }
  }
  await page.setViewportSize({ width: 1280, height: 1000 })
  await go(320, 292)
  await page.waitForFunction(
    () =>
      +document.querySelector('[data-testid="world-map"] canvas').dataset
        .foregroundAlpha < 1,
  )
  check(
    "Existing well obstruction fades when it occludes the leader",
    +(await canvas().getAttribute("data-foreground-alpha")) ===
      manifest.obstacle.occludedAlpha,
  )
  await page.evaluate(() => {
    window.__route = []
    window.__timer = setInterval(() => {
      const p = JSON.parse(
        document.querySelector('[data-testid="world-map"] canvas').dataset
          .partyPositions,
      )[0]
      window.__route.push({ x: p.x, y: p.y - 6 })
    }, 16)
  })
  await go(320, 366)
  const route = await page.evaluate(() => {
    clearInterval(window.__timer)
    return window.__route
  })
  check(
    "Actual touch route detours around original collider and restores well alpha",
    route.length > 0 &&
      route.every(
        (p) =>
          !(
            p.x + 10 > 288 &&
            p.x - 10 < 352 &&
            p.y + 10 > 304 &&
            p.y - 10 < 352
          ),
      ) &&
      +(await canvas().getAttribute("data-foreground-alpha")) === 1 &&
      (await raw()) === intro,
  )
  await approach(`${village}:exit:east`, 616, 192)
  check(
    "East waypoint never travels or writes on arrival",
    (await save()).progress.zoneId === village && (await raw()) === intro,
  )
  await interact("Đi qua")
  await ready()
  check(
    "Explicit east travel enters original street with same five/XP",
    (await save()).progress.zoneId === "aw2-zone-lantern-street" &&
      (await canvas().getAttribute("data-scene-id")) === "debug-terrain" &&
      (await save()).economy.teamExperience === 30,
  )
  await travel(24, "Làng Giao Ước")
  check(
    "Reciprocal return restores village art/three targets and saved leader",
    (await canvas().getAttribute("data-scene-id")) === manifest.id &&
      (await props()).length === 3 &&
      (await canvas().getAttribute("data-party-size")) === "1",
  )
  const priorPath = `.asset-work/aw2-011b/${flavor}-demo.json`,
    priorText = await readFile(priorPath, "utf8"),
    prior = JSON.parse(priorText),
    earned = prior.checkpointRaw
  assert.equal(prior.status, "PASS")
  assert.equal(JSON.parse(earned).progress.questIndex, 4)
  checkpoint = {
    path: priorPath,
    reportSha256: createHash("sha256").update(priorText).digest("hex"),
    rawSha256: createHash("sha256").update(earned).digest("hex"),
  }
  await page.evaluate(({ key, earned }) => localStorage.setItem(key, earned), {
    key,
    earned,
  })
  await page.reload()
  await ready()
  check(
    "Exact earned 011B ending restore preserves its actual yard checkpoint",
    (await raw()) === earned &&
      (await save()).progress.zoneId === "aw2-zone-forgotten-kitchen-yard",
  )
  await travel(24, "Phố Đèn Lồng")
  await travel(24, "Làng Giao Ước")
  const earnedVillage = await raw()
  check(
    "Native return from earned ending shows completed Bà without new reward",
    JSON.stringify((await save()).economy) ===
      JSON.stringify(JSON.parse(earned).economy) &&
      (await waypoint(keeper).textContent()).includes("Đã để ghế trống chờ") &&
      (await save()).economy.teamExperience === 345,
  )
  await travel(616, "Phố Đèn Lồng")
  await travel(616, "Sân Bếp Bỏ Quên")
  await travel(616, "Phòng Kho")
  await travel(616, "Phòng Lửa")
  check(
    "Shared renderer retains hearth floor/five stateful props/native menu",
    (await canvas().getAttribute("data-scene-id")) ===
      "aw2-environment-kitchen-hearth-v1" &&
      (await props()).length === 5 &&
      (await page
        .getByTestId("hearth-room-waypoints")
        .getByRole("button")
        .count()) === 5,
  )
  await travel(616, "Phòng Bàn")
  check(
    "Shared renderer retains own table boss/three ground props/four native targets",
    (await canvas().getAttribute("data-scene-id")) ===
      "aw2-environment-kitchen-table-v1" &&
      (await props()).length === 3 &&
      (await canvas().getAttribute("data-world-boss")) !== null &&
      (await page
        .getByTestId("table-room-waypoints")
        .getByRole("button")
        .count()) === 4,
  )
  await travel(24, "Phòng Lửa")
  check(
    "Reciprocal room transition preserves ending/XP and one representative",
    (await save()).progress.endingChoice === "wait" &&
      (await save()).economy.teamExperience === 345 &&
      (await canvas().getAttribute("data-party-size")) === "1",
  )
  for (const asset of [manifest.assets.floor, manifest.assets.props]) {
    fault = asset.url
    await page.route(`**${asset.url}`, (r) =>
      r.fulfill({ status: 404, body: "expected006Gmissingtexture" }),
    )
    await page.evaluate(
      ({ key, earned }) => localStorage.setItem(key, earned),
      { key, earned: earnedVillage },
    )
    await page.reload()
    await map().getByRole("alert").waitFor()
    const before = await writes()
    check(
      `Missing ${asset.id} gives error/no fallback/disabled targets/exact bytes`,
      (await canvas().count()) === 0 &&
        (await page.getByTestId("village-waypoints").getByRole("button").all())
          .length === 3 &&
        (await page
          .getByTestId("village-waypoints")
          .getByRole("button")
          .evaluateAll((bs) => bs.every((b) => b.disabled))) &&
        (await raw()) === earnedVillage &&
        (await writes()) === before,
    )
    await page.unroute(`**${asset.url}`)
    await page.reload()
    await ready()
    fault = ""
    check(
      `Recovered ${asset.id} restores real art without save writes`,
      (await canvas().getAttribute("data-scene-id")) === manifest.id &&
        (await raw()) === earnedVillage &&
        (await writes()) === 0,
    )
  }
  check(
    "Legacy sentinels remain exact throughout",
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
        status: "PASS",
        task: "AW2-006G",
        flavor,
        engine: browser.version(),
        checks,
        errors,
        expectedErrors,
        requests,
        checkpoint,
        scope:
          "Fresh native intro + exact earned 011B ending continuation and source/compiled renderer regressions; developer checks only. Owner deferred independent human/device acceptance.",
      },
      null,
      2,
    ) + "\n",
  )
  console.log(JSON.stringify({ status: "PASS", flavor, checks: checks.length }))
} catch (cause) {
  await mkdir(out, { recursive: true })
  await page
    ?.screenshot({ path: `${out}/${flavor}-failure.png`, fullPage: true })
    .catch(() => {})
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        status: "FAIL",
        flavor,
        checks,
        errors,
        expectedErrors,
        failure: String(cause),
      },
      null,
      2,
    ) + "\n",
  )
  throw cause
} finally {
  await browser?.close()
  await server.close()
}
