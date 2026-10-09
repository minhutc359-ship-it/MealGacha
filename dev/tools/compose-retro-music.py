"""Original 8-bit arrangements of MealGacha themes; no borrowed samples/melodies.

Four channels: band-limited pulse lead, pulse arpeggio, triangle bass, seeded
noise percussion. Run with Python/numpy + ffmpeg. Leaves the original score intact.
"""
from pathlib import Path
import json
import importlib.util
import subprocess
import tempfile
import wave
import numpy as np

RATE = 22050
OUT = Path(__file__).resolve().parents[2] / "public/assets/tcg/audio"
spec = importlib.util.spec_from_file_location("score", Path(__file__).with_name("compose-game-music.py"))
score = importlib.util.module_from_spec(spec)
spec.loader.exec_module(score)


def chip(midi, seconds, kind, duty=.25):
    t = np.arange(round(seconds * RATE)) / RATE
    f = 440 * 2 ** ((midi - 69) / 12)
    # Additive synthesis avoids the aliasing of a raw discontinuous square wave.
    harmonics = range(1, min(35, int(RATE / 2 / f)))
    if kind == "triangle":
        signal = sum((-1) ** ((n - 1) // 2) * np.sin(2 * np.pi * f * n * t) / n ** 2 for n in harmonics if n % 2)
    else:
        signal = sum(np.sin(np.pi * n * duty) * np.cos(2 * np.pi * f * n * t - np.pi * n * duty) / n for n in harmonics)
    envelope = np.minimum(1, t / .005) * np.minimum(1, (seconds - t) / .024)
    return signal * envelope * (.72 + .28 * np.exp(-t * 8))


def compose(name, bpm, roots, motif, mood):
    beat = 60 / (bpm + (8 if mood in ["boss", "battle"] else 4))
    length = len(roots) * 4 * beat
    mix = np.zeros((round(length * RATE), 2))
    rng = np.random.default_rng(280714)

    def add(sound, when, gain, pan=0):
        indices = (round(when * RATE) + np.arange(len(sound))) % len(mix)
        for ch, level in enumerate(np.sqrt([(1-pan)/2, (1+pan)/2])):
            np.add.at(mix[:, ch], indices, sound * gain * level)

    for bar, root in enumerate(roots):
        start = bar * 4 * beat
        third = 3 if root % 12 in [2, 9] or (root % 12 == 7 and mood != "warm") else 4
        for step, pitch in enumerate(motif[bar % len(motif)]):
            if pitch is not None:
                add(chip(pitch, beat * (.43 if step % 2 else .68), "pulse", .25), start + step * beat/2, .15, .15)
        # A light arpeggio answers the lead, instead of playing full pad chords.
        for step in range(16):
            pitch = root + 12 + [0, third, 7, 12][step % 4]
            add(chip(pitch, beat * .19, "pulse", .125), start + step * beat/4, .045 if mood in ["warm", "mystery"] else .06, -.3)
        for step in range(4):
            pitch = root - 12 + (7 if step == 3 else 0)
            add(chip(pitch, beat * .7, "triangle"), start + step * beat, .24)
        if mood in ["battle", "boss"]:
            for step in range(8):
                t = np.arange(round(RATE * .055)) / RATE
                noise = rng.choice([-1., 1.], len(t)) * np.exp(-t * 85)
                add(noise, start + step * beat/2, .016, .25)
            for step in [1, 3]:
                t = np.arange(round(RATE * .11)) / RATE
                noise = rng.choice([-1., 1.], len(t)) * np.exp(-t * 35)
                add(noise, start + step * beat, .042, -.15)
            for step in [0, 2]:
                t = np.arange(round(RATE * .14)) / RATE
                kick = np.sin(2*np.pi*(55*t + 45*(1-np.exp(-t*35))/35)) * np.exp(-t*30)
                add(kick, start + step * beat, .22)
    mix *= .66 / max(float(np.max(np.abs(mix))), .01)
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f"8bit-{name}.mp3"
    with tempfile.TemporaryDirectory() as folder:
        wav = Path(folder) / "retro.wav"
        with wave.open(str(wav), "wb") as file:
            file.setnchannels(2)
            file.setsampwidth(2)
            file.setframerate(RATE)
            file.writeframes((mix * 32767).astype('<i2').tobytes())
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "64k", "-ar", str(RATE), "-write_xing", "1", "-metadata", f"title=MealGacha 8-bit - {name}", str(target)], check=True)
    return {"name": name, "seconds": round(length, 3), "bpm": round(60/beat), "bytes": target.stat().st_size, "rms": round(float(np.sqrt(np.mean(mix**2))), 4)}


if __name__ == "__main__":
    print(json.dumps([compose(*theme) for theme in score.SCORES], indent=2))
