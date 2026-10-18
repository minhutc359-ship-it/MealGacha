import assert from "node:assert/strict"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { spawn } from "node:child_process"
const base = process.env.QA_URL ?? "http://127.0.0.1:4197",
  out = "dev/docs/web-v5916/evidence"
const server = process.env.QA_URL
  ? null
  : spawn(
      process.execPath,
      [
        "node_modules/vite/bin/vite.js",
        "--config",
        "dev/tools/vite.pvp-qa.config.ts",
        "--host",
        "127.0.0.1",
        "--port",
        "4197",
        "--strictPort",
      ],
      { stdio: "pipe" },
    )
for (let attempt = 0; attempt < 60; attempt++) {
  try {
    if ((await fetch(base + "/dev/qa/mangaReader5916.html")).ok) break
  } catch {}
  if (attempt === 59) {
    server?.kill()
    throw Error("QA server did not start")
  }
  await new Promise((resolve) => setTimeout(resolve, 100))
}
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright")
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_BIN,
  args: [
    "--no-sandbox",
    "--no-zygote",
    "--disable-dev-shm-usage",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
  env: {
    ...process.env,
    LD_LIBRARY_PATH:
      process.env.CHROMIUM_LIB_DIR ?? process.env.LD_LIBRARY_PATH,
    FONTCONFIG_PATH: "/etc/fonts",
  },
})
mkdirSync(out, { recursive: true })
const checks = [],
  errors = [],
  missing = []
