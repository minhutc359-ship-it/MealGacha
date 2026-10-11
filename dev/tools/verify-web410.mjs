import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const Chromium=process.env.CHROMIUM_MODULE?(await import(process.env.CHROMIUM_MODULE)).default:null;
const root=process.cwd(),out=root+'/dev/docs/web-v410',base='http://127.0.0.1:4181';
const vite=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
const {newGame}=await vite.ssrLoadModule('/src/game/progression.ts');
const {STAGES}=await vite.ssrLoadModule('/src/game/story.ts');
const {repository}=await vite.ssrLoadModule('/src/infrastructure/storage/repository.ts');
const user=repository.loadUser();user.preferences.soundEnabled=false;user.preferences.musicEnabled=false;
await vite.close();
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4181','--strictPort'],{stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.on('data',c=>{if(String(c).includes('4181'))resolve()});server.on('error',reject);setTimeout(()=>reject(Error('startup')),10000).unref()});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(Chromium?await Chromium.executablePath():undefined),args:Chromium?Chromium.args.filter(a=>a!=='--single-process'):[],headless:true});
const checks=[],errors=[];let originalWorker;
async function context(game=newGame(),width=390,height=844,preferences={}){
 const c=await browser.newContext({viewport:{width,height},reducedMotion:preferences.reducedMotion?'reduce':'no-preference'});
 await c.addInitScript(({game,user})=>{if(!localStorage.getItem('foodchest.tcg.v1')){localStorage.setItem('foodchest.tcg.v1',JSON.stringify(game));localStorage.setItem('foodchest.user.v1',JSON.stringify(user))}},{game,user:{...user,preferences:{...user.preferences,...preferences}}});
 const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));return {c,p};
}
async function geometry(p,name){const g=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(g.scroll<=g.width+1,`${name}: ${JSON.stringify(g)}`);return g}
async function until(p,predicate){for(let i=0;i<300;i++){if(await p.evaluate(predicate))return;await new Promise(resolve=>setTimeout(resolve,100))}throw Error('Async condition timed out')}
try{
 for(const [width,height] of process.env.QA_INTERACTIONS_ONLY?[]:[[320,568],[390,844],[844,390],[1366,768]]){
  const game=newGame();game.clearedStages=STAGES.map(s=>s.id);game.storyEnding='release';game.coins=1234;
  game.story400={version:1,giftClaimed:true,originEnding:'release',decisions:{'living-market':'listen','tomorrow-table':'open'},choices:{},seenScenes:[],claimedRewards:[]};
  const {c,p}=await context(game,width,height);
  for(const [name,route] of [['home','/'],['collection','/?tab=collection'],['decks','/?tab=decks'],['expedition','/?tab=expedition'],['story','/?tab=story'],['settings','/settings']]){
   await p.goto(base+route,{waitUntil:'networkidle'});
   const g=await geometry(p,name);
   const broken=await p.evaluate(()=>[...document.images].filter(i=>i.getClientRects().length&&i.complete&&!i.naturalWidth).map(i=>i.currentSrc));
   assert.deepEqual(broken,[],name+' broken images');
   if(name==='collection'){
    const size=await p.locator('.tcg-card-eyebrow').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize));assert(size>=9,'library text too small '+size);
    await p.locator('.tcg-card-text').first().waitFor({state:'visible'});
    const rows=await p.locator('.tcg-card').evaluateAll(cards=>cards.slice(0,8).map(c=>{const r=c.getBoundingClientRect();return {top:r.top,bottom:r.bottom}}));
    assert(rows[0].bottom-rows[0].top>=300,'card shelf collapsed');
    const second=rows.find(r=>r.top>rows[0].top+2);if(second)assert(second.top>=rows[0].bottom-1,'card rows overlap');
   }
   if(name==='decks'){
    const size=await p.locator('.tcg-card-text').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize));assert(size>=11,'deck description too small '+size);
    const rarity=await p.locator('.tcg-card-eyebrow').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize));assert(rarity>=9,'deck rarity too small '+rarity);
   }
   if(name==='story'){
    assert((await p.locator('.tcg-section-heading').textContent()).includes('27/27'));
    await p.getByRole('button',{name:'Nhật ký & lời thoại',exact:true}).click();
    assert((await p.locator('.tcg-story-archive > summary').innerText()).includes('27/27'));
    await p.keyboard.press('Escape');
   }
   if(width===390 && ['collection','decks','story'].includes(name))await p.screenshot({path:out+`/${name}-phone.jpg`,type:'jpeg',quality:80});
   checks.push({width,height,name,...g,broken});
   console.log(`PASS ${width} ${name}`);
  }
  const persisted=await p.evaluate(()=>JSON.parse(localStorage.getItem('foodchest.tcg.v1')));
  assert.equal(persisted.coins,1234);assert.equal(persisted.storyEnding,'release');assert.deepEqual(persisted.decks,game.decks);assert.deepEqual(persisted.clearedStages,game.clearedStages);
  await c.close();
 }
 // Real interactions in isolated practice; player game remains unchanged.
 const {c,p}=await context();await p.goto(base,{waitUntil:'networkidle'});
 await p.getByRole('button',{name:'Cách chơi',exact:true}).click();
 const table=p.getByRole('region',{name:'Bàn tập TCG'}),before=await p.evaluate(()=>localStorage.getItem('foodchest.tcg.v1'));
 await table.getByRole('button',{name:/Phở bò ·/}).click();await table.getByRole('button',{name:/Bánh mì ·/}).click();
 await table.getByRole('button',{name:/Cơm tấm ·/}).click();await table.getByRole('button',{name:/Chủ tướng địch/}).click();
 await table.getByText(/✓ Đã hoàn thành/).waitFor();
 await table.getByRole('button',{name:'Bài tiếp theo →'}).click();await table.getByRole('button',{name:/Hai nhúm gia vị ·/}).click();await table.getByRole('button',{name:/Dậy lửa ·/}).click();await table.getByRole('button',{name:/Xác nhận dùng/}).click();await table.getByText(/✓ Đã hoàn thành/).waitFor();
 await table.getByRole('button',{name:'Bài tiếp theo →'}).click();await table.getByRole('button',{name:/Phở bò ·/}).click();await table.getByRole('button',{name:/Xác nhận dùng/}).click();await table.getByRole('button',{name:/Ấm trà ngã rẽ ·/}).click();await table.getByRole('button',{name:/Mời ngồi lại ·/}).click();await table.getByRole('button',{name:/Xác nhận dùng/}).click();await table.getByText(/✓ Đã hoàn thành/).waitFor();
 assert.equal(await p.evaluate(()=>localStorage.getItem('foodchest.tcg.v1')),before);checks.push({practiceTCG:3,saveUnchanged:true});await p.keyboard.press('Escape');
 // Announcement focus / Esc. Fresh chest visit shows the currently active announcement.
 await p.goto(base+'/chest',{waitUntil:'networkidle'});
 const announcement=p.getByRole('dialog',{name:'Thông báo mới'});
 if(await announcement.count()){
  await announcement.waitFor({state:'visible'});
  assert(await announcement.evaluate(el=>el.contains(document.activeElement)));
  for(let i=0;i<5;i++){await p.keyboard.press('Tab');assert(await announcement.evaluate(el=>el.contains(document.activeElement)))}
  await announcement.getByRole('checkbox').check();
  await p.keyboard.press('Escape');assert.equal(await announcement.count(),0);checks.push({announcementFocusAndEscape:true});
 } else throw Error('Announcement fixture not active; cannot verify focus');
 await p.goto(base+'/autochess',{waitUntil:'networkidle'});await p.getByRole('button',{name:'Hướng dẫn auto chess',exact:true}).click();
 const practice=p.getByRole('region',{name:'Bàn tập xếp đội Auto'});
 await practice.getByRole('button',{name:/Cơm tấm/}).first().click();await practice.getByRole('button',{name:/Ô tập 20,/}).click();
 await practice.getByRole('button',{name:/Phở bò/}).first().click();await practice.getByRole('button',{name:/Ô tập 31,/}).click();
 await practice.getByRole('button',{name:/Bánh cuốn/}).first().click();await practice.getByRole('button',{name:/Ô tập 34,/}).click();
 const autoBefore=await p.evaluate(()=>localStorage.getItem('foodchest.tcg.v1'));
 await practice.getByRole('button',{name:'Thử trận mẫu bằng luật thật'}).click();await practice.getByText(/Không có phần thưởng hoặc thay đổi tiến trình/).waitFor({timeout:30000});
 assert.equal(await p.evaluate(()=>localStorage.getItem('foodchest.tcg.v1')),autoBefore);checks.push({practiceAuto:true,realSimulation:true,saveUnchanged:true});await p.keyboard.press('Escape');
 // Offline reload and seek over a fully cached long score.
 await p.goto(base+'/settings',{waitUntil:'networkidle'});await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
 const ready=p.getByRole('region',{name:'Web offline và lưu tiến trình'});await ready.getByText(/Giao diện đã sẵn sàng offline/).waitFor();
 await p.goto(base+'/?tab=expedition',{waitUntil:'networkidle'});
 const swBefore=await p.evaluate(()=>localStorage.getItem('foodchest.tcg.v1'));
 await p.evaluate(async()=>{await fetch('/assets/v4/audio/web410/original-lobby.mp3').then(r=>r.arrayBuffer());});
 await until(p,async()=>{const key=(await caches.keys()).find(k=>k.startsWith('som-web-media-'));return key&&!!(await(await caches.open(key)).match('/assets/v4/audio/web410/original-lobby.mp3'))});
 await c.setOffline(true);await p.reload({waitUntil:'networkidle'});
 await p.getByRole('heading',{name:'Con đường qua sương',exact:true}).waitFor();
 const range=await p.evaluate(async()=>{const r=await fetch('/assets/v4/audio/web410/original-lobby.mp3',{headers:{Range:'bytes=0-99'}});return {status:r.status,bytes:(await r.arrayBuffer()).byteLength}});
 assert.deepEqual(range,{status:206,bytes:100});assert.equal(await p.evaluate(()=>localStorage.getItem('foodchest.tcg.v1')),swBefore);
 checks.push({offlineReload:true,offlineAudioSeek:true,saveUnchanged:true});await c.setOffline(false);
 // New worker waits until a Settings button explicitly activates it.
 await p.goto(base+'/settings',{waitUntil:'networkidle'});
 const timeOrigin=await p.evaluate(()=>performance.timeOrigin);
 originalWorker=readFileSync(root+'/dist/sw.js','utf8');writeFileSync(root+'/dist/sw.js',originalWorker.replace(/const VERSION = "[^"]+";/,'const VERSION = "qa-update";'));
 await p.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg.update()});
 await p.evaluate(async()=>{
   for(let i=0;i<300;i++){
    if((await navigator.serviceWorker.getRegistration()).waiting?.state==='installed')return;
    await new Promise(resolve=>setTimeout(resolve,100));
   }
   throw Error('New worker did not reach waiting state');
 });
 const raw=await p.evaluate(()=>localStorage.getItem('foodchest.tcg.v1'));
 const updateState=await p.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();return {waiting:reg.waiting?.state,active:reg.active?.state,timeOrigin:performance.timeOrigin}});
 console.log('UPDATE STATE',JSON.stringify(updateState));
 assert.equal(updateState.timeOrigin,timeOrigin,'worker update reloaded automatically');
 assert.equal(updateState.waiting,'installed');
 await ready.getByRole('button',{name:'Cập nhật và mở lại web'}).waitFor();
 await Promise.all([p.waitForEvent('domcontentloaded'),ready.getByRole('button',{name:'Cập nhật và mở lại web'}).click()]);
 await p.waitForLoadState('networkidle');
 await until(p,async()=> (await caches.keys()).includes('som-web-core-qa-update'));
 const activatedVersion=await p.evaluate(()=>new Promise((resolve,reject)=>{const channel=new MessageChannel();channel.port1.onmessage=e=>resolve(e.data);setTimeout(()=>reject(Error('version reply')),5000);navigator.serviceWorker.controller.postMessage({type:'WEB_VERSION'},[channel.port2])}));
 assert.equal(activatedVersion,'qa-update');
 assert.equal(await p.evaluate(()=>localStorage.getItem('foodchest.tcg.v1')),raw);checks.push({manualUpdate:true,saveUnchanged:true});
 writeFileSync(root+'/dist/sw.js',originalWorker);originalWorker=null;await c.close();
 // Original and retro streaming are lazy, decodable and clean up on mute.
 const music=await context(newGame(),1366,768,{soundEnabled:true,musicEnabled:true});
 await music.p.goto(base,{waitUntil:'networkidle'});await music.p.getByRole('button',{name:'Cách chơi',exact:true}).click();await music.p.keyboard.press('Escape');
 await music.p.goto(base+'/?tab=settings',{waitUntil:'networkidle'});
 await music.p.getByText('Phòng nghe · 9 chủ đề, hai phong cách').click();
 await music.p.getByRole('button',{name:/Thư tới sau mưa/}).click();
 await music.p.getByRole('status').filter({hasText:/Đang phát/}).waitFor();
 await music.p.getByText('8-bit phiêu lưu',{exact:true}).click();
 await music.p.getByRole('status').filter({hasText:/8-bit/}).waitFor();
 const resources=await music.p.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name));assert(resources.some(s=>s.includes('original-harbor-warm.mp3')));assert(resources.some(s=>s.includes('8bit-harbor-warm.mp3')));
 await music.p.getByLabel('Âm thanh game',{exact:true}).uncheck();await music.p.getByText('Đang tắt mọi âm thanh.',{exact:true}).waitFor();
 checks.push({streamingBothStyles:true,mute:true});await music.c.close();
 assert.deepEqual(errors,[]);
 writeFileSync(out+'/browser-results.json',JSON.stringify({checks,errors,scope:'Local production Chromium, responsive web; no physical Safari/device/audio listening approval'},null,2));
 console.log(JSON.stringify({checks:checks.length,errors}));
}finally{if(originalWorker)writeFileSync(root+'/dist/sw.js',originalWorker);await browser.close();server.kill()}
