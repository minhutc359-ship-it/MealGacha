import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { writeFileSync } from "node:fs"
const server = spawn("pnpm", ["dev", "--host", "127.0.0.1", "--port", "4191"], {
  stdio: "ignore",
})
process.on("exit", () => server.kill())
for (let n = 0; n < 150; n++) {
  try {
    await fetch("http://127.0.0.1:4191")
    break
  } catch {
    await new Promise((r) => setTimeout(r, 100))
  }
}
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright")
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  headless: true,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
  env: {
    ...process.env,
    LD_LIBRARY_PATH: process.env.CHROMIUM_LIB_DIR || "/tmp",
  },
})
const checks = []
const artReady = async p => {
 const start=Date.now()
 while(Date.now()-start<12000){
  const r=await p.evaluate(async()=>{const {adventureRendererStats}=await import("/src/game/adventureRenderer.ts");const canvas=document.querySelector(".adv-world-renderer");return canvas?adventureRendererStats(canvas)?.artReady:false})
  if(r)return
  await p.waitForTimeout(60)
 }
 throw Error("Adventure raster atlas failed to become ready")
}
const state = (p) =>
  p.evaluate(async () => {
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    return structuredClone(useGameStore.getState().save)
  })
const until = async (p, condition) => {
  const start = Date.now()
  while (Date.now() - start < 10000) {
    if (condition(await state(p))) return
    await p.waitForTimeout(50)
  }
  throw Error("Save condition timed out")
}
const stats = (p) =>
  p.evaluate(async () => {
    const { adventureRendererStats, activeAdventureRenderers } = await import(
      "/src/game/adventureRenderer.ts"
    )
    return {
      active: activeAdventureRenderers(),
      ...adventureRendererStats(document.querySelector(".adv-world-renderer")),
    }
  })
const seed = (p, patch) =>
  p.evaluate(async (patch) => {
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    const s = structuredClone(useGameStore.getState().save)
    s.adventure = {
      ...s.adventure,
      message: null,
      speaker: null,
      service: null,
      encounter: null,
      follower: null,
      ...patch,
    }
    if (!useGameStore.getState().importSave(s)) throw Error("Fixture refused")
    useGameStore.setState({ notice: null })
  }, patch)
