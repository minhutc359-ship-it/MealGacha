// Workspace QA harness: requires Playwright and a Chromium binary; set paths below for your machine.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import Chromium from '/workspace/scratch/b3de12b4faac/browser-qa/node_modules/@sparticuz/chromium/build/index.js';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..'), out=root+'/dev/docs/major-v400';
const require=createRequire(root+'/package.json');
const { createServer }=await import(require.resolve('vite'));
const vite=await createServer({root,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
const { newGame }=await vite.ssrLoadModule('/src/game/progression.ts');
const { STAGES }=await vite.ssrLoadModule('/src/game/story.ts');
const { createAutoRun }=await vite.ssrLoadModule('/src/game/autochess/economy.ts');
const { emptyAutoSave }=await vite.ssrLoadModule('/src/game/autochess/types.ts');
const { repository }=await vite.ssrLoadModule('/src/infrastructure/storage/repository.ts');
const { startBattle }=await vite.ssrLoadModule('/src/game/battle.ts');
const { STARTER_DECK }=await vite.ssrLoadModule('/src/game/catalog.ts');
const { parseGame }=await vite.ssrLoadModule('/src/game/storage.ts');
const user=repository.loadUser(); user.displayName='Policy QA'; user.preferences.soundEnabled=false;user.preferences.musicEnabled=false;

const base='http://127.0.0.1:4176'; const checks=[], errors=[];
await vite.close();
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4176','--strictPort'],{cwd:root,stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.on('data',c=>{if(String(c).includes('4176'))resolve()});server.on('error',reject);setTimeout(()=>reject(Error('startup')),10000).unref()});
const browser=await chromium.launch({executablePath:'/workspace/scratch/b3de12b4faac/browser-qa/bin/chromium',args:Chromium.args.filter(a=>a!=='--single-process'),headless:true,env:{...process.env,LD_LIBRARY_PATH:'/workspace/scratch/b3de12b4faac/browser-qa/bin',FONTCONFIG_PATH:'/etc/fonts'}});
async function context(game, width=390,height=844){const c=await browser.newContext({viewport:{width,height}});await c.addInitScript(({game,user})=>{if(!localStorage.getItem('foodchest.tcg.v1')) {localStorage.setItem('foodchest.tcg.v1',game);localStorage.setItem('foodchest.user.v1',user)}}, {game:typeof game==='string'?game:JSON.stringify(game),user:JSON.stringify(user)}); const page=await c.newPage();page.on('pageerror',e=>errors.push(e.message)); return {c,page}}
try {
 for(const ending of ['remember','release']) {
  const game=newGame();game.clearedStages=STAGES.slice(0,18).map(s=>s.id);game.storyEnding=ending;game.coins=1234;
  const {c,page}=await context(game);await page.goto(base);await page.getByRole('button',{name:/Nhận gói khởi hành 4.0/}).click();
  const first=await page.evaluate(()=>JSON.parse(localStorage.getItem('foodchest.tcg.v1')));assert.equal(first.coins,1234);assert.equal(first.cards['v4-rain-seed'],2);assert.deepEqual(first.decks,game.decks);assert.equal(first.storyEnding,ending);
  await page.reload();assert.equal(await page.getByRole('button',{name:/Nhận gói khởi hành 4.0/}).count(),0);
  await page.getByRole('button',{name:/Tiếp tục hành trình/}).click();await page.getByText(ending==='release'?'Mai đã được tiễn đi.':'Tôi vẫn là một ký ức,',{exact:false}).first().waitFor();
  checks.push({ending,giftPreserved:true,branchOpening:true}); await page.screenshot({path:out+`/v4-${ending}-phone.jpg`,type:'jpeg',quality:80}); await c.close();
 }
 const b=startBattle(STARTER_DECK,null,'courage',()=>.5);b.player.hand=['v4-two-spices'];b.player.mana=b.player.maxMana=7;b.enemy.hand=[];b.enemy.deck=Array(18).fill('banh-mi');
 const game={...newGame(),battle:b};assert(parseGame(game));
 for(const v of [{width:390,height:844},{width:844,height:390},{width:1366,height:768}]) {
  const {c,page}=await context(game,v.width,v.height);await page.goto(base);await page.getByRole('button',{name:/Hai nhúm gia vị, 2 năng lượng/}).waitFor();
  await page.getByRole('button',{name:/Hai nhúm gia vị, 2 năng lượng/}).click(); await page.getByRole('dialog',{name:'Nêm vị · Hai nhúm gia vị'}).waitFor();
  const raw=await page.evaluate(()=>localStorage.getItem('foodchest.tcg.v1')); assert.equal(JSON.parse(raw).battle.player.mana,7);
  await page.getByRole('button',{name:/Dậy lửa ·/}).click(); await page.locator('.tcg-hero.enemy').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('foodchest.tcg.v1')).battle.player.hand.length===0);
  const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('foodchest.tcg.v1')));assert.equal(result.battle.enemy.health,b.enemy.health-3);assert.equal(result.battle.player.spellsThisTurn,1);
  const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(geometry.scroll<=geometry.width+1); checks.push({...v,choiceHit:true,...geometry});await c.close();
 }
 const corrupted='{"version":1,"coins":7654,"broken"';const {c,page}=await context(corrupted);await page.goto(base);await page.getByRole('heading',{name:"Bản lưu cần được kiểm tra"}).first().waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('foodchest.tcg.v1')),corrupted);checks.push({corruptionKept:true});await c.close();
 assert.deepEqual(errors,[]);writeFileSync(out+'/browser-v4-results.json',JSON.stringify({checks,errors,scope:'Production Chromium headless UI; no physical-device FPS or subjective sound judgment'},null,2));console.log(JSON.stringify({checks:checks.length,errors}));
} finally {await browser.close();server.kill()}
