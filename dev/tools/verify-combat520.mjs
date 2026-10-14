import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdirSync,writeFileSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),out=path.join(root,'dev/docs/web-v520')
mkdirSync(out,{recursive:true})
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const port=4200,url=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','dev/tools/vite.pvp-qa.config.ts','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'pipe'})
let log='',browser,page;server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b)
const reports=[]
try{
  for(let i=0;i<100;i++){try{await fetch(url);break}catch{await new Promise(r=>setTimeout(r,100))}}
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN,headless:true,env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR??process.env.LD_LIBRARY_PATH},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
  for(const [width,height] of [[1440,900],[390,844],[844,390],[320,568],[390,700]]){
    const context=await browser.newContext({viewport:{width,height}});page=await context.newPage();const errors=[],missing=[]
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/assets/')&&r.status()>=400)missing.push(r.url())})
    await page.goto(`${url}/adventure`);await page.locator('.rpg-stage-node').first().waitFor()
    await page.evaluate(async()=>{
      const {newGame}=await import('/src/game/progression.ts'),{newRpgSave,reduceRpg,createRpgBattle}=await import('/src/game/adventureRpg/engine.ts'),{useGameStore}=await import('/src/game/useGameStore.ts')
      const g=newGame();g.cards['chef-lien']=1;g.adventureRpg=newRpgSave(g)
      g.adventureRpg.formation[4]=g.adventureRpg.roster.find(h=>h.cardId==='chef-lien').uid
      for(const h of g.adventureRpg.roster){h.level=35;h.skills=[6,6,6,6];h.gear=[3,3,2];h.rank=3}
      for(const map of ['lantern','harbor','garden'])for(let i=1;i<=6;i++)g.adventureRpg.stars[`${map}-${i}`]=1
      for(let i=1;i<=5;i++)g.adventureRpg.stars[`tide-${i}`]=1
      g.adventureRpg=reduceRpg(g.adventureRpg,{type:'start',stageId:'tide-6'},g).save
      g.adventureRpg.run.battle=createRpgBattle(g.adventureRpg,g.adventureRpg.run.battle.waves.slice(-1),'qa520')
      for(const a of g.adventureRpg.run.battle.actors){a.energy=100;a.nextAttack=a.nextSkill=a.nextSupport=1000;if(a.side==='ally')a.hp=Math.floor(a.maxHp*.6)}
      if(!useGameStore.getState().importSave(g))throw Error('Fixture rejected');useGameStore.getState().dismiss()
    })
    await page.locator('.rpg-arena').waitFor();await page.waitForTimeout(1200)
    await page.evaluate(()=>{window.__nodes=[...document.querySelectorAll('.rpg-arena canvas')];window.__writes=0;window.__observer=new MutationObserver(list=>window.__writes+=list.length);for(const n of window.__nodes)window.__observer.observe(n,{attributes:true,attributeFilter:['width','height']})})
    const geometry=await page.evaluate(()=>{
      const arena=document.querySelector('.rpg-arena').getBoundingClientRect(),hud=document.querySelector('.rpg-arena-hud').getBoundingClientRect()
      return {arena:{x:arena.x,y:arena.y,width:arena.width,height:arena.height},hudBottom:hud.bottom,actors:[...document.querySelectorAll('.rpg-combatant')].map(n=>{const r=n.getBoundingClientRect(),c=n.querySelector('.rpg-actor-caption').getBoundingClientRect();return {uid:n.dataset.uid,x:r.x,y:r.y,right:r.right,bottom:c.bottom}})}
    })
    assert(geometry.hudBottom<=geometry.arena.y+1)
    for(const a of geometry.actors){assert(a.x>=geometry.arena.x-1&&a.right<=geometry.arena.x+geometry.arena.width+1,JSON.stringify(a));assert(a.y>=geometry.arena.y+geometry.arena.height*.25,JSON.stringify(a));assert(a.bottom<=geometry.arena.y+geometry.arena.height+1,JSON.stringify(a))}
    await page.locator('.rpg-focus').nth(3).click()
    await page.locator('.rpg-burst-button').nth(0).click();await page.waitForTimeout(180)
    await page.screenshot({path:path.join(out,`guardian-${width}x${height}.jpg`),quality:85})
    await page.locator('.rpg-burst-button').nth(1).click();await page.waitForTimeout(180)
    await page.screenshot({path:path.join(out,`striker-${width}x${height}.jpg`),quality:85})
    await page.locator('.rpg-burst-button').nth(2).click();await page.locator('.rpg-burst-button').nth(3).click()
    await page.locator('.rpg-burst-button').nth(4).click();await page.waitForTimeout(200)
    await page.screenshot({path:path.join(out,`trickster-${width}x${height}.jpg`),quality:85})
    await page.waitForTimeout(400)
    assert(Number(await page.locator('.rpg-vfx-canvas').getAttribute('data-active'))>0)
    const canvas=await page.evaluate(()=>{window.__observer.disconnect();return {kept:window.__nodes.every(n=>n.isConnected),resizeWrites:window.__writes}})
    assert(canvas.kept);assert.equal(canvas.resizeWrites,0)
    await page.getByRole('button',{name:'Tạm dừng trận',exact:true}).click()
    const paused=await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');return structuredClone(useGameStore.getState().save)})
    await page.reload();await page.locator('.rpg-arena').waitFor()
    const reloaded=await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');return useGameStore.getState().save})
    assert.deepEqual(reloaded.adventureRpg.run.battle,paused.adventureRpg.run.battle)
    await page.screenshot({path:path.join(out,`arena-${width}x${height}.jpg`),quality:85})
    for(const button of await page.locator('.rpg-burst-button').all()){const box=await button.boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1)}
    await page.getByRole('button',{name:'Tiếp tục trận',exact:true}).click()
    await page.evaluate(async()=>{
      const {useGameStore}=await import('/src/game/useGameStore.ts');const g=structuredClone(useGameStore.getState().save),b=g.adventureRpg.run.battle
      for(const a of b.actors){a.nextAttack=b.tick+1;a.nextSkill=b.tick+40;a.nextSupport=b.tick+40}
      useGameStore.getState().importSave(g);useGameStore.getState().dismiss()
    })
    await page.waitForTimeout(600)
    const attack=await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');return useGameStore.getState().save.adventureRpg.run.battle.events.some(e=>e.animation==='attack')})
    assert(attack);assert.equal(await page.locator('.rpg-spell-fx').count(),0)
    await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.rpg-vfx-canvas').isVisible(),false)
    let dungeonEntry=null
    if(width===390&&height===700){
      await page.getByRole('button',{name:'Rút lui',exact:true}).click()
      await page.getByRole('dialog',{name:'Rút khỏi chuyến đi',exact:true}).getByRole('button',{name:'Rút lui',exact:true}).click()
      await page.getByRole('button',{name:'Dungeon',exact:true}).click();await page.locator('.rpg-section-title select').selectOption('3')
      const account=await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');const g=useGameStore.getState().save;return {coins:g.coins,cards:g.cards,adventure:g.adventure,resources:g.adventureRpg.resources}})
      await page.locator('.rpg-dungeon-grid article').first().getByRole('button',{name:'Vào dungeon →',exact:true}).click()
      await page.getByRole('button',{name:'Tạm dừng trận',exact:true}).click();await page.reload();await page.locator('.rpg-arena').waitFor()
      const started=await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');return useGameStore.getState().save})
      assert.deepEqual({coins:started.coins,cards:started.cards,adventure:started.adventure,resources:started.adventureRpg.resources},account)
      dungeonEntry=started.adventureRpg.run.dungeon.scaling;assert.deepEqual(dungeonEntry,{average:35,baseLevel:38})
      assert.equal(started.adventureRpg.run.battle.rulesVersion,520);assert(started.adventureRpg.run.battle.actors.filter(a=>a.side==='enemy').every(a=>a.level===38))
    }
    assert.deepEqual(errors,[]);assert.deepEqual(missing,[])
    reports.push({viewport:[width,height],geometry,actorsFit:true,hudSeparate:true,manualBursts:['guardian','striker','mage','healer','trickster'],canvas,pauseReloadExact:true,ordinaryAttackCue:true,noStretchedSvg:true,controlsFit:true,reducedMotion:true,dungeonEntry,errors,missing});console.log(JSON.stringify({viewport:[width,height],pass:true}))
    await context.close()
  }
  writeFileSync(path.join(out,'browser-qa.json'),JSON.stringify({version:'5.2.0',engine:'Chromium / SwiftShader, not device FPS',reports},null,2)+'\n')
}catch(e){console.error(log.slice(-2000));if(page)console.error((await page.locator('body').innerText()).slice(0,2000));throw e}
finally{await browser?.close();server.kill()}
