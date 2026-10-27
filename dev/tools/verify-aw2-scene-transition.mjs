import assert from "node:assert/strict"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"
import { tapWorldPoint } from "./aw2-world-browser-view.mjs"

const { values } = parseArgs({ options: {
  playwright: { type:"string", default:"playwright" }, chromium: { type:"string" }, compiled: { type:"boolean", default:false },
} })
const flavor=values.compiled?"compiled":"source", port=values.compiled?8661:8660,
  out=".asset-work/aw2-016c", key="aw2.development.save", id="aw2-npc-dem-nuoc",
  atlas="/dev/aw2/assets/npcs/dem-nuoc/patrol-v1/patrol.webp",
  url=`http://127.0.0.1:${port}/dev/aw2/game.html`, checks=[], errors=[], expectedErrors=[], captures=[], requests=[], samples=[]
const hash=s=>createHash("sha256").update(s).digest("hex")
const legacy={"foodchest.user.v1":"016b-user","foodchest.tcg.v1":"016b-cards","foodchest.tcg.v1.checkpoint.v4":"016b-checkpoint","mealgacha.progress-journal.v4":"016b-journal","mealgacha.progress-writer.v4":"016b-writer"}
const check=(name,ok=true)=>{assert.ok(ok,name);checks.push(name);console.log(name)}
const server=values.compiled
  ? await preview({configFile:"dev/vite.aw2.config.ts",preview:{host:"127.0.0.1",port,strictPort:true}})
  : await createServer({configFile:"dev/vite.dev.config.ts",server:{host:"127.0.0.1",port,strictPort:true}})
