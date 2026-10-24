"""006H/J/K selected pixels, measured frame gutters, reference chain and repeat identity."""
import hashlib,json,subprocess
from pathlib import Path
from PIL import Image
R=Path(__file__).resolve().parents[2]
def h(p):return hashlib.sha256(p.read_bytes()).hexdigest()
paths=set();reports=[]
for name in ['kitchen-pantry','lantern-street','forgotten-kitchen-yard']:
 manifest=R/f'src/aw2/assets/{name}.environment-v1.json';s=json.loads(manifest.read_text());d=R/'dev/aw2/assets/environments'/name/'v1';paths.update([manifest,d/'provenance.json']);edges={};assets={}
 for key,a in s['assets'].items():
  source=R/a['source']['path'];runtime=R/a['url'][1:];paths.update([source,runtime])
  x=Image.open(source).convert('RGBA');y=Image.open(runtime).convert('RGBA')
  assert x.tobytes()==y.tobytes() and x.size==(a['width'],a['height'])
  assert h(source)==a['source']['sha256'] and h(runtime)==a['sha256'] and runtime.stat().st_size==a['bytes']
  assets[key]={'alpha':x.getchannel('A').getextrema(),'width':x.width,'height':x.height,'bytes':a['bytes']}
  if key=='props':
   alpha=x.getchannel('A');covered=Image.new('1',x.size)
   for f in s['frames'].values():
    # Inspect full frame edges; runtime sources are never edited or re-masked.
    l,t=f['x'],f['y'];r,b=l+f['width'],t+f['height'];assert 0<l<r<x.width and 0<t<b<x.height
    edge=max(max(alpha.crop(row).getdata()) for row in [(l,t,r,t+1),(l,b-1,r,b),(l,t,l+1,b),(r-1,t,r,b)])
    nameFrame=next(k for k,v in s['frames'].items() if v==f);edges[nameFrame]=edge;assert edge<=8
    covered.paste(1,(l,t,r,b))
   # Every visible source pixel must belong to a declared frame, no cut-off body/prop.
   pixels=alpha.point(lambda n:255 if n>8 else 0)
   from PIL import ImageChops
   assert ImageChops.subtract(pixels,covered.convert('L')).getbbox() is None
 for ref in [s['provenance']['prompts'],*s['provenance']['references']]:
  p=R/ref['path'];assert h(p)==ref['sha256']
  if 'gitBlob' in ref:
   b=p.read_bytes();assert hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==ref['gitBlob']
 selection=json.loads((d/'selection.json').read_text())
 for chosen in selection['selected']:assert h(R/chosen['savedPath'])==chosen['sourceSha256']
 assert s['budget']['compressedBytes']<=s['budget']['maxCompressedBytes'] and s['budget']['decodedRgbaBytes']<=s['budget']['maxDecodedRgbaBytes']
 reports.append({'name':name,'status':'PASS','exactRgba':True,'allAlphaAbove8Covered':True,'frames':s['frames'],'edgeAlpha':edges,'assets':assets,'budget':s['budget'],'selection':selection})
before={str(p.relative_to(R)):h(p) for p in sorted(paths)}
subprocess.run(['python3','dev/tools/build-aw2-journey-environments.py'],cwd=R,check=True,capture_output=True)
assert all(h(R/p)==digest for p,digest in before.items())
out=R/'.asset-work/aw2-006hjk';out.mkdir(parents=True,exist_ok=True)
report={'task':'AW2-006H/J/K','status':'PASS','reports':reports,'repeatHashes':before}
(out/'files.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'PASS','scenes':3,'repeatPaths':len(before),'frames':sum(len(s['frames']) for s in reports),'allVisibleAlphaCovered':True}))
