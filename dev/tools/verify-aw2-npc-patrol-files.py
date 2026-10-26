#!/usr/bin/env python3
"""016B exact recovered source, frame coverage, foot anchors and actual street budget."""
from pathlib import Path
import hashlib, json, subprocess
from PIL import Image

R=Path(__file__).resolve().parents[2]
read=lambda p:json.loads((R/p).read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
mp=R/'src/aw2/assets/dem-nuoc.patrol-v1.json'
m=json.loads(mp.read_text());a=m['asset'];src=R/a['source']['path'];runtime=R/a['url'][1:]
source=Image.open(src).convert('RGBA');built=Image.open(runtime).convert('RGBA')
assert source.size==built.size==(a['width'],a['height'])
assert source.tobytes()==built.tobytes()
assert sha(src)==a['source']['sha256'] and sha(runtime)==a['sha256']
assert subprocess.check_output(['git','hash-object',str(src)],text=True).strip()==m['provenance']['recoveredOriginalGitBlob']
alpha=built.getchannel('A');area=0;max_edge=0
for f in m['frames'].values():
 c=f['cellRegion'];area+=c['width']*c['height']
 cell=alpha.crop((c['x'],c['y'],c['x']+c['width'],c['y']+c['height']))
 bbox=cell.point(lambda n:255 if n>8 else 0).getbbox();assert bbox
 left,top=f['x']-c['x'],f['y']-c['y']
 assert 0<=left<=bbox[0] and 0<=top<=bbox[1]
 assert bbox[2]<=left+f['width']<=c['width'] and bbox[3]<=top+f['height']<=c['height']
 part=alpha.crop((f['x'],f['y'],f['x']+f['width'],f['y']+f['height']));w,h=part.size
 edge=max(max(part.crop(box).getdata()) for box in [(0,0,w,1),(0,h-1,w,h),(0,0,1,h),(w-1,0,w,h)])
 assert edge==f['alphaEdgeMax']<=8
 px=cell.load();contact=[x for y in range(max(bbox[1],bbox[3]-32),bbox[3]) for x in range(bbox[0],bbox[2]) if px[x,y]>32]
 assert abs(sum(contact)/len(contact)-left-f['anchorX'])<.000001
 assert f['anchorY']==bbox[3]-top-1
 max_edge=max(max_edge,edge)
assert area==1254*1254 and len(m['frames'])==16
for ref in m['provenance']['references']:
 assert sha(R/ref['path'])==ref['sha256']
 assert subprocess.check_output(['git','rev-parse',ref['commit']+':'+ref['path']],cwd=R,text=True).strip()==ref['blob']
 assert hashlib.sha256(subprocess.check_output(['git','show',ref['commit']+':'+ref['path']],cwd=R)).hexdigest()==ref['sha256']
paths=[mp,src,runtime,src.parent/'prompts.json',src.parent/'provenance.json']
before={str(p.relative_to(R)):sha(p) for p in paths}
subprocess.run(['python3','dev/tools/build-aw2-npc-patrol.py'],cwd=R,check=True,capture_output=True)
assert before=={str(p.relative_to(R)):sha(p) for p in paths}
scene=read('src/aw2/assets/lantern-street.environment-v1.json')
idle=read('src/aw2/assets/npc-idle-v1.json')
settlement=read('src/aw2/assets/settlement-v1.json')
ambient=read('src/aw2/assets/ambient-motion-v1.json')
assets=[a for key,a in scene['assets'].items() if key!='props']
assets += [m['asset'] if n['entityId']==m['entityId'] else n['asset'] for n in idle['npc'] if n['zoneId']==m['zoneId']]
assets += list(settlement['assets'].values())
assets += [ambient['assets']['street-lantern']]
unique={a['url']:a for a in assets};assert len(unique)==len(assets)
for a in assets:assert (R/a['url'][1:]).stat().st_size==a['bytes']
budget=dict(requiredTextures=len(assets),compressedBytes=sum(a['bytes'] for a in assets),decodedRgbaBytes=sum(a['width']*a['height']*4 for a in assets),maxCompressedBytes=18_000_000,maxDecodedRgbaBytes=80_000_000,leader='Separate chosen leader atlas; not measured total GPU memory')
assert budget['compressedBytes']<=budget['maxCompressedBytes'] and budget['decodedRgbaBytes']<=budget['maxDecodedRgbaBytes']
out=R/'.asset-work/aw2-016b';out.mkdir(parents=True,exist_ok=True)
report=dict(task='AW2-016B',status='PASS',sourceUnchanged=True,exactRgba=True,safeFrames=16,maxFrameEdgeAlpha=max_edge,fullCellCoverage=True,measuredFootAnchors=True,pinnedReference=True,repeatIdenticalPaths=5,sha256=before,budget=budget,requiredUrls=list(unique),exactPromptStatus=m['provenance']['exactPromptStatus'],rights='REVIEW_REQUIRED / NOT_CLEARED')
(out/'files.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