const {chromium}=await import(values.playwright)
let browser,page,phase="bootstrap",fault="",finalRaw="",fingerprint=null
try {
  if(!values.compiled)await server.listen()
  await mkdir(out,{recursive:true})
  browser=await chromium.launch({env:{...process.env,LD_LIBRARY_PATH:values.chromium?.slice(0,values.chromium.lastIndexOf("/"))},executablePath:values.chromium,headless:true,args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]})
  const context=await browser.newContext({viewport:{width:1280,height:900},hasTouch:true,reducedMotion:"no-preference"})
  await context.addInitScript(()=>{
    window.__travelWrites=0;window.__travelFail=false
    const set=Storage.prototype.setItem
    Storage.prototype.setItem=function(k,v){
      if(k==="aw2.development.save"){
        window.__travelWrites++
        if(window.__travelFail)throw new DOMException("transition simulated write failure","QuotaExceededError")
      }
      const result=set.call(this,k,v);if(k==="aw2.development.save")window.__lastTravelWrite=performance.now();return result
    }
  })
  page=await context.newPage()
  page.setDefaultTimeout(45000)
  page.on("pageerror",e=>errors.push(e.message))
  page.on("request",r=>requests.push(new URL(r.url()).pathname))
  page.on("response",r=>{if(r.status()>=400)(fault&&new URL(r.url()).pathname===fault?expectedErrors:errors).push(`${r.status()} ${r.url()}`)})
  page.on("console",m=>{
    if(m.type()==="error")(fault&&/404|Failed to load|Error loading|Could not load/.test(m.text())?expectedErrors:errors).push(m.text())
    if(m.type()==="warning"&&/destroyed instead of unloaded|already has key/.test(m.text()))errors.push(m.text())
  })
  const raw=()=>page.evaluate(k=>localStorage.getItem(k),key), save=async()=>JSON.parse(await raw()),
    writes=()=>page.evaluate(()=>window.__travelWrites), map=()=>page.getByTestId("world-map"), canvas=()=>map().locator("canvas"),
    panel=()=>page.getByTestId("game-panel"), dialog=()=>page.locator('dialog[open]:not(.aw2-game-panel)'),
    click=name=>page.getByRole("button",{name,exact:true}).click(),
    npc=async()=>JSON.parse(await canvas().getAttribute("data-npc-motion")).find(n=>n.entityId===id),
    pose=async()=>{const p=await npc();return {x:p.x,y:p.y,frame:p.frame,held:p.held}},
    dock=name=>page.getByRole("navigation",{name:"Menu game",exact:true}).getByRole("button",{name,exact:true})
  const ready=async()=>{
    await canvas().waitFor()
    await map().locator(".aw2-map-loading").waitFor({state:"hidden"})
    await page.waitForFunction(()=>document.querySelector('[data-testid="world-map"] canvas')?.dataset.worldCamera)
  }
  const arrive=(x,y)=>page.waitForFunction(({x,y})=>{
    const p=document.querySelector('[data-testid="player-position"]')?.textContent.match(/Vị trí (\d+), (\d+)/)
    return p&&Math.abs(+p[1]-x)<=1&&Math.abs(+p[2]-y)<=1
  },{x,y})
  const go=async(x,y)=>{
    await ready();await click("Toàn cảnh");
    await page.waitForFunction(()=>JSON.parse(document.querySelector('[data-testid="world-map"] canvas').dataset.worldCamera).mode==="overview")
    await tapWorldPoint(page,x,y);await arrive(x,y)
  }
  const interact=async(action)=>{
    await map().focus();await page.keyboard.press("e");await dialog().waitFor()
    if(action){await dialog().getByRole("button",{name:action,exact:true}).click();await dialog().waitFor({state:"hidden"})}
  }
  const close=async()=>{await page.keyboard.press("Escape");await page.locator("dialog[open]").waitFor({state:"hidden"})}
  const capture=async name=>{const path=`${out}/${flavor}-${name}.png`;await page.screenshot({path});captures.push(path)}
  const menu=async()=>{await dock("Thêm").click();await panel().waitFor()}
  const idle=()=>page.waitForFunction(id=>{
    const c=document.querySelector('[data-testid="world-map"] canvas')
    const n=c?.dataset.npcMotion&&JSON.parse(c.dataset.npcMotion).find(n=>n.entityId===id)
    return n&&!n.moving&&n.frame.endsWith("-idle")
  },id)
  const held=()=>page.waitForFunction(id=>{
    const c=document.querySelector('[data-testid="world-map"] canvas')
    return c?.dataset.npcMotion&&JSON.parse(c.dataset.npcMotion).some(n=>n.entityId===id&&n.held&&!n.moving)
  },id)
  const layout=async label=>{
    const m=await page.evaluate(()=>{
      const scope=document.querySelector('dialog[open]')??document.querySelector('[data-testid="game-shell"]')
      return {width:innerWidth,height:innerHeight,doc:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],buttons:[...scope.querySelectorAll('button')].filter(b=>b.getClientRects().length&&getComputedStyle(b).visibility!=="hidden").map(b=>{const r=b.getBoundingClientRect();return {text:b.textContent,x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height}})}
    })
    check(`${label}: fixed document fits viewport`,m.doc[0]<=m.width&&m.doc[1]<=m.height)
    check(`${label}: all visible controls are44px and inside viewport`,m.buttons.length>0&&m.buttons.every(b=>b.w>=43.9&&b.h>=43.9&&b.x>=-.5&&b.y>=-.5&&b.right<=m.width+.5&&b.bottom<=m.height+.5))
    return m
  }
  phase="fresh-intro"
  await page.goto(url)
  await page.getByRole("button",{name:"Tạo bản lưu AW2",exact:true}).waitFor()
  await page.evaluate(v=>Object.entries(v).forEach(([k,s])=>localStorage.setItem(k,s)),legacy)
  await click("Tạo bản lưu AW2");await ready()
  await go(160,272);await interact("Nhận nhiệm vụ")
  await go(160,176);await interact("Đọc mảnh khăn")
  await go(160,272);await interact("Hoàn tất nhập môn")
  check("Fresh actual intro produces five starters and30XP",(await save()).progress.partyIds.length===5&&(await save()).economy.teamExperience===30)
  const sourceProof=async()=>({raw:await raw(),pos:await page.getByTestId("player-position").textContent(),token:await canvas().evaluate(c=>{c.__transitionIdentity??=crypto.randomUUID();return c.__transitionIdentity})})
  const sourceSame=async(label,before)=>{
    check(`${label}: exact raw save retained`,await raw()===before.raw)
    check(`${label}: source position/canvas retained`,await page.getByTestId("player-position").textContent()===before.pos&&await canvas().evaluate(c=>c.__transitionIdentity)===before.token)
  }
  const retry=()=>dialog().getByRole("button",{name:"Thử lại chuyển vùng",exact:true}).click()
  const waitTravel=async(name)=>{await dialog().waitFor({state:"hidden"});await page.getByTestId("zone-name").filter({hasText:name}).waitFor();await ready()}
  const door=async(x)=>{await go(x,192);await interact()}
  const travel=async(x,name)=>{
    await door(x)
    await page.evaluate(()=>performance.clearResourceTimings())
    await dialog().getByRole("button",{name:"Đi qua",exact:true}).click()
    await waitTravel(name)
    const late=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.webp')&&(r.startTime>window.__lastTravelWrite||r.responseEnd>window.__lastTravelWrite+1)).map(r=>r.name))
    check(`${name}: required image requests finish before save commit`,late.length===0)
    check(`${name}: exactly one map representative remains`,await canvas().getAttribute('data-party-size')==='1')
  }
  phase="cancel-and-missing-asset"
  await door(616)
  const source=await sourceProof(),count=await writes()
  let unblock;const gate=new Promise(resolve=>unblock=resolve)
  let blocked=true,missing=true,attempts=0
  fault=atlas
  await page.route(`**${atlas}`,async route=>{
    attempts++
    if(blocked)await gate
    if(missing)await route.fulfill({status:404,body:"016C required destination asset fault"})
    else await route.continue()
  })
  await dialog().getByRole("button",{name:"Đi qua",exact:true}).click()
  await page.getByTestId('travel-progress').waitFor()
  check("Delayed destination has no save attempts",await writes()===count)
  await sourceSame("Loading",source)
  for(const [width,height]of [[320,568],[390,844],[768,1024],[1280,900]]){
    await page.setViewportSize({width,height});await page.evaluate(()=>document.documentElement.style.fontSize='20px')
    await layout(`${width}x${height}/20px progress`)
    check(`${width}: loading dialogue content is not clipped`,await dialog().evaluate(d=>d.scrollHeight<=d.clientHeight+1))
    if(width===390)await capture('preparing-390')
  }
  check("Only one selected destination request is in flight",attempts===1)
  await dialog().getByRole('button',{name:'Hủy chuyển vùng',exact:true}).click()
  await page.getByTestId('travel-progress').waitFor({state:'hidden'})
  await sourceSame("Cancel",source)
  const cancelledResponse=page.waitForResponse(r=>new URL(r.url()).pathname===atlas)
  blocked=false;unblock();await cancelledResponse
  await page.waitForTimeout(100)
  await sourceSame("Late failure after cancel",source)
  await page.evaluate(()=>document.documentElement.style.fontSize='16px');await page.setViewportSize({width:1280,height:900})
  await dialog().getByRole('button',{name:'Đi qua',exact:true}).click()
  await dialog().getByRole('alert').waitFor()
  await sourceSame("404 before commit",source)
  check("Asset failure offers explicit retry with no fake destination",await dialog().getByRole('button',{name:'Thử lại chuyển vùng',exact:true}).isEnabled()&&await page.getByTestId('zone-name').textContent()==='Làng Giao Ước')
  missing=false
  await page.evaluate(()=>window.__travelFail=true)
  await retry();await dialog().getByRole('alert').filter({hasText:'Chưa lưu được AW2'}).waitFor()
  await sourceSame("Save write failure after assets ready",source)
  check("Required assets recovered before failed write",attempts>=3)
  await page.evaluate(()=>window.__travelFail=false)
  const beforeCommit=await writes()
  await retry();await waitTravel('Phố Đèn Lồng')
  check("Successful retry commits exactly once",await writes()===beforeCommit+1&&(await save()).progress.zoneId==='aw2-zone-lantern-street'&&(await save()).economy.teamExperience===30)
  await page.unroute(`**${atlas}`);fault=''
  phase="stale-tab-during-preparation"
  await door(616)
  const streetSource=await sourceProof()
  const yardAtlas='/dev/aw2/assets/environments/ambient/v2/yard-water.webp'
  let releaseYard;const yardGate=new Promise(resolve=>releaseYard=resolve)
  await page.route(`**${yardAtlas}`,async route=>{await yardGate;await route.continue()})
  await dialog().getByRole('button',{name:'Đi qua',exact:true}).click();await page.getByTestId('travel-progress').waitFor()
  await page.waitForFunction(()=>{
    const p=JSON.parse(document.querySelector('[data-testid="world-map"] canvas').dataset.npcMotion).find(n=>n.entityId==='aw2-npc-dem-nuoc');return !p.moving
  })
  const npcBefore=await pose();await page.waitForTimeout(200)
  check("Source moving NPC freezes while preparing destination",JSON.stringify(await pose())===JSON.stringify(npcBefore))
  const second=await context.newPage();await second.goto(url)
  await second.getByTestId('world-map').locator('canvas').waitFor();await second.getByTestId('world-map').locator('.aw2-map-loading').waitFor({state:'hidden'})
  await second.getByRole('button',{name:'Toàn cảnh',exact:true}).click();await second.waitForTimeout(80)
  await tapWorldPoint(second,96,192)
  await second.waitForFunction(()=>document.querySelector('[data-testid="player-position"]').textContent.includes('Vị trí 96, 192'))
  await second.getByRole('navigation',{name:'Menu game',exact:true}).getByRole('button',{name:'Thêm',exact:true}).click()
  await second.getByTestId('game-panel').getByRole('button',{name:'Lưu vị trí',exact:true}).click()
  await second.waitForFunction(()=>Math.abs(JSON.parse(localStorage.getItem('aw2.development.save')).progress.x-96)<1)
  const external=await second.evaluate(k=>localStorage.getItem(k),key)
  check("Other tab saves a real earned position",external!==streetSource.raw&&JSON.parse(external).progress.zoneId==='aw2-zone-lantern-street')
  await second.close();await page.bringToFront();releaseYard()
  await page.getByTestId('travel-progress').waitFor({state:'hidden'})
  await dialog().getByRole('alert').filter({hasText:'tab khác'}).waitFor()
  check("Stale transition cannot overwrite the other tab's exact save",await raw()===external)
  check("Stale transition keeps source canvas and position",await page.getByTestId('player-position').textContent()===streetSource.pos&&await canvas().evaluate(c=>c.__transitionIdentity)===streetSource.token)
  await page.unroute(`**${yardAtlas}`)
  await close();await menu();await panel().getByRole('button',{name:'Đọc lại',exact:true}).click();await ready()
  check("Reread restores the actual other-tab checkpoint",await raw()===external&&(await page.getByTestId('player-position').textContent()).includes('96, 192'))
  phase="six-maps-and-return"
  await go(160,144);await interact('Nhận nhiệm vụ')
  for(const x of [280,392,504]){await go(x,160);await interact('Ghi nhớ câu chuyện')}
  await go(160,144);await interact('Người chờ')
  check("Preparation does not alter actual memory quest reward",(await save()).economy.teamExperience===80)
  await travel(616,'Sân Bếp Bỏ Quên')
  await go(320,160);await interact('Nhận nhiệm vụ')
  await travel(616,'Phòng Kho')
  await go(240,160);await interact('Ghi lại gợi ý')
  await travel(616,'Phòng Lửa')
  for(const [x,action]of [[208,'Mở lối thoát'],[320,'Đặt nồi'],[432,'Nhóm lửa']]){await go(x,176);await interact(action)}
  await travel(616,'Phòng Bàn')
  await travel(24,'Phòng Lửa');await travel(24,'Phòng Kho');await travel(24,'Sân Bếp Bỏ Quên');await travel(24,'Phố Đèn Lồng');await travel(24,'Làng Giao Ước')
  const end=await raw();await page.reload();await ready()
  check("Complete outward/return route reloads exact earned save",await raw()===end&&(await save()).economy.teamExperience===80&&(await save()).progress.puzzleStep===3)
  phase="classic-entry"
  await page.goto(url.replace('game.html','world.html'));await ready()
  await travel(616,'Phố Đèn Lồng');await travel(24,'Làng Giao Ước')
  finalRaw=await raw()
  check("Classic entry shares the same transactional preparation path",(await save()).economy.teamExperience===80)
  check("Five stable legacy saves remain unchanged",await page.evaluate(v=>Object.entries(v).every(([k,s])=>localStorage.getItem(k)===s),legacy))
  await capture('completed-route')
  check("No unexpected browser error",errors.length===0)
  phase='complete'
}catch(e){
  errors.push(`${phase}: ${e.stack||e}`)
  if(page)try{await page.screenshot({path:`${out}/${flavor}-failure.png`})}catch{}
  throw e
}finally{
  await mkdir(out,{recursive:true})
  await writeFile(`${out}/${flavor}-browser.json`,JSON.stringify({task:'AW2-016C',flavor,status:phase==='complete'?'PASS':'FAIL',phase,checks,checkCount:checks.length,errors,expectedErrors,captures,requests:[...new Set(requests)],finalRaw,limits:'Fresh developer browser verification. No post-commit GPU-init rollback, full boss/mode match, physical phone, independent human, totalGPUmemory/FPS or release acceptance.'},null,2)+'\n')
  await browser?.close()
  if(values.compiled)await new Promise(resolve=>server.httpServer.close(resolve));else await server.close()
}
