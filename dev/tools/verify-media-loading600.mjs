import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {writeFileSync,mkdirSync,statSync} from 'node:fs'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const port=4193,url=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','dev/tools/vite.pvp-qa.config.ts','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'pipe'})
let browser,log='';const requests=[],errors=[],missing=[]
server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b)
const ids=['bun-rieu','bun-cha','banh-xeo','com-ga','xoi-xeo']
try{
  for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN,headless:true,args:process.env.CHROMIUM_ARGS?JSON.parse(process.env.CHROMIUM_ARGS):['--no-sandbox'],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR??process.env.LD_LIBRARY_PATH,FONTCONFIG_PATH:process.env.FONTCONFIG_PATH??'/etc/fonts'}})
  const page=await browser.newPage({viewport:{width:390,height:844}})
  page.on('request',r=>{if(r.url().includes('/assets/'))requests.push(new URL(r.url()).pathname)})
  page.on('response',r=>{if(r.url().includes('/assets/')&&r.status()>=400)missing.push(r.url())})
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(url+'/adventure');await page.locator('.village-npc').first().waitFor()
  const notice=page.getByRole('button',{name:'Tắt thông báo',exact:true});if(await notice.isVisible())await notice.click()
  const fixture=async (page,ids)=>page.evaluate(async ids=>{
    const {newGame}=await import('/src/game/progression.ts'),{newRpgSave,reduceRpg}=await import('/src/game/adventureRpg/engine.ts'),{useGameStore}=await import('/src/game/useGameStore.ts')
    const g=newGame(),s=newRpgSave(g)
    for(let i=0;i<s.roster.length;i++){const h=s.roster[i];h.cardId=ids[i];h.level=15;h.rank=2;h.skills=[3,3,3,3]}
    s.cinematics=true;g.adventureRpg=reduceRpg(s,{type:'start',stageId:'lantern-1'},g).save
    const b=g.adventureRpg.run.battle;b.auto=false
    for(const a of b.actors){a.nextAttack=a.nextSkill=a.nextSupport=10000;a.energy=100;if(a.side==='enemy')a.hp=a.maxHp=50000}
    if(!useGameStore.getState().importSave(g))throw Error('Loading fixture rejected');useGameStore.getState().dismiss()
  },ids)
  await fixture(page,ids)
  await page.locator('.rpg-battle.presentation-fight').waitFor();await page.waitForTimeout(500)
  const before=requests.filter(p=>/\/awakening530\/(movies|sounds)\//.test(p))
  assert.deepEqual(before,[],'Battle entry fetched media for casts that have not occurred')
  assert(!requests.includes('/assets/rpg/spirit510/ultimates.webp'),'Retired display atlas still preloads')
  await page.locator('.rpg-burst-button').first().click();await page.locator('.rpg-cinematic').waitFor()
  await Promise.race([page.waitForFunction(()=>{const v=document.querySelector('.rpg-cinematic video');return v?.readyState>=2&&v.currentTime>0}),page.locator('.rpg-cinematic .rpg-ultimate-illustration').waitFor()])
  const playback=await page.locator('.rpg-cinematic video').count()?'video':'fallback'
  await page.getByRole('button',{name:'Dừng hoạt ảnh',exact:true}).click()
  const progress=await page.locator('.rpg-cinematic-progress').evaluate(e=>e.style.width)
  await page.waitForTimeout(150);assert.equal(await page.locator('.rpg-cinematic-progress').evaluate(e=>e.style.width),progress)
  const movies=[...new Set(requests.filter(p=>p.endsWith('.mp4')))],sounds=[...new Set(requests.filter(p=>p.includes('/awakening530/sounds/')))]
  assert.deepEqual(movies,[`/assets/rpg/awakening530/movies/${ids[0]}.mp4`])
  assert(sounds.every(p=>p.endsWith(`/${ids[0]}.mp3`)),'An unused party member sound was fetched')
  const snapshot=()=>page.evaluate(async()=>{const{useGameStore}=await import('/src/game/useGameStore.ts');const s=useGameStore.getState().save.adventureRpg;return{actors:s.run.battle.actors.map(a=>[a.uid,a.hp,a.shield]),resources:s.resources}})
  const committed=await snapshot();await page.getByRole('button',{name:'Bỏ qua ›',exact:true}).click();await page.locator('.rpg-cinematic').waitFor({state:'detached'});assert.deepEqual(await snapshot(),committed)
  await page.getByRole('link',{name:'Chuyển sang TCG',exact:true}).click();await page.waitForURL(u=>u.pathname==='/');await page.waitForFunction(()=>!document.querySelector('.rpg-arena'))
  const cache=await page.evaluate(async()=>{const{characterCacheStats}=await import('/src/infrastructure/assets/characterSprites.ts');return characterCacheStats()})
  assert.equal(cache.leased,0,'Departed battle keeps image leases')
  assert(cache.bytes<=cache.budget)
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[])
  const record={date:'2026-10-16',party:ids,beforeCast:before,requestedMovies:movies,requestedSounds:sounds,playback,pause:true,skipWithoutRecast:true,cacheAfterLeavingBattle:cache,avoidedEagerMovieBytes:ids.reduce((n,id)=>n+statSync(`public/assets/rpg/awakening530/movies/${id}.mp4`).size,0),errors,missing}
  // A cold native cast also fetches only the selected HD atlas and shared FX.
  const n=await browser.newPage({viewport:{width:390,height:844}}),nativeRequests=[]
  n.on('request',r=>{if(r.url().includes('/assets/'))nativeRequests.push(new URL(r.url()).pathname)})
  n.on('pageerror',e=>errors.push(e.message));n.on('response',r=>{if(r.url().includes('/assets/')&&r.status()>=400)missing.push(r.url())})
  await n.goto(url+'/adventure');await n.locator('.village-npc').first().waitFor()
  const noticeNative=n.getByRole('button',{name:'Tắt thông báo',exact:true});if(await noticeNative.isVisible())await noticeNative.click()
  await fixture(n,['com-tam','banh-mi','pho-bo','banh-cuon','goi-cuon-tom-thit']);await n.locator('.rpg-battle.presentation-fight').waitFor();await n.waitForTimeout(300)
  assert(!nativeRequests.some(p=>/\/awakening530\/(movies|sounds)\//.test(p)))
  await n.locator('.rpg-burst-button').first().click();await n.waitForFunction(()=>document.querySelector('.rpg-cinematic-native')?.dataset.phase==='impact');await n.getByRole('button',{name:'Dừng hoạt ảnh',exact:true}).click()
  const painted=await n.locator('.rpg-cinematic-native').evaluate(canvas=>{const data=canvas.getContext('2d').getImageData(0,0,Math.floor(canvas.width/2),canvas.height).data;let count=0;for(let i=3;i<data.length;i+=4)if(data[i]>32)count++;return count})
  assert(painted>100,'Cold native actor was not painted')
  const hd=[...new Set(nativeRequests.filter(p=>p.includes('/starters590/')&&!p.endsWith('-pixel.webp')&&!p.endsWith('village-pixel.webp')))]
  assert(hd.every(p=>p.endsWith('/com-tam.webp')||p.endsWith('/ultimate591.webp')))
  assert(hd.some(p=>p.endsWith('/com-tam.webp')))
  assert(!nativeRequests.some(p=>p.endsWith('.mp4')))
  await n.getByRole('button',{name:'Bỏ qua ›',exact:true}).click();await n.locator('.rpg-cinematic').waitFor({state:'detached'})
  record.native={selectedCharacter:'com-tam',requestedHdAssets:hd,paintedActorPixels:painted,noMovie:true,skip:true}
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[])
  mkdirSync('dev/docs/web-v600',{recursive:true});writeFileSync('dev/docs/web-v600/lazy-media-qa.json',JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record))
}catch(e){console.error(log.slice(-2000),errors,missing);throw e}
finally{await browser?.close();server.kill()}
