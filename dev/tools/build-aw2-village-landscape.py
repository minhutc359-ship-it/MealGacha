"""006I: preserve selected art; lossless encode, measure and declare scenic layout."""
import hashlib
import json
from pathlib import Path
import PIL
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "dev/aw2/assets/environments/covenant-village/v2"
ID = "aw2-environment-covenant-village-v2"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


assets, frames = {}, {}
for name, key in [("landscape", "floor"), ("foreground", "foreground")]:
    source, runtime = DIR / f"{name}-source.png", DIR / f"{name}.webp"
    image = Image.open(source).convert("RGBA")
    image.save(runtime, "WEBP", lossless=True, exact=True, method=6)
    assert Image.open(runtime).convert("RGBA").tobytes() == image.tobytes()
    alpha = image.getchannel("A")
    assert alpha.getextrema() == ((255, 255) if name == "landscape" else (0, 255))
    if name == "foreground":
        for i, frame in enumerate(["bamboo", "blossom", "willow"]):
            cell = (i * image.width // 3, 0, (i + 1) * image.width // 3, image.height)
            bounds = alpha.crop(cell).point(lambda a: 255 if a > 8 else 0).getbbox()
            assert bounds and min(bounds[0], bounds[1], cell[2] - cell[0] - bounds[2], image.height - bounds[3]) > 8
            frames[frame] = {"x": cell[0] + bounds[0] - 4, "y": bounds[1] - 4,
                             "width": bounds[2] - bounds[0] + 8, "height": bounds[3] - bounds[1] + 8}
    assets[key] = {"id": f"{ID}:{key}", "url": "/" + str(runtime.relative_to(ROOT)), "width": image.width, "height": image.height,
                   "bytes": runtime.stat().st_size, "sha256": sha(runtime),
                   "source": {"path": str(source.relative_to(ROOT)), "bytes": source.stat().st_size, "sha256": sha(source)}}
old = json.loads((ROOT / "src/aw2/assets/covenant-village.environment-v1.json").read_text())
assets["props"], assets["threshold"] = old["assets"]["props"], old["assets"]["threshold"]
budget = {"compressedBytes": sum(a["bytes"] for a in assets.values()),
          "decodedRgbaBytes": sum(a["width"] * a["height"] * 4 for a in assets.values()),
          "maxCompressedBytes": 6_000_000, "maxDecodedRgbaBytes": 32_000_000}
assert budget["compressedBytes"] <= budget["maxCompressedBytes"] and budget["decodedRgbaBytes"] <= budget["maxDecodedRgbaBytes"]
prompts = json.loads((DIR / "prompts.json").read_text())
for ref in prompts["references"]:
    assert sha(ROOT / ref["path"]) == ref["sha256"]
provenance = {"tool": "OpenAI built-in image_gen", "model": "not exposed by tool", "date": "2026-10-24",
              "prompts": {"path": str((DIR / "prompts.json").relative_to(ROOT)), "sha256": sha(DIR / "prompts.json")},
              "reference": prompts["references"][0], "references": prompts["references"],
              "referenceAttribution": "Project-owner supplied original Web5.8 village/world artwork, pinned to master f9d3925; adapted for AW2 by explicit owner request.",
              "externalReferences": [], "licenseStatus": "REVIEW_REQUIRED", "commercialRelease": "NOT_CLEARED",
              "builder": "dev/tools/build-aw2-village-landscape.py", "pillow": PIL.__version__,
              "processing": "Selected PNG bytes unchanged; exact RGBA lossless WebP; alpha>8 inset frame measurement with4px padding, logical uniform sprite scaling only. No painting/masking/warping/mirroring/cropping source pixels.",
              "reused": {"props": {"task": "AW2-006G", "sourceRef": "42f36d7c55921e6d2df474640cdfc212151bc4c0"},
                         "threshold": old["provenance"]["reused"]["threshold"]}}
foliage = []
for key, x, y, width, parallax in [("bamboo", -80, 44, 240, .04), ("blossom", 678, 88, 220, .06), ("willow", 72, 460, 230, .08)]:
    f = frames[key]
    foliage.append({"id": f"{ID}:{key}", "frame": key, "x": x, "y": y, "width": width,
                    "height": round(width * f["height"] / f["width"], 6), "anchorX": .5, "anchorY": .5,
                    "depth": 10000, "parallax": parallax, "occludedAlpha": .28})
scene = {"version": 2, "id": ID, "zoneId": old["zoneId"], "status": "REFERENCE_ENVIRONMENT",
         "fullEnvironmentComplete": False, "npcMotionComplete": False, "canvas": old["canvas"],
         "landscape": {"x": -448, "y": -320, "width": 1536, "height": 1024},
         "camera": {"followZoom": .8, "overviewZoom": .42, "centerX": 320, "centerY": 192},
         "assets": assets, "frames": old["frames"], "foregroundFrames": frames, "foliage": foliage,
         "props": old["props"], "obstacle": old["obstacle"], "budget": budget, "provenance": provenance}
write(ROOT / "src/aw2/assets/covenant-village.environment-v2.json", scene)
write(DIR / "provenance.json", {"task": "AW2-006I", "generator": provenance,
      "selection": json.loads((DIR / "selection.json").read_text()), "assets": assets, "foregroundFrames": frames,
      "calibration": {"logicalWalkDomain": [16, 16, 624, 368], "walkDomainInSourceImage": [464, 336, 1072, 688],
                      "basis": "Selected clear central plaza; architecture/water remain in wider scenic apron. Original collider/points unchanged."},
      "limits": ["Scenic architecture is background, not added interactions/rooms or a new collision contract.",
                 "Independent acceptance remains deferredD20; rights/device/full-environment criteria OPEN."]})
print(json.dumps({"status": "PASS", "frames": frames, "budget": budget}))
