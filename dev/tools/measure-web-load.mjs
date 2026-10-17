import assert from 'node:assert/strict'
import http from 'node:http'
import {createReadStream,statSync,mkdirSync,writeFileSync} from 'node:fs'
import path from 'node:path'
import {checkWebBudget} from './web-budget.mjs'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const root=path.resolve(process.env.WEB_DIST_DIR??'dist'), requests=[], errors=[]
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon','.mp3':'audio/mpeg','.mp4':'video/mp4'}
// Count every server response, including service-worker installation/warming, without HTTP compression.
// This deliberately reports raw delivered bodies rather than mistaking all dist bytes for a cold launch.
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)
  let file=path.resolve(root,'.'+pathname)
  if(!file.startsWith(root+path.sep)){if(pathname==='/')file=path.join(root,'index.html');else{res.writeHead(403).end();return}}
  let stat;try{stat=statSync(file);if(!stat.isFile())throw Error()}catch{if(!path.extname(pathname)){file=path.join(root,'index.html');stat=statSync(file)}else{requests.push({url:pathname,bytes:0,status:404});res.writeHead(404).end();return}}
  const etag='"'+stat.size+'-'+Math.round(stat.mtimeMs)+'"'
  const status=req.headers['if-none-match']===etag?304:200
  requests.push({url:pathname,bytes:status===200?stat.size:0,status})
  res.writeHead(status,{'Content-Type':mime[path.extname(file)]??'application/octet-stream','Cache-Control':'no-cache','ETag':etag,...(status===200?{'Content-Length':stat.size}:{})})
  if(status===304)res.end();else createReadStream(file).pipe(res)
})
await new Promise(resolve=>server.listen(4192,'127.0.0.1',resolve))
let browser
const results=[]
try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN,headless:true,args:process.env.CHROMIUM_ARGS?JSON.parse(process.env.CHROMIUM_ARGS):['--no-sandbox'],env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR??process.env.LD_LIBRARY_PATH,FONTCONFIG_PATH:process.env.FONTCONFIG_PATH??'/etc/fonts'}})
  for(const route of ['/','/adventure','/autochess']){
    const start=requests.length,c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage()
    p.on('pageerror',e=>errors.push(e.message))
    await p.goto('http://127.0.0.1:4192'+route);await p.waitForFunction(()=>document.querySelector('#root')?.textContent.length>30)
    await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller,{},{timeout:20000})
    await p.waitForLoadState('networkidle');await p.waitForTimeout(400)
    const rows=requests.slice(start),bytes=rows.reduce((s,r)=>s+r.bytes,0),budget=checkWebBudget(bytes,true)
    assert(!rows.some(r=>r.status>=400),JSON.stringify(rows.filter(r=>r.status>=400)))
    assert(!rows.some(r=>r.url.endsWith('.mp4')),'A cinematic was fetched before battle')
    assert(!budget.exceeded,`Cold launch ${route}: ${bytes} bytes exceeds ${budget.limitBytes}`)
    const media=rows.filter(r=>/\.(webp|png|mp3|mp4)$/.test(r.url))
    results.push({route,deliveredBodyBytes:bytes,requests:rows.length,budget,media,serviceWorkerInstalled:true})
    // Previously visited content remains usable from the version-pinned offline shell.
    await c.setOffline(true);await p.reload();await p.waitForFunction(()=>document.querySelector('#root')?.textContent.length>30);results.at(-1).offlineReload=true
    await c.close();console.log('PASS cold launch',route,bytes)
  }
  assert.deepEqual(errors,[])
  const output=process.argv[2]??'dev/docs/web-v600/initial-load.json';mkdirSync(path.dirname(output),{recursive:true});writeFileSync(output,JSON.stringify({date:new Date().toISOString().slice(0,10),measurement:'Fresh browser context per mode. Includes SW precache and warm requests. No HTTP compression; body bytes are a conservative payload measurement, not wall-clock performance or full network headers.',browser:'Chromium headless',results,errors},null,2)+'\n')
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
