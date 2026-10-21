import assert from "node:assert/strict"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"

const { values } = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
    compiled: { type: "boolean", default: false },
    spirit: { type: "string", default: "aw2-than" },
    "combat-only": { type: "boolean", default: false },
    "reuse-originals": { type: "boolean", default: false },
  },
})
assert.ok(
  ["aw2-than", "aw2-lua", "aw2-lam", "aw2-moc-non"].includes(values.spirit),
  "Supported authored motion spirit",
)
const slug = values.spirit.slice(4)
const task = {
  than: "AW2-004C",
  lua: "AW2-004D",
  lam: "AW2-004E",
  "moc-non": "AW2-004F",
}[slug]
const { chromium } = await import(values.playwright)
const port = values.compiled ? 8465 : 8464
const flavor = values.compiled ? "compiled" : "source"
const server = values.compiled
  ? await preview({
      configFile: "dev/vite.aw2.config.ts",
      preview: { host: "127.0.0.1", port, strictPort: true },
    })
  : await createServer({
      configFile: "dev/vite.dev.config.ts",
      server: { host: "127.0.0.1", port, strictPort: true },
    })
const manifest = JSON.parse(
  await readFile(`src/aw2/assets/${slug}.base-v1.json`, "utf8"),
)
const out = `.asset-work/${task.toLowerCase()}`,
  previewEntry =
    slug === "than" ? "than.html" : `starters.html?spirit=${values.spirit}`,
  motionKeys = Object.keys(manifest.assets).filter((key) =>
    key.startsWith("battle-motion-"),
  ),
  root = `http://127.0.0.1:${port}`
let confirmedContacts = []
let audio = []
const checks = [],
  errors = [],
  timelines = {},
  requests = new Set()
