import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
const { chromium, webkit } = await import(
  process.env.PLAYWRIGHT_MODULE ?? "playwright"
)
const engine = process.env.QA_ENGINE ?? "chromium",
  port = process.env.QA_PORT ?? "4196",
  base = "http://127.0.0.1:" + port,
  out = "dev/docs/web-v599"
mkdirSync(out + "/qa", { recursive: true })
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--config",
    "dev/tools/vite.pvp-qa.config.ts",
    "--host",
    "127.0.0.1",
    "--port",
    port,
    "--strictPort",
  ],
  { stdio: "pipe" },
)
let log = ""
server.stdout.on("data", (v) => (log += v))
server.stderr.on("data", (v) => (log += v))
for (let i = 0; i < 100; i++) {
  try {
    if ((await fetch(base)).ok) break
  } catch {}
  if (i === 99) throw Error(log)
  await new Promise((r) => setTimeout(r, 100))
}
const browser = await (engine === "webkit" ? webkit : chromium).launch(
  engine === "webkit"
    ? { headless: true, executablePath: process.env.WEBKIT_BIN }
    : {
        headless: true,
        executablePath: process.env.CHROMIUM_BIN,
        args: [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--use-gl=angle",
          "--use-angle=swiftshader",
          "--enable-unsafe-swiftshader",
        ],
        env: {
          ...process.env,
          LD_LIBRARY_PATH:
            process.env.CHROMIUM_LIB_DIR ?? process.env.LD_LIBRARY_PATH,
          FONTCONFIG_PATH: "/etc/fonts",
        },
      },
)
const checks = [],
  errors = [],
  missing = [],
  requests = [],
  regions = ["mistwood", "sugartower", "ashalley", "lasttable"]
function capture(p) {
  p.on("pageerror", (e) => errors.push(e.message))
  p.on("response", (r) => {
    if (r.status() >= 400) missing.push([r.url(), r.status()])
  })
  p.on("request", (r) => requests.push(new URL(r.url()).pathname))
}
async function fixture(p, region, mode = "skill", difficulty = "normal") {
  const result = await p.evaluate(
    async ({ region, mode, difficulty }) => {
      const { newGame } = await import("/src/game/progression.ts"),
        { newRpgSave, reduceRpg } = await import(
          "/src/game/adventureRpg/engine.ts"
        ),
        { RPG_STAGE_IDS } = await import("/src/game/adventureRpg/content.ts"),
        { useGameStore } = await import("/src/game/useGameStore.ts")
      const g = newGame(),
        s = newRpgSave(g)
      s.cinematics = false
      for (const id of RPG_STAGE_IDS) s.stars[id] = 1
      const started = reduceRpg(
        s,
        { type: "start", stageId: region + "-1", difficulty },
        g,
      )
      if (started.error) throw Error(started.error)
      g.adventureRpg = started.save
      const b = g.adventureRpg.run.battle
      b.id = `qa599:${region}:${mode}:${difficulty}`
      b.auto = false
      b.paused = true
      for (const a of b.actors) {
        a.nextAttack = a.nextSkill = a.nextSupport = 10000
        a.hp = a.maxHp = 50000
        a.attack = 1
        a.energy = a.side === "enemy" && mode === "skill" ? 100 : 0
        if (a.side === "enemy") {
          if (mode === "skill") a.nextSkill = 0
          if (mode === "attack") a.nextAttack = 0
        }
      }
      if (mode === "victory") {
        b.result = "loss"
        for (const a of b.actors.filter((a) => a.side === "ally")) a.hp = 0
      }
      if (mode === "fall") {
        for (const a of b.actors.filter((a) => a.side === "enemy")) {
          a.hp = 0
          a.motion = "fall"
          a.motionAt = b.tick
        }
        b.paused = true
      }
      if (!useGameStore.getState().importSave(g))
        throw Error("Canonical stage fixture rejected")
      useGameStore.getState().dismiss()
      return [
        ...new Set(b.actors.filter((a) => a.side === "enemy").map((a) => a.id)),
      ]
    },
    { region, mode, difficulty },
  )
  await p.clock.runFor(50)
  if (mode !== "victory")
    await p
      .locator(
        ".rpg-battle.presentation-enter, .rpg-battle.presentation-ready, .rpg-battle.presentation-start",
      )
      .waitFor()
  if (mode !== "victory") await p.clock.runFor(2000)
  for (const id of result)
    await p.locator(`[data-character="${id}"]`).first().waitFor()
  return result
}
async function open(context) {
  const p = await context.newPage()
  capture(p)
  await p.goto(base + "/adventure")
  await p.locator('[data-pixel-character="bach"]').waitFor()
  const close = p.getByRole("button", { name: "Tắt thông báo", exact: true })
  if (await close.isVisible()) await close.click()
  await p.clock.install()
  await p.clock.pauseAt(new Date(Date.now() + 100))
  return p
}
async function event(p, animation) {
  for (let i = 0; i < 100; i++) {
    const ready = await p.evaluate(async (animation) => {
      const { useGameStore } = await import("/src/game/useGameStore.ts")
      const b = useGameStore.getState().save.adventureRpg.run.battle
      return b.events.some(
        (e) =>
          e.animation === animation &&
          b.actors.find((a) => a.uid === e.source)?.side === "enemy",
      )
    }, animation)
    if (ready) return
    await p.clock.runFor(100)
  }
  throw Error(`No real enemy ${animation} event`)
}
async function pause(p, value) {
  await p.evaluate(async (value) => {
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    const store = useGameStore.getState()
    if (store.save.adventureRpg.run.battle.paused !== value)
      store.rpgAction({ type: "pause" })
  }, value)
}

