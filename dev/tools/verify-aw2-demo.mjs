import {
  roomBeforeBoss,
  roomAfterVictory,
  roomAfterNote,
  roomAfterEnding,
} from "./aw2-table-room-browser-flow.mjs"
import { rematchAfterEnding } from "./aw2-rematch-browser-flow.mjs"
import {
  collectionIntro,
  collectionBeforeBoss,
} from "./aw2-collection-browser-flow.mjs"
import assert from "node:assert/strict"
import { journeySceneChecks } from "./aw2-journey-scene-browser.mjs"
import { tapWorldPoint } from "./aw2-world-browser-view.mjs"
import { mkdir, writeFile, readFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"

const { values } = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
    compiled: { type: "boolean", default: false },
    collection: { type: "boolean", default: false },
    room: { type: "boolean", default: false },
    journey: { type: "boolean", default: false },
    "resume-journey": { type: "string" },
    "resume-room": { type: "string" },
    rematch: { type: "boolean", default: false },
    out: { type: "string" },
  },
})
const withCollection = values.collection || values.rematch || values.room
assert.ok(!values["resume-room"] || values.room, "Room resume requires --room")
assert.ok(
  !values["resume-journey"] ||
    (values.journey && !values.room && !values.collection && !values.rematch),
  "Journey resume requires standalone --journey",
)
const { chromium } = await import(values.playwright)
const port = values.compiled ? 8463 : 8462,
  flavor = values.compiled ? "compiled" : "source"
const server = values.compiled
  ? await preview({
      configFile: "dev/vite.aw2.config.ts",
      preview: { host: "127.0.0.1", port, strictPort: true },
    })
  : await createServer({
      configFile: "dev/vite.dev.config.ts",
      server: { host: "127.0.0.1", port, strictPort: true },
    })
const out =
    values.out ??
    (values.room
      ? ".asset-work/aw2-006b"
      : values.rematch
        ? ".asset-work/aw2-007m"
        : withCollection
          ? ".asset-work/aw2-007l"
          : ".asset-work/aw2-010b"),
  key = "aw2.development.save",
  url = `http://127.0.0.1:${port}/dev/aw2/world.html`
const checks = [],
  errors = [],
  expectedErrors = [],
  requests = [],
  modes = [],
  legacy = {
    "foodchest.tcg.v1": "original-cards",
    "foodchest.user.v1": "original-user",
    "foodchest.tcg.v1.checkpoint.v4": "original-checkpoint",
    "mealgacha.progress-journal.v4": "original-journal",
    "mealgacha.progress-writer.v4": "original-writer",
  }
let browser, page
let bossTick = null,
  journeyResumeStage,
  earnedChain,
  fault = "",
  sceneEvidence
