"""AW2-006F: exact lossless encoding/measurement only; never paint source pixels."""
import hashlib
import json
from pathlib import Path

import PIL
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "dev/aw2/assets/environments/kitchen-hearth/v1"
URL = "/dev/aw2/assets/environments/kitchen-hearth/v1/"
ID = "aw2-environment-kitchen-hearth-v1"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


assets, frames = {}, {}
for name in ["floor", "puzzles"]:
    source, runtime = DIR / f"{name}-source.png", DIR / f"{name}.webp"
    image = Image.open(source).convert("RGBA")
    image.save(runtime, "WEBP", lossless=True, method=6, exact=True)
    assert Image.open(runtime).convert("RGBA").tobytes() == image.tobytes()
    alpha = image.getchannel("A")
    if name == "floor":
        assert alpha.getextrema() == (255, 255)
    else:
        assert alpha.getextrema() == (0, 255)
        for i, key in enumerate(["vent", "pot", "brazier"]):
            cell = (i * image.width // 3, 0, (i + 1) * image.width // 3, image.height)
            bounds = alpha.crop(cell).point(lambda p: 255 if p > 8 else 0).getbbox()
            assert bounds and min(bounds[0], bounds[1], cell[2]-cell[0]-bounds[2], image.height-bounds[3]) > 8
            left, top = cell[0] + bounds[0] - 4, bounds[1] - 4
            right, bottom = cell[0] + bounds[2] + 4, bounds[3] + 4
            frames[key] = {"x": left, "y": top, "width": right-left, "height": bottom-top}
    assets[name] = {
        "id": f"{ID}:{name}", "url": URL + runtime.name,
        "width": image.width, "height": image.height,
        "bytes": runtime.stat().st_size, "sha256": sha(runtime),
        "source": {"path": str(source.relative_to(ROOT)), "bytes": source.stat().st_size, "sha256": sha(source)},
    }
table = json.loads((ROOT / "src/aw2/assets/kitchen-table.environment-v1.json").read_text())
interaction = json.loads((ROOT / "src/aw2/assets/kitchen-table.interactions-v1.json").read_text())
assets["sideboard"] = table["assets"]["sideboard"]
assets["threshold"] = interaction["assets"]["threshold"]
props = []
for i, frame in enumerate(["vent", "pot", "brazier"]):
    f = frames[frame]
    scale = min(44 / f["width"], 34 / f["height"])
    props.append({"entityId": f"aw2-object-steam-{i}", "asset": "puzzles", "frame": frame,
                  "width": round(f["width"] * scale, 6), "height": round(f["height"] * scale, 6),
                  "anchorX": .5, "anchorY": .5, "depth": 1, "labelOffsetY": 24})
for direction in ["west", "east"]:
    f = assets["threshold"]["frame"]
    props.append({"entityId": f"aw2-zone-kitchen-hearth:exit:{direction}", "asset": "threshold", "frame": "threshold",
                  "width": 36, "height": round(36 * f["height"] / f["width"], 6),
                  "anchorX": .5, "anchorY": .5, "depth": 1, "labelOffsetY": 24})
compressed = sum(a["bytes"] for a in assets.values())
decoded = sum(a["width"] * a["height"] * 4 for a in assets.values())
assert compressed <= 5_000_000 and decoded <= 32_000_000
prompts = json.loads((DIR / "prompts.json").read_text())
provenance = {
    "tool": "OpenAI built-in image_gen", "model": "not exposed by tool", "date": "2026-10-24",
    "prompts": {"path": str((DIR / "prompts.json").relative_to(ROOT)), "sha256": sha(DIR / "prompts.json")},
    "reference": prompts["reference"], "externalReferences": [],
    "licenseStatus": "REVIEW_REQUIRED", "commercialRelease": "NOT_CLEARED",
    "builder": "dev/tools/build-aw2-hearth-room.py", "pillow": PIL.__version__,
    "processing": "Selected PNGs unchanged; exact RGBA lossless WebP; alpha>8 measured three cells with4px padding. Uniform per-prop render scale, no painting/masking/mirroring/resizing of pixels.",
    "reused": {"sideboard": {"task": "AW2-006B", "sourceRef": "425aa16d94ea51decf7f43afb5986b13ad126dfc"},
               "threshold": {"task": "AW2-006C", "sourceRef": "b350a11d777c1e8c94b5f2aadc6299b68f7e7722"}},
}
manifest = {
    "version": 1, "id": ID, "zoneId": "aw2-zone-kitchen-hearth",
    "status": "REFERENCE_ENVIRONMENT", "fullEnvironmentComplete": False,
    "canvas": {"width": 640, "height": 384}, "assets": assets, "frames": frames,
    "prop": table["prop"], "props": props,
    "states": {"readyAlpha": 1, "doneAlpha": .8, "waitingAlpha": .65, "unavailableAlpha": .45},
    "budget": {"compressedBytes": compressed, "decodedRgbaBytes": decoded, "maxCompressedBytes": 5_000_000, "maxDecodedRgbaBytes": 32_000_000},
    "provenance": provenance,
}
write(ROOT / "src/aw2/assets/kitchen-hearth.environment-v1.json", manifest)
write(DIR / "provenance.json", {"task": "AW2-006F", "generator": provenance,
      "selection": json.loads((DIR / "selection.json").read_text()), "builtInCalls": 2, "rejected": [],
      "assets": assets, "frames": frames, "limits": ["Static neutral props; progress/solved text comes from actual rules, no animated fire.",
      "Existing own sideboard/threshold reused unchanged with original provenance.", "Independent route/player/device/rights/full-environment acceptance OPEN."]})
print(json.dumps({"status": "PASS", "frames": frames, "budget": manifest["budget"]}))
