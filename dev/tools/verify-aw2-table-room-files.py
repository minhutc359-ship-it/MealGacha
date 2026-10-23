from pathlib import Path
from PIL import Image
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[2]
manifest=ROOT/'src/aw2/assets/kitchen-table.environment-v1.json'
d=json.loads(manifest.read_text());tracked=[manifest,ROOT/'dev/aw2/assets/environments/kitchen-table/v1/provenance.json']
result=[]
for name,a in d['assets'].items():
 src=ROOT/a['source']['path'];out=ROOT/a['url'][1:];im=Image.open(src).convert('RGBA');webp=Image.open(out).convert('RGBA')
 assert im.tobytes()==webp.tobytes();assert hashlib.sha256(src.read_bytes()).hexdigest()==a['source']['sha256'];assert hashlib.sha256(out.read_bytes()).hexdigest()==a['sha256']
 f=a['frame'];rect=(f['x'],f['y'],f['x']+f['width'],f['y']+f['height']);assert rect[0]>=0 and rect[1]>=0 and rect[2]<=im.width and rect[3]<=im.height
 alpha=im.getchannel('A');edges=[]
 if name=='sideboard':
  edges=[max(alpha.crop((rect[0],rect[1],rect[2],rect[1]+1)).getdata()),max(alpha.crop((rect[0],rect[3]-1,rect[2],rect[3])).getdata()),max(alpha.crop((rect[0],rect[1],rect[0]+1,rect[3])).getdata()),max(alpha.crop((rect[2]-1,rect[1],rect[2],rect[3])).getdata())]
  assert max(edges)<=8
  assert alpha.getextrema()==(0,255)
 else:assert alpha.getextrema()==(255,255)
 result.append({'asset':name,'width':im.width,'height':im.height,'runtimeBytes':out.stat().st_size,'decodedRgbaBytes':im.width*im.height*4,'maxFrameEdgeAlpha':max(edges)if edges else None,'exactRgba':'PASS'})
 tracked.extend([src,out])
before={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest()for p in tracked}
subprocess.run(['python3','dev/tools/build-aw2-table-room-assets.py'],cwd=ROOT,check=True,capture_output=True)
assert all(hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==s for p,s in before.items())
report={'task':'AW2-006B','status':'PASS','assets':result,'totalRuntimeBytes':sum(x['runtimeBytes']for x in result),'totalDecodedRgbaBytes':sum(x['decodedRgbaBytes']for x in result),'repeatBuild':{'status':'PASS','paths':before},'limits':'Decode/alpha/hash/repeat checks only; no independent art/device/rights acceptance.'}
out=ROOT/'.asset-work/aw2-006b';out.mkdir(exist_ok=True,parents=True);(out/'files.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items()if k!='repeatBuild'}))
