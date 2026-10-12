import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const server=spawn('pnpm',['dev','--host','127.0.0.1','--port','4183'],{stdio:'ignore'});
process.on('exit',()=>server.kill());
for(let n=0;n<80;n++){try{await fetch('http://127.0.0.1:4183');break}catch{await new Promise(r=>setTimeout(r,100))}}
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox'],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR||process.env.LD_LIBRARY_PATH||'/tmp'}});
const checks=[];
for(const [width,height] of (process.env.QA_FAST ? [] : [[1440,900],[390,844],[320,568],[844,390]])){
 const context=await browser.newContext({viewport:{width,height}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')console.log(m.text())});
 await page.goto('http://127.0.0.1:4183/adventure',{waitUntil:'domcontentloaded'});await page.locator('.adv-starter-grid button').first().click();await page.locator('.adv-world-viewport').waitFor();
 const bounds=await page.locator('.adv-controls').boundingBox();assert(bounds.y+bounds.height<=height+1,`controls offscreen ${width}`);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),false,'document scroll');
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('foodchest.tcg.v1')).adventure.steps);
 await page.getByRole('button',{name:'Đi lên',exact:true}).click();
 await page.getByRole('button',{name:'Đội hình & túi đồ',exact:true}).click();await page.locator('.adv-panel-dialog').waitFor();
 const position=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('foodchest.tcg.v1')).adventure));await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('foodchest.tcg.v1')).adventure)),position);
 await page.keyboard.press('Escape');assert.equal(await page.locator('.adv-panel-dialog').count(),0);
 await page.getByRole('button',{name:'Hướng dẫn',exact:true}).click();await page.getByRole('button',{name:/Giới thiệu/}).click();await page.locator('.mode-live-demo').waitFor({timeout:7000}).catch(async e=>{console.log(errors);await page.screenshot({path:'/tmp/web433-error.png'});throw e});
 const saved=await page.evaluate(()=>localStorage.getItem('foodchest.tcg.v1'));
 await page.getByRole('button',{name:'Ẩn chú thích',exact:true}).click();assert.equal(await page.locator('.mode-live-demo').evaluate(el=>getComputedStyle(el).getPropertyValue('--demo-toolbar-height').trim()),'0px');
 await page.waitForTimeout(9500);await page.locator('.adv-battle-arena').waitFor();const arena=await page.locator('.adv-battle-arena').boundingBox();assert(arena.height>=80,`small arena ${width}`);
 assert.equal(await page.locator('.live-demo-scene').evaluate(el=>el.scrollHeight>el.clientHeight+1),false,'demo scroll');
 assert(await page.locator('.adv-battle-model canvas').count()===2,'shared sprites');
 await page.screenshot({path:`/tmp/web433-${width}.png`});
 await page.getByRole('button',{name:'Hiện chú thích',exact:true}).click();await page.getByRole('button',{name:'Đóng giới thiệu',exact:true}).click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('foodchest.tcg.v1')),saved,'demo mutated save');assert.deepEqual(errors,[]);
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('.adv-world-viewport').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('foodchest.tcg.v1')),saved,'reload mutated save');
 checks.push({width,height,controlsFit:true,dialogKeyboardIsolated:true,immersiveDemoFit:true,sharedSprites:true,savePreserved:true});await context.close();
}
// Verify the real action/store/render boundary using an isolated keeper battle fixture.
const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();const faults=[];page.on('pageerror',e=>faults.push(e.message));
await page.goto('http://127.0.0.1:4183/adventure',{waitUntil:'domcontentloaded'});await page.locator('.adv-starter-grid button').first().click();
const right=await page.getByRole('button',{name:'Đi phải',exact:true}).boundingBox();
const initialX=await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');return useGameStore.getState().save.adventure.x});
await page.mouse.move(right.x+right.width/2,right.y+right.height/2);await page.mouse.down();await page.waitForTimeout(550);await page.mouse.up();
const stoppedX=await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');return useGameStore.getState().save.adventure.x});assert(stoppedX>initialX+1,'hold did not repeat');await page.waitForTimeout(220);assert.equal(await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');return useGameStore.getState().save.adventure.x}),stoppedX,'movement continued after release');
await page.screenshot({path:'/tmp/web433-world.png'});
await page.evaluate(async()=>{const {buildModeIntro,introAt}=await import('/src/game/modeIntro.ts');const {useGameStore}=await import('/src/game/useGameStore.ts');const fixture=structuredClone(introAt(buildModeIntro('adventure').frames,14000).scene.save);useGameStore.setState(state=>({save:{...state.save,adventure:fixture}}))});
await page.locator('dialog.adv-battle').waitFor();const turn=await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');return useGameStore.getState().save.adventure.encounter.turn});
await page.getByRole('button',{name:/Giữ mâm/}).click();await page.waitForTimeout(750);
assert.equal(await page.evaluate(async()=>{const {useGameStore}=await import('/src/game/useGameStore.ts');return useGameStore.getState().save.adventure.encounter.turn}),turn+1);
assert.equal(await page.locator('.adv-battle-model .tcg-character-sprite.is-loaded').count(),2);
await page.getByRole('button',{name:'Đổi Vị Linh',exact:true}).click();assert(await page.locator('.adv-switch-team button').count()>0);
await page.getByRole('button',{name:'Túi đồ',exact:true}).click();assert(await page.locator('.adv-battle-bag select').isVisible());
await page.screenshot({path:'/tmp/web433-live-battle.png'});checks.push({liveBattle:true,guardAdvancesTurn:true,sharedAtlasLoaded:true,teamAndBagAvailable:true});
// Keep the source state untouched throughout every other introduction mode.
for(const mode of ['tcg','auto','chest']){
 const snapshot=await page.evaluate(()=>localStorage.getItem('foodchest.tcg.v1'));
 await page.evaluate(async mode=>{const {useModeIntroStore}=await import('/src/game/modeIntroState.ts');useModeIntroStore.getState().open(mode)},mode);
 await page.locator('.mode-live-demo').waitFor();await page.getByRole('button',{name:'Ẩn chú thích',exact:true}).click();await page.waitForTimeout(12000);
 assert.equal(await page.locator('.mode-live-demo').evaluate(el=>getComputedStyle(el).getPropertyValue('--demo-toolbar-height').trim()),'0px');
 assert.equal(await page.locator('.live-demo-scene').evaluate(el=>el.scrollHeight>el.clientHeight+1),false,`${mode} scene scroll`);
 if(mode==='auto'){const board=await page.locator('.ac-arena').boundingBox();assert(board.height>250,'auto board collapsed')}
 await page.screenshot({path:`/tmp/web433-${mode}.png`});await page.getByRole('button',{name:'Hiện chú thích',exact:true}).click();await page.getByRole('button',{name:'Đóng giới thiệu',exact:true}).click();assert.equal(await page.evaluate(()=>localStorage.getItem('foodchest.tcg.v1')),snapshot);
 checks.push({mode,captionToggle:true,savePreserved:true});
}
assert.deepEqual(faults,[]);await context.close();
console.log(JSON.stringify(checks,null,2));await browser.close();server.kill();
