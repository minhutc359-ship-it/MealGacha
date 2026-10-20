import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { verifyWorldBoss } from "./aw2-world-boss-flows.mjs"
const { values } = parseArgs({
  options: {
    url: {
      type: "string",
      default: "http://127.0.0.1:8452/dev/aw2/world.html",
    },
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
    boss: { type: "boolean", default: false },
  },
})
const { chromium } = await import(values.playwright)
const browser = await chromium.launch({
  executablePath: values.chromium,
  headless: true,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
})
const out = values.boss ? ".asset-work/aw2-007c" : ".asset-work/aw2-006a"
await mkdir(out, { recursive: true })
const checks = [],
  errors = []
const check = (name, value = true) => {
  assert.ok(value, name)
  checks.push(name)
  console.log(name)
}
const key = "aw2.development.save"
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
  })
  const page = await context.newPage()
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  await page.goto(values.url)
  await page
    .getByRole("button", { name: "Tạo bản lưu AW2", exact: true })
    .waitFor()
  await page.evaluate(() => {
    localStorage.setItem("foodchest.tcg.v1", "stable original")
    localStorage.setItem("foodchest.user.v1", "stable user")
  })
  check(
    "Opening world does not auto-create save",
    (await page.evaluate((key) => localStorage.getItem(key), key)) === null,
  )
  await page
    .getByRole("button", { name: "Tạo bản lưu AW2", exact: true })
    .click()
  await page.locator("canvas").waitFor()
  check(
    "Standalone Pixi world renders",
    (await page.getByTestId("zone-name").innerText()) === "Làng Giao Ước",
  )
  const position = async () =>
    (await page.getByTestId("player-position").innerText())
      .match(/Vị trí (\d+), (\d+)/)
      .slice(1)
      .map(Number)
  async function walk(x, y) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const [px, py] = await position()
      if (Math.abs(px - x) < 16 && Math.abs(py - y) < 16) return
      const horizontal = Math.abs(px - x) >= 16
      const delta = horizontal ? x - px : y - py
      const held = horizontal
        ? delta > 0
          ? "ArrowRight"
          : "ArrowLeft"
        : delta > 0
          ? "ArrowDown"
          : "ArrowUp"
      await page.keyboard.down(held)
      await page.waitForTimeout(
        Math.min(250, Math.max(60, (Math.abs(delta) / 140) * 1000 - 65)),
      )
      await page.keyboard.up(held)
    }
    throw Error(`Could not walk to ${x},${y}: ${await position()}`)
  }
  async function interact(button) {
    await page.keyboard.press("e")
    await page.getByRole("dialog").waitFor()
    if (button) {
      await page.getByRole("button", { name: button, exact: true }).click()
      await page.getByRole("dialog").waitFor({ state: "hidden" })
    }
  }
  async function travel(x, name) {
    await walk(x, 192)
    await interact("Đi qua")
    await page.getByTestId("zone-name").filter({ hasText: name }).waitFor()
  }
  await walk(160, 240)
  await interact()
  const stopped = await position()
  await page.keyboard.down("ArrowRight")
  await page.waitForTimeout(200)
  await page.keyboard.up("ArrowRight")
  check(
    "Dialog pauses movement",
    JSON.stringify(await position()) === JSON.stringify(stopped),
  )
  await page.keyboard.press("Escape")
  check(
    "Closing dialog does not accept quest",
    !(await page.getByTestId("quest-status").innerText()).includes("Đang nhận"),
  )
  await interact("Nhận nhiệm vụ")
  await walk(160, 144)
  await interact("Đọc mảnh khăn")
  await walk(160, 240)
  await interact("Hoàn tất nhập môn")
  check(
    "Intro unlocks exactly five approved starters",
    (await page.getByTestId("party").innerText()).includes(
      "Đội (5/5): Than, Lửa Nhỏ, Lam Lam, Mộc Non, Sương Lành",
    ),
  )
  await page.reload()
  await page.locator("canvas").waitFor()
  check(
    "Quest and party survive reload",
    (await page.getByTestId("party").innerText()).includes("Đội (5/5)"),
  )
  const beforePointer = await position()
  await page.getByRole("button", { name: "→ Phải", exact: true }).hover()
  await page.mouse.down()
  await page.waitForTimeout(180)
  await page.mouse.up()
  const afterPointer = await position()
  await page.waitForTimeout(150)
  check(
    "On-screen hold moves and release stops",
    afterPointer[0] > beforePointer[0] &&
      JSON.stringify(await position()) === JSON.stringify(afterPointer),
  )
  await page.keyboard.down("ArrowLeft")
  await page.waitForTimeout(100)
  await page.evaluate(() => window.dispatchEvent(new Event("blur")))
  const afterBlur = await position()
  await page.waitForTimeout(150)
  await page.keyboard.up("ArrowLeft")
  check(
    "Blur clears held movement",
    JSON.stringify(await position()) === JSON.stringify(afterBlur),
  )
  await travel(616, "Phố Đèn Lồng")
  await walk(160, 112)
  await interact("Nhận nhiệm vụ")
  for (const x of [504, 280, 392]) {
    await walk(x, 128)
    await interact("Ghi nhớ câu chuyện")
  }
  check(
    "Three memories count in a different order",
    (await page.getByTestId("quest-status").innerText()).includes("ký ức 3/3"),
  )
  await walk(160, 112)
  await interact("Người chờ")
  await page.screenshot({ path: `${out}/street.png`, fullPage: true })
  await travel(616, "Sân Bếp Bỏ Quên")
  await walk(320, 128)
  await interact("Nhận nhiệm vụ")
  await travel(616, "Phòng Kho")
  await walk(240, 128)
  await interact("Ghi lại gợi ý")
  await travel(616, "Phòng Lửa")
  await walk(432, 144)
  await interact("Nhóm lửa")
  check(
    "Wrong puzzle order safely resets attempt",
    (await page.getByTestId("quest-status").innerText()).includes("puzzle 0/3"),
  )
  for (const [x, label] of [
    [208, "Mở lối thoát"],
    [320, "Đặt nồi"],
    [432, "Nhóm lửa"],
  ]) {
    await walk(x, 144)
    await interact(label)
  }
  check(
    "Correct puzzle order opens inside route",
    (await page.getByTestId("quest-status").innerText()).includes("puzzle 3/3"),
  )
  await page.reload()
  await page.locator("canvas").waitFor()
  check(
    "Solved puzzle survives reload",
    (await page.getByTestId("quest-status").innerText()).includes("puzzle 3/3"),
  )
  await travel(616, "Phòng Bàn")
  await walk(320, 128)
  await interact()
  check(
    "Boss cannot start before accepting the final quest or fabricate a reward",
    (await page.getByRole("dialog").innerText()).includes(
      "Trở lại Dì Gác Bếp",
    ) && (await page.getByRole("dialog").getByRole("button").count()) === 1,
  )
  await page.keyboard.press("Escape")
  await travel(24, "Phòng Lửa")
  await travel(24, "Phòng Kho")
  await travel(24, "Sân Bếp Bỏ Quên")
  await walk(320, 128)
  await interact("Báo đã mở bếp")
  check(
    "Return route and third quest hand-in persist",
    (await page.getByTestId("quest-status").innerText()).includes(
      "Thêm một chén",
    ),
  )
  const raw = await page.evaluate((key) => localStorage.getItem(key), key)
  const state = JSON.parse(raw)
  check(
    "Schema v4 holds one coherent world/party snapshot",
    state.schemaVersion === 4 &&
      state.progress.questIndex === 3 &&
      state.progress.partyIds.length === 5,
  )
  if (values.boss)
    await verifyWorldBoss({
      page,
      browser,
      walk,
      interact,
      travel,
      check,
      key,
      out,
      errors,
    })
  const stable = await page.evaluate(() => [
    localStorage.getItem("foodchest.tcg.v1"),
    localStorage.getItem("foodchest.user.v1"),
  ])
  check(
    "Legacy data remains byte-identical",
    stable[0] === "stable original" && stable[1] === "stable user",
  )
  await page.setViewportSize({ width: 390, height: 844 })
  check(
    "Mobile viewport has no horizontal overflow",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  )
  await page.screenshot({ path: `${out}/mobile-world.png`, fullPage: true })
  check("No console/page errors", errors.length === 0)
  const report = {
    task: values.boss ? "AW2-007C" : "AW2-006A",
    status: "PASS",
    engine: `Chromium ${browser.version()}`,
    checks,
    errors,
    viewports: ["1280x1000", "390x844"],
  }
  await writeFile(`${out}/browser.json`, JSON.stringify(report, null, 2) + "\n")
  console.log(JSON.stringify({ status: "PASS", checks: checks.length }))
} catch (error) {
  await writeFile(
    `${out}/browser.json`,
    JSON.stringify(
      { status: "FAIL", checks, errors, failure: String(error) },
      null,
      2,
    ) + "\n",
  )
  throw error
} finally {
  await browser.close()
}
