"""Losslessly encode original006C pixels and measure texture metadata; no pixel edits."""
import hashlib
import json
from pathlib import Path

import PIL
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "dev/aw2/assets/environments/kitchen-table/interaction-v1"
URL = "/dev/aw2/assets/environments/kitchen-table/interaction-v1/"
ID = "aw2-environment-kitchen-table-interactions-v1"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


assets = {}
for name in ("note", "threshold"):
    source = DIR / f"{name}-source.png"
    target = DIR / f"{name}.webp"
    image = Image.open(source).convert("RGBA")
    image.save(target, "WEBP", lossless=True, method=6, exact=True)
    assert Image.open(target).convert("RGBA").tobytes() == image.tobytes()
    alpha = image.getchannel("A")
    assert alpha.getextrema()[0] == 0 and alpha.getextrema()[1] >= 250
    box = alpha.point(lambda p: 255 if p > 8 else 0).getbbox()
    assert box
    left, top = max(0, box[0] - 4), max(0, box[1] - 4)
    right, bottom = min(image.width, box[2] + 4), min(image.height, box[3] + 4)
    assets[name] = {
        "id": f"{ID}:{name}", "url": URL + target.name,
        "width": image.width, "height": image.height,
        "bytes": target.stat().st_size, "sha256": sha(target),
        "source": {"path": str(source.relative_to(ROOT)),
                   "bytes": source.stat().st_size, "sha256": sha(source)},
        "frame": {"x": left, "y": top, "width": right - left, "height": bottom - top},
    }

assert sum(a["bytes"] for a in assets.values()) <= 3_000_000
assert sum(a["width"] * a["height"] * 4 for a in assets.values()) <= 16_000_000
props = []
for entity, asset, width in (
    ("aw2-object-table-note", "note", 44),
    ("aw2-zone-kitchen-table:exit:west", "threshold", 36),
    ("aw2-shortcut-table-yard", "threshold", 36),
):
    f = assets[asset]["frame"]
    props.append({"entityId": entity, "visualId": f"{ID}:{entity}", "asset": asset,
                  "width": width, "height": round(width * f["height"] / f["width"], 4),
                  "anchorX": .5, "anchorY": .5, "depth": 1,
                  "labelOffsetY": 24})
provenance = {
    "tool": "OpenAI built-in image_gen", "model": "not exposed by tool", "date": "2026-10-23",
    "prompts": URL + "prompts.json", "externalReferences": [],
    "licenseStatus": "REVIEW_REQUIRED", "commercialRelease": "NOT_CLEARED",
    "processing": "Selected source PNGs unchanged; lossless exact RGBA WebP; alpha>8 bounds with4px padding; uniform logical scale. No painting/masking/mirroring/resizing.",
    "builder": "dev/tools/build-aw2-table-interactions.py", "pillow": PIL.__version__,
}
manifest = {
    "version": 1, "id": ID, "zoneId": "aw2-zone-kitchen-table",
    "status": "REFERENCE_INTERACTION_PROPS", "fullEnvironmentComplete": False,
    "assets": assets, "props": props,
    "states": {"noteLockedAlpha": .55, "shortcutLockedAlpha": .4, "availableAlpha": 1},
    "provenance": provenance,
}
(ROOT / "src/aw2/assets/kitchen-table.interactions-v1.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
record = {"task": "AW2-006C", "id": ID, "generator": provenance,
          "selection": json.loads((DIR / "selection.json").read_text()),
          "assets": assets, "limits": ["Flat props do not change collision or authorize actions.",
          "Same unchanged woven mat reused for two exits; labels own destination/lock status.",
          "Boss remains static HD reference; other5zones/debug visuals and independent gates stay open."]}
(DIR / "provenance.json").write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"status": "PASS", "assets": assets, "props": props}))
