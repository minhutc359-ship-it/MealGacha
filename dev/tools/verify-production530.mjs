import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {writeFileSync} from 'node:fs'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const url='http://127.0.0.1:4255',server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4255','--strictPort'],{stdio:'pipe'})
let browser,page,log='';server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b)
try{
  for(let i=0;i<100;i++){try{await fetch(url);break}catch{await new Promise(r=>setTimeout(r,100))}}
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN,headless:true,env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR??process.env.LD_LIBRARY_PATH},args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
  page=await browser.newPage({viewport:{width:390,height:844}});const errors=[],missing=[],chunks=[]
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push([r.url(),r.status()]);if(r.url().includes('pixi-renderer'))chunks.push(r.url())})
  const reports=[]
  for(const [route,help] of [['adventure','Giao ước'],['game','Hướng dẫn chơi'],['autochess','Hướng dẫn'],['chest','Rương']]){
    await page.goto(`${url}/${route}`)
    if(route==='adventure')await page.getByRole('button',{name:'Hướng dẫn',exact:true}).click()
    else if(route==='game')await page.getByRole('button',{name:'Cách chơi',exact:true}).click()
    else if(route==='autochess') await page.getByRole('button',{name:/Hướng dẫn/}).first().click()
    if(route==='chest'){await page.locator('.chest-play-guide summary').waitFor();await page.waitForTimeout(600);const dismiss=page.getByRole('button',{name:'Tắt thông báo',exact:true});if(await dismiss.isVisible())await dismiss.click();await page.locator('.chest-play-guide summary').click()}
    const before=await page.evaluate(()=>localStorage.getItem('foodchest.tcg.v1'))
    await page.locator('.meal-mode-intro-button').click();await page.locator('.live-demo-scene').waitFor();await page.waitForTimeout(2500)
    if(route==='adventure'){await page.getByRole('button',{name:'Ẩn chú thích',exact:true}).click();const fits=await page.evaluate(()=>document.querySelector('.rpg-burst-deck').getBoundingClientRect().bottom<=document.querySelector('.live-demo-toolbar').getBoundingClientRect().top);assert(fits,'Demo dock covers burst deck')}
    const renderers=await page.locator('.arena-scene').evaluateAll(nodes=>nodes.map(n=>n.dataset.renderer))
    assert(await page.locator('.live-demo-scene canvas').count()>0)
    if(route==='chest')assert(await page.locator('.pixi-vfx canvas').count()>0)
    assert.equal(await page.getByRole('heading',{name:'Chưa mở được giới thiệu'}).count(),0)
    await page.screenshot({path:`dev/docs/web-v530/production-${route}.jpg`,quality:85})
    await page.getByRole('button',{name:'Đóng giới thiệu',exact:true}).click()
    assert.equal(await page.evaluate(()=>localStorage.getItem('foodchest.tcg.v1')),before)
    reports.push({route,renderer:renderers,canvas:true,saveUnchanged:true})
  }
  // Run an actual production battle; observe the real decoder and the shared audio mixer.
  await page.addInitScript(()=>{window.__clips=[];const C=window.AudioContext??window.webkitAudioContext;if(C){const create=C.prototype.createBufferSource;C.prototype.createBufferSource=function(...args){const source=create.apply(this,args),start=source.start;source.start=function(...a){if(source.buffer?.duration>2&&source.buffer.duration<2.7)window.__clips.push({duration:source.buffer.duration,offset:a[1]??0});return start.apply(this,a)};return source}}})
  await page.goto(url+'/adventure');await page.locator('.rpg-stage-node').first().click();await page.getByRole('button',{name:/Tiếp tục →/,exact:false}).click();await page.locator('.rpg-burst-button:not([disabled])').first().waitFor({timeout:20000})
  await page.locator('.rpg-burst-button:not([disabled])').first().click();await page.waitForFunction(()=>document.querySelector('.rpg-cinematic video')?.currentTime>.2)
  const video=await page.locator('.rpg-cinematic video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,ready:v.readyState,time:v.currentTime,src:v.currentSrc}))
  assert.equal(video.width,512);assert.equal(video.height,288)
  await page.screenshot({path:'dev/docs/web-v530/production-cinematic.jpg',quality:87})
  await page.locator('.rpg-cinematic').waitFor({state:'detached',timeout:7000});assert((await page.evaluate(()=>window.__clips.length))>0)
  await page.getByRole('button',{name:'Video tuyệt kỹ ON',exact:true}).click();const count=await page.evaluate(()=>window.__clips.length)
  await page.locator('.rpg-burst-button:not([disabled])').first().click();await page.waitForFunction(n=>window.__clips.length>n,count);assert.equal(await page.locator('.rpg-cinematic').count(),0)
  // The on-demand worker serves cached video byte ranges without network access.
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller)
  await page.waitForTimeout(400);await page.context().setOffline(true)
  const range=await page.evaluate(async src=>{const r=await fetch(src,{headers:{Range:'bytes=0-23'}});const b=new Uint8Array(await r.arrayBuffer());return {status:r.status,range:r.headers.get('Content-Range'),bytes:b.length,signature:String.fromCharCode(...b.slice(4,8))}},video.src)
  assert.equal(range.status,206);assert.equal(range.bytes,24);assert.equal(range.signature,'ftyp');await page.context().setOffline(false)
  reports.push({route:'actual-rpg',video,customSoundWithVideo:true,customSoundWithoutVideo:true,offlineVideoRange:range})
  const profile=await browser.newPage({viewport:{width:390,height:844}});profile.on('pageerror',e=>errors.push(e.message));await profile.goto(url+'/adventure?hero=chef-nhien');await profile.getByText('0 / 45 thẻ Vị Linh',{exact:true}).waitFor();await profile.waitForFunction(()=>!document.querySelector('.rpg-skill-list')?.innerText.includes('đang tải'));assert((await profile.locator('.rpg-skill-list').innerText()).includes('Chân ước'))
  reports.push({route:'production-profile',loadedSkillJson:true,lockedProgress:true});await profile.close()
  assert(chunks.length>0,'Pixi production chunk must load');assert.deepEqual(errors,[]);assert.deepEqual(missing,[])
  writeFileSync('dev/docs/web-v530/production-qa.json',JSON.stringify({reports,chunks,errors,missing},null,2)+'\n');console.log(JSON.stringify(reports))
}catch(e){console.error(log);if(page)console.error((await page.locator('body').innerText()).slice(-2500));throw e}
finally{await browser?.close();server.kill()}
