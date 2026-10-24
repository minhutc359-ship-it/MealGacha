"""006H/J/K: exact lossless encode and measured authored frames; never edit source pixels."""
import hashlib,json
from pathlib import Path
import PIL
from PIL import Image
R=Path(__file__).resolve().parents[2]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text())
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
old=read(R/'src/aw2/assets/covenant-village.environment-v2.json')
pantry_asset=None;crate_frame=None
for name,task,zone,keys in [('kitchen-pantry','AW2-006H','aw2-zone-kitchen-pantry',['hint','chest','crate']),('lantern-street','AW2-006J','aw2-zone-lantern-street',['lantern','breakfast','chair','water','cards','chess']),('forgotten-kitchen-yard','AW2-006K','aw2-zone-forgotten-kitchen-yard',['keeper','shortcut'])]:
 d=R/'dev/aw2/assets/environments'/name/'v1';ident=f'aw2-environment-{name}-v1';assets={};frames={};edges={}
 for kind in ['floor','props']:
  source=d/f'{kind}-source.png';runtime=d/f'{kind}.webp';im=Image.open(source).convert('RGBA');a=im.getchannel('A')
  assert a.getextrema()==(255,255) if kind=='floor' else a.getextrema()[0]==0 and a.getextrema()[1]>=250
  im.save(runtime,'WEBP',lossless=True,exact=True,method=6);assert Image.open(runtime).convert('RGBA').tobytes()==im.tobytes()
  assets[kind]={'id':ident+':'+kind,'url':'/'+str(runtime.relative_to(R)),'width':im.width,'height':im.height,'bytes':runtime.stat().st_size,'sha256':sha(runtime),'source':{'path':str(source.relative_to(R)),'bytes':source.stat().st_size,'sha256':sha(source)}}
  if kind=='props':
   opaque=a.point(lambda n:255 if n>8 else 0);cells=[];pad=2 if name=='lantern-street' else 4
   if name=='lantern-street':
    splits=[]
    for col in range(3):
     l=col*im.width//3;r=(col+1)*im.width//3;runs=[];start=None
     for y in range(im.height*43//100,im.height*60//100):
      empty=opaque.crop((l,y,r,y+1)).getbbox() is None
      if empty and start is None:start=y
      if not empty and start is not None:runs.append((start,y));start=None
     if start is not None:runs.append((start,im.height*60//100))
     gap=max(runs,key=lambda p:p[1]-p[0]);assert gap[1]-gap[0]>=5
     splits.append((gap[0]+gap[1])//2)
    cells=[(i*im.width//3,0,(i+1)*im.width//3,splits[i]) for i in range(3)]+[(i*im.width//3,splits[i],(i+1)*im.width//3,im.height) for i in range(3)]
   else:cells=[(i*im.width//len(keys),0,(i+1)*im.width//len(keys),im.height) for i in range(len(keys))]
   for key,cell in zip(keys,cells):
    b=opaque.crop(cell).getbbox();assert b
    f={'x':cell[0]+b[0]-pad,'y':cell[1]+b[1]-pad,'width':b[2]-b[0]+2*pad,'height':b[3]-b[1]+2*pad}
    l,t=f['x'],f['y'];r,bottom=l+f['width'],t+f['height'];assert 0<l<r<im.width and 0<t<bottom<im.height
    rows=[(l,t,r,t+1),(l,bottom-1,r,bottom),(l,t,l+1,bottom),(r-1,t,r,bottom)]
    edge=max(max(a.crop(row).getdata()) for row in rows);assert edge<=8,(key,edge)
    frames[key]=f;edges[key]=edge
 assets['threshold']=old['assets']['threshold']
 if name=='kitchen-pantry':pantry_asset=assets['props'];crate_frame=frames['crate']
 else:assets['obstacle']=pantry_asset
 if name!='kitchen-pantry':assets['foreground']=old['assets']['foreground']
 budget={'compressedBytes':sum(a['bytes'] for a in assets.values()),'decodedRgbaBytes':sum(a['width']*a['height']*4 for a in assets.values()),'maxCompressedBytes':7_000_000 if name=='kitchen-pantry' else 8_000_000,'maxDecodedRgbaBytes':40_000_000}
 assert budget['compressedBytes']<=budget['maxCompressedBytes'] and budget['decodedRgbaBytes']<=budget['maxDecodedRgbaBytes'],budget
 specs={'kitchen-pantry':[('aw2-object-hearth-hint','hint',48,.5),('aw2-chest-pantry','chest',40,.5)],'lantern-street':[('aw2-npc-va-den','lantern',48,1),('aw2-npc-nguoi-ban','breakfast',48,1),('aw2-npc-sua-ghe','chair',48,1),('aw2-npc-dem-nuoc','water',40,1),('aw2-npc-ban-bai','cards',64,1),('aw2-npc-ban-co','chess',64,1)],'forgotten-kitchen-yard':[('aw2-npc-gac-bep','keeper',48,1),('aw2-shortcut-yard-table','shortcut',58,1)]}[name]
 props=[]
 for entity,key,height,anchor in specs:
  f=frames[key];props.append({'entityId':entity,'asset':'props','frame':key,'width':round(height*f['width']/f['height'],6),'height':height,'anchorX':.5,'anchorY':anchor,'labelOffsetX':0,'labelOffsetY':-height-16 if anchor==1 else -height/2-16,'labelTransform':'translate(-50%, -100%)'})
 for direction in ['west','east']:
  props.append({'entityId':f'{zone}:exit:{direction}','asset':'threshold','frame':'threshold','width':36,'height':round(36*assets['threshold']['frame']['height']/assets['threshold']['frame']['width'],6),'anchorX':.5,'anchorY':.5,'labelOffsetX':0,'labelOffsetY':28,'labelTransform':'translate(-50%, 0)'})
 provenance={'tool':'OpenAI built-in image_gen','model':'not exposed by tool','date':'2026-10-24','prompts':{'path':str((d/'prompts.json').relative_to(R)),'sha256':sha(d/'prompts.json')},'references':read(d/'prompts.json')['references'],'licenseStatus':'REVIEW_REQUIRED','commercialRelease':'NOT_CLEARED','builder':'dev/tools/build-aw2-journey-environments.py','pillow':PIL.__version__,'processing':'SelectedPNGbytes unchanged; exactRGBAlosslessWebP; alpha>8 explicit measured frames (street per-column row split,2pxpadding; othercells4px); uniform logical sprite scale only. No source painting/masking/cropping/mirroring/warping.','reused':{'threshold':'AW2-006C/b350a11d777c1e8c94b5f2aadc6299b68f7e7722','obstacle':'This task pantry originalcrate','foreground':'AW2-006I/f0c1be37cef1c83416c5eb76be2943d1e768f2bc'}}
 for ref in provenance['references']:assert sha(R/ref['path'])==ref['sha256']
 fw,fh=assets['floor']['width'],assets['floor']['height'];assert fw==1536 and fh==1024
 scene={'version':1,'id':ident,'zoneId':zone,'status':'REFERENCE_ENVIRONMENT','fullEnvironmentComplete':False,'npcMotionComplete':False,'canvas':old['canvas'],'landscape':old['landscape'],'camera':old['camera'],'assets':assets,'frames':frames,'props':props,'obstacle':{'asset':'props' if name=='kitchen-pantry' else 'obstacle','frame':crate_frame,'x':320,'y':328,'width':64,'height':round(64*crate_frame['height']/crate_frame['width'],6),'anchorX':.5,'anchorY':.5,'sortY':352,'footprint':{'x':288,'y':304,'width':64,'height':48},'occludedAlpha':.35},'foliage':[] if name=='kitchen-pantry' else old['foliage'],'foregroundFrames':{} if name=='kitchen-pantry' else old['foregroundFrames'],'budget':budget,'provenance':provenance}
 write(R/f'src/aw2/assets/{name}.environment-v1.json',scene)
 write(d/'provenance.json',{'task':task,'generator':provenance,'assets':assets,'frames':frames,'frameEdgeAlpha':edges,'selection':read(d/'selection.json'),'calibration':{'walkDomain':[16,16,624,368],'inSource':[464,336,1072,688],'scenicApronOnly':True},'budget':budget,'limits':['Static original reference scene/NPCs; no new interiors/actions/rights or full-environment acceptance.','D20independent acceptance deferred; no device-memory claim.']})
 print(json.dumps({'task':task,'frames':frames,'edgeAlpha':edges,'budget':budget}))
