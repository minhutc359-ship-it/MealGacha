import assert from "node:assert/strict"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const out = path.join(root, "dev/docs/web-v580")
const captures = path.join(out, "qa")
mkdirSync(captures, { recursive: true })
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright")
const port = Number(process.env.WEB580_QA_PORT ?? 4258)
const url = `http://127.0.0.1:${port}`
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--config",
    "dev/tools/vite.pvp-qa.config.ts",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  { cwd: root, stdio: "pipe" },
)
let serverLog = ""
server.stdout.on("data", (chunk) => (serverLog += chunk))
server.stderr.on("data", (chunk) => (serverLog += chunk))

const checks = []
const pageErrors = []
const missingAssets = []
let browser

function observe(page) {
  page.on("pageerror", (error) => pageErrors.push(error.message))
  page.on("response", (response) => {
    if (response.url().includes("/assets/") && response.status() >= 400)
      missingAssets.push(`${response.status()} ${response.url()}`)
  })
}

async function dismissAnnouncement(page) {
  const close = page.getByRole("button", { name: "Tắt thông báo", exact: true })
  await close.waitFor({ state: "visible", timeout: 800 }).catch(() => {})
  if (await close.isVisible().catch(() => false)) await close.click()
}

async function seedChest(page) {
  await page.evaluate(async () => {
    const { useAppStore } = await import("/src/store/useAppStore.ts")
    const { repository } = await import(
      "/src/infrastructure/storage/repository.ts"
    )
    const user = structuredClone(useAppStore.getState().user)
    user.keys = 30
    user.preferences.reducedMotion = true
    repository.saveUser(user)
    useAppStore.setState({ user })
  })
  await page.reload()
  await dismissAnnouncement(page)
}

async function verifyModeSwitch() {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()
  observe(page)
  await page.goto(`${url}/chest`)
  await dismissAnnouncement(page)

  const routeChecks = [
    ["Chuyển sang Auto chess", /\/autochess$/],
    ["Chuyển sang Phiêu lưu Vị Linh", /\/adventure$/],
    ["Chuyển sang TCG", /\/?tab=home$/],
    ["Chuyển sang Rương vị giác", /\/chest$/],
  ]
  const images = []
  for (const [label, destination] of routeChecks) {
    await page.getByRole("link", { name: label, exact: true }).click()
    const loading = page.locator(".mode-switch-loading")
    await loading.waitFor({ state: "visible" })
    const presentation = await loading.locator("img").evaluate((image) => ({
      fit: getComputedStyle(image).objectFit,
      src: image.getAttribute("src"),
    }))
    assert.equal(presentation.fit, "contain")
    assert(
      /^\/assets\/loading\/v560\/intro-.+\.webp$/.test(presentation.src ?? ""),
    )
    images.push(presentation.src)
    if (images.length === 1)
      await page.screenshot({
        path: path.join(captures, "mode-switch-1280x800.png"),
      })
    await page.waitForURL(destination, { timeout: 4000 })
  }

  checks.push({
    area: "mode-switch",
    viewport: [1280, 800],
    routes: routeChecks.length,
    loadingFit: "contain",
    imagePool: 5,
    selectedImages: images,
  })
  await context.close()
}

