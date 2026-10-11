import {spawn} from 'node:child_process';
import {writeFileSync,readFileSync,statSync} from 'node:fs';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const Chromium=process.env.CHROMIUM_MODULE?(await import(process.env.CHROMIUM_MODULE)).default:null;
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4182','--strictPort'],{stdio:['ignore','pipe','pipe']});
await new Promise(resolve=>server.stdout.on('data',c=>{if(String(c).includes('4182'))resolve()}));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(Chromium?await Chromium.executablePath():undefined),args:Chromium?Chromium.args.filter(a=>a!=='--single-process'):[],headless:true});
try{
const c=await browser.newContext({serviceWorkers:'block',viewport:{width:1366,height:768}});const p=await c.newPage();await p.goto('http://127.0.0.1:4182',{waitUntil:'networkidle'});
const cold=await p.evaluate(()=>{const r=performance.getEntriesByType('resource');return {timingBodyBytes:r.reduce((n,e)=>n+e.encodedBodySize,0),urls:r.map(e=>e.name),requests:r.length,audio:r.filter(e=>e.name.includes('.mp3')).length,external:r.filter(e=>new URL(e.name).origin!==location.origin).map(e=>e.name)}});
await p.reload({waitUntil:'networkidle'});const warm=await p.evaluate(()=>{const r=performance.getEntriesByType('resource');return {timingTransferBytes:r.reduce((n,e)=>n+e.transferSize,0),requests:r.length}});
cold.requestedFileBytes=statSync('dist/index.html').size+[...new Set(cold.urls)].reduce((n,url)=>{const file=path.join('dist',new URL(url).pathname);try{return n+statSync(file).size}catch{return n}},0);delete cold.urls;
if(cold.timingBodyBytes===0)cold.timingBodyBytes=null;if(warm.timingTransferBytes===0)warm.timingTransferBytes=null;
const sw=readFileSync('dist/sw.js','utf8');const core=JSON.parse(sw.match(/const CORE_URLS = (\[[^;]+\]);/)[1]);const coreBytes=core.reduce((n,url)=>n+statSync(path.join('dist',url==='/'?'index.html':url)).size,0);
const report={cold,warm,corePrecacheBytes:coreBytes,corePrecacheRequests:core.length,scope:'Local Chromium production preview; SW blocked for isolated page load, music off by default. requestedFileBytes sums distinct requested dist assets plus HTML; excludes HTTP compression and worker precache. Resource Timing byte values unavailable/zero are null, so warm network savings are not claimed. Core precache counted separately from filesystem. No network throttling, bandwidth billing or real-user speed measurement.'};writeFileSync('dev/docs/web-v410/loading.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));await c.close();
}finally{await browser.close();server.kill()}
