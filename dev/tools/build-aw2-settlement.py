#!/usr/bin/env python3
"""006O architectural layers; unchanged source PNG, exact RGBA and measured safe frames."""
from pathlib import Path
import json,hashlib
from PIL import Image,__version__ as pillow_version
R=Path(__file__).resolve().parents[2];root=R/'dev/aw2/assets/environments/settlement/v1';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text())
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
assets={};frames={}
for kind,names in [('homes',['home','tea','grocery','playground']),('shops',['lantern','breakfast','workshop','games'])]:
 src=root/f'{kind}-source.png';web=root/f'{kind}.webp';im=Image.open(src).convert('RGBA');w,h=im.size;alpha=im.getchannel('A');assert im.getextrema()[3]==(0,255)
 assert sha(src)==read(root/f'{kind}-selection.json')['sha256']
 im.save(web,format='WEBP',lossless=True,exact=True,method=6);assert Image.open(web).convert('RGBA').tobytes()==im.tobytes()
 # Find actual transparent gutters rather than assuming equal generated row placement.
 candidates=[y for y in range(int(h*.4),int(h*.6)) if max(alpha.crop((0,y-1,w,y+1)).getdata())<=8]
 assert candidates,(kind,'no horizontal gutter')
 rowcut=min(candidates,key=lambda y:abs(y-h/2));colcuts=[]
 for y0,y1 in [(0,rowcut),(rowcut,h)]:
  candidates=[x for x in range(int(w*.4),int(w*.6)) if max(alpha.crop((x-1,y0,x+1,y1)).getdata())<=8]
  assert candidates,(kind,y0,'no safe column gutter')
  colcuts.append(min(candidates,key=lambda x:abs(x-w/2)))
 for i,name in enumerate(names):
  row=i//2;cut=colcuts[row];x=0 if i%2==0 else cut;y=0 if row==0 else rowcut
  cw=cut if i%2==0 else w-cut;ch=rowcut if row==0 else h-rowcut
  a=alpha.crop((x,y,x+cw,y+ch));b=a.point(lambda n:255 if n>8 else 0).getbbox();assert b
  l,t,r,bt=max(0,b[0]-4),max(0,b[1]-4),min(cw,b[2]+4),min(ch,b[3]+4)
  edge=max(max(a.crop((l,t,r,t+1)).getdata()),max(a.crop((l,bt-1,r,bt)).getdata()),max(a.crop((l,t,l+1,bt)).getdata()),max(a.crop((r-1,t,r,bt)).getdata()))
  assert edge<=8,(kind,name,edge)
  frames[name]=dict(asset=kind,x=x+l,y=y+t,width=r-l,height=bt-t,alphaEdgeMax=edge,cell=dict(x=x,y=y,width=cw,height=ch))
 assets[kind]=dict(id=f'aw2-settlement-v1:{kind}',url='/'+str(web.relative_to(R)),width=w,height=h,bytes=web.stat().st_size,sha256=sha(web),source=dict(path=str(src.relative_to(R)),bytes=src.stat().st_size,sha256=sha(src)))
 print(kind,(w,h),assets[kind]['bytes'])
def building(id,frame,x,y,width):
 f=frames[frame];height=width*f['height']/f['width']
 return dict(id=id,frame=frame,x=x,y=y,width=width,height=round(height,6),anchorX=.5,anchorY=1,depth=y,occludedAlpha=.25,solidBase=dict(x=round(x-width/2,6),y=round(y-height*.28,6),width=width,height=round(height*.28,6)))
