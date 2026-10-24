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
  port = values.compiled ? 8537 : 8536
const out = ".asset-work/aw2-006f",
  key = "aw2.development.save",
  zone = "aw2-zone-kitchen-hearth"
const manifest = JSON.parse(
  await readFile("src/aw2/assets/kitchen-hearth.environment-v1.json", "utf8"),
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
const { chromium } = await import(values.playwright),
  checks = [],
  errors = [],
  expectedErrors = [],
  requests = []
const legacy = {
  "foodchest.user.v1": "006f-original-user",
  "foodchest.tcg.v1": "006f-original-cards",
}
const check = (name, condition = true) => {
  assert.ok(condition, name)
  checks.push(name)
  console.log(name)
}
let browser,
  page,
  phase = "start",
  origin
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
  await page.goto(`http://127.0.0.1:${port}/dev/aw2/world.html`)
  const raw = () => page.evaluate((key) => localStorage.getItem(key), key),
    save = async () => JSON.parse(await raw())
  const map = () => page.getByTestId("world-map"),
    canvas = () => map().locator("canvas")
  const ready = async () => {
    await page.waitForFunction(() => {
      const p = JSON.parse(
          localStorage.getItem("aw2.development.save"),
        )?.progress,
        c = document.querySelector('[data-testid="world-map"] canvas')
      const expected =
        p?.zoneId === "aw2-zone-kitchen-hearth"
          ? "aw2-environment-kitchen-hearth-v1"
          : p?.zoneId === "aw2-zone-kitchen-table"
            ? "aw2-environment-kitchen-table-v1"
            : "debug-terrain"
      return (
        c?.dataset.sceneId === expected &&
        c.dataset.partySize === "1" &&
        c.dataset.partyIds === JSON.stringify([p.partyIds[0] ?? "aw2-than"])
      )
    })
    await map().locator(".aw2-map-loading").waitFor({ state: "hidden" })
  }
  const pos = async () => {
    const m = (await page.getByTestId("player-position").textContent()).match(
      /Vị trí (\d+), (\d+)/,
    )
    return { x: +m[1], y: +m[2] }
  }
  const arrive = async (x, y) =>
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
    await map().scrollIntoViewIfNeeded()
    const b = await map().boundingBox()
    await page.touchscreen.tap(
      b.x + (x * b.width) / 640,
      b.y + (y * b.height) / 384,
    )
    await arrive(x, y)
  }
  const interact = async (label) => {
    await map().focus()
    await page.keyboard.press("e")
    await page.getByRole("dialog").waitFor()
    if (label) {
      await page
        .getByRole("dialog")
        .getByRole("button", { name: label, exact: true })
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
  const props = async () =>
    JSON.parse(await canvas().getAttribute("data-interaction-props"))
  const room = async () => {
    await ready()
    await page.waitForFunction(
      () =>
        JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas')?.dataset
            .interactionProps ?? "[]",
        ).length === 5,
    )
  }
  const waypoint = (id) => page.getByTestId(`room-waypoint-${id}`)
  const approach = async (id, x, y) => {
    await waypoint(id).click()
    await arrive(x, y)
  }
  const checkpointPath = `.asset-work/aw2-006b/failed-intro/${flavor}-demo.json`
  const input = await readFile(checkpointPath, "utf8"),
    checkpointRaw = JSON.parse(input).observedRaw
  assert.equal(JSON.parse(checkpointRaw).progress.questIndex, 1)
  origin = {
    path: checkpointPath,
    reportSha256: createHash("sha256").update(input).digest("hex"),
    rawSha256: createHash("sha256").update(checkpointRaw).digest("hex"),
    scope:
      "Exact earned intro checkpoint from historical006B; later selector failure is not reused as passing assertions",
  }
  await page.evaluate(
    ({ key, checkpointRaw, legacy }) => {
      localStorage.setItem(key, checkpointRaw)
      Object.entries(legacy).forEach(([k, v]) => localStorage.setItem(k, v))
    },
    { key, checkpointRaw, legacy },
  )
  await page.reload()
  await ready()
  check(
    "Exact earned intro restore is read-only with one saved representative",
    (await raw()) === checkpointRaw,
  )
  check(
    "Hearth assets are lazy before visiting the room",
    !requests.some(
      (p) => p.includes("kitchen-hearth/v1/") && p.endsWith(".webp"),
    ),
  )
  phase = "earn-hearth-quest"
  await travel(616, "Phố Đèn Lồng")
  await go(160, 112)
  await interact("Nhận nhiệm vụ")
  for (const x of [504, 280, 392]) {
    await go(x, 128)
    await interact("Ghi nhớ câu chuyện")
  }
  await go(160, 112)
  await interact("Người chờ")
  await travel(616, "Sân Bếp Bỏ Quên")
  await go(320, 128)
  await interact("Nhận nhiệm vụ")
  await travel(616, "Phòng Kho")
  await travel(616, "Phòng Lửa")
  await room()
  const noHint = await raw(),
    economy = JSON.stringify((await save()).economy)
  check(
    "Native accepted quest reaches original floor/three atlas props/two exits without fabricated flags",
    (await save()).progress.questIndex === 2 &&
      !(await save()).progress.hintRead &&
      (await props()).length === 5,
  )
  check(
    "All required current-room textures load and HD boss remains lazy",
    [
      manifest.assets.floor.url,
      manifest.assets.puzzles.url,
      manifest.assets.sideboard.url,
      manifest.assets.threshold.url,
    ].every((u) => requests.includes(u)) &&
      !requests.some((p) =>
        p.includes("forgotten-host/reference-v1/battle.webp"),
      ),
  )
  check(
    "Three distinct neutral props retain canonical positions and unavailable state",
    (await props())
      .slice(0, 3)
      .every(
        (p, i) =>
          p.x === 208 + i * 112 &&
          p.y === 144 &&
          p.state === "unavailable" &&
          p.alpha === manifest.states.unavailableAlpha,
      ),
  )
  check(
    "Text directs player to hint and east waypoint stays disabled",
    (await waypoint(`${zone}:exit:east`).isDisabled()) &&
      (await waypoint("aw2-object-steam-0").textContent()).includes(
        "Bảng dấu hơi",
      ),
  )
  await approach("aw2-object-steam-0", 208, 144)
  await interact()
  check(
    "Approaching without hint neither solves nor offers unauthorized puzzle action",
    (await page
      .getByRole("dialog")
      .getByRole("button", { name: "Mở lối thoát", exact: true })
      .count()) === 0 && (await raw()) === noHint,
  )
  await page.keyboard.press("Escape")
  await go(616, 192)
  await interact()
  check(
    "Touch destination cannot bypass real inner-door gate",
    (await page
      .getByRole("dialog")
      .getByRole("button", { name: "Đi qua", exact: true })
      .count()) === 0 && (await raw()) === noHint,
  )
  await page.keyboard.press("Escape")
  await approach(`${zone}:exit:west`, 24, 192)
  await interact("Đi qua")
  await ready()
  await go(240, 128)
  await interact("Ghi lại gợi ý")
  await travel(616, "Phòng Lửa")
  await room()
  check(
    "Reading actual pantry hint enables first step and leaves later steps waiting",
    (await props())
      .slice(0, 3)
      .map((p) => p.state)
      .join(",") === "ready,waiting,waiting",
  )
  const hintRaw = await raw()
  await waypoint("aw2-object-steam-2").focus()
  await waypoint("aw2-object-steam-2").press("Enter")
  await arrive(432, 144)
  check(
    "Keyboard native waypoint restores map focus without interaction or saving",
    (await map().evaluate((e) => e === document.activeElement)) &&
      (await page.getByRole("dialog").count()) === 0 &&
      (await raw()) === hintRaw,
  )
  await interact("Nhóm lửa")
  await room()
  check(
    "Real wrong-order action resets only attempt with identical economy",
    (await save()).progress.puzzleStep === 0 &&
      JSON.stringify((await save()).economy) === economy,
  )
  phase = "partial-and-solved"
  await approach("aw2-object-steam-0", 208, 144)
  await interact("Mở lối thoát")
  await room()
  check(
    "First authentic step shows done/ready/waiting and no economy grant",
    (await props())
      .slice(0, 3)
      .map((p) => p.state)
      .join(",") === "done,ready,waiting" &&
      JSON.stringify((await save()).economy) === economy,
  )
  const partial = await raw()
  await page.reload()
  await room()
  check(
    "Partial puzzle reload restores exact committed bytes and next target",
    (await raw()) === partial &&
      (await props())[1].state === "ready" &&
      (await waypoint(`${zone}:exit:east`).isDisabled()),
  )
  await go(320, 192)
  const beforeKey = await pos()
  await map().focus()
  await page.keyboard.down("ArrowRight")
  await page.waitForTimeout(180)
  await page.keyboard.up("ArrowRight")
  check(
    "Native keyboard movement retains single representative and does not write",
    (await pos()).x > beforeKey.x &&
      (await canvas().getAttribute("data-party-size")) === "1" &&
      (await raw()) === partial,
  )
  await go(272, 320)
  const blockRaw = await raw()
  await go(368, 320)
  check(
    "Destination routes around unchanged furniture collision without saving",
    (await raw()) === blockRaw && (await pos()).x === 368,
  )
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 1000 })
    await room()
    const fit = await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    )
    const buttons = await page
      .getByTestId("hearth-room-waypoints")
      .getByRole("button")
      .evaluateAll(
        (bs) =>
          bs.length === 5 &&
          bs.every((b) => {
            const r = b.getBoundingClientRect()
            return (
              r.width >= 44 &&
              r.height >= 44 &&
              r.left >= 0 &&
              r.right <= innerWidth
            )
          }),
      )
    const labels = await map()
      .locator(".aw2-world-label")
      .evaluateAll((es) =>
        es.every((e) => {
          const r = e.getBoundingClientRect(),
            p = e.parentElement.getBoundingClientRect()
          return (
            r.left >= p.left - 1 &&
            r.right <= p.right + 1 &&
            r.bottom <= p.bottom + 1
          )
        }),
      )
    check(
      `${width}px room labels/44px native controls fit without overflow`,
      fit && buttons && labels,
    )
    await page.screenshot({
      path: `${out}/${flavor}-${width}.png`,
      fullPage: true,
    })
  }
  await page.setViewportSize({ width: 1280, height: 1000 })
  await approach("aw2-object-steam-1", 320, 144)
  await interact("Đặt nồi")
  await room()
  check(
    "Second authentic step advances only next prop",
    (await save()).progress.puzzleStep === 2 &&
      (await props())
        .slice(0, 3)
        .map((p) => p.state)
        .join(",") === "done,done,ready",
  )
  await approach("aw2-object-steam-2", 432, 144)
  await interact("Nhóm lửa")
  await room()
  check(
    "Third explicit action solves puzzle and opens native inner exit without rewards",
    (await save()).progress.puzzleStep === 3 &&
      (await props()).slice(0, 3).every((p) => p.state === "solved") &&
      !(await waypoint(`${zone}:exit:east`).isDisabled()) &&
      JSON.stringify((await save()).economy) === economy,
  )
  const solved = await raw()
  await page.reload()
  await room()
  check(
    "Solved reload preserves exact save and all solved text",
    (await raw()) === solved &&
      (await page.getByTestId("hearth-room-waypoints").textContent()).includes(
        "Bếp đã sáng",
      ),
  )
  await page.screenshot({ path: `${out}/${flavor}-solved.png`, fullPage: true })
  await approach(`${zone}:exit:east`, 616, 192)
  await interact("Đi qua")
  await ready()
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="world-map"] canvas')?.dataset
        .worldBoss,
  )
  check(
    "Real east travel loads original table scene/own chibi boss/four native targets",
    (await canvas().getAttribute("data-scene-id")) ===
      "aw2-environment-kitchen-table-v1" &&
      (await page
        .getByTestId("table-room-waypoints")
        .getByRole("button")
        .count()) === 4 &&
      JSON.parse(
        await canvas().getAttribute("data-world-boss"),
      ).assetId.includes("world-v1"),
  )
  await approach("aw2-object-table-note", 448, 144)
  await interact()
  check(
    "New route cannot grant unread note or start boss before final quest",
    (await page
      .getByRole("dialog")
      .getByRole("button", { name: "Đọc ghi chép", exact: true })
      .count()) === 0 && !(await save()).progress.bossDefeated,
  )
  await page.keyboard.press("Escape")
  await approach("aw2-zone-kitchen-table:exit:west", 24, 192)
  await interact("Đi qua")
  await room()
  check(
    "Reciprocal table return restores five hearth props and one saved leader",
    (await props()).length === 5 &&
      (await canvas().getAttribute("data-party-size")) === "1" &&
      JSON.stringify((await save()).economy) === economy,
  )
  await approach(`${zone}:exit:west`, 24, 192)
  await interact("Đi qua")
  await ready()
  await travel(24, "Sân Bếp Bỏ Quên")
  await go(320, 128)
  await interact("Báo đã mở bếp")
  const handed = await save()
  check(
    "Actual quest hand-in commits exactly one open-hearth receipt",
    handed.progress.questIndex === 3 &&
      handed.economy.receipts.filter((r) => r === "aw2-grant-open-hearth")
        .length === 1,
  )
  await travel(616, "Phòng Kho")
  await travel(616, "Phòng Lửa")
  await room()
  await approach("aw2-object-steam-2", 432, 144)
  const bag = page.locator("details.aw2-bag-panel")
  await bag.locator(":scope > summary").click()
  await bag.getByText("Nấu và chia một bữa ấm", { exact: true }).click()
  const preCook = await save()
  await page
    .getByRole("button", { name: "Nấu Chén cơm ấm", exact: true })
    .click()
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="item-warm-bowl"]')?.textContent ===
      "1",
  )
  check(
    "Cooking at authored hearth consumes actual ingredients only after quest hand-in",
    (await save()).economy.inventory.rice ===
      preCook.economy.inventory.rice - 1 &&
      (await save()).economy.inventory.herbs ===
        preCook.economy.inventory.herbs - 1 &&
      (await save()).economy.inventory.broth ===
        preCook.economy.inventory.broth - 1,
  )
  await page
    .getByRole("button", { name: "Chia bữa · +45 EXP", exact: true })
    .click()
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="item-warm-bowl"]')?.textContent ===
      "0",
  )
  check(
    "Native share consumes cooked bowl and grants exactly45XP",
    (await save()).economy.teamExperience ===
      preCook.economy.teamExperience + 45,
  )
  await bag.locator(":scope > summary").click()
  const finalRaw = await raw()
  await page.reload()
  await room()
  check(
    "Post-cooking reload preserves exact earned economy/party and solved scene",
    (await raw()) === finalRaw &&
      (await props()).slice(0, 3).every((p) => p.state === "solved"),
  )
  check(
    "No unexpected browser errors on the actual room story",
    errors.length === 0,
  )
  phase = "asset-fault-recovery"
  for (const asset of ["floor", "puzzles"]) {
    const route = `**${manifest.assets[asset].url}`
    await context.route(route, (r) =>
      r.fulfill({ status: 404, body: "deliberate006F asset failure" }),
    )
    await page.reload()
    await map().getByRole("alert").waitFor()
    check(
      `Missing ${asset} fails visibly without debug fallback/enabled room waypoints`,
      (await canvas().count()) === 0 &&
        (await page
          .getByTestId("hearth-room-waypoints")
          .getByRole("button")
          .evaluateAll((bs) => bs.length === 5 && bs.every((b) => b.disabled))),
    )
    check(
      `Missing ${asset} preserves exact earned save bytes`,
      (await raw()) === finalRaw,
    )
    expectedErrors.push(...errors.splice(0))
    await context.unroute(route)
    await page.reload()
    await room()
    check(
      `${asset} recovery restores own scene/one actor without writes/new errors`,
      (await raw()) === finalRaw &&
        (await canvas().getAttribute("data-party-size")) === "1" &&
        errors.length === 0,
    )
  }
  check(
    "Legacy save sentinels remain byte-identical throughout",
    await page.evaluate(
      (legacy) =>
        Object.entries(legacy).every(([k, v]) => localStorage.getItem(k) === v),
      legacy,
    ),
  )
  const result = {
    task: "AW2-006F",
    status: "PASS",
    flavor,
    engine: browser.version(),
    checks,
    errors,
    expectedErrors,
    origin,
    requests,
    checkpointRaw: await raw(),
    scope:
      "Fresh native memory/hearth quest/puzzle/hand-in/cooking route from exact historical earned intro checkpoint, not a full-story/human/device acceptance run",
  }
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(result, null, 2) + "\n",
  )
  console.log(JSON.stringify({ status: "PASS", flavor, checks: checks.length }))
} catch (e) {
  await page
    ?.screenshot({ path: `${out}/${flavor}-failure.png`, fullPage: true })
    .catch(() => {})
  await writeFile(
    `${out}/${flavor}-failure.json`,
    JSON.stringify(
      { status: "FAIL", phase, checks, errors, cause: String(e) },
      null,
      2,
    ) + "\n",
  )
  throw e
} finally {
  await browser?.close()
  await server.close()
}
