import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdirSync,writeFileSync} from 'node:fs'
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const engine=process.env.QA_ENGINE??'chromium',out='dev/docs/web-v598',port=process.env.QA_PORT??'4196',url='http://127.0.0.1:'+port
mkdirSync(out+'/qa',{recursive:true})
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','dev/tools/vite.pvp-qa.config.ts','--host','127.0.0.1','--port',port,'--strictPort'],{stdio:'pipe'})
let log='';server.stdout.on('data',v=>log+=v);server.stderr.on('data',v=>log+=v)
for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break}catch{}if(i===99)throw Error(log);await new Promise(r=>setTimeout(r,100))}
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true,executablePath:process.env.WEBKIT_BIN}:{executablePath:process.env.CHROMIUM_BIN,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR??process.env.LD_LIBRARY_PATH,FONTCONFIG_PATH:'/etc/fonts'}})
const checks=[],errors=[],missing=[],requests=[]
const pairs=[['tea-oracle','cloud-teapot'],['salt-alchemist','salt-colossus'],['moon-priestess','moon-heron'],['aroma-conductor','aroma-regent']]
function capture(p){p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)missing.push([r.url(),r.status()])});p.on('request',r=>requests.push(new URL(r.url()).pathname))}
async function fixture(p,ids,mode='warning') {
 const result=await p.evaluate(async({ids,mode})=>{
  const {newGame}=await import('/src/game/progression.ts'),{newRpgSave,reduceRpg,createRpgBattle,advanceRpgBattle}=await import('/src/game/adventureRpg/engine.ts'),{useGameStore}=await import('/src/game/useGameStore.ts'),{MONSTER_MAP}=await import('/src/game/autochess/catalog.ts')
  const g=newGame(),s=newRpgSave(g);s.cinematics=false
  g.adventureRpg=reduceRpg(s,{type:'start',stageId:'lantern-1'},g).save
  const enemies=ids.map((id,i)=>({id,uid:'qa-'+id,name:MONSTER_MAP[id].name,school:MONSTER_MAP[id].school,boss:i===1,elite:i===0,style:i===0?'mender':undefined,level:1}))
  let b=createRpgBattle(s,[enemies],'qa598-'+ids[0]+'-'+mode,undefined,0,530);b.auto=false
  for(const a of b.actors){a.nextAttack=a.nextSkill=a.nextSupport=10000;a.hp=a.maxHp=30000;a.energy=100;a.attack=1}
  const boss=b.actors.find(a=>a.boss);boss.nextSkill=0
  if(mode==='phase')boss.hp=12000
  b=advanceRpgBattle(b,1)
  // Extend only the read-only screenshot fixture; cast expiry is checked separately.
  if(b.warning)b.warning.until=b.tick+40
  if(mode==='interrupted')boss && (b.actors.find(a=>a.boss).stun=6)
  if(mode==='fallen'){b.warning=null;for(const a of b.actors.filter(a=>a.side==='enemy')){a.hp=0;a.motion='fall';a.motionAt=b.tick}b.paused=true}
  g.adventureRpg.run.battle=b
  if(!useGameStore.getState().importSave(g))throw Error('Enemy fixture rejected')
  useGameStore.getState().dismiss();return ids.map(id=>'qa-'+id)
 },{ids,mode})
 // Allow the new battle identity to start its entrance before waiting for fight.
 await p.waitForTimeout(200)
 return result
}
try{
 for(const viewport of process.env.QA_REDUCED_ONLY?[]:[{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){
  const context=await browser.newContext({viewport}),p=await context.newPage();capture(p);await p.goto(url+'/adventure');await p.locator('[data-pixel-character="bach"]').waitFor()
  const close=p.getByRole('button',{name:'Tắt thông báo',exact:true});if(await close.isVisible())await close.click()
  for(const ids of pairs){
   await fixture(p,ids);await p.locator('.rpg-battle.presentation-fight').waitFor()
   await p.locator(`[data-warning-source="${ids[1]}"]`).waitFor();await p.getByRole('button',{name:'Tạm dừng trận',exact:true}).click()
   const sprites=p.locator('.rpg-combatant.side-enemy [data-sheet^="campaign-"]');assert.equal(await sprites.count(),2)
   await p.waitForFunction(()=>[...document.querySelectorAll('.rpg-combatant.side-enemy canvas')].every(c=>c.dataset.pose!==undefined))
   await p.waitForTimeout(100);const poses=await sprites.locator('canvas').evaluateAll(cs=>cs.map(c=>c.dataset.pose));await p.waitForTimeout(180);assert.deepEqual(await sprites.locator('canvas').evaluateAll(cs=>cs.map(c=>c.dataset.pose)),poses)
   const threatened=await p.locator('.rpg-threat-cell').evaluateAll(es=>es.map(e=>{const a=e.closest('.rpg-arena').querySelector(`[data-uid="${e.dataset.target}"]`);return {uid:e.dataset.target,hp:a?.dataset.hp}}));assert(threatened.length>0);assert(threatened.every(t=>Number(t.hp)>0))
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
   if(viewport.width===390||ids[0]==='tea-oracle')await p.screenshot({path:`${out}/qa/${engine}-${ids[1]}-${viewport.width}.png`})
   checks.push({area:'warning-and-pause',ids,viewport,poses,targets:threatened.map(t=>t.uid)})
  }
  await fixture(p,pairs[2],'phase');await p.locator('.rpg-battle.presentation-fight').waitFor();await p.waitForTimeout(350);await p.locator('.rpg-vfx-canvas[data-enemy-phase="moon-heron"]').waitFor();await p.getByRole('button',{name:'Tạm dừng trận',exact:true}).click();await p.screenshot({path:`${out}/qa/${engine}-phase-${viewport.width}.png`});checks.push({area:'phase',viewport,authoredPose:true,motif:true})
  await fixture(p,pairs[0],'interrupted');await p.waitForTimeout(150);assert.equal(await p.locator('.rpg-enemy-telegraph').count(),0);checks.push({area:'interrupted',viewport,noStaleTelegraph:true})
  // Real engine resolution -> contact VFX, using a short warning expiry in the fixture.
  await fixture(p,pairs[1]);await p.locator('.rpg-battle.presentation-fight').waitFor();await p.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');const store=useGameStore.getState(),g=structuredClone(store.save),b=g.adventureRpg.run.battle;b.warning.until=b.tick+1;store.importSave(g);store.dismiss()})
  await p.locator('.rpg-vfx-canvas[data-enemy-signature="salt-colossus"]').waitFor();checks.push({area:'cast-impact',viewport,realEnemySkill:true})
  await context.close()
 }
 const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await c.newPage();capture(p);await p.goto(url+'/adventure');await fixture(p,pairs[0]);await p.locator('.rpg-battle.presentation-fight').waitFor();await p.waitForLoadState('networkidle');await p.locator('.rpg-threat-cell i').first().waitFor();assert.equal(await p.locator('.rpg-threat-cell i').first().evaluate(e=>getComputedStyle(e).animationName),'none');await p.screenshot({path:`${out}/qa/${engine}-reduced.png`});checks.push({area:'reduced-motion',staticWarning:true});await c.close()
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);assert(!requests.some(p=>p.endsWith('.mp4')))
 writeFileSync(out+`/${engine}${process.env.QA_REDUCED_ONLY?"-reduced":""}-qa.json`,JSON.stringify({date:'2026-10-17',engine,version:browser.version(),warningFixtureExtendedForScreenshots:true,checks,errors,missing,newAtlasRequests:[...new Set(requests.filter(p=>p.includes('/campaign598/')))],movieRequests:0},null,2)+'\n');console.log(JSON.stringify({engine,checks:checks.length,errors,missing}))
}finally{await browser.close();server.kill()}
