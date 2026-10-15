#!/usr/bin/env python3
"""Compose the Web 5.8 soundtrack as deterministic, loopable original music."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import wave
from dataclasses import dataclass
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/assets/music580"
DOCS = ROOT / "dev/docs/web-v580"
RATE = 44_100


@dataclass(frozen=True)
class Score:
    slug: str
    title: str
    bpm: int
    root: int
    mode: tuple[int, ...]
    progression: tuple[int, ...]
    seed: int
    color: str


PENTA_MAJOR = (0, 2, 4, 7, 9)
PENTA_MINOR = (0, 3, 5, 7, 10)
DORIAN = (0, 2, 3, 5, 7, 9, 10)

SCORES = (
    Score("mode-chest", "Lời Mời Khai Vị", 82, 60, PENTA_MAJOR, (0, 3, 1, 4), 101, "bell"),
    Score("mode-tcg", "Ván Bài Bên Bếp", 104, 57, DORIAN, (0, 2, 5, 3), 113, "pluck"),
    Score("mode-autochess", "Bày Mâm Xuất Trận", 112, 55, PENTA_MINOR, (0, 3, 4, 2), 127, "drum"),
    Score("mode-adventure", "Đường Qua Sương", 92, 62, PENTA_MAJOR, (0, 1, 3, 4), 139, "flute"),
    Score("map-lantern", "Phố Đèn Gọi Tên", 96, 60, PENTA_MAJOR, (0, 4, 1, 3), 151, "bell"),
    Score("map-harbor", "Than Hồng Sau Mưa", 100, 57, DORIAN, (0, 3, 5, 2), 163, "pluck"),
    Score("map-garden", "Lời Hứa Dưới Tán", 78, 65, PENTA_MAJOR, (0, 3, 1, 4), 179, "flute"),
    Score("map-tide", "Trăng Trên Lòng Chảo", 84, 62, PENTA_MINOR, (0, 4, 2, 3), 193, "water"),
    Score("map-tea", "Mây Qua Đỉnh Trà", 88, 67, PENTA_MAJOR, (0, 1, 4, 3), 211, "pluck"),
    Score("map-salt", "Nhịp Lò Muối Đỏ", 116, 52, PENTA_MINOR, (0, 3, 4, 1), 227, "drum"),
    Score("map-lotus", "Sen Nguyệt Thức Giấc", 80, 62, PENTA_MAJOR, (0, 4, 3, 1), 239, "water"),
    Score("map-aroma", "Vũ Khúc Vạn Hương", 108, 59, DORIAN, (0, 5, 3, 4), 251, "bell"),
    Score("boss", "Ngũ Vị Quyết Chiến", 126, 50, PENTA_MINOR, (0, 4, 3, 1), 269, "drum"),
)


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def envelope(length: int, attack: float, release: float) -> np.ndarray:
    result = np.ones(length, dtype=np.float32)
    a = min(length, max(1, int(attack * RATE)))
    r = min(length, max(1, int(release * RATE)))
    result[:a] *= np.linspace(0, 1, a, dtype=np.float32)
    result[-r:] *= np.linspace(1, 0, r, dtype=np.float32)
    return result


def add_tone(
    bus: np.ndarray,
    start: float,
    duration: float,
    midi: float,
    volume: float,
    pan: float,
    timbre: str,
) -> None:
    begin = max(0, int(start * RATE))
    length = min(int(duration * RATE), len(bus) - begin)
    if length <= 0:
        return
    t = np.arange(length, dtype=np.float32) / RATE
    frequency = hz(midi)
    phase = 2 * np.pi * frequency * t
    if timbre == "flute":
        vibrato = np.sin(2 * np.pi * 5.1 * t) * 0.012
        signal = np.sin(phase + vibrato) + 0.16 * np.sin(phase * 2)
        env = envelope(length, 0.09, min(0.32, duration * 0.45))
    elif timbre == "bell":
        signal = np.sin(phase) + 0.42 * np.sin(phase * 2.01) + 0.18 * np.sin(phase * 3.98)
        env = np.exp(-t * 3.4).astype(np.float32) * envelope(length, 0.006, 0.08)
    elif timbre == "bass":
        signal = np.sin(phase) + 0.2 * np.sin(phase * 2)
        env = envelope(length, 0.015, min(0.22, duration * 0.35))
    elif timbre == "pad":
        signal = np.sin(phase) + 0.28 * np.sin(phase * 1.003) + 0.14 * np.sin(phase * 2)
        env = envelope(length, 0.22, min(0.45, duration * 0.4))
    else:
        signal = np.sin(phase) + 0.32 * np.sin(phase * 2) + 0.1 * np.sin(phase * 3)
        env = np.exp(-t * 2.1).astype(np.float32) * envelope(length, 0.008, 0.1)
    signal = (signal * env * volume).astype(np.float32)
    left = np.sqrt((1 - pan) * 0.5)
    right = np.sqrt((1 + pan) * 0.5)
    bus[begin : begin + length, 0] += signal * left
    bus[begin : begin + length, 1] += signal * right


def add_drum(bus: np.ndarray, start: float, strength: float, rng: np.random.Generator, high: bool = False) -> None:
    begin = int(start * RATE)
    duration = 0.12 if high else 0.22
    length = min(int(duration * RATE), len(bus) - begin)
    if length <= 0:
        return
    t = np.arange(length, dtype=np.float32) / RATE
    noise = rng.standard_normal(length).astype(np.float32)
    if high:
        signal = noise * np.exp(-t * 34) * 0.045 * strength
    else:
        sweep = np.sin(2 * np.pi * (90 * t - 42 * t * t))
        signal = (sweep + noise * 0.08) * np.exp(-t * 17) * 0.12 * strength
    bus[begin : begin + length, 0] += signal
    bus[begin : begin + length, 1] += signal


def compose(score: Score) -> tuple[np.ndarray, float]:
    beat = 60 / score.bpm
    bars = 24
    seconds = bars * beat * 4
    bus = np.zeros((int(seconds * RATE), 2), dtype=np.float32)
    rng = np.random.default_rng(score.seed)
    melody = score.mode
    for bar in range(bars):
        degree = score.progression[bar % len(score.progression)] % len(melody)
        base = score.root + melody[degree]
        bar_start = bar * beat * 4
        # Wide sustained harmony keeps transitions between notes soft.
        for interval, pan in ((0, -0.34), (7, 0.34), (12, 0.04)):
            add_tone(bus, bar_start, beat * 4.08, base - 12 + interval, 0.043, pan, "pad")
        for pulse in (0, 2):
            add_tone(bus, bar_start + pulse * beat, beat * 1.7, base - 24, 0.12, -0.08, "bass")
        for step in range(8):
            at = bar_start + step * beat / 2
            note_index = (bar * 3 + step * (2 if score.color == "drum" else 1) + (step // 3)) % len(melody)
            octave = 12 if (bar + step) % 7 in (0, 3) else 0
            note = score.root + melody[note_index] + octave
            if score.color in ("water", "flute") and step % 2:
                continue
            timbre = "flute" if score.color in ("water", "flute") else "bell" if score.color == "bell" else "pluck"
            add_tone(bus, at, beat * (1.35 if timbre == "flute" else 0.92), note, 0.072, -0.5 + step / 7, timbre)
        for pulse in range(4):
            at = bar_start + pulse * beat
            add_drum(bus, at, 1.15 if score.color == "drum" else 0.62, rng)
            add_drum(bus, at + beat / 2, 0.8, rng, high=True)
            if score.color == "water":
                add_tone(bus, at + beat * 0.75, beat * 0.8, base + 19, 0.025, 0.6, "bell")
    # Gentle room echoes make the synth arrangement feel less dry.
    for delay, gain in ((0.135, 0.13), (0.27, 0.07)):
        offset = int(delay * RATE)
        bus[offset:] += bus[:-offset] * gain
    peak = float(np.max(np.abs(bus)))
    if peak:
        bus *= 0.88 / peak
    fade = int(0.025 * RATE)
    ramp = np.sin(np.linspace(0, np.pi / 2, fade, dtype=np.float32)) ** 2
    bus[:fade] *= ramp[:, None]
    bus[-fade:] *= ramp[::-1, None]
    return bus, seconds


def write_wave(path: Path, audio: np.ndarray) -> None:
    pcm = np.clip(audio * 32767, -32768, 32767).astype("<i2")
    with wave.open(str(path), "wb") as target:
        target.setnchannels(2)
        target.setsampwidth(2)
        target.setframerate(RATE)
        target.writeframes(pcm.tobytes())


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    DOCS.mkdir(parents=True, exist_ok=True)
    selected = set(sys.argv[1:])
    scores = [score for score in SCORES if not selected or score.slug in selected]
    if selected and len(scores) != len(selected):
        unknown = selected.difference(score.slug for score in scores)
        raise SystemExit(f"Unknown score: {', '.join(sorted(unknown))}")
    manifest = []
    with tempfile.TemporaryDirectory(prefix="music580-") as temporary:
        for score in scores:
            audio, seconds = compose(score)
            wav = Path(temporary) / f"{score.slug}.wav"
            output = OUT / f"{score.slug}.mp3"
            write_wave(wav, audio)
            subprocess.run(
                [
                    "ffmpeg", "-loglevel", "error", "-y", "-i", str(wav),
                    "-codec:a", "libmp3lame", "-b:a", "96k", "-ar", str(RATE), str(output),
                ],
                check=True,
            )
            manifest.append(
                {
                    "id": score.slug,
                    "title": score.title,
                    "path": f"/assets/music580/{score.slug}.mp3",
                    "bpm": score.bpm,
                    "seconds": round(seconds, 3),
                    "bytes": output.stat().st_size,
                }
            )
            print(f"{score.slug}: {output.stat().st_size:,} bytes")
    manifest_path = DOCS / "music-manifest.json"
    if selected and manifest_path.exists():
        previous = {
            item["id"]: item
            for item in json.loads(manifest_path.read_text(encoding="utf-8"))
        }
        previous.update({item["id"]: item for item in manifest})
        manifest = [previous[score.slug] for score in SCORES]
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
