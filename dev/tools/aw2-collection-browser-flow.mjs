import assert from "node:assert/strict"
const starters = ["aw2-than", "aw2-lua", "aw2-lam", "aw2-moc-non", "aw2-suong"]
async function bag(page) {
  const details = page.locator("details.aw2-bag-panel")
  if (!(await details.evaluate((d) => d.open)))
    await details.locator(":scope > summary").click()
  await page.getByTestId("collection-owned").waitFor()
}
const owned = async (page) =>
  JSON.parse(
    await page.getByTestId("collection-owned").getAttribute("data-ids"),
  )
const selected = async (page) =>
  JSON.parse(await page.getByTestId("saved-team").getAttribute("data-ids"))
async function choose(page, ids) {
  for (let i = 0; i < ids.length; i++)
    await page
      .getByLabel(`Vị trí đội ${i + 1}`, { exact: true })
      .selectOption(ids[i])
}
async function saveTeam(page, ids, mode) {
  await choose(page, ids)
  if (mode)
    await page
      .getByLabel("Nhấn Vân cho trận mới", { exact: true })
      .selectOption(mode)
  await page.getByRole("button", { name: "Lưu đội hình", exact: true }).click()
  await page.waitForFunction(
    (ids) =>
      JSON.stringify(
        JSON.parse(
          document.querySelector('[data-testid="saved-team"]').dataset.ids,
        ),
      ) === JSON.stringify(ids),
    ids,
  )
}
export async function collectionIntro({ page, check, raw, save }) {
  await bag(page)
  check(
    "Earned intro immediately renders the five-starter advisory from its own saved revision",
    JSON.parse(
      await page.getByTestId("party-readiness").getAttribute("data-ids"),
    ).join() === starters.join(),
  )
  check(
    "Intro owns exactly five starters and shows all12 collection cards",
    (await owned(page)).length === 5 &&
      (await page.locator('[data-testid^="collection-aw2-"]').count()) === 12,
  )
  check(
    "Only Muối is eligible at quest1; Van stays locked",
    (await page
      .getByRole("button", { name: "Mời Muối Đen", exact: true })
      .isEnabled()) &&
      (await page
        .getByRole("button", { name: "Mời Vân", exact: true })
        .isDisabled()),
  )
  check(
    "Locked spirits cannot be picked in saved-team controls",
    (await page
      .getByLabel("Vị trí đội 1", { exact: true })
      .locator('option[value="aw2-van"]')
      .count()) === 0,
  )
  const before = await raw(),
    economy = (await save()).economy
  await page.evaluate(() => {
    window.__demoBlock = true
  })
  await page.getByRole("button", { name: "Mời Muối Đen", exact: true }).click()
  await page
    .getByRole("alert")
    .filter({ hasText: "Chưa lưu được AW2" })
    .waitFor()
  check(
    "Failed recruit write leaves exact bytes and ownership intact",
    (await raw()) === before && (await owned(page)).length === 5,
  )
  await page.evaluate(() => {
    window.__demoBlock = false
  })
  await page.getByRole("button", { name: "Mời Muối Đen", exact: true }).click()
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="collection-aw2-muoi"]').dataset
        .owned === "true",
  )
  check(
    "Retry recruits once without spending items/XP or changing active party",
    JSON.stringify((await save()).economy) === JSON.stringify(economy) &&
      JSON.stringify(await selected(page)) === JSON.stringify(starters) &&
      (await owned(page)).length === 6,
  )
  check(
    "Owned recruit cannot be claimed a second time",
    (await page
      .getByRole("button", { name: "Mời Muối Đen", exact: true })
      .count()) === 0,
  )
}
export async function collectionBeforeBoss({
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
  await bag(page)
  const beforeEconomy = (await save()).economy
  for (const [name, id] of [
    ["Nhiên", "aw2-nhien"],
    ["Hải", "aw2-hai"],
    ["Liên", "aw2-lien"],
    ["Mộc", "aw2-moc"],
    ["Bách", "aw2-bach"],
    ["Vân", "aw2-van"],
  ]) {
    await page.getByRole("button", { name: `Mời ${name}`, exact: true }).click()
    await page.waitForFunction(
      (id) =>
        document.querySelector(`[data-testid="collection-${id}"]`).dataset
          .owned === "true",
      id,
    )
  }
  check(
    "Real quest3 progression permits all seven explicit recruits and12 owned",
    (await owned(page)).length === 12 &&
      (await save()).collection.recruitedIds.length === 7,
  )
  check(
    "Recruiting all seven grants no extra ingredients/XP/quest receipts",
    JSON.stringify((await save()).economy) === JSON.stringify(beforeEconomy),
  )
  const ids = ["aw2-hai", "aw2-nhien", "aw2-moc", "aw2-lien", "aw2-van"],
    before = await raw()
  await choose(page, ids)
  await page
    .getByLabel("Nhấn Vân cho trận mới", { exact: true })
    .selectOption("attack")
  check(
    "Pending party/Van emphasis leaves saved party and storage untouched",
    (await raw()) === before &&
      JSON.stringify(await selected(page)) === JSON.stringify(starters) &&
      (await save()).collection.vanEmphasis === "protection",
  )
  await page.getByRole("button", { name: "Hủy chọn đội", exact: true }).click()
  check(
    "Cancel restores saved slot choices without writes",
    (await raw()) === before &&
      (await page.getByLabel("Vị trí đội 1", { exact: true }).inputValue()) ===
        "aw2-than",
  )
  await choose(page, ids)
  await page
    .getByLabel("Nhấn Vân cho trận mới", { exact: true })
    .selectOption("attack")
  await page.evaluate(() => {
    window.__demoBlock = true
  })
  await page.getByRole("button", { name: "Lưu đội hình", exact: true }).click()
  await page
    .getByRole("alert")
    .filter({ hasText: "Chưa lưu được AW2" })
    .waitFor()
  check(
    "Failed team write retains saved party/choice and retryable draft",
    (await raw()) === before &&
      (await page.getByLabel("Vị trí đội 1", { exact: true }).inputValue()) ===
        "aw2-hai" &&
      (await save()).collection.vanEmphasis === "protection",
  )
  await page.evaluate(() => {
    window.__demoBlock = false
  })
  await page.getByRole("button", { name: "Lưu đội hình", exact: true }).click()
  await page.waitForFunction(
    () =>
      JSON.parse(
        document.querySelector('[data-testid="saved-team"]').dataset.ids,
      )[0] === "aw2-hai",
  )
  check(
    "Explicit save persists five selected unique recruits and attack emphasis",
    JSON.stringify(await selected(page)) === JSON.stringify(ids) &&
      (await save()).collection.vanEmphasis === "attack",
  )
  const saved = await raw()
  await page.reload()
  await world()
  await bag(page)
  check(
    "Reload preserves exact team/collection bytes and saved selection",
    (await raw()) === saved &&
      JSON.stringify(await selected(page)) === JSON.stringify(ids),
  )
  await page.waitForFunction(
    (ids) =>
      JSON.stringify(
        JSON.parse(
          document.querySelector("canvas[data-party-ids]").dataset.partyIds,
        ),
      ) === JSON.stringify(ids.slice(0, 1)),
    ids,
  )
  check("World uses only the first saved nonstarter as representative")
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 950 })
    check(
      `Collection ${width}px controls have no horizontal overflow`,
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    )
    if (width === 390)
      await page.screenshot({
        path: `${out}/${flavor}-collection-mobile.png`,
        fullPage: true,
      })
  }
  await page.setViewportSize({ width: 1280, height: 1000 })
  await page
    .getByLabel("Vị trí đội 1", { exact: true })
    .selectOption("aw2-nhien")
  const swap = [...ids]
  ;[swap[0], swap[1]] = [swap[1], swap[0]]
  check(
    "Selecting an already chosen member swaps draft positions without duplicate/save",
    (await page.getByLabel("Vị trí đội 2", { exact: true }).inputValue()) ===
      "aw2-hai" && (await raw()) === saved,
  )
  await page.getByRole("button", { name: "Hủy chọn đội", exact: true }).click()
  await go(320, 128)
  await interact("Bắt đầu thử thách")
  await page.getByTestId("world-battle").waitFor()
  await page
    .getByRole("button", { name: "Tạm dừng", exact: true })
    .press("Enter")
  await page
    .getByTestId("battle-atlas-state")
    .filter({ hasText: "đã tải" })
    .waitFor()
  const state = async () =>
    JSON.parse(
      await page.getByTestId("world-unit-aw2-van").getAttribute("data-state"),
    )
  check(
    "Authentic world encounter uses saved nonstarter party and frozen Van choice",
    (await page.locator('[data-testid^="world-unit-aw2-"]').count()) === 5 &&
      (await state()).vanEmphasis === "attack",
  )
  check(
    "Shared earned XP projects real recruited stats",
    (await state()).maxHp === Math.round(155 * 1.055),
  )
  const canvas = page.getByTestId("world-battle").locator("canvas"),
    step = async () => {
      const t = +(await canvas.getAttribute("data-tick"))
      await page
        .getByRole("button", { name: "Bước 1 nhịp", exact: true })
        .press("Enter")
      await page.waitForFunction(
        (t) =>
          +document.querySelector('[data-testid="world-battle"] canvas').dataset
            .tick > t,
        t,
      )
    }
  for (let i = 0; i < 25; i++) {
    const van = await state()
    if (
      !van.cast &&
      Math.abs(
        van.position -
          +(await page
            .getByTestId("world-battle")
            .getAttribute("data-boss-position")),
      ) <= van.range
    )
      break
    await step()
  }
  // A legal targeted request is confirmed by core energy consumption.
  for (let i = 0; i < 12 && (await state()).energy === 100; i++) {
    if (await page.getByTestId("world-ultimate-aw2-van").isEnabled())
      await page.getByTestId("world-ultimate-aw2-van").click()
    if ((await state()).energy === 100) await step()
  }
  check(
    "Native Van attack ultimate is routed to the real boss target",
    (await state()).energy < 100,
  )
  await step()
  await step()
  await canvas.screenshot({ path: `${out}/${flavor}-recruited-battle.png` })
  const checkpoint = await raw(),
    tab = await page.context().newPage()
  watch(tab)
  await tab.goto(url)
  await tab.locator("canvas[data-party-size]").waitFor()
  await bag(tab)
  await tab
    .getByLabel("Nhấn Vân cho trận mới", { exact: true })
    .selectOption("protection")
  await tab.getByRole("button", { name: "Lưu đội hình", exact: true }).click()
  await tab.waitForFunction(
    () =>
      document.querySelector('[data-testid="saved-team"]').dataset.emphasis ===
      "protection",
  )
  check(
    "Other-tab save changes only the next battle choice; active Van stays attack",
    (await state()).vanEmphasis === "attack" &&
      (await save()).collection.vanEmphasis === "protection" &&
      (await raw()) !== checkpoint,
  )
  const changed = await raw()
  await page
    .getByRole("button", { name: "Rút lui về Sân", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Lưu kết quả và trở về", exact: true })
    .click()
  await page.getByRole("alert").filter({ hasText: "tab khác" }).waitFor()
  check(
    "Stale encounter settlement cannot overwrite the newer team or imply victory",
    (await raw()) === changed && !(await save()).progress.bossDefeated,
  )
  await tab.close()
  await page
    .getByRole("button", { name: "Đọc lại và rời trận", exact: true })
    .click()
  await world()
  await bag(page)
  check(
    "Reread abandons the old attempt and restores authoritative party/choice",
    (await save()).collection.vanEmphasis === "protection" &&
      JSON.stringify(await selected(page)) === JSON.stringify(ids),
  )
  await saveTeam(page, starters, "protection")
  await world()
  await go(320, 128)
  check(
    "Starter team remains selectable and no recruit is lost when returning to it",
    (await save()).collection.recruitedIds.length === 7 &&
      JSON.stringify((await save()).progress.partyIds) ===
        JSON.stringify(starters),
  )
  assert.equal((await save()).progress.bossDefeated, false)
}
