"""Six original regional cues in two arrangements; deterministic, sample-free synthesis."""
from pathlib import Path
import importlib.util, json

def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
original = module('original', 'compose-game-music.py')
retro = module('retro', 'compose-retro-music.py')
folder = Path(__file__).resolve().parents[2] / 'public/assets/v4/audio'
original.OUT = retro.OUT = folder
motif = [[72, None, 76, 79, 74, None, 72, None], [69, 72, None, 74, 76, None, 74, None], [79, 76, 74, None, 72, 69, None, None], [72, None, 74, 76, 72, None, None, None]]
results = []
for region, roots, transposition in [('market', [48, 53, 55, 48] * 2, 0), ('harbor', [50, 57, 55, 50] * 2, 2), ('kitchen', [53, 48, 55, 48] * 2, 5)]:
    notes = [[None if n is None else n + transposition for n in bar] for bar in motif]
    for intensity, bpm, mood in [('warm', 88, 'warm'), ('tension', 112, 'battle')]:
        name = f'{region}-{intensity}'
        results += [{**original.compose(name, bpm, roots, notes, mood), 'style': 'original'}, {**retro.compose(name, bpm, roots, notes, mood), 'style': '8bit'}]
Path(__file__).resolve().parents[1].joinpath('docs/major-v400/audio-v4.json').write_text(json.dumps(results, indent=2) + '\n')
print(json.dumps({'files': len(results), 'bytes': sum(x['bytes'] for x in results)}))
