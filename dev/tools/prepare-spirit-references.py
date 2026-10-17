"""Rebuild square canon crops used for Imagegen; never modify shipped portraits.

Usage: python3 dev/tools/prepare-spirit-references.py dev/docs/web-v5912/identity-sources.json .asset-work/vietnam5912
"""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[2]
records = json.loads(Path(sys.argv[1]).read_text())
output = Path(sys.argv[2])
output.mkdir(parents=True, exist_ok=True)
for record in records:
    ref = record['canon']
    source = root / 'public' / ref['path'].lstrip('/')
    assert hashlib.sha256(source.read_bytes()).hexdigest() == ref['sha256']
    image = Image.open(source)
    step = image.width / ref['columns']
    x, y = ref['cell'] % ref['columns'] * step, ref['cell'] // ref['columns'] * step
    crop = image.crop((round(x + 2), round(y + 2), round(x + step - 2), round(y + step - 2)))
    target = output / f"{record['id']}-canon.png"
    crop.resize((512, 512), Image.Resampling.LANCZOS).save(target)
    assert hashlib.sha256(target.read_bytes()).hexdigest() == record['referenceSHA256']
print(json.dumps({'references': len(records), 'sourceHashes': 'passed', 'cropHashes': 'passed'}))