const clickTile = async (p, point) => {
  const location = await p.evaluate(async (point) => {
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    const { ADVENTURE_MAP_BY_ID } = await import("/src/game/adventureWorld.ts")
    const { worldView } = await import("/src/game/adventurePresentation.ts")
    const s = useGameStore.getState().save.adventure,
      c = document.querySelector(".adv-world-renderer"),
      r = c.getBoundingClientRect(),
      v = worldView(ADVENTURE_MAP_BY_ID[s.mapId], s, r.width, r.height)
    return {
      x: r.x + v.x + (point.x + 0.5) * v.tile,
      y: r.y + v.y + (point.y + 0.5) * v.tile,
    }
  }, point)
  await p.mouse.click(location.x, location.y)
}
const fit = async (p, locator) => {
  const r = await locator.boundingBox(),
    v = p.viewportSize()
  assert(r && r.width >= 28 && r.height >= 28, "small control")
  assert(
    r.x >= -1 &&
      r.y >= -1 &&
      r.x + r.width <= v.width + 1 &&
      r.y + r.height <= v.height + 1,
    "control outside viewport",
  )
}
for (const [width, height] of process.env.QA_FAST
  ? [[390, 844]]
  : [
      [1440, 900],
      [390, 844],
      [844, 390],
      [320, 568],
    ]) {
  const context = await browser.newContext({ viewport: { width, height } }),
    page = await context.newPage(),
    errors = [],
    missing = []
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("response", (r) => {
    if (r.url().includes("/assets/") && r.status() >= 400) missing.push(r.url())
  })
  await page.goto("http://127.0.0.1:4191/adventure", {
    waitUntil: "domcontentloaded",
  })
  await page.locator(".adv-starter-grid button").first().click()
  await page.locator(".adv-world-renderer").waitFor()
  await artReady(page)
  await page.locator(".adv-controls .interact").click()
  await page.waitForTimeout(400)
  await page.evaluate(async () => {
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    const s = structuredClone(useGameStore.getState().save)
    s.coins = 731
    s.xp = 517
    if (!useGameStore.getState().importSave(s))
      throw Error("Bank fixture refused")
    useGameStore.setState({ notice: null })
  })
  for (const button of ["Đi lên", "Đi trái", "Đi phải", "Đi xuống"])
    await fit(page, page.getByRole("button", { name: button, exact: true }))
  await fit(page, page.locator(".adv-controls .interact"))
  await fit(page, page.locator(".adv-menu-key"))
  assert.equal(
    await page.evaluate(
      () =>
        document.documentElement.scrollHeight > innerHeight + 1 ||
        document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
  )
  const base = (await state(page)).adventure.steps
  const right = await page
    .getByRole("button", { name: "Đi phải", exact: true })
    .boundingBox()
  await page.mouse.move(right.x + right.width / 2, right.y + right.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(450)
  await page.mouse.up()
  const held = (await state(page)).adventure.steps
  assert(held - base >= 2)
  await page.waitForTimeout(250)
  assert.equal((await state(page)).adventure.steps, held)
  await page.locator(".adv-world-viewport").focus()
  await page.keyboard.down("ArrowRight")
  await page.waitForTimeout(450)
  await page.keyboard.up("ArrowRight")
  const keyboard = (await state(page)).adventure.steps
  assert(keyboard - held >= 2)
  await page.waitForTimeout(250)
  assert.equal((await state(page)).adventure.steps, keyboard)
  await page.locator(".adv-world-viewport").focus()
  await page.keyboard.down("ArrowRight")
  await page.waitForTimeout(190)
  await page.evaluate(() => window.dispatchEvent(new Event("blur")))
  const blurred = (await state(page)).adventure.steps
  await page.waitForTimeout(240)
  assert.equal((await state(page)).adventure.steps, blurred)
  await page.keyboard.up("ArrowRight")
  await page.getByRole("button", { name: /Đi bộ/ }).click()
  await page.locator(".adv-world-viewport").focus()
  await page.keyboard.down("ArrowLeft")
  await page.waitForTimeout(450)
  await page.keyboard.up("ArrowLeft")
  const run = (await state(page)).adventure.steps
  assert(run - blurred >= 4)
  await page.getByRole("button", { name: /Chạy/ }).click()
  await page.waitForTimeout(220)
  await page.screenshot({ path: `/tmp/web480-adventure-map-${width}.png` })
  await page.locator(".adv-menu-key").click()
  await page
    .getByRole("heading", { name: "Menu phiêu lưu", exact: true })
    .waitFor()
  const paused = (await stats(page)).draws
  await page.waitForTimeout(350)
  assert.equal((await stats(page)).draws, paused)
  const point = (await state(page)).adventure.x
  await page.keyboard.press("ArrowRight")
  assert.equal((await state(page)).adventure.x, point)
  await page
    .getByRole("button", { name: "Đóng bảng phiêu lưu", exact: true })
    .click()
  console.log("controls passed", width)
  const maps = await page.evaluate(async () => {
    const { ADVENTURE_MAPS } = await import("/src/game/adventureWorld.ts")
    return ADVENTURE_MAPS.map((m) => ({
      mapId: m.id,
      areaId: m.areaId,
      x: m.spawn.x,
      y: m.spawn.y,
    }))
  })
  if (width === 390) {
    for (const m of maps) {
      await seed(page, m)
      await page.waitForTimeout(150)
      const r = await stats(page)
      await artReady(page)
      const art=await stats(page)
      assert.equal(art.groundBuilds, 2)
      assert.equal(art.artReady,true)
      assert(art.layerBytes < 16 * 1024 * 1024)
      assert(r.layerBytes < 16 * 1024 * 1024)
      assert(r.surfacePixels <= 1_305_000)
      assert.deepEqual(r.assetFailures, [])
      assert.equal(r.active, 1)
    }
    checks.push({
      maps: maps.length,
      cachedLayers: true,
      layerBudgetBytes: 16 * 1024 * 1024,
    })
  }
  console.log("maps passed", width)
  await seed(page, {
    mapId: "lantern-quarter",
    areaId: "lantern-quarter",
    x: 3,
    y: 14,
    facing: "up",
  })
  await page.locator(".adv-controls .interact").click()
  assert(
    (await state(page)).adventure.completedQuests.includes(
      "talk:lantern-quarter",
    ),
  )
  const talk = (await state(page)).adventure.message
  assert(talk)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.locator(".adv-message").waitFor()
  assert.equal((await state(page)).adventure.message, talk)
  await page.locator(".adv-controls .interact").click()
  await seed(page, { x: 4, y: 7, facing: "up" })
  await page.getByRole("button", { name: "Đi lên", exact: true }).click()
  await until(page, (s) => s.adventure.mapId === "lantern-quarter:clinic")
  await page.locator(".adv-controls .interact").click()
  await page.waitForTimeout(220)
  const clinic = await page.evaluate(async () => {
    const { ADVENTURE_MAP_BY_ID } = await import("/src/game/adventureWorld.ts")
    return ADVENTURE_MAP_BY_ID["lantern-quarter:clinic"]
  })
  const patient = (await state(page)).adventure
  patient.team[0].hp = 1
  patient.team[0].status = "burn"
  await seed(page, { team: patient.team })
  await page.waitForTimeout(200)
  await page.getByRole("button", { name: "Đi lên", exact: true }).click()
  await page.waitForTimeout(210)
  await page.getByRole("button", { name: "Đi lên", exact: true }).click()
  await page.waitForTimeout(210)
  await clickTile(
    page,
    clinic.npcs.find((n) => n.role === "healer"),
  )
  await until(page, (s) => s.adventure.team[0].hp > 1)
  assert.equal((await state(page)).adventure.team[0].status, null)
  await page.locator(".adv-controls .interact").click()
  await page.waitForTimeout(200)
  await page.getByRole("button", { name: "Đi xuống", exact: true }).click()
  await page.waitForTimeout(210)
  await page.getByRole("button", { name: "Đi xuống", exact: true }).click()
  await page.waitForTimeout(210)
  await clickTile(page, clinic.exits[0])
  await until(page, (s) => s.adventure.mapId === "lantern-quarter")
  await page.locator(".adv-controls .interact").click()
  if (width === 390) {
    await seed(page, { x: 11, y: 7, facing: "up" })
    await page.getByRole("button", { name: "Đi lên", exact: true }).click()
    await until(page, (s) => s.adventure.mapId === "lantern-quarter:shop")
    await page.locator(".adv-controls .interact").click()
    await page.waitForTimeout(220)
    const shop = await page.evaluate(async () => {
      const { ADVENTURE_MAP_BY_ID } = await import(
        "/src/game/adventureWorld.ts"
      )
      return ADVENTURE_MAP_BY_ID["lantern-quarter:shop"]
    })
    await clickTile(
      page,
      shop.npcs.find((n) => n.role === "merchant"),
    )
    await page.locator(".adv-shop-dialog").waitFor()
    const money = (await state(page)).adventure.coins,
      stock = (await state(page)).adventure.aromaSeals
    await page.locator(".adv-shop-dialog article button").first().click()
    const price = await page.evaluate(async () => {
      const { ADVENTURE_SHOP } = await import("/src/game/adventure.ts")
      return ADVENTURE_SHOP[0].price
    })
    assert.equal((await state(page)).adventure.coins, money - price)
    assert.equal((await state(page)).adventure.aromaSeals, stock + 1)
    await page.locator(".adv-shop-dialog header button").click()
    checks.push({ shopPurchase: true })
  }
  console.log("clinic passed", width)
  const battleFixture = await page.evaluate(async () => {
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    const { reduceAdventure } = await import("/src/game/adventure.ts")
    const s = structuredClone(useGameStore.getState().save)
    for (let n = 1; n < 100; n++) {
      const b = {
        ...s.adventure,
        mapId: "lantern-quarter",
        areaId: "lantern-quarter",
        x: 2,
        y: 7,
        steps: n,
        message: null,
        service: null,
        encounter: null,
      }
      const next = reduceAdventure(b, { type: "move", direction: "down" }).save
      if (next.encounter) return next
    }
    throw Error("Wild fixture missing")
  })
  await seed(page, battleFixture)
  await page.locator("dialog.adv-battle").waitFor()
  await page.getByRole("button", { name: /^Chiến đấu/ }).click()
  const scene = await page.locator(".adv-battle-arena").elementHandle()
  const enemyHP = await page
      .locator('.adv-combatant.enemy [role="meter"]')
      .getAttribute("aria-valuenow"),
    beforeTurn = (await state(page)).adventure.encounter.turn
  await page
    .locator(".adv-skill-grid button")
    .first()
    .evaluate((el) => {
      el.click()
      el.click()
      el.click()
    })
  await page.locator(".adv-turn-playing").waitFor()
  assert.equal((await state(page)).adventure.encounter.turn, beforeTurn + 1)
  assert.equal(
    await page
      .locator('.adv-combatant.enemy [role="meter"]')
      .getAttribute("aria-valuenow"),
    enemyHP,
  )
  await page.waitForTimeout(1700)
  assert(await scene.evaluate((el) => el.isConnected))
  assert.equal(
    Number(
      await page
        .locator('.adv-combatant.enemy [role="meter"]')
        .getAttribute("aria-valuenow"),
    ),
    (await state(page)).adventure.encounter.hp,
  )
  const under = (await stats(page)).draws
  await page.waitForTimeout(350)
  assert.equal((await stats(page)).draws, under)
  await fit(page, page.getByRole("button", { name: /^Chiến đấu/ }))
  await fit(page, page.getByRole("button", { name: /^Túi đồ/ }))
  assert.equal(
    await page
      .locator(".adv-battle")
      .evaluate((el) => el.scrollHeight > el.clientHeight + 1),
    false,
  )
  await page.screenshot({ path: `/tmp/web480-adventure-battle-${width}.png` })
  if (width === 390) {
    await page.getByRole("button", { name: /^Túi đồ/ }).click()
    const bag = (await state(page)).adventure.inventory.potion
    await page.getByRole("button", { name: /^Canh Ấm/ }).click()
    await page.waitForTimeout(1700)
    assert.equal((await state(page)).adventure.inventory.potion, bag - 1)
    const capture = await page.evaluate(async () => {
      const { useGameStore } = await import("/src/game/useGameStore.ts")
      const { reduceAdventure } = await import("/src/game/adventure.ts")
      const s = structuredClone(useGameStore.getState().save.adventure)
      s.encounter.hp = 1
      s.encounter.enemyStatus = "drowsy"
      s.encounter.enemyStatusTurns = 2
      for (let n = 0; n < 50; n++) {
        s.encounter.id = "qa-capture-" + n
        if (
          reduceAdventure(s, { type: "battle", move: "befriend" }).event ===
          "capture"
        )
          return s
      }
      throw Error("Capture fixture missing")
    })
    await seed(page, capture)
    const members = (await state(page)).adventure.team.length
    await page.getByRole("button", { name: /^Túi đồ/ }).click()
    await page.getByRole("button", { name: /^Hương Ấn/ }).click()
    await page.locator("dialog.adv-battle").waitFor({ state: "hidden" })
    assert.equal((await state(page)).adventure.team.length, members + 1)
    await page.locator(".adv-controls .interact").click()
    await seed(page, {
      mapId: "lantern-quarter:clinic",
      areaId: "lantern-quarter",
      x: 8,
      y: 6,
      facing: "up",
    })
    await page.locator(".adv-controls .interact").click()
    await page
      .getByRole("heading", { name: "Đội hình & túi đồ", exact: true })
      .waitFor()
    await page
      .locator(".adv-party-list .adv-spirit-row")
      .first()
      .locator("summary")
      .click()
    await page
      .getByRole("button", { name: "Gửi vào tủ", exact: true })
      .first()
      .click()
    assert.equal((await state(page)).adventure.team.length, 1)
    assert.equal((await state(page)).adventure.reserve.length, 1)
    await page
      .locator(".adv-reserve .adv-spirit-row")
      .first()
      .locator("summary")
      .click()
    await page
      .getByRole("button", { name: "Nhận vào đội", exact: true })
      .click()
    assert.equal((await state(page)).adventure.team.length, 2)
    assert.equal((await state(page)).adventure.reserve.length, 0)
    await page
      .getByRole("button", { name: "Đóng bảng phiêu lưu", exact: true })
      .click()
    checks.push({ capture: true, storageDepositWithdraw: true })
    const snapshot = await page.evaluate(() =>
      localStorage.getItem("foodchest.tcg.v1"),
    )
    await page.locator(".adv-menu-key").click()
    await page
      .getByRole("button", { name: /^Hướng dẫn/ })
      .last()
      .click()
    await page
      .getByRole("button", { name: "Giới thiệu", exact: false })
      .last()
      .click()
    await page
      .getByRole("button", { name: "Ẩn chú thích", exact: true })
      .click()
    await page.waitForTimeout(10500)
    await page.screenshot({ path: "/tmp/web480-adventure-demo.png" })
    assert.equal(
      await page
        .locator(".live-demo-scene")
        .evaluate((el) => el.scrollHeight > el.clientHeight + 1),
      false,
    )
    await page
      .getByRole("button", { name: "Đóng giới thiệu", exact: true })
      .click()
    assert.equal(
      await page.evaluate(() => localStorage.getItem("foodchest.tcg.v1")),
      snapshot,
    )
    assert.equal((await stats(page)).active, 1)
  }
  const final = await state(page)
  assert.equal(final.coins, 731)
  assert.equal(final.xp, 517)
  assert.deepEqual(errors, [])
  assert.deepEqual(missing, [])
  checks.push({
    width,
    height,
    heldPointer: true,
    heldKeyboard: true,
    runToggle: true,
    pauseMenuAndBattle: true,
    dialogueReload: true,
    clinicHealsAndExit: true,
    turnOneUse: true,
    arenaPreserved: true,
    viewport: true,
    rasterAtlas:true,
    errors,
    missing,
  })
  await page.goto("http://127.0.0.1:4191/tcg", {
    waitUntil: "domcontentloaded",
  })
  await page.waitForTimeout(150)
  assert.equal((await stats(page)).active, 0)
  await context.close()
}
console.log(JSON.stringify(checks, null, 2))
writeFileSync(process.env.QA_OUTPUT || "/tmp/web480-adventure-results.json", JSON.stringify(checks, null, 2))
await browser.close()
server.kill()
