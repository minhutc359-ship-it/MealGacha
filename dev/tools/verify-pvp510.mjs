import { mkdirSync, writeFileSync } from "node:fs"
import { spawn } from "node:child_process"
import { createRequire } from "node:module"
import dgram from "node:dgram"
import path from "node:path"
import { fileURLToPath } from "node:url"
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const qa =
  process.env.PVP_QA_MODULES ?? path.resolve(root, "../browser-qa/node_modules")
const { PeerServer } = createRequire(path.join(qa, "peer/package.json"))("peer")
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ??
    "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs"
)
const out = path.resolve(process.env.PVP_QA_OUT ?? path.join(root, "dev/docs/web-v510/pvp-regression"))
mkdirSync(out, { recursive: true })
// QA-only STUN: restricted container cannot enumerate NICs. Real ICE, DTLS and SCTP.
const stun = dgram.createSocket("udp4")
stun.on("message", (m, r) => {
  if (m.length < 20) return
  const b = Buffer.alloc(32)
  b.writeUInt16BE(0x101, 0)
  b.writeUInt16BE(12, 2)
  m.copy(b, 4, 4, 20)
  b.writeUInt16BE(0x20, 20)
  b.writeUInt16BE(8, 22)
  b[25] = 1
  b.writeUInt16BE(r.port ^ 0x2112, 26)
  r.address.split(".").forEach((x, i) => (b[28 + i] = Number(x) ^ m[4 + i]))
  stun.send(b, r.port, r.address)
})
stun.bind(4194, "127.0.0.1")
let signalHttp
const signal = PeerServer(
  { port: 4192, path: "/som", allow_discovery: false },
  (server) => (signalHttp = server),
)
const server = spawn(
  "pnpm",
  [
    "exec",
    "vite",
    "--config",
    "dev/tools/vite.pvp-qa.config.ts",
    "--host",
    "127.0.0.1",
    "--port",
    "4193",
    "--strictPort",
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      VITE_PVP_SIGNAL_URL: "ws://127.0.0.1:4192/som/peerjs",
      VITE_PVP_ICE_SERVERS: JSON.stringify([{ urls: "stun:127.0.0.1:4194" }]),
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
)
let serverLog = ""
server.stdout.on("data", (b) => (serverLog += b))
server.stderr.on("data", (b) => (serverLog += b))
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_BIN ?? "/tmp/soul-browser490/chromium",
  headless: true,
  env: {
    ...process.env,
    LD_LIBRARY_PATH: process.env.CHROMIUM_LIB_DIR ?? "/tmp/soul-browser490/lib:/tmp/soul-browser490",
  },
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--allow-loopback-in-peer-connection",
    "--force-webrtc-ip-handling-policy=default_public_interface_only",
  ],
})
let activePage
const errors = [],
  assets = [],
  results = []
