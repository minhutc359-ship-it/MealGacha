"""Measured alpha/hash/repeat audit for006C, without painted or transformed pixels."""
import hashlib
import json
import subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
path = ROOT / 'src/aw2/assets/kitchen-table.interactions-v1.json'
manifest = json.loads(path.read_text())
paths = [path, ROOT / 'dev/aw2/assets/environments/kitchen-table/interaction-v1/provenance.json']
assets = []
for name, asset in manifest['assets'].items():
    source, runtime = ROOT / asset['source']['path'], ROOT / asset['url'][1:]
    image, encoded = Image.open(source).convert('RGBA'), Image.open(runtime).convert('RGBA')
    assert image.tobytes() == encoded.tobytes()
    for p, expected in ((source, asset['source']['sha256']), (runtime, asset['sha256'])):
        assert hashlib.sha256(p.read_bytes()).hexdigest() == expected
    a = image.getchannel('A')
    assert a.getextrema()[0] == 0 and a.getextrema()[1] >= 250
    f = asset['frame']
    l, t, r, b = f['x'], f['y'], f['x'] + f['width'], f['y'] + f['height']
    assert 0 <= l < r <= image.width and 0 <= t < b <= image.height
    edges = [(l,t,r,t+1),(l,b-1,r,b),(l,t,l+1,b),(r-1,t,r,b)]
    max_edge = max(max(a.crop(e).getdata()) for e in edges)
    assert max_edge <= 8
    assets.append({'id': name, 'dimensions': image.size, 'alpha': a.getextrema(),
                   'frameEdgeAlpha': max_edge, 'runtimeBytes': runtime.stat().st_size,
                   'decodedRgbaBytes': image.width * image.height * 4, 'exactRgba': 'PASS'})
    paths.extend([source, runtime])
hashes = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
subprocess.run(['python3', 'dev/tools/build-aw2-table-interactions.py'], cwd=ROOT, check=True, capture_output=True)
assert all(hashlib.sha256((ROOT/p).read_bytes()).hexdigest() == h for p,h in hashes.items())
result = {'task': 'AW2-006C', 'status': 'PASS', 'assets': assets, 'repeatHashes': hashes,
          'runtimeBytes': sum(a['runtimeBytes'] for a in assets),
          'decodedRgbaBytes': sum(a['decodedRgbaBytes'] for a in assets)}
(ROOT / '.asset-work/aw2-006c/files.json').write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps(result))
