"""Preserve generated PNG pixels, measure safe atlas cells, encode lossless WebP.

No painting, resizing, masking or mirrored artwork. Audio is original additive
synthesis, not sampled from another recording. Human art/listening review is open.
"""
from pathlib import Path
import hashlib, importlib.util, json

ROOT = Path(__file__).resolve().parents[2]
DIRECTORY = ROOT / 'dev/aw2/assets/forgotten-host/motion-v1'
MANIFEST = ROOT / 'src/aw2/assets/forgotten-host.reference-v1.json'
IDENTITY = 'aw2-enemy-forgotten-host'
spec = importlib.util.spec_from_file_location('grid_helper', Path(__file__).with_name('build-aw2-muoi-assets.py'))
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)
helper.DIRECTORY = DIRECTORY
helper.util.ASSETS = DIRECTORY
helper.util.URL = '/dev/aw2/assets/forgotten-host/motion-v1/'
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()

def build():
    data = json.loads(MANIFEST.read_text())
    for sheet, states in [('motion-a', helper.STATES[:4]), ('motion-b', helper.STATES[4:])]:
        asset = helper.util.encode(sheet)
        asset['id'] = f'{IDENTITY}:{sheet}:motion-v1'
        data['assets'][sheet] = asset
        data['frames'].update(helper.grid(sheet, [[f'battle.{s}.{i}' for i in range(4)] for s in states], 1.5))
        for state in states:
            clip = data['battle'][state]
            duration = clip['durationMs']
            clip['frames'] = [{'atMs': round(duration * i / 4), 'frame': f'battle.{state}.{i}'} for i in range(4)]
            clip['reducedMotionFrame'] = f'battle.{state}'
            clip['motion'] = helper.util.track((0, 0, 0, 0, 1, 1), (duration, 0, 0, 0, 1, 1))
            clip['method'] = 'four distinct original image_gen motion cels; measured alpha-safe cells; human continuity review pending'
    data['audio'] = {}
    for name, length, notes, noise in [
        ('basic', .16, [(150, -90, .20), (440, -160, .08)], .02),
        ('sweep', .26, [(220, 220, .18), (660, -210, .10)], .03),
        ('snuff', .42, [(110, -80, .23), (330, -190, .09)], .025),
        ('barrier', .24, [(523, 80, .13), (784, -80, .10)], .006),
    ]:
        cue = helper.util.cue(name, length, notes, noise)
        cue['id'] = f'{IDENTITY}:audio:{name}:v1'
        data['audio'][name] = cue
    data['status'] = 'MOTION_AND_AUDIO_IMPLEMENTED_REVIEW_OPEN'
    data['motionProvenance'] = {
        'generator': 'OpenAI built-in image_gen', 'model': 'not exposed by tool',
        'date': '2026-11-02', 'task': 'AW2-019B',
        'prompts': 'dev/aw2/assets/forgotten-host/motion-v1/prompts.json',
        'sourceFiles': [{'path': str(p.relative_to(ROOT)), 'sha256': digest(p)} for p in sorted(DIRECTORY.glob('*.png'))],
        'originalIdentity': data['assets']['battle']['source'],
        'externalReferences': [], 'licenseStatus': 'REVIEW_REQUIRED',
        'commercialRelease': 'NOT_CLEARED', 'humanApproval': False,
        'processing': 'Preserved original PNG; lossless visible RGBA/alpha comparison; alpha-safe per-column cell measurements; logical renderScale only.',
        'audioSource': ['dev/tools/build-aw2-boss-motion.py', 'dev/tools/build-aw2-than-assets.py'],
    }
    MANIFEST.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    provenance = {'task': 'AW2-019B', 'entityId': IDENTITY, 'motion': data['motionProvenance'],
        'assets': {key: value for key, value in data['assets'].items() if key.startswith('motion-')},
        'audio': data['audio'], 'promptsSha256': digest(DIRECTORY / 'prompts.json'),
        'builderSha256': digest(Path(__file__)), 'fullEnemyComplete': False}
    (DIRECTORY / 'provenance.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'states': 8, 'newCels': 32, 'audio': len(data['audio']),
        'maxEdgeAlpha': max(f['maxEdgeAlpha'] for key, f in data['frames'].items() if key.split('.')[-1].isdigit() and key.startswith('battle.'))}))

if __name__ == '__main__': build()
