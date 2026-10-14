import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {writeFileSync} from 'node:fs'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const url='http://127.0.0.1:4201',server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4201','--strictPort'],{stdio:'pipe'})
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
    await page.screenshot({path:`dev/docs/web-v520/production-${route}.jpg`,quality:85})
    await page.getByRole('button',{name:'Đóng giới thiệu',exact:true}).click()
    assert.equal(await page.evaluate(()=>localStorage.getItem('foodchest.tcg.v1')),before)
    reports.push({route,renderer:renderers,canvas:true,saveUnchanged:true})
  }
  assert(chunks.length>0,'Pixi production chunk must load');assert.deepEqual(errors,[]);assert.deepEqual(missing,[])
  writeFileSync('dev/docs/web-v520/production-qa.json',JSON.stringify({reports,chunks,errors,missing},null,2)+'\n');console.log(JSON.stringify(reports))
}catch(e){console.error(log);if(page)console.error((await page.locator('body').innerText()).slice(-2500));throw e}
finally{await browser?.close();server.kill()}
