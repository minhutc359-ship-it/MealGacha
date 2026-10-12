import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {writeFileSync} from 'node:fs';
const server=spawn('pnpm',['dev','--host','127.0.0.1','--port','4185'],{stdio:'ignore'});process.on('exit',()=>server.kill());
for(let n=0;n<150;n++){try{await fetch('http://127.0.0.1:4185');break}catch{await new Promise(r=>setTimeout(r,100))}}
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR||'/tmp'}});
const checks=[];
for(const [width,height]of (process.env.QA_LANDSCAPE ? [[844,390]] : [[1440,900],[390,844],[844,390]])){
 const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.__visualMode='adventure';window.__impactDraws={adventure:0,tcg:0,auto:0,chest:0};
  const original=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(image,...values){
   if(image instanceof HTMLImageElement && image.src.includes('elemental-impacts-v441.webp'))window.__impactDraws[window.__visualMode]++;
   return original.call(this,image,...values);
  };
 });
 await page.goto('http://127.0.0.1:4185/adventure' ,{waitUntil:'domcontentloaded'});await page.locator('.adv-starter-grid button').first().click();
 await page.locator('.adv-world-viewport').waitFor();assert.equal(await page.locator('.adv-hero-atlas').count(),1);await page.evaluate(async()=>{const image=new Image();image.src='/assets/adventure/hero-v440.webp';await image.decode();if(image.naturalWidth!==1024)throw Error('hero atlas failed')});
 await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');useGameStore.setState(s=>({save:{...s.save,adventure:{...s.save.adventure,x:11,y:13}}}))});
 await page.waitForTimeout(180);await page.screenshot({path:`/tmp/web441-map-${width}.png`});
 assert.equal(await page.locator('.adv-npc-atlas[data-character="la"]').count(),1);
 const npcs=[];
 for(const [house,character] of [['shop','merchant'],['clinic','grandmother']]){
  await page.evaluate(async house=>{const {useGameStore}=await import('/src/game/useGameStore.ts');useGameStore.setState(s=>({save:{...s.save,adventure:{...s.save.adventure,mapId:`lantern-quarter:${house}`,x:5,y:4}}}))},house);
  await page.locator(`.adv-npc-atlas[data-character="${character}"]`).waitFor();
  npcs.push(character);
  if(width===390)await page.screenshot({path:`/tmp/web441-${house}.png`});
 }
 await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');useGameStore.setState(s=>({save:{...s.save,adventure:{...s.save.adventure,mapId:'lantern-quarter',x:11,y:13}}}))});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),false);
 await page.evaluate(async()=>{const {buildModeIntro,introAt}=await import('/src/game/modeIntro.ts');const {useGameStore}=await import('/src/game/useGameStore.ts');useGameStore.setState(s=>({save:{...s.save,adventure:structuredClone(introAt(buildModeIntro('adventure').frames,14000).scene.save)}}))});
 await page.locator('dialog.adv-battle').waitFor();await page.getByRole('button',{name:/Giữ mâm/}).click();await page.waitForTimeout(650);await page.screenshot({path:`/tmp/web441-battle-${width}.png`});
 assert.equal(await page.locator('.adv-battle').evaluate(el=>el.scrollHeight>el.clientHeight+1),false);
 assert.equal(await page.locator('.adv-elemental-effects').count(),1);assert.equal(await page.locator('.adv-battle-model .is-loaded').count(),2);
 const decoded=await page.evaluate(async()=>{
  const {ELEMENTAL_BOARDS,ELEMENTAL_IMPACTS}=await import('/src/game/visualPack.ts');const rows=[];
  for(const [key,src] of [...Object.entries(ELEMENTAL_BOARDS),['impacts',ELEMENTAL_IMPACTS],...['la','merchant','grandmother'].map(k=>[k,`/assets/adventure/${k}-v441.webp`])]){
   const image=new Image();image.src=src;await image.decode();rows.push({key,width:image.naturalWidth,height:image.naturalHeight});
  }return rows;
 });assert.equal(decoded.length,9);assert(decoded.every(r=>r.width>=1000));
 for(const [area,school] of Object.entries({'lantern-quarter':'hearth','rain-harbor':'tide','herb-garden':'grove','tide-pier':'ember','moon-table':'sugar'})){
  await page.evaluate(async area=>{const {useGameStore}=await import('/src/game/useGameStore.ts');useGameStore.setState(s=>({save:{...s.save,adventure:{...s.save.adventure,areaId:area}}}))},area);
  assert.equal(await page.locator('dialog .adv-battle-arena').getAttribute('data-scene'),school);
  assert((await page.locator('dialog .adv-battle-arena').evaluate(el=>getComputedStyle(el).backgroundImage)).includes(`${school}-v441.webp`));
  if(width===390&&school==='sugar')await page.screenshot({path:'/tmp/web441-moon.png'});
 }
 if(width===390){
  const atlas=await page.evaluate(async()=>{
   const {drawImpactTexture}=await import('/src/game/battleVfx.ts');const {ELEMENTAL_IMPACTS}=await import('/src/game/visualPack.ts');const image=new Image();image.src=ELEMENTAL_IMPACTS;await image.decode();
   const c=document.createElement('canvas');c.width=600;c.height=160;const ctx=c.getContext('2d');
   for(const [i,school] of ['ember','tide','grove','hearth','sugar'].entries())drawImpactTexture(ctx,{x:60+i*120,y:80},school,.25,40,image);
   const data=ctx.getImageData(0,0,600,160).data;return {alphaPixels:data.filter((x,i)=>i%4===3&&x>0).length,url:c.toDataURL()};
  });assert(atlas.alphaPixels>10000);writeFileSync('/tmp/web441-impact-strip.png',Buffer.from(atlas.url.split(',')[1],'base64'));checks.push({atlasPixels:atlas.alphaPixels});
 }
 const before=await page.evaluate(()=>localStorage.getItem('foodchest.tcg.v1'));
 await page.evaluate(async()=>{const {useAppStore}=await import('/src/store/useAppStore.ts');useAppStore.getState().updatePreference('graphicsQuality','low')});
 await page.waitForFunction(()=>document.body.classList.contains('presentation-light'));assert.equal(await page.locator('.scene-atmosphere').first().evaluate(el=>getComputedStyle(el).display),'none');
 await page.evaluate(async()=>{const {useAppStore}=await import('/src/store/useAppStore.ts');useAppStore.getState().updatePreference('graphicsQuality','normal')});
 await page.waitForFunction(()=>!document.body.classList.contains('presentation-light'));
 for(const mode of ['tcg','auto','adventure','chest']){
  await page.evaluate(async mode=>{window.__visualMode=mode;const {useModeIntroStore}=await import('/src/game/modeIntroState.ts');useModeIntroStore.getState().open(mode)},mode);
  await page.locator('.mode-live-demo').waitFor();await page.getByRole('button',{name:'Ẩn chú thích',exact:true}).click();await page.waitForTimeout(mode==='auto'?13000:mode==='adventure'?10500:2300);
  await page.screenshot({path:`/tmp/web441-${mode}-${width}.png`});
  assert.equal(await page.locator('.live-demo-scene').evaluate(el=>el.scrollHeight>el.clientHeight+1),false,`${mode} ${width} overflow`);
  if(mode==='auto'){const r=await page.locator('.ac-arena').boundingBox();assert(r.height>100);assert((await page.locator('.mode-live-demo .ac-board').evaluate(el=>getComputedStyle(el).backgroundImage)).includes('-v441.webp'))}
  if(mode==='tcg')assert((await page.locator('.mode-live-demo .tcg-board-art').evaluate(el=>getComputedStyle(el).backgroundImage)).includes('-v441.webp'))
  await page.getByRole('button',{name:'Đóng giới thiệu',exact:true}).click();
 }
 assert.equal(await page.evaluate(()=>localStorage.getItem('foodchest.tcg.v1')),before,'presentation mutated game save');assert.deepEqual(errors,[]);
 const impactDraws=await page.evaluate(()=>window.__impactDraws);
 checks.push({impactDraws,width,height,viewport:true,newBackdropDecoded:true,sharedSprites:true,lowQuality:true,allDemos:true,savePreserved:true,decoded,npcs,errors});
 await context.close();
}
for(const mode of ['adventure','tcg','auto'])assert(checks.reduce((n,row)=>n+(row.impactDraws?.[mode]??0),0)>0,`${mode} never drew the shared texture`);
console.log(JSON.stringify(checks,null,2));writeFileSync('/tmp/web441-results.json',JSON.stringify(checks,null,2));await browser.close();server.kill();