regions=[]
for zone in ['covenant-village','lantern-street','forgotten-kitchen-yard']:
 B=[]
 if zone=='covenant-village':
  for i,(f,x) in enumerate([('home',72),('tea',300),('grocery',528)]):B.append(building(f'village-north-{i}',f,x,4,184))
  for i,(f,y) in enumerate([('home',142),('tea',360)]):B.append(building(f'village-west-{i}',f,-104,y,208))
  for i,(f,y) in enumerate([('grocery',136),('home',350)]):B.append(building(f'village-east-{i}',f,744,y,208))
  B.extend([building('village-south-home','home',80,466,180),building('village-south-tea','tea',552,466,180),building('village-playground','playground',320,468,240)])
  landmarks=[dict(id='courtyard',name='Ngõ nhà dân',x=96,y=80),dict(id='tea',name='Hiên tiệm trà',x=300,y=48),dict(id='playground',name='Lối tới sân chơi',x=432,y=364)]
 elif zone=='lantern-street':
  for f,x,width in [('lantern',160,118),('breakfast',280,118),('workshop',392,118),('grocery',504,118)]:B.append(building('street-front-'+f,f,x,6,width))
  for i,(f,y) in enumerate([('home',140),('tea',370)]):B.append(building(f'street-west-{i}',f,-104,y,208))
  for i,(f,y) in enumerate([('grocery',150),('home',370)]):B.append(building(f'street-east-{i}',f,744,y,208))
  B.extend([building('street-cards-house','games',240,466,160),building('street-chess-house','games',432,466,160),building('street-south-shop','tea',64,466,148),building('street-playground','playground',624,466,164)])
  landmarks=[dict(id='shops',name='Dãy tiệm đầu phố',x=96,y=80),dict(id='games',name='Sân nhà chơi bài/cờ',x=432,y=320),dict(id='tea',name='Lối tới quầy trà',x=96,y=364)]
 else:
  for i,(f,x) in enumerate([('home',96),('breakfast',320),('grocery',544)]):B.append(building(f'yard-north-{i}',f,x,6,184))
  for i,(f,y) in enumerate([('workshop',150),('home',366)]):B.append(building(f'yard-west-{i}',f,-104,y,208))
  for i,(f,y) in enumerate([('tea',160),('grocery',360)]):B.append(building(f'yard-east-{i}',f,744,y,208))
  B.extend([building('yard-south-home','home',80,466,180),building('yard-storehouse','grocery',552,466,180),building('yard-playground','playground',320,468,240)])
  landmarks=[dict(id='kitchen',name='Hiên bếp cộng đồng',x=320,y=64),dict(id='homes',name='Ngõ nhà sau bếp',x=96,y=80),dict(id='playground',name='Lối tới sân chơi',x=432,y=364)]
 # Conservative complete-width lower28%base must remain outside original16..624/16..368domain.
 for b in B:
  f=b['solidBase'];assert f['x']+f['width']<=6 or f['x']>=634 or f['y']+f['height']<=6 or f['y']>=378,(zone,b)
 original=read(R/f'src/aw2/assets/{zone}.environment-{"v2" if zone=="covenant-village" else "v1"}.json');npcbudget=next(r['budget'] for r in read(R/'src/aw2/assets/npc-idle-v1.json')['regions'] if r['zoneId']==original['zoneId'])
 budget=dict(compressedBytes=npcbudget['compressedBytes']+sum(a['bytes'] for a in assets.values()),decodedRgbaBytes=npcbudget['decodedRgbaBytes']+sum(a['width']*a['height']*4 for a in assets.values()),maxCompressedBytes=18_000_000,maxDecodedRgbaBytes=80_000_000)
 assert budget['compressedBytes']<=budget['maxCompressedBytes'] and budget['decodedRgbaBytes']<=budget['maxDecodedRgbaBytes'],budget
 regions.append(dict(zoneId=original['zoneId'],buildings=B,landmarks=landmarks,budget=budget))
provenance=dict(task='AW2-006O',tool='OpenAI built-in image_gen',model='not exposed by tool',date='2026-10-24',prompts=[dict(path=str((root/f'{k}-prompts.json').relative_to(R)),sha256=sha(root/f'{k}-prompts.json')) for k in assets],references=read(root/'homes-prompts.json')['references'],licenseStatus='REVIEW_REQUIRED',commercialRelease='NOT_CLEARED',processing='Unchanged selected PNGs; exactRGBA losslessWebP; measured safe cells. Uniform render scale only; no code painting/masking/mirroring/resizing.',builder='dev/tools/build-aw2-settlement.py',pillow=pillow_version)
manifest=dict(version=1,id='aw2-settlement-v1',status='REFERENCE_ARCHITECTURE',fullEnvironmentComplete=False,geometryAuthorityChanged=False,followZoom=.65,assets=assets,frames=frames,regions=regions,provenance=provenance)
write(root/'provenance.json',provenance);write(R/'src/aw2/assets/settlement-v1.json',manifest)
print('PASS',sum(len(r['buildings']) for r in regions),'structures',[(r['zoneId'],r['budget']) for r in regions])
