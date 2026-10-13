import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { writeFileSync } from "node:fs"
const server = spawn("pnpm", ["dev", "--host", "127.0.0.1", "--port", "4190"], {
  stdio: "ignore",
})
process.on("exit", () => server.kill())
for (let n = 0; n < 150; n++) {
  try {
    await fetch("http://127.0.0.1:4190")
    break
  } catch {
    await new Promise((r) => setTimeout(r, 100))
  }
}
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright")
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  headless: true,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
  env: {
    ...process.env,
    LD_LIBRARY_PATH: process.env.CHROMIUM_LIB_DIR || "/tmp",
  },
})
const checks = []
const state = (page) =>
  page.evaluate(async () => {
    const { useGameStore } = await import("/src/game/useGameStore.ts")
    return structuredClone(useGameStore.getState().save)
  })
const skipPlayback = async page => page.evaluate(()=>{
 const button=[...document.querySelectorAll("button")].find(el=>el.textContent.trim()==="Bỏ qua ⏩")
 if(button)button.click()
})
const fit = async (page, locator) => {
  const r = await locator.boundingBox(),
    vp = page.viewportSize()
  assert(r && r.width >= 24 && r.height >= 24, "small touch target")
  assert(
    r.x >= -1 &&
      r.y >= -1 &&
      r.x + r.width <= vp.width + 1 &&
      r.y + r.height <= vp.height + 1,
    "control outside viewport",
  )
}
for (const [width,height] of [[1440,900],[390,844],[844,390],[320,568]]) {
  const context=await browser.newContext({viewport:{width,height},reducedMotion:"no-preference"}),page=await context.newPage(),errors=[],missing=[]
  page.on("pageerror",e=>errors.push(e.message));page.on("response",r=>{if(r.url().includes("/assets/")&&r.status()>=400)missing.push(r.url())})
  await page.goto("http://127.0.0.1:4190/")
  await page.evaluate(async()=>{
    const {useGameStore}=await import("/src/game/useGameStore.ts"),{newGame}=await import("/src/game/progression.ts"),{LEGACY_STARTER_DECK,LEGACY_STARTER_IDS}=await import("/src/game/catalog.ts")
    const s=newGame();delete s.tcg470;s.cards=Object.fromEntries(LEGACY_STARTER_IDS.map(id=>[id,2]));s.decks[0].cards=LEGACY_STARTER_DECK;s.coins=731;s.xp=517
    if(!useGameStore.getState().importSave(s))throw Error("old collection refused")
    useGameStore.setState({notice:null})
  })
  await page.goto("http://127.0.0.1:4190/?tab=decks")
  const before=await state(page)
  await page.getByRole("button",{name:"Bổ sung đủ 24 lá",exact:true}).click()
  const saveDeck=page.getByRole("button",{name:"Lưu & trang bị · 24/24",exact:true})
  await saveDeck.click()
  let after=await state(page)
  assert.equal(after.decks[0].cards.length,24);assert.deepEqual(after.decks[0].cards.slice(0,18),before.decks[0].cards)
  assert.equal(after.coins,before.coins);assert.equal(after.xp,before.xp)
  await page.reload();assert.equal((await state(page)).decks[0].cards.length,24)
  const fixture=async(type)=>page.evaluate(async type=>{
    const {useGameStore}=await import("/src/game/useGameStore.ts"),{startBattle}=await import("/src/game/battle.ts"),{STARTER_DECK,LEGACY_STARTER_DECK}=await import("/src/game/catalog.ts")
    const s=structuredClone(useGameStore.getState().save),legacy=type==="legacy"
    const b=startBattle(legacy?LEGACY_STARTER_DECK:STARTER_DECK,null,"courage",()=>.41,false,legacy?450:470)
    const u=(uid,id,guard=false)=>({uid,cardId:id,attack:1,health:8,maxHealth:8,shield:0,ready:true,keywords:guard?["guard"]:[]})
    b.player.mana=b.player.maxMana=7;b.player.board=[u("p1","banh-mi"),u("p2","pho-bo"),u("p3","com-tam")]
    b.player.hand=["caravan-scout","trap-lid","recipe-scroll"]
    b.enemy.board=[u("e1","banh-mi"),u("e2","pho-bo"),u("e3","com-tam")];if(!legacy)b.enemy.board.push(u("e4","caravan-cook"))
    b.enemy.hand=[];b.enemy.deck=["herb"];b.enemy.maxMana=0;b.enemy.mana=0;b.tactic={status:"chosen",choice:"shelter"}
    if(type==="draw"){b.player.deck=["spark"];b.player.fatigue=2;b.player.hand=["recipe-scroll"];b.player.board.push(u("p4","caravan-cook"))}
    if(type==="empty"){b.player.deck=[];b.player.fatigue=8;b.player.hand=["recipe-scroll"]}
    if(!useGameStore.getState().importSave({...s,battle:b}))throw Error("battle refused")
    useGameStore.setState({notice:null,presentation:null})
  },type)
  await fixture("normal");await page.locator(".tcg-470-battle").waitFor()
  await page.locator(".tcg-hand .tcg-card").first().click()
  const summon=page.getByRole("button",{name:/^Triệu hồi/});await fit(page,summon);await summon.click()
  assert.equal((await state(page)).battle.player.board.length,4)
  const skip=page.getByRole("button",{name:"Bỏ qua ⏩",exact:true});await skipPlayback(page)
  await page.waitForTimeout(150)
  assert.equal(await page.locator(".tcg-field:not(.enemy) .tcg-unit-wrap").count(),4)
  await fit(page,page.locator(".tcg-field:not(.enemy) .tcg-unit-wrap").last())
  await fit(page,page.locator('.tcg-trap-slot[data-side="player"]'))
  await fit(page,page.getByRole("button",{name:"Kết thúc lượt →",exact:true}))
  await page.screenshot({path:`/tmp/web480-four-${width}.png`})
  await page.reload();assert.equal((await state(page)).battle.player.board.length,4)
  await page.locator(".tcg-hand .tcg-card").first().click()
  const set=page.getByRole("button",{name:/^Úp bẫy/});await page.evaluate(async()=>{const {gameAudio}=await import("/src/infrastructure/audio/gameAudio.ts");window.__trapSounds=[];const original=gameAudio.play.bind(gameAudio);gameAudio.play=(...args)=>{window.__trapSounds.push(args[0]);return original(...args)}})
  await set.click();await page.locator(".tcg-trap-slot.is-setting").waitFor()
  const skipNode=await page.getByRole("button",{name:"Bỏ qua ⏩",exact:true}).elementHandle()
  assert.equal((await page.locator(".tcg-trap-slot").allTextContents()).join(""),"")
  assert(await page.locator(".tcg-trap-slot.is-setting img").evaluate(el=>el.getAnimations().some(a=>a.playState==="running")))
  const cues=await page.evaluate(()=>window.__trapSounds);assert.equal(cues.filter(c=>c==="trap-set").length,1)
  await page.locator(".tcg-trap-slot.is-setting").waitFor({state:"hidden"})
  assert(await skipNode.evaluate(el=>!el.isConnected),"skip button reused as an end-turn control")
  assert(!(await state(page)).battle.enemyPhase)
  await page.getByRole("button",{name:"Kết thúc lượt →",exact:true}).click();await skipPlayback(page)
  await page.getByRole("button",{name:"Giữ bẫy",exact:true}).waitFor()
  for(let i=0;i<3;i++){await page.getByRole("button",{name:"Giữ bẫy",exact:true}).click();await skipPlayback(page);await page.getByRole("button",{name:"Giữ bẫy",exact:true}).waitFor()}
  assert.equal((await state(page)).battle.pendingReaction.intent.source,"e4")
  await page.reload();const health=(await state(page)).battle.player.health
  const activate=page.getByRole("button",{name:"◇ Kích hoạt bẫy",exact:true});await activate.waitFor();await fit(page,activate);await page.evaluate(()=>{
    window.__revealStart=null;window.__revealHold=null;let showing=false;
    const observer=new MutationObserver(()=>{const now=!!document.querySelector(".tcg-trap-reveal");if(now&&!showing)window.__revealStart=performance.now();if(!now&&showing){window.__revealHold=performance.now()-window.__revealStart;observer.disconnect()}showing=now});observer.observe(document.body,{childList:true,subtree:true})
  });await activate.click();await page.locator(".tcg-trap-reveal").waitFor();await page.locator(".tcg-trap-reveal").waitFor({state:"hidden",timeout:5000});const revealMs=await page.evaluate(()=>window.__revealHold);assert(revealMs>=2200,"observed reveal shorter than the requested 2.25 seconds: "+revealMs);await skipPlayback(page)
  const resolved=await state(page);assert.equal(resolved.battle.player.health,health);assert.equal(resolved.battle.player.trap,null);assert(!resolved.battle.pendingReaction)
  await fixture("draw");await page.locator(".tcg-hand .tcg-card").first().click()
  await page.locator(".tcg-draw-warning").waitFor();assert.match(await page.locator(".tcg-draw-warning").innerText(),/rút hụt 2 lá.*6 sát thương/)
  const cast=page.getByRole("button",{name:/^Thi triển/});await fit(page,cast)
  await page.screenshot({path:`/tmp/web480-warning-${width}.png`})
  const hp=(await state(page)).battle.player.health;await cast.click();assert.equal((await state(page)).battle.player.health,hp-6)
  await skipPlayback(page)
  await fixture("empty");await page.locator(".tcg-deck-status").waitFor();assert.match(await page.locator(".tcg-deck-status").innerText(),/Rút hụt kế: −3/)
  const fitReport=await page.evaluate(()=>{
    const v={width:innerWidth,height:innerHeight},selectors=[".tcg-resource-hud",".tcg-deck-status",".tcg-field:not(.enemy)",".tcg-hand"]
    return {overflow:document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1,boxes:selectors.map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return{selector,x:r.x,y:r.y,width:r.width,height:r.height,inside:r.x>=-1&&r.y>=-1&&r.right<=v.width+1&&r.bottom<=v.height+1}})}
  })
  assert(!fitReport.overflow);assert(fitReport.boxes.every(r=>r.inside&&r.height>0))
  await fixture("legacy");await page.reload();await page.locator(".tcg-450-battle").waitFor();assert.equal((await state(page)).battle.rulesVersion,450);assert.equal(await page.locator(".tcg-field:not(.enemy) .tcg-unit-wrap").count(),3);assert.equal(await page.locator(".tcg-470-battle").count(),0)
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[])
  checks.push({width,height,upgrade24:true,oldPrefixPreserved:true,fourthSummonReload:true,fourthAttackerReactionReload:true,drawWarningAndDamage:true,emptyDeckCap:true,legacy450:true,trapSetAnimation:true,trapSetSound:true,revealMs,fitReport,errors,missing})
  await context.close()
}
await browser.close();server.kill()
writeFileSync("dev/docs/web-v480/browser-qa.json",JSON.stringify(checks,null,2)+"\n")
console.log(JSON.stringify(checks.map(({fitReport,...r})=>r)))
