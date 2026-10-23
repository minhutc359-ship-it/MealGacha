"""Build new roster reference packages from preserved image_gen sheets only."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import statistics

ROOT = Path(__file__).resolve().parents[2]
module = importlib.util.spec_from_file_location('measured', Path(__file__).with_name('build-aw2-muoi-assets.py'))
measured = importlib.util.module_from_spec(module)
module.loader.exec_module(measured)
util = measured.util
SLOTS = ['basic', 'auto', 'passive', 'ultimate']


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(unit):
    directory = ROOT / 'dev/aw2/assets' / unit / 'base-v1'
    spec = json.loads((directory / 'spec.json').read_text())
    identity = 'aw2-' + unit
    measured.DIRECTORY = directory
    util.ASSETS = directory
    util.URL = f'/dev/aw2/assets/{unit}/base-v1/'
    names = ['portrait', 'world', spec['sheetA'], spec['sheetB'], 'fx']
    assets = {name: util.encode(name) for name in names}
    for name, asset in assets.items():
        asset['id'] = f'{identity}:{name}:base-v1'
    assets['battle'] = {**assets[spec['sheetA']], 'id': f'{identity}:battle:base-v1'}
    assets['reference'] = {**assets['portrait'], 'id': f'{identity}:reference:base-v1'}
    frames = measured.grid('world', [[f'world.{d}.{i}' for i in range(4)] for d in spec['worldRows']])
    for sheet, states in [(spec['sheetA'], util.STATES[:4]), (spec['sheetB'], util.STATES[4:])]:
        frames.update(measured.grid(sheet, [[f'battle.{state}.{i}' for i in range(4)] for state in states]))
    # Equal logical standing height; preserve every generated pixel and the
    # intentionally shorter final kneel. This changes renderer metadata only.
    for sheet, reference_state in [(spec['sheetA'], 'idle'), (spec['sheetB'], 'hit')]:
        height = statistics.median(frames[f'battle.{reference_state}.{i}']['visibleBounds'][3] - frames[f'battle.{reference_state}.{i}']['visibleBounds'][1] for i in range(4))
        scale = round(360 / height, 4)
        for frame in frames.values():
            if frame['asset'] == sheet:
                frame['renderScale'] = scale
    frames.update(measured.grid('fx', [[f'fx.{slot}.{i}' for i in range(4)] for slot in SLOTS]))
    ranged = spec['ranged']
    contact = 700 if ranged else spec.get('basicContactMs', 420)
    timing = {'idle': [0, 300, 600, 900], 'move': [0, 170, 340, 510],
              'attack': [0, 120, 260, 820] if ranged else [0, 180, contact, 860],
              'cast': [0, 210, 420, 740], 'hit': [0, 80, 180, 340],
              'guard': [0, 180, 400, 700], 'ultimate': [0, 280, 560, 960],
              'defeat': [0, 220, 480, 760]}
    cues = {'basic': [contact], 'auto': [420], 'passive': [180], 'ultimate': spec.get('ultimateCues', [560])}
    if len(cues['ultimate']) > 1:
        timing['ultimate'] = [0, 520, 1040, 1220]
    clips = util.reference_battle_clips(identity)
    for state, clip in clips.items():
        if state == 'attack':
            clip['durationMs'] = 1000 if ranged else 1100
        clip['motion'] = util.track((0, 0, 0, 0, 1, 1), (clip['durationMs'], 0, 0, 0, 1, 1))
        clip['frames'] = [{'atMs': at, 'frame': f'battle.{state}.{i}'} for i, at in enumerate(timing[state])]
        if state == 'ultimate':
            clip['frames'].append({'atMs': 1300 if len(cues['ultimate']) > 1 else 1080, 'frame': 'battle.idle.0'})
        clip['reducedMotionFrame'] = f'battle.{state}.0'
        clip['method'] = 'four distinct generated reference cels; explicit timing/recovery, independent continuity review pending'
        slot = {'attack': 'basic', 'cast': 'auto', 'ultimate': 'ultimate'}.get(state)
        clip['markers'] = [{'atMs': at, 'kind': 'impact-preview' if slot == 'basic' and ranged else 'contact-preview', 'skill': slot} for at in cues[slot]] if slot else []
        if state == 'attack' and ranged:
            clip['markers'].insert(0, {'atMs': 260, 'kind': 'launch', 'skill': 'basic'})
    skills = {}
    for index, (slot, state) in enumerate(zip(SLOTS, ['attack', 'cast', 'guard', 'ultimate'])):
        base = spec['audioBaseHz']
        sound = util.cue(slot, [.18, .3, .22, .42][index], [(base + index * 83, 110, .17), (base * 2 + index * 127, -130, .07)], .009)
        sound['id'] = f'{identity}:audio:{slot}'
        skills[slot] = {
            'id': f'{identity}:skill:{slot}', 'displayName': spec['skills'][index], 'battleState': state,
            'fx': [f'fx.{slot}.{i}' for i in range(4)],
            'fxFrameMs': 45 if slot == 'ultimate' and len(cues[slot]) > 1 else 90,
            'fxTriggerAtMs': cues[slot][0], 'fxCueAtMs': cues[slot],
            'fxPlacement': {'attachment': 'contact', 'layer': 'front', 'x': 240, 'y': -220, 'scale': .85 if slot == 'passive' else 1.05},
            'trigger': 'manual reference preview only; no proc/damage/heal/shield/cleanse/mark or ownership authority',
            'audio': sound,
            'projectile': {'frames': ['fx.basic.0', 'fx.basic.1'], 'frameMs': 100, 'launchAtMs': 260, 'impactAtMs': 700,
                           'from': {'x': 80, 'y': -220}, 'to': {'x': 240, 'y': -220}, 'scale': .65} if slot == 'basic' and ranged else None,
            'scope': spec.get('skillScope', 'reference assets only; actual combat/leveling/collection and final numerical balance not implemented'),
        }
    manifest = {
        'version': 1, 'spiritId': identity, 'displayName': spec['displayName'], 'artVariantId': 'base-v1',
        'status': 'MOTION_REFERENCE_IMPLEMENTED', 'fullCharacterComplete': False,
        'assets': assets, 'frames': frames, 'battle': clips,
        'world': {d: {'idle': f'world.{d}.0', 'walk': [f'world.{d}.{i}' for i in range(4)], 'frameMs': 150} for d in ['down', 'left', 'right', 'up']},
        'skills': skills,
        'provenance': {
            'generator': 'OpenAI built-in image_gen', 'model': 'not exposed by tool', 'date': spec.get('date', '2026-10-22'),
            'prompts': util.URL + 'prompts.json', 'externalReferences': [], 'referenceAsset': f'{identity}:portrait:base-v1',
            'licenseStatus': 'REVIEW_REQUIRED', 'commercialRelease': 'NOT_CLEARED',
            'audio': 'original deterministic additive synthesis + seeded noise; build-aw2-roster-assets.py and preserved Than helper; human listening pending',
            'processing': 'source PNG bytes unchanged; measured alpha-safe rectangles/visible foot anchors and logical scale only; lossless visible RGBA/alpha; no repaint/mask/mirror/resize',
            'alphaEdgeTolerance': 8,
        },
    }
    (ROOT / f'src/aw2/assets/{unit}.base-v1.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    prompts = json.loads((directory / 'prompts.json').read_text())
    history = []
    for call in prompts['calls']:
        source = directory / call['source'] if call['selected'] else ROOT / call['source']
        refs = []
        for reference in call.get('referenceInputs', []):
            path = ROOT / reference if reference.startswith(('.asset-work/', 'dev/', 'src/')) else directory / reference
            refs.append({'path': str(path.relative_to(ROOT)), 'sha256': digest(path)})
        history.append({'callId': call['callId'], 'workspacePath': str(source.relative_to(ROOT)), 'selected': call['selected'],
                        'reason': call.get('reason', 'Selected original reference, measured alpha-safe cells'),
                        'sha256': digest(source), 'referenceInputs': refs})
    provenance = {**manifest['provenance'], 'task': spec['task'], 'spiritId': identity, 'fullCharacterComplete': False,
                  'promptFile': 'prompts.json', 'promptSha256': digest(directory / 'prompts.json'), 'specSha256': digest(directory / 'spec.json'),
                  'history': history, 'runtime': {name: asset for name, asset in assets.items() if name in names},
                  'audioTracks': {slot: skills[slot]['audio'] for slot in SLOTS}}
    (directory / 'provenance.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')
    unique = {a['url']: a for a in assets.values()}
    print(json.dumps({'task': spec['task'], 'spiritId': identity, 'status': 'PASS', 'frames': len(frames),
                      'maxEdgeAlpha': max(f['maxEdgeAlpha'] for f in frames.values()), 'runtimeWebpBytes': sum(a['bytes'] for a in unique.values()),
                      'decodedRGBA': sum(a['width'] * a['height'] * 4 for a in unique.values())}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--unit', required=True, choices=['hai', 'lien', 'moc', 'bach', 'van'])
    build(parser.parse_args().unit)
