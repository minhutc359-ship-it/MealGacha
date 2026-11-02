"""Package preserved image_gen outputs; no creative image edits or resizing."""
from pathlib import Path
from PIL import Image
import argparse
import hashlib
import io
import json

ROOT = Path(__file__).resolve().parents[2]
UNITS = ['than', 'lua', 'lam', 'moc-non', 'suong', 'muoi', 'nhien', 'hai', 'lien', 'moc', 'bach', 'van']


def sha(data):
    return hashlib.sha256(data).hexdigest()


def emit(path, data, check):
    if check:
        if not path.is_file() or path.read_bytes() != data:
            raise ValueError(f'Stale/missing generated artifact: {path.relative_to(ROOT)}')
    else:
        path.write_bytes(data)


def build(check):
    registry = {}
    seen = set()
    for unit in UNITS:
        folder = ROOT / 'dev/aw2/assets' / unit / 'ultimate-v1'
        prompt_path = folder / 'prompts.json'
        prompt = json.loads(prompt_path.read_text())
        source = folder / 'art.png'
        source_hash = sha(source.read_bytes())
        assert prompt['spiritId'] == f'aw2-{unit}' and prompt['selected'] is True
        assert prompt['tool'] == 'OpenAI built-in image_gen'
        assert prompt['source'] == {'path': str(source.relative_to(ROOT)), 'sha256': source_hash}
        assert prompt['externalInputs'] == [] and len(prompt['referenceInputs']) == 1
        for ref in prompt['referenceInputs']:
            assert ref['path'] in [f'dev/aw2/assets/{unit}/base-v1/reference.png', f'dev/aw2/assets/{unit}/base-v1/portrait.png']
            assert sha((ROOT / ref['path']).read_bytes()) == ref['sha256']
        assert source_hash not in seen
        seen.add(source_hash)
        original = Image.open(source)
        assert original.mode == 'RGBA' and original.width * original.height <= 2_000_000
        alpha = original.getchannel('A')
        counts = alpha.histogram()
        transparent_fraction = counts[0] / (original.width * original.height)
        assert .005 < transparent_fraction < .95 and alpha.getextrema()[1] > 200
        output = io.BytesIO()
        original.save(output, format='WEBP', lossless=True, method=6, exact=True)
        encoded = output.getvalue()
        decoded = Image.open(io.BytesIO(encoded)).convert('RGBA')
        assert decoded.size == original.size and decoded.tobytes() == original.tobytes()
        asset = {
            'id': f'aw2-{unit}:ultimate-art:v1',
            'url': f'/dev/aw2/assets/{unit}/ultimate-v1/art.webp',
            'width': original.width, 'height': original.height,
            'bytes': len(encoded), 'sha256': sha(encoded),
            'source': prompt['source'],
            'promptSha256': sha(prompt_path.read_bytes()),
            'transparentFraction': round(transparent_fraction, 6),
        }
        emit(folder / 'art.webp', encoded, check)
        provenance = {
            **prompt, 'runtime': asset,
            'processing': 'Source PNG preserved byte-for-byte; exact lossless WebP RGBA, no repaint/masking/mirroring/resizing.',
            'providerUseBasis': 'aw2-openai-output-use-2026-11-02',
            'sourceAudit': 'VERIFIED',
            'copyrightExclusivity': 'NOT_ASSERTED',
            'humanLegalReview': 'NOT_RUN',
            'licenseStatus': 'PROVIDER_TERMS_DOCUMENTED',
            'commercialRelease': 'NOT_CLEARED',
        }
        emit(folder / 'provenance.json', (json.dumps(provenance, ensure_ascii=False, indent=2) + '\n').encode(), check)
        registry[f'aw2-{unit}'] = asset
    assert sum(a['bytes'] for a in registry.values()) <= 26_000_000
    emit(ROOT / 'src/aw2/assets/ultimate-art.v1.json', (json.dumps(registry, ensure_ascii=False, indent=2) + '\n').encode(), check)
    print(json.dumps({'status': 'PASS', 'check': check, 'characters': len(registry), 'runtimeBytes': sum(a['bytes'] for a in registry.values()), 'maxDecodedBytes': max(a['width'] * a['height'] * 4 for a in registry.values())}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    build(parser.parse_args().check)
