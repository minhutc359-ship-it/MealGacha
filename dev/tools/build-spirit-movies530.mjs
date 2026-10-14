import {spawn} from 'node:child_process'
import {mkdirSync,writeFileSync,readFileSync,statSync,renameSync} from 'node:fs'
import {once} from 'node:events'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),out=path.join(root,'public/assets/rpg/awakening530/movies')
mkdirSync(out,{recursive:true});const temporary=path.join(root,'dev/artifacts/awakening530/encoded');mkdirSync(temporary,{recursive:true})
let ids=JSON.parse(readFileSync(path.join(root,'dev/docs/web-v530/summon-catalog.json'),'utf8')).map(c=>c.id)
const selected=process.argv.slice(2);if(selected.length)ids=ids.filter(id=>selected.includes(id))
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const port=4253,url=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','dev/tools/vite.pvp-qa.config.ts','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'pipe'})
let log='',browser;server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b)
const manifest=[]
try{
  for(let i=0;i<100;i++){try{await fetch(url);break}catch{await new Promise(r=>setTimeout(r,100))}}
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN,headless:true,env:{...process.env,LD_LIBRARY_PATH:process.env.CHROMIUM_LIB_DIR??process.env.LD_LIBRARY_PATH},args:['--no-sandbox']})
  const page=await browser.newPage();page.on('pageerror',e=>console.error(e.message));await page.goto(url+'/dev/tools/movie530.html');await page.waitForFunction(()=>window.prepareSpiritMovie)
  for(const [index,id] of ids.entries()){
    const info=await page.evaluate(async(id)=>{window.movie=await window.prepareSpiritMovie(id);return {pattern:window.movie.pattern,motif:window.movie.motif,title:window.movie.title}},id)
    const file=path.join(out,id+'.mp4'),tempFile=path.join(temporary,id+'.mp4'),encoder=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-vcodec','mjpeg','-r','24','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','34','-pix_fmt','yuv420p','-movflags','+faststart','-t','2.4',tempFile],{stdio:['pipe','ignore','pipe']})
    let errors='';encoder.stderr.on('data',b=>errors+=b);const exited=once(encoder,'exit')
    for(let first=0;first<58;first+=10){const frames=await page.evaluate(({first})=>Array.from({length:Math.min(10,58-first)},(_,i)=>window.movie.draw((first+i)/24)),{first});for(const frame of frames){if(!encoder.stdin.write(Buffer.from(frame,'base64')))await once(encoder.stdin,'drain')}}
    encoder.stdin.end();const [code]=await exited;if(code)throw Error(errors);renameSync(tempFile,file)
    manifest.push({id,...info,path:`/assets/rpg/awakening530/movies/${id}.mp4`,bytes:statSync(file).size,width:512,height:288,fps:24,seconds:2.4})
    if(index%10===0||index===ids.length-1)console.log(JSON.stringify({done:index+1,total:ids.length,bytes:manifest.reduce((n,m)=>n+m.bytes,0)}))
  }
  const manifestPath=path.join(root,'dev/docs/web-v530/movie-manifest.json');const all=selected.length?JSON.parse(readFileSync(manifestPath,'utf8')).map(m=>manifest.find(n=>n.id===m.id)??m):manifest;writeFileSync(manifestPath,JSON.stringify(all,null,2)+'\n')
}finally{await browser?.close();server.kill('SIGTERM');if(log.includes('Error'))console.error(log.slice(-4000))}
