"""006D: losslessly encode selected pixels and measure four idle frames; no pixel edits."""
import hashlib
import json
from pathlib import Path

import PIL
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "dev/aw2/assets/forgotten-host/world-v1"
source, runtime = DIR / "world-source.png", DIR / "world.webp"
image = Image.open(source).convert("RGBA")
image.save(runtime, "WEBP", lossless=True, exact=True, method=6)
assert image.tobytes() == Image.open(runtime).convert("RGBA").tobytes()
assert image.size == (1254, 1254)
alpha = image.getchannel("A")
assert alpha.getextrema() == (0, 255)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


frames, directions, heights = {}, {}, []
# Feet centers measured from the selected original; coordinates are not synthesized pixels.
for direction, col, row, foot_x, foot_y in (
    ("down", 0, 0, 329, 583), ("left", 1, 0, 912, 585),
    ("right", 0, 1, 340, 1166), ("up", 1, 1, 950, 1166),
):
    cell_x, cell_y = col * 627, row * 627
    tile = alpha.crop((cell_x, cell_y, cell_x + 627, cell_y + 627))
    box = tile.point(lambda p: 255 if p > 8 else 0).getbbox()
    assert box and min(box[0], box[1], 627 - box[2], 627 - box[3]) >= 20
    left, top = cell_x + box[0] - 4, cell_y + box[1] - 4
    right, bottom = cell_x + box[2] + 4, cell_y + box[3] + 4
    key = f"world.{direction}.idle"
    frames[key] = {"asset": "world", "x": left, "y": top,
                   "width": right - left, "height": bottom - top,
                   "anchorX": foot_x - left, "anchorY": foot_y - top}
    assert 0 < foot_x - left < right - left and 0 < foot_y - top < bottom - top
    directions[direction] = key
    heights.append(box[3] - box[1])

assert runtime.stat().st_size <= 3_000_000 and image.width * image.height * 4 <= 20_000_000
reference = ROOT / "dev/aw2/assets/forgotten-host/reference-v1/portrait.webp"
prompts = DIR / "prompts.json"
asset = {"id": "aw2-enemy-forgotten-host:world:world-v1",
         "url": "/dev/aw2/assets/forgotten-host/world-v1/world.webp",
         "width": image.width, "height": image.height,
         "bytes": runtime.stat().st_size, "sha256": sha(runtime),
         "source": {"path": str(source.relative_to(ROOT)), "bytes": source.stat().st_size,
                    "sha256": sha(source)}}
provenance = {"tool": "OpenAI built-in image_gen", "model": "not exposed by tool",
              "date": "2026-10-23", "builtInCalls": 1, "rejected": [],
              "selectedGeneratedFile": "/home/sotatek/.codex/generated_images/01a16283-7855-7dc1-b115-9664e1dc7e24/exec-c271fe2c-b3c3-45c1-a745-f4a6b3bbd1bb.png",
              "reference": {"path": str(reference.relative_to(ROOT)), "sha256": sha(reference),
                            "role": "Own original identity reference only"},
              "prompts": {"path": str(prompts.relative_to(ROOT)), "sha256": sha(prompts)},
              "externalReferences": [], "licenseStatus": "REVIEW_REQUIRED",
              "commercialRelease": "NOT_CLEARED", "pillow": PIL.__version__,
              "builder": "dev/tools/build-aw2-boss-world.py",
              "processing": "Selected PNG unchanged; exact RGBA lossless WebP; alpha>8 bounds with4px padding and measured foot anchors; one common uniform render scale. No painting/masking/mirroring/resizing."}
manifest = {"version": 1, "entityId": "aw2-enemy-forgotten-host",
            "displayName": "Người Giữ Bàn Quên", "artVariantId": "world-v1",
            "status": "FOUR_DIRECTION_IDLE_REFERENCE", "fullEnemyComplete": False,
            "worldMotionComplete": False, "idlePoseCount": 4, "animationFrames": 0,
            "asset": asset, "frames": frames, "directions": directions,
            "display": {"maxSilhouetteHeight": 52, "scale": 52 / max(heights),
                        "footOffsetY": 6, "depthOffset": 10},
            "states": {"defaultAlpha": 1, "defeatedBeforeEndingAlpha": .6},
            "provenance": provenance}
(ROOT / "src/aw2/assets/forgotten-host.world-v1.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
(DIR / "provenance.json").write_text(json.dumps({"task": "AW2-006D", "generator": provenance,
        "asset": asset, "frames": frames, "limits": ["Four static directional idle poses, no walk/attack animation.",
        "Independent identity/continuity/art/device/rights acceptance OPEN; not a completed enemy."]}, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"status": "PASS", "asset": asset, "frames": frames, "scale": manifest["display"]["scale"]}))
