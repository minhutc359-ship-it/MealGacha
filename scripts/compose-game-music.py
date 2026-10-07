"""Original MealGacha scores. Requires Python/numpy and ffmpeg; no samples."""
from pathlib import Path
import argparse
import json
import subprocess
import tempfile
import wave
import numpy as np

RATE = 22050
OUT = Path(__file__).resolve().parents[1] / "public/assets/tcg/audio"


def frequency(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def voice(midi, duration, kind):
    t = np.arange(int(duration * RATE)) / RATE
    f = frequency(midi)
    attack = np.minimum(1, t / (0.035 if kind == "flute" else 0.009))
    release = np.minimum(1, (duration - t) / 0.08)
    if kind == "pluck":
        y = sum(np.sin(2 * np.pi * f * h * t + .02 * h) * np.exp(-t * (2.8 + h * .8)) / h ** 1.35 for h in range(1, 7))
    elif kind == "flute":
        phase = 2 * np.pi * f * t + .012 * f * np.sin(2 * np.pi * 5 * t) / 5
        y = (np.sin(phase) + .17 * np.sin(2 * phase) + .045 * np.sin(3 * phase)) * (.65 + .35 * np.exp(-t * 2))
    elif kind == "pad":
        y = (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 1.002 * t) + .12 * np.sin(4 * np.pi * f * t)) * np.minimum(1, t / .45)
    else:
        y = (np.sin(2 * np.pi * f * t) + .18 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 2.5)
    return y * attack * release


def compose(name, bpm, roots, motif, mood):
    beat = 60 / bpm
    bars = len(roots)
    length = bars * 4 * beat
    mix = np.zeros((round(length * RATE), 2), dtype=np.float64)
    rng = np.random.default_rng(714)

    def add(y, when, volume, pan=0):
        start = round(when * RATE)
        indices = (start + np.arange(len(y))) % len(mix)
        # Wrap note/reverb tails into the beginning for a continuous loop.
        gains = np.sqrt([(1 - pan) / 2, (1 + pan) / 2])
        for ch in range(2):
            np.add.at(mix[:, ch], indices, y * volume * gains[ch])

    def note(midi, when, duration, kind, volume, pan=0):
        sound = voice(midi, duration, kind)
        add(sound, when, volume, pan)
        if kind in ["flute", "pluck"]:
            for delay, gain in [(.19, .15), (.37, .09), (.59, .045)]:
                add(sound, when + delay, volume * gain, -pan)

    for bar, root in enumerate(roots):
        start = bar * 4 * beat
        third = 3 if root % 12 in [2, 9] or (root % 12 == 7 and mood != "warm") else 4
        for pitch, pan in [(root + 12, -.45), (root + 19, .45), (root + 12 + third, 0)]:
            note(pitch, start, 4.5 * beat, "pad", .043 if mood in ["warm", "mystery"] else .024, pan)
        for step in range(8):
            pitch = root + 12 + [0, 7, 12, 7, third, 7, 14, 7][step]
            note(pitch, start + step * beat / 2, 1.3, "pluck", .105 if mood != "boss" else .083, -.3 if step % 2 else .3)
        # Original eight-note phrases with space for dialogue / battle sounds.
        for step, pitch in enumerate(motif[bar % len(motif)]):
            if pitch is not None:
                note(pitch, start + step * beat / 2, beat * (.85 if step % 2 else 1.25), "flute", .09 if mood != "boss" else .055, .12)
        for step in [0, 2]:
            note(root - 12, start + step * beat, .65 * beat, "bass", .17 if mood in ["battle", "boss"] else .085)
        if mood in ["battle", "boss"]:
            for step in range(4):
                t = np.arange(int(.22 * RATE)) / RATE
                drum = np.sin(2 * np.pi * (58 * t + 23 * (1 - np.exp(-t * 20)) / 20)) * np.exp(-t * 20)
                add(drum, start + step * beat, .19 if mood == "boss" else .14)
            for step in range(8):
                t = np.arange(int(.065 * RATE)) / RATE
                noise = rng.normal(0, 1, len(t))
                brush = np.concatenate([[0], np.diff(noise)]) * np.exp(-t * 85)
                add(brush, start + step * beat / 2, .022, -.5 if step % 2 else .5)
            for step in [1, 3]:
                t = np.arange(int(.16 * RATE)) / RATE
                rim = (.7 * np.sin(2 * np.pi * 180 * t) + .18 * rng.normal(0, 1, len(t))) * np.exp(-t * 32)
                add(rim, start + step * beat, .11, -.1)
    peak = float(np.max(np.abs(mix)))
    mix *= .73 / max(peak, .01)
    # Mild soft saturation; reserve headroom for combat SFX at runtime.
    mix = np.tanh(mix * 1.1) / 1.1
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as folder:
        wav = Path(folder) / "score.wav"
        with wave.open(str(wav), "wb") as file:
            file.setnchannels(2)
            file.setsampwidth(2)
            file.setframerate(RATE)
            file.writeframes((mix * 32767).astype('<i2').tobytes())
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "64k", "-ar", str(RATE), "-write_xing", "1", "-metadata", f"title=MealGacha - {name}", str(OUT / f"{name}.mp3")], check=True)
    return {"name": name, "bpm": bpm, "duration": round(length, 3), "bytes": (OUT / f"{name}.mp3").stat().st_size, "sampleRate": RATE, "peak": round(float(np.max(np.abs(mix))), 4), "rms": round(float(np.sqrt(np.mean(mix ** 2))), 4)}


SCORES = [
    ("battle", 108, [50, 53, 55, 57, 50, 53, 55, 50] * 2,
     [[74, None, 77, 79, 81, None, 79, 77], [72, 74, 77, None, 79, 77, 74, None], [79, None, 81, 84, 81, 79, 77, None], [77, 74, 72, None, 74, None, None, None]], "battle"),
    ("boss", 126, [50, 50, 53, 55, 50, 57, 55, 50] * 2,
     [[74, 77, 79, None, 81, 79, 77, 74], [74, None, 72, 74, 77, None, 79, None], [81, 84, 81, 79, 77, None, 74, None], [77, 74, 72, 69, 74, None, None, None]], "boss"),
    ("story-warm", 72, [48, 53, 55, 48, 57, 53, 55, 48],
     [[72, None, 74, 76, 79, None, 76, None], [74, None, 72, None, 69, 72, None, None], [76, 79, 81, None, 79, 76, 74, None], [72, None, 69, None, 72, None, None, None]], "warm"),
    ("story-mystery", 60, [50, 53, 55, 50, 58, 55, 57, 50],
     [[74, None, None, 77, 79, None, 77, None], [72, None, 69, None, 72, None, None, None], [77, None, 81, None, 79, 77, 74, None], [72, None, 69, None, 74, None, None, None]], "mystery"),
]

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", choices=[score[0] for score in SCORES])
    args = parser.parse_args()
    results = [compose(*score) for score in SCORES if not args.only or score[0] == args.only]
    print(json.dumps(results, indent=2))
