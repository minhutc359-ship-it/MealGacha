import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdirSync,writeFileSync} from 'node:fs'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const out='dev/docs/web-v583/qa';mkdirSync(out,{recursive:true})
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','dev/tools/vite.pvp-qa.config.ts','--host','127.0.0.1','--port','4183','--strictPort'],{stdio:'pipe'})
const url='http://127.0.0.1:4183',errors=[],missing=[],checks=[]
let browser,log='';server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b)
checks.push=(...items)=>{for(const item of items)console.log(`PASS ${item.area} ${item.viewport??''}`);return Array.prototype.push.apply(checks,items)}
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
  await page.locator('.village-npc').first().waitFor();await page.locator('.village-npc [data-character=chef-bach].is-loaded').waitFor()
  const geometryVillage=await page.locator('.rpg-village-map').evaluate(el=>{const r=el.getBoundingClientRect(),w=el.querySelector('.rpg-village-world').getBoundingClientRect();return{ratio:r.width/r.height,fill:w.height/r.height,width:r.width,viewport:innerWidth,scroll:document.documentElement.scrollWidth}})
  assert(Math.abs(geometryVillage.ratio-1.5)<.03,JSON.stringify(geometryVillage));assert(geometryVillage.fill>.98);assert(geometryVillage.scroll<=width+1)
  assert.equal(await page.locator('.village-npc').count(),4);assert.equal(await page.locator('.village-friend-hit').count(),2)
  await page.getByRole('button',{name:'Gọi Vị Linh ♡',exact:true}).click();await page.locator('.village-expression').waitFor()
  await page.screenshot({path:`${out}/village-${width}x${height}.png`})
  await page.getByRole('button',{name:'Đến gặp Lả',exact:true}).click()
  await page.waitForTimeout(300)
  const movement=await page.evaluate(async()=>{const el=document.querySelector('.rpg-village-party'),point=()=>{const s=getComputedStyle(el);return{x:parseFloat(s.left),y:parseFloat(s.top)}};const prior=point();document.querySelector('[aria-label="Đến gặp Chú Tâm"]').click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return{prior,after:point()}})
  assert(Math.hypot(movement.after.x-movement.prior.x,movement.after.y-movement.prior.y)<Math.max(20,width*.04),`Character snapped on retarget ${JSON.stringify(movement)}`)
  await page.getByRole('dialog',{name:'Trò chuyện với Chú Tâm'}).waitFor({timeout:6000})
  assert.equal(await page.locator('.rpg-village-map').count(),1,'Arrival must await conversation action')
  await page.screenshot({path:`${out}/npc-${width}x${height}.png`})
  await page.getByRole('button',{name:'Để sau',exact:true}).click()
  checks.push({area:'village-rpg',viewport:[width,height],...geometryVillage,npcs:4,companions:2,idleInteraction:true,retargetWithoutSnap:true,conversationBeforeEntry:true})
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
  await page.locator('.rpg-arena [data-sheet=battleHd].is-loaded').first().waitFor()
  await page.waitForFunction(()=>document.querySelector('.rpg-vfx-canvas')?.dataset.combatArt==='ready')
  await page.screenshot({path:`${out}/bubble-${width}x${height}.png`})
  await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');const g=structuredClone(useGameStore.getState().save),b=g.adventureRpg.run.battle;for(const a of b.actors)a.shield=0;useGameStore.getState().importSave(g);useGameStore.getState().dismiss()})
  await page.locator('[data-shield=dissolving]').first().waitFor();await page.screenshot({path:`${out}/bubble-pop-${width}x${height}.png`});await page.locator('.rpg-shield-bubble').first().waitFor({state:'detached'})
  await page.locator('.rpg-burst-button').first().click();await page.locator('.rpg-ultimate-illustration').waitFor();await page.waitForFunction(()=>document.querySelector('.rpg-vfx-canvas')?.hasAttribute('data-ultimate'))
  checks.push({area:'bubble-and-live-ultimate',viewport:[width,height],formed:5,dissolved:5,videoOffHasArt:true})
  await context.close()
 }
 const quietContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),quietPage=await quietContext.newPage();observe(quietPage);await ready(quietPage)
 await quietPage.evaluate(async()=>{const {useAppStore}=await import('/src/store/useAppStore.ts');useAppStore.getState().updatePreference('reducedMotion',true)})
 await quietPage.getByRole('button',{name:'Đến gặp Lả',exact:true}).click();await quietPage.getByRole('dialog',{name:'Trò chuyện với Lả'}).waitFor({timeout:2000})
 await quietPage.getByRole('button',{name:'Để sau',exact:true}).click();await quietPage.getByRole('button',{name:'Gọi Vị Linh ♡',exact:true}).click()
 assert.equal(await quietPage.locator('.village-party-sprites').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0)
 checks.push({area:'village-reduced-motion',fastArrival:true,noIdleLoops:true});await quietContext.close()
 const autoContext=await browser.newContext({viewport:{width:1280,height:800}}),autoPage=await autoContext.newPage();observe(autoPage);await autoPage.goto(url+'/autochess')
 await autoPage.evaluate(async()=>{
  const {newGame}=await import('/src/game/progression.ts'),{useGameStore}=await import('/src/game/useGameStore.ts'),{createAutoRun}=await import('/src/game/autochess/economy.ts'),{createCombat}=await import('/src/game/autochess/combat.ts'),{emptyAutoSave}=await import('/src/game/autochess/types.ts')
  const g=newGame(),r=createAutoRun('survival',42,'2026-10-16','qa583');r.xp=20;for(const p of r.roster)r.pool[p.id]++
  r.roster=['com-tam','banh-mi','pho-bo','banh-cuon','xoi'].map((id,i)=>({uid:`p${i+1}`,id,star:1,cell:18+i,items:[]}));r.nextUid=6
  for(const p of r.roster)r.pool[p.id]--
  r.combat=createCombat(r);for(const a of r.combat.actors){if(a.side==='enemy'){a.hp=a.maxHp=20000;a.attack=a.baseAttack=0}else a.mana=100}r.phase='combat';g.autoChess={...emptyAutoSave(),tutorialSeen:true,run:r}
  if(!useGameStore.getState().importSave(g))throw Error('Auto fixture rejected');useGameStore.getState().dismiss()
 })
 await autoPage.locator('.ac-board canvas').waitFor();await autoPage.waitForFunction(()=>document.querySelector('.ac-board canvas')?.dataset.combatArt==='ready')
 await autoPage.getByRole('button',{name:'Tiếp tục chiến đấu →',exact:true}).click();await autoPage.locator('.ac-pause-overlay').waitFor({state:'detached'});await autoPage.waitForTimeout(450);await autoPage.screenshot({path:`${out}/autochess-hd.png`});checks.push({area:'autochess',hdUnits:5,sharedAttackArt:true,unpausedCapture:true});await autoContext.close()
 const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();observe(page);await ready(page)
 const patterns=await page.evaluate(async()=>{
  const {ULTIMATE_MOVES}=await import('/src/game/adventureRpg/awakening.ts'),{drawUltimateArt}=await import('/src/game/adventureRpg/ultimateArt.ts')
  const canvas=document.createElement('canvas');canvas.width=canvas.height=240;const ctx=canvas.getContext('2d')
  return ULTIMATE_MOVES.map(m=>{ctx.clearRect(0,0,240,240);drawUltimateArt(ctx,m[2],120,120,90,.38,'#bdeaff',2);const bytes=ctx.getImageData(0,0,240,240).data;let hash=0,pixels=0;for(let i=0;i<bytes.length;i++){hash=(hash*31+bytes[i])|0;if(i%4===3&&bytes[i]>0)pixels++}return{pattern:m[2],hash,pixels}})
 })
 const hdFrames=await page.evaluate(async()=>{const {SPRITE_SHEETS}=await import('/src/game/autochess/presentation.ts');const sheet=SPRITE_SHEETS.battleHd,im=new Image();im.src=sheet.path;await im.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d');return sheet.rows.flatMap(row=>row.frames.slice(0,4).map(f=>{ctx.clearRect(0,0,64,64);ctx.drawImage(im,...f.slice(0,4),0,0,64,64);const bytes=ctx.getImageData(0,0,64,64).data;let hash=0,pixels=0;for(let i=0;i<bytes.length;i++){hash=(hash*31+bytes[i])|0;if(i%4===3&&bytes[i]>30)pixels++}return{hash,pixels,height:f[3]}}))})
 assert.equal(new Set(hdFrames.map(f=>f.hash)).size,20);assert(hdFrames.every(f=>f.pixels>500&&f.height>=280));checks.push({area:'hd-battle-poses',uniquePoses:20,minSourceHeight:280})
 assert.equal(new Set(patterns.map(p=>p.hash)).size,20);assert(patterns.every(p=>p.pixels>150));checks.push({area:'spell-renderer',patterns})
 await fixture(page,true);await page.locator('.rpg-burst-button').first().click();await page.locator('.rpg-cinematic').waitFor();await page.getByRole('button',{name:'Dừng hoạt ảnh',exact:true}).click()
 assert.equal(await page.locator('.rpg-cinematic .rpg-ultimate-illustration.is-paused').count(),1);await page.screenshot({path:`out/cinematic-placeholder.png`.replace('out',out)})
 await page.getByRole('button',{name:'Bỏ qua ›',exact:true}).click();await page.locator('.rpg-cinematic').waitFor({state:'detached'});checks.push({area:'cinematic',ownPortraitAndSpell:true,pause:true,skip:true})
 await page.evaluate(async()=>{const {newGame}=await import('/src/game/progression.ts'),{newRpgSave}=await import('/src/game/adventureRpg/engine.ts'),{useGameStore}=await import('/src/game/useGameStore.ts');const g=newGame();g.adventureRpg=newRpgSave(g);useGameStore.getState().importSave(g);useGameStore.getState().dismiss()})
 await page.getByRole('button',{name:'Đến gặp Lả',exact:true}).click();await page.getByRole('dialog',{name:'Trò chuyện với Lả'}).waitFor();await page.getByRole('button',{name:'Mở Cổng Ký Ức',exact:true}).click();await page.locator('.rpg-stage-node').first().waitFor();await page.locator('.rpg-stage-node').first().click();await page.getByRole('dialog',{name:'Câu chuyện',exact:true}).waitFor();assert((await page.locator('.rpg-story p').innerText()).includes('chiếc bát'))
 await page.screenshot({path:`${out}/story-opening.png`});await page.getByRole('button',{name:'Vào trận ›',exact:true}).click();await page.locator('.rpg-arena').waitFor();checks.push({area:'story',opening:true,skipStartsStage:true})
 assert.deepEqual(errors,[]);assert.deepEqual([...new Set(missing)],[])
 writeFileSync('dev/docs/web-v583/browser-qa.json',JSON.stringify({checks,errors,missing,scope:'Local Chromium, simulated mobile viewports'},null,2)+'\n')
 console.log(JSON.stringify({checks:checks.length,errors,missing}))
}finally{await browser?.close();server.kill();if(errors.length)console.error(errors)}
