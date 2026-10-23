import assert from "node:assert/strict"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"
const { values } = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
    compiled: { type: "boolean", default: false },
    earned: { type: "string" },
  },
})
assert.ok(
  values.earned,
  "Supply an earned demo report; verify-aw2-demo.mjs --collection records checkpointRaw",
)
const earnedText = await readFile(values.earned, "utf8"),
  earned = JSON.parse(earnedText),
  earnedRaw = earned.checkpointRaw ?? earned.observedRaw,
  completed = JSON.parse(earnedRaw)
assert.ok(["PASS", "PARTIAL"].includes(earned.status))
assert.ok(
  earned.checks.includes(
    "One fresh journey completes all four quests with exact once-only rewards",
  ),
)
assert.equal(completed.progress.questIndex, 4)
assert.equal(completed.economy.teamExperience, 345)
assert.equal(completed.collection.recruitedIds.length, 7)
const flavor = values.compiled ? "compiled" : "source",
  port = values.compiled ? 8511 : 8510,
  out = ".asset-work/aw2-007n",
  url = `http://127.0.0.1:${port}/dev/aw2/world.html`,
  key = "aw2.development.save"
assert.equal(earned.flavor, flavor)
const server = values.compiled
  ? await preview({
      configFile: "dev/vite.aw2.config.ts",
      preview: { host: "127.0.0.1", port, strictPort: true },
    })
  : await createServer({
      configFile: "dev/vite.dev.config.ts",
      server: { host: "127.0.0.1", port, strictPort: true },
    })
const { chromium } = await import(values.playwright)
const starters = ["aw2-than", "aw2-lua", "aw2-lam", "aw2-moc-non", "aw2-suong"],
  mixed = ["aw2-hai", "aw2-nhien", "aw2-moc", "aw2-lien", "aw2-van"]
const checks = [],
  errors = [],
  outcomes = [],
  legacy = {
    "foodchest.user.v1": "guidance-user-original",
    "foodchest.tcg.v1": "guidance-cards-original",
    "mealgacha.progress-journal.v4": "guidance-journal-original",
  }
let browser, page
const check = (name, ok = true) => {
  assert.ok(ok, name)
  checks.push(name)
  console.log(name)
}
const raw = () => page.evaluate((key) => localStorage.getItem(key), key),
  save = async () => JSON.parse(await raw())
const click = (name) => page.getByRole("button", { name, exact: true }).click()
const world = async () => {
  await page.locator("canvas[data-party-size]").waitFor()
  await page.waitForFunction(() => {
    const party = JSON.parse(localStorage.getItem("aw2.development.save"))
      .progress.partyIds
    return (
      document.querySelector('[data-testid="world-map"] canvas')?.dataset
        .partyIds === JSON.stringify([party[0] ?? "aw2-than"])
    )
  })
  await page
    .getByTestId("world-map")
    .locator(".aw2-map-loading")
    .waitFor({ state: "hidden" })
}
const bag = async (target = page) => {
  const d = target.locator("details.aw2-bag-panel")
  if (!(await d.evaluate((d) => d.open)))
    await d.locator(":scope > summary").click()
}
const selected = async (target = page) =>
  JSON.parse(
    await target.getByTestId("party-readiness").getAttribute("data-ids"),
  )
const choose = async (ids, target = page) => {
  for (let i = 0; i < 5; i++)
    await target
      .getByLabel(`Vị trí đội ${i + 1}`, { exact: true })
      .selectOption(ids[i])
}
const teamWait = async (ids, target = page) =>
  target.waitForFunction(
    (ids) =>
      document.querySelector('[data-testid="saved-team"]')?.dataset.ids ===
      JSON.stringify(ids),
    ids,
  )
