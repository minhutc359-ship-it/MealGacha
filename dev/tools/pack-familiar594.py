"""Register final Imagegen portrait/VFX cells. Crop/resize/compress only, no painting.
Usage: python3 dev/tools/pack-familiar594.py SOURCE
Run pack-starters590.py SOURCE --group=familiar594 bun-cha bun-rieu banh-xeo com-ga first.
"""
from pathlib import Path
from PIL import Image
import json,sys,hashlib
R=Path(__file__).resolve().parents[2];S=Path(sys.argv[1]);O=R/'public/assets/characters/familiar594';O.mkdir(parents=True,exist_ok=True)
IDS=['bun-cha','bun-rieu','banh-xeo','com-ga']
im=Image.open(S/'portraits.png').convert('RGB')
for i,id in enumerate(IDS):
    t=im.crop((round(i%2*im.width/2),round(i//2*im.height/2),round((i%2+1)*im.width/2),round((i//2+1)*im.height/2)))
    t.resize((512,512),Image.Resampling.LANCZOS).save(O/(id+'-portrait.webp'),quality=88,method=6)
im=Image.open(S/'ultimate.png').convert('RGBA');tiles=[]
# The source's gutters are not exactly uniform. Register measured cells so a
# neighboring bamboo edge never appears in the crab's impact frame.
spec=json.loads((R/'dev/docs/web-v594/ultimate.cells.json').read_text())
assert list(im.size)==spec['sourceSize']
for row in range(3):
    for col in range(4):
        t=im.crop(spec['rects'][row*4+col])
        box=t.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox()
        if not box:raise ValueError('Empty effect')
        tiles.append(t.crop(box))
scale=min(224/max(t.width for t in tiles),224/max(t.height for t in tiles));atlas=Image.new('RGBA',(1024,768))
for i,t in enumerate(tiles):
    t=t.resize((round(t.width*scale),round(t.height*scale)),Image.Resampling.LANCZOS)
    atlas.alpha_composite(t,(i%4*256+(256-t.width)//2,i//4*256+240-t.height))
atlas.save(O/'ultimate.webp',quality=88,method=6)
print('Packed portraits and effects. Use --audit after combat packing is complete.')
if '--audit' in sys.argv:
    report=[]
    for p in sorted(O.glob('*.webp')):
        im=Image.open(p).convert('RGBA');size=512 if p.stem.endswith('-portrait') else 64 if p.stem.endswith('-pixel') else 256
        frames=[im.crop((x,y,x+size,y+size)) for y in range(0,im.height,size) for x in range(0,im.width,size)]
        assert all(f.getchannel('A').getbbox() for f in frames),p
        hashes=[hashlib.sha256(f.tobytes()).hexdigest() for f in frames];assert len(hashes)==len(set(hashes)),p
        report.append({'file':str(p.relative_to(R)),'bytes':p.stat().st_size,'dimensions':im.size,'frames':len(frames),'uniqueFrames':len(set(hashes)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    (R/'dev/docs/web-v594/asset-qa.json').write_text(json.dumps({'files':report,'bytes':sum(x['bytes'] for x in report),'frames':sum(x['frames'] for x in report)},indent=2)+'\n')
    print(json.dumps({'files':len(report),'bytes':sum(x['bytes'] for x in report),'frames':sum(x['frames'] for x in report)}))
