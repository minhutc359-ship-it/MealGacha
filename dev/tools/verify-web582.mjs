import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdirSync,writeFileSync} from 'node:fs'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const out='dev/docs/web-v582/qa';mkdirSync(out,{recursive:true})
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','dev/tools/vite.pvp-qa.config.ts','--host','127.0.0.1','--port','4182','--strictPort'],{stdio:'pipe'})
const url='http://127.0.0.1:4182',errors=[],missing=[],checks=[]
let browser,log='';server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b)
const observe=page=>{page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/assets/')&&r.status()>=400)missing.push(r.url())})}
async function ready(page){await page.goto(url+'/adventure');await page.locator('.rpg-home-screen').waitFor();const close=page.getByRole('button',{name:'Tắt thông báo',exact:true});if(await close.isVisible())await close.click()}
async function fixture(page,cinematics=false){await page.evaluate(async cinematics=>{
 const {newGame}=await import('/src/game/progression.ts'),{newRpgSave,reduceRpg}=await import('/src/game/adventureRpg/engine.ts'),{useGameStore}=await import('/src/game/useGameStore.ts')
 const g=newGame(),s=newRpgSave(g);s.cinematics=cinematics
 for(const h of s.roster){h.level=15;h.rank=2;h.skills=[3,3,3,3]}
 g.adventureRpg=reduceRpg(s,{type:'start',stageId:'lantern-1'},g).save
 for(const a of g.adventureRpg.run.battle.actors){a.nextAttack=a.nextSkill=a.nextSupport=1000;a.energy=100;a.hp=a.maxHp;if(a.side==='ally')a.shield=Math.round(a.maxHp*.3)}
 if(!useGameStore.getState().importSave(g))throw Error('Fixture rejected');useGameStore.getState().dismiss()
},cinematics);await page.locator('.rpg-arena').waitFor();await page.waitForFunction(()=>document.querySelector('.rpg-battle.presentation-fight'))}
try{
 for(let i=0;i<100;i++){try{await fetch(url);break}catch{await new Promise(r=>setTimeout(r,100))}}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN,headless:true,env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR??process.env.LD_LIBRARY_PATH},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
 for(const [width,height] of [[320,568],[390,844],[844,390],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();observe(page);await ready(page)
  await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');const {STAGES}=await import('/src/game/story.ts');const g=structuredClone(useGameStore.getState().save);g.clearedStages=STAGES.map(s=>s.id);g.storyEnding='remember';useGameStore.getState().importSave(g);useGameStore.getState().dismiss()})
  await page.goto(url+'/?tab=story');await page.locator('.tcg-campaign-screen').waitFor()
  const open=page.locator('.tcg-open-map');if(await open.isVisible())await open.click()
  const atlas=await page.getByRole('dialog').count()?page.getByRole('dialog'):page.locator('.tcg-campaign-atlas')
  await atlas.getByRole('button',{name:'Chợ Sống · 07–12',exact:true}).click()
  const art=atlas.locator('img.tcg-world-map-art');await art.waitFor();await art.evaluate(im=>im.decode())
  assert((await art.getAttribute('src')).endsWith('living-world-v582.webp'))
  assert.equal(await atlas.locator('.tcg-map-stop').count(),6)
  assert.equal(await atlas.locator('.tcg-map-chapter-list>button').count(),6)
  assert.equal(await atlas.locator('.tcg-map-chapter-list>button:disabled').count(),3)
  const geometry=await atlas.evaluate(el=>{
   const map=el.querySelector('.tcg-world-map').getBoundingClientRect(),labels=[...el.querySelectorAll('.tcg-map-chapter-list>button')].map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom}})
   return{ratio:map.width/map.height,labels,scroll:document.documentElement.scrollWidth,viewport:innerWidth}
  })
  assert(Math.abs(geometry.ratio-1)<.025,JSON.stringify(geometry));assert(geometry.scroll<=width+1)
  for(let i=0;i<geometry.labels.length;i++)for(let j=i+1;j<geometry.labels.length;j++){const a=geometry.labels[i],b=geometry.labels[j];assert(a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y,'Overlapping chapter labels')}
  await page.screenshot({path:`${out}/map-${width}x${height}.png`})
  await atlas.getByRole('button',{name:/Đến chương 8:/}).click();await page.locator('.tcg-chapter h2').filter({hasText:'Bến sau cơn mưa'}).waitFor()
  checks.push({area:'chapter-map',viewport:[width,height],uncropped:true,nonOverlappingLabels:6,comingSoonLocked:3,travelToChapter8:true})
  await ready(page);await fixture(page)
  assert.equal(await page.locator('[data-shield=active]').count(),5)
  await page.screenshot({path:`${out}/bubble-${width}x${height}.png`})
  await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');const g=structuredClone(useGameStore.getState().save),b=g.adventureRpg.run.battle;for(const a of b.actors)a.shield=0;useGameStore.getState().importSave(g);useGameStore.getState().dismiss()})
  await page.locator('[data-shield=dissolving]').first().waitFor();await page.screenshot({path:`${out}/bubble-pop-${width}x${height}.png`});await page.locator('.rpg-shield-bubble').first().waitFor({state:'detached'})
  await page.locator('.rpg-burst-button').first().click();await page.locator('.rpg-ultimate-illustration').waitFor();await page.waitForFunction(()=>document.querySelector('.rpg-vfx-canvas')?.hasAttribute('data-ultimate'))
  checks.push({area:'bubble-and-live-ultimate',viewport:[width,height],formed:5,dissolved:5,videoOffHasArt:true})
  await context.close()
 }
 const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();observe(page);await ready(page)
 const patterns=await page.evaluate(async()=>{
  const {ULTIMATE_MOVES}=await import('/src/game/adventureRpg/awakening.ts'),{drawUltimateArt}=await import('/src/game/adventureRpg/ultimateArt.ts')
  const canvas=document.createElement('canvas');canvas.width=canvas.height=240;const ctx=canvas.getContext('2d')
  return ULTIMATE_MOVES.map(m=>{ctx.clearRect(0,0,240,240);drawUltimateArt(ctx,m[2],120,120,90,.38,'#bdeaff',2);const bytes=ctx.getImageData(0,0,240,240).data;let hash=0,pixels=0;for(let i=0;i<bytes.length;i++){hash=(hash*31+bytes[i])|0;if(i%4===3&&bytes[i]>0)pixels++}return{pattern:m[2],hash,pixels}})
 })
 assert.equal(new Set(patterns.map(p=>p.hash)).size,20);assert(patterns.every(p=>p.pixels>150));checks.push({area:'spell-renderer',patterns})
 await fixture(page,true);await page.locator('.rpg-burst-button').first().click();await page.locator('.rpg-cinematic').waitFor();await page.getByRole('button',{name:'Dừng hoạt ảnh',exact:true}).click()
 assert.equal(await page.locator('.rpg-cinematic .rpg-ultimate-illustration.is-paused').count(),1);await page.screenshot({path:`out/cinematic-placeholder.png`.replace('out',out)})
 await page.getByRole('button',{name:'Bỏ qua ›',exact:true}).click();await page.locator('.rpg-cinematic').waitFor({state:'detached'});checks.push({area:'cinematic',ownPortraitAndSpell:true,pause:true,skip:true})
 await page.evaluate(async()=>{const {newGame}=await import('/src/game/progression.ts'),{newRpgSave}=await import('/src/game/adventureRpg/engine.ts'),{useGameStore}=await import('/src/game/useGameStore.ts');const g=newGame();g.adventureRpg=newRpgSave(g);useGameStore.getState().importSave(g);useGameStore.getState().dismiss()})
 await page.getByRole('button',{name:'Đến gặp Lả',exact:true}).click();await page.getByRole('dialog',{name:'Trò chuyện với Lả'}).waitFor();await page.getByRole('button',{name:'Mở Cổng Ký Ức',exact:true}).click();await page.locator('.rpg-stage-node').first().waitFor();await page.locator('.rpg-stage-node').first().click();await page.getByRole('dialog',{name:'Câu chuyện',exact:true}).waitFor();assert((await page.locator('.rpg-story p').innerText()).includes('chiếc bát'))
 await page.screenshot({path:`${out}/story-opening.png`});await page.getByRole('button',{name:'Vào trận ›',exact:true}).click();await page.locator('.rpg-arena').waitFor();checks.push({area:'story',opening:true,skipStartsStage:true})
 assert.deepEqual(errors,[]);assert.deepEqual([...new Set(missing)],[])
 writeFileSync('dev/docs/web-v582/browser-qa.json',JSON.stringify({checks,errors,missing,scope:'Local Chromium, simulated mobile viewports'},null,2)+'\n')
 console.log(JSON.stringify({checks:checks.length,errors,missing}))
}finally{await browser?.close();server.kill();if(errors.length)console.error(errors)}