async function verifyChest(width, height) {
  const context = await browser.newContext({ viewport: { width, height } })
  const page = await context.newPage()
  observe(page)
  await page.goto(`${url}/chest`)
  await page.locator("#open-chest-button").waitFor()
  await seedChest(page)

  const help = page.locator(".chest-help-popover")
  assert.equal(
    await help.evaluate((node) => getComputedStyle(node).visibility),
    "hidden",
  )
  await page.locator(".chest-help-trigger").hover()
  await help.waitFor({ state: "visible" })
  assert((await help.innerText()).includes("Hướng dẫn mở rương"))

  const skip = page
    .locator(".skip-toggle")
    .filter({ hasText: "Bỏ qua hoạt cảnh lần sau" })
    .locator("input")
  const spirit = page.locator(".chest-spirit-toggle input")
  assert.equal(await spirit.isChecked(), false)
  const geometry = await page
    .locator(".chest-display-options")
    .evaluate((node) => {
      const boxes = [...node.children].map((child) =>
        child.getBoundingClientRect().toJSON(),
      )
      const overlap =
        boxes.length === 2 &&
        !(
          boxes[0].right <= boxes[1].left ||
          boxes[1].right <= boxes[0].left ||
          boxes[0].bottom <= boxes[1].top ||
          boxes[1].bottom <= boxes[0].top
        )
      return {
        boxes,
        overlap,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
      }
    })
  assert.equal(geometry.overlap, false)
  assert(
    geometry.documentWidth <= geometry.viewportWidth + 1,
    JSON.stringify(geometry),
  )
  await page.screenshot({
    path: path.join(captures, `chest-${width}x${height}.png`),
    fullPage: true,
  })

  await skip.check()
  await page.locator("#open-chest-button").click()
  await page
    .getByRole("dialog", { name: /Phần thưởng:/ })
    .waitFor({ timeout: 12_000 })
  assert.equal(await page.locator(".reward-spirit-frame").count(), 0)
  assert(
    (await page
      .locator(".reward-art-frame img,.reward-art-frame .food-image-fallback")
      .count()) > 0,
  )
  await page.keyboard.press("Escape")
  await page
    .getByRole("dialog", { name: /Phần thưởng:/ })
    .waitFor({ state: "detached" })

  await spirit.check()
  await page.locator("#open-chest-button").click()
  await page
    .locator(".reward-spirit-frame .chest-spirit-card")
    .waitFor({ timeout: 12_000 })
  const resultBox = await page.locator(".reward-reveal-card").boundingBox()
  assert(resultBox && resultBox.x >= -1 && resultBox.y >= -1)
  assert(
    resultBox.x + resultBox.width <= width + 1 &&
      resultBox.y + resultBox.height <= height + 1,
  )
  await page.screenshot({
    path: path.join(captures, `chest-spirit-${width}x${height}.png`),
  })

  checks.push({
    area: "chest",
    viewport: [width, height],
    compactHelp: true,
    optionsDoNotOverlap: true,
    spiritCardDefault: false,
    foodResult: true,
    spiritResult: true,
    resultFitsViewport: true,
  })
  await context.close()
}

async function seedAdventure(page) {
  await page.evaluate(async () => {
    const { newGame } = await import("/src/game/progression.ts")
    const { newRpgSave } = await import("/src/game/adventureRpg/engine.ts")
    const { RPG_MAPS } = await import("/src/game/adventureRpg/content.ts")
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    const { useAppStore } = await import("/src/store/useAppStore.ts")
    const game = newGame()
    game.adventureRpg = newRpgSave(game)
    for (const map of RPG_MAPS)
      for (let stage = 1; stage <= 6; stage++)
        game.adventureRpg.stars[`${map.id}-${stage}`] = 3
    for (const hero of game.adventureRpg.roster) {
      hero.level = 45
      hero.rank = 4
      hero.skills = [6, 6, 6, 6]
      hero.gear = [3, 3, 2]
    }
    if (!useGameStore.getState().importSave(game))
      throw Error("Web 5.8 fixture rejected")
    useGameStore.getState().dismiss()
    useAppStore.getState().updatePreference("reducedMotion", true)
  })
}