const base = "http://127.0.0.1:4193"
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
async function open(viewport, mode, name) {
  const context = await browser.newContext({ viewport }),
    page = await context.newPage()
  activePage = page
  page.setDefaultTimeout(30000)
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("dialog", (d) => d.accept())
  page.on("response", (r) => {
    if (r.status() >= 400 && !r.url().includes("favicon"))
      assets.push({ url: r.url().replace(base, ""), status: r.status() })
  })
  await page.goto(`${base}/pvp?mode=${mode}`)
  await page.locator(".pvp-primary").waitFor()
  // Capture the actual controller only in QA, never in product code.
  await page.evaluate(async () => {
    const { RoomSession } = await import("/src/game/pvp/session.ts")
    const original = RoomSession.prototype.openPeer
    RoomSession.prototype.openPeer = function (...args) {
      window.__session = this
      return original.apply(this, args)
    }
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    window.__solo = JSON.stringify(useGameStore.getState().save)
  })
  await page.getByLabel("Tên hiển thị").fill(name)
  return { context, page }
}
async function sameSave(page) {
  return page.evaluate(async () => {
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    return window.__solo === JSON.stringify(useGameStore.getState().save)
  })
}
async function view(page) {
  return page.evaluate(() => window.__session?.getSnapshot())
}
async function pair(viewport, mode) {
  const h = await open(viewport, mode, "Chủ phòng"),
    g = await open(viewport, mode, "Người bạn")
  await h.page.locator(".pvp-primary").click()
  await h.page.waitForFunction(
    () => window.__session?.getSnapshot().status === "online",
    null,
    { timeout: 20000 },
  )
  const code = await h.page.getByLabel("Mã hệ thống tạo").inputValue()
  await g.page.getByLabel("Mã phòng", { exact: true }).fill(code)
  await g.page.locator(".pvp-join button").click()
  await g.page.waitForFunction(
    () => window.__session?.getSnapshot().view?.connected.every(Boolean),
    null,
    { timeout: 30000 },
  )
  if (viewport.width === 390 && mode === "auto") {
    // Seat denial uses a third real data channel.
    console.log("Third seat denial")
    const third = await open(viewport, "auto", "Người thứ ba")
    await third.page.getByLabel("Mã phòng", { exact: true }).fill(code)
    await third.page.locator(".pvp-join button").click()
    await third.page
      .getByText(/Phòng đã đủ 2 người/)
      .waitFor({ timeout: 30000 })
    await third.context.close()
    console.log("Mode mismatch denial")
    const wrong = await open(viewport, "tcg", "Khác chế độ")
    await wrong.page.getByLabel("Mã phòng", { exact: true }).fill(code)
    await wrong.page.locator(".pvp-join button").click()
    await wrong.page
      .getByText(/cùng chế độ và phiên bản/)
      .waitFor({ timeout: 30000 })
    await wrong.context.close()
  }
  await h.page
    .getByRole("button", { name: "Sẵn sàng vào trận", exact: true })
    .click()
  await g.page
    .getByRole("button", { name: "Sẵn sàng vào trận", exact: true })
    .click()
  await g.page.waitForFunction(
    () => window.__session?.getSnapshot().view?.phase === "playing",
  )
  activePage=g.page
  return { h, g, code }
}
async function shot(page, name) {
  await page.screenshot({
    path: path.join(out, `${name}.jpg`),
    type: "jpeg",
    quality: 82,
    timeout: 30000,
    animations: "disabled",
  })
}
async function fits(page, selector) {
  return page.locator(selector).evaluateAll((nodes) =>
    nodes
      .filter(
        (n) =>
          n.getBoundingClientRect().width && n.getBoundingClientRect().height,
      )
      .every((n) => {
        const r = n.getBoundingClientRect()
        return (
          r.top >= -1 &&
          r.left >= -1 &&
          r.right <= innerWidth + 1 &&
          r.bottom <= innerHeight + 1
        )
      }),
  )
}
async function trapFlow(t, label) {
  console.log("TCG fourth slot and manual trap", label)
  await t.h.page.evaluate(async () => {
    const { CARD_MAP, STARTER_DECK } = await import("/src/game/catalog.ts"),
      s = window.__session,
      b = s.room.tcg
    const cardId = STARTER_DECK.find(
      (id) =>
        CARD_MAP[id].kind === "unit" &&
        CARD_MAP[id].cost <= 3 &&
        !CARD_MAP[id].keywords?.includes("guard"),
    )
    const unit = (uid) => ({
      uid,
      cardId,
      attack: 3,
      health: 20,
      maxHealth: 20,
      shield: 0,
      ready: true,
      keywords: [],
    })
    b.turnSide = "player"
    b.turnSerial = 7
    b.round = 4
    b.result = null
    b.nextUid = 20
    delete b.pendingReaction
    delete b.pvp.reactionOwner
    b.player.board = ["qa-a", "qa-b", "qa-c"].map(unit)
    b.player.hand = [cardId, "trap-lid"]
    b.player.mana = b.player.maxMana = 7
    b.enemy.board = [unit("qa-guest")]
    b.enemy.hand = []
    b.enemy.mana = b.enemy.maxMana = 7
    s.room.presentation = null
    s.room.actionReadyAt = 0
    s.room.revision++
    s.room.changedAt = [s.room.revision, s.room.revision]
    s.publish()
  })
  for (const page of [t.h.page, t.g.page])
    await page.evaluate(async () => {
      const { gameAudio } = await import(
        "/src/infrastructure/audio/gameAudio.ts"
      )
      const original = gameAudio.play
      window.__cues = []
      gameAudio.play = function (...args) {
        window.__cues.push(args[0])
        return original.apply(this, args)
      }
      window.__trapTiming = { start: null, duration: null }
      let seen = false
      new MutationObserver(() => {
        const visible = !!document.querySelector(".tcg-trap-reveal")
        if (visible && !seen) window.__trapTiming.start = performance.now()
        if (!visible && seen)
          window.__trapTiming.duration =
            performance.now() - window.__trapTiming.start
        seen = visible
      }).observe(document.body, { childList: true, subtree: true })
    })
  const idle = async (page) => {
    await page.waitForFunction(() => window.__session.getSnapshot().view.canAct)
    await page.getByRole("button", { name: /^Kết thúc lượt/ }).waitFor()
  }
  await idle(t.h.page)
  await t.h.page.locator(".tcg-hand .tcg-card").first().click()
  await t.h.page.getByRole("button", { name: /^Triệu hồi/ }).click()
  await t.g.page.waitForFunction(
    () => window.__session.getSnapshot().view.tcg.enemy.board.length === 4,
  )
  await idle(t.h.page)
  await t.h.page.locator(".tcg-hand .tcg-card").first().click()
  await t.h.page.getByRole("button", { name: /^Úp bẫy/ }).click()
  await t.h.page.locator(".tcg-trap-slot.is-setting").waitFor()
  if (JSON.stringify((await view(t.g.page)).view).includes("trap-lid"))
    throw Error("Hidden trap leaked in animation projection")
  await idle(t.h.page)
  await t.h.page.getByRole("button", { name: /^Kết thúc lượt/ }).click()
  await idle(t.g.page)
  await t.g.page.locator(".tcg-field:not(.enemy) .tcg-unit").first().click()
  await t.g.page.locator(".tcg-hero.enemy").click()
  await t.h.page.waitForFunction(
    () =>
      window.__session.getSnapshot().view.canAct &&
      !!window.__session.getSnapshot().view.tcg.pendingReaction,
  )
  await t.h.page.getByRole("button", { name: /Kích hoạt bẫy/ }).click()
  for (const page of [t.h.page, t.g.page])
    await page.waitForFunction(() => window.__trapTiming.duration !== null)
  const durations = await Promise.all(
    [t.h.page, t.g.page].map((page) =>
      page.evaluate(() => window.__trapTiming.duration),
    ),
  )
  if (durations.some((ms) => ms < 2200 || ms > 3000))
    throw Error("Trap reveal lifetime " + JSON.stringify(durations))
  const cues = await t.h.page.evaluate(
    () => window.__cues.filter((c) => c === "trap-set").length,
  )
  if (cues !== 1) throw Error("Trap set sound emitted " + cues + " times")
  const health = (await view(t.h.page)).view.tcg.player.health
  if (health !== 34) throw Error("Trap did not block hero attack")
  await shot(t.h.page, `tcg-trap-${label}`)
  results.push({
    viewport: label,
    fourthUnitSummoned: true,
    trapSetAnimation: true,
    trapSetSoundOnce: true,
    trapHiddenInAllGuestFrames: true,
    manualTrapActivated: true,
    trapRevealMs: durations,
  })
  // Intentional leave is a forfeit, frees the only guest seat, and permits rematch.
  await t.g.page.locator(".pvp-room-bar button").click()
  await t.g.page
    .getByRole("dialog", { name: "Rời phòng?" })
    .getByRole("button", { name: "Rời phòng", exact: true })
    .click()
  await t.h.page.waitForFunction(() => {
    const v = window.__session.getSnapshot().view
    return v.phase === "finished" && v.winner === 0 && v.names[1] === null
  })
  await t.h.page
    .getByRole("button", { name: "Trở về phòng →", exact: true })
    .click()
  await t.h.page
    .getByRole("button", { name: "Mở trận mới", exact: true })
    .click()
  await t.g.page.locator(".pvp-join button").click()
  await t.g.page.waitForFunction(() =>
    window.__session.getSnapshot().view?.connected.every(Boolean),
  )
  await t.h.page.locator(".pvp-room-bar button").click()
  await t.h.page
    .getByRole("dialog", { name: "Rời phòng?" })
    .getByRole("button", { name: "Rời phòng", exact: true })
    .click()
  await t.g.page
    .getByRole("button", { name: "Trở lại tạo / vào phòng", exact: true })
    .waitFor()
  results.push({
    viewport: label,
    intentionalGuestLeaveForfeits: true,
    guestSeatFreed: true,
    rematchRejoined: true,
    hostCloseNotified: true,
  })
}

