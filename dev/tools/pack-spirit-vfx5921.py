"""Pack two built-in Imagegen 4x3 sheets, preserving painted pixels and alpha.

Usage: python3 dev/tools/pack-spirit-vfx5921.py sources.json
The JSON records contain group, source and the exact generation prompt.
"""
import hashlib
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
records = []
for entry in json.loads(Path(sys.argv[1]).read_text()):
    source = Path(entry['source'])
    image = Image.open(source).convert('RGBA')
    tiles = []
    for row in range(3):
        for column in range(4):
            tile = image.crop((round(column*image.width/4), round(row*image.height/3),
                               round((column+1)*image.width/4), round((row+1)*image.height/3)))
            bounds = tile.getchannel('A').point(lambda a: 255 if a > 32 else 0).getbbox()
            assert bounds, (entry['group'], row, column, 'empty effect')
            tiles.append(tile.crop(bounds))
    scale = min(224/max(t.width for t in tiles), 224/max(t.height for t in tiles))
    atlas = Image.new('RGBA', (1024, 768))
    for index, tile in enumerate(tiles):
        tile = tile.resize((max(1,round(tile.width*scale)), max(1,round(tile.height*scale))), Image.Resampling.LANCZOS)
        atlas.alpha_composite(tile, (index%4*256+(256-tile.width)//2, index//4*256+(256-tile.height)//2))
    target = ROOT/'public/assets/characters'/entry['group']/'ultimate.webp'
    target.parent.mkdir(exist_ok=True, parents=True)
    atlas.save(target, quality=88, method=6)
    final = Image.open(target).convert('RGBA')
    hashes = []
    for i in range(12):
        tile = final.crop((i%4*256, i//4*256, i%4*256+256, i//4*256+256))
        bounds = tile.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
        assert bounds and min(bounds[:2]) >= 12 and max(bounds[2:]) <= 244, bounds
        hashes.append(hashlib.sha256(tile.tobytes()).hexdigest())
    assert len(set(hashes)) == 12, 'Duplicate painted effects'
    records.append({'group':entry['group'], 'tool':'built-in Imagegen', 'prompt':entry['prompt'],
                    'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(), 'sourceSize':list(image.size),
                    'path':str(target.relative_to(ROOT)), 'size':list(final.size), 'frames':12,
                    'uniqueFrames':12, 'safeGutters':True, 'bytes':target.stat().st_size,
                    'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
(ROOT/'dev/docs/web-v5921/vfx-provenance.json').write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n')
print(json.dumps([{'group':r['group'],'bytes':r['bytes'],'frames':r['frames']} for r in records]))
