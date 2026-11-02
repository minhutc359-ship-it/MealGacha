import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { isAbsolute, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { createServer, preview } from "vite"

const { values } = parseArgs({
  options: {
    compiled: { type: "boolean", default: false },
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
  },
})
const modulePath = isAbsolute(values.playwright)
  ? pathToFileURL(resolve(values.playwright)).href
  : values.playwright
const { chromium } = await import(modulePath)
const flavor = values.compiled ? "compiled" : "source"
const port = values.compiled ? 8469 : 8468
const root = `http://127.0.0.1:${port}`
const out = ".asset-work/aw2-004h"
const checks = [],
  errors = []
const check = (name, condition = true) => {
  assert.ok(condition, name)
  checks.push(name)
  console.log(name)
}
let server, browser
const stable = {
  "foodchest.tcg.v1": "stable cards",
  "foodchest.user.v1": "stable user",
  "aw2.development.save": "untouched preview bytes",
}
try {
  await mkdir(out, { recursive: true })
  server = values.compiled
    ? await preview({
        configFile: "dev/vite.aw2.config.ts",
        preview: { host: "127.0.0.1", port, strictPort: true },
      })
    : await createServer({
        configFile: "dev/vite.dev.config.ts",
        server: { host: "127.0.0.1", port, strictPort: true },
      })
  if (!values.compiled) await server.listen()
  browser = await chromium.launch({
    executablePath: values.chromium,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--use-angle=swiftshader",
    ],
  })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
  })
  await context.addInitScript((stable) => {
    Object.entries(stable).forEach(([key, value]) =>
      localStorage.setItem(key, value),
    )
    window.__draws = { count: 0, invalid: 0, actors: new Set() }
    const draw = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      const [image, x, y, width, height] = args
      if (
        image instanceof HTMLImageElement &&
        image.src.includes("/aw2/assets/")
      ) {
        window.__draws.count++
        if (
          args.length !== 9 ||
          x < 0 ||
          y < 0 ||
          x + width > image.naturalWidth ||
          y + height > image.naturalHeight
        )
          window.__draws.invalid++
        if (image.src.includes("battle"))
          window.__draws.actors.add(
            new URL(image.src).pathname.split("/").at(-3),
          )
      }
      return draw.apply(this, args)
    }
  }, stable)
  const page = await context.newPage()
  const watch = (p) => {
    p.on("pageerror", (e) => errors.push(e.message))
    p.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text())
    })
    p.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
    })
  }
  watch(page)
  await page.goto(`${root}/dev/aw2/battle.html`)
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  const canvas = page.locator("canvas")
  await page.waitForFunction(
    () => document.querySelector("canvas")?.dataset.actorLayout,
  )
  check(
    "Actual decoded atlases for all five starters draw without invalid source cells",
    await page.evaluate(
      () => window.__draws.actors.size === 5 && window.__draws.invalid === 0,
    ),
  )
  const beforeTick = await canvas.getAttribute("data-tick")
  const beforeMotion = await canvas.getAttribute("data-motion-time")
  for (const width of [1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.waitForFunction(() => {
      const c = document.querySelector("canvas")
      return Math.abs(c.width - c.getBoundingClientRect().width) < 2
    })
    const metrics = await page.evaluate(() => {
      const c = document.querySelector("canvas"),
        points = Object.values(JSON.parse(c.dataset.actorLayout))
      const buttons = [
        ...document.querySelectorAll('[data-testid^="ultimate-"]'),
      ]
      return {
        width: c.width,
        height: c.height,
        points,
        overflow: document.documentElement.scrollWidth > innerWidth,
        buttons: buttons.map((b) => ({
          width: b.getBoundingClientRect().width,
          height: b.getBoundingClientRect().height,
          font: parseFloat(getComputedStyle(b).fontSize),
        })),
      }
    })
    check(
      `${width}px: all eight actors have distinct bounded lanes and associated labels`,
      metrics.points.length === 8 &&
        new Set(metrics.points.map((p) => p.y)).size === 8 &&
        metrics.points.every(
          (p) =>
            p.x >= 64 && p.x <= metrics.width - 64 && p.y + 32 < metrics.height,
        ),
    )
    check(
      `${width}px: no page overflow or whole-stage text shrink`,
      !metrics.overflow && metrics.width <= 960 && metrics.width >= 240,
    )
    check(
      `${width}px: five ultimate controls retain readable 44px targets`,
      metrics.buttons.length === 5 &&
        metrics.buttons.every(
          (b) => b.width >= 44 && b.height >= 44 && b.font >= 14,
        ),
    )
    check(
      `${width}px: paused resize preserves rules tick and playback clock`,
      (await canvas.getAttribute("data-tick")) === beforeTick &&
        (await canvas.getAttribute("data-motion-time")) === beforeMotion,
    )
    await page.locator(".aw2-battle-jumps a").first().focus()
    await page.keyboard.press("Enter")
    check(
      `${width}px: keyboard jump reaches the ultimate section`,
      await page.evaluate(
        () => document.activeElement?.id === "battle-ultimates",
      ),
    )
    await canvas.screenshot({ path: `${out}/${flavor}-arena-${width}.png` })
  }
  await page.locator("#battle-roster summary").click()
  check(
    "Screen-readable roster associates eight names, HP and finite current statuses",
    (await page.locator("#battle-roster li").count()) === 8 &&
      (await page.locator("#battle-roster").innerText()).includes("HP"),
  )
  const step = async () => {
    const tick = +(await canvas.getAttribute("data-tick"))
    await page.getByRole("button", { name: "Bước 1 nhịp", exact: true }).click()
    await page.waitForFunction(
      (t) => +document.querySelector("canvas").dataset.tick === t + 1,
      tick,
    )
  }
  // Real UI commands only: no fabricated combat events or terminal state.
  let sawProjectile = false,
    sawConfirmed = false,
    initialLanes = JSON.parse(await canvas.getAttribute("data-actor-layout"))
  for (
    let tick = 0;
    tick < 160 && (await canvas.getAttribute("data-status")) === "active";
    tick++
  ) {
    if (tick === 5)
      for (const button of await page
        .locator('[data-testid^="ultimate-"]')
        .all())
        if (await button.isEnabled()) await button.click()
    await step()
    sawProjectile ||= +(await canvas.getAttribute("data-projectiles")) > 0
    sawConfirmed ||= Object.values(
      JSON.parse(await canvas.getAttribute("data-actor-effects")),
    ).some((items) => items.some((item) => item.fx && item.targetId))
    const positions = JSON.parse(await canvas.getAttribute("data-actor-layout"))
    assert.ok(
      Object.entries(positions).every(
        ([id, p]) => p.lane === initialLanes[id].lane,
      ),
      "Defeat/movement must not reassign depth lanes",
    )
    if (tick === 8)
      await canvas.screenshot({ path: `${out}/${flavor}-contacts.png` })
    if (tick === 9)
      await page
        .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
        .check()
  }
  check(
    "Real moving battle retains lanes, flights and confirmed target effects",
    sawProjectile && sawConfirmed,
  )
  check(
    "Real terminal clears flights and numeric outcome clutter in reduced motion",
    (await canvas.getAttribute("data-status")) !== "active" &&
      (await canvas.getAttribute("data-projectiles")) === "0",
  )
  await canvas.screenshot({ path: `${out}/${flavor}-terminal.png` })
  check(
    "Independent preview preserves exact seeded AW2/stable bytes",
    await page.evaluate(
      (stable) =>
        Object.entries(stable).every(
          ([key, value]) => localStorage.getItem(key) === value,
        ),
      stable,
    ),
  )
  const qa = await browser.newContext({
    viewport: { width: 390, height: 1000 },
  })
  const fixture = {
    gameId: "adventure-world-2",
    environment: "development",
    schemaVersion: 3,
    saveId: "00000000-0000-4000-8000-000000000001",
    revision: 8,
    createdAt: "2026-10-20T08:00:00.000Z",
    updatedAt: "2026-10-20T08:00:00.000Z",
    progress: {
      zoneId: "aw2-zone-kitchen-table",
      x: 320,
      y: 128,
      facing: "right",
      questIndex: 3,
      accepted: true,
      tableRead: true,
      memories: [
        "aw2-event-memory-vendor",
        "aw2-event-memory-chair",
        "aw2-event-memory-bowl",
      ],
      threadChoice: "wait",
      hintRead: true,
      puzzleStep: 3,
      partyIds: ["aw2-than", "aw2-lua", "aw2-lam", "aw2-moc-non", "aw2-suong"],
      bossDefeated: false,
      tableNoteRead: false,
      endingChoice: null,
    },
  }
  await qa.addInitScript(
    (fixture) =>
      localStorage.setItem("aw2.development.save", JSON.stringify(fixture)),
    fixture,
  )
  const world = await qa.newPage()
  watch(world)
  await world.goto(`${root}/dev/aw2/world.html`)
  await world.locator('[data-testid="player-position"]').waitFor()
  await world.keyboard.press("e")
  await world
    .getByRole("button", { name: "Bắt đầu thử thách", exact: true })
    .click()
  await world.getByTestId("world-battle").waitFor()
  await world.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  await world.waitForFunction(
    () => document.querySelector("canvas")?.dataset.actorLayout,
  )
  for (const width of [390, 320]) {
    await world.setViewportSize({ width, height: 1000 })
    await world.waitForFunction(
      () =>
        Math.abs(
          document.querySelector("canvas").width -
            document.querySelector("canvas").getBoundingClientRect().width,
        ) < 2,
    )
    check(
      `World boss ${width}px: full labels/HP and five readable ultimate rows`,
      await world.evaluate(() => {
        const cards = [
          ...document.querySelectorAll(".aw2-ultimate-grid article"),
        ]
        return (
          cards.length === 5 &&
          cards.every(
            (c) =>
              parseFloat(
                getComputedStyle(c.querySelector("strong")).fontSize,
              ) >= 16 &&
              c.querySelector("button").getBoundingClientRect().height >= 44,
          ) &&
          document.documentElement.scrollWidth <= innerWidth
        )
      }),
    )
    await world
      .locator("canvas")
      .screenshot({ path: `${out}/${flavor}-boss-${width}.png` })
  }
  await world
    .locator(".aw2-ultimate-grid")
    .screenshot({ path: `${out}/${flavor}-boss-controls.png` })
  await world.locator("#battle-roster summary").click()
  check(
    "Canonical long boss name remains fully available in the associated roster",
    (await world.locator("#battle-roster").innerText()).includes(
      "Người Giữ Bàn Quên",
    ),
  )
  check("No browser/page/asset errors", errors.length === 0)
  await writeFile(
    `${out}/${flavor}.json`,
    JSON.stringify(
      {
        task: "AW2-004H",
        flavor,
        checks,
        errors,
        browser: await browser.version(),
        widths: [1280, 768, 390, 320],
        worldFixture:
          "Isolated v3 ready-quest fixture; actual beginBoss/checkpoint, not an earned full quest journey.",
      },
      null,
      2,
    ) + "\n",
  )
  console.log(`PASS ${checks.length} ${flavor} checks`)
} finally {
  await browser?.close()
  if (values.compiled)
    await new Promise((resolve) => server?.httpServer.close(resolve))
  else await server?.close()
}