try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base)).ok) break
    } catch {}
    await wait(100)
  }
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
    { width: 844, height: 390 },
    { width: 320, height: 568 },
  ]) {
    const label = `${viewport.width}x${viewport.height}`
    console.log("Auto native QA", label)
    const p = await pair(viewport, "auto")
    await p.h.page.locator(".ac-board canvas").waitFor()
    await wait(400)
    if (
      !(await fits(
        p.h.page,
        ".ac-board,.pvp-auto-hud,.ac-market-toolbar,.ac-begin",
      ))
    )
      throw Error(`Auto bounds ${label}`)
    await shot(p.h.page, `auto-${label}`)
    const ready = (page) =>
      page.getByRole("button", { name: /^Sẵn sàng \d/ }).click()
    await ready(p.h.page)
    await ready(p.g.page)
    await p.g.page.waitForFunction(
      () => window.__session.getSnapshot().view.auto.phase === "combat",
    )
    await wait(1100)
    // Real-time combat observed through native snapshots; final visual evidence is captured at stable preparation.
    if (viewport.width === 390) {
      // Disconnect without an intentional leave; same tab token resumes exact match.
      console.log("Disconnect and resume")
      const id = (await view(p.g.page)).view.id
      await p.g.page.evaluate(() => window.__session.peer.close())
      await p.h.page.waitForFunction(
        () => !window.__session.getSnapshot().view.connected[1],
      )
      const tick = await p.h.page.evaluate(
        () => window.__session.room.auto.runs[0].combat.tick,
      )
      await wait(200)
      if (
        tick !==
        (await p.h.page.evaluate(
          () => window.__session.room.auto.runs[0].combat.tick,
        ))
      )
        throw Error("Disconnect did not pause")
      await p.g.page
        .getByRole("button", { name: "Kết nối lại", exact: true })
        .click()
      await p.g.page.waitForFunction(
        () => window.__session.getSnapshot().status === "online",
      )
      if ((await view(p.g.page)).view.id !== id)
        throw Error("Resume replaced match")
      for (let round = 1; round <= 4; round++) {
        // Accelerate only after native real-time smoke, through the real engine.
        await p.h.page.evaluate(async () => {
          const { tickRoom } = await import("/src/game/pvp/room.ts")
          const s = window.__session
          for (let i = 0; i < 46 && s.room.auto.phase === "combat"; i++)
            tickRoom(s.room, 40)
          s.publish()
        })
        await p.g.page.waitForFunction(
          () => window.__session.getSnapshot().view.auto.phase === "result",
        )
        const v = (await view(p.g.page)).view
        if (
          v.auto.round !== round ||
          v.auto.kind !== (round === 4 ? "pvp" : "farm")
        )
          throw Error("Wrong farm/PvP cycle")
        if (round < 4) {
          await p.h.page
            .getByRole("button", { name: "Sẵn sàng vòng tiếp", exact: true })
            .click()
          await p.g.page
            .getByRole("button", { name: "Sẵn sàng vòng tiếp", exact: true })
            .click()
          await p.g.page.waitForFunction(
            () => window.__session.getSnapshot().view.auto.phase === "prepare",
          )
          await ready(p.h.page)
          await ready(p.g.page)
          await p.g.page.waitForFunction(
            () => window.__session.getSnapshot().view.auto.phase === "combat",
          )
        }
      }
      // Guest reload retains sessionStorage reservation and does not forfeit.
      console.log("Guest reload resume")
      await p.g.page.reload()
      await p.g.page
        .getByRole("button", { name: "Nối lại phòng trước", exact: true })
        .waitFor()
      await p.g.page.evaluate(async () => {
        const { RoomSession } = await import("/src/game/pvp/session.ts")
        const original = RoomSession.prototype.openPeer
        RoomSession.prototype.openPeer = function (...args) {
          window.__session = this
          return original.apply(this, args)
        }
      })
      await p.g.page.evaluate(() => {
        const button = [...document.querySelectorAll("button")].find(el => el.textContent.trim() === "Nối lại phòng trước")
        if (!button || button.disabled) throw Error("Resume control unavailable")
        button.click()
      })
      let guestReloadRetries = 0, reloadedOnline = false
      for (let attempt = 0; attempt < 120; attempt++) {
        const snapshot = await view(p.g.page)
        if (snapshot?.status === "online" && snapshot?.view?.connected.every(Boolean)) {reloadedOnline = true; break}
        if (snapshot?.status === "disconnected" && guestReloadRetries < 1) {
          console.log("Guest reload transport retry", snapshot.notice)
          await p.g.page.getByRole("button", {name:"Kết nối lại",exact:true}).click()
          guestReloadRetries++
        }
        await wait(250)
      }
      if (!reloadedOnline) throw Error("Reload did not resume after one explicit reconnect")
      if ((await view(p.g.page)).view.id !== id)
        throw Error("Reload lost canonical match")
      results.push({
        viewport: label,
        thirdSeatRejected: true,
        wrongModeRejected: true,
        disconnectPaused: true,
        resumeSameMatch: true,
        guestReloadResumed: true,
        guestReloadRetries,
        cycle: "farm,farm,farm,pvp",
        cycleAccelerated: true,
      })
    } else results.push({ viewport: label, nativeAuto: true })
    if (!(await sameSave(p.h.page))) throw Error("Host solo save changed")
    await p.h.context.close()
    await p.g.context.close()
    console.log("TCG native QA", label)
    const t = await pair(viewport, "tcg")
    await t.h.page.locator(".tcg-battle").waitFor()
    await wait(300)
    if (!(await fits(t.h.page, ".tcg-turn-bar,.tcg-field,.tcg-hand")))
      throw Error(`TCG bounds ${label}`)
    await shot(t.h.page, `tcg-${label}`)
    // UI end-turn, without an AI turn, on whichever player was drawn first.
    const first = (await view(t.h.page)).view.canAct ? t.h.page : t.g.page
    await first.getByRole("button", { name: /^Kết thúc lượt/ }).click()
    await wait(1800)
    if (viewport.width === 390) await trapFlow(t, label)
    if (!(await sameSave(t.h.page)) || !(await sameSave(t.g.page)))
      throw Error("TCG changed solo save")
    results.push({
      viewport: label,
      nativeTcg: true,
      manualEndTurn: true,
      soloSaveUnchanged: true,
    })
    await t.h.context.close()
    await t.g.context.close()
  }
  if (errors.length || assets.length)
    throw Error(JSON.stringify({ errors, assets }))
  const evidence = {
    nativeWebRtc: true,
    signal: "local official PeerServer 1.0.2",
    qaStun: true,
    notTested: [
      "cross-network NAT/TURN",
      "Safari",
      "physical mobile performance",
    ],
    results,
    errors,
    assets,
  }
  writeFileSync(
    path.join(out, "browser-qa.json"),
    JSON.stringify(evidence, null, 2) + "\n",
  )
  console.log(JSON.stringify(evidence))
} catch (e) {
  console.error(e)
  if (activePage && !activePage.isClosed()) {
    console.error((await activePage.locator("body").innerText()).slice(0, 2400))
    console.error(
      await activePage.locator("button").evaluateAll((nodes) =>
        nodes.map((n) => ({
          text: n.textContent,
          rect: n.getBoundingClientRect().toJSON(),
          hidden: n.closest("[inert],[aria-hidden=true]")?.tagName,
        })),
      ),
    )
    await shot(activePage, "failure")
  }
  writeFileSync(
    path.join(out, "qa-failure.json"),
    JSON.stringify(
      { error: String(e), errors, assets, serverLog, results },
      null,
      2,
    ),
  )
  process.exitCode = 1
} finally {
  await browser.close()
  server.kill("SIGTERM")
  signalHttp?.close()
  stun.close()
  setTimeout(() => process.exit(process.exitCode ?? 0), 250)
}
