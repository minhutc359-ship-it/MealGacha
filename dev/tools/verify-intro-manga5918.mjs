import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { readFileSync, mkdirSync, writeFileSync } from "node:fs"

const script = JSON.parse(readFileSync("dev/content/intro-manga5918.json", "utf8"))
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright")
const browser = await chromium.launch({
  headless: true, executablePath: process.env.CHROMIUM_BIN,
  args: ["--no-sandbox", "--no-zygote", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  env: { ...process.env, LD_LIBRARY_PATH: process.env.CHROMIUM_LIB_DIR ?? process.env.LD_LIBRARY_PATH, FONTCONFIG_PATH: "/etc/fonts" },
})
const out = "dev/docs/web-v5918/evidence"
mkdirSync(out, { recursive: true })
const errors = [], missing = [], checks = []
const productionOnly = process.argv.includes("--production-only")
const qaOnly = process.argv.includes("--qa-only")
const loaded = async page => {
  await page.waitForFunction(() => {
    const img = document.querySelector(".manga-native-page img")
    return img?.complete && img.naturalWidth > 0
  })
  await page.locator(".manga-native-page img").first().evaluate(img => img.decode())
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}
const snapshots = page => page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
async function serve(preview) {
  const port = preview ? 4208 : 4207
  const args = ["node_modules/vite/bin/vite.js", ...(preview ? ["preview"] : ["--config", "dev/tools/vite.pvp-qa.config.ts"]), "--host", "127.0.0.1", "--port", String(port), "--strictPort"]
  const server = spawn(process.execPath, args, { stdio: "pipe" })
  const base = `http://127.0.0.1:${port}`
  for (let n = 0; n < 100; n++) {
    try { if ((await fetch(base)).ok) return { base, server } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  server.kill()
  throw Error("Server did not start")
}
function observe(page) {
  page.on("pageerror", error => errors.push(error.message))
  page.on("response", response => { if (response.status() >= 400) missing.push([response.url(), response.status()]) })
}
let active, currentPage
try {
  if (!productionOnly) {
  active = await serve(false)
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage(), requests = []
    currentPage = page
    observe(page)
    page.on("request", request => requests.push(new URL(request.url()).pathname))
    await page.goto(active.base + "/dev/qa/mangaReader5916.html")
    await page.locator(".manga-intro-entry").waitFor()
    assert.equal(requests.filter(path => path.includes("/intro-manga5918/")).length, 0)
    assert.equal(await page.locator(".manga-shelf button:enabled").count(), 0)
    const before = await snapshots(page)
    await page.locator(".manga-intro-entry").click()
    await loaded(page)
    const dialog = page.getByRole("dialog")
    const geometry = await dialog.evaluate(el => {
      const v = el.querySelector(".manga-viewport"), p = el.querySelector(".manga-native-page"), img = p.querySelector("img")
      const d = el.getBoundingClientRect(), i = img.getBoundingClientRect(), a = p.getBoundingClientRect()
      return { x: d.x, y: d.y, right: d.right, bottom: d.bottom, overflow: el.scrollWidth > el.clientWidth + 1, viewOverflow: v.scrollWidth > v.clientWidth + 1, ratio: i.width / i.height, expected: img.naturalWidth / img.naturalHeight, extraHeight: a.height - i.height, svg: p.querySelectorAll("svg").length,
        controlsVisible: [...el.querySelectorAll("button,select")].filter(b => !b.closest(".manga-sr-only")).every(b => { const r = b.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1 }) }
    })
    assert(geometry.x >= -1 && geometry.y >= -1 && geometry.right <= viewport.width + 1 && geometry.bottom <= viewport.height + 1, JSON.stringify(geometry))
    assert(!geometry.overflow && !geometry.viewOverflow && geometry.controlsVisible, JSON.stringify(geometry))
    assert(Math.abs(geometry.ratio - geometry.expected) < .002)
    assert(Math.abs(geometry.extraHeight) < 1)
    assert.equal(geometry.svg, 0)
    await page.screenshot({ path: `${out}/reader-${viewport.width}x${viewport.height}.png` })
    for (const chapter of script.chapters) {
      await dialog.getByLabel("Chọn chương giới thiệu").selectOption(chapter.id)
      await page.getByRole("heading", { name: chapter.title, exact: true }).waitFor()
      for (let index = 0; index < 3; index++) {
        await loaded(page)
        const image = page.locator(".manga-native-page img")
        assert((await image.getAttribute("src")).endsWith(chapter.pages[index].id + ".webp"))
        if (index < 2) await page.getByRole("button", { name: "Trang sau", exact: true }).click()
      }
    }
    await page.getByRole("button", { name: "Lời thoại", exact: true }).click()
    assert.equal(await page.locator(".manga-transcript:not(.manga-sr-only)").count(), 1)
    await page.getByRole("button", { name: "Lời thoại", exact: true }).click()
    await page.getByRole("button", { name: "Phóng to", exact: true }).click()
    if (viewport.width < 1100) assert(await page.locator(".manga-viewport").evaluate(el => el.scrollWidth > el.clientWidth))
    await page.getByRole("button", { name: "Phóng to", exact: true }).click()
    await page.getByRole("button", { name: "Lật trang", exact: true }).click()
    assert.equal(await page.locator(".manga-native-page").count(), 3)
    await page.getByRole("button", { name: "Đọc cuộn", exact: true }).click()
    await page.getByLabel("Đi đến trang").selectOption("0")
    await page.locator(".manga-viewport").focus()
    await page.keyboard.press("End")
    assert.equal(await page.getByLabel("Đi đến trang").inputValue(), "2")
    await page.keyboard.press("Home")
    assert.equal(await page.getByLabel("Đi đến trang").inputValue(), "0")
    await page.getByRole("button", { name: "Đóng truyện", exact: true }).focus()
    await page.keyboard.press("Shift+Tab")
    assert.equal(await page.locator(".manga-dialog :focus").count(), 1)
    await page.keyboard.press("Escape")
    assert.equal(await page.locator("dialog[open]").count(), 0)
    assert(await page.locator(".manga-intro-entry").evaluate(el => el === document.activeElement))
    assert.deepEqual(await snapshots(page), before)
    checks.push({ viewport, chapters: 4, fullPages: 12, uncropped: true, controls: true, focusRestored: true, savePreserved: true, lazyUntilOpen: true })
    await context.close()
  }
  // A transient image failure and a book failure must leave a working retry path.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    currentPage = page
    let bookFailures = 1, imageFailures = 1
    await page.route("**/intro-manga5918/origin.json", route => bookFailures-- > 0 ? route.fulfill({ status: 503, body: "unavailable" }) : route.continue())
    await page.route("**/intro-manga5918/origin-1.webp", route => imageFailures-- > 0 ? route.abort() : route.continue())
    await page.goto(active.base + "/dev/qa/mangaReader5916.html")
    await page.locator(".manga-intro-entry").click()
    await page.getByRole("button", { name: "Thử lại", exact: true }).click()
    await page.getByRole("button", { name: "Thử lại ảnh", exact: true }).click()
    await loaded(page)
    await page.keyboard.press("Escape")
    checks.push({ retryBook: true, retryImage: true })
    await context.close()
  }
  active.server.kill()
  }
  if (!qaOnly) {
  active = await serve(true)
  for (const mode of ["tcg", "adventure", "autochess", "chest"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    currentPage = page
    observe(page)
    await page.goto(active.base + (mode === "tcg" ? "/" : "/" + mode))
    const dismiss = page.getByRole("button", { name: "Tắt thông báo", exact: true })
    if (await dismiss.isVisible()) await dismiss.click()
    if (mode === "tcg") {
      await page.getByRole("button", { name: "Mở menu game", exact: true }).click()
      await page.getByRole("button", { name: "Manga ký ức", exact: true }).click()
      await page.locator(".manga-intro-entry").waitFor()
    } else if (mode === "adventure") {
      await page.getByRole("button", { name: "Đọc manga ▤", exact: true }).click()
      await page.locator(".manga-intro-entry").waitFor()
    } else if (mode === "autochess") {
      const guide = page.getByRole("dialog")
      if (!await guide.isVisible()) await page.getByRole("button", { name: "Hướng dẫn auto chess", exact: true }).click()
    } else await page.getByRole("button", { name: "Hướng dẫn mở rương và thẻ Vị Linh", exact: true }).click()
    const opener = mode === "tcg" || mode === "adventure" ? page.locator(".manga-intro-entry") : page.getByRole("button", { name: "Đọc manga giới thiệu · 4 chương", exact: true })
    const before = await snapshots(page)
    await opener.click()
    await loaded(page)
    assert.equal(await page.locator("dialog[open]").count(), 1)
    await page.getByRole("button", { name: "Chương sau ›", exact: true }).click()
    await page.getByRole("heading", { name: "Lá bài mở lối", exact: true }).waitFor()
    await loaded(page)
    await page.keyboard.press("Escape")
    assert.deepEqual(await snapshots(page), before)
    if (mode === "autochess") assert(await page.getByRole("button", { name: "Hướng dẫn auto chess", exact: true }).evaluate(el => el === document.activeElement))
    if (mode === "chest") assert(await page.locator(".chest-help-trigger").evaluate(el => el === document.activeElement))
    checks.push({ productionMode: mode, integrated: true, savePreserved: true })
    await context.close()
  }
  }
  assert.deepEqual(errors, [])
  assert.deepEqual(missing, [])
  writeFileSync(`${out}/verification${productionOnly ? "-production" : qaOnly ? "-reader" : ""}.json`, JSON.stringify({ checks, errors, missing }, null, 2) + "\n")
  console.log(JSON.stringify({ checks: checks.length, errors: errors.length, missing: missing.length }))
} catch (error) {
  console.error(JSON.stringify({ checks, errors, missing, url: currentPage?.url(), body: await currentPage?.locator("body").innerText().catch(() => "closed") }))
  await currentPage?.screenshot({ path: `${out}/failure.png` }).catch(() => {})
  throw error
} finally {
  active?.server.kill()
  await browser.close()
}
