import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {writeFileSync} from 'node:fs';
const server=spawn('pnpm',['dev','--host','127.0.0.1','--port','4184'],{stdio:'ignore'});process.on('exit',()=>server.kill());
for(let n=0;n<150;n++){try{await fetch('http://127.0.0.1:4184');break}catch{await new Promise(r=>setTimeout(r,100))}}
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR||'/tmp'}});
const checks=[];
for(const [width,height]of (process.env.QA_LANDSCAPE ? [[844,390]] : [[1440,900],[390,844],[844,390]])){
 const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4184/adventure',{waitUntil:'domcontentloaded'});await page.locator('.adv-starter-grid button').first().click();
 await page.locator('.adv-world-viewport').waitFor();assert.equal(await page.locator('.adv-hero-atlas').count(),1);await page.evaluate(async()=>{const image=new Image();image.src='/assets/adventure/hero-v440.webp';await image.decode();if(image.naturalWidth!==1024)throw Error('hero atlas failed')});await page.screenshot({path:`/tmp/web440-map-${width}.png`});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),false);
 await page.evaluate(async()=>{const {buildModeIntro,introAt}=await import('/src/game/modeIntro.ts');const {useGameStore}=await import('/src/game/useGameStore.ts');useGameStore.setState(s=>({save:{...s.save,adventure:structuredClone(introAt(buildModeIntro('adventure').frames,14000).scene.save)}}))});
 await page.locator('dialog.adv-battle').waitFor();await page.getByRole('button',{name:/Giữ mâm/}).click();await page.waitForTimeout(650);await page.screenshot({path:`/tmp/web440-battle-${width}.png`});
 assert.equal(await page.locator('.adv-battle').evaluate(el=>el.scrollHeight>el.clientHeight+1),false);
 assert.equal(await page.locator('.adv-elemental-effects').count(),1);assert.equal(await page.locator('.adv-battle-model .is-loaded').count(),2);
 assert.equal(await page.evaluate(async()=>{const image=new Image();image.src='/assets/tcg/boards/courtyard-v440.webp';await image.decode();return image.naturalWidth}),1536);
 const before=await page.evaluate(()=>localStorage.getItem('foodchest.tcg.v1'));
 await page.evaluate(async()=>{const {useAppStore}=await import('/src/store/useAppStore.ts');useAppStore.getState().updatePreference('graphicsQuality','low')});
 await page.waitForFunction(()=>document.body.classList.contains('presentation-light'));assert.equal(await page.locator('.scene-atmosphere').first().evaluate(el=>getComputedStyle(el).display),'none');
 await page.evaluate(async()=>{const {useAppStore}=await import('/src/store/useAppStore.ts');useAppStore.getState().updatePreference('graphicsQuality','normal')});
 await page.waitForFunction(()=>!document.body.classList.contains('presentation-light'));
 for(const mode of ['tcg','auto','adventure','chest']){
  await page.evaluate(async mode=>{const {useModeIntroStore}=await import('/src/game/modeIntroState.ts');useModeIntroStore.getState().open(mode)},mode);
  await page.locator('.mode-live-demo').waitFor();await page.getByRole('button',{name:'Ẩn chú thích',exact:true}).click();await page.waitForTimeout(mode==='auto'?13000:mode==='adventure'?10500:2300);
  await page.screenshot({path:`/tmp/web440-${mode}-${width}.png`});
  assert.equal(await page.locator('.live-demo-scene').evaluate(el=>el.scrollHeight>el.clientHeight+1),false,`${mode} ${width} overflow`);
  if(mode==='auto'){const r=await page.locator('.ac-arena').boundingBox();assert(r.height>100)}
  await page.getByRole('button',{name:'Đóng giới thiệu',exact:true}).click();
 }
 assert.equal(await page.evaluate(()=>localStorage.getItem('foodchest.tcg.v1')),before,'presentation mutated game save');assert.deepEqual(errors,[]);
 checks.push({width,height,viewport:true,newBackdropDecoded:true,sharedSprites:true,lowQuality:true,allDemos:true,savePreserved:true,errors});
 if(width===390){
  const audio=await page.evaluate(async()=>{
   const {GameAudioEngine}=await import('/src/infrastructure/audio/gameAudio.ts');const off=new OfflineAudioContext(2,48000*3,48000);
   const context=new Proxy(off,{get(t,k){if(k==='state')return'running';if(k==='resume'||k==='close')return async()=>{};const v=Reflect.get(t,k,t);return typeof v==='function'?v.bind(t):v}});
   const engine=new GameAudioEngine({context:()=>context,load:async()=>new ArrayBuffer(0),visible:()=>true});const unmount=engine.mount();engine.configure({soundEnabled:true,effectsVolume:1,ambienceVolume:0});await engine.unlock();
   for(const cue of ['fire','water','leaves','sparkle','impact','combo','summon','shield','break','capture','door','footstep','auto-boss'])engine.play(cue);
   const rendered=await off.startRendering();let peak=0,sum=0;const values=rendered.getChannelData(0);for(const x of values){peak=Math.max(peak,Math.abs(x));sum+=x*x}unmount();return{peak,rms:Math.sqrt(sum/values.length),finite:values.every(Number.isFinite)};
  });assert(audio.finite);assert(audio.peak<1);assert(audio.rms>.005);checks.push({offlineMixedAudio:audio});
  const fps=await page.evaluate(async()=>{
   const {subscribeCharacterClock}=await import('/src/infrastructure/assets/characterSprites.ts');let ticks=0;const start=performance.now();const release=subscribeCharacterClock(()=>ticks++,true);await new Promise(r=>setTimeout(r,2000));release();return{fps:ticks*1000/(performance.now()-start),durationMs:performance.now()-start};
  });assert(fps.fps>=25);checks.push({sharedAnimationClock:fps});
 }
 await context.close();
}
console.log(JSON.stringify(checks,null,2));writeFileSync('/tmp/web440-results.json',JSON.stringify(checks,null,2));await browser.close();server.kill();