const check = (name, condition = true) => {
  assert.ok(condition, name)
  checks.push(name)
  console.log(name)
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
    window.__demoWrites = 0
    window.__demoBlock = false
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === "aw2.development.save") {
        if (window.__demoBlock) throw Error("Mode attempted to write RPG")
        window.__demoWrites++
      }
      return set.call(this, key, value)
    }
  })
  page = await context.newPage()
  const watch = (target) => {
    target.on("request", (r) => requests.push(new URL(r.url()).pathname))
    target.on("pageerror", (error) => errors.push(error.message))
    target.on("console", (message) => {
      if (message.type() === "error")
        (fault &&
        /404|Failed to load|Error loading|Could not load/.test(message.text())
          ? expectedErrors
          : errors
        ).push(message.text())
    })
    target.on("response", (response) => {
      if (response.status() >= 400)
        (fault && new URL(response.url()).pathname === fault
          ? expectedErrors
          : errors
        ).push(`${response.status()} ${response.url()}`)
    })
  }
  watch(page)
  const click = (name) =>
    page.getByRole("button", { name, exact: true }).click()
  const raw = () => page.evaluate((key) => localStorage.getItem(key), key)
  const save = async () => JSON.parse(await raw())
  const world = () => page.locator("canvas[data-party-size]").waitFor()
  const go = async (x, y) => {
    const map = page.getByTestId("world-map")
    await world()
    await map.locator(".aw2-map-loading").waitFor({ state: "hidden" })
    await map.scrollIntoViewIfNeeded()
    await tapWorldPoint(page, x, y)
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
    await page.keyboard.press("e")
    await page.getByRole("dialog").waitFor()
    if (name) {
      await page
        .getByRole("dialog")
        .getByRole("button", { name, exact: true })
        .click()
      await page.getByRole("dialog").waitFor({ state: "hidden" })
    }
  }
  const travel = async (x, zone) => {
    await go(x, 192)
    await interact("Đi qua")
    await page.getByTestId("zone-name").filter({ hasText: zone }).waitFor()
    await world()
  }
  const journey = values.journey
    ? journeySceneChecks({
        page,
        check,
        raw,
        save,
        go,
        interact,
        travel,
        world,
        out,
        flavor,
        requests,
        setFault: (value) => {
          fault = value
        },
      })
    : null
  const blocked = (key) =>
    page.evaluate((key) => {
      const target = document.activeElement ?? document.body
      const event = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      })
      target.dispatchEvent(event)
      target.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }))
      return event.defaultPrevented
    }, key)
  await mkdir(out, { recursive: true })
  await page.goto(url)
  if (values["resume-room"]) {
    const priorText = await readFile(values["resume-room"], "utf8"),
      prior = JSON.parse(priorText),
      checkpoint = JSON.parse(prior.observedRaw),
      boundary = prior.checks.findIndex((c) =>
        c.startsWith("Authored room loads"),
      )
    assert.equal(prior.flavor, flavor)
    assert.equal(prior.errors.length, 0)
    assert.ok(boundary > 0)
    assert.equal(checkpoint.progress.questIndex, 3)
    assert.equal(checkpoint.progress.zoneId, "aw2-zone-kitchen-table")
    assert.equal(checkpoint.progress.bossDefeated, false)
    assert.equal(checkpoint.economy.teamExperience, 205)
    assert.equal(checkpoint.collection.recruitedIds.length, 7)
    checks.push(...prior.checks.slice(0, boundary))
    modes.push(...prior.modes)
    earnedChain = {
      source: values["resume-room"],
      sourceSha256: createHash("sha256").update(priorText).digest("hex"),
      checkpointSha256: createHash("sha256")
        .update(prior.observedRaw)
        .digest("hex"),
      retainedAssertions: boundary,
      boundary:
        "Before room hook; initial earned native journey retained, room assertions rerun in a fresh QA profile",
    }
    await page.evaluate(
      ({ key, raw, legacy }) => {
        localStorage.setItem(key, raw)
        Object.entries(legacy).forEach(([k, v]) => localStorage.setItem(k, v))
      },
      { key, raw: prior.observedRaw, legacy },
    )
    await page.reload()
    await world()
  } else {
    if (values["resume-journey"]) {
      const priorText = await readFile(values["resume-journey"], "utf8"),
        prior = JSON.parse(priorText),
        earned = JSON.parse(prior.observedRaw)
      journeyResumeStage =
        earned.progress.zoneId === "aw2-zone-covenant-village"
          ? "ending"
          : earned.progress.zoneId === "aw2-zone-kitchen-pantry"
            ? "chest"
            : "street"
      const boundary =
        journeyResumeStage === "ending"
          ? prior.checks.length
          : journeyResumeStage === "street"
            ? prior.checks.findIndex((c) =>
                c.startsWith("lantern-street: authored required"),
              )
            : prior.checks.findIndex(
                (c) =>
                  c ===
                  "Reading and closing chest grants nothing in the combined journey",
              ) + 1
      assert.equal(prior.flavor, flavor)
      assert.equal(prior.errors.length, 0)
      assert.ok(boundary > 0)
      assert.equal(earned.progress.partyIds.length, 5)
      if (journeyResumeStage === "street") {
        assert.equal(earned.progress.zoneId, "aw2-zone-lantern-street")
        assert.equal(earned.progress.questIndex, 1)
        assert.equal(earned.progress.accepted, false)
        assert.equal(earned.economy.teamExperience, 30)
        assert.equal(prior.modes.length, 2)
      } else if (journeyResumeStage === "chest") {
        assert.equal(earned.progress.questIndex, 2)
        assert.equal(earned.progress.accepted, true)
        assert.equal(earned.progress.hintRead, true)
        assert.equal(earned.economy.teamExperience, 80)
        assert.equal(prior.modes.length, 4)
        assert.ok(!earned.economy.receipts.includes("aw2-grant-chest-pantry"))
      }
      if (journeyResumeStage === "ending") {
        assert.equal(earned.progress.questIndex, 3)
        assert.equal(earned.progress.accepted, true)
        assert.equal(earned.progress.bossDefeated, true)
        assert.equal(earned.progress.tableNoteRead, true)
        assert.equal(earned.progress.endingChoice, null)
        assert.equal(earned.economy.teamExperience, 205)
        assert.equal(prior.modes.length, 4)
        assert.ok(
          prior.checks.includes(
            "Same earned journey wins the actual boss without renderer-supplied outcome",
          ),
        )
        bossTick = prior.bossTick ?? null
      }
      checks.push(...prior.checks.slice(0, boundary))
      modes.push(...prior.modes)
      earnedChain = {
        source: values["resume-journey"],
        sourceSha256: createHash("sha256").update(priorText).digest("hex"),
        checkpointSha256: createHash("sha256")
          .update(prior.observedRaw)
          .digest("hex"),
        retainedAssertions: boundary,
        parent: prior.earnedChain,
        stage: journeyResumeStage,
        boundary:
          journeyResumeStage === "ending"
            ? "Before ending assertion; exact explicitly saved near-Bà position. Retain verified native intro/modes/scenes/chest failed-write+retry/puzzle/cook+share/actual boss win+commit/note and reciprocal return from same-session hashed reports; finish endings/shortcuts/error recovery."
            : journeyResumeStage === "street"
              ? "Before street preview; frozen source/art. Intro+two quick-entry practices retained from same-session report; continue exact earned checkpoint."
              : "Before failed chest write; frozen source/art. Intro/four actual modes/three scene previews/memories/hint retained by exact reports+hash chain; continue real chest/puzzle/boss/endings/error recovery.",
      }
      await page.evaluate(
        ({ key, raw, legacy }) => {
          localStorage.setItem(key, raw)
          for (const [k, v] of Object.entries(legacy))
            localStorage.setItem(k, v)
        },
        { key, raw: prior.observedRaw, legacy },
      )
      await page.reload()
      await world()
    } else {
      await page
        .getByRole("button", { name: "Tạo bản lưu AW2", exact: true })
        .waitFor()
      check(
        "Fresh demo opens without creating a save or granting progression",
        (await raw()) === null,
      )
      await page.evaluate(
        (legacy) =>
          Object.entries(legacy).forEach(([key, value]) =>
            localStorage.setItem(key, value),
          ),
        legacy,
      )
      await click("Tạo bản lưu AW2")
      await world()
      const initial = await raw()
      await journey?.initialLazy()
      check(
        "Incomplete saved journey does not claim demo completion",
        (await page.getByTestId("demo-complete").count()) === 0,
      )
      check(
        "Initial goal precedes the map and names the first NPC",
        (await page
          .getByTestId("quest-objective")
          .evaluate(
            (node) =>
              !!(
                node.compareDocumentPosition(
                  document.querySelector('[data-testid="world-map"]'),
                ) & Node.DOCUMENT_POSITION_FOLLOWING
              ),
          )) &&
          (await page.getByTestId("quest-objective").textContent()).includes(
            "Bà Giữ Chỗ",
          ),
      )
      const help = page.getByText("Hướng dẫn di chuyển, lưu và ghé bàn", {
        exact: true,
      })
      await help.focus()
      await page.keyboard.press("Space")
      check(
        "Keyboard opens optional help with save/mode return guidance and no writes",
        (await help.evaluate((node) => node.parentElement.open)) &&
          (
            await page
              .getByRole("region", { name: "Mục tiêu hành trình" })
              .textContent()
          ).includes("Đi bộ chưa lưu vị trí") &&
          (await raw()) === initial,
      )
      check(
        "Native summary keeps browser arrows and interaction letters",
        !(await blocked("ArrowDown")) && !(await blocked("e")),
      )
      for (const width of [320, 390, 768]) {
        await page.setViewportSize({ width, height: 844 })
        check(
          `Goal/help/world controls fit ${width}px`,
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        if (width === 390)
          await page.screenshot({
            path: `${out}/${flavor}-guide-mobile.png`,
            fullPage: true,
          })
      }
      await page.setViewportSize({ width: 1280, height: 1000 })
      await page
        .getByRole("button", { name: "Lưu vị trí", exact: true })
        .focus()
      check(
        "Save button keeps native key ownership",
        !(await blocked("ArrowDown")) && !(await blocked("e")),
      )
      const position = () => page.getByTestId("player-position").textContent()
      const beforeKey = await position()
      await page.getByRole("button", { name: "→ Phải", exact: true }).focus()
      await page.keyboard.press("Enter")
      check(
        "Direction button Enter moves right exactly through world rules without save writes",
        (await position()).includes("Vị trí 103, 192") &&
          (await raw()) === initial &&
          (await position()) !== beforeKey,
      )
      await page.getByTestId("world-map").focus()
      await page.keyboard.down("d")
      await page.waitForTimeout(120)
      await page
        .getByRole("button", { name: "Lưu vị trí", exact: true })
        .focus()
      const stopped = await position()
      await page.waitForTimeout(160)
      await page.keyboard.up("d")
      check(
        "Focusing native UI stops held exploration movement",
        (await position()) === stopped,
      )
      await click("Đọc lại")
      await world()
      check(
        "Reread restores initial unsaved movement without writing",
        (await raw()) === initial &&
          (await position()).includes("Vị trí 96, 192"),
      )
      await go(160, 240)
      await page.getByTestId("world-map").evaluate((node) => node.blur())
      await interact()
      const beforeClose = await raw()
      await page.keyboard.press("Escape")
      check(
        "Closing the first dialogue accepts nothing",
        (await raw()) === beforeClose && !(await save()).progress.accepted,
      )
      check(
        "Closing dialogue from body focus restores the keyboard map target",
        await page
          .getByTestId("world-map")
          .evaluate((node) => document.activeElement === node),
      )
      await interact("Nhận nhiệm vụ")
      await go(160, 144)
      await interact("Đọc mảnh khăn")
      await go(160, 240)
      await interact("Hoàn tất nhập môn")
      check(
        "One earned intro unlocks five starters and exactly 30XP",
        (await save()).progress.partyIds.length === 5 &&
          (await save()).economy.teamExperience === 30,
      )
      if (withCollection) await collectionIntro({ page, check, raw, save })
      const intro = await raw()
      await page.reload()
      await world()
      check(
        "Fresh intro reload is byte-identical and retains next objective",
        (await raw()) === intro &&
          (await page.getByTestId("quest-objective").textContent()).includes(
            "An Vá Đèn",
          ),
      )
    }
    if (journeyResumeStage !== "ending") {
      const enter = async (mode, entry) => {
        if (entry === "quick-entry")
          await click(mode === "tcg" ? "Ghé nhanh TCG" : "Ghé nhanh Auto Chess")
        else {
          await go(mode === "tcg" ? 240 : 432, 272)
          await interact("Ghé bàn")
        }
        await page.getByTestId("mode-lobby").waitFor()
        const checkpoint = await raw(),
          count = await page.evaluate(() => window.__demoWrites)
        await click(mode === "tcg" ? "Chơi TCG thử" : "Chơi Auto Chess thử")
        await page
          .getByTestId(mode === "tcg" ? "tcg-practice" : "chess-practice")
          .waitFor()
        await page.evaluate(() => {
          window.__demoBlock = true
        })
        return { checkpoint, count }
      }
      const returnFrom = async (mode, entry, checkpoint, count, result) => {
        await click("Trở về hành trình")
        await world()
        check(
          `${mode}/${entry} real result returns exact RPG position/objective/economy without writes`,
          (await raw()) === checkpoint &&
            (await page.evaluate(() => window.__demoWrites)) === count,
        )
        modes.push({
          mode,
          entry,
          result,
          questIndex: JSON.parse(checkpoint).progress.questIndex,
        })
        await page.evaluate(() => {
          window.__demoBlock = false
        })
      }
      const finishTcg = async (entry, win) => {
        const { checkpoint, count } = await enter("tcg", entry),
          match = page.getByTestId("tcg-practice")
        await page.getByRole("heading", { level: 1 }).focus()
        check(
          `TCG/${entry} leaves browser reading arrows available`,
          !(await blocked("ArrowDown")),
        )
        if (entry === "quick-entry") {
          await page.evaluate(() => window.scrollTo(0, 0))
          await page.keyboard.press("ArrowDown")
          await page.waitForTimeout(220)
          check(
            "Actual browser arrow scroll works inside the long TCG page",
            await page.evaluate(() => scrollY > 0),
          )
        }
        let turns = 0
        while (
          (await match.getAttribute("data-status")) === "active" &&
          turns++ < 70
        )
          await click("Kết thúc lượt")
        assert.equal(await match.getAttribute("data-status"), "opponent-win")
        if (win) {
          await click("Chơi ván mới")
          let actions = 0
          while (
            (await match.getAttribute("data-status")) === "active" &&
            actions++ < 400
          )
            await click("Chơi nước gợi ý")
          assert.equal(await match.getAttribute("data-status"), "player-win")
        }
        await returnFrom(
          "tcg",
          entry,
          checkpoint,
          count,
          await match.getAttribute("data-status"),
        )
      }
      const owned = () =>
        page
          .getByTestId("chess-practice")
          .locator("[data-piece-id]")
          .evaluateAll((nodes) =>
            nodes.map((node) => ({
              uid: node.dataset.pieceId,
              id: node.dataset.spiritId,
              stars: +node.dataset.stars,
            })),
          )
      const finishChess = async (entry, strong) => {
        const { checkpoint, count } = await enter("auto-chess", entry),
          match = page.getByTestId("chess-practice")
        const phase = () => match.getAttribute("data-phase")
        await page.getByRole("heading", { level: 1 }).focus()
        check(
          `Chess/${entry} leaves browser reading arrows available`,
          !(await blocked("ArrowDown")),
        )
        let rounds = 0
        while ((await phase()) !== "finished" && rounds++ < 6) {
          if (strong) {
            for (let tries = 0; tries < 40; tries++) {
              const units = await owned(),
                offers = await page
                  .locator("[data-offer]")
                  .evaluateAll((nodes) =>
                    nodes.map((node, slot) => ({
                      id: node.dataset.offer,
                      slot,
                      usable:
                        !!node.querySelector("button") &&
                        !node.querySelector("button").disabled,
                    })),
                  )
              const score = (id) =>
                units.filter((unit) => unit.id === id && unit.stars === 1)
                  .length *
                  20 +
                (!units.some((unit) => unit.id === id) ? 8 : 0)
              offers.sort((a, b) => score(b.id) - score(a.id))
              const offer = offers.find((offer) => offer.usable)
              if (offer) {
                await page
                  .locator("[data-offer]")
                  .nth(offer.slot)
                  .getByRole("button")
                  .click()
                await click("Xếp đội gợi ý")
                continue
              }
              if (
                +(await page.getByTestId("chess-gold").textContent()) < 3 ||
                units.length >= 8
              )
                break
              await click("Đổi quầy · 1 vàng")
            }
            await click("Xếp đội gợi ý")
          } else if (!(await owned()).length) {
            await page
              .locator("[data-offer]")
              .first()
              .getByRole("button")
              .click()
            const piece = (await owned())[0]
            await page.locator(`[data-piece-id="${piece.uid}"]`).click()
            await page.locator("[data-cell='3']").click()
          }
          await click("Bắt đầu giao tranh")
          if (
            await page
              .getByRole("button", { name: "Tạm dừng giao tranh", exact: true })
              .count()
          )
            await click("Tạm dừng giao tranh")
          let ticks = 0
          while ((await phase()) === "battle" && ticks++ < 81)
            await click("Tiến một nhịp")
          if ((await phase()) === "round-result")
            await click("Vòng tiếp · nhận 6 vàng")
        }
        assert.equal(await phase(), "finished")
        assert.equal(
          await match.getAttribute("data-status"),
          strong ? "player-win" : "opponent-win",
        )
        await returnFrom(
          "auto-chess",
          entry,
          checkpoint,
          count,
          await match.getAttribute("data-status"),
        )
      }
      if (journeyResumeStage !== "chest") {
        if (!values["resume-journey"]) {
          await finishTcg("quick-entry", true)
          await finishChess("quick-entry", true)
          await travel(616, "Phố Đèn Lồng")
        }
        await journey?.previewRegion("lantern-street")
        await finishTcg("portal", false)
        await finishChess("portal", false)
        check(
          "Both real practices and both entry routes fit one legitimately earned journey",
          modes.length === 4 && modes.every((mode) => mode.questIndex === 1),
        )
        await go(160, 112)
        await interact("Nhận nhiệm vụ")
        for (const x of [504, 280, 392]) {
          await go(x, 128)
          await interact("Ghi nhớ câu chuyện")
        }
        await go(160, 112)
        await interact("Người chờ")
        check(
          "Three memories hand-in grants only its actual quest reward",
          (await save()).progress.questIndex === 2 &&
            (await save()).economy.teamExperience === 80,
        )
        await travel(616, "Sân Bếp Bỏ Quên")
        await journey?.previewRegion("forgotten-kitchen-yard")
        await journey?.yardLocked()
        await go(320, 128)
        await interact("Nhận nhiệm vụ")
        await travel(616, "Phòng Kho")
        await journey?.previewRegion("kitchen-pantry")
        await go(240, 128)
        await interact("Ghi lại gợi ý")
        await journey?.pointState("aw2-object-hearth-hint", "read")
      }
      await go(432, 272)
      if (journeyResumeStage !== "chest") {
        await interact()
        const chestBefore = await raw()
        await page.keyboard.press("Escape")
        check(
          "Reading and closing chest grants nothing in the combined journey",
          (await raw()) === chestBefore,
        )
      }
      if (journey) {
        await interact()
        await journey.failedChest()
      }
      await interact("Mở rương nguyên liệu")
      await journey?.pointState("aw2-chest-pantry", "claimed")
      const chestRaw = await raw()
      await interact()
      check(
        "Chest can be claimed only once with an actual receipt",
        (await page
          .getByRole("button", { name: "Đã nhận rương", exact: true })
          .isDisabled()) && (await raw()) === chestRaw,
      )
      await page.keyboard.press("Escape")
      await travel(616, "Phòng Lửa")
      await go(432, 144)
      await interact("Nhóm lửa")
      check(
        "Wrong puzzle attempt is retryable and spends no ingredients",
        (await save()).progress.puzzleStep === 0 &&
          JSON.stringify((await save()).economy.inventory) ===
            JSON.stringify(JSON.parse(chestRaw).economy.inventory),
      )
      for (const [x, action] of [
        [208, "Mở lối thoát"],
        [320, "Đặt nồi"],
        [432, "Nhóm lửa"],
      ]) {
        await go(x, 144)
        await interact(action)
      }
      const puzzle = await raw()
      await page.reload()
      await world()
      check(
        "Solved puzzle reload preserves earned state and exact bytes",
        (await raw()) === puzzle && (await save()).progress.puzzleStep === 3,
      )
      await travel(24, "Phòng Kho")
      await travel(24, "Sân Bếp Bỏ Quên")
      await go(320, 128)
      await interact("Báo đã mở bếp")
      await go(96, 192)
      await page.locator(".aw2-bag-panel > summary").click()
      await page.getByText("Nấu và chia một bữa ấm", { exact: true }).click()
      check(
        "Kitchen guidance explains an opened but distant kitchen",
        (await page.locator("#aw2-kitchen-guide").textContent()).includes(
          "Bếp đã mở. Đến gần",
        ) &&
          (await page
            .getByRole("button", { name: "Nấu Chén cơm ấm", exact: true })
            .isDisabled()),
      )
      await go(320, 128)
      const beforeMeal = await save()
      await click("Nấu Chén cơm ấm")
      await click("Chia bữa · +45 EXP")
      await page
        .getByRole("status")
        .filter({ hasText: "Bữa ăn được chia sẻ" })
        .waitFor()
      const afterMeal = await save()
      check(
        "Real proximity cooking/sharing atomically consumes ingredients and grants 45XP",
        afterMeal.economy.teamExperience === 205 &&
          afterMeal.economy.shared === 1 &&
          afterMeal.economy.cooked === 1 &&
          afterMeal.economy.inventory.rice ===
            beforeMeal.economy.inventory.rice - 1 &&
          afterMeal.economy.inventory["warm-bowl"] === 0,
      )
      await go(320, 128)
      await interact("Nhận nhiệm vụ")
      await travel(616, "Phòng Kho")
      await travel(616, "Phòng Lửa")
      await travel(616, "Phòng Bàn")
      await go(320, 128)
      if (withCollection)
        await collectionBeforeBoss({
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
        })
    }
  }
  if (journeyResumeStage !== "ending") {
    if (values.room)
      await roomBeforeBoss({
        page,
        check,
        raw,
        save,
        go,
        interact,
        world,
        out,
        flavor,
      })
    await interact("Bắt đầu thử thách")
    await page.getByTestId("world-battle").waitFor()
    await click("Tạm dừng")
    await page
      .getByTestId("battle-atlas-state")
      .filter({ hasText: "Năm atlas chiến đấu đã tải" })
      .waitFor()
    const canvas = page.getByTestId("world-battle").locator("canvas")
    check(
      "Fresh earned team enters real boss with reduced motion and audio opt-in",
      (await page
        .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
        .isChecked()) &&
        !(await page
          .getByRole("checkbox", { name: "Âm thanh", exact: true })
          .isChecked()),
    )
    await page.getByRole("checkbox", { name: "Âm thanh", exact: true }).check()
    await page
      .getByRole("checkbox", { name: "Âm thanh", exact: true })
      .uncheck()
    await page
      .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
      .uncheck()
    await page.waitForFunction(() => {
      const poses = JSON.parse(
        document.querySelector('[data-testid="world-battle"] canvas').dataset
          .actorPoses ?? "{}",
      )
      return Object.entries(poses).some(
        ([id, frame]) =>
          id.includes("aw2-than") && frame.startsWith("battle.idle."),
      )
    })
    check(
      "Earned world encounter draws Than's new motion atlas through the shared renderer",
    )
    await page.waitForFunction(() => {
      const poses = JSON.parse(
        document.querySelector('[data-testid="world-battle"] canvas').dataset
          .actorPoses ?? "{}",
      )
      return Object.entries(poses).some(
        ([id, frame]) =>
          id.includes("aw2-lua") && frame.startsWith("battle.idle."),
      )
    })
    check("Earned world encounter also draws Lua's authored motion atlas")
    await page.waitForFunction(() => {
      const poses = JSON.parse(
        document.querySelector('[data-testid="world-battle"] canvas').dataset
          .actorPoses ?? "{}",
      )
      return Object.entries(poses).some(
        ([id, frame]) =>
          id.includes("aw2-lam") && frame.startsWith("battle.idle."),
      )
    })
    check("Earned world encounter also draws Lam's authored motion atlas")
    const pausedMotion = await canvas.getAttribute("data-motion-time")
    await page.waitForTimeout(180)
    check(
      "Paused world encounter freezes visual time as well as core ticks",
      (await canvas.getAttribute("data-motion-time")) === pausedMotion,
    )
    await page
      .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
      .check()
    const bossCheckpoint = await raw()
    const encounterStatus = page.getByTestId("encounter-status")
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="world-battle"] canvas')?.dataset
          .status === "active",
    )
    for (
      let turn = 0;
      turn < 180 &&
      (await encounterStatus.textContent()).includes("Đang chiến đấu");
      turn++
    ) {
      if (+(await canvas.getAttribute("data-tick")) >= 5)
        for (const id of ["than", "lua", "lam", "moc-non", "suong"]) {
          const ultimate = page.getByTestId(`world-ultimate-aw2-${id}`)
          if (await ultimate.isEnabled()) await ultimate.click()
        }
      if ((await encounterStatus.textContent()).includes("Đang chiến đấu")) {
        const beforeTick = +(await canvas.getAttribute("data-tick"))
        await click("Bước 1 nhịp")
        await page.waitForFunction(
          (tick) =>
            +document.querySelector('[data-testid="world-battle"] canvas')
              .dataset.tick ===
            tick + 1,
          beforeTick,
        )
      }
    }
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="world-battle"] canvas').dataset
          .status !== "active",
    )
    check(
      "Same earned journey wins the actual boss without renderer-supplied outcome",
      (await canvas.getAttribute("data-status")) === "player-win" &&
        (await raw()) === bossCheckpoint,
    )
    bossTick = +(await canvas.getAttribute("data-tick"))
    await click("Lưu kết quả và trở về")
    await world()
    await page.reload()
    await world()
    check(
      "Explicit boss commit survives reload before note and ending",
      (await save()).progress.bossDefeated &&
        !(await save()).progress.tableNoteRead &&
        (await save()).progress.questIndex === 3,
    )
    if (values.room) await roomAfterVictory({ page, check })
    await go(448, 144)
    await interact("Đọc ghi chép")
    if (values.room) await roomAfterNote({ page, check })
    for (const zone of [
      "Phòng Lửa",
      "Phòng Kho",
      "Sân Bếp Bỏ Quên",
      "Phố Đèn Lồng",
      "Làng Giao Ước",
    ])
      await travel(24, zone)
    await go(160, 240)
    await click("Lưu vị trí")
    await page
      .getByRole("status")
      .filter({ hasText: "Đã lưu vị trí AW2." })
      .waitFor()
  }
  check(
    "Ending branch is captured at the explicitly saved NPC position",
    Math.abs((await save()).progress.x - 160) <= 1 &&
      Math.abs((await save()).progress.y - 240) <= 1,
  )
  await page.getByTestId("world-map").focus()
  await interact()
  const readyEnding = await raw()
  await page.keyboard.press("Escape")
  check(
    "Closing the earned final choice grants no final quest reward",
    (await raw()) === readyEnding &&
      (await save()).economy.teamExperience === 205,
  )
  await interact("Để ghế trống chờ")
  const completed = await raw(),
    done = await save()
  check(
    "One fresh journey completes all four quests with exact once-only rewards",
    done.progress.questIndex === 4 &&
      done.progress.endingChoice === "wait" &&
      done.economy.teamExperience === 345 &&
      done.economy.receipts.length === 5,
  )
  if (withCollection)
    check(
      "Completed quest/economy/boss/mode writes preserve all explicitly recruited spirits",
      done.collection.recruitedIds.length === 7 &&
        done.progress.partyIds.length === 5,
    )
  const summary = page.getByTestId("demo-complete")
  check(
    "Saved wait ending has an honest completion summary and current XP",
    (await summary.textContent()).includes("345 EXP") &&
      (await page.getByTestId("demo-ending").textContent()).includes(
        "Để ghế trống chờ",
      ) &&
      (await raw()) === completed,
  )
  await page.reload()
  await world()
  check(
    "Completion summary reload preserves exact save bytes without grants",
    (await summary.isVisible()) && (await raw()) === completed,
  )
  await go(160, 240)
  await interact()
  await page.keyboard.press("Escape")
  check(
    "Completed ending and reload cannot repeat quest grants",
    (await raw()) === completed,
  )
  await travel(616, "Phố Đèn Lồng")
  await travel(616, "Sân Bếp Bỏ Quên")
  await go(520, 240)
  await interact("Đi qua")
  await page.getByTestId("zone-name").filter({ hasText: "Phòng Bàn" }).waitFor()
  await go(520, 240)
  await interact("Đi qua")
  check(
    "Earned ending opens the reciprocal return shortcut",
    (await page.getByTestId("zone-name").textContent()).includes("Sân Bếp") &&
      (await save()).progress.questIndex === 4,
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: `${out}/${flavor}-completed-mobile.png`,
    fullPage: true,
  })
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await summary.scrollIntoViewIfNeeded()
    check(
      `${width}px completion summary and both48px practice controls remain readable`,
      await summary.evaluate((node) => {
        const buttons = [...node.querySelectorAll("button")]
        return (
          document.documentElement.scrollWidth <= innerWidth &&
          buttons.length === 2 &&
          buttons.every((button) => button.getBoundingClientRect().height >= 48)
        )
      }),
    )
  }
  for (const [label, mode] of [
    ["Luyện TCG", "tcg"],
    ["Luyện Auto Chess", "auto-chess"],
  ]) {
    await click(label)
    await page.getByTestId("mode-lobby").waitFor()
    const checkpoint = await raw()
    const validEntry =
      (await page.getByTestId("mode-lobby").getAttribute("data-mode-id")) ===
      mode
    await click("Trở về hành trình")
    await world()
    check(
      `Completion ${mode} action uses safe checkpoint/return without grants`,
      validEntry &&
        (await raw()) === checkpoint &&
        (await save()).economy.teamExperience === 345 &&
        (await save()).economy.receipts.length === 5 &&
        (await summary.isVisible()),
    )
  }
  const branchContext = await browser.newContext({ reducedMotion: "reduce" }),
    branch = await branchContext.newPage()
  watch(branch)
  await branch.goto(url)
  await branch.evaluate(
    ({ key, readyEnding }) => localStorage.setItem(key, readyEnding),
    { key, readyEnding },
  )
  await branch.reload()
  await branch.locator("canvas[data-party-size='1']").waitFor()
  await branch.getByTestId("world-map").focus()
  await branch.keyboard.press("e")
  await branch
    .getByRole("button", { name: "Mời cả làng dùng bữa", exact: true })
    .click()
  await branch.getByRole("dialog").waitFor({ state: "hidden" })
  const share = await branch.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    key,
  )
  check(
    "Alternate ending branches from exact earned checkpoint and gets same final reward",
    share.progress.questIndex === 4 &&
      share.progress.endingChoice === "share" &&
      share.economy.teamExperience === 345 &&
      share.economy.receipts.length === 5,
  )
  check(
    "Alternate saved ending displays its own summary without a new reward",
    (await branch.getByTestId("demo-ending").textContent()).includes(
      "Mời cả làng dùng bữa",
    ) &&
      (await branch.getByTestId("demo-complete").textContent()).includes(
        "345 EXP",
      ),
  )
  await branchContext.close()
  if (values.room)
    await roomAfterEnding({ page, check, go, interact, raw, save })
  if (values.rematch || values.room)
    await rematchAfterEnding({
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
    })
  check(
    "All five legacy keys remain byte-identical throughout the combined journey",
    await page.evaluate(
      (legacy) =>
        Object.entries(legacy).every(
          ([key, value]) => localStorage.getItem(key) === value,
        ),
      legacy,
    ),
  )
  if (journey) sceneEvidence = await journey.afterJourney()
  if (errors.length) console.error(errors)
  check(
    "No unexpected combined console/page/resource errors",
    errors.length === 0,
  )
  await writeFile(
    `${out}/${flavor}-demo.json`,
    JSON.stringify(
      {
        status: "PASS",
        task: values.journey
          ? "AW2-006H/J/K"
          : values.room
            ? "AW2-006B"
            : values.rematch
              ? "AW2-007M"
              : withCollection
                ? "AW2-007L"
                : "AW2-010B",
        flavor,
        engine: browser.version(),
        checks,
        errors,
        expectedErrors,
        requests,
        sceneEvidence,
        modes,
        earnedChain,
        bossTick,
        checkpointRaw: await raw(),
        final: {
          experience: done.economy.teamExperience,
          receipts: done.economy.receipts,
          ending: done.progress.endingChoice,
        },
        scope: earnedChain
          ? "Composite earned native journey + exact checkpoint continuation; no single uninterrupted full-story run or independent human/device/art/release approval"
          : "Fresh earned web demo with reference assets; automated combined acceptance, no independent human/device/art/release approval",
      },
      null,
      2,
    ) + "\n",
  )
  console.log(JSON.stringify({ status: "PASS", flavor, checks: checks.length }))
} catch (cause) {
  await mkdir(out, { recursive: true })
  await page
    ?.screenshot({ path: `${out}/${flavor}-failure.png`, fullPage: true })
    .catch(() => {})
  await writeFile(
    `${out}/${flavor}-demo.json`,
    JSON.stringify(
      {
        status: "FAIL",
        flavor,
        checks,
        errors,
        expectedErrors,
        requests,
        sceneEvidence,
        modes,
        earnedChain,
        bossTick,
        observedRaw: await page
          ?.evaluate((key) => localStorage.getItem(key), key)
          .catch(() => null),
        failure: String(cause),
      },
      null,
      2,
    ) + "\n",
  )
  throw cause
} finally {
  await browser?.close()
  await server.close()
}