const books = JSON.parse(readFileSync("dev/docs/web-v5916/books.json", "utf8"))
const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1440, height: 900 },
]
try {
  for (const viewport of viewports)
    for (const track of ["tcg", "adventure"]) {
      const context = await browser.newContext({ viewport }),
        page = await context.newPage(),
        requests = []
      page.on("pageerror", (e) => errors.push(e.message))
      page.on("response", (r) => {
        if (r.status() >= 400) missing.push([r.url(), r.status()])
      })
      page.on("request", (r) => requests.push(new URL(r.url()).pathname))
      await page.goto(base + "/dev/qa/mangaReader5916.html")
      await page.waitForFunction(() => !!window.mangaQa)
      await page.evaluate((track) => {
        localStorage.setItem("manga-sentinel", "player-progress")
        window.mangaQa({ track })
      }, track)
      await page
        .getByRole("heading", {
          name: track === "tcg" ? "Bữa cơm còn một ghế" : "Con đường của Vân",
        })
        .waitFor()
      assert.equal(requests.filter((p) => p.includes("/manga5916/")).length, 0)
      assert.equal(await page.locator(".manga-shelf button:enabled").count(), 0)
      const props =
        track === "tcg"
          ? {
              track,
              clearedStages: [
                "lantern-1",
                "lantern-2",
                "lantern-3",
                "harbor-1",
                "harbor-2",
                "harbor-3",
              ],
            }
          : {
              track,
              stars: { "lantern-6": 3, "harbor-6": 3 },
              choices: { lantern: 0, harbor: 1 },
            }
      await page.evaluate((props) => window.mangaQa(props), props)
      const opener = page.locator(".manga-shelf button:enabled").first()
      await opener.click()
      const dialog = page.getByRole("dialog")
      await dialog.locator(".manga-comic-page").waitFor()
      assert.equal(await page.locator("dialog[open]").count(), 1)
      const measurements = await dialog.evaluate((el) => {
        const r = el.getBoundingClientRect(),
          v = el.querySelector(".manga-viewport"),
          svg = el.querySelector("svg"),
          s = svg.getBoundingClientRect()
        return {
          x: r.x,
          y: r.y,
          right: r.right,
          bottom: r.bottom,
          width: r.width,
          overflow: el.scrollWidth > el.clientWidth + 1,
          viewOverflow: v.scrollWidth > v.clientWidth + 1,
          ratio: s.width / s.height,
          expected: svg.viewBox.baseVal.width / svg.viewBox.baseVal.height,
          buttons: [
            ...el.querySelectorAll(
              ".manga-reader-heading button,.manga-toolbar button,.manga-reader-controls button",
            ),
          ].map((b) => {
            const r = b.getBoundingClientRect()
            return (
              r.top >= 0 &&
              r.bottom <= innerHeight + 1 &&
              r.left >= 0 &&
              r.right <= innerWidth + 1
            )
          }),
        }
      })
      assert(
        measurements.x >= -1 &&
          measurements.y >= -1 &&
          measurements.right <= viewport.width + 1 &&
          measurements.bottom <= viewport.height + 1,
      )
      assert(
        !measurements.overflow && !measurements.viewOverflow,
        JSON.stringify(measurements),
      )
      assert(measurements.buttons.every(Boolean), JSON.stringify(measurements))
      assert(
        Math.abs(measurements.ratio - measurements.expected) < 0.04,
        JSON.stringify(measurements),
      )
      assert.equal(
        await page.evaluate(() => document.body.style.overflow),
        "hidden",
      )
      const n = await dialog
        .getByLabel("Đi đến trang")
        .locator("option")
        .count()
      assert(n >= 8)
      await dialog.getByLabel("Trang sau", { exact: true }).click()
      assert.equal(await dialog.getByLabel("Đi đến trang").inputValue(), "1")
      await dialog.getByRole("button", { name: "Đóng truyện" }).focus()
      await page.keyboard.press("End")
      assert.equal(
        await dialog.getByLabel("Đi đến trang").inputValue(),
        String(n - 1),
      )
      await page.keyboard.press("Home")
      assert.equal(await dialog.getByLabel("Đi đến trang").inputValue(), "0")
      await dialog.getByRole("button", { name: "Chữ lớn", exact: true }).click()
      assert(
        Number.parseFloat(
          await dialog
            .locator(".manga-balloons p")
            .first()
            .evaluate((p) => getComputedStyle(p).fontSize),
        ) >= 20,
      )
      const normalWidth = await dialog
        .locator(".manga-comic-page")
        .evaluate((v) => v.getBoundingClientRect().width)
      await dialog
        .getByRole("button", { name: "Phóng to", exact: true })
        .click()
      assert(
        await dialog
          .locator(".manga-comic-page")
          .evaluate(
            (v, before) => v.getBoundingClientRect().width > before,
            normalWidth,
          ),
      )
      await dialog
        .getByRole("button", { name: "Phóng to", exact: true })
        .click()
      await dialog
        .getByRole("button", { name: "Tranh gốc", exact: true })
        .click()
      await dialog
        .locator(".manga-originals img")
        .first()
        .evaluate((img) => img.decode())
      const fitted = await dialog
        .locator(".manga-originals img")
        .first()
        .evaluate(
          (img) =>
            Math.abs(
              img.width / img.height - img.naturalWidth / img.naturalHeight,
            ) < 0.01 && getComputedStyle(img).objectFit === "contain",
        )
      assert(fitted)
      await dialog
        .getByRole("button", { name: "Về truyện", exact: true })
        .click()
      await dialog
        .getByRole("button", { name: "Lật trang", exact: true })
        .click()
      assert.equal(await dialog.locator(".manga-comic-page").count(), n)
      await dialog
        .locator(".manga-viewport")
        .evaluate((v) => (v.scrollTop = v.scrollHeight))
      assert(await dialog.getByText(`Hết chương · ${n} trang`).isVisible())
      await dialog
        .getByRole("button", { name: "Đọc cuộn", exact: true })
        .click()
      await dialog.getByRole("button", { name: "Đóng truyện" }).focus()
      for (let i = 0; i < 22; i++) {
        await page.keyboard.press("Tab")
        assert(
          await dialog.evaluate((el) => el.contains(document.activeElement)),
        )
      }
      await page.keyboard.press("Escape")
      await dialog.waitFor({ state: "detached" })
      assert.equal(await page.evaluate(() => document.body.style.overflow), "")
      assert(await opener.evaluate((b) => b === document.activeElement))
      await opener.click()
      await page.locator(".manga-comic-page").waitFor()
      await page
        .getByRole("button", { name: "Chương sau ›", exact: true })
        .click()
      await page
        .getByRole("heading", {
          name:
            track === "tcg" ? "Bến Cảng Than Hồng" : "Lá thư không được gửi",
          exact: true,
        })
        .waitFor()
      await page.locator(".manga-comic-page").waitFor()
      await page.screenshot({
        path: `${out}/${track}-${viewport.width}.jpg`,
        quality: 85,
      })
      await page.getByRole("button", { name: "Đóng truyện" }).click()
      assert(
        await opener.evaluate((b) => b === document.activeElement),
        "return focus even after switching chapters",
      )
      assert.equal(
        await page.evaluate(() => localStorage.getItem("manga-sentinel")),
        "player-progress",
      )
      checks.push({
        track,
        viewport,
        pages: n,
        measurements,
        flow: "locked → chapter → pages/keyboard/font/zoom/full art/scroll/focus → next chapter",
        savePreserved: true,
      })
      await context.close()
    }
  // Exercise every real chapter payload, including its new full sheet.
  const context = await browser.newContext(),
    page = await context.newPage()
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("response", (r) => {
    if (r.status() >= 400) missing.push([r.url(), r.status()])
  })
  await page.goto(base + "/dev/qa/mangaReader5916.html")
  await page.waitForFunction(() => !!window.mangaQa)
  for (const track of ["tcg", "adventure"]) {
    const list = books.filter((b) => b.track === track)
    const props =
      track === "tcg"
        ? {
            track,
            clearedStages: list.flatMap((b) =>
              [1, 2, 3].map((i) => `${b.id}-${i}`),
            ),
            storyEnding: "release",
          }
        : {
            track,
            stars: Object.fromEntries(list.map((b) => [`${b.id}-6`, 3])),
            choices: Object.fromEntries(list.map((b) => [b.id, 1])),
          }
    await page.evaluate((props) => window.mangaQa(props), props)
    await page.locator(".manga-shelf button:enabled").first().waitFor()
    for (let i = 0; i < list.length; i++) {
      await page.locator(".manga-shelf button:enabled").nth(i).click()
      await page.locator(".manga-comic-page").waitFor()
      await page.getByRole("button", { name: "Tranh gốc", exact: true }).click()
      const images = page.locator(".manga-originals img")
      for (const img of await images.all()) {
        await img.scrollIntoViewIfNeeded()
        await img.evaluate((i) => i.decode())
      }
      assert.equal(await images.count(), 2)
      await page.getByRole("button", { name: "Đóng truyện" }).click()
      checks.push({ track, chapter: list[i].id, decodedFullSheets: 2 })
    }
  }
  await page.evaluate(() =>
    window.mangaQa({
      track: "tcg",
      clearedStages: ["lantern-1", "lantern-2", "lantern-3"],
    }),
  )
  const failedUrl = "**/assets/manga5916/tcg/lantern.json"
  await page.route(failedUrl, (route) => route.abort())
  await page.locator(".manga-shelf button:enabled").first().click()
  await page.getByRole("alert").waitFor()
  await page.unroute(failedUrl)
  await page.getByRole("button", { name: "Thử lại", exact: true }).click()
  await page.locator(".manga-comic-page").waitFor()
  await page.getByRole("button", { name: "Đóng truyện" }).click()
  checks.push({ failedChapterFetch: "retry recovers" })
  await context.close()
  assert.deepEqual(errors, [])
  assert.deepEqual(missing, [])
  writeFileSync(
    "dev/docs/web-v5916/browser-qa.json",
    JSON.stringify(
      { engine: await browser.version(), checks, errors, missing },
      null,
      2,
    ) + "\n",
  )
  console.log(JSON.stringify({ checks: checks.length, errors, missing }))
} finally {
  await browser.close()
  server?.kill()
}
