import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright")
const engine = process.env.QA_ENGINE ?? "chromium", port = process.env.QA_PORT ?? "4195"
const url = `http://127.0.0.1:${port}`, out = "dev/docs/web-v5911"
const errors = [], missing = [], checks = [], requested = new Set()
mkdirSync(`${out}/qa`, { recursive: true })
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--config", "dev/tools/vite.pvp-qa.config.ts", "--host", "127.0.0.1", "--port", port, "--strictPort"], { stdio: "pipe" })
let log = "", browser
server.stdout.on("data", v => log += v); server.stderr.on("data", v => log += v)
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(url)).ok) break } catch {}
    assert(i < 99, log)
    await new Promise(r => setTimeout(r, 100))
  }
  browser = await (engine === "webkit" ? webkit : chromium).launch({
    headless: true,
    executablePath: engine === "webkit" ? process.env.WEBKIT_BIN : process.env.CHROMIUM_BIN,
    ...(engine === "webkit" ? {} : {args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]}),
  })
  for (const viewport of [{width:320,height:568}, {width:390,height:844}, {width:844,height:390}, {width:1440,height:900}]) {
    const context = await browser.newContext({viewport}), page = await context.newPage()
    let clockInstalled = false
    page.on("pageerror", e => errors.push(e.message))
    page.on("response", r => {if (r.status() >= 400) missing.push([r.url(),r.status()])})
    page.on("request", r => requested.add(new URL(r.url()).pathname))
    for (const id of ["com-tam", "banh-mi", "goi-cuon-tom-thit", "takoyaki", "bingsu", "chef-bach"]) {
      await page.goto(`${url}/adventure?hero=${id}`)
      const notice = page.getByRole("button", {name:"Tắt thông báo",exact:true})
      if (await notice.isVisible()) await notice.click()
      await page.locator(".rpg-preview-button").waitFor()
      // Freeze only after UI mounts; production timers and code remain unchanged.
      if (!clockInstalled) {await page.clock.install();clockInstalled = true}
      await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 100))
      await page.locator(".rpg-preview-button").click()
      const banner = page.locator(`.ultimate-banner[data-showcase="${id}"]`)
      await banner.waitFor(); await page.clock.runFor(400)
      const layout = await banner.evaluate(async e => {
        await document.fonts.ready
        const {spiritArt} = await import("/src/game/adventureRpg/spiritArt.ts")
        const {CARD_MAP} = await import("/src/game/catalog.ts")
        const {SHOWCASE_THEMES} = await import("/src/game/ultimateShowcase.ts")
        const id = e.dataset.showcase, art = spiritArt(id), theme = SHOWCASE_THEMES[CARD_MAP[id].school]
        const image = src => new Promise((resolve,reject) => {const i=new Image();i.onload=()=>resolve([i.naturalWidth,i.naturalHeight]);i.onerror=()=>reject(Error(src));i.src=src})
        const sourceSize = await image(art.path); await image(theme.scene)
        const rect = node => {const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
        const scene=e.querySelector(".ultimate-landscape"), portrait=e.querySelector(".ultimate-portrait-image"), copy=e.querySelector(".ultimate-copy"), control=e.querySelector(".ultimate-controls")
        return {banner:rect(e),scene:rect(scene),portrait:rect(portrait),copy:rect(copy),control:rect(control),background:getComputedStyle(scene).backgroundImage,fit:getComputedStyle(scene).backgroundSize,portraitBackground:getComputedStyle(portrait).backgroundImage,portraitSize:getComputedStyle(portrait).backgroundSize,scenePath:theme.scene,art,sourceSize,preview:rect(e.closest(".rpg-showcase-preview")),count:document.querySelectorAll(".ultimate-banner").length}
      })
      assert.equal(layout.count,1)
      assert.match(layout.background,new RegExp(layout.scenePath.replaceAll(".","\\.")))
      assert.equal(layout.fit,"cover")
      assert(Math.abs(layout.scene.width - (layout.banner.width - 2)) < 1)
      assert(Math.abs(layout.scene.height - (layout.banner.height - 2)) < 1)
      assert(Math.abs(layout.portrait.width - layout.portrait.height) < 0.1, "Atlas must render on a square plane")
      assert.equal(layout.sourceSize[0],layout.sourceSize[1])
      assert.match(layout.portraitBackground,new RegExp(layout.art.path.replaceAll(".","\\.")))
      assert(layout.banner.left >= 0 && layout.banner.right <= viewport.width + 1)
      assert(layout.copy.right <= layout.control.left && layout.copy.width > 45,JSON.stringify(layout))
      assert(layout.control.bottom <= viewport.height && layout.control.top >= 0)
      if (id === "chef-bach") assert.equal(layout.art.path,"/assets/tcg/characters/anime/bach.webp")
      if (id === "takoyaki") {assert.equal(layout.art.columns,4);assert.equal(layout.portraitSize,"400% 400%")}
      if (["takoyaki","chef-bach"].includes(id) && [390,844].includes(viewport.width))
        await page.screenshot({path:`${out}/qa/${engine}-preview-${id}-${viewport.width}.png`})
      await page.getByRole("button",{name:"Bỏ qua ›",exact:true}).click()
      await page.locator(".rpg-showcase-preview").waitFor({state:"detached"})
      checks.push({id,viewport,layout,skipClosesPreview:true})
      await page.clock.resume()
    }
    await context.close()
  }
  assert.deepEqual(errors,[]); assert.deepEqual(missing,[])
  assert(![...requested].some(p=>p.endsWith(".mp4")))
  writeFileSync(`${out}/${engine}-banner-qa.json`,JSON.stringify({date:new Date().toISOString().slice(0,10),engine,version:browser.version(),checks,errors,missing,requestedScenes:[...requested].filter(p=>p.includes("/showcase5911/")),physicalDevice:false},null,2)+"\n")
  console.log(JSON.stringify({engine,checks:checks.length,errors,missing}))
} finally {await browser?.close();server.kill()}
