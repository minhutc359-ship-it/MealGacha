#!/usr/bin/env python3
"""Verify AW2-006N transparent sources, exact runtime pixels and pinned references."""
from pathlib import Path
import hashlib,json,subprocess
from PIL import Image

R=Path(__file__).resolve().parents[2]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest_path=R/'src/aw2/assets/ambient-motion-v1.json'
m=json.loads(manifest_path.read_text());paths=[manifest_path];safe=0;max_edge=0
for kind,asset in m['assets'].items():
 src=R/asset['source']['path'];runtime=R/asset['url'][1:]
 source=Image.open(src).convert('RGBA');built=Image.open(runtime).convert('RGBA');c=asset['source']['crop']
 exact=source.crop((c['x'],c['y'],c['x']+c['width'],c['y']+c['height']))
 assert exact.size==built.size and exact.tobytes()==built.tobytes()
 assert sha(src)==asset['source']['sha256'] and sha(runtime)==asset['sha256']
 assert json.loads((src.parent/f'{kind}-selection.json').read_text())['sha256']==sha(src)
 alpha=built.getchannel('A')
 for frame in asset['frames'].values():
  box=(frame['x'],frame['y'],frame['x']+frame['width'],frame['y']+frame['height'])
  crop=alpha.crop(box);w,h=crop.size
  edge=max(max(crop.crop((0,0,w,1)).getdata()),max(crop.crop((0,h-1,w,h)).getdata()),max(crop.crop((0,0,1,h)).getdata()),max(crop.crop((w-1,0,w,h)).getdata()))
  assert edge==frame['alphaEdgeMax']<=8
  safe+=1;max_edge=max(max_edge,edge)
 paths += [src,runtime,src.parent/f'{kind}-prompts.json',src.parent/f'{kind}-selection.json']
for ref in m['provenance']['references']:
 assert sha(R/ref['path'])==ref['sha256']
 assert subprocess.check_output(['git','rev-parse',f"{ref['commit']}:{ref['path']}"],cwd=R,text=True).strip()==ref['blob']
 assert hashlib.sha256(subprocess.check_output(['git','show',f"{ref['commit']}:{ref['path']}"],cwd=R)).hexdigest()==ref['sha256']
paths.append(R/'dev/aw2/assets/environments/ambient/v1/provenance.json')
before={str(p.relative_to(R)):sha(p) for p in paths}
subprocess.run(['python3','dev/tools/build-aw2-ambient-motion.py'],cwd=R,check=True)
assert before=={str(p.relative_to(R)):sha(p) for p in paths} and safe==8
out=R/'.asset-work/aw2-006n';out.mkdir(parents=True,exist_ok=True)
(out/'files.json').write_text(json.dumps(dict(status='PASS',exactRgba=True,sourceUnchanged=True,safeFrames=safe,maxFrameEdgeAlpha=max_edge,pinnedReferences=True,repeatIdenticalPaths=len(paths),sha256=before),indent=2)+'\n')
print('PASS exactRGBA/8safe frames/pinned refs/repeat',len(paths),'paths')
