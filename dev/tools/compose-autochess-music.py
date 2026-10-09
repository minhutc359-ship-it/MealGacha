"""Five original auto-chess themes in acoustic/synth and four-channel chip styles.
No third-party melodies, recordings or samples. Requires numpy and ffmpeg.
"""
from pathlib import Path
import importlib.util
import json

def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.OUT = Path(__file__).resolve().parents[2] / "public/assets/autochess/audio"
    return module

THEMES = [
    ("prepare", 94, [50,55,57,50,53,55,57,50]*2, [[74,77,81,None,79,77,74,None],[72,74,77,79,81,None,77,74],[77,79,81,84,81,79,77,None],[74,None,72,69,72,74,None,None]], "warm"),
    ("battle", 128, [50,57,55,53,50,55,57,50]*2, [[74,74,77,81,79,77,74,72],[81,79,77,74,77,79,81,84],[79,77,74,72,74,77,79,None],[77,74,72,69,72,74,77,74]], "battle"),
    ("boss", 142, [45,50,48,52,45,53,52,45]*2, [[69,72,76,72,71,69,67,64],[74,77,81,77,76,74,72,69],[72,76,79,76,74,72,71,67],[76,79,83,79,81,79,76,71]], "boss"),
    ("story", 82, [53,48,50,57,53,55,57,50]*2, [[77,None,81,79,None,77,74,None],[76,79,None,77,74,None,72,None],[74,77,79,None,77,74,72,None],[81,None,79,77,74,None,None,None]], "mystery"),
    ("pressure", 156, [45,46,50,52,45,53,52,45]*2, [[81,76,72,69,81,79,76,72],[82,77,74,70,82,81,77,74],[86,81,77,74,86,84,81,77],[88,83,79,76,88,86,83,79]], "boss"),
]
if __name__ == "__main__":
    acoustic = load("auto_acoustic", "compose-game-music.py")
    chip = load("auto_chip", "compose-retro-music.py")
    results = []
    for theme in THEMES:
        results += [dict(style="original", **acoustic.compose(*theme)),dict(style="8bit", **chip.compose(*theme))]
    print(json.dumps(results,indent=2))