async function verifyAdventure(width, height, cinematic = false) {
  const context = await browser.newContext({ viewport: { width, height } })
  const page = await context.newPage()
  observe(page)
  await page.goto(`${url}/adventure`)
  await page.getByRole("region", { name: /Bản đồ làng/ }).waitFor()
  await seedAdventure(page)
  const village = await page.locator(".rpg-village-map").evaluate((map) => {
    const world = map.querySelector(".rpg-village-world")
    const art = map.querySelector(".rpg-village-art")
    const mapBox = map.getBoundingClientRect()
    const worldBox = world.getBoundingClientRect()
    return {
      map: { width: mapBox.width, height: mapBox.height },
      world: {
        width: worldBox.width,
        height: worldBox.height,
        inside:
          worldBox.left >= mapBox.left - 1 &&
          worldBox.top >= mapBox.top - 1 &&
          worldBox.right <= mapBox.right + 1 &&
          worldBox.bottom <= mapBox.bottom + 1,
      },
      art: {
        fit: getComputedStyle(art).objectFit,
        naturalWidth: art.naturalWidth,
        naturalHeight: art.naturalHeight,
      },
    }
  })
  assert.equal(village.world.inside, true)
  assert(Math.abs(village.world.width / village.world.height - 1.5) < 0.01)
  assert.deepEqual(village.art, {
    fit: "contain",
    naturalWidth: 1536,
    naturalHeight: 1024,
  })
  await page.screenshot({
    path: path.join(captures, `village-${width}x${height}.png`),
  })
  await page.getByRole("button", { name: /Cổng Ký Ức/ }).click()
  const transition = page.locator(".rpg-transition")
  await transition.waitFor()
  const loading = await transition.locator("img").evaluate((image) => ({
    fit: getComputedStyle(image).objectFit,
    src: image.getAttribute("src"),
  }))
  assert.equal(loading.fit, "contain")
  assert(/^\/assets\/loading\/v560\/intro-.+\.webp$/.test(loading.src ?? ""))
  await page.screenshot({
    path: path.join(captures, `loading-${width}x${height}.png`),
  })
  await page.locator(".rpg-map-tabs").waitFor({ timeout: 3000 })
  assert.equal(await page.locator(".rpg-map-tabs button").count(), 8)

  const advanced = [
    [4, "Đỉnh Trà Mây", "tea-cloud-peak.webp"],
    [5, "Lò Muối Đỏ", "red-salt-kiln.webp"],
    [6, "Đầm Sen Nguyệt", "moon-lotus-marsh.webp"],
    [7, "Điện Vạn Hương", "aroma-palace.webp"],
  ]
  for (const [index, name, asset] of advanced) {
    await page.locator(".rpg-map-tabs button").nth(index).click()
    await page
      .locator(".rpg-map-card h1")
      .getByText(name, { exact: true })
      .waitFor()
    const banner = await page.locator(".rpg-map-card").evaluate((node) => {
      const portrait = node.querySelector("img")
      return {
        image: getComputedStyle(node).backgroundImage,
        opacity: portrait ? getComputedStyle(portrait).opacity : null,
        mask: portrait ? getComputedStyle(portrait).maskImage : null,
      }
    })
    assert(banner.image.includes(asset))
    assert.equal(banner.opacity, "1")
    assert.equal(banner.mask, "none")
  }
  assert.deepEqual(
    await page.locator(".rpg-difficulty-chooser button").allTextContents(),
    ["NORMAL Địch ×1", "HARD Địch ×3", "EXTREME Địch ×8"],
  )
  await page.getByRole("button", { name: /EXTREME/ }).click()
  assert.equal(
    await page
      .getByRole("button", { name: /EXTREME/ })
      .getAttribute("aria-pressed"),
    "true",
  )
  await page.screenshot({
    path: path.join(captures, `campaign-${width}x${height}.png`),
  })

  await page.locator(".rpg-stage-node").first().click()
  const story = page.getByRole("dialog", { name: "Câu chuyện" })
  await story.waitFor()
  const storyBox = await story.boundingBox()
  assert(storyBox)
  assert(
    Math.abs(storyBox.x + storyBox.width / 2 - width / 2) <= 2,
    JSON.stringify(storyBox),
  )
  assert(
    Math.abs(storyBox.y + storyBox.height / 2 - height / 2) <= 2,
    JSON.stringify(storyBox),
  )
  await page.screenshot({
    path: path.join(captures, `story-${width}x${height}.png`),
  })

  checks.push({
    area: "adventure-map",
    viewport: [width, height],
    loadingFit: loading.fit,
    mapCount: 8,
    advancedMaps: advanced.map((item) => item[1]),
    guideOpacity: 1,
    difficulties: { normal: 1, hard: 3, extreme: 8 },
    storyCentered: true,
    villageFullMap: village,
  })
  if (!cinematic) {
    await context.close()
    return
  }

  await page.evaluate(async () => {
    const { useAppStore } = await import("/src/store/useAppStore.ts")
    useAppStore.getState().updatePreference("reducedMotion", false)
  })
  await story.getByRole("button", { name: "Tiếp tục →", exact: true }).click()
  await transition.waitFor()
  assert.equal(
    await transition
      .locator("img")
      .evaluate((image) => getComputedStyle(image).objectFit),
    "contain",
  )
  await page.locator(".rpg-arena").waitFor({ timeout: 4000 })
  await page
    .getByRole("status", { name: /Ready · Sẵn sàng/ })
    .waitFor({ timeout: 3000 })
  assert(
    (
      await page
        .locator(".rpg-ceremony-art")
        .evaluate((node) => getComputedStyle(node).backgroundImage)
    ).includes("battle-ceremony.webp"),
  )
  const readyCeremony = await page.locator(".rpg-ceremony-art").evaluate((node) => {
    const box = node.getBoundingClientRect()
    const arena = node.closest(".rpg-arena").getBoundingClientRect()
    return {
      width: box.width,
      height: box.height,
      inside:
        box.left >= arena.left - 1 &&
        box.top >= arena.top - 1 &&
        box.right <= arena.right + 1 &&
        box.bottom <= arena.bottom + 1,
    }
  })
  assert.equal(readyCeremony.inside, true)
  assert(Math.abs(readyCeremony.width - readyCeremony.height) <= 1)
  await page.screenshot({
    path: path.join(captures, "battle-ready-1440x900.png"),
  })
  await page
    .locator(".rpg-battle-opening")
    .waitFor({ state: "detached", timeout: 3000 })
  assert.equal(await page.locator(".rpg-focus").count(), 0)
  assert(
    (await page.locator(".rpg-strategy").innerText()).includes(
      "Tự đánh địch gần nhất",
    ),
  )

  await page.evaluate(async () => {
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    const game = structuredClone(useGameStore.getState().save)
    const battle = game.adventureRpg.run.battle
    for (const actor of battle.actors) {
      actor.nextAttack = battle.tick + 10_000
      actor.nextSkill = battle.tick + 10_000
      actor.nextSupport = battle.tick + 10_000
      if (actor.side === "enemy")
        actor.hp = actor.maxHp = Math.max(actor.maxHp, 1_000_000)
    }
    battle.actors.find((actor) => actor.side === "ally").energy = 100
    battle.cinematics = true
    if (!useGameStore.getState().importSave(game))
      throw Error("Cinematic fixture rejected")
    useGameStore.getState().dismiss()
  })
  await page.locator(".rpg-burst-button").first().click()
  const video = page.locator(".rpg-cinematic video")
  await video.waitFor({ timeout: 3000 })
  await page.waitForFunction(() => {
    const element = document.querySelector(".rpg-cinematic video")
    return element && element.videoWidth > 0
  })
  const movie = await video.evaluate((element) => ({
    width: element.videoWidth,
    height: element.videoHeight,
    fit: getComputedStyle(element).objectFit,
  }))
  assert.deepEqual([movie.width, movie.height], [1280, 720])
  assert.equal(movie.fit, "contain")
  const caption = await page
    .locator(".rpg-cinematic-caption > div > span")
    .innerText()
  assert(caption.length > 10)
  assert(!caption.includes("Đồng hồ trận tạm dừng trong tuyệt kỹ"))
  await page.screenshot({ path: path.join(captures, "cinematic-1440x900.png") })
  await page.getByRole("button", { name: "Bỏ qua ›", exact: true }).click()
  await page.locator(".rpg-cinematic").waitFor({ state: "detached" })

  await page.evaluate(async () => {
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    const game = structuredClone(useGameStore.getState().save)
    const battle = game.adventureRpg.run.battle
    battle.result = "win"
    battle.settled = false
    battle.wave = battle.waves.length - 1
    battle.warning = null
    delete battle.cinematic
    for (const actor of battle.actors.filter((actor) => actor.side === "enemy"))
      actor.hp = 0
    if (!useGameStore.getState().importSave(game))
      throw Error("Result fixture rejected")
    useGameStore.getState().dismiss()
  })
  await page.getByRole("status", { name: /Win · Chiến thắng/ }).waitFor()
  const winCeremony = await page.locator(".rpg-ceremony-art").evaluate((node) => {
    const box = node.getBoundingClientRect()
    const arena = node.closest(".rpg-arena").getBoundingClientRect()
    return {
      width: box.width,
      height: box.height,
      inside:
        box.left >= arena.left - 1 &&
        box.top >= arena.top - 1 &&
        box.right <= arena.right + 1 &&
        box.bottom <= arena.bottom + 1,
    }
  })
  assert.equal(winCeremony.inside, true)
  await page.screenshot({
    path: path.join(captures, "battle-win-1440x900.png"),
  })
  checks.push({
    area: "adventure-battle",
    viewport: [width, height],
    readyArt: true,
    readyCeremony,
    manualTargetControls: 0,
    targeting: "nearest",
    cinematic: movie,
    skillDescription: caption,
    winArt: true,
    winCeremony,
  })
  await context.close()
}

