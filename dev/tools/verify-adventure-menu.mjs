import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { writeFileSync } from "node:fs"
const server = spawn("pnpm", ["dev", "--host", "127.0.0.1", "--port", "4188"], {
  stdio: "ignore",
})
process.on("exit", () => server.kill())
for (let n = 0; n < 150; n++) {
  try {
    await fetch("http://127.0.0.1:4188")
    break
  } catch {
    await new Promise((r) => setTimeout(r, 100))
  }
}
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright")
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  headless: true,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
  env: {
    ...process.env,
    LD_LIBRARY_PATH: process.env.CHROMIUM_LIB_DIR || "/tmp",
  },
})

const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
await page.goto('http://127.0.0.1:4188/adventure',{waitUntil:'domcontentloaded'});await page.locator('.adv-starter-grid button').first().click();await page.locator('.adv-controls .interact').click()
await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');const {ADVENTURE_AREAS}=await import('/src/game/adventure.ts');const {fullPP}=await import('/src/game/adventureSkills.ts');const ids=[...new Set(ADVENTURE_AREAS.flatMap(a=>a.encounters))],s=structuredClone(useGameStore.getState().save);s.adventure={...s.adventure,mapId:'lantern-quarter:clinic',x:8,y:6,facing:'up',service:'storage',message:null,speaker:null,follower:null,reserve:Array.from({length:60},(_,n)=>({uid:'qa-reserve-'+n,cardId:ids[n%ids.length],level:5,xp:0,hp:1,status:null,statusTurns:0,pp:fullPP(ids[n%ids.length],5)}))};if(!useGameStore.getState().importSave(s))throw Error('Large reserve fixture refused');useGameStore.setState({notice:null})})
await page.getByRole('heading',{name:'Đội hình & túi đồ',exact:true}).waitFor();await page.waitForTimeout(700);assert.equal(await page.locator('.adv-reserve .adv-spirit-row').count(),60)
const top=await page.locator('.adv-panel-dialog .adv-spirit-sprite canvas').count();assert(top>0&&top<=14,`Eager party canvases ${top}`)
await page.locator('.adv-sidebar').evaluate(el=>el.scrollTop=el.scrollHeight);await page.waitForTimeout(500);const bottom=await page.locator('.adv-panel-dialog .adv-spirit-sprite canvas').count();assert(bottom>0&&bottom<=14,`Eager bottom canvases ${bottom}`);assert.deepEqual(errors,[])
await page.screenshot({path:'/tmp/web460-reserve.png'});await page.getByRole('button',{name:'Đóng bảng phiêu lưu',exact:true}).click();await page.waitForTimeout(150);assert.equal(await page.locator('.adv-spirit-sprite canvas').count(),0)
const result={reserveRows:60,visibleCanvasesTop:top,visibleCanvasesBottom:bottom,offscreenCanvasesUnmounted:true,errors};writeFileSync('/tmp/adv-menu-qa.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();server.kill()
