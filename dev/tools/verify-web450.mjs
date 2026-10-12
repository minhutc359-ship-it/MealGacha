import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { writeFileSync } from "node:fs"
const server = spawn("pnpm", ["dev", "--host", "127.0.0.1", "--port", "4186"], {
  stdio: "ignore",
})
process.on("exit", () => server.kill())
for (let n = 0; n < 150; n++) {
  try {
    await fetch("http://127.0.0.1:4186")
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
const state = (page) =>
  page.evaluate(async () => {
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    return structuredClone(useGameStore.getState().save)
  })
const fit = async (page, locator) => {
  const r = await locator.boundingBox(),
    vp = page.viewportSize()
  assert(r && r.width >= 24 && r.height >= 24, "small touch target")
  assert(
    r.x >= -1 &&
      r.y >= -1 &&
      r.x + r.width <= vp.width + 1 &&
      r.y + r.height <= vp.height + 1,
    "control outside viewport",
  )
}
for (const [width, height] of process.env.QA_LANDSCAPE
  ? [[844, 390]]
  : process.env.QA_SHORT
    ? [[320, 568]]
    : process.env.QA_FAST
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
    assets = []
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("response", (r) => {
    if (r.url().includes("/assets/") && r.status() >= 400)
      assets.push({ url: r.url(), status: r.status() })
  })
  await page.goto("http://127.0.0.1:4186/tcg", {
    waitUntil: "domcontentloaded",
  })
  const gift = page.getByRole("button", {
    name: "Nhận bộ bẫy 4.5",
    exact: true,
  })
  await gift.waitFor()
  await fit(page, gift)
  const beforeGift = await state(page)
  await gift.click()
  const afterGift = await state(page)
  assert.equal(afterGift.coins, beforeGift.coins)
  assert.deepEqual(afterGift.decks, beforeGift.decks)
  assert(afterGift.traps450.giftClaimed)
  await page.screenshot({ path: `/tmp/web450-gift-${width}.png` })
  await page.evaluate(async () => {
    const { startBattle } = await import("/src/game/battle.ts")
    const { STARTER_DECK } = await import("/src/game/catalog.ts")
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    const { newGame } = await import("/src/game/progression.ts")
    const { TRAP_PACK } = await import("/src/game/trapCards.ts")
    const b = startBattle(STARTER_DECK, null, "courage", () => 0.41, false, 450)
    const u = (uid, cardId, attack) => ({
      uid,
      cardId,
      attack,
      health: 10,
      maxHealth: 10,
      shield: 0,
      ready: true,
      keywords: [],
    })
    b.round = 2
    b.turnSerial = 3
    b.turnSide = "player"
    b.enemy.trap = { uid: "t1", cardId: "trap-lid", setTurn: 2 }
    b.nextUid = 2
    b.player.mana = b.player.maxMana = 7
    b.player.board = [
      u("one", "banh-mi", 1),
      u("two", "pho-bo", 1),
      u("three", "com-tam", 1),
    ]
    b.player.hand = [
      "trap-mirror",
      "v45-uncover",
      "v45-taste",
      "trap-root",
      "trap-pantry",
      "trap-recall",
      "trap-embers",
      "trap-ward",
    ]
    b.player.deck = Array(10).fill("last-flame")
    b.enemy.board = [u("weak", "banh-mi", 1), u("strong", "pho-bo", 6)]
    b.enemy.hand = []
    b.enemy.deck = Array(10).fill("last-flame")
    b.enemy.maxMana = 0
    b.enemy.mana = 0
    const s = newGame()
    s.coins = 731
    s.xp = 517
    s.traps450 = { giftClaimed: true }
    for (const c of TRAP_PACK) s.cards[c.id] = 2
    s.battle = b
    if (!useGameStore.getState().importSave(s))
      throw Error("fixture import refused")
    useGameStore.setState({ notice: null })
  })
  await page.locator(".tcg-450-battle").waitFor()
  assert.equal(await page.locator(".tcg-trap-slot").count(), 2)
  assert.equal(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth > innerWidth + 1 ||
        document.documentElement.scrollHeight > innerHeight + 1,
    ),
    false,
  )
  const enemy = page.locator('.tcg-trap-slot[data-side="enemy"]')
  assert((await enemy.innerHTML()).includes("trap-back-v450.webp"))
  assert(!(await enemy.innerHTML()).includes("Nắp Nồi"))
  await page
    .locator(".tcg-hand")
    .getByRole("button", { name: /Gương Nước Phản Hương/ })
    .click()
  await fit(page, page.getByRole("button", { name: /^Úp bẫy/ }))
  await page.screenshot({ path: `/tmp/web450-selected-${width}.png` })
  await page.getByRole("button", { name: /^Úp bẫy/ }).click()
  await page
    .getByRole("button", { name: "Kết thúc lượt →", exact: true })
    .waitFor()
  assert.equal((await state(page)).battle.player.mana, 4)
  assert.equal(
    await page
      .locator('.tcg-trap-slot[data-side="player"]')
      .getAttribute("data-state"),
    "preparing",
  )
  await page
    .getByRole("button", { name: "Kết thúc lượt →", exact: true })
    .click()
  await page.locator(".tcg-trap-decision").waitFor({ timeout: 20000 })
  await page.screenshot({ path: `/tmp/web450-response-${width}.png` })
  console.log(
    "modal",
    width,
    await page
      .locator(".tcg-trap-decision")
      .evaluate((el) => ({
        client: el.clientHeight,
        scroll: el.scrollHeight,
        rect: el.getBoundingClientRect().toJSON(),
      })),
  )
  await fit(
    page,
    page.getByRole("button", { name: "◇ Kích hoạt bẫy", exact: true }),
  )
  await fit(page, page.getByRole("button", { name: "Giữ bẫy", exact: true }))
  assert.equal(
    await page
      .locator(".tcg-trap-decision")
      .evaluate((el) => el.scrollHeight > el.clientHeight + 1),
    false,
  )
  await page.screenshot({ path: `/tmp/web450-response-${width}.png` })
  const pending = (await state(page)).battle.pendingReaction.id
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.locator(".tcg-trap-decision").waitFor()
  assert.equal((await state(page)).battle.pendingReaction.id, pending)
  await page.getByRole("button", { name: "Giữ bẫy", exact: true }).click()
  await page.waitForFunction(async () => {
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    return (
      useGameStore.getState().save.battle.pendingReaction?.intent.source ===
      "strong"
    )
  })
  await page.locator(".tcg-trap-decision").waitFor({ timeout: 20000 })
  assert.equal((await state(page)).battle.player.health, 33)
  await page
    .getByRole("button", { name: "◇ Kích hoạt bẫy", exact: true })
    .click()
  await page.locator(".tcg-trap-reveal").waitFor({ timeout: 20000 })
  await page.screenshot({ path: `/tmp/web450-reveal-${width}.png` })
  await page
    .getByRole("button", { name: "Kết thúc lượt →", exact: true })
    .waitFor({ timeout: 20000 })
  const saved = await state(page)
  assert.equal(saved.battle.player.health, 33)
  assert.equal(saved.battle.round, 3)
  assert.equal(saved.battle.player.trap, null)
  assert.equal(saved.coins, 731)
  assert.equal(saved.xp, 517)
  assert.equal(
    saved.battle.player.graveyard.filter((id) => id === "trap-mirror").length,
    1,
  )
  await fit(
    page,
    page.getByRole("button", { name: "Kết thúc lượt →", exact: true }),
  )
  assert.equal(
    await page
      .locator(".tcg-arena")
      .evaluate((el) => el.scrollHeight > el.clientHeight + 1),
    false,
  )
  await page.screenshot({ path: `/tmp/web450-board-${width}.png` })
  if (width === 390) {
    const snapshot = await page.evaluate(() =>
      localStorage.getItem("foodchest.tcg.v1"),
    )
    await page.evaluate(async () => {
      const { useModeIntroStore } = await import("/src/game/modeIntroState.ts")
      useModeIntroStore.getState().open("tcg")
    })
    await page
      .getByRole("button", { name: "Ẩn chú thích", exact: true })
      .click()
    await page.waitForTimeout(17000)
    await page.screenshot({ path: "/tmp/web450-intro.png" })
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
    const decoded = await page.evaluate(async () => {
      const { TRAP_PACK, TRAP_BACK } = await import("/src/game/trapCards.ts")
      const rows = []
      for (const src of [...TRAP_PACK.map((c) => c.art), TRAP_BACK]) {
        const i = new Image()
        i.src = src
        await i.decode()
        rows.push({ src, width: i.naturalWidth, height: i.naturalHeight })
      }
      return rows
    })
    assert.equal(decoded.length, 11)
    assert(decoded.every((r) => r.width === 900 && r.height === 1200))
    checks.push({ decoded })
    await page.evaluate(async () => {
      const { useAppStore } = await import("/src/store/useAppStore.ts")
      useAppStore.getState().updatePreference("reducedMotion", true)
      useAppStore.getState().updatePreference("graphicsQuality", "low")
    })
    await page.waitForFunction(() =>
      document.body.classList.contains("presentation-light"),
    )
    assert.equal(
      await page.evaluate(() => localStorage.getItem("foodchest.tcg.v1")),
      snapshot,
    )
  }
  if (width === 320 || width === 844) {
    const variants = await page.evaluate(async () => {
      const { startBattle, actBattle } = await import("/src/game/battle.ts")
      const { CARDS, STARTER_DECK } = await import("/src/game/catalog.ts")
      const { TRAP_CARDS } = await import("/src/game/trapCards.ts")
      const rows = []
      for (const trap of TRAP_CARDS) {
        const b = startBattle(
          STARTER_DECK,
          null,
          "courage",
          () => 0.41,
          false,
          450,
        )
        b.round = 2
        b.turnSerial = 3
        b.turnSide = "player"
        b.player.trap = { uid: "t1", cardId: trap.id, setTurn: 1 }
        b.nextUid = 2
        b.player.hand = []
        b.player.deck = Array(10).fill("last-flame")
        b.player.board = []
        b.enemy.hand = []
        b.enemy.deck = []
        b.enemy.board = []
        b.enemy.maxMana = 6
        const piece = (uid, attack, health, guard = false) => ({
          uid,
          cardId: "banh-mi",
          attack,
          health,
          maxHealth: health,
          shield: 0,
          ready: true,
          keywords: guard ? ["guard"] : [],
        })
        if (trap.trap.trigger === "attack" || trap.trap.trigger === "fallen")
          b.enemy.board = [piece("foe", 6, 10)]
        if (trap.id === "trap-ward")
          b.player.board = [piece("guard", 1, 8, true)]
        if (trap.id === "trap-recall")
          b.player.board = [piece("guard", 1, 1, true)]
        if (trap.trap.trigger === "spell") b.enemy.hand = ["tidal-cut"]
        if (trap.trap.trigger === "summon")
          b.enemy.hand = [
            CARDS.find(
              (c) =>
                c.kind === "unit" &&
                c.cost >= 4 &&
                c.cost <= 5 &&
                !c.effect &&
                !c.ability,
            ).id,
          ]
        const out = actBattle(b, { type: "end" })
        if (out.error || !out.battle.pendingReaction)
          throw Error(`Missing variant ${trap.id}`)
        rows.push({ id: trap.id, battle: out.battle })
      }
      return rows
    })
    const modalChecks = []
    for (const variant of variants) {
      await page.evaluate(async (battle) => {
        const { useGameStore } = await import("/src/game/useGameStore.ts")
        const { newGame } = await import("/src/game/progression.ts")
        const s = newGame()
        s.traps450 = { giftClaimed: true }
        s.battle = battle
        if (!useGameStore.getState().importSave(s))
          throw Error("Variant import refused")
        useGameStore.setState({ notice: null })
      }, variant.battle)
      await page.locator(".tcg-trap-decision").waitFor()
      await fit(
        page,
        page.getByRole("button", { name: "◇ Kích hoạt bẫy", exact: true }),
      )
      await fit(
        page,
        page.getByRole("button", { name: "Giữ bẫy", exact: true }),
      )
      assert.equal(
        await page
          .locator(".tcg-trap-decision")
          .evaluate((el) => el.scrollHeight > el.clientHeight + 1),
        false,
        `Overflow ${variant.id}`,
      )
      if (variant.battle.pendingReaction.intent.trigger === "attack")
        assert.equal(await page.getByLabel("6 sức tấn công").count(), 1)
      modalChecks.push({ id: variant.id, fit: true })
    }
    checks.push({ width, height, reactionVariants: modalChecks })
  }
  assert.deepEqual(errors, [])
  assert.deepEqual(assets, [])
  checks.push({
    width,
    height,
    fit: true,
    hiddenTrapIdentity: true,
    setTrap: true,
    holdThenActivate: true,
    reloadPending: true,
    oneUse: true,
    economyPreserved: true,
    errors,
    missingAssets: assets,
  })
  await context.close()
}
console.log(JSON.stringify(checks, null, 2))
writeFileSync("/tmp/web450-results.json", JSON.stringify(checks, null, 2))
await browser.close()
server.kill()
