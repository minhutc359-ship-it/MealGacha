#!/usr/bin/env python3
"""Verify unchanged PNGs, exact runtime RGBA, pinned own references and repeatable output."""
from pathlib import Path
import hashlib, json, subprocess
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
paths=[]
for zone in ('kitchen-hearth','kitchen-table'):
    folder=ROOT/'dev/aw2/assets/environments'/zone/'v2'
    manifest=ROOT/f'src/aw2/assets/{zone}.environment-v2.json'
    m=json.loads(manifest.read_text())
    selection=json.loads((folder/'selection.json').read_text())
    source=folder/'landscape-source.png'; runtime=folder/'landscape.webp'
    assert sha(source)==selection['sha256']==m['assets']['floor']['source']['sha256']
    a=Image.open(source).convert('RGBA');b=Image.open(runtime).convert('RGBA')
    assert a.size==b.size==(1536,1024) and a.tobytes()==b.tobytes()
    assert a.getextrema()[3]==(255,255)
    for ref in m['provenance']['references']:
        assert sha(ROOT/ref['path'])==ref['sha256']
        pinned=subprocess.check_output(['git','show',f"{ref['commit']}:{ref['path']}"],cwd=ROOT)
        assert hashlib.sha256(pinned).hexdigest()==ref['sha256']
        assert subprocess.check_output(['git','rev-parse',f"{ref['commit']}:{ref['path']}"],cwd=ROOT,text=True).strip()==ref['blob']
    for asset in m['assets'].values():
        assert sha(ROOT/asset['url'][1:])==asset['sha256']
        assert sha(ROOT/asset['source']['path'])==asset['source']['sha256']
    paths.extend([source,runtime,folder/'prompts.json',folder/'selection.json',folder/'provenance.json',manifest])
before={str(p.relative_to(ROOT)):sha(p) for p in paths}
subprocess.run(['python3','dev/tools/build-aw2-interior-landscapes.py'],cwd=ROOT,check=True)
assert before=={str(p.relative_to(ROOT)):sha(p) for p in paths}
out=ROOT/'.asset-work/aw2-006l';out.mkdir(parents=True,exist_ok=True)
(out/'files.json').write_text(json.dumps(dict(status='PASS',exactRgba=True,opaque=True,pinnedReferences=True,repeatIdenticalPaths=len(paths),sha256=before),indent=2)+'\n')
print('PASS exact RGBA/pinned references/asset hashes/repeat',len(paths),'paths')
