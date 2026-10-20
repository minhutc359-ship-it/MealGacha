import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { createServer } from "vite"
const { values } = parseArgs({ options: {
  playwright: { type: "string", default: "playwright" }, chromium: {type:"string"},
  port: {type:"string", default:"8454"},
} })
const { chromium } = await import(values.playwright)
// Owning the server and browser in one process also supports isolated runner networking.
const server = await createServer({configFile:"dev/vite.dev.config.ts",server:{host:"127.0.0.1",port:Number(values.port),strictPort:true}})
await server.listen()
const browser = await chromium.launch({executablePath:values.chromium,headless:true,args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]})
const url=`http://127.0.0.1:${values.port}/dev/aw2/world.html`,key="aw2.development.save"
const out=".asset-work/aw2-013"
await mkdir(out,{recursive:true})
const checks=[],errors=[],worldImages=new Set()
const check=(name,condition=true)=>{assert.ok(condition,name);checks.push(name);console.log(name)}
try {
  const context=await browser.newContext({viewport:{width:1280,height:1000}})
  context.on('response',response=>{if(new URL(response.url()).pathname.endsWith('/world.webp')&&response.ok())worldImages.add(response.url())})
  const page=await context.newPage()
  page.on("pageerror",error=>errors.push(error.message))
  page.on("console",message=>{if(message.type()==="error")errors.push(message.text())})
  await page.addInitScript(() => performance.setResourceTimingBufferSize(2000))
  await page.goto(url)
  await page.evaluate(async()=>{
    const {newWorldProgress}=await import('/src/aw2/world/model.ts')
    const {ZONE_IDS,MEMORY_IDS,STARTER_TEAM}=await import('/src/aw2/world/ids.ts')
    localStorage.setItem('foodchest.tcg.v1','stable-original')
    localStorage.setItem('aw2.development.save',JSON.stringify({gameId:'adventure-world-2',environment:'development',schemaVersion:3,
      saveId:'00000000-0000-4000-8000-000000000001',revision:7,createdAt:'2026-10-20T08:00:00.000Z',updatedAt:'2026-10-20T08:00:00.000Z',
      progress:{...newWorldProgress(),zoneId:ZONE_IDS[3],x:432,y:272,questIndex:3,tableRead:true,memories:[...MEMORY_IDS],threadChoice:'wait',hintRead:true,puzzleStep:3,partyIds:[...STARTER_TEAM]}}))
  })
  const raw=()=>page.evaluate(key=>localStorage.getItem(key),key)
  const read=()=>page.getByRole('button',{name:'Đọc lại',exact:true}).click()
  const reload=async()=>{await page.reload();await page.locator('canvas[data-party-size="5"]').waitFor()}
  const status=async(text)=>page.getByRole('status').filter({hasText:text}).waitFor()
  const original=await raw();await reload()
  check('v3 migration is read-only until an explicit action',await raw()===original)
  check('All five authored world atlases are decoded',worldImages.size===5)
  await page.keyboard.press('e');await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape')
  check('Closing chest dialogue grants nothing',await raw()===original)
  const failWrites=async(fail)=>page.evaluate(({key,fail})=>{
    window.__aw2OriginalSet??=Storage.prototype.setItem
    Storage.prototype.setItem=fail?function(k,v){if(k===key)throw new DOMException('full','QuotaExceededError');window.__aw2OriginalSet.call(this,k,v)}:window.__aw2OriginalSet
  },{key,fail})
  await page.keyboard.press('e');await failWrites(true)
  await page.getByRole('button',{name:'Mở rương nguyên liệu',exact:true}).click()
  await page.getByRole('dialog').getByRole('alert').waitFor()
  check('Failed chest write preserves raw bytes and unclaimed UI',await raw()===original)
  await failWrites(false);await page.getByRole('button',{name:'Mở rương nguyên liệu',exact:true}).click();await status('Đã nhận nguyên liệu')
  const claimed=JSON.parse(await raw())
  check('Chest inventory and receipt commit together',claimed.schemaVersion===4&&claimed.economy.inventory.rice===4&&claimed.economy.receipts.length===1)
  await reload();await page.keyboard.press('e')
  check('Chest cannot be claimed again after reload',await page.getByRole('button',{name:'Đã nhận rương',exact:true}).isDisabled())
  await page.keyboard.press('Escape')
  await page.locator('.aw2-bag-panel > summary').click()
  await page.getByRole('button',{name:'Nhận quà 3 nhiệm vụ đã hoàn tất',exact:true}).click();await status('Đã nhận quà')
  check('Old completed quests grant once and level the party',JSON.parse(await raw()).economy.teamExperience===160)
  const place=async(zone,x,y)=>{
    await page.evaluate(({key,zone,x,y})=>{const s=JSON.parse(localStorage.getItem(key));Object.assign(s.progress,{zoneId:zone,x,y});s.revision++;localStorage.setItem(key,JSON.stringify(s))},{key,zone,x,y})
    await read();await page.locator('canvas[data-party-size="5"]').waitFor()
  }
  await place('aw2-zone-forgotten-kitchen-yard',320,128)
  await page.getByText('Nấu và chia một bữa ấm',{exact:true}).click()
  const beforeCook=JSON.parse(await raw())
  await page.getByRole('button',{name:'Nấu Chén cơm ấm',exact:true}).click();await status('Đã nấu')
  let state=JSON.parse(await raw())
  check('Cooking consumes exact ingredients and persists one meal',state.economy.inventory.rice===beforeCook.economy.inventory.rice-1&&state.economy.inventory['warm-bowl']===1)
  await page.getByRole('button',{name:'Chia bữa · +45 EXP',exact:true}).click();await status('Bữa ăn được chia sẻ')
  state=JSON.parse(await raw())
  check('Sharing consumes the meal and grants XP atomically',state.economy.teamExperience===205&&state.economy.inventory['warm-bowl']===0&&state.economy.shared===1)
  check('Empty meal inventory disables repeat sharing',await page.getByRole('button',{name:'Chia bữa · +45 EXP',exact:true}).isDisabled())
  await reload();check('Inventory and EXP survive reload',JSON.parse(await raw()).economy.teamExperience===205)
  // Seed only a position in this isolated profile; the route itself is exercised via pointer input.
  await place('aw2-zone-forgotten-kitchen-yard',240,336)
  const map=page.getByTestId('world-map');await map.scrollIntoViewIfNeeded()
  const box=await map.boundingBox();await page.mouse.click(box.x+400/640*box.width,box.y+336/384*box.height)
  await page.waitForFunction(()=>/Vị trí 400, 336/.test(document.querySelector('[data-testid="player-position"]').textContent))
  check('Touch/click path navigates around the wall to the exact target')
  const stopAt=await page.getByTestId('player-position').innerText()
  await page.waitForTimeout(120)
  check('Reaching a tap target stops movement',await page.getByTestId('player-position').innerText()===stopAt)
  await page.screenshot({path:`${out}/world-desktop.png`,fullPage:true})
  for(const width of [320,390,768]) {
    await page.setViewportSize({width,height:844});await page.waitForTimeout(60)
    check(`World/inventory fits ${width}px`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  }
  await page.setViewportSize({width:390,height:844})
  await page.screenshot({path:`${out}/world-mobile.png`,fullPage:true})
  // Cross-tab writes preserve the newer inventory and expose the conflict.
  const second=await context.newPage();await second.goto(url);await second.locator('canvas').waitFor()
  await second.getByRole('button',{name:'Lưu vị trí',exact:true}).click()
  await second.getByRole('status').filter({hasText:'Đã lưu vị trí'}).waitFor()
  const newest=await raw();await page.getByRole('button',{name:'Lưu vị trí',exact:true}).click()
  await page.getByRole('alert').filter({hasText:'tab khác'}).waitFor()
  check('Stale tab cannot overwrite newer inventory',await raw()===newest)
  check('Stable legacy save remains byte-identical',await page.evaluate(()=>localStorage.getItem('foodchest.tcg.v1'))==='stable-original')
  const audioRequests=new Set()
  page.on('request',request=>{if(request.url().endsWith('.wav'))audioRequests.add(request.url())})
  await page.goto(url.replace('world.html','battle.html'))
  await page.locator('canvas[data-tick]').waitFor()
  await page.getByRole('button',{name:'Tạm dừng',exact:true}).click()
  check('Battle audio is opt-in; no WAV is requested by default',audioRequests.size===0)
  await page.getByLabel('Âm thanh',{exact:true}).check()
  await page.getByRole('button',{name:'Tiếp tục',exact:true}).click()
  await page.waitForFunction(()=>Number(document.querySelector('canvas').dataset.tick)>=7)
  check('Confirmed combat events request authored WAV cues after opt-in',audioRequests.size>0)
  await page.getByRole('button',{name:'Tạm dừng',exact:true}).click()
  await page.getByLabel('Âm thanh',{exact:true}).uncheck()
  check('No page or console errors',errors.length===0)
  await context.close()
  const report={status:'PASS',checks,errors,engine:browser.version(),viewports:[1280,768,390,320],scope:'isolated desktop Chromium; not physical-device QA'}
  await writeFile(`${out}/browser.json`,JSON.stringify(report,null,2)+'\n')
  console.log(JSON.stringify({status:'PASS',checks:checks.length,report:`${out}/browser.json`}))
} finally {await browser.close();await server.close()}