try {
  for (const viewport of process.env.QA_FOCUS
    ? [{ width: 320, height: 568 }]
    : [
        { width: 320, height: 568 },
        { width: 390, height: 844 },
        { width: 844, height: 390 },
        { width: 1440, height: 900 },
      ]) {
    const c = await browser.newContext({ viewport }),
      p = await open(c)
    for (const region of process.env.QA_FOCUS
      ? [process.env.QA_REGION ?? "mistwood"]
      : regions) {
      const ids = await fixture(p, region)
      await p.locator(".rpg-battle.presentation-fight").waitFor()
      await pause(p, false)
      await event(p, "enemy")
      await p.clock.runFor(450)
      const painted = await p.locator(".rpg-vfx-canvas").evaluate((c) => {
        const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data
        let n = 0
        for (let i = 3; i < d.length; i += 4) if (d[i] > 32) n++
        return n
      })
      assert(
        painted > 10,
        JSON.stringify({
          region,
          viewport,
          painted,

          phase: await p.locator(".rpg-battle").getAttribute("class"),
          canvas: await p.locator(".rpg-vfx-canvas").evaluate((c) => ({
            width: c.width,
            height: c.height,
            ...c.dataset,
          })),
        }),
      )
      await pause(p, true)
      await p.clock.runFor(100)
      const snapshot = await p.evaluate(async () => {
        const { useGameStore } = await import("/src/game/useGameStore.ts")
        return structuredClone(
          useGameStore.getState().save.adventureRpg.run.battle,
        )
      })
      assert.equal(snapshot.warning, null)
      assert(
        snapshot.actors
          .filter((a) => a.side === "enemy")
          .every((a) => !a.boss && !a.elite && !a.phase),
      )
      for (const id of ids) {
        const models = p.locator(
          `[data-character="${id}"][data-sheet="campaign-${id}-pixel"]`,
        )
        assert((await models.count()) > 0)
        assert(
          snapshot.events.some(
            (e) =>
              e.animation === "enemy" &&
              snapshot.actors.find((a) => a.uid === e.source)?.id === id,
          ),
        )
      }
      const tank = ids.find((id) =>
        ["jade-sentinel", "kiln-knight", "bronze-warden"].includes(id),
      )
      if (tank)
        assert(
          (await p
            .locator(`[data-character="${tank}"][data-motion="guard"]`)
            .count()) > 0,
          JSON.stringify({
            region,
            viewport,
            tick: snapshot.tick,
            tank,
            phase: await p.locator(".rpg-battle").getAttribute("class"),
            motion: await p
              .locator(`[data-character="${tank}"]`)
              .evaluateAll((es) =>
                es.map((e) => ({
                  motion: e.dataset.motion,
                  html: e.outerHTML.slice(0, 160),
                })),
              ),
            events: snapshot.events,
          }),
        )
      const before = await p
        .locator(".side-enemy canvas")
        .evaluateAll((cs) => cs.map((c) => c.dataset.pose))
      await p.clock.runFor(180)
      assert.deepEqual(
        await p
          .locator(".side-enemy canvas")
          .evaluateAll((cs) => cs.map((c) => c.dataset.pose)),
        before,
      )
      assert(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      )
      if (viewport.width === 390)
        await p.screenshot({ path: `${out}/qa/${engine}-${region}-390.png` })
      checks.push({
        area: "canonical-stage-skill",
        region,
        ids,
        viewport,
        noEliteWarning: true,
        defense: tank ?? null,
        pausedPoseStable: true,
        painted,
      })
      console.log(JSON.stringify({ engine, region, viewport, painted }))
    }
    if (viewport.width === 390) {
      for (const region of regions) {
        const ids = await fixture(p, region, "attack")
        await p.locator(".rpg-battle.presentation-fight").waitFor()
        await pause(p, false)
        await event(p, "attack")
        await p.clock.runFor(350)
        assert(
          await p
            .locator(".rpg-vfx-canvas")
            .getAttribute("data-enemy-signature"),
        )
        checks.push({ area: "normal-attack-contact", region, ids })
      }
      for (const difficulty of ["hard", "extreme"]) {
        await fixture(p, "lasttable", "skill", difficulty)
        await p.locator(".rpg-battle.presentation-fight").waitFor()
        await pause(p, false)
        await event(p, "enemy")
        checks.push({ area: "difficulty", difficulty, canonicalStage: true })
      }
      await fixture(p, "lasttable", "victory")
      await p.locator('.side-enemy [data-motion="victory"]').first().waitFor()
      checks.push({ area: "enemy-victory", authored: true })
      await fixture(p, "ashalley", "fall")
      await p.locator('.side-enemy [data-motion="fall"]').first().waitFor()
      checks.push({ area: "enemy-fall", authored: true })
    }
    await c.close()
  }
  const c = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    }),
    p = await open(c)
  await fixture(p, "mistwood")
  await p.locator(".rpg-battle.presentation-fight").waitFor()
  await pause(p, false)
  await event(p, "enemy")
  await pause(p, true)
  await p.clock.runFor(100)
  await p
    .locator(
      '[data-character="jade-sentinel"][data-motion="guard"] canvas[data-pose="18"]',
    )
    .first()
    .waitFor()
  await p.screenshot({ path: `${out}/qa/${engine}-reduced.png` })
  checks.push({ area: "reduced-motion", staticGuardPose: 18 })
  await c.close()
  assert.deepEqual(errors, [])
  assert.deepEqual(missing, [])
  assert(!requests.some((p) => p.endsWith(".mp4")))
  writeFileSync(
    out + `/${engine}${process.env.QA_FOCUS ? "-focus" : ""}-qa.json`,
    JSON.stringify(
      {
        date: "2026-10-17",
        engine,
        version: browser.version(),
        fixtures:
          "Actual region-1 stages through reduceRpg; actor HP/timers adjusted only for isolated visual QA. No player save touched.",
        checks,
        errors,
        missing,
        newAtlasRequests: [
          ...new Set(requests.filter((p) => p.includes("/campaign599/"))),
        ],
        movieRequests: 0,
      },
      null,
      2,
    ) + "\n",
  )
  console.log(
    JSON.stringify({ engine, checks: checks.length, errors, missing }),
  )
} finally {
  await browser.close()
  server.kill()
}
