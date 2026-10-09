"""Five original auto-chess themes in acoustic/synth and four-channel chip styles.
No third-party melodies, recordings or samples. Requires numpy and ffmpeg.
"""
from pathlib import Path
import importlib.util
import json
import argparse
import numpy as np

def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.OUT = Path(__file__).resolve().parents[2] / "public/assets/autochess/audio"
    return module

THEMES = [
    ("prepare", 94, [50,55,57,50,53,55,57,50]*2, [[74,77,81,None,79,77,74,None],[72,74,77,79,81,None,77,74],[77,79,81,84,81,79,77,None],[74,None,72,69,72,74,None,None]], "warm"),
    ("battle", 124, [50,55,57,53,50,48,55,57,50,53,55,48,57,55,53,50]*2, [[74,None,77,79,81,79,77,None],[77,79,None,81,84,81,79,77],[81,79,77,None,74,77,79,72],[72,74,77,79,None,77,74,None],[74,77,79,81,84,None,81,79],[79,77,74,None,72,74,77,None],[81,None,79,77,74,72,69,72],[77,74,None,72,74,None,None,None]], "battle"),
    ("boss", 140, [45,50,48,52,45,53,52,48,50,45,53,55,52,48,50,45]*2, [[69,72,76,None,79,76,72,71],[74,77,81,79,77,74,None,72],[72,None,76,79,83,79,76,74],[76,79,83,81,79,None,76,71],[81,79,76,74,72,74,76,None],[77,81,84,81,79,77,74,72],[76,79,83,None,81,79,76,72],[74,72,69,67,69,None,None,None]], "boss"),
    ("story", 82, [53,48,50,57,53,55,57,50]*2, [[77,None,81,79,None,77,74,None],[76,79,None,77,74,None,72,None],[74,77,79,None,77,74,72,None],[81,None,79,77,74,None,None,None]], "mystery"),
    ("pressure", 154, [45,46,50,52,45,53,52,48]*2, [[81,76,72,69,79,76,None,72],[82,77,74,70,81,77,74,None],[86,81,77,74,84,None,81,77],[88,83,79,76,86,83,None,79],[81,79,76,None,72,74,76,79],[82,81,77,74,None,77,81,82],[86,84,81,77,74,None,77,81],[83,79,76,72,69,None,72,None]], "boss"),
]
if __name__ == "__main__":
    acoustic = load("auto_acoustic", "compose-game-music.py")
    chip = load("auto_chip", "compose-retro-music.py")
    parser = argparse.ArgumentParser()
    parser.add_argument("--combat-only", action="store_true")
    args = parser.parse_args()
    old_voice = acoustic.voice
    def soft_voice(midi, duration, kind):
        if kind != "flute": return old_voice(midi, duration, kind)
        t = np.arange(int(duration * acoustic.RATE)) / acoustic.RATE
        phase = 2 * np.pi * acoustic.frequency(midi) * t + .008 * acoustic.frequency(midi) * np.sin(2 * np.pi * 5 * t) / 5
        envelope = np.minimum(1, t / .045) * np.minimum(1, (duration - t) / .09)
        return (np.sin(phase) + .12 * np.sin(2 * phase) + .035 * np.sin(3 * phase)) * envelope * (.65 + .35 * np.exp(-t * 2))
    acoustic.voice = soft_voice
    results = []
    for theme in THEMES:
        if args.combat_only and theme[0] not in ["battle", "boss", "pressure"]: continue
        results += [dict(style="original", **acoustic.compose(*theme)),dict(style="8bit", **chip.compose(*theme))]
    print(json.dumps(results,indent=2))
