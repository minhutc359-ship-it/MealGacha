import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdirSync,writeFileSync,rmSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),out=path.join(root,'dev/docs/web-v530')
mkdirSync(out,{recursive:true})
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const port=4254,url=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','dev/tools/vite.pvp-qa.config.ts','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'pipe'})
let log='',browser;server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b)
const reports=[],errors=[],missing=[]
async function fixture(page){
 await page.evaluate(async()=>{
  const {newGame}=await import('/src/game/progression.ts'),{newRpgSave,reduceRpg,syncRoster}=await import('/src/game/adventureRpg/engine.ts'),{useGameStore}=await import('/src/game/useGameStore.ts'),{useAppStore}=await import('/src/store/useAppStore.ts')
  const g=newGame();g.coins=9876;g.dust=321;g.adventureRpg=newRpgSave(g);syncRoster(g.adventureRpg,{'chef-lien':45})
  g.adventureRpg.formation=['com-tam','banh-mi','pho-bo','banh-cuon','chef-lien'].map(id=>g.adventureRpg.roster.find(h=>h.cardId===id).uid)
  for(const h of g.adventureRpg.roster){h.level=15;h.rank=2;h.skills=[4,4,4,4];h.gear=[2,2,1]}
  g.adventureRpg=reduceRpg(g.adventureRpg,{type:'start',stageId:'lantern-1'},g).save
  for(const a of g.adventureRpg.run.battle.actors){a.energy=100;a.nextAttack=a.nextSkill=a.nextSupport=1000;if(a.side==='enemy')a.hp=a.maxHp=20000}
  if(!useGameStore.getState().importSave(g))throw Error('5.3 fixture rejected')
  useGameStore.getState().dismiss();useAppStore.getState().updatePreference('reducedMotion',false)
 })
 await page.locator('.rpg-burst-button').first().waitFor()
}
const snapshot=page=>page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');return structuredClone(useGameStore.getState().save)})
try{
 for(let i=0;i<100;i++){try{await fetch(url);break}catch{await new Promise(r=>setTimeout(r,100))}}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN,headless:true,env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR??process.env.LD_LIBRARY_PATH},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
 for(const [width,height] of (process.argv.includes('--quick')?[[390,844]]:[[1440,900],[390,844],[844,390],[320,568],[390,700]])){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage()
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/assets/')&&r.status()>=400)missing.push(r.url())})
  await page.goto(url+'/adventure');await page.locator('.rpg-stage-node').first().waitFor();await fixture(page)
  const geometry=await page.evaluate(()=>{
   const arena=document.querySelector('.rpg-arena').getBoundingClientRect(),hud=document.querySelector('.rpg-arena-hud').getBoundingClientRect()
   return {arena:{x:arena.x,y:arena.y,right:arena.right,bottom:arena.bottom,height:arena.height},hudBottom:hud.bottom,actors:[...document.querySelectorAll('.rpg-combatant')].map(n=>{const r=n.getBoundingClientRect(),c=n.querySelector('.rpg-actor-caption').getBoundingClientRect();return {uid:n.dataset.uid,x:r.x,y:r.y,right:r.right,bottom:c.bottom}})}
  })
  assert(geometry.hudBottom<=geometry.arena.y+1)
  for(const a of geometry.actors){assert(a.x>=geometry.arena.x-1&&a.right<=geometry.arena.right+1,JSON.stringify(a));assert(a.y>=geometry.arena.y+geometry.arena.height*.23,JSON.stringify(a));assert(a.bottom<=geometry.arena.bottom+1,JSON.stringify(a))}
  await page.locator('.rpg-burst-button').first().click();await page.locator('.rpg-cinematic video').waitFor()
  await page.waitForFunction(()=>document.querySelector('.rpg-cinematic video')?.currentTime>.15)
  const playing=await page.locator('.rpg-cinematic video').evaluate(v=>({time:v.currentTime,ready:v.readyState,width:v.videoWidth,height:v.videoHeight,codec:v.canPlayType('video/mp4; codecs="avc1.42E01E"')}))
  assert.equal(playing.width,512);assert.equal(playing.height,288);assert(playing.ready>=2)
  const frozen=await snapshot(page),startTick=frozen.adventureRpg.run.battle.tick
  await page.getByRole('button',{name:'Dừng hoạt ảnh',exact:true}).click();await page.waitForTimeout(150)
  const t1=await page.locator('.rpg-cinematic video').evaluate(v=>v.currentTime);await page.waitForTimeout(260)
  const t2=await page.locator('.rpg-cinematic video').evaluate(v=>v.currentTime);assert(Math.abs(t2-t1)<.1)
  assert.equal((await snapshot(page)).adventureRpg.run.battle.tick,startTick)
  await page.screenshot({path:path.join(out,`cinematic-${width}x${height}.jpg`),quality:87})
  const paused=await snapshot(page);await page.reload();await page.locator('.rpg-cinematic video').waitFor()
  assert.deepEqual((await snapshot(page)).adventureRpg.run.battle,paused.adventureRpg.run.battle)
  await page.getByRole('button',{name:'Tiếp hoạt ảnh',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.rpg-cinematic video')?.currentTime>.15)
  await page.getByRole('button',{name:'Bỏ qua ›',exact:true}).click();await page.locator('.rpg-cinematic').waitFor({state:'detached'})
  const after=await snapshot(page);assert.equal(after.adventureRpg.run.battle.actors[0].energy,paused.adventureRpg.run.battle.actors[0].energy)
  assert.equal(after.coins,9876);assert.equal(after.dust,321)
  if(width===390&&height===844){
   for(let i=1;i<5;i++){
    await page.locator('.rpg-burst-button').nth(i).click();await page.locator('.rpg-cinematic video').waitFor();await page.waitForFunction(()=>document.querySelector('.rpg-cinematic video')?.currentTime>.1)
    const id=(await snapshot(page)).adventureRpg.run.battle.actors[i].id
    if(i===2){await page.screenshot({path:path.join(out,'tide-cinematic-390x844.jpg'),quality:87});const sounds=await page.evaluate(async()=>{const{gameAudio}=await import('/src/infrastructure/audio/gameAudio.ts');return gameAudio.resourceStats()});assert(sounds.effects>0);reports.push({soundDuringCinematic:sounds})}
    await page.locator('.rpg-cinematic').waitFor({state:'detached',timeout:6500});reports.push({naturalMovieCompletion:id})
   }
   await page.getByRole('button',{name:'Video tuyệt kỹ ON',exact:true}).click();await page.getByRole('button',{name:'Tạm dừng trận',exact:true}).click();await page.reload();await page.getByRole('button',{name:'Video tuyệt kỹ OFF',exact:true}).waitFor()
   assert.equal((await snapshot(page)).adventureRpg.cinematics,false)
  }
  reports.push({viewport:{width,height},geometry,playing,pausedDelta:t2-t1,reloadedWithoutRecast:true})
  console.log(JSON.stringify({viewport:`${width}x${height}`,video:true,paused:true,reloaded:true}));await context.close()
 }
 // A real chest draw crosses the threshold and unlocks exactly one character, using the actual UI.
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message))
 await page.goto(url+'/adventure?hero=chef-nhien');await page.locator('.rpg-hero-details').waitFor()
 await page.evaluate(async()=>{
  const{useAppStore}=await import('/src/store/useAppStore.ts'),{repository}=await import('/src/infrastructure/storage/repository.ts'),{newGame}=await import('/src/game/progression.ts'),{newRpgSave}=await import('/src/game/adventureRpg/engine.ts'),{useGameStore}=await import('/src/game/useGameStore.ts')
  const u=structuredClone(useAppStore.getState().user);u.keys=30;u.spiritCards={'chef-nhien':44};u.spiritWish='chef-nhien';u.spiritPity=4;u.preferences.reducedMotion=true;repository.saveUser(u);useAppStore.setState({user:u})
  const g=newGame();g.coins=9876;g.dust=321;g.adventureRpg=newRpgSave(g);if(!useGameStore.getState().importSave(g))throw Error('collection fixture rejected');useGameStore.getState().dismiss()
 })
 await page.reload();await page.locator('.rpg-unlock-progress[data-spirit="chef-nhien"]').waitFor();await page.getByText('44 / 45 thẻ Vị Linh',{exact:true}).waitFor()
 assert(await page.getByRole('button',{name:'Đặt vào ô 1',exact:true}).isDisabled())
 await page.locator('.rpg-unlock-progress').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'profile-locked-390x844.jpg'),quality:86})
 await page.getByRole('link',{name:'Mở Rương vị giác ↗',exact:true}).click();await page.locator('#open-chest-button').waitFor();const announcement=page.getByRole('button',{name:'Tắt thông báo',exact:true});await announcement.waitFor({state:'visible',timeout:2000}).catch(()=>{});if(await announcement.isVisible())await announcement.click();await page.locator('#open-chest-button').click()
 await page.locator('.chest-spirit-card').waitFor({timeout:12000});assert((await page.locator('.chest-spirit-card').innerText()).includes('45/45'))
 await page.screenshot({path:path.join(out,'chest-unlock-390x844.jpg'),quality:86})
 await page.locator('.chest-spirit-card').click();await page.getByText('45 / 45 thẻ Vị Linh',{exact:true}).waitFor()
 assert(!(await page.getByRole('button',{name:'Đặt vào ô 1',exact:true}).isDisabled()))
 const earned=await page.evaluate(async()=>{const{useAppStore}=await import('/src/store/useAppStore.ts'),{useGameStore}=await import('/src/game/useGameStore.ts');return {user:useAppStore.getState().user,game:useGameStore.getState().save}})
 assert.equal(earned.user.keys,29);assert.equal(earned.user.spiritCards['chef-nhien'],45);assert.equal(earned.game.adventureRpg.roster.filter(h=>h.cardId==='chef-nhien').length,1);assert.equal(earned.game.coins,9876);assert.equal(earned.game.dust,321)
 await page.getByRole('button',{name:'Đặt vào ô 1',exact:true}).click();await page.getByRole('button',{name:'+180 KN · 1 Sổ KN',exact:true}).click()
 const trained=await snapshot(page);assert.equal(trained.adventureRpg.roster.find(h=>h.cardId==='chef-nhien').level,2);assert.equal(trained.adventureRpg.resources.experience,earned.game.adventureRpg.resources.experience-1)
 await page.locator('.rpg-unlock-progress').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'profile-unlocked-390x844.jpg'),quality:86})
 await page.reload();await page.getByText('45 / 45 thẻ Vị Linh',{exact:true}).waitFor();assert.equal((await snapshot(page)).adventureRpg.roster.find(h=>h.cardId==='chef-nhien').level,2)
 reports.push({chestFlow:{before:44,after:45,keysBefore:30,keysAfter:29,unlockedOnce:true,trainedLevel:2,retainedAfterReload:true}})
 await context.close()
 // A missing movie and reduced motion both finish the gate without recasting or stalling combat.
 for(const kind of ['missing','reduced']){
  const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:kind==='reduced'?'reduce':'no-preference'}),p=await c.newPage()
  if(kind==='missing')await p.route('**/movies/com-tam.mp4',r=>r.abort())
  await p.goto(url+'/adventure');await p.locator('.rpg-stage-node').first().waitFor();await fixture(p)
  await p.locator('.rpg-burst-button').first().click();await p.locator('.rpg-cinematic-poster').waitFor();assert.equal(await p.locator('.rpg-cinematic video').count(),0)
  await p.locator('.rpg-cinematic').waitFor({state:'detached',timeout:8000});assert(!(await snapshot(p)).adventureRpg.run.battle.cinematic)
  reports.push({fallback:kind,completed:true});await c.close()
 }
 const retryContext=await browser.newContext({viewport:{width:390,height:844}}),retryPage=await retryContext.newPage()
 await retryPage.goto(url+'/adventure');await retryPage.locator('.rpg-stage-node').first().waitFor();await fixture(retryPage)
 await retryPage.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');const original=useGameStore.getState().rpgAction;let reject=true;useGameStore.setState({rpgAction:a=>{if(a.type==='cinematicDone'&&reject){reject=false;return false}return original(a)}})})
 await retryPage.locator('.rpg-burst-button').first().click();await retryPage.getByRole('button',{name:'Thử lại',exact:true}).waitFor({timeout:7000})
 const failedSave=await snapshot(retryPage);assert(failedSave.adventureRpg.run.battle.cinematic)
 await retryPage.getByRole('button',{name:'Thử lại',exact:true}).click();await retryPage.locator('.rpg-cinematic').waitFor({state:'detached'})
 assert.equal((await snapshot(retryPage)).adventureRpg.run.battle.actors[0].energy,failedSave.adventureRpg.run.battle.actors[0].energy)
 reports.push({completionWriteFailure:'retryable without a second cast'});await retryContext.close()
 rmSync(path.join(out,'qa-failure.json'),{force:true})
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[])
 writeFileSync(path.join(out,'browser-qa.json'),JSON.stringify({date:new Date().toISOString(),browser:'Chromium / SwiftShader',reports,errors,missing,limits:['Not a real-device FPS measurement','Safari not tested','Vercel scope blocks live-preview validation']},null,2)+'\n')
 console.log(JSON.stringify({success:true,reports:reports.length,errors:errors.length,missing:missing.length}))
}catch(e){writeFileSync(path.join(out,'qa-failure.json'),JSON.stringify({error:String(e),stack:e.stack,log:log.slice(-3000),reports,errors,missing},null,2));throw e}
finally{await browser?.close();server.kill('SIGTERM')}
