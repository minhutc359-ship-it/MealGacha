"""Read-only verification of actual asset bytes, alpha cells, hashes and WAVs."""
from pathlib import Path
import hashlib
import json
import math
import struct
import wave
import sys
from PIL import Image

root = Path(__file__).resolve().parents[2]
manifest = json.loads((root / (sys.argv[1] if len(sys.argv) > 1 else "src/aw2/assets/than.base-v1.json")).read_text())
checks = []
images = {}
for name, asset in manifest["assets"].items():
    path = root / asset["url"].removeprefix("/")
    assert path.exists(), path
    assert hashlib.sha256(path.read_bytes()).hexdigest() == asset["sha256"], name
    assert hashlib.sha256((root / asset["source"]["path"]).read_bytes()).hexdigest() == asset["source"]["sha256"], name
    image = Image.open(path)
    assert image.mode == "RGBA" and image.size == (asset["width"], asset["height"]), name
    alpha = image.getchannel("A")
    assert alpha.histogram()[0] > image.width * image.height * 0.1, name
    images[name] = image
    checks.append(f"{name}: bytes/hash/dimensions/real alpha")

for name, frame in manifest["frames"].items():
    image = images[frame["asset"]]
    x, y, w, h = (frame[key] for key in ["x", "y", "width", "height"])
    assert x >= 0 and y >= 0 and x + w <= image.width and y + h <= image.height, name
    cell = image.getchannel("A").crop((x, y, x+w, y+h))
    bounds = cell.point(lambda value: 255 if value >= 96 else 0).getbbox()
    assert list(bounds) == frame["visibleBounds"], name
    assert min(bounds[0], bounds[1], w-bounds[2], h-bounds[3]) >= 2, name
    edge = max(cell.crop(box).getextrema()[1] for box in [(0,0,w,1),(0,h-1,w,h),(0,0,1,h),(w-1,0,w,h)])
    assert edge == frame["maxEdgeAlpha"] and edge <= manifest["provenance"]["alphaEdgeTolerance"], name
for state, clip in manifest["battle"].items():
    if "reducedMotionFrame" not in clip:
        continue
    cels = []
    for key in clip["frames"]:
        # Attack may return to an authored idle cel after its final contact.
        # Count the four new cels belonging to this state, not recovery aliases.
        if not key["frame"].startswith(f"battle.{state}."):
            continue
        frame = manifest["frames"][key["frame"]]
        x,y,w,h = (frame[k] for k in ["x","y","width","height"])
        cels.append(hashlib.sha256(images[frame["asset"]].crop((x,y,x+w,y+h)).tobytes()).hexdigest())
    assert len(cels) == len(set(cels)) == 4, state
checks.append(f"{len(manifest['frames'])} actual atlas cells: safe bounds, visible pixels inset, alpha edge <= {manifest['provenance']['alphaEdgeTolerance']}/255")

for slot, skill in manifest["skills"].items():
    asset = skill["audio"]
    path = root / asset["url"].removeprefix("/")
    assert hashlib.sha256(path.read_bytes()).hexdigest() == asset["sha256"], slot
    with wave.open(str(path)) as wav:
        assert wav.getnchannels() == 1 and wav.getsampwidth() == 2 and wav.getframerate() == 22050
        data = wav.readframes(wav.getnframes())
        assert abs(wav.getnframes() / wav.getframerate() * 1000 - asset["durationMs"]) < 1
    samples = struct.unpack("<" + "h" * (len(data)//2), data)
    rms = math.sqrt(sum(value*value for value in samples) / len(samples))
    assert 100 < rms < 20000 and max(abs(value) for value in samples) < 30000
    assert abs(samples[0]) < 10 and abs(samples[-1]) < 10
    checks.append(f"{slot}: WAV hash/PCM/duration/non-silent/no clipping/faded edges")
assert manifest["fullCharacterComplete"] is False
assert manifest["provenance"]["licenseStatus"] == "REVIEW_REQUIRED"
print(json.dumps({"task": ({"aw2-lam": "AW2-004E", "aw2-lua": "AW2-004D", "aw2-moc-non": "AW2-004F", "aw2-suong": "AW2-004G", "aw2-muoi": "AW2-004J"}.get(manifest["spiritId"], "AW2-004C")) if "reducedMotionFrame" in manifest["battle"]["idle"] else "AW2-004A" if manifest["spiritId"] == "aw2-than" else "AW2-004B", "spiritId": manifest["spiritId"],"status":"PASS","checks":checks,"webpBytes":sum(a["bytes"] for a in {a["url"]:a for a in manifest["assets"].values()}.values())}))
