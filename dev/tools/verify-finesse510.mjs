import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdirSync,writeFileSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),out=path.join(root,'dev/docs/web-v510')
mkdirSync(out,{recursive:true})
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const port=4198,url=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','dev/tools/vite.pvp-qa.config.ts','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'pipe'})
let log='',browser,page;server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b)
const reports=[]
const state=page=>page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');return structuredClone(useGameStore.getState().save.adventureRpg)})
try{
 for(let i=0;i<100;i++){try{await fetch(url);break}catch{await new Promise(r=>setTimeout(r,100))}}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN,headless:true,env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR??process.env.LD_LIBRARY_PATH},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
 for(const [width,height] of [[1440,900],[390,844],[844,390],[320,568]]){
  const context=await browser.newContext({viewport:{width,height}});page=await context.newPage();const errors=[],missing=[]
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/assets/')&&r.status()>=400)missing.push(r.url())})
  await page.goto(`${url}/adventure`);await page.locator('.rpg-stage-node').first().waitFor()
  await page.evaluate(async()=>{
   const {newGame}=await import('/src/game/progression.ts'),{newRpgSave,reduceRpg}=await import('/src/game/adventureRpg/engine.ts'),{useGameStore}=await import('/src/game/useGameStore.ts')
   const g=newGame();g.adventureRpg=newRpgSave(g);for(const h of g.adventureRpg.roster)h.level=10
   if(!useGameStore.getState().importSave(g))throw Error('Fixture rejected');useGameStore.getState().dismiss()
  })
  await page.getByRole('button',{name:'Đội hình',exact:true}).click()
  await page.getByRole('button',{name:/^Dưỡng linh ·/}).click();const chosen=await state(page);assert.equal(chosen.roster[0].path,'support')
  const faces=await page.locator('.rpg-spirit-image').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().height>0).map(n=>getComputedStyle(n).backgroundImage))
  await page.waitForTimeout(200)
  assert(faces.every(x=>!x.includes('/food/')))
  await page.reload();await page.getByRole('button',{name:'Đội hình',exact:true}).click();assert.equal((await state(page)).roster[0].path,'support')
  await page.screenshot({path:path.join(out,`spirit-roster-${width}.png`)})
  await page.evaluate(async()=>{
   const {useGameStore}=await import('/src/game/useGameStore.ts'),{reduceRpg}=await import('/src/game/adventureRpg/engine.ts');const g=structuredClone(useGameStore.getState().save)
   g.adventureRpg=reduceRpg(g.adventureRpg,{type:'start',stageId:'lantern-1'},g).save
   for(const a of g.adventureRpg.run.battle.actors){a.energy=100;a.nextAttack=a.nextSkill=a.nextSupport=1000;if(a.side==='enemy'){a.hp=a.maxHp=5000;a.attack=1}else a.hp=Math.floor(a.maxHp*.6)}
   if(!useGameStore.getState().importSave(g))throw Error('Battle fixture rejected');useGameStore.getState().dismiss()
   window.__spriteNodes=[...document.querySelectorAll('.side-ally canvas')]
  })
  await page.locator('.rpg-arena').waitFor();await page.waitForTimeout(1500)
  await page.locator('.rpg-focus').nth(1).click();assert.equal((await state(page)).run.battle.focus,'e:0:1')
  await page.evaluate(()=>{window.__spriteNodes=[...document.querySelectorAll('.side-ally canvas')];window.__resizes=0;window.__observer=new MutationObserver(list=>window.__resizes+=list.length);for(const n of window.__spriteNodes)window.__observer.observe(n,{attributes:true,attributeFilter:['width','height']})})
  await page.locator('.rpg-burst-button').nth(2).click();await page.locator('.rpg-burst-button').nth(3).click()
  const cast=await state(page);assert.equal(cast.run.battle.chain.count,2);assert(cast.run.battle.events.some(e=>e.kind==='reaction'&&e.text==='Sinh trưởng'))
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.getByRole('button',{name:'Tạm dừng trận',exact:true}).click()
  await page.screenshot({path:path.join(out,`cutin-${width}.png`)})
  await page.getByRole('button',{name:'Tiếp tục trận',exact:true}).click()
  await page.emulateMedia({reducedMotion:'no-preference'})
  const frames=await page.evaluate(()=>new Promise(resolve=>{
   const gaps=[];let previous=performance.now(),start=previous,poses=new Set();const loop=now=>{gaps.push(now-previous);previous=now;for(const n of document.querySelectorAll('.side-ally canvas'))poses.add(n.dataset.pose);if(now-start<2000)requestAnimationFrame(loop);else{gaps.sort((a,b)=>a-b);resolve({frames:gaps.length,p50:gaps[Math.floor(gaps.length*.5)],p95:gaps[Math.floor(gaps.length*.95)],poses:[...poses],canvasKept:window.__spriteNodes.every(n=>n.isConnected),resizeWrites:window.__resizes});window.__observer.disconnect()}};requestAnimationFrame(loop)
  }))
  assert(frames.canvasKept)
  await page.getByRole('button',{name:'Tạm dừng trận',exact:true}).click();const paused=await state(page)
  await page.reload();await page.locator('.rpg-arena').waitFor();assert.deepEqual((await state(page)).run.battle,paused.run.battle)
  await page.screenshot({path:path.join(out,`tactics-${width}.png`)})
  for(const node of await page.locator('.rpg-burst-button').all()){const box=await node.boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1)}
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[])
  reports.push({viewport:[width,height],pathPersists:true,focusWorks:true,chain:2,reaction:'Sinh trưởng',battleReloadExact:true,controlsFit:true,frames,errors,missing});console.log(JSON.stringify(reports.at(-1)))
  await context.close()
 }
 // All three demonstrations use their actual shared renderers and remain isolated from account saves.
 const context=await browser.newContext({viewport:{width:390,height:844}});page=await context.newPage();await page.goto(`${url}/adventure`);await page.locator('.rpg-stage-node').first().waitFor()
 const demos=[]
 for(const mode of ['tcg','auto','adventure']){
  const before=await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');return JSON.stringify(useGameStore.getState().save)})
  await page.evaluate(async(mode)=>{const {useModeIntroStore}=await import('/src/game/modeIntroState.ts');useModeIntroStore.getState().open(mode)},mode)
  await page.locator('.live-demo-scene').waitFor();await page.getByRole('button',{name:'Ẩn chú thích',exact:true}).click();await page.waitForTimeout(3000)
  const canvas=await page.locator('.live-demo-scene canvas').count();assert(canvas>0)
  await page.screenshot({path:path.join(out,`demo-${mode}-390.png`)})
  await page.getByRole('button',{name:'Đóng giới thiệu',exact:true}).click()
  assert.equal(await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');return JSON.stringify(useGameStore.getState().save)}),before)
  demos.push({mode,canvas,saveUnchanged:true})
 }
 await context.close()
 writeFileSync(path.join(out,'finesse-qa.json'),JSON.stringify({version:'5.1.0',engine:'Chromium headless / SwiftShader',note:'RAF gap samples in a software-rendered container; not physical-device FPS, not a claim of 9/10.',reports,demos},null,2)+'\n')
}catch(e){console.error(log.slice(-2000));if(page)console.error((await page.locator('body').innerText()).slice(0,2000));throw e}
finally{await browser?.close();server.kill()}