const intact = (s) => {
  const { revision, updatedAt, ...r } = s
  const { zoneId, x, y, facing, partyIds, ...p } = s.progress
  return JSON.stringify({
    ...r,
    progress: p,
    collection: { ...s.collection, vanEmphasis: "separate-choice" },
  })
}
const go = async (x, y) => {
  await world()
  const m = page.getByTestId("world-map")
  await m.scrollIntoViewIfNeeded()
  const b = await m.boundingBox()
  await page.touchscreen.tap(
    b.x + (x / 640) * b.width,
    b.y + (y / 384) * b.height,
  )
  await page.waitForFunction(
    ({ x, y }) => {
      const m = document
        .querySelector('[data-testid="player-position"]')
        ?.textContent.match(/Vị trí (\d+), (\d+)/)
      return m && Math.abs(+m[1] - x) <= 1 && Math.abs(+m[2] - y) <= 1
    },
    { x, y },
  )
}
const interact = async (name) => {
  await page.getByTestId("world-map").focus()
  await page.keyboard.press("e")
  await page.getByRole("dialog").waitFor()
  await page
    .getByRole("dialog")
    .getByRole("button", { name, exact: true })
    .click()
  await page.getByRole("dialog").waitFor({ state: "hidden" })
}
try {
  if (!values.compiled) await server.listen()
  browser = await chromium.launch({
    executablePath: values.chromium,
    headless: true,
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    reducedMotion: "reduce",
    hasTouch: true,
  })
  await context.addInitScript(() => {
    window.__guidanceBlock = false
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (k, v) {
      if (k === "aw2.development.save" && window.__guidanceBlock)
        throw Error("QA quota")
      return set.call(this, k, v)
    }
  })
  const watch = (t) => {
    t.on("pageerror", (e) => errors.push(e.message))
    t.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text())
    })
    t.on("requestfailed", (r) =>
      errors.push(`${r.failure()?.errorText} ${r.url()}`),
    )
    t.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
    })
  }
  page = await context.newPage()
  watch(page)
  await mkdir(out, { recursive: true })
  await page.goto(url)
  check(
    "Read-only initial view grants no save or party guidance",
    (await raw()) === null &&
      (await page.getByTestId("party-readiness").count()) === 0,
  )
  await click("Tạo bản lưu AW2")
  await world()
  await bag()
  check(
    "Before intro there is no starter draft fallback or five-member advice",
    (await page
      .getByRole("button", { name: "Chọn đội khởi đầu", exact: true })
      .count()) === 0 &&
      (await page.getByTestId("party-readiness").count()) === 0,
  )
  await page.evaluate(
    ({ key, raw, legacy }) => {
      localStorage.setItem(key, raw)
      for (const [k, v] of Object.entries(legacy)) localStorage.setItem(k, v)
    },
    { key, raw: earnedRaw, legacy },
  )
  await page.reload()
  await world()
  check(
    "Recorded authentic ending restores exact bytes and earned345XP without a grant",
    (await raw()) === earnedRaw &&
      (await save()).economy.teamExperience === 345,
  )
  await bag()
  const beforeDraft = await raw(),
    originalParty = (await save()).progress.partyIds,
    originalMode = (await save()).collection.vanEmphasis
  check(
    "Advisory uses selected five IDs and actual shared level3",
    JSON.stringify(await selected()) === JSON.stringify(originalParty) &&
      (await page.getByTestId("party-readiness").getAttribute("data-level")) ===
        "3",
  )
  await choose(["aw2-lua", "aw2-nhien", "aw2-lam", "aw2-moc-non", "aw2-suong"])
  check(
    "No-tank draft explains an owned starter option and leaves storage/representative intact",
    (await page.getByTestId("party-no-tank").isVisible()) &&
      (await raw()) === beforeDraft &&
      (await page
        .locator("canvas[data-party-ids]")
        .getAttribute("data-party-ids")) ===
        JSON.stringify(originalParty.slice(0, 1)),
  )
  await choose(["aw2-than", "aw2-lua", "aw2-van", "aw2-moc-non", "aw2-suong"])
  check(
    "No-healer draft does not count Vân as a dedicated healer",
    (await page.getByTestId("party-no-healer").isVisible()) &&
      (await raw()) === beforeDraft,
  )
  await choose(["aw2-than", "aw2-hai", "aw2-bach", "aw2-lien", "aw2-van"])
  await page
    .getByLabel("Nhấn Vân cho trận mới", { exact: true })
    .selectOption("attack")
  check(
    "Protection-heavy draft explains missing dedicated damage while Van stays Hybrid",
    (await page.getByTestId("party-no-damage").isVisible()) &&
      JSON.parse(
        await page
          .getByTestId("party-stats-aw2-van")
          .getAttribute("data-stats"),
      ).role === "hybrid" &&
      (await raw()) === beforeDraft,
  )
  const fallback = page.getByRole("button", {
    name: "Chọn đội khởi đầu",
    exact: true,
  })
  await fallback.focus()
  await fallback.press("Enter")
  check(
    "Keyboard starter fallback changes draft only and preserves chosen Van emphasis",
    JSON.stringify(await selected()) === JSON.stringify(starters) &&
      (await page
        .getByLabel("Nhấn Vân cho trận mới", { exact: true })
        .inputValue()) === "attack" &&
      (await raw()) === beforeDraft,
  )
  await click("Hủy chọn đội")
  check(
    "Cancel restores saved team and saved emphasis without writes",
    JSON.stringify(await selected()) === JSON.stringify(originalParty) &&
      (await page
        .getByLabel("Nhấn Vân cho trận mới", { exact: true })
        .inputValue()) === originalMode &&
      (await raw()) === beforeDraft,
  )
  await click("Chọn đội khởi đầu")
  await page.evaluate(() => {
    window.__guidanceBlock = true
  })
  await click("Lưu đội hình")
  await page
    .getByRole("alert")
    .filter({ hasText: "Chưa lưu được AW2" })
    .waitFor()
  check(
    "Failed explicit fallback save preserves exact bytes and retryable draft",
    (await raw()) === beforeDraft &&
      JSON.stringify(await selected()) === JSON.stringify(starters),
  )
  await page.evaluate(() => {
    window.__guidanceBlock = false
  })
  await click("Lưu đội hình")
  await teamWait(starters)
  check(
    "Retry applies only five owned starters with no extra XP/items/receipts/ending changes",
    intact(await save()) === intact(completed) &&
      (await save()).collection.vanEmphasis === originalMode,
  )
  const starterRaw = await raw()
  await page.reload()
  await world()
  await bag()
  check(
    "Saved starter choice and advisory survive byte-identical reload",
    (await raw()) === starterRaw &&
      JSON.stringify(await selected()) === JSON.stringify(starters),
  )
  const detail = page.getByTestId("party-readiness").locator("details")
  await detail.locator(":scope > summary").click()
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 })
    check(
      `${width}px expanded stats and native fallback stay readable`,
      (await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      )) &&
        (await fallback.evaluate(
          (b) => b.getBoundingClientRect().height >= 44,
        )),
    )
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page
    .getByTestId("party-readiness")
    .screenshot({ path: `${out}/${flavor}-party-stats.png` })
  const predicted = {}
  for (const id of starters)
    predicted[id] = JSON.parse(
      await page.getByTestId(`party-stats-${id}`).getAttribute("data-stats"),
    )
  await page.locator("details.aw2-bag-panel > summary").click()
  if ((await save()).progress.zoneId !== "aw2-zone-kitchen-table") {
    await go(520, 240)
    await interact("Đi qua")
    await world()
  }
  const battle = page.getByTestId("world-battle"),
    canvas = battle.locator("canvas")
  const start = async () => {
    await go(320, 128)
    await interact("Đấu lại boss · không nhận thưởng")
    await battle.waitFor()
    await click("Tạm dừng")
    await page
      .getByTestId("battle-atlas-state")
      .filter({ hasText: "đã tải" })
      .waitFor()
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
  const summary = async (outcome) => {
    const actors = []
    for (const row of await page
      .locator('[data-testid^="world-unit-aw2-"]')
      .all())
      actors.push(JSON.parse(await row.getAttribute("data-state")))
    const bossText = await page
        .locator('[data-actor-id="aw2-enemy-forgotten-host"]')
        .textContent(),
      boss = bossText.match(/HP (\d+)\/(\d+)/)
    const alive = actors.filter((a) => a.hp > 0).length
    check(
      `${outcome} summary reports real surviving allies and actual boss HP`,
      (await page.getByTestId("battle-survivors").textContent()).includes(
        `${alive}/5`,
      ) &&
        (await page.getByTestId("battle-boss-hp").textContent()).includes(
          `${boss[1]}/${boss[2]}`,
        ),
    )
    outcomes.push({
      outcome,
      tick: +(await canvas.getAttribute("data-tick")),
      survivors: alive,
      bossHp: +boss[1],
      bossMaxHp: +boss[2],
    })
  }
  await start()
  const firstCheckpoint = await raw()
  check(
    "Active encounter does not display a terminal result summary",
    (await page.getByTestId("battle-outcome-summary").count()) === 0,
  )
  for (const id of starters) {
    const actual = JSON.parse(
      await page.getByTestId(`world-unit-${id}`).getAttribute("data-state"),
    )
    for (const k of ["maxHp", "attack", "defense"])
      assert.equal(actual[k], predicted[id][k])
  }
  check(
    "All five previewed HP/attack/defense values match authentic combat actors",
  )
  for (
    let i = 0;
    i < 200 && (await canvas.getAttribute("data-status")) === "active";
    i++
  ) {
    if (+(await canvas.getAttribute("data-tick")) >= 5)
      for (const id of starters) {
        const u = page.getByTestId(`world-ultimate-${id}`)
        if (
          (await canvas.getAttribute("data-status")) === "active" &&
          (await u.isEnabled())
        )
          await u.click()
      }
    if ((await canvas.getAttribute("data-status")) === "active") await step()
  }
  check(
    "Earned starter fallback wins real rematch without renderer outcome injection",
    (await canvas.getAttribute("data-status")) === "player-win",
  )
  await summary("win")
  check(
    "Win summary rendering itself never writes save/rewards",
    (await raw()) === firstCheckpoint,
  )
  await page
    .getByTestId("battle-outcome-summary")
    .screenshot({ path: `${out}/${flavor}-win-summary.png` })
  await click("Lưu kết quả và trở về")
  await world()
  await bag()
  await choose(mixed)
  await page
    .getByLabel("Nhấn Vân cho trận mới", { exact: true })
    .selectOption("attack")
  await click("Lưu đội hình")
  await teamWait(mixed)
  await page.locator("details.aw2-bag-panel > summary").click()
  await start()
  const lossCheckpoint = await raw()
  for (
    let i = 0;
    i < 200 && (await canvas.getAttribute("data-status")) === "active";
    i++
  )
    await step()
  check(
    "Mixed-party auto loss remains authentic with historical story bossDefeated still true",
    (await canvas.getAttribute("data-status")) === "enemy-win" &&
      (await save()).progress.bossDefeated &&
      (await save()).progress.questIndex === 4,
  )
  await summary("loss")
  check(
    "Loss summary writes no extra progress or rewards",
    (await raw()) === lossCheckpoint,
  )
  await page
    .getByTestId("battle-outcome-summary")
    .screenshot({ path: `${out}/${flavor}-loss-summary.png` })
  await click("Lưu kết quả và trở về")
  await world()
  await bag()
  const tab = await context.newPage()
  watch(tab)
  await tab.goto(url)
  await tab.locator("canvas[data-party-size]").waitFor()
  await bag(tab)
  await tab
    .getByRole("button", { name: "Chọn đội khởi đầu", exact: true })
    .click()
  await tab.getByRole("button", { name: "Lưu đội hình", exact: true }).click()
  await teamWait(starters, tab)
  const newer = await raw()
  await click("Chọn đội khởi đầu")
  await click("Lưu đội hình")
  await page.getByRole("alert").filter({ hasText: "tab khác" }).waitFor()
  check(
    "Stale fallback draft cannot overwrite newer team or rewards",
    (await raw()) === newer,
  )
  await tab.close()
  await click("Đọc lại")
  await world()
  await bag()
  check(
    "Reread restores authoritative saved party and advisory together",
    JSON.stringify(await selected()) === JSON.stringify(starters) &&
      (await raw()) === newer,
  )
  await page.locator("details.aw2-bag-panel > summary").click()
  await start()
  const retreatCheckpoint = await raw()
  await click("Rút lui về Phòng Bàn")
  await summary("retreat")
  check(
    "Retreat summary remains read-only",
    (await raw()) === retreatCheckpoint,
  )
  await click("Lưu kết quả và trở về")
  await world()
  const final = await raw()
  await page.reload()
  await world()
  check(
    "All changes/real outcomes/returns/reload preserve original earned economy/ownership/ending",
    intact(await save()) === intact(completed) && (await raw()) === final,
  )
  check(
    "Legacy keys remain byte-identical",
    await page.evaluate(
      (legacy) =>
        Object.entries(legacy).every(([k, v]) => localStorage.getItem(k) === v),
      legacy,
    ),
  )
  check(
    "No unexpected guidance console/page/resource errors",
    errors.length === 0,
  )
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-007N",
        status: "PASS",
        flavor,
        engine: browser.version(),
        checks,
        errors,
        outcomes,
        earned: {
          source: values.earned,
          sha256: createHash("sha256").update(earnedText).digest("hex"),
          checkpointSha256: createHash("sha256")
            .update(earnedRaw)
            .digest("hex"),
          origin:
            "Exact authentic ending checkpoint previously earned through native all-quest/mode/boss journey; current flow starts at recorded checkpoint, no fresh complete story claim",
        },
        checkpointRaw: await raw(),
      },
      null,
      2,
    ) + "\n",
  )
  console.log(
    JSON.stringify({ status: "PASS", flavor, checks: checks.length, outcomes }),
  )
} catch (error) {
  await page
    ?.screenshot({ path: `${out}/${flavor}-failure.png`, fullPage: true })
    .catch(() => {})
  await writeFile(
    `${out}/${flavor}-failure.json`,
    JSON.stringify(
      {
        status: "FAIL",
        checks,
        errors,
        failure: String(error),
        observedRaw: await page
          ?.evaluate((key) => localStorage.getItem(key), key)
          .catch(() => null),
      },
      null,
      2,
    ) + "\n",
  )
  throw error
} finally {
  await browser?.close()
  if (values.compiled) await new Promise((r) => server.httpServer.close(r))
  else await server.close()
}