try {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      await fetch(url)
      break
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_BIN,
    headless: true,
    env: {
      ...process.env,
      ...(process.env.CHROMIUM_LIB_DIR
        ? { LD_LIBRARY_PATH: process.env.CHROMIUM_LIB_DIR }
        : {}),
    },
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  })
  await verifyChest(1440, 900)
  await verifyChest(390, 844)
  await verifyModeSwitch()
  await verifyAdventure(390, 844)
  await verifyAdventure(1440, 900, true)
  assert.deepEqual(pageErrors, [])
  assert.deepEqual(missingAssets, [])
  const report = {
    version: "5.8.0",
    date: new Date().toISOString(),
    engine: "Chromium headless / SwiftShader",
    checks,
    pageErrors,
    missingAssets,
    limits: ["Not a physical-device FPS measurement", "Safari not tested"],
  }
  rmSync(path.join(out, "browser-qa-failure.json"), { force: true })
  writeFileSync(
    path.join(out, "browser-qa.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  )
  console.log(
    JSON.stringify({
      success: true,
      checks: checks.length,
      pageErrors: 0,
      missingAssets: 0,
    }),
  )
} catch (error) {
  writeFileSync(
    path.join(out, "browser-qa-failure.json"),
    `${JSON.stringify({ error: String(error), stack: error.stack, serverLog: serverLog.slice(-3000), checks, pageErrors, missingAssets }, null, 2)}\n`,
  )
  throw error
} finally {
  await browser?.close()
  server.kill("SIGTERM")
}
