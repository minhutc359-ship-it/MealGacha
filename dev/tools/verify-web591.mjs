import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdirSync,writeFileSync} from 'node:fs'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const out='dev/docs/web-v591/qa';mkdirSync(out,{recursive:true})
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','dev/tools/vite.pvp-qa.config.ts','--host','127.0.0.1','--port','4190','--strictPort'],{stdio:'pipe'})
const url='http://127.0.0.1:4190',errors=[],missing=[],checks=[]
let browser,preview,log='',page,productionSeed
server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b)
const capture=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().includes('/assets/')&&r.status()>=400)missing.push(r.url())})}
async function ready(p){await p.goto(url+'/adventure');await p.locator('.village-npc').first().waitFor();const close=p.getByRole('button',{name:'Tắt thông báo',exact:true});if(await close.isVisible())await close.click();await p.evaluate(()=>document.fonts.ready)}
async function fixture(p,cinematics=true,xoi=false){await p.evaluate(async ({cinematics,xoi})=>{
  const {newGame}=await import('/src/game/progression.ts'),{newRpgSave,reduceRpg}=await import('/src/game/adventureRpg/engine.ts'),{useGameStore}=await import('/src/game/useGameStore.ts')
  const g=newGame(),s=newRpgSave(g);s.cinematics=cinematics;if(xoi)s.roster.find(h=>h.uid===s.formation[0]).cardId="xoi"
  for(const h of s.roster){h.level=15;h.rank=2;h.skills=[3,3,3,3]}
  g.adventureRpg=reduceRpg(s,{type:'start',stageId:'lantern-1'},g).save
  const b=g.adventureRpg.run.battle;b.auto=false
  for(const a of b.actors){a.nextAttack=a.nextSkill=a.nextSupport=10000;a.energy=100;if(a.side==='enemy')a.hp=a.maxHp=50000}
  if(!useGameStore.getState().importSave(g))throw Error('Fixture rejected');useGameStore.getState().dismiss()
},{cinematics,xoi});await p.locator('.rpg-arena').waitFor()}
async function mutate(p,op){return p.evaluate(async op=>{
  const {useGameStore}=await import('/src/game/useGameStore.ts'),{advanceRpgBattle}=await import('/src/game/adventureRpg/engine.ts');const store=useGameStore.getState(),g=structuredClone(store.save);let b=g.adventureRpg.run.battle
  if(op==='refill')for(const a of b.actors)if(a.side==='ally')a.energy=100
  if(op==='wave'){for(const a of b.actors)if(a.side==='enemy')a.hp=0;b=advanceRpgBattle(b,1)}
  if(op==='win')for(let n=0;n<5&&!b.result;n++){for(const a of b.actors)if(a.side==='enemy')a.hp=0;b=advanceRpgBattle(b,1)}
  if(op==='loss'){for(const a of b.actors)if(a.side==='ally')a.hp=0;b=advanceRpgBattle(b,1)}
  g.adventureRpg.run.battle=b
  if(!store.importSave(g)){const {rpgSaveSchema}=await import('/src/game/adventureRpg/schema.ts');throw Error('Mutation rejected '+JSON.stringify(rpgSaveSchema.safeParse(g.adventureRpg)))};useGameStore.getState().dismiss()
},op)}
try{
  for(let n=0;n<100;n++){try{if((await fetch(url)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  const args=process.env.CHROMIUM_ARGS?JSON.parse(process.env.CHROMIUM_ARGS):['--no-sandbox']
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN,headless:true,env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR??process.env.LD_LIBRARY_PATH,FONTCONFIG_PATH:process.env.FONTCONFIG_PATH??'/etc/fonts'},args})
  if(process.env.REDUCED_ONLY){
    const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});page=await c.newPage();capture(page);await ready(page);await fixture(page,true,true);await page.locator('.rpg-battle.presentation-fight').waitFor();await page.locator('.rpg-burst-button').first().click();await page.locator('.rpg-cinematic-native[data-character="xoi"]').waitFor();
    await page.waitForFunction(()=>document.querySelector('.rpg-cinematic-native')?.dataset.phase==='impact');await page.waitForTimeout(300);assert.equal(await page.locator('.rpg-cinematic-native').getAttribute('data-phase'),'impact');assert.equal(await page.locator('.rpg-cinematic video').count(),0);await page.getByRole('button',{name:'Bỏ qua ›',exact:true}).click();await page.locator('.rpg-cinematic').waitFor({state:'detached'});assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
    writeFileSync('dev/docs/web-v591/reduced-qa.json',JSON.stringify({date:'2026-10-16',browser:'Chromium headless',reducedMotion:true,xoiStaticImpact:true,skip:true,errors,missing},null,2)+'\n');console.log('PASS reduced motion');await c.close();
  }else{
  for(const [width,height] of (process.env.QUICK_PERF?[]:[[320,568],[390,844],[844,390],[1440,900]])){
    const context=await browser.newContext({viewport:{width,height}});page=await context.newPage();capture(page);await ready(page)
    assert.equal(await page.locator('[data-pixel-character]').count(),7)
    const village=await page.evaluate(()=>{
      const map=document.querySelector('.rpg-village-map').getBoundingClientRect(),walker=document.querySelector('.leader .village-walker').getBoundingClientRect()
      return {map:{width:map.width,height:map.height,bottom:map.bottom},walker:{width:walker.width,height:walker.height},scroll:document.documentElement.scrollWidth}
    })
    assert(village.scroll<=width+1);assert(Math.abs(village.walker.width-village.walker.height)<1,'Distorted pixel cell')
    await page.screenshot({path:`${out}/village-${width}.png`})
    await page.getByRole('button',{name:'Đến gặp Lả',exact:true}).click();await page.getByRole('dialog',{name:'Trò chuyện với Lả'}).waitFor({timeout:7000});await page.getByRole('button',{name:'Để sau',exact:true}).click()
    await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+100));await fixture(page)
    const beats=await page.evaluate(async()=>{const {battlePresentationSequence}=await import('/src/game/adventureV560.ts');return battlePresentationSequence(0,document.querySelector('.rpg-battle').classList.contains('is-quiet'))})
    await page.clock.runFor(beats[0].duration+10)
    for(const phase of ['ready','start']){await page.locator(`.battle-status.phase-${phase}`).waitFor();assert.equal(await page.locator('.rpg-ceremony-art').count(),0);if(phase==='ready')await page.clock.runFor(beats[1].duration)}
    // Ready/Start are intentionally brief; do not block their assertion on a desktop screenshot encode.
    await page.screenshot({path:`${out}/start-${width}.png`,animations:'disabled'});await page.clock.resume()
    await page.locator('.rpg-battle.presentation-fight').waitFor()
    assert.equal(await page.locator('.rpg-arena [data-sheet$="-pixel"].is-loaded').count(),5)
    const battleGeometry=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,deck:document.querySelector('.rpg-burst-deck').getBoundingClientRect().bottom,arena:document.querySelector('.rpg-arena').getBoundingClientRect().height,viewport:innerHeight}))
    assert(battleGeometry.scroll<=width+1);assert(battleGeometry.deck<=height+1,JSON.stringify(battleGeometry));assert(battleGeometry.arena>70)
    await page.screenshot({path:`${out}/battle-${width}.png`})
    await page.locator('.rpg-burst-button').first().click();await page.locator('.rpg-cinematic-native').waitFor()
    await page.waitForFunction(()=>document.querySelector('.rpg-cinematic-native')?.dataset.phase==='impact')
    await page.getByRole('button',{name:'Dừng hoạt ảnh',exact:true}).click()
    assert.equal(await page.locator('.rpg-cinematic video,.rpg-cinematic .rpg-ultimate-illustration,.rpg-cinematic-memory').count(),0)
    const progress=await page.locator('.rpg-cinematic-progress').evaluate(e=>e.style.width);await page.waitForTimeout(250);assert.equal(await page.locator('.rpg-cinematic-progress').evaluate(e=>e.style.width),progress)
    await page.screenshot({path:`${out}/ultimate-${width}.png`})
    await page.getByRole('button',{name:'Bỏ qua ›',exact:true}).click();await page.locator('.rpg-cinematic').waitFor({state:'detached'})
    await page.getByRole('button',{name:'Tiếp tục trận',exact:true}).click()
    await mutate(page,'wave');await page.locator('.battle-status.phase-wave-clear').waitFor();await page.locator('.battle-status.phase-wave-enter').waitFor();await page.locator('.rpg-battle.presentation-fight').waitFor()
    await mutate(page,'win');await page.locator('.battle-status.phase-win').waitFor();await page.screenshot({path:`${out}/win-${width}.png`})
    checks.push({area:'viewport',viewport:[width,height],village,battleGeometry,pixelCharacters:7,starterCombatants:5,typographyStates:true,pauseAndSkip:true,exclusiveCinematicLayer:true})
    console.log('PASS viewport',width,height);await context.close()
  }
  const context=await browser.newContext({viewport:{width:1280,height:800}});page=await context.newPage();capture(page);await ready(page);await fixture(page)
  await page.locator('.rpg-battle.presentation-fight').waitFor()
  productionSeed=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))
  const ids=process.env.QUICK_PERF?[]:['com-tam','banh-mi','pho-bo','banh-cuon','goi-cuon-tom-thit']
  for(let i=0;i<ids.length;i++){
    await mutate(page,'refill');await page.locator('.rpg-burst-button').nth(i).click();await page.locator(`.rpg-cinematic-native[data-character="${ids[i]}"]`).waitFor()
    const phases=await page.evaluate(async()=>{const el=document.querySelector('.rpg-cinematic-native'),phases=new Set();await new Promise(resolve=>{const t=setInterval(()=>{if(!el.isConnected){clearInterval(t);resolve()}else phases.add(el.dataset.phase)},20)});return [...phases]})
    assert.deepEqual(phases,['preparation','casting','impact','finisher','recovery'])
    checks.push({area:'starter-ultimate',id:ids[i],phases})
  }
  await fixture(page,true,true);await page.locator('.rpg-battle.presentation-fight').waitFor()
  await page.locator('[data-character="xoi"][data-sheet="starter-xoi-pixel"].is-loaded').waitFor()
  await page.locator('.rpg-burst-button').first().click();await page.locator('.rpg-cinematic-native[data-character="xoi"]').waitFor()
  const xoiPhases=await page.evaluate(async()=>{const el=document.querySelector('.rpg-cinematic-native'),phases=new Set();await new Promise(resolve=>{const timer=setInterval(()=>{if(!el.isConnected){clearInterval(timer);resolve()}else phases.add(el.dataset.phase)},16)});return [...phases]})
  assert.deepEqual(xoiPhases,['preparation','casting','impact','finisher','recovery'])
  checks.push({area:'xoi-native-canon',phases:xoiPhases,pixelBattle:true})
  await mutate(page,'refill');await page.locator('.rpg-burst-button').first().click();await page.locator('.rpg-cinematic-native').waitFor()
  await page.waitForFunction(()=>document.querySelector('.rpg-cinematic-native')?.dataset.phase==='impact');await page.getByRole('button',{name:'Dừng hoạt ảnh',exact:true}).click();await page.screenshot({path:`${out}/xoi-ultimate.png`})
  const committed=await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');const s=useGameStore.getState().save.adventureRpg;return JSON.stringify({actors:s.run.battle.actors,resources:s.resources})})
  await page.reload();await page.locator('.rpg-cinematic-native').waitFor();await page.getByRole('button',{name:'Bỏ qua ›',exact:true}).click();await page.locator('.rpg-cinematic').waitFor({state:'detached'})
  assert.deepEqual(JSON.parse(await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');const s=useGameStore.getState().save.adventureRpg;return JSON.stringify({actors:s.run.battle.actors,resources:s.resources})})),JSON.parse(committed))
  checks.push({area:'reload-committed-cast',noDuplicateDamageOrRewards:true})
  const resumeAfterReload=page.getByRole('button',{name:'Tiếp tục trận',exact:true});if(await resumeAfterReload.isVisible())await resumeAfterReload.click();
  await mutate(page,'loss');await page.locator('.battle-status.phase-fail').waitFor()
  // Inventory-wide identity audit. Shared sheet rows are reported, not mistaken for unique models.
  const audit=await page.evaluate(async()=>{
    const {CARDS}=await import('/src/game/catalog.ts'),{tcgCharacter}=await import('/src/game/tcgCharacterMotion.ts'),{AUTO_UNITS,MONSTERS,MONSTER_MAP}=await import('/src/game/autochess/catalog.ts'),{unitCharacter,monsterCharacter}=await import('/src/infrastructure/assets/characterSprites.ts')
    const {RPG_MAPS}=await import('/src/game/adventureRpg/content.ts'),{encounterWaves}=await import('/src/game/adventureRpg/enemies.ts'),{SPIRIT_IDS,spiritArt}=await import('/src/game/adventureRpg/spiritArt.ts')
    const active=new Set(MONSTERS.map(m=>m.id));for(const map of RPG_MAPS)for(const wave of encounterWaves(map.school,30,4,{id:map.boss,name:map.bossName},false,1,map.id,'extreme'))for(const e of wave)active.add(e.id)
    const images=new Map(),hashes=new Map(),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    for(const id of SPIRIT_IDS){const art=spiritArt(id);let im=images.get(art.path);if(!im){im=new Image();im.src=art.path;await im.decode();images.set(art.path,im)}const grid=art.columns,col=art.cell%grid,row=Math.floor(art.cell/grid),x=Math.round(col*im.width/grid),y=Math.round(row*im.height/grid),w=Math.round((col+1)*im.width/grid)-x,h=Math.round((row+1)*im.height/grid)-y;canvas.width=w;canvas.height=h;ctx.drawImage(im,x,y,w,h,0,0,w,h);const digest=await crypto.subtle.digest('SHA-256',ctx.getImageData(0,0,w,h).data),hash=[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');hashes.set(hash,[...(hashes.get(hash)??[]),id])}
    const group=rows=>{const m=new Map();for(const row of rows){const key=`${row.sheet}:${row.row}`;m.set(key,[...(m.get(key)??[]),row.id])}return [...m].filter(([,ids])=>ids.length>1).map(([model,ids])=>({model,ids}))}
    return {portraitArtwork:{checked:SPIRIT_IDS.length,exactDuplicateGroups:[...hashes.values()].filter(ids=>ids.length>1)},monsters:{definitions:Object.keys(MONSTER_MAP).length,activeIds:[...active],activeSharedModels:group([...active].map(id=>monsterCharacter(id))),unusedDefinitions:Object.keys(MONSTER_MAP).filter(id=>!active.has(id)),classification:'Repeated instances of one enemy ID in multiple waves or roles are intentional. Unused compatibility definitions retain their old atlas references.'},tcgUnits:CARDS.filter(c=>c.kind==='unit').length,tcgSharedModels:group(CARDS.filter(c=>c.kind==='unit').map(c=>({...tcgCharacter(c),id:c.id}))),autoUnits:AUTO_UNITS.length,autoSharedModels:group(AUTO_UNITS.map(u=>unitCharacter(u.id))),monsterSharedModels:group(MONSTERS.map(m=>monsterCharacter(m.id))),artworkFallbacks:CARDS.filter(c=>c.kind==='unit'&&tcgCharacter(c)?.sheet.startsWith('portrait-')).map(c=>c.id)}
  })
  writeFileSync('dev/docs/web-v591/model-audit.json',JSON.stringify(audit,null,2)+'\n')
  await context.close()
  // Burst concurrency: video OFF, real casts, bounded queue, cleanup and sampled frame pacing.
  const loadContext=await browser.newContext({viewport:{width:1280,height:800}});page=await loadContext.newPage();capture(page);await ready(page);await fixture(page,false);await page.locator('.rpg-battle.presentation-fight').waitFor()
  const baseline=await page.evaluate(async()=>{const stamps=[],start=performance.now();await new Promise(resolve=>{const sample=now=>{stamps.push(now);if(now-start<3200)requestAnimationFrame(sample);else resolve()};requestAnimationFrame(sample)});return (stamps.length-1)*1000/(stamps.at(-1)-stamps[0])})
  const performanceReport=await page.evaluate(async()=>{
    const {useGameStore}=await import('/src/game/useGameStore.ts');const store=useGameStore.getState(),uids=store.save.adventureRpg.formation
    for(const uid of uids)store.rpgAction({type:'burst',uid})
    const stamps=[];let maxCues=0;const start=performance.now();await new Promise(resolve=>{const sample=now=>{stamps.push(now);maxCues=Math.max(maxCues,Number(document.querySelector('.rpg-vfx-canvas')?.dataset.active??0));if(now-start<3200)requestAnimationFrame(sample);else resolve()};requestAnimationFrame(sample)})
    const gaps=stamps.slice(1).map((s,i)=>s-stamps[i]).sort((a,b)=>a-b)
    return {fps:(stamps.length-1)*1000/(stamps.at(-1)-stamps[0]),p95Gap:gaps[Math.floor(gaps.length*.95)],maxCues,remainingCues:Number(document.querySelector('.rpg-vfx-canvas')?.dataset.active??0),battleSerial:useGameStore.getState().save.adventureRpg.run.battle.serial}
  })
  assert(performanceReport.fps>=baseline*.75,'Material frame pacing regression');assert(performanceReport.battleSerial>0);assert(performanceReport.maxCues<=12);assert.equal(performanceReport.remainingCues,0)
  checks.push({area:'five-consecutive-casts',baselineFps:baseline,ratioToBaseline:performanceReport.fps/baseline,...performanceReport})
  await loadContext.close()
  const autoContext=await browser.newContext({viewport:{width:1280,height:800}});page=await autoContext.newPage();capture(page);await page.goto(url+'/autochess')
  await page.evaluate(async()=>{
    const {newGame}=await import('/src/game/progression.ts'),{useGameStore}=await import('/src/game/useGameStore.ts'),{createAutoRun}=await import('/src/game/autochess/economy.ts'),{createCombat}=await import('/src/game/autochess/combat.ts'),{emptyAutoSave}=await import('/src/game/autochess/types.ts')
    const g=newGame(),r=createAutoRun('survival',42,'2026-10-16','qa590');r.xp=60;for(const p of r.roster)r.pool[p.id]++
    r.roster=['com-tam','banh-mi','pho-bo','banh-cuon','goi-cuon','xoi'].map((id,i)=>({uid:`p${i+1}`,id,star:1,cell:18+i,items:[]}));r.nextUid=7;for(const p of r.roster)r.pool[p.id]--
    r.combat=createCombat(r);for(const a of r.combat.actors){if(a.side==='enemy'){a.hp=a.maxHp=20000;a.attack=a.baseAttack=0}else a.mana=100}r.phase='combat';g.autoChess={...emptyAutoSave(),tutorialSeen:true,run:r}
    if(!useGameStore.getState().importSave(g))throw Error('Auto fixture rejected');useGameStore.getState().dismiss()
  })
  await page.locator('.ac-board canvas').waitFor();await page.getByRole('button',{name:'Tiếp tục chiến đấu →',exact:true}).click();await page.locator('.ac-pause-overlay').waitFor({state:'detached'});await page.waitForTimeout(900);await page.screenshot({path:`${out}/autochess-starters.png`})
  checks.push({area:'autochess-gameplay',sixPilotModels:true,sharedBoardSoloAndPvp:true});await autoContext.close()

  if(!process.env.QUICK_PERF){
    const tcg=await browser.newContext({viewport:{width:1280,height:800}});page=await tcg.newPage();capture(page);await page.goto(url+'/')
    await page.evaluate(async()=>{
      const {newGame}=await import('/src/game/progression.ts'),{startBattle}=await import('/src/game/battle.ts'),{useGameStore}=await import('/src/game/useGameStore.ts')
      const g=newGame(),b=startBattle(g.decks[0].cards,null,'courage',()=>.4,false)
      const unit=(id,uid)=>({uid,cardId:id,attack:2,health:10,maxHealth:10,shield:0,ready:true,keywords:[]})
      b.player.board=['com-tam','banh-mi','pho-bo','banh-cuon'].map((id,i)=>unit(id,`qa-p${i}`));b.enemy.board=['goi-cuon-tom-thit','xoi','classic-burger'].map((id,i)=>unit(id,`qa-e${i}`));g.battle=b
      if(!useGameStore.getState().importSave(g))throw Error('TCG fixture rejected');useGameStore.getState().dismiss()
    })
    await page.locator('.tcg-battle').waitFor();await page.locator('.tcg-battle [data-sheet^="starter-"].is-loaded').first().waitFor();await page.waitForFunction(()=>document.querySelectorAll('.tcg-battle [data-sheet^="starter-"].is-loaded').length===6)
    assert.equal(await page.locator('.tcg-battle [data-sheet^="portrait-"].is-loaded').count(),1)
    await page.screenshot({path:`${out}/tcg-identities.png`});await page.locator('[data-unit="qa-p0"]').click();await page.locator('[data-unit="qa-e0"]').click();assert.equal(await page.locator('.tcg-attack-manifest').count(),0)
    checks.push({area:'tcg-gameplay',sixPilotIdentities:true,unrelatedCardOwnArtwork:true,noStarterCloneOnAttack:true});await tcg.close()
    preview=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4191','--strictPort'],{stdio:'pipe'})
    for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:4191')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
    const production=await browser.newContext({viewport:{width:390,height:844}});await production.addInitScript(entries=>{for(const [key,value]of Object.entries(entries))localStorage.setItem(key,value)},productionSeed)
    page=await production.newPage();capture(page);await page.goto('http://127.0.0.1:4191/adventure');await page.locator('.rpg-battle.presentation-fight').waitFor();await page.locator('.rpg-arena [data-sheet$="-pixel"].is-loaded').first().waitFor()
    await page.locator('.rpg-burst-button').first().click();await page.locator('.rpg-cinematic-native').waitFor();await page.waitForFunction(()=>document.querySelector('.rpg-cinematic-native')?.dataset.phase==='impact');await page.getByRole('button',{name:'Dừng hoạt ảnh',exact:true}).click();await page.screenshot({path:`${out}/production-ultimate.png`})
    await page.getByRole('button',{name:'Bỏ qua ›',exact:true}).click();await page.locator('.rpg-cinematic').waitFor({state:'detached'});checks.push({area:'production-build',savedBattleHydrated:true,ownStarterAtlas:true,ultimatePauseSkip:true,viewport:[390,844]});await production.close()
  }
  assert.deepEqual(errors,[]);assert.deepEqual([...new Set(missing)],[])
  writeFileSync('dev/docs/web-v591/browser-qa.json',JSON.stringify({date:'2026-10-16',browser:'Chromium headless',checks,errors,missing},null,2)+'\n')
  console.log(JSON.stringify(checks))
  }
}catch(e){if(page&&!page.isClosed())console.error((await page.locator('body').innerText()).slice(-2200));console.error(errors,missing,log.slice(-1500));throw e}
finally{await browser?.close();server.kill();preview?.kill()}
