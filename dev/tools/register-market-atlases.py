"""Register new 4x7 RGBA sprite sheets, retaining pixels and measuring foot pivots.

Usage: python3 dev/tools/register-market-atlases.py /absolute/generated_images
Generation originals stay outside the release source tree.
"""
import json
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(sys.argv[1])
manifest = json.loads((ROOT / 'dev/docs/market-v331/atlas-prompts.json').read_text())
frames_path = ROOT / 'src/game/autochess/spriteFrames.json'
frames = json.loads(frames_path.read_text())
target = ROOT / 'public/assets/characters'
for atlas in manifest['atlases']:
    key = atlas['sheet']
    im = Image.open(SOURCE / atlas['source']).convert('RGBA')
    w, h = im.size
    alpha = im.getchannel('A')
    assert alpha.getextrema() == (0, 255), f'{key}: transparency missing'
    mask = alpha.point(lambda a: 255 if a > 80 else 0)
    pixels = mask.load()
    mass = [sum(bool(pixels[x, y]) for x in range(w)) for y in range(h)]
    boundaries = [0]
    for row in range(1, 4):
        center, span = round(h * row / 4), round(h * .055)
        boundaries.append(min(range(center - span, center + span), key=lambda y: (sum(mass[max(0, y-2):y+3]), abs(y-center))))
    boundaries.append(h)
    rows = []
    for row in range(4):
        top, bottom = boundaries[row:row+2]
        poses = []
        for col in range(7):
            left, right = round(w * col / 7), round(w * (col + 1) / 7)
            box = mask.crop((left, top, right, bottom)).getbbox()
            if not box:
                raise RuntimeError(f'Empty pose: {key} {row} {col}')
            x0, y0, x1, y1 = box
            sx, sy, sw, sh = left+x0, top+y0, x1-x0, y1-y0
            foot_band = alpha.crop((sx, sy+sh-8, sx+sw, sy+sh))
            weights = [sum(foot_band.getpixel((x, y)) for y in range(8)) for x in range(sw)]
            total, cumulative, anchor = sum(weights), 0, sw/2
            for x, weight in enumerate(weights):
                cumulative += weight
                if cumulative >= total/2:
                    anchor = x+.5
                    break
            poses.append([sx, sy, sw, sh, anchor, sh])
        rows.append({'height': max(f[3] for f in poses[:3]), 'frames': poses})
    dest = target / f'{key}.webp'
    im.save(dest, 'WEBP', quality=94, method=6, exact=True)
    assert Image.open(dest).getchannel('A').tobytes() == alpha.tobytes()
    frames[key] = {'path': f'/assets/characters/{key}.webp', 'width': w, 'height': h, 'rows': rows}
    print(key, im.size, boundaries, dest.stat().st_size)
frames_path.write_text(json.dumps(frames, separators=(',', ':'))+'\n')
