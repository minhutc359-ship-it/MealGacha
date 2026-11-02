import assert from "node:assert/strict"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { createHash } from "node:crypto"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"
import { tapWorldPoint } from "./aw2-world-browser-view.mjs"
const { values } = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
    compiled: { type: "boolean", default: false },
    "resume-memories": { type: "string" },
  },
})
const flavor = values.compiled ? "compiled" : "source",
  port = values.compiled ? 8591 : 8590,
  out = ".asset-work/aw2-006p",
  key = "aw2.development.save",
  url = `http://127.0.0.1:${port}/dev/aw2/world.html`
const settlement = JSON.parse(
  await readFile("src/aw2/assets/settlement-v1.json", "utf8"),
)
const ambient = JSON.parse(
  await readFile("src/aw2/assets/ambient-motion-v1.json", "utf8"),
)
const manifest = JSON.parse(
  await readFile("src/aw2/assets/npc-idle-v1.json", "utf8"),
)
const checks = [],
  errors = [],
  expectedErrors = [],
  requests = [],
  captures = [],
  motionEvidence = [],
  origins = [],
  snapshots = []
const legacy = {
  "foodchest.user.v1": "006o-original-user",
  "foodchest.tcg.v1": "006o-original-cards",
  "foodchest.tcg.v1.checkpoint.v4": "006o-checkpoint",
  "mealgacha.progress-journal.v4": "006o-journal",
  "mealgacha.progress-writer.v4": "006o-writer",
}
const check = (name, ok = true) => {
  assert.ok(ok, name)
  checks.push(name)
  console.log(name)
}
const hash = (s) => createHash("sha256").update(s).digest("hex")
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
let browser,
  page,
  phase = "bootstrap",
  fault = ""
