"""Register Imagegen portraits and transposed 3x4 VFX; crop/resize/compress only.
Run pack-starters590.py SOURCE --group=rare595 first, then this tool SOURCE --audit.
"""
from pathlib import Path
from PIL import Image
import json,sys,hashlib
R=Path(__file__).resolve().parents[2];S=Path(sys.argv[1])
group=next((a.split('=',1)[1] for a in sys.argv[2:] if a.startswith('--group=')),'rare595')
GROUPS={'rare595':['banh-chung','cha-ca-la-vong','bun-thang','banh-com-hang-than'],'rare596':['com-lang-vong','ca-phe-trung','thit-kho-trung','cha-ruoi']}
if group not in GROUPS:raise ValueError('Unknown rare-spirit production group')
IDS=GROUPS[group];DOC=R/'dev/docs'/('web-v'+group[-3:]);O=R/'public/assets/characters'/group;O.mkdir(parents=True,exist_ok=True)
im=Image.open(S/'portraits.png').convert('RGB')
for i,id in enumerate(IDS):
    t=im.crop((round(i%2*im.width/2),round(i//2*im.height/2),round((i%2+1)*im.width/2),round((i//2+1)*im.height/2)))
    t.resize((512,512),Image.Resampling.LANCZOS).save(O/(id+'-portrait.webp'),quality=88,method=6)
im=Image.open(S/'ultimate.png').convert('RGBA');spec=json.loads((DOC/'ultimate.cells.json').read_text());assert list(im.size)==spec['sourceSize'];tiles=[]
for i,rect in enumerate(spec['rects']):
    t=im.crop(rect)
    if i%3==1 and spec.get('isolateImpact',True):
        # One connected primary impact excludes tiny neighboring-frame fragments.
        import numpy as np
        from scipy.ndimage import label
        pixels=np.array(t);labels,_=label(pixels[:,:,3]>40);counts=np.bincount(labels.ravel());counts[0]=0;pixels[labels!=counts.argmax(),3]=0;t=Image.fromarray(pixels)
    box=t.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox()
    if not box:raise ValueError('Empty effect')
    tiles.append(t.crop(box))
scale=min(224/max(t.width for t in tiles),224/max(t.height for t in tiles));atlas=Image.new('RGBA',(1024,768))
for i,t in enumerate(tiles):
    t=t.resize((round(t.width*scale),round(t.height*scale)),Image.Resampling.LANCZOS)
    atlas.alpha_composite(t,(i//3*256+(256-t.width)//2,i%3*256+240-t.height))
atlas.save(O/'ultimate.webp',quality=88,method=6)
if '--audit' in sys.argv:
    report=[]
    for p in sorted(O.glob('*.webp')):
        im=Image.open(p).convert('RGBA');size=512 if p.stem.endswith('-portrait') else 64 if p.stem.endswith('-pixel') else 256
        frames=[im.crop((x,y,x+size,y+size)) for y in range(0,im.height,size) for x in range(0,im.width,size)]
        assert all(f.getchannel('A').getbbox() for f in frames),p
        hashes=[hashlib.sha256(f.tobytes()).hexdigest() for f in frames];assert len(hashes)==len(set(hashes)),p
        report.append({'file':str(p.relative_to(R)),'bytes':p.stat().st_size,'dimensions':im.size,'frames':len(frames),'uniqueFrames':len(set(hashes)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    record={'files':report,'bytes':sum(x['bytes'] for x in report),'frames':sum(x['frames'] for x in report)}
    (DOC/'asset-qa.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps({k:v for k,v in record.items() if k!='files'}))
