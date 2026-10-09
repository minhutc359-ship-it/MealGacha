"""Encode generated RGBA atlases without resampling; measure crop/foot coordinates."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'generated_images'
ATLAS = [
    ('rosterA', 'exec-6680d478-6a81-4ae4-a295-124653ebe77d.png'),
    ('rosterB', 'exec-31f9720d-0000-440b-a2fd-d1c38b566861.png'),
    ('rosterC', 'exec-1fce5cad-3d61-4ae7-b057-06bf4b2e1302.png'),
    ('rosterD', 'exec-3c824b2f-d737-495b-b45f-f69933f30339.png'),
]
frames_path = ROOT / 'src/game/autochess/spriteFrames.json'
frames = json.loads(frames_path.read_text())
target = ROOT / 'public/assets/characters'
target.mkdir(parents=True, exist_ok=True)
for key, filename in ATLAS:
    im = Image.open(SOURCE / filename).convert('RGBA')
    w, h = im.size
    alpha = im.getchannel('A')
    mask = alpha.point(lambda a: 255 if a > 80 else 0)
    pixels = mask.load()
    mass = [sum(bool(pixels[x, y]) for x in range(w)) for y in range(h)]
    boundaries = [0]
    for row in range(1, 4):
        center = round(h * row / 4)
        span = round(h * .055)
        boundaries.append(min(range(center - span, center + span), key=lambda y: (sum(mass[max(0,y-2):y+3]), abs(y-center))))
    boundaries.append(h)
    rows = []
    for row in range(4):
        top, bottom = boundaries[row:row+2]
        source_frames = []
        for col in range(7):
            left, right = round(w * col / 7), round(w * (col + 1) / 7)
            box = mask.crop((left, top, right, bottom)).getbbox()
            if not box:
                raise RuntimeError(f'Empty sprite: {key} {row} {col}')
            x0,y0,x1,y1 = box
            sx,sy,sw,sh = left+x0,top+y0,x1-x0,y1-y0
            # The opaque feet/bottom determine the horizontal pivot, including wide cast poses.
            foot_band = alpha.crop((sx, max(sy, sy+sh-8), sx+sw, sy+sh))
            weights = [sum(foot_band.getpixel((x,y)) for y in range(foot_band.height)) for x in range(sw)]
            total = sum(weights); cumulative = 0; anchor = sw/2
            for x, weight in enumerate(weights):
                cumulative += weight
                if cumulative >= total/2:
                    anchor = x+.5; break
            source_frames.append([sx,sy,sw,sh,anchor,sh])
        rows.append({'height':max(f[3] for f in source_frames[:3]), 'frames':source_frames})
    path = f'/assets/characters/{key}.webp'
    im.save(target / f'{key}.webp', 'WEBP', quality=94, method=6, exact=True)
    assert Image.open(target / f'{key}.webp').getchannel('A').tobytes() == alpha.tobytes()
    frames[key] = {'path':path, 'width':w, 'height':h, 'rows':rows}
    print(key, im.size, boundaries, (target / f'{key}.webp').stat().st_size)
frames_path.write_text(json.dumps(frames, separators=(',', ':'))+'\n')
