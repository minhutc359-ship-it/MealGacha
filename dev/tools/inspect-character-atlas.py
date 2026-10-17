"""Verify registered character pixels and emit a contact sheet for visual review.

Usage: python3 dev/tools/inspect-character-atlas.py spring5911 5911
Checks final runtime files against provenance; source PNGs are not required.
"""
import hashlib
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[2]
group, version = sys.argv[1:3]
asset = root / 'public/assets/characters' / group
docs = root / 'dev/docs' / ('web-v' + version)
records = json.loads((docs / 'asset-provenance.json').read_text())
evidence = docs / 'evidence'
evidence.mkdir(exist_ok=True)
contact = Image.new('RGB', (2048, len(records) * 288), '#e5e1d5')
draw = ImageDraw.Draw(contact)
checks = []
for actor_index, record in enumerate(records):
    actor = record['id']
    for name, expected in record['outputs'].items():
        data = (asset / name).read_bytes()
        assert len(data) == expected['bytes'], name
        assert hashlib.sha256(data).hexdigest() == expected['sha256'], name
    atlas = Image.open(asset / (actor + '.webp')).convert('RGBA')
    pixel = Image.open(asset / (actor + '-pixel.webp')).convert('RGBA')
    portrait = Image.open(asset / (actor + '-portrait.webp'))
    assert atlas.size == (1024, 2048)
    assert pixel.size == (256, 512)
    assert portrait.size == (512, 512)
    bounds, fingerprints = [], set()
    draw.text((8, actor_index * 288 + 2), actor, fill='#193e36')
    for frame in range(32):
        x, y = frame % 4 * 256, frame // 4 * 256
        tile = atlas.crop((x, y, x + 256, y + 256))
        bound = tile.getchannel('A').point(lambda a: 255 if a > 32 else 0).getbbox()
        assert bound and min(bound[:2]) >= 12 and max(bound[2:]) <= 244, (actor, frame, bound)
        assert 238 <= bound[3] <= 241, (actor, frame, 'foot pivot', bound)
        fingerprints.add(hashlib.sha256(tile.tobytes()).hexdigest())
        bounds.append(bound)
        small = tile.resize((120, 120), Image.Resampling.LANCZOS)
        contact.paste(small, (frame % 16 * 128 + 4, actor_index * 288 + frame // 16 * 136 + 18), small)
    assert len(fingerprints) == 32, (actor, 'duplicate frames')
    checks.append({'id': actor, 'frames': 32, 'uniqueFrames': len(fingerprints),
                   'safeGutters': True, 'bounds': bounds, 'pixelSize': pixel.size,
                   'portraitSize': portrait.size, 'provenanceMatches': True})
contact.save(evidence / 'pose-contact.webp', quality=90, method=6)
(docs / 'asset-qa.json').write_text(json.dumps({'checks': checks, 'totalPhysicalPoses': len(records) * 32}, indent=2) + '\n')
print(json.dumps({'actors': len(records), 'physicalPoses': len(records) * 32, 'verifiedFiles': sum(len(r['outputs']) for r in records)}))
