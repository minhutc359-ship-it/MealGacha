import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
import {spawn} from 'node:child_process'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const url=process.env.SHOWCASE_URL??'http://127.0.0.1:4197',out='dev/docs/web-v597'
mkdirSync(out+'/qa',{recursive:true})
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','dev/tools/vite.pvp-qa.config.ts','--host','127.0.0.1','--port','4197','--strictPort'],{stdio:'pipe'})
let log='';server.stdout.on('data',v=>log+=v);server.stderr.on('data',v=>log+=v)
for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break}catch{}if(i===99)throw Error(log);await new Promise(r=>setTimeout(r,100))}
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR??process.env.LD_LIBRARY_PATH,FONTCONFIG_PATH:'/etc/fonts'}})
const checks=[],errors=[],missing=[],requests=[]
function capture(p){p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)missing.push([r.url(),r.status()])});p.on('request',r=>requests.push(new URL(r.url()).pathname))}
async function fixture(p,{fast=false}={}){
 return p.evaluate(async fast=>{
  const {newGame}=await import('/src/game/progression.ts'),{newRpgSave,reduceRpg}=await import('/src/game/adventureRpg/engine.ts'),{useGameStore}=await import('/src/game/useGameStore.ts'),{CARD_MAP}=await import('/src/game/catalog.ts'),{SPIRIT_IDS}=await import('/src/game/adventureRpg/spiritArt.ts')
  const ids=['hearth','ember','tide','grove','sugar'].map(s=>SPIRIT_IDS.find(id=>CARD_MAP[id].school===s && ['com-tam','banh-mi','pho-bo','goi-cuon-tom-thit','xoi-xeo'].includes(id))??SPIRIT_IDS.find(id=>CARD_MAP[id].school===s))
  const g=newGame(),s=newRpgSave(g);s.cinematics=!fast
  s.roster.forEach((h,i)=>{h.cardId=ids[i];h.level=15;h.rank=2;h.skills=[3,3,3,3]})
  g.adventureRpg=reduceRpg(s,{type:'start',stageId:'lantern-1'},g).save
  const b=g.adventureRpg.run.battle;b.auto=false
  for(const a of b.actors){a.nextAttack=a.nextSkill=a.nextSupport=10000;a.energy=100;if(a.side==='enemy')a.hp=a.maxHp=50000;else a.hp=Math.floor(a.maxHp*.55)}
  if(!useGameStore.getState().importSave(g))throw Error('Fixture rejected');useGameStore.getState().dismiss();return ids
 },fast)
}
async function snapshot(p){return p.evaluate(async()=>{const{useGameStore}=await import('/src/game/useGameStore.ts');return structuredClone(useGameStore.getState().save.adventureRpg)})}
async function dismiss(p){const button=p.getByRole('button',{name:'Tắt thông báo',exact:true});if(await button.isVisible())await button.click()}
async function waitFight(p){await p.locator('.rpg-battle.presentation-fight').waitFor();await p.locator('.rpg-burst-button').first().waitFor()}
try{
 for(const [width,height] of [[320,568],[390,844],[844,390],[1440,900]]){
  const c=await browser.newContext({viewport:{width,height}}),p=await c.newPage();capture(p);await p.goto(url+'/adventure');await p.locator('[data-pixel-character="bach"]').waitFor();await dismiss(p)
  const ids=await fixture(p);await waitFight(p);await p.evaluate(()=>document.fonts.ready)
  const layout=await p.evaluate(()=>({width:document.documentElement.scrollWidth,deck:document.querySelector('.rpg-burst-deck').getBoundingClientRect().bottom}))
  assert(layout.width<=width+1);assert(layout.deck<=height+1)
  await p.locator('.rpg-burst-button').first().click();await p.locator('.rpg-showcase').waitFor();await p.getByRole('button',{name:'Dừng hoạt ảnh',exact:true}).click()
  const saved=await snapshot(p),serial=saved.run.battle.cinematic.serial
  const progress=await p.locator('.rpg-showcase-progress').getAttribute('style');await p.waitForTimeout(220);assert.equal(await p.locator('.rpg-showcase-progress').getAttribute('style'),progress)
  assert.equal(await p.locator('video,.rpg-cinema-toggle').count(),0)
  const rect=await p.locator('.ultimate-banner').evaluate(e=>{const b=e.getBoundingClientRect(),a=e.closest('.rpg-arena').getBoundingClientRect();return {height:b.height,arena:a.height,left:b.left,right:b.right}})
  await p.screenshot({path:`${out}/qa/cast-${width}.png`});console.log('layout',width,JSON.stringify(rect));assert(rect.left>=0&&rect.right<=width+1);assert(rect.height<rect.arena*.5,'Banner covers more than half the field')
  await p.screenshot({path:`${out}/qa/cast-${width}.png`})
  await p.getByRole('button',{name:'Tiếp hoạt ảnh',exact:true}).click();await p.waitForTimeout(1050);await p.getByRole('button',{name:'Dừng hoạt ảnh',exact:true}).click()
  const painted=await p.locator('.rpg-vfx-canvas').evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>32)n++;return n})
  assert(painted>20,'No battlefield cast/impact pixels')
  await p.screenshot({path:`${out}/qa/impact-${width}.png`})
  await p.getByRole('button',{name:'Bỏ qua ›',exact:true}).click();await p.locator('.rpg-showcase').waitFor({state:'detached'});await p.waitForTimeout(250);assert.equal(await p.locator('.rpg-showcase').count(),0,'Skip replays the same cast')
  const after=await snapshot(p);assert.equal(after.run.battle.actors[0].energy,saved.run.battle.actors[0].energy);assert.deepEqual(after.resources,saved.resources)
  assert.deepEqual(after.run.battle.actors.map(a=>a.hp),saved.run.battle.actors.map(a=>a.hp))
  await p.evaluate(async serial=>{const{useGameStore}=await import('/src/game/useGameStore.ts');useGameStore.getState().rpgAction({type:'cinematicDone',serial})},serial)
  // A saved pause is still user-controlled after skipping the presentation.
  await p.getByRole('button',{name:'Tiếp tục trận',exact:true}).click()
  for(let i=1;i<5;i++){
   await p.locator('.rpg-burst-button').nth(i).click();await p.locator(`.ultimate-banner[data-showcase="${ids[i]}"]`).waitFor();await p.getByRole('button',{name:'Dừng hoạt ảnh',exact:true}).click()
   if(i===2)assert.match(await p.locator('.ultimate-combo').textContent(),/×3/)
   await p.screenshot({path:`${out}/qa/theme-${i}-${width}.png`});await p.getByRole('button',{name:'Bỏ qua ›',exact:true}).click();await p.getByRole('button',{name:'Tiếp tục trận',exact:true}).click()
  }
  checks.push({area:'viewport-themes-pause-skip',viewport:[width,height],ids,layout,rect,painted,skipNoRecast:true,chain3:true})
  await c.close()
 }
 // Full-length completion, reload of an in-flight legacy transaction, and fast old preferences.
 const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage();capture(p);await p.goto(url+'/adventure');await dismiss(p);await fixture(p);await waitFight(p)
 await p.locator('.rpg-burst-button').nth(1).click();await p.locator('.rpg-showcase').waitFor();await p.getByRole('button',{name:'Dừng hoạt ảnh',exact:true}).click();const saved=await snapshot(p)
 await p.reload();await waitFight(p);await p.locator('.rpg-showcase').waitFor();assert((await snapshot(p)).run.battle.cinematic)
 await p.getByRole('button',{name:'Tiếp hoạt ảnh',exact:true}).click();await p.locator('.rpg-showcase').waitFor({state:'detached',timeout:6000});await p.waitForTimeout(350)
 assert.equal(await p.locator('.rpg-showcase').count(),0);const after=await snapshot(p);assert.deepEqual(after.resources,saved.resources);assert.equal(after.run.battle.events.filter(e=>e.kind==='burst').length,1);assert.equal(after.run.battle.actors[1].energy,0)
 checks.push({area:'reload-and-natural-completion',noRecast:true})
 await fixture(p,{fast:true});await waitFight(p);await p.locator('.rpg-burst-button').nth(1).click();await p.locator('.rpg-showcase').waitFor();assert.equal((await snapshot(p)).run.battle.cinematic,undefined);checks.push({area:'old-fast-preference',banner:true,noBlockingTransaction:true})
 await c.close()
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),rp=await reduced.newPage();capture(rp);await rp.goto(url+'/adventure');await dismiss(rp);await fixture(rp);await waitFight(rp);await rp.locator('.rpg-burst-button').nth(2).click();await rp.locator('.ultimate-banner.is-reduced').waitFor();await rp.getByRole('button',{name:'Dừng hoạt ảnh',exact:true}).click();assert.equal(await rp.locator('.ultimate-banner').evaluate(e=>getComputedStyle(e).animationName),'none');await rp.screenshot({path:`${out}/qa/reduced.png`});checks.push({area:'reduced-motion',staticBanner:true});await reduced.close()
 assert(!requests.some(p=>p.endsWith('.mp4')));assert.deepEqual(errors,[]);assert.deepEqual(missing,[])
 writeFileSync(out+'/browser-qa.json',JSON.stringify({date:'2026-10-17',browser:'Chromium 153 headless SwiftShader',checks,errors,missing,movieRequests:requests.filter(p=>p.endsWith('.mp4'))},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,errors,missing,movies:0}))
}finally{await browser.close();server.kill()}
