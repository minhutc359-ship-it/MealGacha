import assert from "node:assert/strict"
const starter = ["aw2-than", "aw2-lua", "aw2-lam", "aw2-moc-non", "aw2-suong"]
const boss = "aw2-enemy-forgotten-host",
  note = "aw2-object-table-note",
  west = "aw2-zone-kitchen-table:exit:west",
  shortcut = "aw2-shortcut-table-yard"
const waypoint = (page, id) => page.getByTestId(`room-waypoint-${id}`)
const worldReady = async (page) => {
  await page.waitForFunction(() => {
    const canvas = document.querySelector('[data-testid="world-map"] canvas'),
      ids = JSON.parse(localStorage.getItem("aw2.development.save")).progress
        .partyIds
    return (
      canvas?.dataset.partyIds === JSON.stringify(ids) &&
      canvas.dataset.sceneId === "aw2-environment-kitchen-table-v1" &&
      canvas.dataset.foregroundAlpha
    )
  })
  await page
    .getByTestId("world-map")
    .locator(".aw2-map-loading")
    .waitFor({ state: "hidden" })
}
const bag = async (page) => {
  const d = page.locator("details.aw2-bag-panel")
  if (!(await d.evaluate((d) => d.open)))
    await d.locator(":scope > summary").click()
}
const choose = async (page, ids) => {
  await bag(page)
  const current = JSON.parse(
    await page.getByTestId("saved-team").getAttribute("data-ids"),
  )
  if (JSON.stringify(current) !== JSON.stringify(ids)) {
    for (let i = 0; i < 5; i++)
      await page
        .getByLabel(`Vị trí đội ${i + 1}`, { exact: true })
        .selectOption(ids[i])
    await page
      .getByRole("button", { name: "Lưu đội hình", exact: true })
      .click()
    await page.waitForFunction(
      (ids) =>
        document.querySelector('[data-testid="saved-team"]').dataset.ids ===
        JSON.stringify(ids),
      ids,
    )
  }
  await page.locator("details.aw2-bag-panel > summary").click()
  await worldReady(page)
}
const arrival = (page, x, y) =>
  page.waitForFunction(
    ({ x, y }) => {
      const m = document
        .querySelector('[data-testid="player-position"]')
        ?.textContent.match(/Vị trí (\d+), (\d+)/)
      return m && Math.abs(+m[1] - x) <= 1 && Math.abs(+m[2] - y) <= 1
    },
    { x, y },
  )