try {
  if (!values.compiled) await server.listen()
  await mkdir(out, { recursive: true })
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
    hasTouch: true,
    reducedMotion: "no-preference",
  })
  await context.addInitScript(() => {
    window.__npcWrites = 0
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (k, v) {
      if (k === "aw2.development.save") window.__npcWrites++
      return set.call(this, k, v)
    }
  })
  const watch = (p) => {
    p.on("request", (r) => requests.push(new URL(r.url()).pathname))
    p.on("pageerror", (e) => errors.push(e.message))
    p.on("console", (m) => {
      if (m.type() === "error")
        (fault &&
        /404|Failed to load|Error loading|Could not load/.test(m.text())
          ? expectedErrors
          : errors
        ).push(m.text())
      if (
        m.type() === "warning" &&
        /\[Assets\].*destroyed instead of unloaded|\[Cache\] already has key/.test(
          m.text(),
        )
      )
        errors.push(m.text())
    })
    p.on("response", (r) => {
      if (r.status() >= 400)
        (fault && new URL(r.url()).pathname === fault
          ? expectedErrors
          : errors
        ).push(`${r.status()} ${r.url()}`)
    })
  }
  page = await context.newPage()
  watch(page)
  const raw = () => page.evaluate((k) => localStorage.getItem(k), key),
    save = async () => JSON.parse(await raw()),
    map = () => page.getByTestId("world-map"),
    canvas = () => map().locator("canvas"),
    npcState = async () =>
      JSON.parse(await canvas().getAttribute("data-npc-motion")),
    ambientState = async () =>
      JSON.parse(await canvas().getAttribute("data-ambient-motion")),
    writes = () => page.evaluate(() => window.__npcWrites)
  const ready = async () => {
    await page.waitForFunction(() => {
      const c = document.querySelector('[data-testid="world-map"] canvas'),
        p = JSON.parse(localStorage.getItem("aw2.development.save"))?.progress
      return (
        c?.dataset.worldCamera &&
        c.dataset.sceneId.startsWith(
          `aw2-environment-${p.zoneId.replace("aw2-zone-", "")}-`,
        ) &&
        (c.dataset.npcMotion ||
          ["aw2-zone-kitchen-hearth", "aw2-zone-kitchen-table"].includes(
            p.zoneId,
          )) &&
        c.dataset.partyIds === JSON.stringify([p.partyIds[0] ?? "aw2-than"])
      )
    })
    await map().locator(".aw2-map-loading").waitFor({ state: "hidden" })
  }
  const arrive = (x, y) =>
    page.waitForFunction(
      ({ x, y }) => {
        const m = document
          .querySelector('[data-testid="player-position"]')
          ?.textContent.match(/Vị trí (\d+), (\d+)/)
        return m && Math.abs(+m[1] - x) <= 1 && Math.abs(+m[2] - y) <= 1
      },
      { x, y },
    )
  const go = async (x, y) => {
    await ready()
    await tapWorldPoint(page, x, y)
    await arrive(x, y)
  }
  const click = (name) =>
    page.getByRole("button", { name, exact: true }).click()
  const interact = async (action) => {
    await map().focus()
    await page.keyboard.press("e")
    await page.getByRole("dialog").waitFor()
    if (action) {
      await page
        .getByRole("dialog")
        .getByRole("button", { name: action, exact: true })
        .click()
      await page.getByRole("dialog").waitFor({ state: "hidden" })
    }
  }
  const travel = async (x, name) => {
    await go(x, 192)
    await interact("Đi qua")
    await page.getByTestId("zone-name").filter({ hasText: name }).waitFor()
    await ready()
  }
  const view = async (mode) => {
    await click(mode === "overview" ? "Toàn cảnh" : "Bám nhân vật")
    await page.waitForFunction(
      (mode) =>
        JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas').dataset
            .worldCamera,
        ).mode === mode,
      mode,
    )
  }
  const capture = async (name) => {
    await map().scrollIntoViewIfNeeded()
    const path = `${out}/${flavor}-${name}.png`
    await map().screenshot({ path })
    captures.push(path)
  }
  const savePosition = async () => {
    await click("Lưu vị trí")
    await page
      .getByRole("status")
      .filter({ hasText: "Đã lưu vị trí AW2." })
      .waitFor()
  }
  const observeZone = async (zone, npcs) => {
    phase = `motion-${zone}`
    await ready()
    await page.emulateMedia({ reducedMotion: "no-preference" })
    const before = await raw(),
      count = await writes()
    const ambientRegion = ambient.regions.find(
      (r) => r.zoneId === `aw2-zone-${zone}`,
    )
    await page.waitForFunction(() =>
      document
        .querySelector('[data-testid="world-map"] canvas')
        ?.hasAttribute("data-ambient-motion"),
    )
    if (ambientRegion) {
      const first = await ambientState()
      check(
        `${zone}: exact ambient anchors/sizes/depth render from manifest`,
        first.length === ambientRegion.placements.length &&
          first.every((item) => {
            const expected = ambientRegion.placements.find(
              (placement) => placement.id === item.id,
            )
            return (
              expected &&
              item.x === expected.x &&
              item.y === expected.y &&
              Math.abs(item.width - ambientRegion.display.width) <= 0.001 &&
              Math.abs(item.height - ambientRegion.display.height) <= 0.001 &&
              item.depth === ambientRegion.depth
            )
          }),
      )
      const frames = await page.evaluate(async () => {
        const seen = new Set()
        const start = performance.now()
        while (performance.now() - start < 3400) {
          const state = JSON.parse(
            document.querySelector('[data-testid="world-map"] canvas').dataset
              .ambientMotion,
          )
          state.forEach((item) => seen.add(item.frame))
          await new Promise(requestAnimationFrame)
        }
        return [...seen]
      })
      check(
        `${zone}: all four authored ambient frames advance in rendered sprites`,
        ["calm", "lift", "bright", "settle"].every((frame) =>
          frames.includes(frame),
        ),
      )
    } else {
      check(
        `${zone}: unauthored region renders and requests no ambient layer`,
        (await ambientState()).length === 0,
      )
    }
    const region = settlement.regions.find(
      (r) => r.zoneId === `aw2-zone-${zone}`,
    )
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="world-map"] canvas').dataset
          .settlement,
    )
    const buildings = JSON.parse(await canvas().getAttribute("data-settlement"))
    check(
      `${zone}: all ${region.buildings.length} architecture instances use authored atlases with live NPCs`,
      buildings.length === region.buildings.length &&
        buildings.every(
          (b) =>
            region.buildings.some((expected) => expected.id === b.id) &&
            b.width > 0 &&
            b.height > 0,
        ) &&
        npcs.length === (await npcState()).length,
    )
    check(
      `${zone}: default follow view reveals neighborhood at0.65zoom`,
      JSON.parse(await canvas().getAttribute("data-world-camera")).zoom ===
        0.65,
    )
    for (const point of region.landmarks) {
      const button = page.getByTestId(`settlement-landmark-${point.id}`)
      await button.focus()
      await button.press("Enter")
      await arrive(point.x, point.y)
      check(
        `${zone}: ${point.id} landmark is walk-only/focus-return/no write`,
        (await map().evaluate((e) => e === document.activeElement)) &&
          (await page.getByRole("dialog").count()) === 0 &&
          (await raw()) === before &&
          (await writes()) === count,
      )
    }
    const roofId =
      zone === "lantern-street"
        ? "street-chess-house"
        : zone === "covenant-village"
          ? "village-playground"
          : "yard-playground"
    await go(zone === "lantern-street" ? 432 : 320, 364)
    await page.waitForFunction(
      (id) =>
        JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas').dataset
            .settlement,
        ).find((b) => b.id === id).alpha === 0.25,
      roofId,
    )
    check(
      `${zone}: real overlap fades architectural overhang without changing collision`,
      JSON.parse(await canvas().getAttribute("data-settlement")).find(
        (b) => b.id === roofId,
      ).alpha === 0.25 && (await raw()) === before,
    )
    await go(320, 192)
    await page.waitForFunction(
      (id) =>
        JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas').dataset
            .settlement,
        ).find((b) => b.id === id).alpha === 1,
      roofId,
    )
    check(
      `${zone}: leaving overhang restores solid architecture`,
      (await raw()) === before,
    )
    const seen = await page.evaluate(async () => {
      const seen = {}
      const start = performance.now()
      while (performance.now() - start < 3800) {
        const c = document.querySelector('[data-testid="world-map"] canvas')
        for (const n of JSON.parse(c.dataset.npcMotion)) {
          seen[n.entityId] ??= { frames: [], samples: [] }
          if (!seen[n.entityId].frames.includes(n.frame)) {
            seen[n.entityId].frames.push(n.frame)
            seen[n.entityId].samples.push(n)
          }
        }
        await new Promise(requestAnimationFrame)
      }
      return seen
    })
    for (const n of npcs) {
      const observed = seen[n.entityId]
      check(
        `${n.entityId}: all four authored poses actually advance in rendered sprite`,
        observed?.frames.length === 4 &&
          ["neutral", "breath", "blink", "gesture"].every((f) =>
            observed.frames.includes(f),
          ),
      )
      const positions = observed.samples.map((s) => [
        s.x,
        s.y,
        s.depth,
        s.scale,
      ])
      check(
        `${n.entityId}: idle frames keep canonical feet/depth/common scale`,
        positions.every(
          (p) => JSON.stringify(p) === JSON.stringify(positions[0]),
        ) &&
          positions[0][3] === n.display.scale &&
          observed.samples.every(
            (s) => s.assetId === n.asset.id && s.width > 0 && s.height > 0,
          ),
      )
      motionEvidence.push({
        entityId: n.entityId,
        frames: observed.frames,
        samples: observed.samples,
      })
    }
    const props = JSON.parse(
      await canvas().getAttribute("data-interaction-props"),
    )
    check(
      `${zone}: animated NPC replaces static sprite exactly once and idle never writes`,
      npcs.every(
        (n) =>
          props.filter((p) => p.entityId === n.entityId).length === 1 &&
          props.find((p) => p.entityId === n.entityId).textureId === n.asset.id,
      ) &&
        (await raw()) === before &&
        (await writes()) === count,
    )
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.waitForFunction(() =>
      JSON.parse(
        document.querySelector('[data-testid="world-map"] canvas').dataset
          .npcMotion,
      ).every((n) => n.frame === "neutral"),
    )
    await page.waitForFunction(() =>
      JSON.parse(
        document.querySelector('[data-testid="world-map"] canvas').dataset
          .ambientMotion,
      ).every((item) => item.frame === "calm"),
    )
    const reduced = JSON.stringify(await npcState())
    const reducedAmbient = JSON.stringify(await ambientState())
    await page.waitForTimeout(180)
    check(
      `${zone}: reduced motion uses explicit neutral pose and freezes NPC clock without writes`,
      JSON.stringify(await npcState()) === reduced &&
        JSON.stringify(await ambientState()) === reducedAmbient &&
        (await ambientState()).every((item) => item.frame === "calm") &&
        (await raw()) === before &&
        (await writes()) === count,
    )
    await page.emulateMedia({ reducedMotion: "no-preference" })
    const clock = (await npcState())[0].elapsedMs
    await page.waitForFunction(
      (t) =>
        JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas').dataset
            .npcMotion,
        )[0].elapsedMs > t,
      clock,
    )
    check(
      `${zone}: motion resumes from frozen timeline`,
      (await raw()) === before &&
        (!ambientRegion || (await ambientState())[0].elapsedMs > 0),
    )
    for (const n of npcs) {
      const p = props.find((p) => p.entityId === n.entityId),
        button = page.getByTestId(`room-waypoint-${n.entityId}`)
      await button.focus()
      await button.press("Enter")
      await arrive(p.x, p.y + 32)
      check(
        `${n.entityId}: native keyboard approach restores map focus and grants nothing`,
        (await map().evaluate((e) => e === document.activeElement)) &&
          (await page.getByRole("dialog").count()) === 0 &&
          (await raw()) === before,
      )
    }
    const chosen = npcs[0],
      anchor = props.find((p) => p.entityId === chosen.entityId)
    await go(anchor.x, anchor.y + 32)
    await interact()
    await page.waitForTimeout(100)
    const paused = JSON.stringify(await npcState())
    const pausedAmbient = JSON.stringify(await ambientState())
    await page.waitForTimeout(250)
    check(
      `${zone}: dialogue pauses all NPC clocks and disables native navigation`,
      JSON.stringify(await npcState()) === paused &&
        JSON.stringify(await ambientState()) === pausedAmbient &&
        (await page
          .locator("nav.aw2-room-waypoints button")
          .evaluateAll((bs) => bs.every((b) => b.disabled))) &&
        (await raw()) === before,
    )
    await page.keyboard.press("Escape")
    const t = (await npcState())[0].elapsedMs
    await page.waitForFunction(
      (t) =>
        JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas').dataset
            .npcMotion,
        )[0].elapsedMs > t,
      t,
    )
    check(
      `${zone}: closing dialogue resumes animation without invoking an action`,
      (await raw()) === before,
    )
    await go(320, 240)
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 900 })
      await map().scrollIntoViewIfNeeded()
      await page.waitForTimeout(100)
      const bounds = await map().evaluate((e) => {
        const c = e.querySelector("canvas").getBoundingClientRect()
        return (
          !(document.documentElement.scrollWidth > innerWidth) &&
          [...e.querySelectorAll("[data-world-label]")]
            .filter((l) => getComputedStyle(l).visibility === "visible")
            .every((l) => {
              const b = l.getBoundingClientRect()
              return (
                b.left >= c.left - 1 &&
                b.right <= c.right + 1 &&
                b.top >= c.top - 1 &&
                b.bottom <= c.bottom + 1
              )
            })
        )
      })
      check(
        `${zone}: ${width}px animated scene labels/controls fit actual viewport`,
        bounds &&
          (await page
            .locator("nav.aw2-room-waypoints button")
            .evaluateAll((bs) =>
              bs.every((b) => b.getBoundingClientRect().height >= 44),
            )),
      )
      if ([320, 390, 768].includes(width)) {
        await capture(`${zone}-follow-${width}`)
        await view("overview")
        await capture(`${zone}-overview-${width}`)
        await view("follow")
      }
    }
    await page.setViewportSize({ width: 1280, height: 1000 })
    await go(128, 256)
    check(
      `${zone}: inverse scenic touch and animation preserve exact save`,
      (await raw()) === before,
    )
    await go(anchor.x, anchor.y + 32)
    await savePosition()
    snapshots.push({
      zone,
      raw: await raw(),
      npcIds: npcs.map((n) => n.entityId),
      origin:
        "Current-task native travel/explicit position save; no fabricated flags/party/HP.",
    })
  }
  {
    await page.goto(url)
    await page
      .getByRole("button", { name: "Tạo bản lưu AW2", exact: true })
      .waitFor()
    check(
      "Fresh profile requests no NPC image and grants no save",
      (await raw()) === null &&
        !requests.some((p) => p.includes("/assets/npcs/")) &&
        !requests.some((p) => p.includes("/environments/ambient/")),
    )
    await page.evaluate(
      (legacy) =>
        Object.entries(legacy).forEach(([k, v]) => localStorage.setItem(k, v)),
      legacy,
    )
    await click("Tạo bản lưu AW2")
    await ready()
    check(
      "Before intro one visual fallback has no owned party or XP",
      (await canvas().getAttribute("data-party-ids")) === '["aw2-than"]' &&
        (await save()).progress.partyIds.length === 0 &&
        (await save()).economy.teamExperience === 0,
    )
    check(
      "Only visited village NPC atlas loads initially",
      requests
        .filter((p) => p.includes("/assets/npcs/") && p.endsWith(".webp"))
        .every((p) => p === manifest.npc[0].asset.url),
    )
    check(
      "Only the village ambient atlas loads in the opening region",
      requests.includes(ambient.assets["village-water"].url) &&
        !requests.includes(ambient.assets["street-lantern"].url),
    )
    await observeZone(
      "covenant-village",
      manifest.npc.filter((n) => n.zoneId === "aw2-zone-covenant-village"),
    )
    await go(160, 272)
    await interact("Nhận nhiệm vụ")
    await go(160, 176)
    await interact("Đọc mảnh khăn")
    await go(160, 272)
    await interact("Hoàn tất nhập môn")
    const intro = await raw()
    await page.reload()
    await ready()
    check(
      "Animated Bà intro grants exactly five starters/30XP once and exact reload",
      (await save()).progress.partyIds.length === 5 &&
        (await save()).economy.teamExperience === 30 &&
        (await save()).economy.receipts.length === 1 &&
        (await raw()) === intro &&
        (await canvas().getAttribute("data-party-size")) === "1",
    )
    await travel(616, "Phố Đèn Lồng")
    await observeZone(
      "lantern-street",
      manifest.npc.filter((n) => n.zoneId === "aw2-zone-lantern-street"),
    )
    check(
      "Street loads its own ambient atlas after village disposal",
      requests.includes(ambient.assets["street-lantern"].url),
    )
    check(
      "Street omits obsolete static NPC atlas and unvisited yard sheet",
      !requests.includes(
        "/dev/aw2/assets/environments/lantern-street/v1/props.webp",
      ) &&
        !requests.includes(
          manifest.npc.find((n) => n.entityId === "aw2-npc-gac-bep").asset.url,
        ),
    )
    for (const [id, x, label, mode] of [
      ["ban-bai", 240, "Ghé bàn", "tcg"],
      ["ban-co", 432, "Ghé bàn", "auto-chess"],
    ]) {
      await page.getByTestId(`room-waypoint-aw2-npc-${id}`).click()
      await arrive(x, 304)
      await interact(label)
      await page.getByTestId("mode-lobby").waitFor()
      const checkpoint = await raw()
      assert.equal(
        await page.getByTestId("mode-lobby").getAttribute("data-mode-id"),
        mode,
      )
      await click("Trở về hành trình")
      await ready()
      check(
        `${id}: animated host opens actual practice and returns exact checkpoint without grants`,
        (await raw()) === checkpoint &&
          (await save()).economy.teamExperience === 30,
      )
    }
    await go(160, 144)
    await interact("Nhận nhiệm vụ")
  }
  for (const [id, x, memory] of [
    ["dem-nuoc", 504, "aw2-event-memory-bowl"],
    ["nguoi-ban", 280, "aw2-event-memory-vendor"],
    ["sua-ghe", 392, "aw2-event-memory-chair"],
  ]) {
    const already = (await save()).progress.memories.includes(memory)
    if (values["resume-memories"] && id === "dem-nuoc") continue
    await page.getByTestId(`room-waypoint-aw2-npc-${id}`).click()
    await arrive(x, 160)
    const old = await raw()
    if (!already) await interact("Ghi nhớ câu chuyện")
    // Committed save/dialog can update one render tick before the Pixi prop metadata.
    await page.waitForFunction(
      (id) =>
        JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas').dataset
            .interactionProps,
        ).find((p) => p.entityId === `aw2-npc-${id}`)?.state === "read",
      id,
    )
    const props = JSON.parse(
      await canvas().getAttribute("data-interaction-props"),
    )
    check(
      `${id}: explicit memory updates real sprite state without replacing authored animation`,
      (already ? (await raw()) === old : (await raw()) !== old) &&
        props.find((p) => p.entityId === `aw2-npc-${id}`).state === "read" &&
        props.find((p) => p.entityId === `aw2-npc-${id}`).textureId ===
          manifest.npc.find((n) => n.entityId === `aw2-npc-${id}`).asset.id,
    )
  }
  await go(160, 144)
  await interact("Người chờ")
  const street = await raw()
  await page.reload()
  await ready()
  check(
    "Three memories and An hand-in preserve real80XP/quest2 through reload",
    (await save()).progress.questIndex === 2 &&
      (await save()).progress.memories.length === 3 &&
      (await save()).economy.teamExperience === 80 &&
      (await raw()) === street,
  )
  await travel(616, "Sân Bếp Bỏ Quên")
  await observeZone(
    "forgotten-kitchen-yard",
    manifest.npc.filter((n) => n.zoneId === "aw2-zone-forgotten-kitchen-yard"),
  )
  check(
    "Animated Dì keeps actual locked east/shortcut before quest acceptance",
    (await page
      .getByTestId("room-waypoint-aw2-zone-forgotten-kitchen-yard:exit:east")
      .isDisabled()) &&
      (await page
        .getByTestId("room-waypoint-aw2-shortcut-yard-table")
        .isDisabled()),
  )
  await go(320, 160)
  await interact("Nhận nhiệm vụ")
  const yard = await raw()
  await page.reload()
  await ready()
  check(
    "Explicit Dì acceptance unlocks pantry gate once with exact reload",
    (await save()).progress.accepted &&
      (await page
        .getByTestId("room-waypoint-aw2-zone-forgotten-kitchen-yard:exit:east")
        .isEnabled()) &&
      (await raw()) === yard,
  )
  const beforePantry = requests.filter(
    (p) => p.includes("/assets/npcs/") && p.endsWith(".webp"),
  ).length
  await travel(616, "Phòng Kho")
  check(
    "Zone without NPC has no phantom animation or additional NPC request",
    (await npcState()).length === 0 &&
      requests.filter((p) => p.includes("/assets/npcs/") && p.endsWith(".webp"))
        .length === beforePantry,
  )
  await travel(24, "Sân Bếp Bỏ Quên")
  check(
    "Reciprocal transition safely recreates the original Dì motion layer",
    (await npcState()).length === 1 &&
      (await npcState())[0].entityId === "aw2-npc-gac-bep",
  )
  phase = "asset-errors"
  for (const snapshot of snapshots)
    for (const id of snapshot.npcIds) {
      const n = manifest.npc.find((n) => n.entityId === id),
        c = await browser.newContext({
          viewport: { width: 390, height: 844 },
          reducedMotion: "reduce",
        }),
        failed = await c.newPage()
      watch(failed)
      fault = n.asset.url
      await failed.route(`**${fault}`, (r) =>
        r.fulfill({ status: 404, body: "Deliberate006MrequiredNPCfailure" }),
      )
      await failed.goto(url)
      await failed.evaluate(
        ({ key, raw, legacy }) => {
          localStorage.setItem(key, raw)
          Object.entries(legacy).forEach(([k, v]) => localStorage.setItem(k, v))
        },
        { key, raw: snapshot.raw, legacy },
      )
      await failed.reload()
      await failed.getByRole("alert").filter({ hasText: "Bản đồ:" }).waitFor()
      check(
        `${id}: missing required atlas shows error/no static fallback/disabled points and exact save`,
        (await failed.getByTestId("world-map").locator("canvas").count()) ===
          0 &&
          (await failed
            .locator("nav.aw2-room-waypoints button")
            .evaluateAll(
              (bs) => bs.length > 0 && bs.every((b) => b.disabled),
            )) &&
          (await failed.evaluate((key) => localStorage.getItem(key), key)) ===
            snapshot.raw,
      )
      await failed.unroute(`**${fault}`)
      fault = ""
      await failed.reload()
      await failed.waitForFunction(
        (id) =>
          JSON.parse(
            document.querySelector('[data-testid="world-map"] canvas')?.dataset
              .npcMotion ?? "[]",
          ).some((n) => n.entityId === id && n.frame === "neutral"),
        id,
      )
      await failed
        .getByTestId("world-map")
        .locator(".aw2-map-loading")
        .waitFor({ state: "hidden" })
      check(
        `${id}: resource recovery restores authored neutral pose and exact earned bytes`,
        (await failed.evaluate((key) => localStorage.getItem(key), key)) ===
          snapshot.raw,
      )
      await c.close()
    }
  phase = "ending-baa"
  const endingPath = `docs/aw2/evidence/AW2-006HJK-${flavor}-preending.json`,
    endingText = await readFile(endingPath, "utf8"),
    endingRaw = JSON.parse(endingText).observedRaw,
    ending = JSON.parse(endingRaw)
  assert.equal(ending.progress.questIndex, 3)
  assert.equal(ending.progress.bossDefeated, true)
  assert.equal(ending.progress.tableNoteRead, true)
  assert.equal(ending.economy.teamExperience, 205)
  origins.push({
    path: endingPath,
    reportSha256: hash(endingText),
    rawSha256: hash(endingRaw),
    retainedAssertions: 0,
    scope:
      "Historical actual earned boss+note checkpoint only; all ending/NPC checks fresh, no historical assertion counts.",
  })
  for (const [action, choice] of [
    ["Để ghế trống chờ", "wait"],
    ["Mời cả làng dùng bữa", "share"],
  ]) {
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
      key,
      raw: endingRaw,
    })
    await page.reload()
    await ready()
    await go(160, 272)
    await interact(action)
    const done = await raw()
    await page.reload()
    await ready()
    const s = await save()
    check(
      `Animated Bà ${choice} ending uses actual once-only345XP/5receipts and exact reload`,
      s.progress.questIndex === 4 &&
        s.progress.endingChoice === choice &&
        s.economy.teamExperience === 345 &&
        s.economy.receipts.length === 5 &&
        (await raw()) === done,
    )
    const props = JSON.parse(
      await canvas().getAttribute("data-interaction-props"),
    )
    check(
      `Bà ${choice} completed state retains authored motion and one saved leader`,
      props.find((p) => p.entityId === "aw2-npc-giu-cho").state ===
        "completed" &&
        (await npcState())[0].entityId === "aw2-npc-giu-cho" &&
        (await canvas().getAttribute("data-party-size")) === "1",
    )
  }
  phase = "completed-six-zones"
  const completedEconomy = JSON.stringify((await save()).economy)
  for (const name of [
    "Phố Đèn Lồng",
    "Sân Bếp Bỏ Quên",
    "Phòng Kho",
    "Phòng Lửa",
    "Phòng Bàn",
  ]) {
    await travel(616, name)
    const state = await save(),
      drawn = JSON.parse(
        (await canvas().getAttribute("data-settlement")) ?? "[]",
      ),
      region = settlement.regions.find(
        (r) => r.zoneId === state.progress.zoneId,
      )
    check(
      `Completed native travel to ${name} keeps correct architecture and exact economy`,
      drawn.length === (region?.buildings.length ?? 0) &&
        state.progress.partyIds.length === 5 &&
        state.progress.questIndex === 4 &&
        JSON.stringify(state.economy) === completedEconomy,
    )
  }
  for (const name of [
    "Phòng Lửa",
    "Phòng Kho",
    "Sân Bếp Bỏ Quên",
    "Phố Đèn Lồng",
    "Làng Giao Ước",
  ]) {
    await travel(24, name)
    check(
      `Completed reciprocal return to ${name} keeps economy/ending`,
      JSON.stringify((await save()).economy) === completedEconomy &&
        (await save()).progress.endingChoice === "share",
    )
  }
  phase = "architecture-errors"
  const village = snapshots.find((s) => s.zone === "covenant-village")
  for (const asset of Object.values(settlement.assets)) {
    const c = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
      }),
      failed = await c.newPage()
    watch(failed)
    fault = asset.url
    await failed.route(`**${fault}`, (r) =>
      r.fulfill({ status: 404, body: "Deliberate006Oarchitecturefailure" }),
    )
    await failed.goto(url)
    await failed.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
      key,
      raw: village.raw,
    })
    await failed.reload()
    await failed.getByRole("alert").filter({ hasText: "Bản đồ:" }).waitFor()
    check(
      `${asset.id}: missing required architecture reports error/no fallback/disabled all points/exactsave`,
      (await failed.getByTestId("world-map").locator("canvas").count()) === 0 &&
        (await failed
          .locator("nav.aw2-room-waypoints button")
          .evaluateAll((bs) => bs.length > 0 && bs.every((b) => b.disabled))) &&
        (await failed.evaluate((key) => localStorage.getItem(key), key)) ===
          village.raw,
    )
    await failed.unroute(`**${fault}`)
    fault = ""
    await failed.reload()
    await failed.waitForFunction(
      () =>
        JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas')?.dataset
            .settlement ?? "[]",
        ).length === 10,
    )
    check(
      `${asset.id}: recovered architecture restores complete scene and exactsave`,
      (await failed.evaluate((key) => localStorage.getItem(key), key)) ===
        village.raw,
    )
    await c.close()
  }
  phase = "ambient-errors"
  for (const region of ambient.regions) {
    const asset = ambient.assets[region.asset],
      zone = region.zoneId.replace("aw2-zone-", ""),
      snapshot = snapshots.find((s) => s.zone === zone),
      c = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
      }),
      failed = await c.newPage()
    watch(failed)
    fault = asset.url
    await failed.route(`**${fault}`, (r) =>
      r.fulfill({ status: 404, body: "Deliberate006Pambientfailure" }),
    )
    await failed.goto(url)
    await failed.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
      key,
      raw: snapshot.raw,
    })
    await failed.reload()
    await failed.getByRole("alert").filter({ hasText: "Bản đồ:" }).waitFor()
    check(
      `${asset.id}: missing ambient reports visible error/disabled points/exact save`,
      (await failed.getByTestId("world-map").locator("canvas").count()) === 0 &&
        (await failed
          .locator("nav.aw2-room-waypoints button")
          .evaluateAll((bs) => bs.length > 0 && bs.every((b) => b.disabled))) &&
        (await failed.evaluate((key) => localStorage.getItem(key), key)) ===
          snapshot.raw,
    )
    await failed.unroute(`**${fault}`)
    fault = ""
    await failed.reload()
    await failed.waitForFunction(
      (count) =>
        JSON.parse(
          document.querySelector('[data-testid="world-map"] canvas')?.dataset
            .ambientMotion ?? "[]",
        ).length === count,
      region.placements.length,
    )
    check(
      `${asset.id}: recovered ambient restores all placements and exact save`,
      (await failed.evaluate((key) => localStorage.getItem(key), key)) ===
        snapshot.raw,
    )
    await c.close()
  }
  check(
    "All eight NPCs have actual four-frame evidence",
    motionEvidence.length === 8 &&
      new Set(motionEvidence.map((m) => m.entityId)).size === 8,
  )
  check(
    "All stable legacy keys remain byte-identical",
    await page.evaluate(
      (legacy) =>
        Object.entries(legacy).every(([k, v]) => localStorage.getItem(k) === v),
      legacy,
    ),
  )
  check("No unexpected page/console/resource errors", errors.length === 0)
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-006P",
        status: "PASS",
        flavor,
        checks,
        retainedAssertions: origins.reduce(
          (sum, o) => sum + o.retainedAssertions,
          0,
        ),
        freshAssertions:
          checks.length -
          origins.reduce((sum, o) => sum + o.retainedAssertions, 0),
        errors,
        expectedErrors,
        requests,
        captures,
        motionEvidence,
        origins,
        snapshots: snapshots.map((s) => ({ ...s, rawSha256: hash(s.raw) })),
        checkpointRaw: await raw(),
        limitations:
          "Fresh source/compiled developer acceptance for006N ambient plus inherited settlement route. No full uninterrupted boss journey/independent human/physical device/rights acceptance.",
      },
      null,
      2,
    ) + "\n",
  )
} catch (error) {
  console.error(error)
  await page
    ?.screenshot({ path: `${out}/${flavor}-failed.png`, fullPage: true })
    .catch(() => {})
  await writeFile(
    `${out}/${flavor}-browser.json`,
    JSON.stringify(
      {
        task: "AW2-006P",
        status: "FAIL",
        flavor,
        phase,
        checks,
        retainedAssertions: origins.reduce(
          (sum, o) => sum + o.retainedAssertions,
          0,
        ),
        freshAssertions:
          checks.length -
          origins.reduce((sum, o) => sum + o.retainedAssertions, 0),
        errors,
        expectedErrors,
        motionEvidence,
        origins,
        snapshots,
        error: String(error),
        observedRaw: await page
          ?.evaluate((key) => localStorage.getItem(key), key)
          .catch(() => null),
      },
      null,
      2,
    ) + "\n",
  )
  process.exitCode = 1
} finally {
  await browser?.close()
  await server.close()
}
