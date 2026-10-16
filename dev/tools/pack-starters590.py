"""Pack Imagegen sources, never synthesize replacement character artwork.

Usage: python3 dev/tools/pack-starters590.py /path/to/source-directory
The source directory contains <character-id>.png and village.png.
"""
import json
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(sys.argv[1])
args = sys.argv[2:]
group = next((a.split('=',1)[1] for a in args if a.startswith('--group=')), 'starters590')
if group not in ['starters590', 'chefs593', 'familiar594']: raise ValueError('Unknown visual production group')
args = [a for a in args if not a.startswith('--group=')]
OUT = ROOT / 'public/assets/characters' / group
OUT.mkdir(parents=True, exist_ok=True)
IDS = args or ({'chefs593':['chef-bach','chef-nhien','chef-moc','chef-hai','chef-lien'], 'familiar594':['bun-cha','bun-rieu','banh-xeo','com-ga']}.get(group) or ['com-tam', 'banh-mi', 'pho-bo', 'banh-cuon', 'goi-cuon-tom-thit'])
report = []
def isolate_actor(tile):
    import numpy as np
    from scipy.ndimage import label
    pixels = np.array(tile)
    labels, _ = label(pixels[:,:,3] > 32)
    counts = np.bincount(labels.ravel()); counts[0] = 0
    pixels[labels != counts.argmax(),3] = 0
    return Image.fromarray(pixels)

for character in IDS:
    source = Image.open(SOURCE / f'{character}.png').convert('RGBA')
    tiles = []
    cells = SOURCE / f'{character}.cells.json'
    cells = json.loads(cells.read_text()) if cells.exists() else None
    if cells and list(source.size) != cells['sourceSize']: raise ValueError('Source/crop size mismatch')
    for row in range(8):
        for col in range(4):
            tile = source.crop((round(col*source.width/4), round(row*source.height/8), round((col+1)*source.width/4), round((row+1)*source.height/8)))
            if cells:
                tile = source.crop(cells['rects'][row*4+col])
                # Isolate the cell's actor when rectangular source bounds overlap a neighbor.
                # This is atlas registration, not synthesizing or painting replacement pixels.
                if cells.get('isolate'):
                    tile = isolate_actor(tile)
            bounds = tile.getchannel('A').point(lambda x: 255 if x > 32 else 0).getbbox()
            if not bounds: raise ValueError(f'Empty frame {character}:{row}:{col}')
            tiles.append(tile.crop(bounds))
    # A wide action source can replace individual cells without squeezing weapons.
    # Normalize its source resolution once per actor, then preserve that scale in all poses.
    if cells and cells.get('actions'):
        spec = cells['actions']
        action = Image.open(SOURCE / spec['file']).convert('RGBA')
        if list(action.size) != spec['sourceSize']: raise ValueError('Action/crop size mismatch')
        for index, rect in zip(spec['frames'],spec['rects'],strict=True):
            tile = isolate_actor(action.crop(rect))
            bounds = tile.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
            if not bounds: raise ValueError('Empty replacement action')
            tile = tile.crop(bounds)
            tiles[index] = tile.resize((round(tile.width*spec['scale']),round(tile.height*spec['scale'])),Image.Resampling.LANCZOS)
    # One scale for the entire actor, including its widest pose. Feet share a pivot.
    scale = min(224/max(t.width for t in tiles), 224/max(t.height for t in tiles))
    atlas = Image.new('RGBA', (1024, 2048))
    for i,tile in enumerate(tiles):
        tile = tile.resize((round(tile.width*scale), round(tile.height*scale)), Image.Resampling.LANCZOS)
        atlas.alpha_composite(tile, ((i%4)*256+(256-tile.width)//2, (i//4)*256+240-tile.height))
    path = OUT / f'{character}.webp'
    atlas.save(path, 'WEBP', quality=88, method=6)
    # Pixel-sized combat variant: same poses/identity and shared pivot, no duplicate design.
    atlas.resize((256,512), Image.Resampling.NEAREST).save(OUT / f'{character}-pixel.webp', 'WEBP', lossless=True, method=6)
    report.append({'id':character,'frames':32,'states':8,'bytes':path.stat().st_size,'sourceSize':source.size})
if not args and group == 'starters590':
    source=Image.open(SOURCE/'village.png').convert('RGBA')
    atlas=Image.new('RGBA',(768,448))
    for row in range(7):
        tiles=[]
        for col in range(12):
            t=source.crop((round(col*source.width/12),round(row*source.height/7),round((col+1)*source.width/12),round((row+1)*source.height/7)))
            bounds=t.getchannel('A').point(lambda x:255 if x>32 else 0).getbbox()
            if not bounds: raise ValueError(f'Empty village pose {row}:{col}')
            tiles.append(t.crop(bounds))
        scale=min(56/max(t.width for t in tiles),57/max(t.height for t in tiles))
        for col,t in enumerate(tiles):
            t=t.resize((max(1,round(t.width*scale)),max(1,round(t.height*scale))),Image.Resampling.NEAREST)
            atlas.alpha_composite(t,(col*64+(64-t.width)//2,row*64+60-t.height))
    atlas.save(OUT/'village-pixel.webp','WEBP',lossless=True,method=6)
print(json.dumps(report,ensure_ascii=False))
