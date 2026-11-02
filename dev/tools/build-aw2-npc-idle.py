#!/usr/bin/env python3
"""006M: preserve originals, encode exact RGBA and measure four safe idle frames."""
import hashlib,json
from pathlib import Path
from PIL import Image,__version__ as pillow_version
R=Path(__file__).resolve().parents[2]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text())
def write(p,obj):p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
entries=[]
ids=['giu-cho','va-den','nguoi-ban','sua-ghe','dem-nuoc','ban-bai','ban-co','gac-bep']
heights=[48,48,48,48,40,64,64,48]
for index,(short,height) in enumerate(zip(ids,heights)):
 d=R/'dev/aw2/assets/npcs'/short/'idle-v1';p=read(d/'prompts.json');selection=read(d/'selection.json');src=d/'idle-source.png';web=d/'idle.webp'
 assert sha(src)==selection['sha256']
 im=Image.open(src).convert('RGBA');w,h=im.size;assert w%2==h%2==0 and w*h*4<=8_000_000
 assert im.getextrema()[3]==(0,255)
 im.save(web,format='WEBP',lossless=True,exact=True,method=6)
 assert Image.open(web).convert('RGBA').tobytes()==im.tobytes()
 frames={}
 splits=[]
 for col in range(2):
  candidates=[]
  for row in range(int(h*.43),int(h*.57)):
   if max(im.getchannel('A').crop((col*(w//2),row-1,(col+1)*(w//2),row+1)).getdata())<=8:candidates.append(row)
  assert candidates,(short,col,'no safe row gutter')
  splits.append(min(candidates,key=lambda row:abs(row-h/2)))
 for i,name in enumerate(['neutral','breath','blink','gesture']):
  cx=(i%2)*(w//2);cy=0 if i<2 else splits[i%2];cw=w//2;ch=splits[i%2] if i<2 else h-cy
  # Measurement crops only: never save modified pixels or derived PNGs.
  alpha=im.getchannel('A').crop((cx,cy,cx+cw,cy+ch));bbox=alpha.point(lambda n:255 if n>8 else 0).getbbox();assert bbox
  l,t,r,b=bbox;l=max(0,l-4);t=max(0,t-4);r=min(cw,r+4);b=min(ch,b+4)
  edge=max(max(alpha.crop((l,t,r,t+1)).getdata()),max(alpha.crop((l,b-1,r,b)).getdata()),max(alpha.crop((l,t,l+1,b)).getdata()),max(alpha.crop((r-1,t,r,b)).getdata()))
  assert edge<=8,(short,name,edge)
  pixels=alpha.load();contact=[x for y in range(max(bbox[1],bbox[3]-32),bbox[3]) for x in range(bbox[0],bbox[2]) if pixels[x,y]>32];assert contact
  foot_x=sum(contact)/len(contact)
  frames[name]=dict(cellRegion=dict(x=cx,y=cy,width=cw,height=ch),x=cx+l,y=cy+t,width=r-l,height=b-t,anchorX=round(foot_x-l,6),anchorY=bbox[3]-t-1,alphaEdgeMax=edge,footMeasurement='Mean opaque alpha>32 contact in last32source rows; bottom alpha>8 row. Frame0 height fixes common scale; no per-pose scaling.')
 assert web.stat().st_size<=2_000_000
 asset=dict(id=p['entityId']+':idle-v1',url='/'+str(web.relative_to(R)),width=w,height=h,bytes=web.stat().st_size,sha256=sha(web),source=dict(path=str(src.relative_to(R)),bytes=src.stat().st_size,sha256=sha(src)))
 provenance=dict(task='AW2-006M',tool=p['tool'],model='not exposed by tool',date='2026-10-24',prompts=dict(path=str((d/'prompts.json').relative_to(R)),sha256=sha(d/'prompts.json')),references=p['references'],selection=dict(path=str((d/'selection.json').relative_to(R)),sha256=sha(d/'selection.json')),licenseStatus='REVIEW_REQUIRED',commercialRelease='NOT_CLEARED',builder='dev/tools/build-aw2-npc-idle.py',pillow=pillow_version,processing='Unchanged selected original transparent PNG; exact RGBA lossless WebP. Read-only alpha measurements for safe texture rectangles/feet. No pixel painting/masking/erasing/mirroring/resizing/interpolation.')
 entry=dict(entityId=p['entityId'],displayName=p['displayName'],zoneId=p['zoneId'],asset=asset,frames=frames,display=dict(neutralHeight=height,scale=round(height/frames['neutral']['height'],12)),phaseMs=index*137,status='AUTHORED_IDLE_REFERENCE',idleMotionComplete=True,locomotionComplete=False,fullNpcComplete=False,provenance=provenance)
 entries.append(entry);write(d/'provenance.json',provenance)
 print(short,im.size,asset['bytes'],[(k,v['width'],v['height'],v['alphaEdgeMax']) for k,v in frames.items()])
# Inventory includes only textures actually required for the selected zone; chosen leader separate.
regions=[]
for zone,version in [('covenant-village','v2'),('lantern-street','v1'),('forgotten-kitchen-yard','v1')]:
 scene=read(R/f'src/aw2/assets/{zone}.environment-{version}.json');assets=[a for key,a in scene['assets'].items() if not(zone=='lantern-street' and key=='props')]+[e['asset'] for e in entries if e['zoneId']==scene['zoneId']]
 budget=dict(compressedBytes=sum(a['bytes'] for a in assets),decodedRgbaBytes=sum(a['width']*a['height']*4 for a in assets),maxCompressedBytes=15_000_000,maxDecodedRgbaBytes=80_000_000)
 assert budget['compressedBytes']<=budget['maxCompressedBytes'] and budget['decodedRgbaBytes']<=budget['maxDecodedRgbaBytes']
 regions.append(dict(zoneId=scene['zoneId'],requiredAssetIds=[a['id'] for a in assets],budget=budget))
 print(zone,budget)
manifest=dict(version=1,id='aw2-npc-idle-v1',status='AUTHORED_IDLE_REFERENCE',npcCount=8,authoredFrameCount=32,fullNpcComplete=False,locomotionComplete=False,timeline=[dict(frame=k,durationMs=ms) for k,ms in [('neutral',450),('breath',250),('neutral',300),('blink',110),('neutral',650),('gesture',400),('breath',250),('neutral',650)]],cycleMs=3060,reducedMotionFrame='neutral',npc=entries,regions=regions)
assert sum(s['durationMs'] for s in manifest['timeline'])==manifest['cycleMs']
write(R/'src/aw2/assets/npc-idle-v1.json',manifest)
