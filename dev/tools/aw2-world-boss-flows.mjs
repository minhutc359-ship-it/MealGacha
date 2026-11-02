import { writeFile } from "node:fs/promises"

export async function verifyWorldBoss({
  page,
  browser,
  walk,
  interact,
  travel,
  check,
  key,
  out,
  errors,
}) {
  const raw = () => page.evaluate((key) => localStorage.getItem(key), key)
  const progress = async () => JSON.parse(await raw()).progress
  const installWriteFailure = (target) =>
    target.evaluate(() => {
      const original = Storage.prototype.setItem
      window.aw2BlockWrites = false
      Storage.prototype.setItem = function (key, value) {
        if (key === "aw2.development.save" && window.aw2BlockWrites)
          throw new DOMException("QA write denied", "QuotaExceededError")
        return original.call(this, key, value)
      }
    })
  const pausedBattle = async (target) => {
    await target.getByTestId("world-battle").waitFor()
    await target.getByRole("button", { name: "Tạm dừng", exact: true }).click()
    await target
      .getByTestId("battle-atlas-state")
      .filter({ hasText: "Năm atlas chiến đấu đã tải" })
      .waitFor()
    await target.waitForFunction(
      () =>
        document.querySelector('[data-testid="world-battle"] canvas')?.dataset
          .status === "active",
    )
  }
  const step = async (target) => {
    const canvas = target.getByTestId("world-battle").locator("canvas")
    const before = Number(await canvas.getAttribute("data-tick"))
    await target
      .getByRole("button", { name: "Bước 1 nhịp", exact: true })
      .click()
    await target.waitForFunction(
      (tick) =>
        Number(
          document.querySelector('[data-testid="world-battle"] canvas').dataset
            .tick,
        ) ===
        tick + 1,
      before,
    )
  }
  const win = async (target) => {
    const canvas = target.getByTestId("world-battle").locator("canvas")
    for (let turn = 0; turn < 180; turn++) {
      if ((await canvas.getAttribute("data-status")) !== "active") break
      if (Number(await canvas.getAttribute("data-tick")) >= 5) {
        for (const spirit of ["than", "lua", "lam", "moc-non", "suong"]) {
          const ultimate = target.getByTestId(`world-ultimate-aw2-${spirit}`)
          if (await ultimate.isEnabled()) await ultimate.click()
        }
      }
      await step(target)
    }
    const status = await canvas.getAttribute("data-status")
    if (status !== "player-win") {
      await target.screenshot({
        path: `${out}/failed-battle.png`,
        fullPage: true,
      })
      await writeFile(
        `${out}/failed-battle.txt`,
        await target.getByTestId("world-battle").innerText(),
      )
    }
    check(
      `Integrated controller reaches a real player-win (${await canvas.getAttribute("data-tick")})`,
      status === "player-win",
    )
  }

  await interact("Nhận nhiệm vụ")
  await travel(616, "Phòng Kho")
  await travel(616, "Phòng Lửa")
  await travel(616, "Phòng Bàn")
  await walk(320, 128)
  const beforeStart = await raw()
  await installWriteFailure(page)
  await page.evaluate(() => {
    window.aw2BlockWrites = true
  })
  await page.keyboard.press("e")
  await page
    .getByRole("button", { name: "Bắt đầu thử thách", exact: true })
    .click()
  await page.getByRole("dialog").getByRole("alert").waitFor()
  check(
    "Failed checkpoint starts no battle and preserves bytes",
    (await page.getByTestId("world-battle").count()) === 0 &&
      (await raw()) === beforeStart,
  )
  await page.evaluate(() => {
    window.aw2BlockWrites = false
  })
  await page
    .getByRole("button", { name: "Bắt đầu thử thách", exact: true })
    .click()
  await pausedBattle(page)
  const checkpoint = await raw()
  check(
    "Entry persists a safe checkpoint before combat",
    (await progress()).x === 96 && !(await progress()).bossDefeated,
  )
  check(
    "World movement and travel are unavailable during battle",
    (await page.getByTestId("player-position").count()) === 0 &&
      (await page
        .getByRole("button", { name: "Lưu vị trí", exact: true })
        .count()) === 0,
  )
  await page.reload()
  await page.locator("canvas").waitFor()
  check(
    "Reload abandons unfinished battle without granting victory",
    (await page.getByTestId("world-battle").count()) === 0 &&
      (await raw()) === checkpoint &&
      !(await progress()).bossDefeated,
  )

  await walk(320, 128)
  await interact("Bắt đầu thử thách")
  await pausedBattle(page)
  await page
    .getByRole("button", { name: "Rút lui về Sân", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Lưu kết quả và trở về", exact: true })
    .click()
  await page
    .getByTestId("zone-name")
    .filter({ hasText: "Sân Bếp Bỏ Quên" })
    .waitFor()
  check(
    "Retreat returns to yard with objectives intact and no win",
    !(await progress()).bossDefeated && (await progress()).puzzleStep === 3,
  )

  await travel(616, "Phòng Kho")
  await travel(616, "Phòng Lửa")
  await travel(616, "Phòng Bàn")
  await walk(320, 128)
  await interact("Bắt đầu thử thách")
  await pausedBattle(page)
  const activeRaw = await raw()
  await writeFile(`${out}/ready-save.json`, activeRaw)
  const pausedTick = await page.locator("canvas").getAttribute("data-tick")
  await page.waitForTimeout(850)
  check(
    "World encounter pause freezes rules",
    (await page.locator("canvas").getAttribute("data-tick")) === pausedTick,
  )
  await page.screenshot({ path: `${out}/boss-desktop.png`, fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  check(
    "Integrated battle mobile viewport has no horizontal overflow",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  )
  await page.screenshot({ path: `${out}/boss-mobile.png`, fullPage: true })
  await page.setViewportSize({ width: 1280, height: 1000 })
  await win(page)
  check(
    "Terminal view alone cannot persist victory",
    (await raw()) === activeRaw && !(await progress()).bossDefeated,
  )
  await installWriteFailure(page)
  await page.evaluate(() => {
    window.aw2BlockWrites = true
  })
  await page
    .getByRole("button", { name: "Lưu kết quả và trở về", exact: true })
    .click()
  await page.getByRole("alert").waitFor()
  check(
    "Failed result write retains authentic terminal for retry",
    (await raw()) === activeRaw &&
      (await page.getByTestId("world-battle").count()) === 1,
  )
  await page.evaluate(() => {
    window.aw2BlockWrites = false
  })
  await page
    .getByRole("button", { name: "Lưu kết quả và trở về", exact: true })
    .click()
  await page.getByTestId("zone-name").waitFor()
  check(
    "Successful retry commits boss victory once",
    (await progress()).bossDefeated &&
      (await progress()).questIndex === 3 &&
      !(await progress()).tableNoteRead,
  )
  await page.reload()
  await page.locator("canvas").waitFor()
  check(
    "Boss victory survives reload before note and hand-in",
    (await page.getByTestId("boss-objectives").innerText()).includes(
      "Đã thắng",
    ),
  )
  await walk(448, 144)
  await interact("Đọc ghi chép")
  const noteRaw = await raw()
  await page.reload()
  await page.locator("canvas").waitFor()
  check("Explicit note-read survives reload", (await progress()).tableNoteRead)
  for (const zone of [
    "Phòng Lửa",
    "Phòng Kho",
    "Sân Bếp Bỏ Quên",
    "Phố Đèn Lồng",
    "Làng Giao Ước",
  ])
    await travel(24, zone)
  await walk(160, 240)
  await interact()
  const beforeChoice = await raw()
  await page.keyboard.press("Escape")
  check(
    "Closing ending dialogue does not select a choice or receipt",
    (await raw()) === beforeChoice && (await progress()).questIndex === 3,
  )
  await interact("Để ghế trống chờ")
  const completed = await raw()
  check(
    "Approved wait ending completes final quest and receipt",
    (await progress()).questIndex === 4 &&
      (await progress()).endingChoice === "wait",
  )
  await page.reload()
  await page.locator("canvas").waitFor()
  await interact()
  check(
    "Completed dialogue cannot issue another grant",
    (await page.getByRole("dialog").getByRole("button").count()) === 1 &&
      (await raw()) === completed,
  )
  await page.keyboard.press("Escape")
  await page.screenshot({ path: `${out}/ending.png`, fullPage: true })
  await travel(616, "Phố Đèn Lồng")
  await travel(616, "Sân Bếp Bỏ Quên")
  await walk(520, 240)
  await interact("Đi qua")
  await page.getByTestId("zone-name").filter({ hasText: "Phòng Bàn" }).waitFor()
  await walk(520, 240)
  await interact("Đi qua")
  await page
    .getByTestId("zone-name")
    .filter({ hasText: "Sân Bếp Bỏ Quên" })
    .waitFor()
  check(
    "Completed shortcut works in both directions",
    (await progress()).questIndex === 4,
  )

  const isolated = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
  })
  const extra = await isolated.newPage()
  extra.on("pageerror", (error) => errors.push(error.message))
  await extra.goto(page.url())
  const share = JSON.parse(noteRaw)
  Object.assign(share.progress, {
    zoneId: "aw2-zone-covenant-village",
    x: 160,
    y: 240,
  })
  await extra.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [key, JSON.stringify(share)],
  )
  await extra.reload()
  await extra.locator("canvas").waitFor()
  await extra.keyboard.press("e")
  await extra
    .getByRole("button", { name: "Mời cả làng dùng bữa", exact: true })
    .click()
  await extra.getByRole("dialog").waitFor({ state: "hidden" })
  check(
    "Approved share ending is also completable from the saved ready objective",
    await extra.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key))
      return (
        state.progress.questIndex === 4 &&
        state.progress.endingChoice === "share"
      )
    }, key),
  )

  const competing = JSON.parse(activeRaw)
  Object.assign(competing.progress, { x: 320, y: 128 })
  await extra.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [key, JSON.stringify(competing)],
  )
  await extra.reload()
  await extra.locator("canvas").waitFor()
  await extra.keyboard.press("e")
  await extra
    .getByRole("button", { name: "Bắt đầu thử thách", exact: true })
    .click()
  await pausedBattle(extra)
  await win(extra)
  const writer = await isolated.newPage()
  writer.on("pageerror", (error) => errors.push(error.message))
  await writer.goto(page.url())
  await writer.locator("canvas").waitFor()
  await writer.getByRole("button", { name: "Lưu vị trí", exact: true }).click()
  await writer
    .getByRole("status")
    .filter({ hasText: "Đã lưu vị trí AW2." })
    .waitFor()
  const changed = await writer.evaluate((key) => localStorage.getItem(key), key)
  await extra
    .getByRole("button", { name: "Lưu kết quả và trở về", exact: true })
    .click()
  await extra.getByRole("alert").filter({ hasText: "tab khác" }).waitFor()
  check(
    "Other-tab write rejects stale terminal without overwriting it",
    (await extra.evaluate((key) => localStorage.getItem(key), key)) === changed,
  )
  await extra
    .getByRole("button", { name: "Đọc lại và rời trận", exact: true })
    .click()
  await extra.getByTestId("zone-name").waitFor()
  check(
    "Conflict reread discards stale result without a win",
    await extra.evaluate(
      (key) => !JSON.parse(localStorage.getItem(key)).progress.bossDefeated,
      key,
    ),
  )
  await isolated.close()
  check(
    "Integrated final quest preserves original legacy bytes",
    await page.evaluate(
      () =>
        localStorage.getItem("foodchest.tcg.v1") === "stable original" &&
        localStorage.getItem("foodchest.user.v1") === "stable user",
    ),
  )
}
