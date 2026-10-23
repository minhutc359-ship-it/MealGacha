import assert from "node:assert/strict"
import { mkdir, readdir, stat, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { preview } from "vite"
const { values } = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
  },
})
const { chromium } = await import(values.playwright)
const server = await preview({
  configFile: "dev/vite.aw2.config.ts",
  preview: { host: "127.0.0.1", port: 8455, strictPort: true },
})
const browser = await chromium.launch({
  executablePath: values.chromium,
  headless: true,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
})
const checks = [],
  errors = []
const check = (name, condition = true) => {
  assert.ok(condition, name)
  checks.push(name)
  console.log(name)
}
const root = "http://127.0.0.1:8455"
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  })
  const page = await context.newPage()
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`)
  })
  await page.goto(root)
  await page
    .getByRole("button", { name: "Tạo bản lưu AW2", exact: true })
    .waitFor()
  check(
    "Static root opens the compiled RPG world",
    page.url().endsWith("/dev/aw2/world.html") &&
      (await page.locator('link[rel="icon"]').getAttribute("href")) ===
        "data:,",
  )
  await page.evaluate(() =>
    localStorage.setItem("foodchest.tcg.v1", "stable-built-preview"),
  )
  await page
    .getByRole("button", { name: "Tạo bản lưu AW2", exact: true })
    .click()
  await page.locator('canvas[data-party-size="1"]').waitFor()
  const go = async (x, y) => {
    const map = page.getByTestId("world-map")
    await map.scrollIntoViewIfNeeded()
    const b = await map.boundingBox()
    await page.mouse.click(
      b.x + (x / 640) * b.width,
      b.y + (y / 384) * b.height,
    )
    await page.waitForFunction(
      ({ x, y }) => {
        const match = document
          .querySelector('[data-testid="player-position"]')
          ?.textContent.match(/Vị trí (\d+), (\d+)/)
        return (
          match &&
          Math.abs(Number(match[1]) - x) < 2 &&
          Math.abs(Number(match[2]) - y) < 2
        )
      },
      { x, y },
    )
  }
  const interact = async (name) => {
    await page.keyboard.press("e")
    await page
      .getByRole("dialog")
      .getByRole("button", { name, exact: true })
      .click()
    await page.getByRole("dialog").waitFor({ state: "hidden" })
  }
  await go(160, 240)
  await interact("Nhận nhiệm vụ")
  await go(160, 144)
  await interact("Đọc mảnh khăn")
  await go(160, 240)
  await interact("Hoàn tất nhập môn")
  await page.locator('canvas[data-party-size="1"]').waitFor()
  const raw = await page.evaluate(() =>
    localStorage.getItem("aw2.development.save"),
  )
  const save = JSON.parse(raw)
  check(
    "Built intro grants five starters and one 30XP reward",
    save.progress.partyIds.length === 5 &&
      save.economy.teamExperience === 30 &&
      save.economy.receipts.length === 1,
  )
  await page.reload()
  await page.locator('canvas[data-party-size="1"]').waitFor()
  check(
    "Built save survives reload byte-identically",
    (await page.evaluate(() =>
      localStorage.getItem("aw2.development.save"),
    )) === raw,
  )
  await mkdir(".asset-work/aw2-013", { recursive: true })
  await page.screenshot({
    path: ".asset-work/aw2-013/compiled-mobile.png",
    fullPage: true,
  })
  await page.goto(`${root}/dev/aw2/battle.html`)
  await page.locator("canvas[data-tick]").waitFor()
  check(
    "Standalone compiled battle loads all atlases",
    (await page.getByTestId("battle-atlas-state").innerText()) ===
      "Năm atlas chiến đấu đã tải",
  )
  await page.goto(`${root}/dev/aw2/starters.html`)
  await page.locator("canvas").waitFor()
  check("Compiled starter preview is reachable")
  check(
    "Review tools leave progression and stable save untouched",
    await page.evaluate(
      ({ raw }) =>
        localStorage.getItem("aw2.development.save") === raw &&
        localStorage.getItem("foodchest.tcg.v1") === "stable-built-preview",
      { raw },
    ),
  )
  if (errors.length) console.error(JSON.stringify({ errors }, null, 2))
  check("No failed resources or console/page errors", errors.length === 0)
  let files = 0,
    bytes = 0
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`
      if (entry.isDirectory()) await walk(path)
      else {
        files++
        bytes += (await stat(path)).size
        assert.ok(!/\.(png|tsx?|map|zip)$/.test(entry.name))
      }
    }
  }
  await walk("dist-aw2")
  check("Review bundle excludes source PNG/code/maps/archives")
  await mkdir(".asset-work/aw2-013", { recursive: true })
  await writeFile(
    ".asset-work/aw2-013/build-browser.json",
    JSON.stringify(
      {
        status: "PASS",
        engine: browser.version(),
        checks,
        errors,
        files,
        bytes,
      },
      null,
      2,
    ) + "\n",
  )
  console.log(
    JSON.stringify({ status: "PASS", checks: checks.length, files, bytes }),
  )
} finally {
  await browser.close()
  await new Promise((resolve) => server.httpServer.close(resolve))
}