const stable = {
  "foodchest.tcg.v1": "stable-cards",
  "foodchest.user.v1": "stable-user",
  "aw2.development.save": "preserve-exact-original-bytes",
}
let browser, page
const check = (name, value = true) => {
  assert.ok(value, name)
  checks.push(name)
  console.log(name)
}
try {
  if (!values.compiled) await server.listen()
  browser = await chromium.launch({
    executablePath: values.chromium,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    reducedMotion: "no-preference",
  })
  await context.addInitScript((stable) => {
    Object.entries(stable).forEach(([key, value]) =>
      localStorage.setItem(key, value),
    )
    window.__motionDraws = {}
    const draw = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      const image = args[0]
      if (
        image instanceof HTMLImageElement &&
        image.src.includes("/aw2/assets/")
      ) {
        const record = window.__motionDraws[image.src] ?? {
          draws: 0,
          invalid: 0,
        }
        record.draws++
        if (
          args.length !== 9 ||
          args[1] < 0 ||
          args[2] < 0 ||
          args[1] + args[3] > image.naturalWidth ||
          args[2] + args[4] > image.naturalHeight
        )
          record.invalid++
        window.__motionDraws[image.src] = record
      }
      return draw.apply(this, args)
    }
  }, stable)
  page = await context.newPage()
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("response", (response) => {
    if (response.url().includes("/aw2/assets/"))
      requests.add(new URL(response.url()).pathname)
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`)
  })
  await mkdir(out, { recursive: true })
  if (!values["combat-only"]) {
    await page.goto(`${root}/dev/aw2/${previewEntry}`)
    await page
      .getByTestId("atlas-state")
      .filter({ hasText: "Atlas đã tải" })
      .waitFor()
    check(
      `${manifest.displayName} preview declares four-cel reference motion without full-character approval`,
      (await page.locator("main").innerText()).includes(
        "mỗi trạng thái có bốn khung hình riêng",
      ),
    )
    for (const [state, clip] of Object.entries(manifest.battle)) {
      await page.getByTestId(`state-${state}`).click()
      const seen = await page.evaluate(
        async ({ state, duration }) => {
          const frames = new Set()
          const start = performance.now()
          await new Promise((resolve) => {
            const poll = () => {
              const frame = document.querySelector("canvas").dataset.frame
              if (frame.startsWith(`battle.${state}.`)) frames.add(frame)
              if (performance.now() - start >= duration + 150) resolve()
              else requestAnimationFrame(poll)
            }
            poll()
          })
          return [...frames].sort()
        },
        { state, duration: clip.durationMs },
      )
      timelines[state] = seen
      check(
        `${state}: browser draws all four declared distinct cels`,
        JSON.stringify(seen) ===
          JSON.stringify(
            [
              ...new Set(
                clip.frames
                  .map((key) => key.frame)
                  .filter((frame) => frame.startsWith(`battle.${state}.`)),
              ),
            ].sort(),
          ),
      )
      await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
      const time = await page.locator("canvas").getAttribute("data-elapsed")
      await page.waitForTimeout(100)
      check(
        `${state}: preview pause freezes authored timeline`,
        (await page.locator("canvas").getAttribute("data-elapsed")) === time,
      )
      await page
        .locator("canvas")
        .screenshot({ path: `${out}/${flavor}-${state}.png` })
    }
    if (slug === "lua") {
      await page.getByTestId("skill-basic").click()
      await page.waitForFunction(() => {
        const data = document.querySelector("canvas").dataset
        return (
          data.frame === "battle.idle.0" &&
          +data.elapsed >= 800 &&
          data.events === "2" &&
          data.cues === "2"
        )
      })
      check(
        "Full Lua preview crosses exactly two authored contacts and two FX/audio cues",
        (await page.locator("canvas").getAttribute("data-events")) === "2" &&
          (await page.locator("canvas").getAttribute("data-cues")) === "2" &&
          (await page.getByTestId("contact-cue").innerText()).includes("380ms"),
      )
    }
    if (slug === "lam" || slug === "moc-non") {
      await page.getByTestId("skill-basic").click()
      const flight = await page.evaluate(async () => {
        const samples = [],
          start = performance.now()
        await new Promise((resolve) => {
          const poll = () => {
            const d = document.querySelector("canvas").dataset
            samples.push({ time: +d.elapsed, flight: d.projectile, fx: d.fx })
            if (+d.elapsed >= 950 && d.frame === "battle.attack.3") resolve()
            else if (performance.now() - start > 4000) resolve()
            else requestAnimationFrame(poll)
          }
          poll()
        })
        return samples
      })
      check(
        `${manifest.displayName} reference flight stays between launch260 and impact700; separate impact art follows`,
        flight.some(
          (s) =>
            s.flight?.startsWith("fx.basic.") && s.time >= 260 && s.time < 700,
        ) &&
          flight.some((s) => s.fx === "fx.basic.2" && s.time >= 700) &&
          flight
            .filter((s) => s.flight?.startsWith("fx.basic."))
            .every((s) => s.time >= 260 && s.time < 700),
      )
    }
    if (slug === "lam") {
      await page.getByTestId("skill-ultimate").click()
      await page.waitForFunction(() => {
        const d = document.querySelector("canvas").dataset
        return (
          d.frame === "battle.ultimate.3" &&
          +d.elapsed >= 1200 &&
          d.events === "2" &&
          d.cues === "2"
        )
      })
      check(
        "Lam reference ultimate crosses exactly two markers/cues at520/1040",
        (await page.getByTestId("contact-cue").innerText()).includes("1040ms"),
      )
    }
    await page
      .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
      .check()
    await page.getByTestId("state-attack").click()
    await page.waitForFunction(() => {
      const data = document.querySelector("canvas").dataset
      return data.frame === "battle.attack" && data.fx === ""
    })
    const staticPixels = await page
      .locator("canvas")
      .evaluate((canvas) => canvas.toDataURL())
    await page.waitForTimeout(200)
    check(
      "Reduced motion holds the preserved authored attack pose",
      (await page
        .locator("canvas")
        .evaluate((canvas) => canvas.toDataURL())) === staticPixels,
    )
    if (!values["reuse-originals"]) {
      audio = await page.evaluate(async (slug) => {
        const context = new AudioContext(),
          durations = []
        try {
          for (const slot of ["basic", "auto", "passive", "ultimate"]) {
            const response = await fetch(
              `/dev/aw2/assets/${slug}/base-v1/${slot}.wav`,
            )
            assertResponse(response)
            durations.push(
              (await context.decodeAudioData(await response.arrayBuffer()))
                .duration,
            )
          }
          return durations
        } finally {
          await context.close()
        }
        function assertResponse(response) {
          if (!response.ok) throw Error("Missing authored WAV")
        }
      }, slug)
      check(
        "Four existing authored WAV cues decode; audio remains opt-in",
        audio.length === 4 &&
          audio.every((value) => value > 0.1) &&
          !(await page
            .getByRole("checkbox", { name: "Bật âm thanh", exact: true })
            .isChecked()),
      )
      await page
        .getByRole("button", { name: "World / chibi", exact: true })
        .click()
      for (const direction of ["down", "left", "right", "up"]) {
        await page.getByTestId(`direction-${direction}`).click()
        await page.waitForFunction(
          (direction) =>
            document
              .querySelector("canvas")
              .dataset.frame.startsWith(`world.${direction}.`),
          direction,
        )
        check(`Preserved ${direction} world sprite resolves`)
      }
    }
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 900 })
      check(
        `Preview controls fit ${width}px`,
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      )
    }
    await page.screenshot({
      path: `${out}/${flavor}-mobile.png`,
      fullPage: true,
    })
    await page.setViewportSize({ width: 1280, height: 1000 })
  }
  await page.goto(`${root}/dev/aw2/battle.html`)
  await page
    .getByTestId("battle-atlas-state")
    .filter({ hasText: "Năm atlas chiến đấu đã tải" })
    .waitFor()
  await page.waitForFunction(
    (url) =>
      Object.keys(window.__motionDraws).some((path) => path.endsWith(url)),
    manifest.assets[motionKeys[0]].url,
  )
  check(`Actual five-unit combat draws ${manifest.displayName} motion atlas`)
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click()
  const before = await page.locator("canvas").getAttribute("data-motion-time")
  await page.waitForTimeout(250)
  check(
    "Combat pause freezes presentation clock across RAFs",
    (await page.locator("canvas").getAttribute("data-motion-time")) === before,
  )
  const tick = await page.locator("canvas").getAttribute("data-tick")
  await page.getByRole("button", { name: "Bước 1 nhịp", exact: true }).click()
  await page.waitForFunction(
    (tick) => +document.querySelector("canvas").dataset.tick === +tick + 1,
    tick,
  )
  check(
    "Explicit paused step advances rules once while presentation remains frozen",
    (await page.locator("canvas").getAttribute("data-motion-time")) === before,
  )
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click()
  await page.waitForFunction(
    (before) =>
      +document.querySelector("canvas").dataset.motionTime > +before + 150,
    before,
  )
  check("Resume continues presentation time")
  if (slug === "lua") {
    await page.evaluate(() => {
      window.__luaContacts = []
      const poll = () => {
        const canvas = document.querySelector("canvas")
        const contacts = JSON.parse(canvas?.dataset.actorContacts ?? "{}")
        const poses = JSON.parse(canvas?.dataset.actorPoses ?? "{}")
        const beat = contacts["player-aw2-lua"]
        if (
          beat?.fx &&
          beat.atMs !== null &&
          !window.__luaContacts.some(
            (entry) => entry.serial === beat.serial && entry.fx === beat.fx,
          )
        )
          window.__luaContacts.push({ ...beat, pose: poses["player-aw2-lua"] })
        requestAnimationFrame(poll)
      }
      poll()
    })
    await page.waitForFunction(
      () =>
        window.__luaContacts.some((entry) => entry.index === 0) &&
        window.__luaContacts.some((entry) => entry.index === 1),
      null,
      { timeout: 25000 },
    )
    confirmedContacts = await page.evaluate(() => window.__luaContacts)
    check(
      "Actual Lua combat presents both confirmed beats using their own FX cue",
      confirmedContacts.every(
        (entry) => entry.atMs === (entry.index === 0 ? 220 : 380),
      ),
    )
    check(
      "Actual first-hit visuals never jump to the second unconfirmed punch",
      confirmedContacts
        .filter((entry) => entry.index === 0)
        .every((entry) => entry.pose !== "battle.attack.3"),
    )
  }
  if (slug === "lam") {
    await page.evaluate(() => {
      window.__lamContacts = []
      window.__lamPreparation = []
      const poll = () => {
        const c = document.querySelector("canvas"),
          d = c?.dataset
        const cue = JSON.parse(d?.actorCues ?? "{}")["player-aw2-lam"]
        if (cue?.phase === "prepare" || cue?.phase === "launch")
          window.__lamPreparation.push({ ...cue, tick: +d.tick })
        for (const beat of JSON.parse(d?.actorEffects ?? "{}")[
          "player-aw2-lam"
        ] ?? []) {
          if (
            beat.fx &&
            !window.__lamContacts.some(
              (e) => e.serial === beat.serial && e.fx === beat.fx,
            )
          )
            window.__lamContacts.push({ ...beat, tick: +d.tick })
        }
        requestAnimationFrame(poll)
      }
      poll()
    })
    await page.getByTestId("ultimate-aw2-lam").click()
    await page.waitForFunction(
      () => {
        const e = window.__lamContacts
        return (
          e.some((e) => e.skillId === "aw2-lam:skill:basic") &&
          [0, 1].every((i) =>
            e.some(
              (e) => e.skillId === "aw2-lam:skill:ultimate" && e.index === i,
            ),
          )
        )
      },
      null,
      { timeout: 30000 },
    )
    confirmedContacts = await page.evaluate(() => window.__lamContacts)
    const heal = confirmedContacts.filter(
      (e) => e.skillId === "aw2-lam:skill:ultimate",
    )
    check(
      "Actual Lam ultimate has one confirmed visual cue per rules pulse across ally recipients",
      new Set(heal.map((e) => e.serial)).size === 2 &&
        heal.every((e) => e.atMs === (e.index === 0 ? 520 : 1040)),
    )
    check(
      "First confirmed healing gesture never reaches unconfirmed second pose",
      heal
        .filter((e) => e.index === 0)
        .every((e) => e.pose !== "battle.ultimate.3"),
    )
    check(
      "Actual Lam basic uses only target-owned impact frames",
      confirmedContacts
        .filter((e) => e.skillId === "aw2-lam:skill:basic")
        .every(
          (e) =>
            ["fx.basic.2", "fx.basic.3"].includes(e.fx) &&
            e.targetId &&
            e.atMs === 700,
        ),
    )
    check(
      "Actual cast/flight never emit premature impact/healing FX",
      await page.evaluate(
        () =>
          window.__lamPreparation.length > 0 &&
          window.__lamPreparation.every((e) => e.fx === ""),
      ),
    )
    await page
      .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
      .check()
    await page.waitForTimeout(500)
    check(
      "Reduced motion never revives expired confirmed healing FX",
      await page.evaluate(() => {
        const effects = JSON.parse(
          document.querySelector("canvas").dataset.actorEffects,
        )["player-aw2-lam"]
        return effects.some(
          (e) =>
            e.skillId === "aw2-lam:skill:ultimate" &&
            e.index === 1 &&
            e.fx === "",
        )
      }),
    )
  }
  if (slug === "moc-non") {
    await page.evaluate(() => {
      window.__mocContacts = []
      window.__mocPreparation = []
      window.__mocRecipients = []
      const poll = () => {
        const d = document.querySelector("canvas")?.dataset
        const cue = JSON.parse(d?.actorCues ?? "{}")["player-aw2-moc-non"]
        if (cue?.phase === "prepare" || cue?.phase === "launch")
          window.__mocPreparation.push({ ...cue, tick: +d.tick })
        const entries =
          JSON.parse(d?.actorEffects ?? "{}")["player-aw2-moc-non"] ?? []
        for (const beat of entries)
          if (
            beat.fx &&
            !window.__mocContacts.some(
              (e) => e.serial === beat.serial && e.fx === beat.fx,
            )
          )
            window.__mocContacts.push({ ...beat, tick: +d.tick })
        if (
          entries.some(
            (e) => e.skillId === "aw2-moc-non:skill:ultimate" && e.fx,
          )
        ) {
          const poses = JSON.parse(d?.actorPoses ?? "{}"),
            cues = JSON.parse(d?.actorCues ?? "{}")
          for (const [id, pose] of Object.entries(poses))
            if (
              id.startsWith("player-") &&
              id !== "player-aw2-moc-non" &&
              pose.startsWith("battle.guard") &&
              !window.__mocRecipients.some((e) => e.id === id)
            )
              window.__mocRecipients.push({
                id,
                pose,
                skillId: cues[id]?.skillId ?? null,
              })
        }
        requestAnimationFrame(poll)
      }
      poll()
    })
    await page.getByTestId("ultimate-aw2-moc-non").click()
    await page.waitForFunction(
      () =>
        ["basic", "auto", "passive", "ultimate"].every((slot) =>
          window.__mocContacts.some(
            (e) => e.skillId === `aw2-moc-non:skill:${slot}`,
          ),
        ),
      null,
      { timeout: 30000 },
    )
    confirmedContacts = await page.evaluate(() => window.__mocContacts)
    const ultimate = confirmedContacts.filter(
      (e) => e.skillId === "aw2-moc-non:skill:ultimate",
    )
    check(
      "Actual Moc ultimate emits one confirmed source effect across ally statuses",
      new Set(ultimate.map((e) => e.serial)).size === 1 &&
        ultimate.every((e) => e.atMs === 560),
    )
    check(
      "Actual Moc basic uses confirmed target impact art only",
      confirmedContacts
        .filter((e) => e.skillId === "aw2-moc-non:skill:basic")
        .every(
          (e) =>
            ["fx.basic.2", "fx.basic.3"].includes(e.fx) &&
            e.atMs === 700 &&
            e.targetId,
        ),
    )
    check(
      "Actual Moc shield FX belongs to its confirmed ally target",
      confirmedContacts
        .filter((e) => e.skillId === "aw2-moc-non:skill:auto")
        .every(
          (e) =>
            e.atMs === 420 &&
            e.targetId?.startsWith("player-") &&
            e.targetId !== "player-aw2-moc-non",
        ),
    )
    check(
      "Actual Moc passive displays only its confirmed proc cue",
      confirmedContacts
        .filter((e) => e.skillId === "aw2-moc-non:skill:passive")
        .every((e) => e.atMs === 180),
    )
    check(
      "Actual Moc preparation/flight produce no premature outcome FX",
      await page.evaluate(
        () =>
          window.__mocPreparation.length > 0 &&
          window.__mocPreparation.every((e) => e.fx === ""),
      ),
    )
    check(
      "Guard recipients keep their own actor identities without Moc source skill cues",
      await page.evaluate(
        () =>
          window.__mocRecipients.length > 0 &&
          window.__mocRecipients.every((e) => e.skillId === null),
      ),
    )
    await page
      .getByRole("checkbox", { name: "Giảm chuyển động", exact: true })
      .check()
    await page.waitForTimeout(500)
    check(
      "Reduced motion cannot revive expired confirmed Moc ultimate FX",
      await page.evaluate(() =>
        JSON.parse(document.querySelector("canvas").dataset.actorEffects)[
          "player-aw2-moc-non"
        ].some(
          (e) => e.skillId === "aw2-moc-non:skill:ultimate" && e.fx === "",
        ),
      ),
    )
  }
  await page
    .locator("canvas")
    .screenshot({ path: `${out}/${flavor}-actual-battle.png` })
  const draws = await page.evaluate(() => window.__motionDraws)
  check(
    "Decoded atlas draws stay inside actual source bounds",
    Object.values(draws).every(
      (record) => record.draws > 0 && record.invalid === 0,
    ),
  )
  check(
    "Reference/combat previews preserve every seeded save byte",
    await page.evaluate(
      (stable) =>
        Object.entries(stable).every(
          ([key, value]) => localStorage.getItem(key) === value,
        ),
      stable,
    ),
  )
  check("No unexpected primary browser or resource errors", errors.length === 0)
  if (!values["combat-only"])
    for (const motionKey of motionKeys) {
      const blocked = await browser.newContext()
      await blocked.route(`**/${motionKey}.webp`, (route) => route.abort())
      const missing = await blocked.newPage()
      await missing.goto(`${root}/dev/aw2/${previewEntry}`)
      await missing
        .getByRole("alert")
        .filter({
          hasText: `Không tải được asset ${manifest.assets[motionKey].id}`,
        })
        .waitFor()
      check(
        `Missing ${motionKey} is explicit and never replaced by geometry`,
        await missing.locator("canvas").evaluate(
          (canvas) =>
            !canvas
              .getContext("2d")
              .getImageData(0, 0, 640, 440)
              .data.some((value) => value > 0),
        ),
      )
      await blocked.close()
    }
  const resources = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((entry) => entry.name.includes("/aw2/assets/"))
      .map((entry) => ({
        path: new URL(entry.name).pathname,
        durationMs: Math.round(entry.duration),
        decodedBodySize: entry.decodedBodySize,
      })),
  )
  await writeFile(
    `${out}/${flavor}-motion.json`,
    JSON.stringify(
      {
        task,
        spiritId: manifest.spiritId,
        scope: values["combat-only"]
          ? "affected combat renderer only"
          : "affected motion/reference/combat",
        reusedEvidence:
          values["combat-only"] || values["reuse-originals"]
            ? {
                source: "cf0b39469d1fb8f7d77e18feb5e16895d70565a1",
                reason:
                  "unchanged original art/audio/world and unrelated preview/quest/save/mode/full-suite checks retained at original SHA; not counted as fresh",
              }
            : null,
        status: "PASS",
        flavor,
        engine: browser.version(),
        checks,
        errors,
        timelines,
        confirmedContacts,
        audio,
        draws,
        requestedAssets: [...requests],
        resources,
        limits: [
          "Local headless resource timings only; no device/FPS/offline performance approval",
          "Reference animation; independent art/listening/rights/final balance NOT_RUN",
        ],
      },
      null,
      2,
    ) + "\n",
  )
  console.log(JSON.stringify({ status: "PASS", flavor, checks: checks.length }))
} catch (error) {
  if (slug === "lam")
    confirmedContacts =
      (await page
        ?.evaluate(() => window.__lamContacts ?? [])
        .catch(() => [])) ?? []
  if (slug === "moc-non")
    confirmedContacts =
      (await page
        ?.evaluate(() => window.__mocContacts ?? [])
        .catch(() => [])) ?? []
  await mkdir(out, { recursive: true })
  await writeFile(
    `${out}/${flavor}-motion.json`,
    JSON.stringify(
      {
        task,
        spiritId: manifest.spiritId,
        status: "FAIL",
        flavor,
        checks,
        errors,
        timelines,
        confirmedContacts,
        failure: String(error),
      },
      null,
      2,
    ) + "\n",
  )
  await page
    ?.screenshot({ path: `${out}/${flavor}-failure.png`, fullPage: true })
    .catch(() => {})
  throw error
} finally {
  await browser?.close()
  if (values.compiled)
    await new Promise((resolve) => server.httpServer.close(resolve))
  else await server.close()
}
