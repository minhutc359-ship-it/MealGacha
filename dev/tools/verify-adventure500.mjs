import assert from "node:assert/strict"
import { mkdirSync, writeFileSync } from "node:fs"
import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const out = path.join(root, "dev/docs/web-v500")
mkdirSync(out, { recursive: true })
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright")
const port = Number(process.env.RPG_QA_PORT ?? 4196), url = `http://127.0.0.1:${port}`
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--config", "dev/tools/vite.pvp-qa.config.ts", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: root, stdio: "pipe" })
let serverLog = "", browser
server.stdout.on("data", b => serverLog += b); server.stderr.on("data", b => serverLog += b)
const checks = []
const state = page => page.evaluate(async () => {
  const { useGameStore } = await import("/src/game/useGameStore.ts")
  return structuredClone(useGameStore.getState().save)
})
const fit = async (page, locator) => {
  const r = await locator.boundingBox(), vp = page.viewportSize()
  assert(r && r.width >= 24 && r.height >= 24, "Small or missing control")
  assert(r.x >= -1 && r.y >= -1 && r.x + r.width <= vp.width + 1 && r.y + r.height <= vp.height + 1, "Control outside viewport")
}
const finish = page => page.evaluate(async () => {
  const { useGameStore } = await import("/src/game/useGameStore.ts")
  const store = useGameStore.getState()
  let b = store.save.adventureRpg.run.battle
  if (b.paused) store.rpgAction({ type: "pause" })
  if (!b.auto) store.rpgAction({ type: "auto" })
  for (let i = 0; i < 200 && !useGameStore.getState().save.adventureRpg.run.battle.result; i++) {
    b = useGameStore.getState().save.adventureRpg.run.battle
    if (b.warning && b.tick >= b.guardReady) store.rpgAction({ type: "guard", row: b.warning.row })
    store.rpgAction({ type: "tick", steps: 4 })
  }
  store.rpgAction({ type: "settle" })
})
try {
  for (let i = 0; i < 100; i++) { try { await fetch(url); break } catch { await new Promise(r => setTimeout(r, 100)) } }
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN, headless: true,
    env: { ...process.env, ...(process.env.CHROMIUM_LIB_DIR ? { LD_LIBRARY_PATH: process.env.CHROMIUM_LIB_DIR } : {}) },
    args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
  for (const [width, height] of [[1440, 900], [390, 844], [844, 390], [320, 568]]) {
    const context = await browser.newContext({ viewport: { width, height } }), page = await context.newPage(), errors = [], missing = []
    page.on("pageerror", e => errors.push(e.message)); page.on("response", r => { if (r.url().includes("/assets/") && r.status() >= 400) missing.push(r.url()) })
    await page.goto(`${url}/adventure`); await page.locator(".rpg-stage-node").first().waitFor()
    await page.evaluate(async () => {
      const { useGameStore } = await import("/src/game/useGameStore.ts"), { newGame } = await import("/src/game/progression.ts"), { reduceAdventure } = await import("/src/game/adventure.ts"), { fullPP, spiritMaxHp } = await import("/src/game/adventureSkills.ts")
      const g = newGame(); g.coins = 731; g.dust = 123; g.xp = 517
      g.adventure = reduceAdventure(g.adventure, { type: "start", cardId: "com-tam" }).save
      g.adventure.team[0].level = 8; g.adventure.team[0].xp = 49; g.adventure.team[0].hp = spiritMaxHp("com-tam", 8); g.adventure.team[0].pp = fullPP("com-tam", 8)
      g.adventure.coins = 811; g.adventure.inventory = { potion: 7, revive: 3 }
      if (!useGameStore.getState().importSave(g)) throw Error("Legacy fixture import rejected")
    })
    await page.reload(); await page.locator(".rpg-stage-node").first().waitFor()
    const baseline = await state(page)
    assert.equal(baseline.adventureRpg.resources.coins, 811); assert.equal(baseline.adventureRpg.roster[0].level, 8)
    assert(await page.locator(".rpg-stage-node").nth(5).isDisabled())
    await page.screenshot({ path: path.join(out, `map-${width}.png`) })
    for (let i = 0; i < 6; i++) await fit(page, page.locator(".rpg-stage-node").nth(i))
    await page.locator(".rpg-stage-node").first().click(); await page.getByRole("dialog", { name: "Câu chuyện" }).waitFor()
    await page.keyboard.press("Escape"); assert.equal((await state(page)).adventureRpg.run, null)
    await page.locator(".rpg-stage-node").first().click(); await page.getByRole("button", { name: "Tiếp tục →", exact: true }).click()
    await page.locator(".rpg-arena").waitFor(); await page.waitForTimeout(1200)
    let live = await state(page)
    const clockSamples = [live.adventureRpg.run.battle.tick]
    for (let sample = 0; sample < 20 && live.adventureRpg.run.battle.tick < 3; sample++) {
      await page.waitForTimeout(250); live = await state(page); clockSamples.push(live.adventureRpg.run.battle.tick)
    }
    assert(live.adventureRpg.run.battle.tick >= 3, `No foreground ticks: ${JSON.stringify({ clockSamples, errors, battle: live.adventureRpg.run.battle })}`)
    await page.getByRole("button", { name: "Tạm dừng trận", exact: true }).click()
    const paused = await state(page); await page.waitForTimeout(350); assert.equal((await state(page)).adventureRpg.run.battle.tick, paused.adventureRpg.run.battle.tick)
    await page.screenshot({ path: path.join(out, `battle-${width}.png`) })
    for (const locator of [page.locator(".rpg-burst-button").first(), page.locator(".rpg-burst-button").last(), page.getByRole("button", { name: "Che tuyến trước", exact: true }), page.getByRole("button", { name: "Rút lui", exact: true })]) await fit(page, locator)
    await page.reload(); await page.locator(".rpg-arena").waitFor(); const resumed = await state(page)
    assert.deepEqual(resumed.adventureRpg.run.battle, paused.adventureRpg.run.battle)
    await finish(page); await page.getByText("Đã giữ được hương vị", { exact: true }).waitFor()
    const win = await state(page); assert(win.adventureRpg.stars["lantern-1"] > 0)
    await page.reload(); await page.getByText("Đã giữ được hương vị", { exact: true }).waitFor()
    assert.deepEqual((await state(page)).adventureRpg.resources, win.adventureRpg.resources)
    await page.locator(".rpg-result-actions").getByRole("button", { name: "Về bản đồ", exact: true }).click()
    assert(!(await page.locator(".rpg-stage-node").nth(1).isDisabled()))
    await page.getByRole("button", { name: "Đội hình", exact: true }).click()
    const old = await state(page); await page.getByRole("button", { name: "+180 KN · 1 Sổ KN", exact: true }).click()
    const trained = await state(page); assert.equal(trained.adventureRpg.resources.experience, old.adventureRpg.resources.experience - 1)
    assert(trained.adventureRpg.roster[0].xp !== old.adventureRpg.roster[0].xp)
    await page.screenshot({ path: path.join(out, `heroes-${width}.png`) })
    await page.getByRole("button", { name: "Hướng dẫn", exact: true }).click()
    const demoBaseline = await state(page)
    await page.getByRole("button", { name: /Giới thiệu/ }).click()
    await page.locator(".rpg-battle-demo .rpg-arena").waitFor()
    await page.getByRole("button", { name: "Ẩn chú thích", exact: true }).click()
    await fit(page, page.locator(".rpg-battle-demo .rpg-burst-button").last())
    await page.getByRole("button", { name: "Đóng giới thiệu", exact: true }).click()
    assert.deepEqual((await state(page)).adventureRpg, demoBaseline.adventureRpg)
    await page.getByRole("button", { name: "Dungeon", exact: true }).click()
    await page.locator(".rpg-dungeon-grid button").first().click(); await page.locator(".rpg-arena").waitFor()
    const farm = await state(page)
    await finish(page); await page.locator(".rpg-result-actions").getByRole("button", { name: "Lên tầng 2 →", exact: true }).waitFor()
    const floor1 = await state(page); assert.equal(floor1.adventureRpg.resources.experience, farm.adventureRpg.resources.experience + 2)
    await page.locator(".rpg-result-actions").getByRole("button", { name: "Lên tầng 2 →", exact: true }).click()
    const floor2 = await state(page)
    for (const a of floor2.adventureRpg.run.battle.actors.filter(a => a.side === "ally")) assert.equal(a.hp, floor1.adventureRpg.run.dungeon.health[a.uid].hp)
    await finish(page); await page.getByRole("button", { name: "Nghỉ · Hồi 40% HP", exact: true }).click()
    const camp = await state(page); assert.equal(camp.adventureRpg.run.dungeon.status, "ready")
    await page.reload(); await page.locator(".rpg-result-actions").getByRole("button", { name: "Lên tầng 3 →", exact: true }).waitFor()
    assert.deepEqual((await state(page)).adventureRpg.run.dungeon.health, camp.adventureRpg.run.dungeon.health)
    await page.locator(".rpg-result-actions").getByRole("button", { name: "Về bản đồ", exact: true }).click()
    const final = await state(page)
    for (const key of ["coins", "dust", "xp", "packTickets", "cards", "decks", "adventure", "autoChess", "history"]) assert.deepEqual(final[key], baseline[key], `Account/legacy field changed: ${key}`)
    let manualBossFlow = false
    if (width === 390) {
      // Prepared progression fixture for the boss UI; no account/legacy field is edited.
      await page.evaluate(async () => {
        const { useGameStore } = await import("/src/game/useGameStore.ts")
        const g = structuredClone(useGameStore.getState().save), s = g.adventureRpg
        for (const h of s.roster) { h.level = 8; h.rank = 2; h.skills = [3, 3, 3, 2] }
        for (let i = 1; i <= 5; i++) s.stars[`lantern-${i}`] = 1
        if (!useGameStore.getState().importSave(g)) throw Error("Boss fixture rejected")
      })
      await page.getByRole("button", { name: "Đi map", exact: true }).click()
      await page.locator(".rpg-map-tabs button").first().click()
      await page.locator(".rpg-stage-node").nth(5).click()
      await page.getByRole("button", { name: "Tiếp tục →", exact: true }).click()
      await page.locator(".rpg-arena").waitFor()
      await page.evaluate(async () => {
        const { useGameStore } = await import("/src/game/useGameStore.ts"), store = useGameStore.getState()
        for (let n = 0; n < 300 && useGameStore.getState().save.adventureRpg.run.battle.wave < 2; n++) store.rpgAction({ type: "tick", steps: 1 })
        const b = useGameStore.getState().save.adventureRpg.run.battle
        if (b.wave !== 2 || b.result) throw Error("Boss wave did not open")
        window.__rpgArena = document.querySelector(".rpg-arena")
      })
      await page.locator(".rpg-warning").waitFor({ timeout: 7000 })
      const beforeGuard = await state(page), row = beforeGuard.adventureRpg.run.battle.warning.row
      await page.getByRole("button", { name: `Che tuyến ${row === "front" ? "trước" : "sau"}`, exact: true }).click()
      const guarded = await state(page)
      assert(guarded.adventureRpg.run.battle.guardUntil > guarded.adventureRpg.run.battle.tick)
      await page.screenshot({ path: path.join(out, "boss-390.png") })
      const ready = page.locator(".rpg-burst-button.is-ready").first()
      await ready.waitFor({ timeout: 6000 }); const label = await ready.getAttribute("aria-label")
      await ready.click()
      await page.locator(".rpg-burst-banner").waitFor()
      const burst = await state(page)
      assert(burst.adventureRpg.run.battle.events.some(e => e.kind === "burst"))
      assert(await page.evaluate(() => window.__rpgArena === document.querySelector(".rpg-arena")))
      assert(label.includes("100/100"))
      await finish(page); await page.getByText("Đã giữ được hương vị", { exact: true }).waitFor()
      await page.locator(".rpg-result-actions").getByRole("button", { name: "Về bản đồ", exact: true }).click()
      await page.getByRole("button", { name: "Tiếp câu chuyện", exact: true }).click()
      await page.getByRole("button", { name: "Tiếp tục →", exact: true }).click()
      await page.locator(".rpg-map-choice button").last().click()
      assert.equal((await state(page)).adventureRpg.choices.lantern, 1)
      await page.locator(".rpg-map-tabs button").nth(1).click()
      assert(!(await page.locator(".rpg-stage-node").first().isDisabled()))
      for (const key of ["coins", "dust", "xp", "packTickets", "cards", "decks", "adventure", "autoChess", "history"]) assert.deepEqual((await state(page))[key], baseline[key])
      manualBossFlow = true
    }
    assert.deepEqual(errors, []); assert.deepEqual(missing, [])
    checks.push({ viewport: [width, height], realTimeTicks: live.adventureRpg.run.battle.tick, importedLevel: 8, campaignStars: win.adventureRpg.stars["lantern-1"], rewardsIdempotentAfterReload: true, dungeonHpEnergyCarried: true, campReload: true, introUsesLiveViewAndPreservesSave: true, controlsFit: true, manualBossFlow, accountAndLegacyUnchanged: true, errors, missing })
    console.log(JSON.stringify(checks.at(-1)))
    await context.close()
  }
  writeFileSync(path.join(out, "browser-qa.json"), JSON.stringify({ version: "5.0.0", engine: "Chromium headless / SwiftShader", note: "Observed real-time ticks before engine acceleration; not a device FPS benchmark. No Safari or physical device test.", checks }, null, 2) + "\n")
} catch (error) { console.error(serverLog.slice(-3000)); throw error }
finally { await browser?.close(); server.kill() }
