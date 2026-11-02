"""Verify original pixels, real atlas gutters and deterministic006F build."""
import hashlib
import json
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "src/aw2/assets/kitchen-hearth.environment-v1.json"
data = json.loads(MANIFEST.read_text())
paths = [MANIFEST, ROOT / "dev/aw2/assets/environments/kitchen-hearth/v1/provenance.json"]
observed = {}
for key, asset in data["assets"].items():
    source, runtime = ROOT / asset["source"]["path"], ROOT / asset["url"][1:]
    a, b = Image.open(source).convert("RGBA"), Image.open(runtime).convert("RGBA")
    assert a.tobytes() == b.tobytes(), key
    assert hashlib.sha256(source.read_bytes()).hexdigest() == asset["source"]["sha256"]
    assert hashlib.sha256(runtime.read_bytes()).hexdigest() == asset["sha256"]
    assert runtime.stat().st_size == asset["bytes"]
    observed[key] = {"alpha": a.getchannel("A").getextrema(), "bytes": asset["bytes"]}
    if key in ["floor", "puzzles"]:
        paths.extend([source, runtime])
    if key == "puzzles":
        alpha = a.getchannel("A")
        for f in data["frames"].values():
            l, t, r, bottom = f["x"], f["y"], f["x"]+f["width"], f["y"]+f["height"]
            assert 0 <= l < r <= a.width and 0 <= t < bottom <= a.height
            edges = [(l,t,r,t+1),(l,bottom-1,r,bottom),(l,t,l+1,bottom),(r-1,t,r,bottom)]
            assert max(max(alpha.crop(e).getdata()) for e in edges) <= 8
for key in ["reference", "prompts"]:
    entry = data["provenance"][key]
    assert hashlib.sha256((ROOT / entry["path"]).read_bytes()).hexdigest() == entry["sha256"]
before = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
subprocess.run(["python3", "dev/tools/build-aw2-hearth-room.py"], cwd=ROOT, check=True, capture_output=True)
assert all(hashlib.sha256((ROOT/p).read_bytes()).hexdigest() == h for p,h in before.items())
result = {"task": "AW2-006F", "status": "PASS", "exactRgba": True, "repeatHashes": before,
          "assets": observed, "budget": data["budget"], "frameEdgeAlphaAtMost": 8}
out = ROOT / ".asset-work/aw2-006f/files.json"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(result,indent=2)+"\n")
print(json.dumps(result))
