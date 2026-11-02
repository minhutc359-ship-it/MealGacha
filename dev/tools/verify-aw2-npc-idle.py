#!/usr/bin/env python3
"""Verify original pixels, alpha frames/feet, pinned references, and deterministic rebuild."""
from pathlib import Path
import hashlib,json,subprocess
from PIL import Image
R=Path(__file__).resolve().parents[2];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
p=R/'src/aw2/assets/npc-idle-v1.json';m=json.loads(p.read_text());paths=[p];count=0
for npc in m['npc']:
 a=npc['asset'];src=R/a['source']['path'];runtime=R/a['url'][1:];source=Image.open(src).convert('RGBA');web=Image.open(runtime).convert('RGBA')
 assert source.tobytes()==web.tobytes() and source.size==web.size==(a['width'],a['height'])
 assert source.getextrema()[3]==(0,255)
 assert sha(src)==a['source']['sha256'] and sha(runtime)==a['sha256']
 alpha=source.getchannel('A')
 for f in npc['frames'].values():
  cell=f['cellRegion'];frame=(f['x'],f['y'],f['x']+f['width'],f['y']+f['height'])
  edge=alpha.crop(frame);w,h=edge.size
  actual=max(max(edge.crop((0,0,w,1)).getdata()),max(edge.crop((0,h-1,w,h)).getdata()),max(edge.crop((0,0,1,h)).getdata()),max(edge.crop((w-1,0,w,h)).getdata()))
  assert actual==f['alphaEdgeMax']<=8
  bbox=alpha.crop((cell['x'],cell['y'],cell['x']+cell['width'],cell['y']+cell['height'])).point(lambda n:255 if n>8 else 0).getbbox()
  assert bbox and frame[0]<=cell['x']+bbox[0] and frame[1]<=cell['y']+bbox[1] and frame[2]>=cell['x']+bbox[2] and frame[3]>=cell['y']+bbox[3]
  assert abs(f['y']+f['anchorY']-(cell['y']+bbox[3]-1))<1e-6
  count+=1
 prov=npc['provenance']
 for ref in prov['references']:
  assert sha(R/ref['path'])==ref['sha256']
  assert hashlib.sha256(subprocess.check_output(['git','show',f"{ref['commit']}:{ref['path']}"],cwd=R)).hexdigest()==ref['sha256']
  assert subprocess.check_output(['git','rev-parse',f"{ref['commit']}:{ref['path']}"],text=True,cwd=R).strip()==ref['blob']
 folder=src.parent;paths.extend([src,runtime,folder/'prompts.json',folder/'selection.json',folder/'provenance.json'])
assert count==32
before={str(p.relative_to(R)):sha(p) for p in paths}
subprocess.run(['python3','dev/tools/build-aw2-npc-idle.py'],cwd=R,check=True)
assert before=={str(p.relative_to(R)):sha(p) for p in paths}
out=R/'.asset-work/aw2-006m';out.mkdir(parents=True,exist_ok=True)
(out/'files.json').write_text(json.dumps(dict(status='PASS',exactRgba=True,sourceUnchanged=True,alphaExtrema=[0,255],safeFrames=count,maxFrameEdgeAlpha=max(f['alphaEdgeMax'] for n in m['npc'] for f in n['frames'].values()),pinnedReferences=True,repeatIdenticalPaths=len(paths),sha256=before),indent=2)+'\n')
print('PASS8originals/exactRGBA/32safe frames/feet/pinned refs/repeat',len(paths),'paths')
