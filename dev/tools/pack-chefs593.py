"""Register generated chef portraits/walk/VFX; crop, normalize, compress only.
Usage: python3 dev/tools/pack-chefs593.py /path/to/chef-source
Combat uses pack-starters590.py SOURCE --group=chefs593 with reviewed cell sidecars.
"""
from pathlib import Path
import json,sys,hashlib
from PIL import Image
import numpy as np
from scipy.ndimage import label

R=Path(__file__).resolve().parents[2];S=Path(sys.argv[1]);O=R/'public/assets/characters/chefs593';O.mkdir(parents=True,exist_ok=True)
IDS=['chef-bach','chef-nhien','chef-moc','chef-hai','chef-lien']
EXP=['neutral','joy','resolve','concern','surprise','tender']
def trim(tile,isolate=False):
    if isolate:
        p=np.array(tile);labels,_=label(p[:,:,3]>32);counts=np.bincount(labels.ravel());counts[0]=0
        p[labels!=counts.argmax(),3]=0;tile=Image.fromarray(p)
    box=tile.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
    if not box:raise ValueError('Empty cell')
    return tile.crop(box)
def cells(name,cols,rows,isolate=False,ys=None):
    im=Image.open(S/(name+'.png')).convert('RGBA');ys=ys or [round(i*im.height/rows) for i in range(rows+1)]
    return [trim(im.crop((round(c*im.width/cols),ys[r],round((c+1)*im.width/cols),ys[r+1])),isolate) for r in range(rows) for c in range(cols)]

# Measured portrait row gutters; keep face and neckline together.
im=Image.open(S/'expressions.png')
ys=[round(v*im.height/1147) for v in [0,234,470,702,919,1147]]
faces=cells('expressions',6,5,True,ys)
for r,id in enumerate(IDS):
    scale=min(248/max(t.width for t in faces[r*6:r*6+6]),248/max(t.height for t in faces[r*6:r*6+6]))
    for c,exp in enumerate(EXP):
        t=faces[r*6+c];t=t.resize((round(t.width*scale),round(t.height*scale)),Image.Resampling.LANCZOS)
        out=Image.new('RGBA',(256,256));out.alpha_composite(t,((256-t.width)//2,256-t.height));out.save(O/f'{id}-{exp}.webp',quality=88,method=6)

for name,cols,rows,size,isolate in [('exploration',12,5,64,True),('ultimate',5,3,256,False)]:
    tiles=cells(name,cols,rows,isolate);out=Image.new('RGBA',(cols*size,rows*size))
    for r in range(rows):
        group=tiles[r*cols:r*cols+cols]
        scale=min((size-8)/max(t.width for t in group),(size-8)/max(t.height for t in group))
        for c,t in enumerate(group):
            t=t.resize((round(t.width*scale),round(t.height*scale)),Image.Resampling.NEAREST if size==64 else Image.Resampling.LANCZOS)
            out.alpha_composite(t,(c*size+(size-t.width)//2,r*size+size-4-t.height))
    out.save(O/(name+'.webp'),lossless=size==64,quality=88,method=6)

report=[]
for p in sorted(O.glob('*.webp')):
    im=Image.open(p);tile=64 if p.stem=='exploration' or p.stem.endswith('-pixel') else 256
    frames=[im.crop((x,y,x+tile,y+tile)).convert('RGBA') for y in range(0,im.height,tile) for x in range(0,im.width,tile)]
    assert all(f.getchannel('A').getbbox() for f in frames),p
    hashes=[hashlib.sha256(f.tobytes()).hexdigest() for f in frames]
    assert len(hashes)==len(set(hashes)),p
    report.append({'file':str(p.relative_to(R)),'bytes':p.stat().st_size,'dimensions':im.size,'frames':len(frames),'uniqueFrames':len(set(hashes)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(R/'dev/docs/web-v593/asset-qa.json').write_text(json.dumps({'files':report,'bytes':sum(p['bytes'] for p in report),'frames':sum(p['frames'] for p in report)},indent=2)+'\n')
print(json.dumps({'files':len(report),'bytes':sum(p['bytes'] for p in report),'frames':sum(p['frames'] for p in report)}))
