import assert from "node:assert/strict"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"
import { tapWorldPoint } from "./aw2-world-browser-view.mjs"

const { values } = parseArgs({ options: {
  playwright: { type:"string", default:"playwright" }, chromium: { type:"string" }, compiled: { type:"boolean", default:false },
} })
const flavor=values.compiled?"compiled":"source", port=values.compiled?8645:8644,
  out=".asset-work/aw2-016b", key="aw2.development.save", id="aw2-npc-dem-nuoc",
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
  browser=await chromium.launch({executablePath:values.chromium,headless:true,args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]})
  const context=await browser.newContext({viewport:{width:1280,height:900},hasTouch:true,reducedMotion:"no-preference"})
  await context.addInitScript(()=>{
    window.__patrolWrites=0;window.__patrolFail=false
    const set=Storage.prototype.setItem
    Storage.prototype.setItem=function(k,v){
      if(k==="aw2.development.save"){
        window.__patrolWrites++
        if(window.__patrolFail)throw new DOMException("NPC patrol simulated write failure","QuotaExceededError")
      }
      return set.call(this,k,v)
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
    writes=()=>page.evaluate(()=>window.__patrolWrites), map=()=>page.getByTestId("world-map"), canvas=()=>map().locator("canvas"),
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
  check("Fresh profile has no save or patrol request",await raw()===null&&!requests.includes(atlas))
  await page.evaluate(v=>Object.entries(v).forEach(([k,s])=>localStorage.setItem(k,s)),legacy)
  await click("Tạo bản lưu AW2");await ready()
  check("Village loads no street patrol texture",!requests.includes(atlas))
  await go(160,272);await interact("Nhận nhiệm vụ")
  await go(160,176);await interact("Đọc mảnh khăn")
  await go(160,272);await interact("Hoàn tất nhập môn")
  check("Actual intro gives five starters and30XP once",(await save()).progress.partyIds.length===5&&(await save()).economy.teamExperience===30)
  await go(616,192);await interact("Đi qua");await page.getByTestId("zone-name").filter({hasText:"Phố Đèn Lồng"}).waitFor();await ready()
  phase="live-patrol"
  const streetRaw=await raw(),streetWrites=await writes(),faces=new Set(),frames=new Set()
  for(let i=0;i<140&&faces.size<4;i++){
    const p=await npc();samples.push(p);frames.add(p.frame);if(p.moving)faces.add(p.facing)
    assert.ok(p.x>=504&&p.x<=544&&p.y>=128&&p.y<=160)
    await page.waitForTimeout(90)
  }
  check("Live authored patrol visits all four directions within safe route",faces.size===4)
  check("Patrol ticks grant nothing and never write the save",await raw()===streetRaw&&await writes()===streetWrites)
  check("Only replacement atlas is loaded for water NPC",requests.includes(atlas)&&!requests.includes("/dev/aw2/assets/npcs/dem-nuoc/idle-v1/idle.webp"))
  await page.waitForFunction(id=>{
    const p=JSON.parse(document.querySelector('[data-testid="world-map"] canvas').dataset.npcMotion).find(n=>n.entityId===id)
    return p.x>541&&p.y>=159&&!p.moving
  },id,{timeout:60000})
  await menu();await idle()
  const menuPose=await pose();await page.waitForTimeout(250)
  check("Opening menu freezes actual patrol position and pose",JSON.stringify(await pose())===JSON.stringify(menuPose))
  await panel().getByRole("button",{name:"Địa điểm",exact:true}).click()
  for(let i=0;i<3;i++)await panel().getByRole("button",{name:"Địa điểm sau",exact:true}).click()
  await panel().getByRole("heading",{name:"Em Đem Nước",exact:true}).waitFor()
  await panel().getByRole("button",{name:"Đi tới địa điểm",exact:true}).click()
  await panel().waitFor({state:"hidden"});await held();const pinned=await npc();await arrive(pinned.x,pinned.y+32)
  check("Native place resolves and pins live endpoint while player walks",pinned.held&&Math.abs(pinned.x-menuPose.x)<.1&&Math.abs(pinned.y-menuPose.y)<.1)
  check("New interaction is farther than old static range",Math.hypot(menuPose.x-504,menuPose.y+32-128)>48)
  await interact();await dialog().getByRole("heading",{name:"Em Đem Nước",exact:true}).waitFor()
  check("Real E opens moved NPC with no preaccept memory action",await dialog().getByRole("button",{name:"Ghi nhớ câu chuyện",exact:true}).count()===0&&await raw()===streetRaw)
  await idle();const talking=await pose();await page.waitForTimeout(250)
  check("Dialogue faces player using down idle and freezes patrol",talking.frame==="down-idle"&&JSON.stringify(await pose())===JSON.stringify(talking))
  await capture("live-dialog");await close()
  await page.emulateMedia({reducedMotion:"reduce"});await idle()
  const reduced=await pose();await page.waitForTimeout(250)
  check("Reduced motion freezes location with authored idle in actual facing",reduced.frame.endsWith("-idle")&&JSON.stringify(await pose())===JSON.stringify(reduced))
  await go(472,128);await map().focus();await page.keyboard.press("e");await page.waitForTimeout(80)
  check("Empty old interaction anchor cannot open the moved NPC",await dialog().count()===0)
  await go(reduced.x,reduced.y+32);await interact();await dialog().getByRole("heading",{name:"Em Đem Nước",exact:true}).waitFor();await close()
  check("Reduced motion still permits real live-position interaction",await raw()===streetRaw)
  await page.emulateMedia({reducedMotion:"no-preference"});await go(320,240)
  const released=await pose()
  await page.waitForFunction(p=>{
    const n=JSON.parse(document.querySelector('[data-testid="world-map"] canvas').dataset.npcMotion).find(n=>n.entityId==="aw2-npc-dem-nuoc")
    return Math.hypot(n.x-p.x,n.y-p.y)>2
  },released)
  check("Manual departure releases approach and resumes patrol",!(await npc()).held&&await raw()===streetRaw)

  phase="responsive"
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1280,900]]){
    await page.setViewportSize({width,height});await page.evaluate(()=>document.documentElement.style.fontSize="20px")
    await click("Bám nhân vật");await page.waitForTimeout(100)
    await layout(`${width}x${height}/20px`)
    const detail=await canvas().evaluate((c,id)=>{
      const n=JSON.parse(c.dataset.npcMotion).find(n=>n.entityId===id),p=JSON.parse(c.dataset.interactionProps).find(n=>n.entityId===id)
      const stage=document.querySelector('[data-testid="game-map-stage"]'),rect=stage.getBoundingClientRect(),toolbar=stage.querySelector('.aw2-map-toolbar').getBoundingClientRect()
      return {n,p,labels:[...document.querySelectorAll('[data-world-label]')].filter(l=>getComputedStyle(l).visibility==="visible").every(l=>{const b=l.getBoundingClientRect();return b.left>=rect.left-1&&b.right<=rect.right+1&&b.top>=toolbar.bottom-1&&b.bottom<=rect.bottom+1})}
    },id)
    check(`${width}: body, interaction, depth and labels use one live snapshot`,detail.n.x===detail.p.x&&detail.n.y===detail.p.y&&detail.n.depth===detail.n.y&&detail.p.depth===detail.n.y&&detail.labels)
    await menu();await layout(`${width}/20px menu`);await close()
    if(width===390)await capture("follow-390")
  }
  await page.evaluate(()=>document.documentElement.style.fontSize="16px")
  await page.setViewportSize({width:1280,height:900})
  phase="story-memory-write"
  await go(160,144);await interact("Nhận nhiệm vụ")
  await page.waitForFunction(id=>{
    const p=JSON.parse(document.querySelector('[data-testid="world-map"] canvas').dataset.npcMotion).find(n=>n.entityId===id)
    return p.x===504&&p.y===128&&!p.moving
  },id)
  check("Accepting memory quest immediately restores canonical story anchor",(await npc()).x===504&&(await npc()).y===128)
  await dock("Nhiệm vụ").click();await panel().getByRole("button",{name:"Chỉ đường",exact:true}).click()
  const nav=panel().getByRole("navigation",{name:"Phân trang Điểm đến",exact:true})
  while(!(await panel().getByTestId(`game-quest-walk-${id}`).count()))await nav.getByRole("button",{name:"Điểm đến sau",exact:true}).click()
  const target=panel().getByTestId(`game-quest-walk-${id}`)
  check("Quest guide points to same canonical story anchor",await target.getAttribute("data-approach-x")==="504"&&await target.getAttribute("data-approach-y")==="160")
  await target.click();await arrive(504,160);await interact()
  const beforeMemory=await raw()
  await page.evaluate(()=>window.__patrolFail=true)
  await dialog().getByRole("button",{name:"Ghi nhớ câu chuyện",exact:true}).click()
  await dialog().getByRole("alert").waitFor()
  check("Failed memory write retains exact earned bytes and open dialog",await raw()===beforeMemory&&(await save()).progress.memories.length===0)
  await idle();const failed=await pose();await page.waitForTimeout(180)
  check("Save failure freezes actual patrol",JSON.stringify(await pose())===JSON.stringify(failed))
  await page.evaluate(()=>window.__patrolFail=false)
  await dialog().getByRole("button",{name:"Ghi nhớ câu chuyện",exact:true}).click();await dialog().waitFor({state:"hidden"})
  check("Retry remembers existing memory once without duplicate XP",(await save()).progress.memories.length===1&&(await save()).economy.teamExperience===30)
  await interact();check("Already-read NPC offers no duplicate remember action",await dialog().getByRole("button",{name:"Ghi nhớ câu chuyện",exact:true}).count()===0);await close()
  for(const x of [280,392]){await go(x,160);await interact("Ghi nhớ câu chuyện")}
  await go(160,144);await interact("Người chờ")
  check("Actual three-memory quest still turns in once at80XP",(await save()).progress.questIndex===2&&(await save()).progress.memories.length===3&&(await save()).economy.teamExperience===80)
  phase="mode-entry-return"
  for(const [label,mode]of [["Ghé TCG","tcg"],["Ghé Auto Chess","auto-chess"]]){
    await menu();await panel().getByRole("button",{name:label,exact:true}).click();await page.getByTestId("mode-lobby").waitFor()
    const checkpoint=await raw()
    check(`${mode}: actual mode lobby opens`,await page.getByTestId("mode-lobby").getAttribute("data-mode-id")===mode)
    await click("Trở về hành trình");await ready()
    check(`${mode}: returns exact checkpoint without grants`,await raw()===checkpoint&&(await save()).economy.teamExperience===80)
  }
  phase="blur-reload-entry"
  await go(320,240);await page.emulateMedia({reducedMotion:"no-preference"});await page.waitForTimeout(100)
  await page.evaluate(()=>dispatchEvent(new Event("blur")));await idle()
  const blurred=await pose();await page.waitForTimeout(300)
  check("Window blur freezes actual position and authored pose",JSON.stringify(await pose())===JSON.stringify(blurred))
  await page.evaluate(()=>dispatchEvent(new Event("focus")))
  await page.waitForFunction(p=>{
    const n=JSON.parse(document.querySelector('[data-testid="world-map"] canvas').dataset.npcMotion).find(n=>n.entityId==="aw2-npc-dem-nuoc")
    return Math.hypot(n.x-p.x,n.y-p.y)>1
  },blurred)
  check("Focus resumes bounded local movement",await raw()!==null)
  await menu();await panel().getByRole("button",{name:"Lưu vị trí",exact:true}).click();await page.waitForTimeout(100);await close()
  finalRaw=await raw();await page.reload();await ready()
  check("Reload preserves exact progress with no patrol clock fields",await raw()===finalRaw&&!Object.keys((await save()).progress).some(k=>/patrol|walkMs|restMs/.test(k)))
  await page.goto(url.replace("game.html","world.html"));await ready()
  await page.getByTestId(`room-waypoint-${id}`).focus();await page.getByTestId(`room-waypoint-${id}`).press("Enter")
  await held();const native=await npc();await arrive(native.x,native.y+32);await interact();await dialog().getByRole("heading",{name:"Em Đem Nước",exact:true}).waitFor();await close()
  check("Classic entry shares exact save and live native waypoint interaction",await raw()===finalRaw)
  await page.goto(url);await ready()
  phase="required-atlas-fault"
  fault=atlas
  await page.route(`**${atlas}`,route=>route.fulfill({status:404,body:"016B required atlas fault"}))
  await page.reload();await page.getByRole("alert").filter({hasText:"Bản đồ:"}).waitFor()
  check("Missing authored patrol atlas shows explicit map error with no fake fallback",await canvas().count()===0)
  check("Asset error disables native travel and preserves exact save",await page.locator('[data-aw2-world-control]').evaluateAll(bs=>bs.every(b=>b.disabled))&&await raw()===finalRaw)
  await page.unroute(`**${atlas}`);await page.reload();await ready();fault=""
  check("Restoring atlas recovers map and exact earned save",await raw()===finalRaw&&await page.locator('[data-aw2-world-control="interact"]').isEnabled())
  check("All five stable legacy sentinel saves remain exact",await page.evaluate(v=>Object.entries(v).every(([k,s])=>localStorage.getItem(k)===s),legacy))
  await capture("recovered-map")
  check("No unexpected browser errors",errors.length===0)
  phase="complete"
} catch(e){
  errors.push(`${phase}: ${e.stack||e}`)
  if(page)try{await page.screenshot({path:`${out}/${flavor}-failure.png`})}catch{}
  throw e
} finally {
  await mkdir(out,{recursive:true})
  await writeFile(`${out}/${flavor}-browser.json`,JSON.stringify({task:"AW2-016B",flavor,status:phase==="complete"?"PASS":"FAIL",phase,checks,checkCount:checks.length,errors,expectedErrors,captures,requests:[...new Set(requests)],samples,finalRaw,finalRawSha:finalRaw?hash(finalRaw):null,fingerprint,limits:"Fresh restored-source checks only. No full boss or full mode round, physical device, independent human, FPS/totalGPUmemory, release or rights acceptance."},null,2)+"\n")
  await browser?.close()
  if(values.compiled)await new Promise(resolve=>server.httpServer.close(resolve));else await server.close()
}
