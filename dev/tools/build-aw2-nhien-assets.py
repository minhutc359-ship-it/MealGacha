"""AW2-004K: preserved Nhiên pixels, measured cells and reference-only cues."""
from pathlib import Path
import importlib.util
import json
import statistics

ROOT = Path(__file__).resolve().parents[2]
DIRECTORY = ROOT / 'dev/aw2/assets/nhien/base-v1'
spec = importlib.util.spec_from_file_location('measured_atlas', Path(__file__).with_name('build-aw2-muoi-assets.py'))
measured = importlib.util.module_from_spec(spec)
spec.loader.exec_module(measured)
measured.DIRECTORY = DIRECTORY
util = measured.util
util.ASSETS = DIRECTORY
util.URL = '/dev/aw2/assets/nhien/base-v1/'
IDENTITY = 'aw2-nhien'
SLOTS = ['basic', 'auto', 'passive', 'ultimate']


def build():
    names = ['portrait', 'world', 'battle-motion-a-v1', 'battle-motion-b-v2', 'fx']
    assets = {name: util.encode(name) for name in names}
    for name, asset in assets.items():
        asset['id'] = f'{IDENTITY}:{name}:base-v1'
    assets['battle'] = {**assets['battle-motion-a-v1'], 'id': f'{IDENTITY}:battle:base-v1'}
    assets['reference'] = {**assets['portrait'], 'id': f'{IDENTITY}:reference:base-v1'}
    frames = measured.grid('world', [[f'world.{d}.{i}' for i in range(4)] for d in ['down', 'left', 'right', 'up']])
    for sheet, states in [('battle-motion-a-v1', util.STATES[:4]), ('battle-motion-b-v2', util.STATES[4:])]:
        frames.update(measured.grid(sheet, [[f'battle.{s}.{i}' for i in range(4)] for s in states], 1.3))
    # Repacked B has smaller source figures. Calibrate logical size without pixel edits.
    def median_height(state):
        return statistics.median(frames[f'battle.{state}.{i}']['visibleBounds'][3] - frames[f'battle.{state}.{i}']['visibleBounds'][1] for i in range(4))
    scale_b = round(1.3 * median_height('idle') / median_height('hit'), 4)
    for frame in frames.values():
        if frame['asset'] == 'battle-motion-b-v2':
            frame['renderScale'] = scale_b
    frames.update(measured.grid('fx', [[f'fx.{s}.{i}' for i in range(4)] for s in SLOTS]))
    battle = util.reference_battle_clips(IDENTITY)
    timing = {'idle': [0, 300, 600, 900], 'move': [0, 170, 340, 510],
              'attack': [0, 220, 440, 700], 'cast': [0, 210, 420, 740],
              'hit': [0, 80, 180, 340], 'guard': [0, 180, 400, 700],
              'ultimate': [0, 240, 520, 800], 'defeat': [0, 220, 480, 760]}
    cues = {'basic': [220, 440], 'auto': [420], 'passive': [180], 'ultimate': [240, 520, 800]}
    for state in util.STATES:
        clip = battle[state]
        if state == 'attack':
            clip['durationMs'] = 1000
        clip['motion'] = util.track((0, 0, 0, 0, 1, 1), (clip['durationMs'], 0, 0, 0, 1, 1))
        clip['frames'] = [{'atMs': at, 'frame': f'battle.{state}.{i}'} for i, at in enumerate(timing[state])]
        if state == 'ultimate':
            clip['frames'].append({'atMs': 1080, 'frame': 'battle.idle.0'})
        clip['reducedMotionFrame'] = f'battle.{state}.0'
        clip['method'] = 'four distinct generated reference cels; authored timing/recovery; independent continuity/contact review pending'
        slot = {'attack': 'basic', 'cast': 'auto', 'ultimate': 'ultimate'}.get(state)
        clip['markers'] = [{'atMs': at, 'kind': 'contact-preview', 'skill': slot} for at in cues[slot]] if slot else []
    skills = {}
    for i, (slot, name, state) in enumerate(zip(SLOTS, ['Nhịp Chảo', 'Bắt Nhịp', 'Bếp Đông', 'Lửa Qua Ba Nhịp'], ['attack', 'cast', 'guard', 'ultimate'])):
        sound = util.cue(slot, [.16, .28, .24, .38][i], [(250 + i * 85, 100, .19), (780 + i * 100, -140, .07)], .009)
        sound['id'] = f'{IDENTITY}:audio:{slot}'
        skills[slot] = {'id': f'{IDENTITY}:skill:{slot}', 'displayName': name, 'battleState': state,
                        'fx': [f'fx.{slot}.{j}' for j in range(4)], 'fxFrameMs': 45 if slot == 'basic' else 55 if slot == 'ultimate' else 90,
                        'fxTriggerAtMs': cues[slot][0], 'fxCueAtMs': cues[slot],
                        'fxPlacement': {'attachment': 'contact', 'layer': 'front', 'x': 220, 'y': -220, 'scale': .8 if slot == 'passive' else 1.05},
                        'trigger': 'preview only; future combat must confirm bounded energy from distinct targets; no per-frame proc' if slot == 'passive' else 'reference presentation only; each contact is a visual cue, not confirmed damage',
                        'audio': sound, 'projectile': None,
                        'scope': 'reference assets only; actual Nhiên development combat/leveling in007F; no collection or final numerical balance'}
    manifest = {'version': 1, 'spiritId': IDENTITY, 'displayName': 'Nhiên', 'artVariantId': 'base-v1',
                'status': 'MOTION_REFERENCE_IMPLEMENTED', 'fullCharacterComplete': False,
                'assets': assets, 'frames': frames, 'battle': battle,
                'world': {d: {'idle': f'world.{d}.0', 'walk': [f'world.{d}.{i}' for i in range(4)], 'frameMs': 150} for d in ['down', 'left', 'right', 'up']},
                'skills': skills,
                'provenance': {'generator': 'OpenAI built-in image_gen', 'model': 'not exposed by tool', 'date': '2026-10-22',
                               'prompts': util.URL + 'prompts.json', 'externalReferences': [], 'referenceAsset': f'{IDENTITY}:portrait:base-v1',
                               'licenseStatus': 'REVIEW_REQUIRED', 'commercialRelease': 'NOT_CLEARED',
                               'audio': 'original deterministic additive synthesis +seeded noise; build-aw2-nhien-assets.py and preserved Than helper; human listening pending',
                               'processing': 'selected source PNG bytes unchanged; per-column alpha-safe cells/foot anchors; logical scale A1.3/B calibrated from standing visible height; lossless visible RGBA+alpha; no repaint/mask/mirror/resize',
                               'alphaEdgeTolerance': 8}}
    (ROOT / 'src/aw2/assets/nhien.base-v1.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    unique = {a['url']: a for a in assets.values()}
    print(json.dumps({'task': 'AW2-004K', 'status': 'PASS', 'frames': len(frames), 'scaleB': scale_b,
                      'runtimeWebpBytes': sum(a['bytes'] for a in unique.values()), 'decodedRGBA': sum(a['width'] * a['height'] * 4 for a in unique.values()),
                      'maxEdgeAlpha': max(f['maxEdgeAlpha'] for f in frames.values())}))


if __name__ == '__main__':
    build()
