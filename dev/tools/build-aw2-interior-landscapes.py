#!/usr/bin/env python3
"""AW2-006L: unchanged selected PNG -> exact RGBA lossless WebP + manifests."""
import hashlib
import json
from pathlib import Path
from PIL import Image, __version__ as pillow_version
ROOT = Path(__file__).resolve().parents[2]

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def read(path):
    return json.loads((ROOT / path).read_text())

def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

for zone in ('kitchen-hearth', 'kitchen-table'):
    folder = ROOT / 'dev/aw2/assets/environments' / zone / 'v2'
    source, runtime = folder / 'landscape-source.png', folder / 'landscape.webp'
    selection = read(str((folder / 'selection.json').relative_to(ROOT)))
    assert sha(source) == selection['sha256']
    image = Image.open(source).convert('RGBA')
    assert image.size == (1536, 1024) and image.getextrema()[3] == (255, 255)
    image.save(runtime, format='WEBP', lossless=True, exact=True, method=6)
    assert Image.open(runtime).convert('RGBA').tobytes() == image.tobytes()
    previous = read(f'src/aw2/assets/{zone}.environment-v1.json')
    assets = dict(previous['assets'])
    assets['floor'] = dict(id=f'aw2-environment-{zone}-v2:landscape', url='/' + str(runtime.relative_to(ROOT)), width=1536, height=1024, bytes=runtime.stat().st_size, sha256=sha(runtime), source=dict(path=str(source.relative_to(ROOT)), bytes=source.stat().st_size, sha256=sha(source)))
    if zone == 'kitchen-table':
        interactions = read('src/aw2/assets/kitchen-table.interactions-v1.json')
        assets.update(interactions['assets'])
        assets['boss'] = read('src/aw2/assets/forgotten-host.world-v1.json')['asset']
    budget = dict(compressedBytes=sum(a['bytes'] for a in assets.values()), decodedRgbaBytes=sum(a['width']*a['height']*4 for a in assets.values()), maxCompressedBytes=7_000_000, maxDecodedRgbaBytes=40_000_000)
    assert budget['compressedBytes'] <= budget['maxCompressedBytes'] and budget['decodedRgbaBytes'] <= budget['maxDecodedRgbaBytes']
    prompt = folder / 'prompts.json'
    provenance = dict(task='AW2-006L',tool='OpenAI built-in image_gen', model='not exposed by tool', date='2026-10-24', prompts=dict(path=str(prompt.relative_to(ROOT)), sha256=sha(prompt)), references=read(str(prompt.relative_to(ROOT)))['references'], licenseStatus='REVIEW_REQUIRED',commercialRelease='NOT_CLEARED',processing='Unchanged selected opaque PNG; exact RGBA lossless WebP. No pixel painting/masking/cropping/resizing. Existing v1 props and own four-facing boss reused unchanged. Uniform 1:1 scene placement; native640x384 gameplay region unchanged.',builder='dev/tools/build-aw2-interior-landscapes.py',pillow=pillow_version)
    scene=dict(version=2,id=f'aw2-environment-{zone}-v2',zoneId=previous['zoneId'],status='REFERENCE_ENVIRONMENT',fullEnvironmentComplete=False,canvas=dict(width=640,height=384),landscape=dict(x=-448,y=-320,width=1536,height=1024),camera=dict(centerX=320,centerY=192,followZoom=0.8,overviewZoom=0.42),safeSourcePlayfield=dict(x=464,y=336,width=608,height=352),assets=assets,budget=budget,provenance=provenance)
    write(ROOT / f'src/aw2/assets/{zone}.environment-v2.json',scene)
    write(folder / 'provenance.json',provenance)
    print(zone, budget)
