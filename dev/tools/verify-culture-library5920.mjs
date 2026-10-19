import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { readFileSync, mkdirSync, writeFileSync } from "node:fs"
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright")
const content = JSON.parse(readFileSync("public/assets/culture5920/journeys.json", "utf8"))
const out = "dev/docs/web-v5920/evidence", errors = [], missing = [], checks = []
mkdirSync(out, { recursive: true })
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", "4220", "--strictPort"], { stdio: "pipe" })
const base = "http://127.0.0.1:4220"
for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(r => setTimeout(r, 100)) }
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_BIN, args: process.env.CHROMIUM_ARGS ? JSON.parse(process.env.CHROMIUM_ARGS) : ["--no-sandbox"], env: { ...process.env, LD_LIBRARY_PATH: process.env.CHROMIUM_LIB_DIR ?? process.env.LD_LIBRARY_PATH } })
let current, expectedFailure = false
const observe = p => {
  current = p
  p.on("pageerror", e => errors.push(e.message))
  p.on("response", r => { if (r.status() >= 400 && !expectedFailure) missing.push([r.url(), r.status()]) })
}
const snapshots = p => p.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
const opener = p => p.getByRole("button", { name: "Mở Sổ · Manga giới thiệu và văn hóa Việt", exact: true })
const library = p => p.getByRole("dialog", { name: "Sổ hành trình Soul of Meal", exact: true })
const ready = async p => {
  await opener(p).waitFor()
  const announcement = p.getByRole("button", { name: "Tắt thông báo", exact: true })
  if (await announcement.isVisible()) await announcement.click()
  if (await p.locator("dialog[open]").count()) await p.keyboard.press("Escape")
}
const geometry = el => {
  const r = el.getBoundingClientRect()
  return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, w: innerWidth, h: innerHeight, scroll: el.scrollWidth, client: el.clientWidth }
}
try {
  for (const mode of ["tcg", "adventure", "autochess", "chest", "pvp"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } }), page = await context.newPage(), requests = []
    observe(page); page.on("request", r => requests.push(r.url()))
    await page.goto(base + (mode === "tcg" ? "/" : "/" + mode)); await ready(page)
    assert(!requests.some(r => r.includes("/culture5920/") || r.includes("/intro-manga5918/")), "Book content must not preload on startup")
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport)
      const before = await snapshots(page), entry = await opener(page).evaluate(geometry)
      assert(entry.x >= 0 && entry.right <= entry.w + 1 && entry.y >= 0 && entry.bottom <= entry.h + 1, JSON.stringify({ mode, viewport, entry }))
      const outside = await page.locator("header.ac-header,header.rpg-header,header.tcg-topbar,header.client-topbar,header.pvp-header").evaluateAll(headers => headers.flatMap(h => [...h.querySelectorAll("button,a")].filter(el => el.getClientRects().length).map(el => ({ text: el.getAttribute("aria-label") || el.textContent, r: el.getBoundingClientRect() })).filter(v => v.r.x < -1 || v.r.y < -1 || v.r.right > innerWidth + 1).map(v => ({text:v.text,x:v.r.x,y:v.r.y,right:v.r.right}))))
      assert.deepEqual(outside, [], JSON.stringify({ mode, viewport, outside }))
      await opener(page).click()
      await library(page).waitFor()
      const modal = await library(page).evaluate(geometry)
      assert(modal.x >= 0 && modal.right <= modal.w + 1 && modal.scroll <= modal.client + 1, JSON.stringify({ mode, viewport, modal }))
      assert.equal(await library(page).locator(".meal-book-card").count(), 4)
      const chapter = mode === "autochess" ? 2 : mode === "adventure" ? 3 : mode === "chest" ? 1 : 0
      await library(page).locator(".meal-book-card").nth(chapter).click()
      await page.waitForFunction(() => { const img = document.querySelector(".manga-native-page img"); return img?.complete && img.naturalWidth > 0 })
      const image = await page.locator(".manga-native-page img").evaluate(img => ({ w: img.width, h: img.height, ratio: img.naturalWidth / img.naturalHeight }))
      assert(Math.abs(image.w / image.h - image.ratio) < .005)
      await page.keyboard.press("Escape")
      assert(await library(page).locator(".meal-book-card").nth(chapter).evaluate(el => document.activeElement === el), "Focus returns to chapter card")
      if (mode === "tcg" && viewport.width === 390) await page.screenshot({ path: `${out}/shared-library-390.png` })
      await library(page).getByRole("button", { name: "Đóng Sổ hành trình" }).click()
      assert(await opener(page).evaluate(el => document.activeElement === el))
      assert.deepEqual(await snapshots(page), before)
      checks.push({ mode, viewport, globalEntry: true, fullPage: true, focus: true, readOnly: true })
    }
    if (mode === "adventure") {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.getByRole("button", { name: "Đọc manga ▤", exact: true }).click()
      const intro = page.locator(".manga-intro-entry")
      await intro.waitFor()
      const shelf = await intro.evaluate(el => {
        const r = el.getBoundingClientRect(), next = el.nextElementSibling.getBoundingClientRect()
        return { height: r.height, bottom: r.bottom, next: next.top, overflow: el.scrollHeight > el.clientHeight + 1 }
      })
      assert(shelf.height >= 100 && shelf.bottom <= shelf.next && !shelf.overflow, JSON.stringify(shelf))
      await page.screenshot({ path: `${out}/adventure-shelf-390.png` })
      checks.push({ adventureIntroCard: "no shrinking or overlap" })
    }
    await context.close()
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" }), page = await context.newPage()
  observe(page); await page.goto(base); await ready(page)
  await opener(page).click()
  expectedFailure = true
  await page.route("**/assets/culture5920/journeys.json", route => route.fulfill({ status: 503, body: "unavailable" }))
  await library(page).getByRole("button", { name: "Văn hóa Việt", exact: true }).click()
  await library(page).getByRole("alert").waitFor()
  await page.unroute("**/assets/culture5920/journeys.json")
  expectedFailure = false
  await library(page).getByRole("button", { name: "Thử lại", exact: true }).click()
  await library(page).locator(".culture-task").waitFor()
  const quest = content[0]
  const rawSave = () => page.evaluate(() => JSON.parse(localStorage.getItem("foodchest.tcg.v1")))
  const wrong = quest.steps[0].choices.find(c => !c.advance)
  const beforeChoice = await snapshots(page)
  await library(page).getByRole("button", { name: wrong.label, exact: true }).click()
  await library(page).getByText("Hãy thử một cách khác.", { exact: true }).waitFor()
  assert.deepEqual(await snapshots(page), beforeChoice)
  await library(page).getByRole("button", { name: quest.steps[0].choices.find(c => c.advance).label, exact: true }).click()
  await page.evaluate(() => {
    window.restoreStorage = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) { if (key.startsWith("foodchest.tcg")) throw new DOMException("full", "QuotaExceededError"); return window.restoreStorage.call(this, key, value) }
  })
  await library(page).getByRole("button", { name: "Tiếp tục cùng người hướng dẫn →", exact: true }).click()
  await library(page).getByRole("alert").waitFor()
  assert.deepEqual(await snapshots(page), beforeChoice)
  await page.evaluate(() => { Storage.prototype.setItem = window.restoreStorage })
  await library(page).getByRole("button", { name: "Tiếp tục cùng người hướng dẫn →", exact: true }).click()
  assert.equal((await rawSave()).cultureJourney.tet, 1)
  const afterFirst = await rawSave()
  await page.reload(); await ready(page); await opener(page).click()
  await library(page).getByRole("button", { name: "Văn hóa Việt", exact: true }).click()
  await library(page).getByText("Bước 2/3", { exact: true }).waitFor()
  for (let step = 1; step < 3; step++) {
    await library(page).getByRole("button", { name: quest.steps[step].choices.find(c => c.advance).label, exact: true }).click()
    await library(page).getByRole("button", { name: step === 2 ? "Ghi vào sổ lưu niệm" : "Tiếp tục cùng người hướng dẫn →", exact: true }).click()
  }
  await library(page).locator(".culture-complete").waitFor()
  const finished = await rawSave()
  assert.equal(finished.cultureJourney.tet, 3)
  const rest = ({ cultureJourney, updatedAt, ...value }) => value
  assert.deepEqual(rest(finished), rest(afterFirst))
  await library(page).locator(".culture-facts summary").click()
  assert(await library(page).getByRole("link", { name: "Vietnam Tourism · Tết và ẩm thực ↗", exact: true }).isVisible())
  await page.screenshot({ path: `${out}/culture-complete-390.png` })
  const beforeReplay = await snapshots(page)
  await library(page).getByRole("button", { name: "Trải nghiệm lại", exact: true }).click()
  for (let step = 0; step < 3; step++) {
    await library(page).getByRole("button", { name: quest.steps[step].choices.find(c => c.advance).label, exact: true }).click()
    await library(page).getByRole("button", { name: step === 2 ? "Ghi vào sổ lưu niệm" : "Tiếp tục cùng người hướng dẫn →", exact: true }).click()
  }
  assert.deepEqual(await snapshots(page), beforeReplay)
  checks.push({ culture: "load retry, incorrect choice, quota failure/retry, partial resume, completion, official sources, replay without rewards or writes" })
  await context.close()
  assert.deepEqual(errors, []); assert.deepEqual(missing, [])
  writeFileSync(`${out}/verification.json`, JSON.stringify({ engine: await browser.version(), checks, errors, missing }, null, 2) + "\n")
  console.log(JSON.stringify({ checks: checks.length, errors, missing }))
} catch (error) { await current?.screenshot({ path: `${out}/failure.png` }).catch(() => {}); throw error }
finally { await browser.close(); server.kill() }
