import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const Chromium = process.env.CHROMIUM_MODULE ? (await import(process.env.CHROMIUM_MODULE)).default : null;
import { createServer } from 'vite';
const root=process.cwd();
const vite=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
const {newGame}=await vite.ssrLoadModule('/src/game/progression.ts');
const {STAGES}=await vite.ssrLoadModule('/src/game/story.ts');
const {repository}=await vite.ssrLoadModule('/src/infrastructure/storage/repository.ts');
const user=repository.loadUser();user.preferences.musicEnabled=false;user.preferences.soundEnabled=false;
await vite.close();
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4176','--strictPort'],{stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.on('data',c=>{if(String(c).includes('4176'))resolve()});server.on('error',reject);setTimeout(()=>reject(Error('startup')),10000).unref()});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || (Chromium ? await Chromium.executablePath() : undefined),args:Chromium ? Chromium.args.filter(a=>a!=='--single-process') : [],headless:true});
const errors=[],checks=[];
try {
 for(const [width,height] of [[320,568],[390,844],[844,390],[1366,768]]) {
  const game=newGame();game.clearedStages=STAGES.map(s=>s.id);game.storyEnding='remember';
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  await context.addInitScript(({game,user})=>{localStorage.setItem('foodchest.tcg.v1',game);localStorage.setItem('foodchest.user.v1',user)}, {game:JSON.stringify(game),user:JSON.stringify(user)});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4176/?tab=story');
  await page.locator('.tcg-campaign-screen').waitFor();
  const phone=await page.locator('.tcg-open-map').isVisible();
  async function map(){if(phone)await page.locator('.tcg-open-map').click();return phone?page.getByRole('dialog'):page.locator('.tcg-campaign-atlas')}
  let atlas=await map();
  await atlas.getByRole('button',{name:'Chợ Sống · 07–12'}).click();
  assert.equal(await atlas.locator('.tcg-map-stop').count(),6);
  for(const n of [10,11,12])assert(await atlas.getByRole('button',{name:`Chương ${n}: Coming soon`,exact:true}).isDisabled());
  for(const [n,title] of [[7,'Chợ có hai giọng'],[8,'Bến sau cơn mưa'],[9,'Bữa cơm ngày mai']]) {
    if(n!==7)atlas=await map();
    await atlas.getByRole('button',{name:new RegExp(`Đến chương ${n}:`)}).click();
    await page.locator('.tcg-chapter h2').filter({hasText:title}).waitFor();
    assert.equal(await page.getByRole('dialog').count(),0);
  }
  atlas=await map();await atlas.getByRole('button',{name:'Miền ký ức · 01–06'}).click();
  await atlas.getByRole('button',{name:/Đến chương 1:/}).click();
  atlas=await map();await atlas.getByRole('button',{name:'Chợ Sống · 07–12'}).click();
  const size=await atlas.locator('svg.tcg-world-map-art').boundingBox();const mapSize=await atlas.locator('.tcg-world-map').boundingBox();assert(size.width>=mapSize.width-12);assert(size.height>=mapSize.height-12);
  const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(geometry.scroll<=width+1);
  const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('foodchest.tcg.v1')));
  assert.deepEqual(persisted.clearedStages,game.clearedStages);assert.equal(persisted.coins,game.coins);assert.equal(persisted.storyEnding,game.storyEnding);
  if(width===390)await page.screenshot({path:process.env.MAP_SCREENSHOT || 'dev/docs/major-v400/chapter-map-phone.png'});
  checks.push({width,height,fastTravel:[7,8,9],comingSoon:[10,11,12],regionSwitch:true,progressPreserved:true,...geometry});
  await context.close();
 }
 // New players may view the second region, but cannot skip the campaign or ending.
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.addInitScript(({game,user})=>{localStorage.setItem('foodchest.tcg.v1',game);localStorage.setItem('foodchest.user.v1',user)}, {game:JSON.stringify(newGame()),user:JSON.stringify(user)});
 const page=await context.newPage();await page.goto('http://127.0.0.1:4176/?tab=story');await page.locator('.tcg-open-map').click();
 const atlas=page.getByRole('dialog');await atlas.getByRole('button',{name:'Chợ Sống · 07–12'}).click();assert.equal(await atlas.locator('.tcg-map-stop:disabled').count(),6);await context.close();
 checks.push({newPlayerLocked:true});assert.deepEqual(errors,[]);
 writeFileSync('dev/docs/major-v400/chapter-map-qa.json',JSON.stringify({checks,errors,scope:'Production Chromium; mobile viewports, not a physical Android installation'},null,2));
 console.log(JSON.stringify({checks:checks.length,errors}));
} finally {await browser.close();server.kill()}
