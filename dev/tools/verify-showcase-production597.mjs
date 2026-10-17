import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdirSync,writeFileSync} from 'node:fs'
const{chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const out='dev/docs/web-v597',errors=[],missing=[],requests=[];mkdirSync(out+'/qa',{recursive:true})
const servers=[]
async function serve(port,preview=false){const child=spawn(process.execPath,['node_modules/vite/bin/vite.js',...(preview?['preview']:['--config','dev/tools/vite.pvp-qa.config.ts']),'--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'pipe'});servers.push(child);let log='';child.stdout.on('data',v=>log+=v);child.stderr.on('data',v=>log+=v);for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}`)).ok)return}catch{}if(i===99)throw Error(log);await new Promise(r=>setTimeout(r,100))}}
const b=await chromium.launch({executablePath:process.env.CHROMIUM_BIN,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR??process.env.LD_LIBRARY_PATH,FONTCONFIG_PATH:'/etc/fonts'}})
try{
 await serve(4199)
 const seedContext=await b.newContext(),sp=await seedContext.newPage();await sp.goto('http://127.0.0.1:4199/adventure')
 const seed=await sp.evaluate(async()=>{const{newGame}=await import('/src/game/progression.ts'),{newRpgSave,reduceRpg}=await import('/src/game/adventureRpg/engine.ts'),{useGameStore}=await import('/src/game/useGameStore.ts');const g=newGame(),s=newRpgSave(g);s.roster[0].cardId='pho-ga';g.adventureRpg=reduceRpg(s,{type:'start',stageId:'lantern-1'},g).save;const battle=g.adventureRpg.run.battle;battle.auto=false;for(const a of battle.actors){a.nextAttack=a.nextSkill=a.nextSupport=10000;a.energy=100;if(a.side==='enemy')a.hp=a.maxHp=50000}if(!useGameStore.getState().importSave(g))throw Error('Seed rejected');useGameStore.getState().dismiss();useGameStore.getState().rpgAction({type:'burst',uid:battle.actors[0].uid});useGameStore.getState().rpgAction({type:'pause'});return Object.fromEntries(Object.entries(localStorage))})
 await seedContext.close();servers[0].kill()
 await serve(4200,true)
 const c=await b.newContext({viewport:{width:390,height:844}});await c.addInitScript(entries=>{for(const[k,v]of Object.entries(entries))localStorage.setItem(k,v)},seed)
 const p=await c.newPage();p.on('console',m=>{if(m.type()==='error')console.log('console',m.text())});p.on('requestfailed',r=>console.log('requestfailed',r.url(),r.failure()));p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)missing.push([r.url(),r.status()])});p.on('request',r=>requests.push(new URL(r.url()).pathname))
 await p.goto('http://127.0.0.1:4200/adventure');await p.locator('.ultimate-banner[data-showcase="pho-ga"]').waitFor();await p.waitForFunction(()=>!!navigator.serviceWorker.controller)
 const banner=await p.locator('.ultimate-banner').textContent();assert.match(banner,/Tuyệt|TUYỆT/);assert.equal(await p.locator('video').count(),0)
 const before=await p.locator('.rpg-showcase-progress').getAttribute('style');await p.waitForTimeout(150);assert.equal(await p.locator('.rpg-showcase-progress').getAttribute('style'),before)
 await p.getByRole('button',{name:'Tiếp hoạt ảnh',exact:true}).click();await p.waitForTimeout(1050);await p.getByRole('button',{name:'Dừng hoạt ảnh',exact:true}).click();await p.screenshot({path:`${out}/qa/production.png`})
 await p.getByRole('button',{name:'Bỏ qua ›',exact:true}).click();await p.locator('.rpg-showcase').waitFor({state:'detached'});assert.equal(await p.locator('video').count(),0)
 // Previously visited art/code stays available without a movie network path.
 const staticAssetVary=await p.evaluate(async()=>{const key=(await caches.keys()).find(k=>k.startsWith('som-web-core-'));const cache=await caches.open(key);const requests=await cache.keys();const request=requests.find(r=>r.url.endsWith('.js'));return(await cache.match(request))?.headers.get('Vary')});await p.waitForLoadState('networkidle');await c.setOffline(true);await p.reload();await p.locator('.rpg-burst-deck').waitFor({timeout:10000}).catch(async e=>{await p.screenshot({path:`${out}/qa/offline-failure.png`});console.log('offline body',await p.locator('body').innerText());console.log('errors',errors,'missing',missing);console.log('html',(await p.content()).slice(0,1000),'url',p.url());throw e});assert.equal(await p.locator('video').count(),0)
 assert(!requests.some(p=>p.endsWith('.mp4')));assert.deepEqual(errors,[]);assert.deepEqual(missing,[])
 writeFileSync(out+'/production-qa.json',JSON.stringify({date:'2026-10-17',staticAssetVary,savedLegacyTransactionHydrated:true,formerVideoHero:'pho-ga',pauseSkip:true,offlineReload:true,banner,errors,missing,movieRequests:0},null,2)+'\n');console.log(JSON.stringify({production:true,offlineReload:true,errors,missing,movies:0}));await c.close()
}finally{await b.close();for(const s of servers)s.kill()}
