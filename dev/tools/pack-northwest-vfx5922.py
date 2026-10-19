"""Pack two built-in Imagegen 3x3 VFX sheets into six three-phase columns.

Usage: python3 dev/tools/pack-northwest-vfx5922.py sources.json
Each entry contains source and the exact prompt, first three then last three IDs.
"""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
entries = json.loads(Path(sys.argv[1]).read_text())
assert len(entries) == 2
tiles, sources = [], []
for sheet, entry in enumerate(entries):
    path = Path(entry['source'])
    image = Image.open(path).convert('RGBA')
    rows = [round(f*image.height) for f in entry.get('rowFractions',[0,1/3,2/3,1])]
    cols = [round(f*image.width) for f in entry.get('columnFractions',[0,1/3,2/3,1])]
    for row in range(3):
        for col in range(3):
            tile = image.crop((cols[col],rows[row],cols[col+1],rows[row+1]))
            box = tile.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
            assert box, (sheet,row,col,'empty frame')
            tiles.append((row,col+sheet*3,tile.crop(box)))
    sources.append({'prompt':entry['prompt'],'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'size':list(image.size),'rows':rows,'columns':cols})
scale = min(224/max(t.width for _,_,t in tiles),224/max(t.height for _,_,t in tiles))
atlas = Image.new('RGBA',(1536,768))
for row,col,tile in tiles:
    tile = tile.resize((max(1,round(tile.width*scale)),max(1,round(tile.height*scale))),Image.Resampling.LANCZOS)
    atlas.alpha_composite(tile,(col*256+(256-tile.width)//2,row*256+(256-tile.height)//2))
out = ROOT/'public/assets/characters/northwest5922/ultimate.webp'
out.parent.mkdir(parents=True,exist_ok=True)
atlas.save(out,quality=88,method=6)
final = Image.open(out).convert('RGBA')
hashes = []
for i in range(18):
    tile = final.crop((i%6*256,i//6*256,i%6*256+256,i//6*256+256))
    bounds = tile.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
    assert bounds and min(bounds[:2])>=12 and max(bounds[2:])<=244, (i,bounds)
    hashes.append(hashlib.sha256(tile.tobytes()).hexdigest())
assert len(set(hashes)) == 18
report = {'tool':'built-in Imagegen','sources':sources,'path':str(out.relative_to(ROOT)),
          'size':list(final.size),'frames':18,'uniqueFrames':18,'safeGutters':True,
          'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
(ROOT/'dev/docs/web-v5922/vfx-provenance.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['frames','bytes','safeGutters']}))
