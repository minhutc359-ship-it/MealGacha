"""AW2-006B: encode selected image_gen pixels losslessly and measure renderer metadata.
No painting, masking, mirroring or resizing of authored sources.
"""
from pathlib import Path
import hashlib,json
from PIL import Image,ImageChops
import PIL
ROOT=Path(__file__).resolve().parents[2]
DIR=ROOT/'dev/aw2/assets/environments/kitchen-table/v1'
URL='/dev/aw2/assets/environments/kitchen-table/v1/'
SCENE='aw2-environment-kitchen-table-v1'
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
assets={}
for name in ['floor','sideboard']:
 source=DIR/f'{name}-source.png';target=DIR/f'{name}.webp'
 image=Image.open(source).convert('RGBA')
 image.save(target,'WEBP',lossless=True,method=6,exact=True)
 decoded=Image.open(target).convert('RGBA')
 assert decoded.tobytes()==image.tobytes(),f'RGBA mismatch: {name}'
 alpha=image.getchannel('A')
 if name=='floor':
  assert alpha.getextrema()==(255,255)
  box=(0,0,image.width,image.height)
 else:
  bounds=alpha.point(lambda p:255 if p>8 else 0).getbbox();assert bounds
  box=(max(0,bounds[0]-4),max(0,bounds[1]-4),min(image.width,bounds[2]+4),min(image.height,bounds[3]+4))
  assert alpha.getextrema()==(0,255)
  assert sum(v==0 for v in alpha.getdata())/len(alpha.getdata())>.35
 x,y,right,bottom=box
 assets[name]={'id':f'{SCENE}:{name}','url':URL+target.name,'width':image.width,'height':image.height,'bytes':target.stat().st_size,'sha256':digest(target),'source':{'path':str(source.relative_to(ROOT)),'bytes':source.stat().st_size,'sha256':digest(source)},'frame':{'x':x,'y':y,'width':right-x,'height':bottom-y}}
propHeight=round(80*assets['sideboard']['frame']['height']/assets['sideboard']['frame']['width'],4)
manifest={'version':1,'id':SCENE,'zoneId':'aw2-zone-kitchen-table','status':'REFERENCE_ENVIRONMENT','fullEnvironmentComplete':False,'canvas':{'width':640,'height':384},'assets':assets,'prop':{'asset':'sideboard','x':320,'y':352,'width':80,'height':propHeight,'anchorX':.5,'anchorY':1,'sortY':352,'occludedAlpha':.35,'footprint':{'x':288,'y':304,'width':64,'height':48}},'bossMarker':{'entityId':'aw2-enemy-forgotten-host','manifest':'forgotten-host.reference-v1','frame':'battle.idle','height':56,'status':'STATIC_BATTLE_REFERENCE_NOT_WORLD_MODEL'},'provenance':{'tool':'OpenAI built-in image_gen','model':'not exposed by tool','date':'2026-10-23','prompts':URL+'prompts.json','externalReferences':[],'licenseStatus':'REVIEW_REQUIRED','commercialRelease':'NOT_CLEARED','processing':'Unchanged selected PNGs; lossless exact RGBA WebP encoding; measured alpha-safe texture frame with tolerance8 and4px padding; uniform logical prop scale. No painting/masking/mirroring/resizing.','builder':'dev/tools/build-aw2-table-room-assets.py','pillow':PIL.__version__}}
(ROOT/'src/aw2/assets/kitchen-table.environment-v1.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
provenance={'task':'AW2-006B','id':SCENE,'generator':manifest['provenance'],'selected':[{'generation':'floor-v1','source':assets['floor']['source']['path'],'generatedFile':'/home/sotatek/.codex/generated_images/01a16283-7855-7dc1-b115-9664e1dc7e24/exec-84891b86-9a7a-4284-ace3-dc286f75377c.png'},{'generation':'sideboard-v1','source':assets['sideboard']['source']['path'],'generatedFile':'/home/sotatek/.codex/generated_images/01a16283-7855-7dc1-b115-9664e1dc7e24/exec-436d8581-3fbe-4f09-a2f1-0c9181fcc51f.png'}],'builtInCalls':2,'rejected':[],'assets':assets,'observedLimits':['Floor contains decorative hanging-lantern corners; overhead decor does not change walkable geometry.','Sideboard has wider actual aspect than approximate prompt; measured frame/uniform render scale preserves it.','Static boss marker reuses original own battle idle frame; full world4direction/motion still absent.','Independent full-room/art/device/rights acceptance remains open.']}
(DIR/'provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':'PASS','assets':{k:{'size':[v['width'],v['height']],'frame':v['frame'],'bytes':v['bytes']}for k,v in assets.items()},'propHeight':propHeight}))
