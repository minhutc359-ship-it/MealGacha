"""Pack selected original tea-room art; no source painting/masking/resizing."""
from pathlib import Path
import hashlib,json,subprocess
from PIL import Image,__version__ as pillow
root=Path(__file__).resolve().parents[2];folder=root/'dev/aw2/assets/environments/village-tea/v1'
hashfile=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assets={}
for name in ['floor','props']:
 source=folder/f'{name}-source.png';target=folder/f'{name}.webp';im=Image.open(source).convert('RGBA')
 im.save(target,'WEBP',lossless=True,method=6,exact=True)
 assert Image.open(target).convert('RGBA').tobytes()==im.tobytes()
 assets[name]={'id':f'aw2-environment-village-tea-v1:{name}','url':'/'+str(target.relative_to(root)),
 'width':im.width,'height':im.height,'bytes':target.stat().st_size,'sha256':hashfile(target),
 'source':{'path':str(source.relative_to(root)),'bytes':source.stat().st_size,'sha256':hashfile(source)}}
a=Image.open(folder/'props-source.png').convert('RGBA').getchannel('A');frames={}
for name,x0,x1 in [('party',0,548),('journal',548,1024),('exit',1024,1536)]:
 b=a.crop((x0,0,x1,a.height)).point(lambda v:255 if v>8 else 0).getbbox();assert b
 x,y,right,bottom=b;x=max(0,x-2);y=max(0,y-2);right=min(x1-x0,right+2);bottom=min(a.height,bottom+2)
 frames[name]={'x':x+x0,'y':y,'width':right-x,'height':bottom-y}
 assert frames[name]['x']>0 and frames[name]['x']+frames[name]['width']<1536
meta={'version':1,'id':'aw2-environment-village-tea-v1','sceneId':'aw2-room-village-tea','zoneId':'aw2-zone-covenant-village',
 'status':'REFERENCE_ENVIRONMENT','fullEnvironmentComplete':False,'canvas':{'width':640,'height':384},
 'landscape':{'x':-448,'y':-320,'width':1536,'height':1024},
 'camera':{'followZoom':0.8,'overviewZoom':0.42,'centerX':320,'centerY':192},'assets':assets,'frames':frames,
 'props':[
 {'entityId':'aw2-object-tea-party-desk','frame':'party','x':240,'y':96,'width':108,'depth':128},
 {'entityId':'aw2-object-tea-journal-desk','frame':'journal','x':432,'y':96,'width':94,'depth':128},
 {'entityId':'aw2-object-tea-exit','frame':'exit','x':24,'y':192,'width':56,'depth':1}],
 'budget':{'newCompressedBytes':sum(v['bytes']for v in assets.values()),'newDecodedRgbaBytes':sum(v['width']*v['height']*4 for v in assets.values()),'maxNewCompressedBytes':4000000,'maxRequiredDecodedRgbaBytes':24000000},
 'provenance':{'tool':'OpenAI built-in image_gen','model':'not exposed by tool','date':'2026-10-27','licenseStatus':'REVIEW_REQUIRED','commercialRelease':'NOT_CLEARED','prompts':{'path':str((folder/'prompts.json').relative_to(root)),'sha256':hashfile(folder/'prompts.json')},'references':[{'path':'dev/aw2/assets/environments/kitchen-table/v2/landscape-source.png','commit':'d459b30bf884778576065a95a713304ea71e65c0','sha256':hashfile(root/'dev/aw2/assets/environments/kitchen-table/v2/landscape-source.png'),'role':'Own project art style/camera/palette reference; not an edit target'}],
 'builder':'dev/tools/build-aw2-tea-room.py','pillow':pillow,'processing':'Selected PNG bytes unchanged; exact-RGBA lossless WebP. Three measured alpha>8 frames with2px padding within explicit nonoverlapping columns; no paint/mask/mirror/resize/source cropping. Uniform logical display scale only.'}}
assert meta['budget']['newCompressedBytes']<=4000000
(root/'src/aw2/assets/village-tea.environment-v1.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'assets':assets,'frames':frames,'budget':meta['budget']},ensure_ascii=False))
