"""006G: encode selected original art exactly; measure frames, never paint pixels."""
import hashlib
import json
from pathlib import Path

import PIL
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "dev/aw2/assets/environments/covenant-village/v1"
ID = "aw2-environment-covenant-village-v1"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


assets, frames = {}, {}
for name in ["floor", "props"]:
    source, runtime = DIR / f"{name}-source.png", DIR / f"{name}.webp"
    image = Image.open(source).convert("RGBA")
    image.save(runtime, "WEBP", lossless=True, method=6, exact=True)
    assert Image.open(runtime).convert("RGBA").tobytes() == image.tobytes()
    alpha = image.getchannel("A")
    assert alpha.getextrema() == ((255, 255) if name == "floor" else (0, 255))
    if name == "props":
        for index, key in enumerate(["keeper", "table", "well"]):
            cell = (index * image.width // 3, 0, (index + 1) * image.width // 3, image.height)
            bounds = alpha.crop(cell).point(lambda a: 255 if a > 8 else 0).getbbox()
            assert bounds and min(bounds[0], bounds[1], cell[2] - cell[0] - bounds[2], image.height - bounds[3]) > 8
            frames[key] = {"x": cell[0] + bounds[0] - 4, "y": bounds[1] - 4,
                           "width": bounds[2] - bounds[0] + 8, "height": bounds[3] - bounds[1] + 8}
    assets[name] = {"id": f"{ID}:{name}", "url": "/" + str(runtime.relative_to(ROOT)),
                    "width": image.width, "height": image.height, "bytes": runtime.stat().st_size, "sha256": sha(runtime),
                    "source": {"path": str(source.relative_to(ROOT)), "bytes": source.stat().st_size, "sha256": sha(source)}}
interactions = json.loads((ROOT / "src/aw2/assets/kitchen-table.interactions-v1.json").read_text())
assets["threshold"] = interactions["assets"]["threshold"]


def sized(frame, max_width, max_height):
    scale = min(max_width / frame["width"], max_height / frame["height"])
    return {"width": round(frame["width"] * scale, 6), "height": round(frame["height"] * scale, 6)}


props = [
    {"entityId": "aw2-npc-giu-cho", "asset": "props", "frame": "keeper", **sized(frames["keeper"], 36, 48),
     "anchorX": .5, "anchorY": 1, "depth": 240, "labelOffsetX": -18, "labelOffsetY": -10, "labelTransform": "translate(-100%, -100%)"},
    {"entityId": "aw2-object-village-table", "asset": "props", "frame": "table", **sized(frames["table"], 56, 36),
     "anchorX": .5, "anchorY": .5, "depth": 1, "labelOffsetX": 0, "labelOffsetY": -72, "labelTransform": "translate(-50%, 0)"},
    {"entityId": "aw2-zone-covenant-village:exit:east", "asset": "threshold", "frame": "threshold",
     **sized(assets["threshold"]["frame"], 36, 28), "anchorX": .5, "anchorY": .5, "depth": 1, "labelOffsetX": 0, "labelOffsetY": 24, "labelTransform": "translate(-50%, 0)"},
]
prompts = json.loads((DIR / "prompts.json").read_text())
provenance = {"tool": "OpenAI built-in image_gen", "model": "not exposed by tool", "date": "2026-10-24",
              "prompts": {"path": str((DIR / "prompts.json").relative_to(ROOT)), "sha256": sha(DIR / "prompts.json")},
              "reference": prompts["reference"], "externalReferences": [],
              "licenseStatus": "REVIEW_REQUIRED", "commercialRelease": "NOT_CLEARED",
              "builder": "dev/tools/build-aw2-village.py", "pillow": PIL.__version__,
              "processing": "Selected PNG bytes unchanged; exact RGBA lossless WebP; alpha>8 measured cells with4px padding; uniform logical render scales, no painting/masking/mirroring/resizing pixels.",
              "reused": {"threshold": {"task": "AW2-006C", "sourceRef": "b350a11d777c1e8c94b5f2aadc6299b68f7e7722"}}}
budget = {"compressedBytes": sum(a["bytes"] for a in assets.values()),
          "decodedRgbaBytes": sum(a["width"] * a["height"] * 4 for a in assets.values()),
          "maxCompressedBytes": 5_000_000, "maxDecodedRgbaBytes": 32_000_000}
assert budget["compressedBytes"] <= budget["maxCompressedBytes"] and budget["decodedRgbaBytes"] <= budget["maxDecodedRgbaBytes"]
scene = {"version": 1, "id": ID, "zoneId": "aw2-zone-covenant-village", "status": "REFERENCE_ENVIRONMENT",
         "fullEnvironmentComplete": False, "npcMotionComplete": False, "canvas": {"width": 640, "height": 384},
         "assets": assets, "frames": frames, "props": props,
         "obstacle": {"frame": "well", "x": 320, "y": 352, **sized(frames["well"], 76, 76),
                      "anchorX": .5, "anchorY": 1, "sortY": 328, "occludedAlpha": .45,
                      "footprint": {"x": 288, "y": 304, "width": 64, "height": 48}},
         "budget": budget, "provenance": provenance}
write(ROOT / "src/aw2/assets/covenant-village.environment-v1.json", scene)
write(DIR / "provenance.json", {"task": "AW2-006G", "generator": provenance, "selection": json.loads((DIR / "selection.json").read_text()),
                               "assets": assets, "frames": frames, "limits": ["Static NPC idle, no NPC walk/motion or new interaction/collision.",
                               "Owner deferred independent acceptance; human/device/rights/full environment remain NOT_RUN."]})
print(json.dumps({"status": "PASS", "frames": frames, "budget": budget}))