export async function roomBeforeBoss({
  page,
  check,
  raw,
  save,
  go,
  interact,
  world,
  out,
  flavor,
}) {
  await worldReady(page)
  const before = await save(),
    beforeRaw = await raw()
  assert.equal(before.progress.questIndex, 3)
  assert.equal(before.progress.bossDefeated, false)
  check(
    "Authored room loads actual floor/foreground/static boss reference after earned quest3",
    (await page.getByTestId("table-room-waypoints").isVisible()) &&
      (await waypoint(page, boss)
        .textContent()
        .then((t) => t.includes("Có thể bắt đầu thử thách"))),
  )
  check(
    "Pre-win note remains locked and completed shortcut is visibly disabled",
    (await waypoint(page, note).textContent()).includes(
      "Vượt thử thách để đọc",
    ) && (await waypoint(page, shortcut).isDisabled()),
  )
  await waypoint(page, note).focus()
  await waypoint(page, note).press("Enter")
  await arrival(page, 448, 144)
  check(
    "Keyboard waypoint walks to canonical note and restores map focus without interacting or writing",
    (await page
      .getByTestId("world-map")
      .evaluate((e) => e === document.activeElement)) &&
      (await page.getByRole("dialog").count()) === 0 &&
      (await raw()) === beforeRaw,
  )
  await interact()
  check(
    "Arriving at note cannot bypass authentic boss victory",
    (await page
      .getByRole("button", { name: "Đọc ghi chép", exact: true })
      .count()) === 0,
  )
  await page.keyboard.press("Escape")
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 })
    check(
      `${width}px authored room waypoint controls fit and meet44px targets`,
      (await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      )) &&
        (await page
          .getByTestId("table-room-waypoints")
          .getByRole("button")
          .evaluateAll(
            (bs) =>
              bs.length === 4 &&
              bs.every((b) => b.getBoundingClientRect().height >= 44),
          )),
    )
  }
  await page.setViewportSize({ width: 1280, height: 1000 })
  const teams = [
      starter,
      ["aw2-muoi", "aw2-nhien", "aw2-hai", "aw2-lien", "aw2-moc"],
      ["aw2-bach", "aw2-van", "aw2-than", "aw2-lua", "aw2-lam"],
    ],
    seen = new Set()
  for (let i = 0; i < teams.length; i++) {
    const ids = teams[i]
    await choose(page, ids)
    ids.forEach((id) => seen.add(id))
    const canvas = page.getByTestId("world-map").locator("canvas")
    check(
      `Room follower group${i + 1} loads selected original world atlases`,
      (await canvas.getAttribute("data-party-ids")) === JSON.stringify(ids),
    )
    await go(272, 320)
    await page.waitForFunction(
      () =>
        +document.querySelector('[data-testid="world-map"] canvas').dataset
          .foregroundAlpha === 0.35,
    )
    check(
      `Group${i + 1} overlapping character behind prop remains visible through faded furniture`,
      +(await canvas.getAttribute("data-foreground-alpha")) === 0.35,
    )
    await canvas.screenshot({
      path: `${out}/${flavor}-room-behind-${i + 1}.png`,
    })
    await go(320, 366)
    const depth = JSON.parse(await canvas.getAttribute("data-ground-depths"))
    check(
      `Group${i + 1} front character sorts in front of prop using actual ground depth`,
      depth.actors[0] > depth.prop,
    )
    await go(520, 320)
    await page.waitForFunction(
      () =>
        +document.querySelector('[data-testid="world-map"] canvas').dataset
          .foregroundAlpha === 1,
    )
    check(
      `Group${i + 1} foreground restores full opacity after all followers clear it`,
      +(await canvas.getAttribute("data-foreground-alpha")) === 1,
    )
  }
  check(
    "Authored room exercised all12 original follower identities",
    seen.size === 12,
  )
  await choose(page, starter)
  const after = await save()
  check(
    "Explicit team trials preserve exact earned economy, recruits and story flags",
    JSON.stringify(after.economy) === JSON.stringify(before.economy) &&
      JSON.stringify(after.collection) === JSON.stringify(before.collection) &&
      after.progress.questIndex === 3 &&
      after.progress.accepted &&
      !after.progress.bossDefeated &&
      !after.progress.tableNoteRead,
  )
  const preTravel = await raw()
  await waypoint(page, west).click()
  await arrival(page, 24, 192)
  check(
    "West waypoint walks without travelling, granting or saving",
    (await raw()) === preTravel &&
      (await save()).progress.zoneId === "aw2-zone-kitchen-table",
  )
  await interact("Đi qua")
  await page.getByTestId("zone-name").filter({ hasText: "Phòng Lửa" }).waitFor()
  await world()
  check(
    "Leaving authored room preserves the other zone debug renderer",
    (await page
      .getByTestId("world-map")
      .locator("canvas")
      .getAttribute("data-scene-id")) === "debug-terrain" &&
      (await page.getByTestId("table-room-waypoints").count()) === 0,
  )
  await go(616, 192)
  await interact("Đi qua")
  await worldReady(page)
  check(
    "Actual reciprocal west/east travel restores authored scene without rewards",
    JSON.stringify((await save()).economy) === JSON.stringify(before.economy),
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await go(240, 192)
  await page
    .getByTestId("world-map")
    .screenshot({ path: `${out}/${flavor}-room-mobile.png` })
  await page
    .getByTestId("table-room-waypoints")
    .screenshot({ path: `${out}/${flavor}-waypoints-mobile.png` })
  await page.setViewportSize({ width: 1280, height: 1000 })
  await waypoint(page, boss).click()
  await arrival(page, 320, 128)
  const atBoss = await raw()
  check(
    "Boss waypoint arrival does not auto-start fight or claim victory",
    (await page.getByTestId("world-battle").count()) === 0 &&
      !(await save()).progress.bossDefeated,
  )
  await page
    .getByTestId("world-map")
    .screenshot({ path: `${out}/${flavor}-room-desktop.png` })
  assert.equal(await raw(), atBoss)
}
export async function roomAfterVictory({ page, check }) {
  await worldReady(page)
  check(
    "Native real boss victory updates room/note status without rebuilding or fabricating quest",
    (await waypoint(page, boss).textContent()).includes("Đã vượt thử thách") &&
      (await waypoint(page, note).textContent()).includes(
        "Có thể đọc sau khi đến gần",
      ) &&
      (await waypoint(page, shortcut).isDisabled()),
  )
}
export async function roomAfterNote({ page, check }) {
  check(
    "Native note read updates authored-room waypoint from actual saved flag",
    (await waypoint(page, note).textContent()).includes("Đã đọc ghi chép"),
  )
}
export async function roomAfterEnding({
  page,
  check,
  go,
  interact,
  raw,
  save,
}) {
  const initial = await save()
  await go(520, 240)
  await interact("Đi qua")
  await worldReady(page)
  const checkpoint = await raw()
  await waypoint(page, boss).click()
  await arrival(page, 320, 128)
  check(
    "Earned ending opens shortcut and explicitly offers reward-free rematch in authored room",
    (await waypoint(page, shortcut).isEnabled()) &&
      (await waypoint(page, boss).textContent()).includes(
        "Đấu lại không nhận thưởng",
      ) &&
      (await raw()) === checkpoint,
  )
  await waypoint(page, shortcut).click()
  await arrival(page, 520, 240)
  await interact("Đi qua")
  await page.getByTestId("zone-name").filter({ hasText: "Sân Bếp" }).waitFor()
  check(
    "Native unlocked shortcut returns to Sân with exact ending/rewards",
    (await save()).progress.endingChoice === initial.progress.endingChoice &&
      JSON.stringify((await save()).economy) ===
        JSON.stringify(initial.economy),
  )
}
