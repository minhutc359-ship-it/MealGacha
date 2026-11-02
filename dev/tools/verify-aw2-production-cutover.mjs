import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"

const { values } = parseArgs({
  options: {
    compiled: { type: "boolean", default: false },
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
  },
})
const flavor = values.compiled ? "compiled" : "source"
const port = values.compiled ? 8801 : 8800
const origin = `http://127.0.0.1:${port}`
const out = ".asset-work/aw2-018a-production"
const checks = []
const errors = []
const requests = new Set()
const legacy = {
  "foodchest.tcg.v1": "018a-original-tcg-bytes",
  "foodchest.user.v1": "018a-original-user-bytes",
}
const server = values.compiled
  ? await preview({
      configFile: "vite.config.ts",
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
const check = (name, condition) => {
  assert.ok(condition, name)
  checks.push(name)
  console.log(name)
}
const { chromium } = await import(values.playwright)
let browser
let page

try {
  await mkdir(out, { recursive: true })
  if (!values.compiled) await server.listen()
  browser = await chromium.launch({
    executablePath: values.chromium,
    headless: true,
    env: {
      ...process.env,
      LD_LIBRARY_PATH: values.chromium?.slice(
        0,
        values.chromium.lastIndexOf("/"),
      ),
    },
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
    reducedMotion: "reduce",
  })
  await context.addInitScript((sentinels) => {
    for (const [key, value] of Object.entries(sentinels))
      localStorage.setItem(key, value)
  }, legacy)
  page = await context.newPage()
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`)
  })
  page.on("request", (request) => requests.add(request.url()))
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`)
  })

  const unchangedLegacy = () =>
    page.evaluate(
      (sentinels) =>
        Object.entries(sentinels).every(
          ([key, value]) => localStorage.getItem(key) === value,
        ),
      legacy,
    )
  const waitForWorld = async () => {
    await page.getByTestId("game-shell").waitFor()
    await page.locator("canvas[data-party-size='1']").waitFor()
    await page.locator(".aw2-map-loading").waitFor({ state: "hidden" })
  }

  await page.goto(origin)
  await page.getByTestId("game-shell").waitFor()
  check(
    "Root mounts the fixed AW2 production shell",
    (await page.locator(".aw2-game-shell").count()) === 1,
  )
  check(
    "Root does not mount the old main client",
    (await page
      .locator(".loot-client,.client-topbar,.mobile-bottom-nav,.activity-rail")
      .count()) === 0,
  )
  check(
    "Production shell exposes no development links",
    (await page.locator('a[href^="/dev/aw2"]').count()) === 0,
  )
  check(
    "Legacy save bytes survive production bootstrap",
    await unchangedLegacy(),
  )
  await page
    .getByRole("button", { name: "Bắt đầu hành trình", exact: true })
    .click()
  await waitForWorld()
  const aw2Raw = await page.evaluate(() =>
    localStorage.getItem("aw2.development.save"),
  )
  check(
    "Explicit start creates a separate valid AW2 save",
    !!aw2Raw && JSON.parse(aw2Raw).gameId === "adventure-world-2",
  )
  check(
    "Starting AW2 does not overwrite original save bytes",
    await unchangedLegacy(),
  )
  await page.screenshot({ path: `${out}/${flavor}-root.png` })

  for (const path of [
    "/game",
    "/adventure",
    "/autochess",
    "/pvp",
    "/collection",
    "/events",
    "/daily-quiz",
    "/settings",
    "/unknown-old-route",
  ]) {
    await page.goto(`${origin}${path}`)
    await page.getByTestId("game-shell").waitFor()
    check(
      `${path} falls through to AW2`,
      (await page.locator(".loot-client").count()) === 0,
    )
  }
  check(
    "Legacy route fallback preserves both save namespaces",
    (await unchangedLegacy()) &&
      (await page.evaluate(() =>
        localStorage.getItem("aw2.development.save"),
      )) === aw2Raw,
  )

  for (const path of ["/chest", "/chest/"]) {
    await page.goto(`${origin}${path}`)
    await page.getByTestId("production-original-chest").waitFor()
    await page.getByRole("button", { name: /KHAI MỞ RƯƠNG/ }).waitFor()
    check(
      `${path} mounts only the original chest surface`,
      (await page
        .locator(".client-topbar,.mobile-bottom-nav,.activity-rail")
        .count()) === 0,
    )
  }
  check(
    "Chest links return only to the new journey and static legal page",
    (await page
      .locator(
        'a[href="/collection"],a[href="/events"],a[href="/daily-quiz"],a[href^="/adventure"]',
      )
      .count()) === 0,
  )
  check(
    "Chest keeps original and AW2 save bytes isolated",
    (await unchangedLegacy()) &&
      (await page.evaluate(() =>
        localStorage.getItem("aw2.development.save"),
      )) === aw2Raw,
  )
  await page.screenshot({ path: `${out}/${flavor}-chest.png`, fullPage: true })

  await page.goto(origin)
  await waitForWorld()
  check(
    "AW2 reload restores the exact saved envelope",
    (await page.evaluate(() =>
      localStorage.getItem("aw2.development.save"),
    )) === aw2Raw,
  )
  const assetUrls = [...requests].filter(
    (url) => url.includes("/dev/aw2/assets/") || url.includes("/assets/aw2/"),
  )
  check(
    values.compiled
      ? "Compiled runtime loads only /assets/aw2 production URLs"
      : "Source runtime retains /dev/aw2/assets review URLs",
    assetUrls.length > 0 &&
      assetUrls.every((url) =>
        values.compiled
          ? url.includes("/assets/aw2/") && !url.includes("/dev/aw2/assets/")
          : url.includes("/dev/aw2/assets/"),
      ),
  )
  check(
    "No unexpected browser, console, or resource errors",
    errors.length === 0,
  )

  await writeFile(
    `${out}/${flavor}-browser.json`,
    `${JSON.stringify(
      {
        task: "AW2-018A",
        status: "PASS",
        flavor,
        checks,
        assertions: checks.length,
        errors,
        aw2SaveBytes: aw2Raw.length,
        observedAssetUrls: assetUrls.length,
        limitations:
          "Fresh isolated Chromium production-cutover smoke; not deployment, physical-device, human playtest, final art, rights, FPS, or offline acceptance.",
      },
      null,
      2,
    )}\n`,
  )
  console.log(`PASS ${flavor} ${checks.length}`)
} catch (error) {
  await page
    ?.screenshot({ path: `${out}/${flavor}-failure.png`, fullPage: true })
    .catch(() => {})
  await writeFile(
    `${out}/${flavor}-browser.json`,
    `${JSON.stringify(
      {
        task: "AW2-018A",
        status: "FAIL",
        flavor,
        checks,
        errors,
        observedRequests: [...requests].filter((url) => url.includes("assets")),
        error: String(error.stack ?? error),
      },
      null,
      2,
    )}\n`,
  )
  throw error
} finally {
  await browser?.close()
  await server.close()
}
