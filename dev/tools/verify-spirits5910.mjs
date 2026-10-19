import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
const { chromium, webkit } = await import(
  process.env.PLAYWRIGHT_MODULE ?? "playwright"
)
const cohorts = {
  "5923a": {root: "korea5923", ids: ["samgyeopsal","hanwoo-bbq","korean-fried-chicken","bingsu"]},
  "5923b": {root: "korea5923", ids: ["jjajangmyeon","kimchi-jjigae","samgyeopsal","bingsu"]},
  "5910": {root: "regional5910", ids: ["banh-tet", "bun-bo-hue", "bun-ca", "che-buoi"]},
  "5912": {root: "vietnam5912", ids: ["pho-ga", "chao-suon", "mien-ga", "bun-moc"]},
  "5911": {root: "spring5911", ids: ["xoi-xeo", "dua-hanh", "caravan-herbalist", "caravan-gardener"]},
  "5913": {root: "autochess5913", ids: ["banh-dau-xanh", "banh-khuc", "banh-can", "banh-tom-ho-tay", "com-hen"]},
  "5914": {root: "tcg5914", ids: ["mi-van-than", "mi-cay", "ga-ran", "pizza"]},
  "5922a": {root: "northwest5922", ids: ["banner-tay-bac-goi-rau-don","banner-tay-bac-com-lam","banner-tay-bac-thang-co","banner-tay-bac-thit-trau-gac-bep"]},
  "5922b": {root: "northwest5922", ids: ["banner-tay-bac-ga-nuong-mac-khen","banner-tay-bac-xoi-ngu-sac","banner-tay-bac-goi-rau-don","banner-tay-bac-thang-co"]},
  "5921": {root: "spirits5921", ids: ["canh-mang-mien", "gio-xao", "thit-dong", "che-khuc-bach"]},
  "5917": {root: "spirits5917", ids: ["lau-rieu-cua", "nuong-bbq", "vit-quay", "bibimbap"]},
}
const cohort = process.env.QA_COHORT ?? "5910"
assert(cohort in cohorts, "Unknown spirit cohort")
const {root: assetRoot, ids: defaultIds} = cohorts[cohort]
const ids = process.env.QA_IDS ? JSON.parse(process.env.QA_IDS) : defaultIds
assert(ids.length >= 2 && ids.length <= 5)
const viewports = process.env.QA_END_ONLY
  ? []
  : process.env.QA_VIEWPORTS
    ? JSON.parse(process.env.QA_VIEWPORTS)
    : process.env.QA_FOCUS
      ? [{ width: 390, height: 844 }]
      : [
          { width: 320, height: 568 },
          { width: 390, height: 844 },
          { width: 844, height: 390 },
          { width: 1440, height: 900 },
        ]
const engine = process.env.QA_ENGINE ?? "chromium",
  port = process.env.QA_PORT ?? "4196",
  url = `http://127.0.0.1:${port}`,
  out = process.env.QA_OUT ?? `dev/docs/web-v${cohort}`
const checks = [],
  errors = [],
  missing = [],
  requests = []
