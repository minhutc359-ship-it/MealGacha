import assert from "node:assert/strict"
const starters = ["aw2-than", "aw2-lua", "aw2-lam", "aw2-moc-non", "aw2-suong"]
const mixed = ["aw2-hai", "aw2-nhien", "aw2-moc", "aw2-lien", "aw2-van"]
const persistent = (s) => {
  const { zoneId, x, y, facing, ...progress } = s.progress
  const { revision, updatedAt, ...rest } = s
  return JSON.stringify({ ...rest, progress })
}
async function bag(page) {
  const d = page.locator("details.aw2-bag-panel")
  if (!(await d.evaluate((d) => d.open)))
    await d.locator(":scope > summary").click()
}
async function team(page, ids, mode) {
  await bag(page)
  const same = await page
    .getByTestId("saved-team")
    .evaluate(
      (e, { ids, mode }) =>
        e.dataset.ids === JSON.stringify(ids) && e.dataset.emphasis === mode,
      { ids, mode },
    )
  if (!same) {
    for (let i = 0; i < ids.length; i++)
      await page
        .getByLabel(`Vị trí đội ${i + 1}`, { exact: true })
        .selectOption(ids[i])
    await page
      .getByLabel("Nhấn Vân cho trận mới", { exact: true })
      .selectOption(mode)
    await page
      .getByRole("button", { name: "Lưu đội hình", exact: true })
      .click()
    await page.waitForFunction(
      ({ ids, mode }) => {
        const d = document.querySelector('[data-testid="saved-team"]')?.dataset
        return d && d.ids === JSON.stringify(ids) && d.emphasis === mode
      },
      { ids, mode },
    )
  }
  await page.locator("details.aw2-bag-panel > summary").click()
  // Party changes rebuild Pixi asynchronously; saved metadata alone is not canvas readiness.
  await page.waitForFunction(
    (ids) =>
      document.querySelector('[data-testid="world-map"] canvas')?.dataset
        .partyIds === JSON.stringify(ids),
    ids,
  )
  await page
    .getByTestId("world-map")
    .locator(".aw2-map-loading")
    .waitFor({ state: "hidden" })
}
export async function rematchAfterEnding({
  page,
  check,
  raw,
  save,
  go,
  interact,
  world,
  url,
  out,
  flavor,
  watch,
}) {
  const initial = await save(),
    click = (name) => page.getByRole("button", { name, exact: true }).click()
  assert.equal(initial.progress.questIndex, 4)
  assert.equal(initial.collection.recruitedIds.length, 7)
  await page.setViewportSize({ width: 1280, height: 1000 })
  if (initial.progress.zoneId !== "aw2-zone-kitchen-table") {
    await go(520, 240)
    await interact("Đi qua")
    await page
      .getByTestId("zone-name")
      .filter({ hasText: "Phòng Bàn" })
      .waitFor()
  }
  await team(page, mixed, "attack")
  const selected = await save(),
    baseline = persistent(selected)
  const entry = "Đấu lại boss · không nhận thưởng"
  const battle = page.getByTestId("world-battle"),
    canvas = battle.locator("canvas")
  const start = async () => {
    const expected = persistent(await save())
    await go(320, 128)
    await interact(entry)
    await battle.waitFor()
    await click("Tạm dừng")
    await page
      .getByTestId("battle-atlas-state")
      .filter({ hasText: "đã tải" })
      .waitFor()
    check(
      "Rematch entry preserves all nonspatial progress/party/economy/collection",
      persistent(await save()) === expected &&
        (await battle.getAttribute("data-purpose")) === "rematch",
    )
  }
  const step = async () => {
    const t = +(await canvas.getAttribute("data-tick"))
    await page
      .getByRole("button", { name: "Bước 1 nhịp", exact: true })
      .press("Enter")
    await page.waitForFunction(
      (t) =>
        +document.querySelector('[data-testid="world-battle"] canvas').dataset
          .tick ===
        t + 1,
      t,
    )
  }
  const van = async () =>
    JSON.parse(
      await page.getByTestId("world-unit-aw2-van").getAttribute("data-state"),
    )
  const finish = async (before) => {
    await click("Lưu kết quả và trở về")
    await world()
    const next = await save()
    check(
      "Rematch return keeps exact ending/rewards/party and safe Phòng Bàn",
      persistent(next) === before &&
        next.progress.zoneId === selected.progress.zoneId &&
        next.progress.x === 96 &&
        next.progress.y === 192,
    )
    check(
      "Return message explicitly says no reward and preserves ending",
      (await page
        .getByRole("status")
        .filter({ hasText: "Không nhận thưởng; kết thúc" })
        .count()) === 1,
    )
    const settled = await raw()
    await page.reload()
    await world()
    check(
      "Completed rematch reload leaves exact settled bytes intact",
      (await raw()) === settled,
    )
  }
  await go(320, 128)
  await interact()
  const beforeEntry = await raw()
  check(
    "Completed story offers explicit reward-free rematch without reopening quest",
    (await page.getByRole("dialog").textContent()).includes("Không nhận EXP") &&
      (await page
        .getByRole("button", { name: entry, exact: true })
        .isEnabled()) &&
      (await page
        .getByRole("button", { name: "Bắt đầu thử thách", exact: true })
        .count()) === 0,
  )
  await page.evaluate(() => {
    window.__demoBlock = true
  })
  await click(entry)
  await page
    .getByRole("dialog")
    .getByRole("alert")
    .filter({ hasText: "Chưa lưu được AW2" })
    .waitFor()
  check(
    "Failed rematch checkpoint leaves original bytes and no live encounter",
    (await raw()) === beforeEntry && (await battle.count()) === 0,
  )
  await page.evaluate(() => {
    window.__demoBlock = false
  })
  await click(entry)
  await battle.waitFor()
  await click("Tạm dừng")
  await page
    .getByTestId("battle-atlas-state")
    .filter({ hasText: "đã tải" })
    .waitFor()
  check(
    "Native rematch uses saved mixed party, real Van attack and honest no-reward copy",
    (await battle.getAttribute("data-purpose")) === "rematch" &&
      (await van()).vanEmphasis === "attack" &&
      (await battle.getByRole("note").textContent()).includes(
        "không nhận EXP",
      ) &&
      (await page.locator('[data-testid^="world-unit-aw2-"]').count()) === 5 &&
      persistent(await save()) === baseline,
  )
  await page.setViewportSize({ width: 390, height: 844 })
  check(
    "390px rematch has no horizontal overflow and accessible retreat control",
    (await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    )) &&
      (await page
        .getByRole("button", { name: "Rút lui về Phòng Bàn", exact: true })
        .isEnabled()),
  )
  await page.screenshot({
    path: `${out}/${flavor}-rematch-mobile.png`,
    fullPage: true,
  })
  const abandoned = await raw()
  await page.reload()
  await world()
  check(
    "Reload abandons active attempt without outcome, rewards or ending changes",
    (await raw()) === abandoned &&
      persistent(await save()) === baseline &&
      (await battle.count()) === 0,
  )
  await start()
  await click("Rút lui về Phòng Bàn")
  const checkpoint = await raw()
  await page.evaluate(() => {
    window.__demoBlock = true
  })
  await click("Lưu kết quả và trở về")
  await page
    .getByRole("alert")
    .filter({ hasText: "Chưa lưu được AW2" })
    .waitFor()
  check(
    "Failed retreat settlement leaves authentic result retryable and exact checkpoint",
    (await raw()) === checkpoint &&
      (await page.getByTestId("encounter-status").textContent()).includes(
        "Đã rút lui",
      ),
  )
  await page.evaluate(() => {
    window.__demoBlock = false
  })
  await finish(baseline)
  await start()
  for (
    let i = 0;
    i < 200 && (await canvas.getAttribute("data-status")) === "active";
    i++
  )
    await step()
  check(
    "Earned mixed party reaches authentic enemy-win without injected HP/outcomes",
    (await canvas.getAttribute("data-status")) === "enemy-win" &&
      persistent(await save()) === baseline,
  )
  await finish(baseline)
  await team(page, starters, "protection")
  const starterBaseline = persistent(await save())
  await start()
  for (
    let i = 0;
    i < 200 && (await canvas.getAttribute("data-status")) === "active";
    i++
  ) {
    if (+(await canvas.getAttribute("data-tick")) >= 5)
      for (const id of starters) {
        const ult = page.getByTestId(`world-ultimate-${id}`)
        if (
          (await canvas.getAttribute("data-status")) === "active" &&
          (await ult.isEnabled())
        )
          await ult.click()
      }
    if ((await canvas.getAttribute("data-status")) === "active") await step()
  }
  check(
    "Repeated rematch reaches authentic player-win while ending remains completed",
    (await canvas.getAttribute("data-status")) === "player-win" &&
      persistent(await save()) === starterBaseline,
  )
  await canvas.screenshot({ path: `${out}/${flavor}-rematch-win.png` })
  await finish(starterBaseline)
  await team(page, mixed, "attack")
  await start()
  const frozen = await van(),
    tab = await page.context().newPage()
  watch(tab)
  await tab.goto(url)
  await tab.locator("canvas[data-party-size]").waitFor()
  await team(tab, mixed, "protection")
  const newer = await raw()
  check(
    "Another tab changes only next rematch Van choice; live actor stays frozen",
    (await van()).vanEmphasis === frozen.vanEmphasis &&
      (await save()).collection.vanEmphasis === "protection",
  )
  await click("Rút lui về Phòng Bàn")
  await click("Lưu kết quả và trở về")
  await page.getByRole("alert").filter({ hasText: "tab khác" }).waitFor()
  check(
    "Stale rematch result cannot replace newer party/choice/ending/rewards",
    (await raw()) === newer,
  )
  await tab.close()
  await click("Đọc lại và rời trận")
  await world()
  const protectionBaseline = persistent(await save())
  await start()
  check(
    "Next rematch uses newly saved Van protection after reread",
    (await van()).vanEmphasis === "protection",
  )
  await click("Rút lui về Phòng Bàn")
  await finish(protectionBaseline)
  check(
    "Repeated win/loss/retreat/reload keep original earned345XP, five receipts and chosen ending",
    (await save()).economy.teamExperience === initial.economy.teamExperience &&
      JSON.stringify((await save()).economy) ===
        JSON.stringify(initial.economy) &&
      (await save()).progress.endingChoice === initial.progress.endingChoice,
  )
}
