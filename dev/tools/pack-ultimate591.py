"""Register Imagegen VFX frames into uniform cells; no generated replacement artwork.
Usage: python3 dev/tools/pack-ultimate591.py /path/to/source.png
"""
from pathlib import Path
import sys,json,hashlib
from PIL import Image
R=Path(__file__).resolve().parents[2]
source=Image.open(sys.argv[1]).convert('RGBA')
# Measured row intervals: the source's charge/impact/recovery rows have unequal height.
rows=[0,round(source.height*.3),round(source.height*.71),source.height]
tiles=[]
for row in range(3):
    for col in range(6):
        t=source.crop((round(col*source.width/6),rows[row],round((col+1)*source.width/6),rows[row+1]))
        box=t.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox()
        if not box:raise ValueError('Empty VFX frame')
        tiles.append(t.crop(box))
scale=min(224/max(t.width for t in tiles),224/max(t.height for t in tiles))
atlas=Image.new('RGBA',(1536,768))
for i,t in enumerate(tiles):
    t=t.resize((round(t.width*scale),round(t.height*scale)),Image.Resampling.LANCZOS)
    atlas.alpha_composite(t,(i%6*256+(256-t.width)//2,i//6*256+240-t.height))
out=R/'public/assets/characters/starters590/ultimate591.webp';atlas.save(out,quality=88,method=6)
frames=[atlas.crop((i%6*256,i//6*256,i%6*256+256,i//6*256+256)) for i in range(18)]
report={'file':str(out.relative_to(R)),'sourceSize':source.size,'rows':rows,'dimensions':atlas.size,'bytes':out.stat().st_size,'nonemptyFrames':sum(bool(f.getbbox()) for f in frames),'uniqueFrameHashes':len({hashlib.sha256(f.tobytes()).hexdigest() for f in frames})}
(R/'dev/docs/web-v591/vfx-qa.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