const captureOut = process.env.QA_CAPTURE_DIR ?? `.asset-work/qa/spirits-${cohort}`
mkdirSync(out, { recursive: true })
mkdirSync(captureOut, { recursive: true })
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
    if ((await fetch(url)).ok) break
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
async function open(context) {
  const p = await context.newPage()
  p.on("pageerror", (e) => errors.push(e.message))
  p.on("response", (r) => {
    if (r.status() >= 400) missing.push([r.url(), r.status()])
  })
  p.on("request", (r) => requests.push(new URL(r.url()).pathname))
  await p.goto(url + "/adventure")
  await p.locator('[data-pixel-character="bach"]').waitFor()
  const dismiss = p.getByRole("button", { name: "Tắt thông báo", exact: true })
  if (await dismiss.isVisible()) await dismiss.click()
  await p.clock.install()
  await p.clock.pauseAt(new Date(await p.evaluate(() => Date.now()) + 1000))
  return p
}
let fixtureSerial = 0
async function fixture(p, mode = "ultimate") {
  await p.evaluate(
    async ({ ids, mode, serial, cohort }) => {
      const { newGame } = await import("/src/game/progression.ts"),
        { newRpgSave, reduceRpg } = await import(
          "/src/game/adventureRpg/engine.ts"
        ),
        { useGameStore } = await import("/src/game/useGameStore.ts")
      const g = newGame(),
        s = newRpgSave(g)
      s.cinematics = true
      s.roster.forEach((h, i) => {
        h.cardId = [...ids, "com-tam", "banh-mi", "pho-bo", "banh-cuon", "goi-cuon-tom-thit"][i]
        h.level = 15
        h.rank = 2
        h.skills = [3, 3, 3, 3]
      })
      g.adventureRpg = reduceRpg(
        s,
        { type: "start", stageId: "lantern-1" },
        g,
      ).save
      const b = g.adventureRpg.run.battle
      b.id = `qa${cohort}:${mode}:${serial}`
      b.paused = true
      b.auto = false
      for (const a of b.actors) {
        a.hp = a.maxHp = 50000
        a.attack = 1
        a.nextAttack = a.nextSkill = a.nextSupport = 10000
        a.energy = 100
        if (a.side === "ally") {
          a.hp = 35000
          if (mode === "attack") a.nextAttack = 0
          if (mode === "primary") a.nextSkill = 0
          if (mode === "support") a.nextSupport = 0
        }
      }
      if (mode === "victory" || mode === "fall") {
        b.result = mode === "victory" ? "win" : "loss"
        if (mode === "victory") b.wave = b.waves.length - 1
        for (const a of b.actors.filter(
          (a) => a.side === (mode === "victory" ? "enemy" : "ally"),
        ))
          a.hp = 0
      }
      if (!useGameStore.getState().importSave(g))
        throw Error("Regional fixture rejected")
      useGameStore.getState().dismiss()
    },
    { ids, mode, serial: ++fixtureSerial, cohort },
  )
  await p.clock.runFor(32)
  if (!["victory", "fall"].includes(mode)) {
    await p
      .locator(
        ".rpg-battle.presentation-enter, .rpg-battle.presentation-ready, .rpg-battle.presentation-start",
      )
      .waitFor()
    await p.clock.runFor(2000)
    await p.locator(".rpg-battle.presentation-fight").waitFor()
  }
  for (const id of ids)
    await p.locator(`[data-character="${id}"][data-sheet="starter-${id}"].is-loaded`).first().waitFor()
  const hd = await p.evaluate(async ({ids,assetRoot}) => {
    const {SPRITE_SHEETS} = await import("/src/game/autochess/presentation.ts")
    return ids.map(id => {
      const actor = document.querySelector(`[data-character="${id}"]`)
      const sheet = actor?.dataset.sheet
      const descriptor = SPRITE_SHEETS[sheet]
      return {id,sheet,path:descriptor?.path,width:descriptor?.width,frameWidth:descriptor?.rows[0]?.frames[0]?.[2],expectedRoot:descriptor?.path.includes(`/${assetRoot}/`)}
    })
  }, {ids,assetRoot})
  assert(hd.every(r => r.sheet === `starter-${r.id}` && r.width === 1024 && r.frameWidth === 256 && r.expectedRoot),JSON.stringify(hd))
}
async function snapshot(p) {
  return p.evaluate(async () => {
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    return structuredClone(useGameStore.getState().save.adventureRpg)
  })
}
async function pause(p, value) {
  await p.evaluate(async (value) => {
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    const s = useGameStore.getState()
    if (s.save.adventureRpg.run.battle.paused !== value)
      s.rpgAction({ type: "pause" })
  }, value)
  if (value) await p.locator(".rpg-battle.is-paused").waitFor()
  await p.clock.runFor(value ? 128 : 32)
}
// A controlled clock freezes actionability's RAF stability check. Check the live
// button explicitly before dispatching the actual pointer click.
async function click(p, locator) {
  assert(await locator.isVisible())
  assert(await locator.isEnabled())
  await locator.click({ force: true })
  await p.clock.runFor(32)
}
async function paint(p) {
  return p.locator(".rpg-vfx-canvas").evaluate((c) => {
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data
    let n = 0
    for (let i = 3; i < d.length; i += 4) if (d[i] > 32) n++
    return n
  })
}
function noRecast(before, after) {
  assert.deepEqual(after.run.battle.actors, before.run.battle.actors)
  assert.deepEqual(after.resources, before.resources)
  assert.deepEqual(after.roster, before.roster)
}
async function cast(p, index) {
  await pause(p, false)
  await click(p, p.locator(".rpg-burst-button").nth(index))
  await p.locator(`.ultimate-banner[data-showcase="${ids[index]}"]`).waitFor()
}
try {
  for (const viewport of viewports) {
    const c = await browser.newContext({ viewport }),
      p = await open(c)
    for (const mode of ["attack", "primary", "support"]) {
      await fixture(p, mode)
      await pause(p, false)
      for (let i = 0; i < 10; i++) {
        const s = await snapshot(p)
        if (s.run.battle.events.some((e) => e.animation === mode)) break
        await p.clock.runFor(100)
      }
      const s = await snapshot(p)
      for (const id of ids) {
        const a = s.run.battle.actors.find((a) => a.id === id)
        assert(
          s.run.battle.events.some(
            (e) => e.source === a.uid && e.animation === mode,
          ),
          `${id} missing real ${mode}`,
        )
      }
      await p.clock.runFor(450)
      const painted = await paint(p)
      assert(painted > 10, `${mode} VFX empty`)
      await pause(p, true)
      const poses = await p
        .locator(".side-ally canvas")
        .evaluateAll((cs) => cs.map((c) => c.dataset.pose))
      await p.clock.runFor(200)
      assert.deepEqual(
        await p
          .locator(".side-ally canvas")
          .evaluateAll((cs) => cs.map((c) => c.dataset.pose)),
        poses,
      )
      checks.push({
        area: mode,
        viewport,
        ids,
        realReducerEvents: true,
        painted,
        pauseStable: true,
      })
    }
    await fixture(p)
    for (let i = 0; i < ids.length; i++) {
      await cast(p, i)
      const committed = await snapshot(p),
        serial = committed.run.battle.cinematic.serial
      await p.clock.runFor(1050)
      assert.equal(
        await p
          .locator(`.side-ally [data-character="${ids[i]}"] canvas`)
          .getAttribute("data-pose"),
        "18",
      )
      const painted = await paint(p)
      assert(painted > 10)
      const banner = p.locator(`.ultimate-banner[data-showcase="${ids[i]}"]`)
      const expectedPortrait=await p.evaluate(async id=>(await import("/src/game/adventureRpg/spiritArt.ts")).spiritArt(id).path,ids[i])
      assert((await banner.locator(".ultimate-portrait-image").getAttribute("style")).includes(expectedPortrait))
      const rect = await banner.evaluate((e) => {
        const b = e.getBoundingClientRect(),
          a = e.closest(".rpg-arena").getBoundingClientRect()
        return {
          left: b.left,
          right: b.right,
          height: b.height,
          arena: a.height,
        }
      })
      const bannerFits = rect.left >= 0 && rect.right <= viewport.width + 1 && rect.height < rect.arena * 0.5
      if (!bannerFits) await p.screenshot({path: `${captureOut}/banner-fit-failure.png`})
      assert(bannerFits, JSON.stringify({id:ids[i],viewport,rect}))
      await click(
        p,
        p.getByRole("button", { name: "Dừng hoạt ảnh", exact: true }),
      )
      const progress = await p
        .locator(".rpg-showcase-progress")
        .getAttribute("style")
      await p.clock.runFor(180)
      assert.equal(
        await p.locator(".rpg-showcase-progress").getAttribute("style"),
        progress,
      )
      if (viewport.width === 390)
        await p.screenshot({ path: `${captureOut}/${engine}-${ids[i]}-390.png` })
      await click(p, p.getByRole("button", { name: "Bỏ qua ›", exact: true }))
      await p.locator(".rpg-showcase").waitFor({ state: "detached" })
      noRecast(committed, await snapshot(p))
      await p.evaluate(async (serial) => {
        const { useGameStore } = await import("/src/game/useGameStore.ts")
        useGameStore.getState().rpgAction({ type: "cinematicDone", serial })
      }, serial)
      noRecast(committed, await snapshot(p))
      checks.push({
        area: "ultimate",
        id: ids[i],
        viewport,
        pose: 18,
        painted,
        portraitMatches: true,
        pauseSkipNoRecast: true,
        layout: rect,
      })
    }
    assert(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    )
    await c.close()
  }
  const c = await browser.newContext({ viewport: { width: 390, height: 844 } }),
    p = await open(c)
  for (const mode of ["victory", "fall"]) {
    await fixture(p, mode)
    await p.clock.runFor(900)
    for (const id of ids)
      assert(
        await p
          .locator(`[data-character="${id}"][data-motion="${mode}"]`)
          .count(),
      )
    checks.push({ area: mode, ids })
  }
  await fixture(p)
  await cast(p, 0)
  await click(p, p.getByRole("button", { name: "Dừng hoạt ảnh", exact: true }))
  const saved = await snapshot(p)
  await p.reload()
  // Lazy route modules can finish after navigation's load event; keep advancing
  // the controlled RAF until React hydrates before checking the restored banner.
  for (let i = 0; i < 40; i++) {
    await p.clock.runFor(100)
    if (await p.locator(".rpg-battle").count()) break
    await p.waitForTimeout(10)
  }
  await p.locator(".rpg-battle").waitFor()
  await p.clock.runFor(2000)
  await p.locator(".rpg-showcase").waitFor()
  noRecast(saved, await snapshot(p))
  await click(p, p.getByRole("button", { name: "Bỏ qua ›", exact: true }))
  noRecast(saved, await snapshot(p))
  checks.push({ area: "reload-committed-ultimate", noRecast: true })
  await fixture(p)
  await cast(p, Math.min(2, ids.length - 1))
  const before = await snapshot(p)
  await p.clock.runFor(2500)
  await p.locator(".rpg-showcase").waitFor({ state: "detached" })
  noRecast(before, await snapshot(p))
  checks.push({ area: "natural-completion", noRecast: true })
  await c.close()
  const reduced = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    }),
    rp = await open(reduced)
  await fixture(rp)
  for (let i = 0; i < ids.length; i++) {
    await cast(rp, i)
    await rp.locator(".ultimate-banner.is-reduced").waitFor()
    await rp.clock.runFor(1050)
    assert.equal(
      await rp
        .locator(`.side-ally [data-character="${ids[i]}"] canvas`)
        .getAttribute("data-pose"),
      "16",
    )
    await click(rp, rp.getByRole("button", { name: "Bỏ qua ›", exact: true }))
  }
  checks.push({ area: "reduced-motion", ids, staticPose: 16 })
  await reduced.close()
  assert.deepEqual(errors, [])
  assert.deepEqual(missing, [])
  assert(!requests.some((p) => p.endsWith(".mp4")))
  assert.equal(requests.some((p) => p.includes(`${assetRoot}/ultimate.webp`)), ["5917","5921","5922a","5922b","5923a","5923b"].includes(cohort), "Painted VFX atlas request")
  writeFileSync(
    `${out}/${engine}${
      process.env.QA_END_ONLY ? "-end" : process.env.QA_FOCUS ? "-focus" : ""
    }-qa.json`,
    JSON.stringify(
      {
        date: new Date().toISOString().slice(0,10),
        engine,
        version: browser.version(),
        fixtures:
          "Real reducer stages; isolated saves with adjusted party, HP and timers; controlled browser clock",
        checks,
        errors,
        missing,
        requestedAssets: [
          ...new Set(requests.filter((p) => p.includes(`/${assetRoot}/`))),
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
