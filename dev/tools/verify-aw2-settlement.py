#!/usr/bin/env python3
"""Verify original PNGs, exactRGBA, safe frames, pinned refs and deterministic rebuild."""
from pathlib import Path
import hashlib,json,subprocess
from PIL import Image
R=Path(__file__).resolve().parents[2];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();p=R/'src/aw2/assets/settlement-v1.json';m=json.loads(p.read_text());paths=[p];count=0
for kind,a in m['assets'].items():
 src=R/a['source']['path'];web=R/a['url'][1:];im=Image.open(src).convert('RGBA');runtime=Image.open(web).convert('RGBA');assert im.tobytes()==runtime.tobytes() and im.size==runtime.size and im.getextrema()[3]==(0,255)
 assert sha(src)==a['source']['sha256'] and sha(web)==a['sha256']
 alpha=im.getchannel('A')
 for f in (f for f in m['frames'].values() if f['asset']==kind):
  c=f['cell'];bbox=alpha.crop((c['x'],c['y'],c['x']+c['width'],c['y']+c['height'])).point(lambda n:255 if n>8 else 0).getbbox();assert bbox
  assert f['x']<=c['x']+bbox[0] and f['y']<=c['y']+bbox[1] and f['x']+f['width']>=c['x']+bbox[2] and f['y']+f['height']>=c['y']+bbox[3]
  a=alpha.crop((f['x'],f['y'],f['x']+f['width'],f['y']+f['height']));w,h=a.size
  edge=max(max(a.crop((0,0,w,1)).getdata()),max(a.crop((0,h-1,w,h)).getdata()),max(a.crop((0,0,1,h)).getdata()),max(a.crop((w-1,0,w,h)).getdata()));assert edge==f['alphaEdgeMax']<=8;count+=1
 paths.extend([src,web,src.parent/f'{kind}-prompts.json',src.parent/f'{kind}-selection.json'])
for ref in m['provenance']['references']:
 assert sha(R/ref['path'])==ref['sha256']
 assert hashlib.sha256(subprocess.check_output(['git','show',f"{ref['commit']}:{ref['path']}"],cwd=R)).hexdigest()==ref['sha256']
 assert subprocess.check_output(['git','rev-parse',f"{ref['commit']}:{ref['path']}"],cwd=R,text=True).strip()==ref['blob']
paths.append(R/'dev/aw2/assets/environments/settlement/v1/provenance.json');before={str(p.relative_to(R)):sha(p) for p in paths}
subprocess.run(['python3','dev/tools/build-aw2-settlement.py'],cwd=R,check=True);assert before=={str(p.relative_to(R)):sha(p) for p in paths};assert count==8
out=R/'.asset-work/aw2-006o';out.mkdir(parents=True,exist_ok=True);(out/'files.json').write_text(json.dumps(dict(status='PASS',exactRgba=True,sourceUnchanged=True,safeFrames=count,maxFrameEdgeAlpha=max(f['alphaEdgeMax'] for f in m['frames'].values()),pinnedReferences=True,repeatIdenticalPaths=len(paths),sha256=before),indent=2)+'\n');print('PASS exactRGBA/8safe frames/pinned refs/repeat',len(paths),'paths')
