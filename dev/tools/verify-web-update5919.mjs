import assert from "node:assert/strict"
import http from "node:http"
import { readFileSync, createReadStream, statSync, mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"

// Exercise real workers and real production UI. Only the test server's release
// identifier and document marker change between deployments.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright")
const root = path.resolve("dist"), out = "dev/docs/web-v5919/evidence"
mkdirSync(out, { recursive: true })
let deployment = "A", browser
const checks = [], errors = [], missing = [], workers = []
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".webp": "image/webp", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".ico": "image/x-icon", ".svg": "image/svg+xml" }
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost"), name = url.pathname
  let file = path.resolve(root, "." + name)
  if (!file.startsWith(root + path.sep) && name !== "/") { res.writeHead(403).end(); return }
  try { if (!statSync(file).isFile()) throw Error() } catch {
    if (path.extname(name)) { missing.push(name); res.writeHead(404).end(); return }
    file = path.join(root, "index.html")
  }
  res.setHeader("Content-Type", mime[path.extname(file)] ?? "application/octet-stream")
  res.setHeader("Cache-Control", "no-store")
  if (name === "/sw.js") {
    workers.push(deployment)
    res.end(readFileSync(file, "utf8").replace(/^const VERSION = .*;$/m, `const VERSION = "qa-${deployment}";`))
  } else if (file === path.join(root, "index.html")) {
    res.end(readFileSync(file, "utf8").replace("<head>", `<head><meta name="qa-build" content="${deployment}">`))
  } else createReadStream(file).pipe(res)
})
await new Promise(resolve => server.listen(4219, "127.0.0.1", resolve))
const base = "http://127.0.0.1:4219"
const build = p => p.locator('meta[name="qa-build"]').getAttribute("content")
const saved = p => p.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
const ready = async p => {
  await p.waitForFunction(() => navigator.serviceWorker.controller && document.querySelector("#root")?.textContent.length > 30)
  await p.evaluate(() => document.fonts.ready)
}
const prompt = p => p.getByRole("dialog", { name: "Có phiên bản mới!" })
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_BIN,
    args: process.env.CHROMIUM_ARGS ? JSON.parse(process.env.CHROMIUM_ARGS) : ["--no-sandbox"],
    env: { ...process.env, LD_LIBRARY_PATH: process.env.CHROMIUM_LIB_DIR ?? process.env.LD_LIBRARY_PATH } })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await context.addInitScript(() => {
    const post = ServiceWorker.prototype.postMessage
    ServiceWorker.prototype.postMessage = function (message, ...args) {
      if (message?.type === "APPLY_WEB_UPDATE" && window.qaBlockUpdate) return
      return post.call(this, message, ...args)
    }
  })
  const page = await context.newPage()
  page.on("pageerror", e => errors.push(e.message))
  await page.goto(base); await ready(page)
  assert.equal(await prompt(page).count(), 0)
  await page.evaluate(() => localStorage.setItem("qa-existing-progress", JSON.stringify({ chapter: 8, collection: ["pho-bo", "xoi"], keys: 47 })))
  const before = await saved(page)
  checks.push("Fresh installation: no false update popup")

  deployment = "B"
  await page.reload(); await ready(page)
  await prompt(page).waitFor()
  assert.equal(await build(page), "A")
  assert.deepEqual(await saved(page), before)
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    const geometry = await prompt(page).evaluate(el => {
      const r = el.getBoundingClientRect()
      return { inside: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, overflow: el.scrollWidth > el.clientWidth + 1 }
    })
    assert(geometry.inside && !geometry.overflow, JSON.stringify({ viewport, geometry }))
    await prompt(page).screenshot({ path: `${out}/popup-${viewport.width}x${viewport.height}.png` })
  }
  const update = () => prompt(page).getByRole("button", { name: "Cập nhật và tải lại" })
  await update().focus(); await page.keyboard.press("Shift+Tab")
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), "Để sau")
  await page.keyboard.press("Tab")
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), "Cập nhật và tải lại")
  await page.keyboard.press("Escape")
  assert.equal(await prompt(page).count(), 0)
  assert.equal(await build(page), "A")
  checks.push("Startup detects waiting release; popup fits four viewports, traps focus and supports Escape")

  await page.goto(base + "/settings"); await ready(page)
  await prompt(page).getByRole("button", { name: "Để sau" }).click()
  await page.getByRole("button", { name: "Cập nhật và tải lại", exact: true }).waitFor()
  assert.equal(await build(page), "A")
  await page.evaluate(() => window.dispatchEvent(new Event("online")))
  assert.equal(await prompt(page).count(), 0)
  checks.push("Later keeps the current version; Settings retains update action without repeated popup")

  await page.goto(base); await ready(page); await prompt(page).waitFor()
  await page.evaluate(() => { window.qaBlockUpdate = true })
  await page.clock.install()
  await update().click()
  assert.equal(await prompt(page).getByRole("button", { name: "Đang cập nhật…" }).isDisabled(), true)
  await page.keyboard.press("Escape")
  assert.equal(await prompt(page).count(), 1)
  await page.clock.fastForward(15_001)
  await prompt(page).getByRole("alert").waitFor()
  assert.equal(await update().isEnabled(), true)
  assert.equal(await build(page), "A")
  checks.push("Activation timeout shows a recoverable error and keeps saved progress")
  await page.evaluate(() => { window.qaBlockUpdate = false })
  await Promise.all([page.waitForEvent("load"), update().click()])
  await ready(page)
  assert.equal(await build(page), "B")
  assert.equal(await prompt(page).count(), 0)
  assert.deepEqual(await saved(page), before)
  checks.push("Retry activates real waiting worker and reloads into release B with storage unchanged")

  const second = await context.newPage()
  second.on("pageerror", e => errors.push(e.message))
  await second.goto(base); await ready(second)
  deployment = "C"
  await page.evaluate(() => window.dispatchEvent(new Event("online")))
  await prompt(page).waitFor()
  await Promise.all([page.waitForEvent("load"), update().click()])
  await ready(page)
  assert.equal(await build(page), "C")
  assert.equal(await build(second), "B")
  assert.deepEqual(await saved(page), before)
  checks.push("Reconnect discovers release C; accepting reloads only the chosen tab")
  await context.setOffline(true)
  await page.reload(); await ready(page)
  assert.equal(await build(page), "C")
  assert.equal(await prompt(page).count(), 0)
  assert.deepEqual(await saved(page), before)
  checks.push("Installed current shell reopens offline with no false popup or storage changes")
  await context.close()
  assert.deepEqual(errors, []); assert.deepEqual(missing, [])
  writeFileSync(`${out}/verification.json`, JSON.stringify({ engine: await browser.version(), checks, workerDeploymentsRequested: [...new Set(workers)], errors, missing }, null, 2) + "\n")
  console.log(JSON.stringify({ checks: checks.length, errors, missing }))
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)) }
