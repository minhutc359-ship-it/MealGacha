import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdirSync,writeFileSync} from 'node:fs'
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const qaIds=process.env.QA_IDS?JSON.parse(process.env.QA_IDS):['com-tam','banh-mi','pho-bo','bun-rieu','banh-cuon'];assert.equal(qaIds.length,5)
const autoIds=process.env.QA_AUTO_IDS?JSON.parse(process.env.QA_AUTO_IDS):qaIds;assert.equal(autoIds.length,5)
const assetRoot=process.env.QA_ASSET_ROOT??'regional5910'
const url='http://127.0.0.1:4198',out=process.env.QA_OUT??'dev/docs/web-v597',checks=[],errors=[],missing=[],requests=[];mkdirSync(out,{recursive:true})
const captureOut=process.env.QA_CAPTURE_DIR??'.asset-work/qa/showcase-modes';mkdirSync(captureOut,{recursive:true})
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','dev/tools/vite.pvp-qa.config.ts','--host','127.0.0.1','--port','4198','--strictPort'],{stdio:'pipe'})
let log='';server.stdout.on('data',v=>log+=v);server.stderr.on('data',v=>log+=v)
for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break}catch{}if(i===99)throw Error(log);await new Promise(r=>setTimeout(r,100))}
const b=await (process.env.QA_ENGINE==='webkit'?webkit:chromium).launch(process.env.QA_ENGINE==='webkit'?{headless:true,executablePath:process.env.WEBKIT_BIN}:{executablePath:process.env.CHROMIUM_BIN,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR??process.env.LD_LIBRARY_PATH,FONTCONFIG_PATH:'/etc/fonts'}})
function capture(p){p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)missing.push([r.url(),r.status()])});p.on('request',r=>requests.push(new URL(r.url()).pathname))}
async function dismiss(p){const button=p.getByRole('button',{name:'Tắt thông báo',exact:true});if(await button.isVisible())await button.click()}
try{
 for(const viewport of [{width:390,height:844},{width:1280,height:800}]){
  const c=await b.newContext({viewport}),p=await c.newPage();capture(p);await p.goto(url+'/autochess');await dismiss(p)
  await p.evaluate(async ids=>{const{newGame}=await import('/src/game/progression.ts'),{useGameStore}=await import('/src/game/useGameStore.ts'),{createAutoRun}=await import('/src/game/autochess/economy.ts'),{createCombat}=await import('/src/game/autochess/combat.ts'),{emptyAutoSave}=await import('/src/game/autochess/types.ts');const g=newGame(),r=createAutoRun('survival',42,'2026-10-17','qa597');r.xp=60;for(const p of r.roster)r.pool[p.id]++;r.roster=ids.map((id,i)=>({uid:`p${i+1}`,id,star:1,cell:18+i,items:[]}));r.nextUid=6;for(const p of r.roster)r.pool[p.id]--;r.combat=createCombat(r);for(const a of r.combat.actors){if(a.side==='enemy'){a.hp=a.maxHp=20000;a.attack=a.baseAttack=0}else a.mana=100}r.phase='combat';g.autoChess={...emptyAutoSave(),tutorialSeen:true,run:r};if(!useGameStore.getState().importSave(g))throw Error('Auto fixture rejected');useGameStore.getState().dismiss()},autoIds)
  await p.getByRole('button',{name:'Tiếp tục chiến đấu →',exact:true}).click();await p.locator('.auto-cast-showcase .ultimate-banner').waitFor({timeout:15000});await p.waitForTimeout(260);await p.screenshot({path:`${captureOut}/autochess-${viewport.width}.png`});const rect=await p.locator('.auto-cast-showcase').evaluate(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right}});assert(rect.left>=0&&rect.right<=viewport.width+1)
  if(process.env.QA_IDS){
   let actors=[];for(let attempt=0;attempt<40;attempt++){actors=await p.evaluate(async()=>{const{useGameStore}=await import('/src/game/useGameStore.ts');return useGameStore.getState().save.autoChess.run.combat.actors.filter(a=>a.side==='ally').map(a=>({id:a.id,casts:a.casts}))});if(actors.every(a=>a.casts>0))break;await p.waitForTimeout(100)}
   assert(autoIds.every(id=>actors.some(a=>a.id===id&&a.casts>0)),JSON.stringify(actors));
  }
  checks.push({area:'autochess',viewport,liveCast:true,sharedBanner:true,ids:autoIds});await c.close()
 }
 const c=await b.newContext({viewport:{width:1280,height:800}}),p=await c.newPage();capture(p);await p.goto(url+'/');await dismiss(p)
 const spell=await p.evaluate(async ids=>{const{newGame}=await import('/src/game/progression.ts'),{startBattle}=await import('/src/game/battle.ts'),{useGameStore}=await import('/src/game/useGameStore.ts'),{CARDS}=await import('/src/game/catalog.ts');const g=newGame(),b=startBattle(g.decks[0].cards,null,'courage',()=>.4,false);const card=CARDS.find(c=>c.kind==='spell'&&c.effect==='draw');b.player.mana=b.player.maxMana=7;b.player.hand=[card.id];b.enemy.board=[];if(ids){const unit=(cardId,i)=>({uid:`regional${i}`,cardId,attack:2,health:100,maxHealth:100,shield:0,ready:true,keywords:[]});b.player.board=ids.slice(0,2).map(unit);b.enemy.board=ids.slice(2,4).map((id,i)=>unit(id,i+2))}g.battle=b;if(!useGameStore.getState().importSave(g))throw Error('TCG fixture rejected');useGameStore.getState().dismiss();return {id:card.id,name:card.name}},process.env.QA_IDS?qaIds:null)
 if(process.env.QA_IDS){
  for(const id of qaIds.slice(0,4))await p.locator(`[data-character="${id}"][data-sheet="starter-${id}"].is-loaded`).waitFor();
  await p.locator('.tcg-unit').filter({has:p.locator(`[data-character="${qaIds[0]}"]`)}).click();await p.locator('.tcg-unit').filter({has:p.locator(`[data-character="${qaIds[2]}"]`)}).click();
  await p.locator(`.tcg-unit [data-character="${qaIds[0]}"][data-motion="attack"]`).waitFor();await p.waitForTimeout(600);
  const result=await p.evaluate(async()=>{const{useGameStore}=await import('/src/game/useGameStore.ts');return useGameStore.getState().save.battle});assert.equal(result.enemy.board[0].health,98);assert.equal(result.player.board[0].ready,false);
  await p.screenshot({path:`${captureOut}/tcg-regional-attack.png`});await p.waitForTimeout(700);
 }
 await p.locator('.tcg-hand button').first().click();await p.screenshot({path:`${captureOut}/tcg-selected.png`})
 const dock=p.locator('.tcg-command-dock');
 await dock.getByRole('button',{name:/Thi triển|Dùng phép|Sử dụng|Xác nhận|Triệu hồi/}).first().click()
 await p.waitForFunction(()=>!!document.querySelector('.tcg-spell-banner .ultimate-banner')&&document.querySelectorAll('.model-cast-effect').length===1);await p.screenshot({path:`${captureOut}/tcg-spell.png`});checks.push({area:'tcg',spell,sharedBanner:true,modelSigil:true,ids:process.env.QA_IDS?qaIds.slice(0,4):undefined,realUnitAttack:!!process.env.QA_IDS});
 const manifest=await p.evaluate(async()=>{const{SPIRIT_IDS,spiritArt}=await import('/src/game/adventureRpg/spiritArt.ts'),{CARD_MAP}=await import('/src/game/catalog.ts'),{ultimateShowcase}=await import('/src/game/ultimateShowcase.ts'),{ultimateIdentity}=await import('/src/game/adventureRpg/ultimateArt.ts');return SPIRIT_IDS.map(id=>({id,name:CARD_MAP[id].name,school:CARD_MAP[id].school,...ultimateShowcase(id),portrait:spiritArt(id),cast:'school-sigil',impact:ultimateIdentity(id).pattern,sound:`/assets/rpg/awakening530/sounds/${id}.mp3`}))});if(!process.env.QA_OUT)writeFileSync(out+'/showcase-manifest.json',JSON.stringify(manifest,null,2)+'\n');await c.close()
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);assert(!requests.some(p=>p.endsWith('.mp4')))
 writeFileSync(out+'/modes-qa.json',JSON.stringify({date:new Date().toISOString().slice(0,10),engine:process.env.QA_ENGINE??'chromium',version:b.version(),checks,errors,missing,movieRequests:0,requestedAssets:[...new Set(requests.filter(p=>p.includes(`/${assetRoot}/`)))]},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,errors,missing}))
}finally{await b.close();server.kill()}
