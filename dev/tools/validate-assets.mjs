import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
const root=process.cwd(), missing=[], checked=new Set();
function visit(dir) {
  for(const name of readdirSync(dir)) {
    const file=path.join(dir,name);
    if(statSync(file).isDirectory()) visit(file);
    else if(/\.(tsx?|css|json)$/.test(name)) {
      for(const [,asset] of readFileSync(file,'utf8').matchAll(/["'`]((?:\/)?assets\/[^"'`]+)["'`]/g)) {
        if(asset.includes('${') || !/\.(webp|png|mp3|woff2|svg|jpg|jpeg)$/.test(asset)) continue;
        checked.add(asset);
        if(!existsSync(path.join(root,'public',asset.replace(/^\//,'')))) missing.push(`${path.relative(root,file)}: ${asset}`);
      }
    }
  }
}
visit(path.join(root,'src'));
if(missing.length) throw Error(`Missing product assets:\n${missing.join('\n')}`);
console.log(JSON.stringify({checked:checked.size,missing:0}));
