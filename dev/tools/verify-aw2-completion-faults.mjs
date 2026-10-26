import assert from "node:assert/strict"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { createHash } from "node:crypto"
import { parseArgs } from "node:util"
import { createServer, preview } from "vite"
const { values } = parseArgs({ options: { playwright: {type:"string",default:"playwright"}, chromium:{type:"string"}, compiled:{type:"boolean",default:false} } })
const flavor=values.compiled?"compiled":"source",port=values.compiled?8643:8642,out=".asset-work/aw2-completion",key="aw2.development.save"
const originPath=`${out}/${flavor}-browser.json`, originText=await readFile(originPath,"utf8"),origin=JSON.parse(originText)
assert.equal(origin.status,"PASS")
const server=values.compiled?await preview({configFile:"dev/vite.aw2.config.ts",preview:{host:"127.0.0.1",port,strictPort:true}}):await createServer({configFile:"dev/vite.dev.config.ts",server:{host:"127.0.0.1",port,strictPort:true}})
const checks=[],errors=[],expectedErrors=[]
const check=(s,v=true)=>{assert.ok(v,s);checks.push(s);console.log(s)}
let browser,page,fault=""
try{
 if(!values.compiled)await server.listen()
 const {chromium}=await import(values.playwright)
 browser=await chromium.launch({executablePath:values.chromium,headless:true,args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]})
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:"reduce"})
 page=await context.newPage()
 page.on("pageerror",e=>errors.push(e.message))
 page.on("console",m=>{if(m.type()==="error")(fault&&/404|Failed to load/.test(m.text())?expectedErrors:errors).push(m.text())})
 const url=`http://127.0.0.1:${port}/dev/aw2/game.html`
 await page.goto(url)
 await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw:origin.observedRaw})
 await page.reload()
 const raw=()=>page.evaluate(k=>localStorage.getItem(k),key)
 const ready=async(p=page)=>{await p.getByTestId("world-map").locator("canvas[data-party-size='1']").waitFor();await p.getByTestId("world-map").locator(".aw2-map-loading").waitFor({state:"hidden"})}
 const dock=async(name,p=page)=>p.getByRole("navigation",{name:"Menu game",exact:true}).getByRole("button",{name,exact:true}).click()
 const button=(name,p=page)=>p.getByRole("button",{name,exact:true})
 await ready()
 await dock("Thêm");await button("Ghé TCG").click();await page.getByTestId("mode-lobby").waitFor()
 const other=await context.newPage();await other.goto(url);await ready(other)
 await dock("Thêm",other);await button("Lưu vị trí",other).click()
 await other.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).revision>0,key)
 await other.getByTestId("game-panel").getByRole("button",{name:"Lưu vị trí",exact:true}).waitFor({state:"visible"})
 await page.getByTestId("activity-page").filter({hasText:/tab khác/}).waitFor()
 const latest=await raw()
 await button("Trở về hành trình").click()
 check("Stale lobby cannot overwrite a newer actual save and remains recoverable",await raw()===latest&&await page.getByTestId("mode-lobby").count()===1)
 await button("Đọc lại hành trình").click();await ready()
 check("Read-again exits stale practice into the exact newer world",await raw()===latest)
 await other.close()
 // All travel uses the current overview and explicit E / Đi qua, including the real shortcut.
 for(let hop=0;hop<7;hop++){
  const progress=JSON.parse(await raw()).progress
  if(progress.zoneId==="aw2-zone-kitchen-table")break
  await dock("Thêm");await button("Bản đồ hành trình").click()
  await page.getByRole("combobox",{name:"Vùng trên bản đồ hành trình"}).selectOption("aw2-zone-kitchen-table")
  await page.getByTestId("overview-walk").click();await page.getByTestId("game-panel").waitFor({state:"hidden"})
  await page.waitForFunction(()=>{const m=document.querySelector('[data-testid="player-position"]').textContent.match(/Vị trí (\d+), (\d+)/);return m&&((Math.abs(+m[1]-592)<=1&&Math.abs(+m[2]-192)<=1)||(Math.abs(+m[1]-496)<=1&&Math.abs(+m[2]-240)<=1))},null,{timeout:15000})
  await page.getByTestId("world-map").focus();await page.keyboard.press("e");await page.getByRole("dialog").waitFor();await button("Đi qua").click();await ready()
 }
 check("Completed overview routes reach table through actual unlocked reciprocal doors",JSON.parse(await raw()).progress.zoneId==="aw2-zone-kitchen-table")
 // Select the existing boss from native paged places; arriving is not a battle grant.
 await dock("Thêm");await button("Địa điểm").click()
 const walk=button("Đi tới địa điểm");await walk.click();await page.getByTestId("game-panel").waitFor({state:"hidden"})
 await page.waitForFunction(()=>{const m=document.querySelector('[data-testid="player-position"]').textContent.match(/Vị trí (\d+), (\d+)/);return m&&Math.abs(+m[1]-320)<=1&&Math.abs(+m[2]-160)<=1},null,{timeout:15000})
 const before=await raw()
 await page.getByTestId("world-map").focus();await page.keyboard.press("e");await page.getByRole("dialog").waitFor()
 fault="/dev/aw2/assets/forgotten-host/reference-v1/battle.webp"
 await page.route(`**${fault}`,r=>r.fulfill({status:404,body:"expected missing atlas"}))
 await button("Đấu lại boss · không nhận thưởng").click();await page.getByTestId("world-battle").waitFor();await button("Tạm dừng").click()
 const faultCheckpoint=await raw()
 await page.getByTestId("battle-atlas-state").filter({hasText:"Tải atlas thất bại"}).waitFor()
 check("Missing battle atlas is disclosed without fabricated complete art or committed result",await raw()===faultCheckpoint)
 await page.getByRole("combobox",{name:"Nội dung màn chơi"}).selectOption("controls")
 await button("Rút lui về Phòng Bàn").click();await button("Lưu kết quả và trở về").click();await ready()
 const after=JSON.parse(await raw()), prior=JSON.parse(before)
 check("Real rematch retreat preserves all economy/collection/quest/party data",JSON.stringify(after.economy)===JSON.stringify(prior.economy)&&JSON.stringify(after.collection)===JSON.stringify(prior.collection)&&after.progress.questIndex===4&&JSON.stringify(after.progress.partyIds)===JSON.stringify(prior.progress.partyIds))
 await page.unroute(`**${fault}`);fault=""
 await dock("Thêm");await button("Địa điểm").click();await button("Đi tới địa điểm").click();await page.getByTestId("game-panel").waitFor({state:"hidden"})
 await page.waitForFunction(()=>{const m=document.querySelector('[data-testid="player-position"]').textContent.match(/Vị trí (\d+), (\d+)/);return m&&Math.abs(+m[1]-320)<=1&&Math.abs(+m[2]-160)<=1},null,{timeout:15000})
 await page.getByTestId("world-map").focus();await page.keyboard.press("e");await button("Đấu lại boss · không nhận thưởng").click();await page.getByTestId("world-battle").waitFor();await button("Tạm dừng").click()
 await page.getByTestId("battle-atlas-state").filter({hasText:"Năm atlas chiến đấu đã tải"}).waitFor()
 check("A recovered atlas mounts the actual battle again",await page.getByTestId("world-battle").locator("canvas").count()===1)
 await page.waitForFunction(()=>document.querySelector('[data-testid="world-battle"] canvas')?.dataset.actorLayout)
 await page.screenshot({path:`${out}/${flavor}-boss-arena.png`})
 await page.getByRole("combobox",{name:"Nội dung màn chơi"}).selectOption("controls");await button("Rút lui về Phòng Bàn").click();await button("Lưu kết quả và trở về").click();await ready()
 check("No unexpected errors in stale-tab/fault/recovery paths",errors.length===0)
 await writeFile(`${out}/${flavor}-faults.json`,JSON.stringify({status:"PASS",flavor,checks,freshAssertions:checks.length,retainedAssertions:0,errors,expectedErrors,origin:{path:originPath,sha256:createHash("sha256").update(originText).digest("hex"),rawSha256:createHash("sha256").update(origin.observedRaw).digest("hex")},observedRaw:await raw()},null,2)+"\n")
}catch(error){await mkdir(out,{recursive:true});await page?.screenshot({path:`${out}/${flavor}-fault-failure.png`}).catch(()=>{});await writeFile(`${out}/${flavor}-faults.json`,JSON.stringify({status:"FAIL",checks,errors,expectedErrors,error:String(error.stack||error)},null,2)+"\n");throw error}
finally{await browser?.close();await server.close()}
