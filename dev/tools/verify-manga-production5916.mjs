import assert from "node:assert/strict"
import { createServer } from "vite"
import { spawn } from "node:child_process"
import { writeFileSync } from "node:fs"

const loader = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
})
let seed
try {
  const { newGame } = await loader.ssrLoadModule("/src/game/progression.ts")
  const { newRpgSave } = await loader.ssrLoadModule(
    "/src/game/adventureRpg/engine.ts",
  )
  const { CHAPTERS } = await loader.ssrLoadModule("/src/game/story.ts")
  const { parseGame } = await loader.ssrLoadModule("/src/game/storage.ts")
  seed = newGame()
  seed.clearedStages = CHAPTERS.flatMap((c) => c.stages.map((s) => s.id))
  seed.storyEnding = "release"
  seed.story400 = {
    version: 1,
    giftClaimed: true,
    originEnding: "release",
    choices: {},
    decisions: {
      "living-market": "listen",
      "rain-harbor": "long",
      "tomorrow-table": "open",
    },
    seenScenes: [],
    claimedRewards: [],
  }
  seed.adventureRpg = newRpgSave(seed)
  seed.adventureRpg.stars = Object.fromEntries(
    [1, 2, 3, 4, 5, 6].map((i) => [`lantern-${i}`, 3]),
  )
  seed.adventureRpg.choices = { lantern: 1 }
  assert(parseGame(seed), "fixture must pass the real save schema")
} finally {
  await loader.close()
}
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4198",
    "--strictPort",
  ],
  { stdio: "pipe" },
)
const base = "http://127.0.0.1:4198"
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(base)).ok) break
  } catch {}
  if (i === 59) throw Error("preview start")
  await new Promise((r) => setTimeout(r, 100))
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
const errors = [],
  missing = [],
  checks = []
try {
  for (const mode of ["tcg", "adventure", "autochess"]) {
    const context = await browser.newContext({
      viewport:
        mode === "adventure"
          ? { width: 390, height: 844 }
          : { width: 1440, height: 900 },
    })
    await context.addInitScript((seed) => {
      if (!localStorage.getItem("foodchest.tcg.v1"))
        localStorage.setItem("foodchest.tcg.v1", JSON.stringify(seed))
    }, seed)
    const page = await context.newPage()
    page.on("pageerror", (e) => errors.push(e.message))
    page.on("response", (r) => {
      if (r.status() >= 400) missing.push([r.url(), r.status()])
    })
    await page.goto(base + (mode === "tcg" ? "/" : "/" + mode))
    const announcement = page.getByRole("button", {
      name: "Tắt thông báo",
      exact: true,
    })
    if (await announcement.isVisible()) await announcement.click()
    if (mode === "tcg") {
      await page
        .getByRole("button", { name: "Manga ký ức", exact: true })
        .click()
      await page.locator(".manga-shelf button:enabled").first().waitFor()
      const before = await page.evaluate(() =>
        localStorage.getItem("foodchest.tcg.v1"),
      )
      await page.locator(".manga-shelf button:enabled").first().click()
      await page.locator(".manga-comic-page").waitFor()
      await page.getByRole("button", { name: "Trang sau", exact: true }).click()
      await page.keyboard.press("Escape")
      assert.equal(
        await page.evaluate(() => localStorage.getItem("foodchest.tcg.v1")),
        before,
      )
      checks.push({ mode, manga: true, savePreserved: true })
    } else if (mode === "adventure") {
      await page
        .getByRole("button", { name: "Đọc manga ▤", exact: true })
        .click()
      await page.locator(".manga-shelf button:enabled").first().waitFor()
      const shelf = page.locator(".rpg-home-screen>.manga-chronicle")
      assert(
        await shelf.evaluate(
          (el) =>
            el.clientHeight > 0 &&
            el.scrollHeight > el.clientHeight &&
            getComputedStyle(el).overflowY === "auto",
        ),
      )
      await shelf.evaluate((el) => (el.scrollTop = el.scrollHeight))
      assert(
        await page
          .locator(".manga-shelf button")
          .last()
          .evaluate((el) => el.getBoundingClientRect().bottom <= innerHeight),
      )
      await shelf.evaluate((el) => (el.scrollTop = 0))
      const before = await page.evaluate(() =>
        localStorage.getItem("foodchest.tcg.v1"),
      )
      await page.locator(".manga-shelf button:enabled").first().click()
      await page.locator(".manga-comic-page").waitFor()
      await page.getByRole("button", { name: "Lật trang", exact: true }).click()
      assert(
        (await page.locator(".manga-balloons").allTextContents())
          .join(" ")
          .includes("Chiếc ghế trống được đặt giữa chợ"),
      )
      await page
        .getByRole("button", { name: "Đóng truyện", exact: true })
        .click()
      assert.equal(
        await page.evaluate(() => localStorage.getItem("foodchest.tcg.v1")),
        before,
      )
      checks.push({ mode, manga: true, savedChoice: 1, savePreserved: true })
    } else {
      await page.locator(".ac-shell").waitFor()
      checks.push({ mode, productionChunkLoaded: true })
    }
    await context.close()
  }
  assert.deepEqual(errors, [])
  assert.deepEqual(missing, [])
  writeFileSync(
    "dev/docs/web-v5916/production-qa.json",
    JSON.stringify(
      { engine: await browser.version(), checks, errors, missing },
      null,
      2,
    ) + "\n",
  )
  console.log(JSON.stringify({ checks: checks.length, errors, missing }))
} finally {
  await browser.close()
  server.kill()
}
