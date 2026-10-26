import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"

const { values } = parseArgs({ options: { playwright: { type: "string", default: "playwright" }, chromium: { type: "string" }, compiled: { type: "boolean", default: false } } })
const flavor = values.compiled ? "compiled" : "source", port = values.compiled ? 8641 : 8640
const out = ".asset-work/aw2-completion", key = "aw2.development.save"
const checks = [], errors = [], captures = []
let phase = "bootstrap", page, browser, bossTick = null
const server = values.compiled ? await preview({ configFile: "dev/vite.aw2.config.ts", preview: { host: "127.0.0.1", port, strictPort: true } }) : await createServer({ configFile: "dev/vite.dev.config.ts", server: { host: "127.0.0.1", port, strictPort: true } })
const check = (name, condition = true) => { assert.ok(condition, name); checks.push(name); console.log(name) }
const { chromium } = await import(values.playwright)
try {
  await mkdir(out, { recursive: true })
  if (!values.compiled) await server.listen()
  browser = await chromium.launch({ executablePath: values.chromium, headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "reduce" })
  await context.addInitScript(() => {
    const original = Storage.prototype.setItem
    window.__completionBlock = false
    Storage.prototype.setItem = function (k, value) { if (k === "aw2.development.save" && window.__completionBlock) throw Error("Completion QA denied write"); return original.call(this, k, value) }
  })
  page = await context.newPage()
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning" && /destroyed instead of unloaded|already has key/.test(m.text())) errors.push(m.text()) })
  page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`) })
  const url = `http://127.0.0.1:${port}/dev/aw2/game.html`
  const click = (name) => page.getByRole("button", { name, exact: true }).click()
  const raw = () => page.evaluate((k) => localStorage.getItem(k), key)
  const save = async () => JSON.parse(await raw())
  const map = () => page.getByTestId("world-map")
  const panel = () => page.getByTestId("game-panel")
  const ready = async () => { await map().locator("canvas[data-party-size='1']").waitFor(); await map().locator(".aw2-map-loading").waitFor({ state: "hidden" }) }
  const dock = (name) => page.getByRole("navigation", { name: "Menu game", exact: true }).getByRole("button", { name, exact: true })
  const scene = (value) => page.getByRole("combobox", { name: "Nội dung màn chơi", exact: true }).selectOption(value)
  const layout = async (name) => {
    const result = await page.evaluate(() => {
      const scope = document.querySelector("dialog[open]") ?? document.querySelector(".aw2-activity") ?? document.querySelector(".aw2-game-shell")
      const visible = (n) => n.getClientRects().length && getComputedStyle(n).visibility !== "hidden"
      const controls = [...scope.querySelectorAll("button,select")].filter(visible).map((n) => { const r = n.getBoundingClientRect(); return { text: n.getAttribute("aria-label") || n.textContent, x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height } })
      const overflow = [...scope.querySelectorAll(".aw2-activity-body,.aw2-activity-card,.aw2-activity-stack,.aw2-panel-content,.aw2-panel-body,.aw2-panel-stack,.aw2-paged-copy")].filter(visible).filter((n) => n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1).map((n) => ({ name: n.className, height: n.clientHeight, scroll: n.scrollHeight, width: n.clientWidth, scrollWidth: n.scrollWidth }))
      return { width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, documentHeight: document.documentElement.scrollHeight, controls, overflow }
    })
    assert.ok(result.documentWidth <= result.width && result.documentHeight <= result.height && !result.overflow.length, `${name}: no core scroll/clipping ${JSON.stringify(result.overflow)}`)
    assert.ok(result.controls.every((b) => b.width >= 43.9 && b.height >= 43.9 && b.x >= -.5 && b.y >= -.5 && b.right <= result.width + .5 && b.bottom <= result.height + .5), `${name}: native44px control bounds ${JSON.stringify(result.controls.filter((b) => b.y < 0 || b.bottom > result.height || b.height < 43.9))}`)
    check(`${name}: viewport/no-clipping/native44px`)
  }
  const capture = async (name) => { const path = `${out}/${flavor}-${name}.png`; await page.screenshot({ path }); captures.push(path) }
  const matrix = async (name) => {
    for (const [width, height] of [[320,568],[390,844],[844,390],[1280,720]]) {
      for (const font of [16,20]) {
        await page.setViewportSize({ width, height })
        await page.evaluate((font) => document.documentElement.style.fontSize = `${font}px`, font)
        const pages = await page.getByRole("combobox", { name: "Nội dung màn chơi", exact: true }).locator("option").evaluateAll((nodes) => nodes.map((n) => n.value))
        for (const option of pages) { await scene(option); await layout(`${name}/${width}/${font}/${option}`) }
        if (font === 20 && width !== 390) await capture(`${name}-${width}-large`)
      }
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await page.evaluate(() => document.documentElement.style.fontSize = "")
  }
  const close = async () => { await page.keyboard.press("Escape"); await panel().waitFor({ state: "hidden" }) }
  const direction = async () => {
    await dock("Nhiệm vụ").click()
    const goal = Math.min((await save()).progress.questIndex, 3)
    const nav = panel().getByRole("navigation", { name: "Phân trang Nhiệm vụ" })
    for (let i=0;i<4;i++) { const m = (await nav.textContent()).match(/Nhiệm vụ (\d)\/4/); if (+m[1] === goal+1) break; await nav.getByRole("button", { name: +m[1] > goal+1 ? "Nhiệm vụ trước" : "Nhiệm vụ sau", exact:true }).click() }
    await panel().getByRole("button", { name: "Chỉ đường", exact: true }).click()
    const button = panel().locator('[data-testid^="game-quest-walk-"]')
    const point = { x: +(await button.getAttribute("data-approach-x")), y: +(await button.getAttribute("data-approach-y")) }, before = await raw()
    await button.click(); await panel().waitFor({ state: "hidden" })
    await page.waitForFunction(({x,y}) => { const m = document.querySelector('[data-testid="player-position"]').textContent.match(/Vị trí (\d+), (\d+)/); return m && Math.abs(+m[1]-x)<=1 && Math.abs(+m[2]-y)<=1 }, point, {timeout:15000})
    assert.equal(await raw(), before)
    await map().focus(); await page.keyboard.press("e"); await page.getByRole("dialog").waitFor()
  }
  const action = async (name) => { await page.getByRole("dialog").getByRole("button", { name, exact:true }).click(); await page.getByRole("dialog").waitFor({state:"hidden"}); await ready() }
  const reach = async (name) => { for (let i=0;i<7;i++) { await direction(); if (await page.getByRole("dialog").getByRole("button",{name,exact:true}).count()) { await action(name); return }; await action("Đi qua") }; throw Error(`Cannot reach ${name}`) }
  const enter = async (name) => { await dock("Thêm").click(); await panel().getByRole("button", {name,exact:true}).click(); await page.getByTestId("mode-lobby").waitFor() }
  await page.goto(url)
  await page.evaluate(() => { localStorage.setItem("foodchest.tcg.v1", "completion-legacy"); localStorage.setItem("foodchest.user.v1", "completion-user") })
  await click("Tạo bản lưu AW2"); await ready()
  await reach("Nhận nhiệm vụ"); await reach("Đọc mảnh khăn"); await reach("Hoàn tất nhập môn")
  check("Fresh native intro: five starters,30XP,one map representative", (await save()).economy.teamExperience===30 && (await save()).progress.partyIds.length===5)
  phase = "overview"
  await dock("Thêm").click(); await panel().getByRole("button",{name:"Bản đồ hành trình",exact:true}).click()
  const overview = page.getByTestId("journey-overview"), region = overview.getByRole("combobox",{name:"Vùng trên bản đồ hành trình"})
  const beforeOverview = await raw()
  for (const [width,height] of [[320,568],[390,844],[844,390],[1280,720]]) {
    await page.setViewportSize({width,height}); await page.evaluate(() => document.documentElement.style.fontSize="20px")
    for (const id of await region.locator("option").evaluateAll((nodes)=>nodes.map(n=>n.value))) {
      await region.selectOption(id); await layout(`overview/${width}/${id}/route`)
      if (/pantry|hearth|table/.test(id)) assert.ok(await page.getByTestId("overview-walk").isDisabled())
      await overview.getByRole("button",{name:"Cửa nối",exact:true}).click(); await layout(`overview/${width}/${id}/doors`)
      await overview.getByRole("button",{name:"Đường đi",exact:true}).click()
    }
  }
  check("All six-region menus and locked routes are read-only", await raw()===beforeOverview)
  await region.selectOption("aw2-zone-lantern-street")
  await page.setViewportSize({width:390,height:844}); await page.evaluate(()=>document.documentElement.style.fontSize="")
  await page.getByTestId("overview-walk").click(); await panel().waitFor({state:"hidden"})
  await page.waitForFunction(()=>document.querySelector('[data-testid="player-position"]').textContent.includes("592, 192"),null,{timeout:15000})
  check("Overview queues only local walking, no automatic travel/write and restores focus", await raw()===beforeOverview && await map().evaluate(n=>n===document.activeElement))
  await dock("Nhiệm vụ").click(); await panel().getByRole("button",{name:"Mục tiêu",exact:true}).click(); await click("Bỏ ghim mục tiêu"); await close()
  phase = "tcg"
  await enter("Ghé TCG"); await matrix("lobby-tcg"); await scene("welcome"); await click("Chơi TCG thử")
  const tcgCheckpoint = await raw()
  await matrix("tcg-initial")
  let attacked = false
  for (let attempt=0; attempt<12 && !attacked; attempt++) {
    await scene("player")
    const attack = page.getByRole("button", { name: /^Tấn công bằng/ })
    if (await attack.count() && await attack.isEnabled()) {
      await attack.click()
      check("Native attack selection opens opponent targeting", await page.getByTestId("activity-page").getAttribute("data-page")==="opponent")
      for(let target=0;target<4;target++) {
        const hit=page.getByRole("button",{name:/^Nhắm /})
        if(await hit.count()){ await hit.click(); attacked=true; break }
        const next=page.getByRole("button",{name:"Mục tiêu sau",exact:true})
        if(await next.isEnabled()) await next.click(); else break
      }
    }
    if (!attacked) { await scene("turn"); await click("Chơi nước gợi ý") }
  }
  check("TCG manual attack resolves an actual legal selected target", attacked)
  await scene("turn")
  for(let i=0;i<200 && await page.getByTestId("tcg-practice").getAttribute("data-status")==="active";i++) { await scene("turn"); await click("Chơi nước gợi ý") }
  check("TCG completes real legal suggested actions through a terminal game", await page.getByTestId("tcg-practice").getAttribute("data-status")!=="active")
  await matrix("tcg-terminal")
  check("TCG rounds do not change saved world/items/EXP", await raw()===tcgCheckpoint)
  await click("Trở về hành trình"); await ready()
  check("Journal pin survives actual TCG round and return", (await page.getByTestId("quest-objective").textContent()).includes("Mở Nhật ký"))
  await dock("Thêm").click(); await click("Bản đồ hành trình")
  check("Overview selection survives practice return", await region.inputValue()==="aw2-zone-lantern-street")
  await close()
  phase = "chess"
  await enter("Ghé Auto Chess"); await scene("welcome"); await click("Chơi Auto Chess thử")
  const chessCheckpoint = await raw()
  await matrix("chess-planning")
  await scene("shop")
  for(let slot=0;slot<3;slot++) { const buy=page.getByRole("button",{name:/^Mua /}); if(await buy.count() && await buy.isEnabled()) await buy.click(); const next=page.getByRole("button",{name:"Quầy sau",exact:true}); if(await next.isEnabled()) await next.click() }
  await scene("actions"); await click("Xếp đội gợi ý")
  await scene("formation"); await layout("chess-populated-formation"); await capture("chess-formation")
  await click("Bắt đầu giao tranh"); await scene("actions")
  await matrix("chess-battle")
  await scene("actions")
  for(let tick=0;tick<85 && await page.getByTestId("chess-practice").getAttribute("data-phase")==="battle";tick++) await click("Tiến một nhịp")
  check("Chess executes actual placements and real combat to a round result", ["round-result","finished"].includes(await page.getByTestId("chess-practice").getAttribute("data-phase")))
  if(await page.getByTestId("chess-practice").getAttribute("data-phase")==="round-result") { await click("Vòng tiếp · nhận 6 vàng"); check("Chess next round uses actual economy", await page.getByTestId("chess-practice").getAttribute("data-round")==="2") }
  check("Chess planning and fighting do not spend world inventory or grant rewards", await raw()===chessCheckpoint)
  await scene("actions"); await click("Nhận thua ván cờ"); await click("Trở về hành trình"); await ready()
  phase="journey"
  await reach("Nhận nhiệm vụ") // street acceptance
  for(let memory=0;memory<3;memory++) await reach("Ghi nhớ câu chuyện")
  await reach("Người trở lại")
  await reach("Nhận nhiệm vụ") // Dì
  await reach("Ghi lại gợi ý")
  for(const step of ["Mở lối thoát","Đặt nồi","Nhóm lửa"]) await reach(step)
  await reach("Báo đã mở bếp")
  await reach("Nhận nhiệm vụ") // final quest
  // Reach a real boss via the native journal and explicit portal actions.
  for(let hop=0;hop<7;hop++) {
    await direction()
    if(await page.getByRole("dialog").getByRole("button",{name:"Bắt đầu thử thách",exact:true}).count()) break
    await action("Đi qua")
  }
  await page.getByRole("dialog").getByRole("button",{name:"Bắt đầu thử thách",exact:true}).click()
  await page.getByTestId("world-battle").waitFor(); await click("Tạm dừng"); await scene("controls")
  const bossCheckpoint = await raw()
  await matrix("boss-active")
  phase="boss"
  const battle=page.getByTestId("world-battle")
  for(let turn=0;turn<180 && await battle.getAttribute("data-status")==="active";turn++) {
    if(+(await battle.getAttribute("data-tick"))>=5) {
      await scene("team")
      const prev=page.getByRole("button",{name:"Vị Linh trước",exact:true}), next=page.getByRole("button",{name:"Vị Linh sau",exact:true})
      while(await prev.isEnabled()) await prev.click()
      for(let unit=0;unit<5;unit++) {
        const ultimate=page.locator('[data-testid^="world-ultimate-"]')
        if(await ultimate.isEnabled()) await ultimate.click()
        if(await battle.getAttribute("data-status")!=="active") break
        if(unit<4) await next.click()
      }
    }
    if(await battle.getAttribute("data-status")==="active") { await scene("controls"); await click("Bước 1 nhịp") }
  }
  bossTick=+(await battle.getAttribute("data-tick"))
  check("Fresh full guided journey wins actual boss using saved team and manual ultimates", await battle.getAttribute("data-status")==="player-win")
  check("Uncommitted result preserves exact checkpoint", await raw()===bossCheckpoint)
  await matrix("boss-terminal")
  await page.evaluate(()=>window.__completionBlock=true)
  await click("Lưu kết quả và trở về")
  await page.getByRole("alert").filter({hasText:/Chưa lưu được AW2/}).waitFor()
  check("Failed settlement is visible and retryable with exact save preserved", await raw()===bossCheckpoint)
  await layout("boss-failed-write")
  await page.evaluate(()=>window.__completionBlock=false)
  await click("Lưu kết quả và trở về"); await ready()
  check("Explicit retry commits actual win once", (await save()).progress.bossDefeated && !(await save()).progress.tableNoteRead)
  await reach("Đọc ghi chép"); await reach("Mời cả làng dùng bữa")
  const complete=await raw()
  await page.reload(); await ready()
  check("Ending reload preserves earned collection/items/EXP/receipts exactly", await raw()===complete && (await save()).progress.questIndex===4)
  await capture("completed-world")
  check("Both legacy sentinel saves remain byte-identical", await page.evaluate(()=>localStorage.getItem("foodchest.tcg.v1")==="completion-legacy" && localStorage.getItem("foodchest.user.v1")==="completion-user"))
  check("No unexpected browser/resource/lifecycle errors", errors.length===0)
  await writeFile(`${out}/${flavor}-browser.json`,JSON.stringify({task:"AW2-015B/016A/008B",status:"PASS",flavor,checks,freshAssertions:checks.length,retainedAssertions:0,errors,captures,bossTick,observedRaw:await raw(),limitations:"Native automated fresh journey and fixed-viewport checks; not independent human/physical phone/FPS/GPU-memory/rights acceptance. One TCG game and one Chess round with next-round transition, not all strategy branches."},null,2)+"\n")
  console.log(`PASS ${flavor} ${checks.length}`)
} catch(error) {
  await page?.screenshot({path:`${out}/${flavor}-failure.png`}).catch(()=>{})
  await writeFile(`${out}/${flavor}-browser.json`,JSON.stringify({status:"FAIL",phase,flavor,checks,errors,error:String(error.stack||error),observedRaw:await page?.evaluate(k=>localStorage.getItem(k),key).catch(()=>null)},null,2)+"\n")
  throw error
} finally { await browser?.close(); await server.close() }
