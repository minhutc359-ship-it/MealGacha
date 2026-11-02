#!/usr/bin/env python3
"""Build AW2-006N from unchanged generated PNGs into exact RGBA lossless WebP."""
from pathlib import Path
import hashlib,json
from PIL import Image,__version__ as pillow_version
R=Path(__file__).resolve().parents[2];root=R/'dev/aw2/assets/environments/ambient/v1'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text())
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
specs={
 'village-water':dict(zoneId='aw2-zone-covenant-village',displayWidth=76,displayHeight=38,depth=-850,placements=[(-300,220),(940,236)]),
 'street-lantern':dict(zoneId='aw2-zone-lantern-street',displayWidth=24,displayHeight=24,depth=7,placements=[(109,-53),(209,-53),(345,-37),(439,-37)]),
}
assets={};regions=[];names=['calm','lift','bright','settle']
for kind,spec in specs.items():
 src=root/f'{kind}-source.png';web=root/f'{kind}.webp';im=Image.open(src).convert('RGBA');w,h=im.size
 assert read(root/f'{kind}-selection.json')['sha256']==sha(src) and im.getextrema()[3][0]==0
 alpha=im.getchannel('A');frames={}
 full=alpha.point(lambda n:255 if n>8 else 0).getbbox();assert full
 sx0,sy0,sx1,sy1=max(0,full[0]-12),max(0,full[1]-12),min(w,full[2]+12),min(h,full[3]+12)
 runtime=im.crop((sx0,sy0,sx1,sy1));runtime.save(web,format='WEBP',lossless=True,exact=True,method=6)
 assert Image.open(web).convert('RGBA').tobytes()==runtime.tobytes()
 for i,name in enumerate(names):
  x0=i*w//4;x1=(i+1)*w//4;a=alpha.crop((x0,0,x1,h));b=a.point(lambda n:255 if n>8 else 0).getbbox();assert b
  l,t,r,bt=max(0,b[0]-8),max(0,b[1]-8),min(x1-x0,b[2]+8),min(h,b[3]+8)
  edge=max(max(a.crop((l,t,r,t+1)).getdata()),max(a.crop((l,bt-1,r,bt)).getdata()),max(a.crop((l,t,l+1,bt)).getdata()),max(a.crop((r-1,t,r,bt)).getdata()))
  assert edge<=8,(kind,name,edge)
  frames[name]=dict(x=x0+l-sx0,y=t-sy0,width=r-l,height=bt-t,alphaEdgeMax=edge,cell=dict(x=x0-sx0,y=-sy0,width=x1-x0,height=h))
 rw,rh=runtime.size
 asset=dict(id=f'aw2-ambient-v1:{kind}',url='/'+str(web.relative_to(R)),width=rw,height=rh,bytes=web.stat().st_size,sha256=sha(web),source=dict(path=str(src.relative_to(R)),bytes=src.stat().st_size,sha256=sha(src),width=w,height=h,crop=dict(x=sx0,y=sy0,width=rw,height=rh)),frames=frames)
 assets[kind]=asset
 regions.append(dict(zoneId=spec['zoneId'],asset=kind,display=dict(width=spec['displayWidth'],height=spec['displayHeight']),depth=spec['depth'],placements=[dict(id=f'{kind}-{i+1}',x=x,y=y) for i,(x,y) in enumerate(spec['placements'])]))
refs=read(root/'village-water-prompts.json')['references']+read(root/'street-lantern-prompts.json')['references']
provenance=dict(task='AW2-006N',tool='OpenAI built-in image_gen',model='not exposed by tool',date='2026-10-25',calls=2,selected=2,rejected=0,prompts=[dict(path=str((root/f'{k}-prompts.json').relative_to(R)),sha256=sha(root/f'{k}-prompts.json')) for k in specs],references=refs,licenseStatus='REVIEW_REQUIRED',commercialRelease='NOT_CLEARED',processing='Unchanged selected transparent PNG; transparent-margin crop only; exact RGBA lossless WebP; measured safe frames. No code painting, masking, mirroring, resizing or interpolation.',builder='dev/tools/build-aw2-ambient-motion.py',pillow=pillow_version)
manifest=dict(version=1,id='aw2-ambient-motion-v1',status='AUTHORED_AMBIENT_REFERENCE',fullEnvironmentComplete=False,geometryAuthorityChanged=False,timeline=[dict(frame='calm',durationMs=800),dict(frame='lift',durationMs=800),dict(frame='bright',durationMs=800),dict(frame='settle',durationMs=800)],cycleMs=3200,reducedMotionFrame='calm',assets=assets,regions=regions,provenance=provenance)
write(root/'provenance.json',provenance);write(R/'src/aw2/assets/ambient-motion-v1.json',manifest)
print('PASS',sum(len(r['placements']) for r in regions),'placements',sum(len(a['frames']) for a in assets.values()),'frames')
