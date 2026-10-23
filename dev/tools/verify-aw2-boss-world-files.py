"""Audit decoded pixels, actual frames/anchors and repeat-build hashes for006D."""
import hashlib
import json
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
path = ROOT / "src/aw2/assets/forgotten-host.world-v1.json"
data = json.loads(path.read_text())
source, runtime = ROOT / data["asset"]["source"]["path"], ROOT / data["asset"]["url"][1:]
image, encoded = Image.open(source).convert("RGBA"), Image.open(runtime).convert("RGBA")
assert image.tobytes() == encoded.tobytes()
alpha = image.getchannel("A")
frames = []
for key, f in data["frames"].items():
    l, t, r, b = f["x"], f["y"], f["x"] + f["width"], f["y"] + f["height"]
    assert 0 <= l < r <= image.width and 0 <= t < b <= image.height
    assert 0 < f["anchorX"] < f["width"] and 0 < f["anchorY"] < f["height"]
    edges = [(l,t,r,t+1),(l,b-1,r,b),(l,t,l+1,b),(r-1,t,r,b)]
    edge_alpha = max(max(alpha.crop(e).getdata()) for e in edges)
    assert edge_alpha <= 8
    frames.append({"id": key, "frameEdgeAlpha": edge_alpha, "foot": [l + f["anchorX"], t + f["anchorY"]]})
files = [path, source, runtime, ROOT / "dev/aw2/assets/forgotten-host/world-v1/provenance.json"]
hashes = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
assert hashes[data["asset"]["source"]["path"]] == data["asset"]["source"]["sha256"]
assert hashes[data["asset"]["url"][1:]] == data["asset"]["sha256"]
for p in [data["provenance"]["reference"], data["provenance"]["prompts"]]:
    assert hashlib.sha256((ROOT/p["path"]).read_bytes()).hexdigest() == p["sha256"]
subprocess.run(["python3", "dev/tools/build-aw2-boss-world.py"], cwd=ROOT, check=True, capture_output=True)
assert all(hashlib.sha256((ROOT/p).read_bytes()).hexdigest() == h for p,h in hashes.items())
result = {"task": "AW2-006D", "status": "PASS", "exactRgba": True,
          "dimensions": image.size, "alpha": alpha.getextrema(), "frames": frames,
          "runtimeBytes": runtime.stat().st_size, "decodedRgbaBytes": image.width * image.height * 4,
          "repeatHashes": hashes}
(ROOT / ".asset-work/aw2-006d/files.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result))
